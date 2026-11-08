"""Check KB source freshness and explicitly record a task's knowledge review."""

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import re
import subprocess
import sys

from task_state import (atomic_text, load_active_task, owned_path,
                        serialized_operation, source_hash, validate_id)


ROOT = Path(__file__).resolve().parents[1]


def json_pairs(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON field: {key}")
        result[key] = value
    return result


def section_match(text: str, heading: str):
    pattern = rf"^## {re.escape(heading)}\n\n*```json\n(.*?)\n```"
    matches = list(re.finditer(pattern, text, re.MULTILINE | re.DOTALL))
    if len(matches) != 1:
        raise ValueError(f"exactly one JSON section is required: {heading}")
    return matches[0]


def read_json_section(text: str, heading: str) -> dict:
    data = json.loads(section_match(text, heading)[1], object_pairs_hook=json_pairs)
    if not isinstance(data, dict):
        raise ValueError(f"{heading} must contain a JSON object")
    return data


def replace_json_section(text: str, heading: str, data: dict) -> str:
    match = section_match(text, heading)
    return text[:match.start(1)] + json.dumps(data, indent=2, ensure_ascii=False) + text[match.end(1):]


def meaningful(text) -> bool:
    return (isinstance(text, str) and len(text.strip()) >= 8
            and re.search(r"\b(?:TODO|TBD|REPLACE|pending)\b", text, re.IGNORECASE) is None)


def entries(root: Path) -> list[str]:
    return sorted(path.relative_to(root).as_posix()
                  for path in (root / "docs/kb").rglob("*.md")
                  if path.name not in {"README.md", "AGENTS.md"})


def provenance(root: Path, name: str) -> dict:
    if name not in entries(root):
        raise ValueError(f"not a KB entry: {name}")
    data = read_json_section(owned_path(root, name).read_text(), "Provenance")
    if (type(data.get("version")) is not int or data["version"] != 1
            or not isinstance(data.get("sources"), dict) or not data["sources"]):
        raise ValueError(f"{name}: provenance requires version 1 and nonempty sources")
    for source in data["sources"]:
        if not isinstance(source, str) or source == name:
            raise ValueError(f"{name}: invalid/self-referential source")
        owned_path(root, source)
    return data


def known_task(root: Path, task_id: str) -> bool:
    matches = 0
    for path in (root / "docs/notes").rglob("*.md"):
        if re.search(rf"^Task-ID: {re.escape(task_id)}$", path.read_text(), re.MULTILINE):
            matches += 1
    return matches == 1


def check_knowledge(root: Path) -> list[str]:
    errors = []
    names = entries(root)
    if not names:
        return ["knowledge base needs at least one provenance-backed entry"]
    for name in names:
        try:
            data = provenance(root, name)
            if data.get("status") != "verified":
                raise ValueError("knowledge is not reviewed")
            validate_id(data.get("task_id", ""))
            if not known_task(root, data["task_id"]):
                raise ValueError("review Task-ID needs exactly one traceable note")
            reviewed = datetime.fromisoformat(data.get("verified_at", ""))
            if reviewed.tzinfo is None:
                raise ValueError("verified_at must include a timezone")
            if not meaningful(data.get("reason")) or not meaningful(data.get("evidence")):
                raise ValueError("review reason/evidence is missing or unfinished")
            for source, expected in data["sources"].items():
                if expected != source_hash(root, source):
                    raise ValueError(f"stale source: {source}; review facts, not just the date")
        except (OSError, ValueError, TypeError, AttributeError) as error:
            errors.append(f"{name}: {error}")
    return errors


def validate_refresh(root: Path, text: str, changed: list[str] | None = None,
                     historical: bool = False) -> list[str]:
    try:
        data = read_json_section(text, "Knowledge refresh")
        if data.get("status") != "reviewed" or not isinstance(data.get("entries"), list):
            raise ValueError("knowledge impact review is incomplete")
        reviewed = {}
        for item in data["entries"]:
            if (not isinstance(item, dict) or item.get("action") not in {"updated", "unchanged"}
                    or not meaningful(item.get("reason"))):
                raise ValueError("knowledge entries need action and specific reason")
            name = item.get("path")
            if (not isinstance(name, str) or not name.startswith("docs/kb/")
                    or not name.endswith(".md") or ".." in Path(name).parts or name in reviewed
                    or (not historical and name not in entries(root))):
                raise ValueError(f"invalid/duplicate knowledge entry: {name}")
            if not isinstance(item.get("sha256"), str) or not re.fullmatch("[0-9a-f]{64}", item["sha256"]):
                raise ValueError(f"invalid knowledge fingerprint: {name}")
            if not historical and item["sha256"] != source_hash(root, name):
                raise ValueError(f"knowledge declaration is stale: {name}")
            reviewed[name] = item
        if not reviewed and not meaningful(data.get("none_reason")):
            raise ValueError("no knowledge impact requires a specific reason")
        if changed is not None:
            affected = set(changed)
            for name in entries(root):
                sources = provenance(root, name)["sources"]
                if (name in affected or affected.intersection(sources)) and name not in reviewed:
                    raise ValueError(f"affected knowledge is not acknowledged: {name}")
        return [] if historical else check_knowledge(root)
    except (OSError, ValueError, TypeError) as error:
        return [str(error)]


@serialized_operation
def review_entry(root: Path, entry: str, task_id: str, reason: str,
                 evidence: str, action: str = "updated") -> None:
    state = load_active_task(root, task_id)
    if not meaningful(reason) or not meaningful(evidence) or action not in {"updated", "unchanged"}:
        raise ValueError("review needs a concrete reason, evidence and updated/unchanged action")
    note = owned_path(root, state.note_path)
    note_text = note.read_text()
    if not re.search(rf"^Task-ID: {re.escape(task_id)}$", note_text, re.MULTILINE):
        raise ValueError("active note Task-ID does not match")
    refresh = read_json_section(note_text, "Knowledge refresh")
    if not isinstance(refresh.get("entries"), list):
        raise ValueError("invalid knowledge declarations in active note")
    path = owned_path(root, entry)
    before = path.read_text()
    data = provenance(root, entry)
    data.update(status="verified", task_id=task_id,
                verified_at=datetime.now(timezone.utc).isoformat(), reason=reason, evidence=evidence)
    data["sources"] = {source: source_hash(root, source) for source in data["sources"]}
    after = replace_json_section(before, "Provenance", data)
    atomic_text(path, after)
    try:
        record = {"path": entry, "action": action, "reason": reason, "sha256": source_hash(root, entry)}
        refresh["entries"] = [item for item in refresh["entries"] if item.get("path") != entry] + [record]
        refresh.update(status="reviewed", none_reason=None)
        atomic_text(note, replace_json_section(note_text, "Knowledge refresh", refresh))
    except (OSError, ValueError, TypeError, AttributeError):
        atomic_text(path, before)
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("check")
    review = commands.add_parser("review")
    review.add_argument("entry")
    for field in ("task", "reason", "evidence"):
        review.add_argument(f"--{field}", required=True)
    review.add_argument("--action", choices=("updated", "unchanged"), default="updated")
    args = parser.parse_args()
    try:
        if args.command == "review":
            review_entry(ROOT, args.entry, args.task, args.reason, args.evidence, args.action)
        else:
            errors = check_knowledge(ROOT)
            if errors:
                raise ValueError("\n".join(errors))
    except (OSError, ValueError, TypeError, subprocess.CalledProcessError) as error:
        print(f"knowledge FAILED: {error}", file=sys.stderr)
        return 1
    print(f"knowledge {args.command} OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())

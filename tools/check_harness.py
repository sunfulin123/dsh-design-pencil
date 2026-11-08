#!/usr/bin/env python3
"""Validate development notes and optionally lint changed JavaScript/TypeScript."""

import argparse
from datetime import datetime
from pathlib import Path
import os
import re
import subprocess
import sys

from knowledge import check_knowledge, read_json_section, validate_refresh
from task_state import owned_path, source_hash, validate_id


ROOT = Path(__file__).resolve().parents[1]
TYPES = {"feature", "fix-bug", "architecture", "refactor", "perf", "docs", "tooling", "test"}
STATUSES = {"in-progress", "complete", "blocked"}
NOTE_DIR_STATUSES = {
    "proposed": {"in-progress", "blocked"},
    "implemented": {"complete"},
    "archived": STATUSES,
}
NOTE_SUPPORT_FILES = {
    "docs/notes/AGENTS.md", "docs/notes/README.md", "docs/notes/proposed/_template.md",
}
SECTIONS = ("Context", "Changes", "Validation", "Risks and follow-up")
JS_SUFFIXES = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"}


def validate_note(text: str, path: str | None = None) -> list[str]:
    errors = []
    metadata = {}
    for label, allowed in (("Type", TYPES), ("Status", STATUSES)):
        matches = re.findall(rf"^{label}: ([^\n]+)$", text, re.MULTILINE)
        if len(matches) != 1 or matches[0].strip() not in allowed:
            errors.append(f"{label} must be one of {', '.join(sorted(allowed))}")
        else:
            metadata[label] = matches[0].strip()
    if path is not None:
        parts = Path(path).parts
        if (len(parts) != 4 or parts[:2] != ("docs", "notes")
                or parts[2] not in NOTE_DIR_STATUSES):
            errors.append("notes must live in docs/notes/{proposed,implemented,archived}/<task-slug>.md")
        elif "Status" in metadata and metadata["Status"] not in NOTE_DIR_STATUSES[parts[2]]:
            allowed = ", ".join(sorted(NOTE_DIR_STATUSES[parts[2]]))
            errors.append(f"{parts[2]} notes require Status: {allowed}")
    sections = {}
    for heading in SECTIONS:
        match = re.search(rf"^## {re.escape(heading)}\n(.*?)(?=^## |\Z)",
                          text, re.MULTILINE | re.DOTALL)
        content = match[1].strip() if match else ""
        if not content or re.search(r"\b(?:TODO|TBD|REPLACE)\b", content):
            errors.append(f"missing or unfinished section: {heading}")
        sections[heading] = content
    validation = sections["Validation"]
    if (validation and "`" not in validation
            and re.search(r"Not run:\s*\S.+", validation) is None):
        errors.append("Validation needs exact commands/results or 'Not run:' with a reason")
    versions = re.findall(r"^Record-Version: (.+)$", text, re.MULTILINE)
    if versions:
        if versions != ["2"]:
            errors.append("Record-Version must be exactly 2")
        else:
            errors.extend(validate_record(text, metadata.get("Status")))
    return errors


def validate_record(text: str, status: str | None) -> list[str]:
    errors = []
    try:
        fields = {}
        for field in ("Task-ID", "Base-Ref"):
            values = re.findall(rf"^{field}: (.+)$", text, re.MULTILINE)
            if len(values) != 1:
                raise ValueError(f"v2 record requires exactly one {field}")
            fields[field] = values[0]
        validate_id(fields["Task-ID"])
        if not re.fullmatch(r"(?:[0-9a-f]{40}|[0-9a-f]{64})", fields["Base-Ref"]):
            raise ValueError("Base-Ref must be a full Git commit hash")
        refresh = read_json_section(text, "Knowledge refresh")
        if refresh.get("status") not in {"pending", "reviewed"}:
            raise ValueError("invalid knowledge review status")
        if status == "complete":
            errors.extend(validate_refresh(ROOT, text, historical=True))
            for field in ("Started-At", "Completed-At"):
                values = re.findall(rf"^{field}: (.+)$", text, re.MULTILINE)
                if len(values) != 1 or datetime.fromisoformat(values[0]).tzinfo is None:
                    raise ValueError(f"complete v2 record needs timezone-aware {field}")
            receipt = read_json_section(text, "Changed files")
            if not isinstance(receipt.get("files"), list):
                raise ValueError("Changed files must contain a files array")
            names = set()
            for item in receipt["files"]:
                if not isinstance(item, dict) or not isinstance(item.get("path"), str):
                    raise ValueError("invalid changed-file record")
                name = item["path"]
                if (not Path(name).parts or Path(name).is_absolute()
                        or ".." in Path(name).parts or name in names):
                    raise ValueError(f"invalid/duplicate changed-file path: {name}")
                names.add(name)
                hashes = [item.get("before"), item.get("after")]
                if hashes == [None, None] or any(value is not None and (
                        not isinstance(value, str) or not re.fullmatch("[0-9a-f]{64}", value)
                ) for value in hashes):
                    raise ValueError(f"invalid changed-file fingerprints: {name}")
    except (ValueError, TypeError, AttributeError) as error:
        errors.append(str(error))
    return errors


def changed_files(root: Path, ref: str) -> list[str]:
    subprocess.run(["git", "rev-parse", "--verify", f"{ref}^{{commit}}"],
                   cwd=root, check=True, capture_output=True)
    changed = subprocess.run(
        ["git", "diff", "--no-renames", "--name-only", "-z", ref, "--"],
        cwd=root, check=True, capture_output=True,
    )
    untracked = subprocess.run(
        ["git", "ls-files", "--others", "--exclude-standard", "-z"],
        cwd=root, check=True, capture_output=True,
    )
    return sorted({path.decode() for path in (changed.stdout + untracked.stdout).split(b"\0") if path})


def note_paths(paths: list[str]) -> list[str]:
    return [name for name in paths if name.startswith("docs/notes/")
            and name.endswith(".md") and name not in NOTE_SUPPORT_FILES]


def closed_task_ids(root: Path, base: str) -> set[str]:
    paths = subprocess.check_output(
        ["git", "ls-tree", "-r", "--name-only", "-z", base, "--", "docs/notes"], cwd=root,
    ).decode().split("\0")
    result = set()
    for name in note_paths(paths):
        text = subprocess.check_output(["git", "show", f"{base}:{name}"], cwd=root, text=True)
        if (re.search(r"^Record-Version: 2$", text, re.MULTILINE)
                and (name.startswith("docs/notes/archived/")
                     or re.search(r"^Status: complete$", text, re.MULTILINE))):
            result.update(re.findall(r"^Task-ID: (.+)$", text, re.MULTILINE))
    return result


def check_task_notes(root: Path, changed: list[str], base: str | None = None) -> list[str]:
    if not changed:
        return []
    notes = [name for name in note_paths(changed) if (root / name).is_file()
             and not name.startswith("docs/notes/archived/")]
    if not notes:
        return ["task changes require a new/updated docs/notes/{proposed,implemented}/*.md record "
                "(not support files or archived history)"]
    errors = [f"{name}: {error}" for name in notes
              for error in validate_note((root / name).read_text(), name)]
    if errors:
        return errors
    closed = closed_task_ids(root, base) if base is not None else set()
    current = []
    identities = set()
    for name in notes:
        text = (root / name).read_text()
        if (not re.search(r"^Record-Version: 2$", text, re.MULTILINE)
                or not re.search(r"^Status: complete$", text, re.MULTILINE)):
            continue
        task_id = re.findall(r"^Task-ID: (.+)$", text, re.MULTILINE)[0]
        if task_id in closed:
            continue
        if task_id in identities:
            errors.append(f"duplicate current Task-ID: {task_id}")
        identities.add(task_id)
        current.append(text)
    if not current:
        errors.append("current changes require a completed generated v2 task note; "
                      "legacy and previously closed notes are historical evidence only")
    latest = {}
    for text in current:
        completed = datetime.fromisoformat(re.findall(r"^Completed-At: (.+)$", text, re.MULTILINE)[0])
        fingerprints = [(item["path"], item["after"])
                        for item in read_json_section(text, "Changed files")["files"]]
        fingerprints += [(item["path"], item["sha256"])
                         for item in read_json_section(text, "Knowledge refresh")["entries"]]
        for name, digest in fingerprints:
            try:
                owned_path(root, name)
            except ValueError as error:
                errors.append(str(error))
                continue
            if name not in latest or latest[name][0] < completed:
                latest[name] = (completed, digest)
            elif latest[name][0] == completed and latest[name][1] != digest:
                errors.append(f"conflicting current fingerprints: {name}")
    for name, (_, digest) in latest.items():
        try:
            path = owned_path(root, name)
            actual = source_hash(root, name) if path.is_file() else None
            if actual != digest:
                errors.append(f"current task fingerprint is stale: {name}")
        except (OSError, ValueError) as error:
            errors.append(str(error))
    return errors


def lint_changed_js(root: Path, changed: list[str]) -> None:
    # Share the source-owner exclusions; tests still get JS lint, only line-cap exempts them.
    from check_code_line_cap import EXCLUDED_DIRS, EXCLUDED_PREFIXES

    generated = EXCLUDED_DIRS - {"tests", "test", "__tests__", "fixtures", "__fixtures__"}
    files = [
        name for name in changed
        if Path(name).suffix in JS_SUFFIXES and (root / name).is_file()
        and not generated.intersection(Path(name).parts)
        and not name.startswith((*EXCLUDED_PREFIXES, "vendor/"))
    ]
    if not files:
        print("changed JS lint: no JS/TS source changes")
        return
    executable = root / "packages/node_modules/.bin/oxlint"
    if not executable.is_file():
        raise ValueError("oxlint missing; run `cd packages && bun install --frozen-lockfile`")
    subprocess.run([str(executable), "--config", "packages/.oxlintrc.json", *files],
                   cwd=root, check=True)


def main() -> int:
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("--base", help="compare committed, staged, unstaged and untracked task changes")
    args.add_argument("--lint-js", action="store_true")
    args.add_argument("--task", help="validate the specific local worktree Task-ID")
    options = args.parse_args()
    try:
        if options.base and not options.task and os.environ.get("CI", "").lower() not in {"true", "1"}:
            raise ValueError("local task verification requires --task <Task-ID>; "
                             "run task_notes.py start before development")
        notes_dir = ROOT / "docs/notes"
        notes = note_paths([path.relative_to(ROOT).as_posix() for path in notes_dir.rglob("*.md")])
        errors = [f"{name}: {error}" for name in notes
                  for error in validate_note((ROOT / name).read_text(), name)]
        if not notes:
            errors.append("docs/notes needs at least one development record")
        if options.base:
            changed = changed_files(ROOT, options.base)
            if not options.task:
                errors.extend(check_task_notes(ROOT, changed, base=options.base))
        elif options.lint_js:
            errors.append("--lint-js requires --base")
        errors.extend(check_knowledge(ROOT))
        if options.task:
            from task_notes import check_task
            errors.extend(check_task(ROOT, options.task))
        if errors:
            raise ValueError("\n".join(errors))
        if options.lint_js:
            lint_changed_js(ROOT, changed)
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"harness lint FAILED: {error}", file=sys.stderr)
        return 1
    print(f"harness lint OK: {len(notes)} development notes"
          + (", changed-task note checked" if options.base else
             "; use --base <ref> to enforce a note for this task"))
    return 0


if __name__ == "__main__":
    sys.exit(main())

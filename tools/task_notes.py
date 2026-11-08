"""Create, check, finish or archive a traceable task in the current Git worktree."""

import argparse
from dataclasses import replace
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
from uuid import uuid4

from check_harness import TYPES, validate_note
from knowledge import read_json_section, validate_refresh
from task_state import (TaskState, atomic_text, load_active_task, owned_path,
                        read_task, serialized_operation, snapshot, source_hash, state_dir, write_task)


ROOT = Path(__file__).resolve().parents[1]


@serialized_operation
def start_task(root: Path, slug: str, kind: str, summary: str) -> TaskState:
    if not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", slug) or len(slug) > 80:
        raise ValueError("slug must be lowercase kebab-case, at most 80 characters")
    if kind not in TYPES or len(summary.strip()) < 8 or "\n" in summary:
        raise ValueError("task needs a supported Type and a concrete one-line summary")
    directory = state_dir(root)
    directory.mkdir(parents=True, exist_ok=True)
    active = directory / "active"
    task_id = str(uuid4())
    try:
        with active.open("x") as stream:
            stream.write(task_id)
    except FileExistsError as error:
        raise ValueError("this worktree already has an active task; resume it or use a worktree") from error
    note = root / f"docs/notes/proposed/{slug}-{task_id[:8]}.md"
    created = False
    try:
        initial = snapshot(root)
        base = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
        started = datetime.now(timezone.utc).isoformat()
        text = owned_path(root, "docs/notes/proposed/_template.md").read_text()
        values = {"title": summary, "task_id": task_id, "type": kind, "base_ref": base,
                  "started_at": started, "summary": summary}
        tokens = set(re.findall(r"\{\{([a-z_]+)\}\}", text))
        if tokens != set(values):
            raise ValueError("notes template has missing or unsupported placeholders")
        for key, value in values.items():
            text = text.replace("{{" + key + "}}", value)
        note.parent.mkdir(parents=True, exist_ok=True)
        with note.open("x") as stream:
            created = True
            stream.write(text)
        state = TaskState(task_id, base, note.relative_to(root).as_posix(), started, initial,
                          hashlib.sha256(text.encode()).hexdigest(), "active")
        write_task(root, state)
    except (OSError, ValueError, subprocess.CalledProcessError):
        if created:
            note.unlink(missing_ok=True)
        active.unlink()
        raise
    return state


def task_changes(root: Path, state: TaskState) -> list[str]:
    current = snapshot(root)
    record_paths = {state.note_path, state.note_path.replace("/proposed/", "/implemented/"),
                    state.note_path.replace("/implemented/", "/proposed/")}
    return sorted(name for name in set(current) | set(state.initial_files)
                  if name not in record_paths and current.get(name) != state.initial_files.get(name))


def change_receipt(root: Path, state: TaskState) -> dict:
    current = snapshot(root)
    return {"files": [{"path": name, "before": state.initial_files.get(name),
                       "after": current.get(name)} for name in task_changes(root, state)]}


def check_task(root: Path, task_id: str) -> list[str]:
    try:
        state = read_task(root, task_id)
        if state.phase == "archived":
            raise ValueError("archived tasks are historical evidence; start a new task")
        if state.phase == "active":
            load_active_task(root, task_id)
        elif (state_dir(root) / "active").exists():
            raise ValueError("use the current active Task-ID, not a previous completed task")
        text = owned_path(root, state.note_path).read_text()
        errors = validate_note(text, state.note_path)
        status = "in-progress" if state.phase == "active" else "complete"
        for field, value in (("Record-Version", "2"), ("Task-ID", task_id),
                             ("Base-Ref", state.base_ref), ("Status", status)):
            if re.findall(rf"^{field}: (.+)$", text, re.MULTILINE) != [value]:
                errors.append(f"active note requires {field}: {value}")
        if (source_hash(root, state.note_path) == state.initial_note_hash
                or "Implementation has not started." in text or "Not run: task initialization;" in text):
            errors.append("replace task initialization with actual changes and verification")
        errors.extend(validate_refresh(root, text, task_changes(root, state)))
        if errors:
            return errors
        if state.phase == "complete":
            if source_hash(root, state.note_path) != state.final_note_hash:
                errors.append("completed note changed; do not reuse it as current-task evidence")
            receipt = read_json_section(text, "Changed files")
            recorded = {item["path"]: item["after"] for item in receipt["files"]}
            current = snapshot(root)
            if (set(recorded) != set(task_changes(root, state))
                    or any(current.get(name) != digest for name, digest in recorded.items())):
                errors.append("worktree changed after task completion; start a new task")
        return errors
    except (OSError, ValueError, TypeError, subprocess.CalledProcessError) as error:
        return [str(error)]


@serialized_operation
def finish_task(root: Path, task_id: str) -> TaskState:
    state = load_active_task(root, task_id)
    errors = check_task(root, task_id)
    if errors:
        raise ValueError("\n".join(errors))
    note = owned_path(root, state.note_path)
    before = note.read_text()
    destination = state.note_path.replace("/proposed/", "/implemented/")
    if destination == state.note_path:
        raise ValueError("only a proposed record can finish")
    changes = change_receipt(root, state)
    text = before.replace("Status: in-progress", "Status: complete", 1)
    if "Started-At:" not in text:
        text = text.replace(f"Base-Ref: {state.base_ref}",
                            f"Base-Ref: {state.base_ref}\nStarted-At: {state.started_at}", 1)
    text += "\n## Changed files\n\n```json\n{}\n```\n".format(
        json.dumps(changes, indent=2, ensure_ascii=False))
    text += f"\nCompleted-At: {datetime.now(timezone.utc).isoformat()}\n"
    errors = validate_note(text, destination)
    if errors:
        raise ValueError("\n".join(errors))
    return store_final_task(root, state, before, text, destination, "complete")


def store_final_task(root: Path, state: TaskState, before: str, text: str,
                     destination: str, phase: str) -> TaskState:
    note = owned_path(root, state.note_path)
    target = owned_path(root, destination)
    if target.exists():
        raise ValueError(f"final note already exists: {destination}")
    completed = replace(state, note_path=destination, phase=phase,
                        final_note_hash=hashlib.sha256(text.encode()).hexdigest())
    target.parent.mkdir(parents=True, exist_ok=True)
    created = False
    try:
        with target.open("x") as stream:
            created = True
            stream.write(text)
        write_task(root, completed)
        note.unlink()
        (state_dir(root) / "active").unlink()
    except OSError:
        if created:
            atomic_text(note, before)
            write_task(root, state)
            target.unlink()
        raise
    return completed


@serialized_operation
def archive_task(root: Path, task_id: str, reason: str) -> TaskState:
    state = load_active_task(root, task_id)
    if len(reason.strip()) < 8 or re.search(r"\b(?:TODO|TBD|REPLACE)\b", reason):
        raise ValueError("archiving requires a concrete reason")
    before = owned_path(root, state.note_path).read_text()
    if re.findall(r"^Status: (.+)$", before, re.MULTILINE) not in [["in-progress"], ["blocked"]]:
        raise ValueError("only unfinished or blocked tasks can be archived")
    if re.findall(r"^Task-ID: (.+)$", before, re.MULTILINE) != [task_id]:
        raise ValueError("active note Task-ID does not match")
    text = before + "\n## Archived changes\n\n```json\n{}\n```\n".format(
        json.dumps(change_receipt(root, state), indent=2, ensure_ascii=False))
    text += f"\n## Archive\n\n{reason.strip()}\n\nArchived-At: {datetime.now(timezone.utc).isoformat()}\n"
    destination = state.note_path.replace("/proposed/", "/archived/")
    errors = validate_note(text, destination)
    if errors:
        raise ValueError("\n".join(errors))
    return store_final_task(root, state, before, text, destination, "archived")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    start = commands.add_parser("start")
    start.add_argument("slug")
    start.add_argument("--type", choices=sorted(TYPES), required=True)
    start.add_argument("--summary", required=True)
    for name in ("check", "finish"):
        commands.add_parser(name).add_argument("task")
    archive = commands.add_parser("archive")
    archive.add_argument("task")
    archive.add_argument("--reason", required=True)
    args = parser.parse_args()
    try:
        if args.command == "start":
            state = start_task(ROOT, args.slug, args.type, args.summary)
            print(f"Task-ID: {state.task_id}\nNote: {state.note_path}")
        elif args.command == "finish":
            state = finish_task(ROOT, args.task)
            print(f"task complete: {state.task_id}\nNote: {state.note_path}")
        elif args.command == "archive":
            state = archive_task(ROOT, args.task, args.reason)
            print(f"task archived (not complete): {state.task_id}\nNote: {state.note_path}")
        else:
            errors = check_task(ROOT, args.task)
            if errors:
                raise ValueError("\n".join(errors))
            print(f"task check OK: {args.task}")
    except (OSError, ValueError, TypeError, subprocess.CalledProcessError) as error:
        print(f"task notes FAILED: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())

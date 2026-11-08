"""Shared private worktree state and repository-owned file fingerprints."""

from contextlib import contextmanager
from dataclasses import asdict, dataclass
from functools import wraps
import hashlib
import json
import os
from pathlib import Path
import re
import sqlite3
import subprocess
import tempfile
from uuid import UUID
from typing import Callable, Concatenate, ParamSpec, TypeVar

from check_code_line_cap import EXCLUDED_DIRS, EXCLUDED_PREFIXES


GENERATED = EXCLUDED_DIRS - {"tests", "test", "__tests__", "fixtures", "__fixtures__"}
P = ParamSpec("P")
T = TypeVar("T")


def validate_id(task_id: str) -> None:
    if str(UUID(task_id)) != task_id:
        raise ValueError("Task-ID must be a canonical UUID")


def owned_path(root: Path, name: str) -> Path:
    path = Path(name)
    if (not path.parts or path.as_posix() != name or path.is_absolute()
            or ".." in path.parts or ":" in path.parts[0]
            or GENERATED.intersection(path.parts)
            or name.startswith((*EXCLUDED_PREFIXES, "vendor/"))):
        raise ValueError(f"not a repository-owned path: {name}")
    destination = root / path
    if not destination.resolve().is_relative_to(root.resolve()):
        raise ValueError(f"path escapes repository: {name}")
    return destination


def source_hash(root: Path, name: str) -> str:
    path = owned_path(root, name)
    if not path.is_file():
        raise ValueError(f"source file missing: {name}")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def snapshot(root: Path) -> dict[str, str]:
    output = subprocess.check_output(
        ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=root,
    )
    files = {}
    for raw in output.split(b"\0"):
        if not raw:
            continue
        name = raw.decode()
        if GENERATED.intersection(Path(name).parts) or name.startswith((*EXCLUDED_PREFIXES, "vendor/")):
            continue
        path = owned_path(root, name)
        if path.is_file():
            files[name] = source_hash(root, name)
    return files


def state_dir(root: Path) -> Path:
    result = subprocess.check_output(
        ["git", "rev-parse", "--path-format=absolute", "--git-path", "dsh-tasks"],
        cwd=root, text=True,
    )
    return Path(result.strip())


def atomic_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor, temporary = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    temporary = Path(temporary)
    try:
        with os.fdopen(descriptor, "w", encoding="utf-8") as stream:
            stream.write(text)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


@contextmanager
def task_operation(root: Path):
    directory = state_dir(root)
    directory.mkdir(parents=True, exist_ok=True)
    connection = None
    try:
        connection = sqlite3.connect(directory / "operations.sqlite", timeout=0)
        connection.execute("BEGIN IMMEDIATE")
    except sqlite3.Error as error:
        if connection is not None:
            connection.close()
        raise ValueError(f"task operation unavailable (retry if another command is running): {error}") from error
    try:
        yield
    finally:
        connection.rollback()
        connection.close()


def serialized_operation(function: Callable[Concatenate[Path, P], T]
                         ) -> Callable[Concatenate[Path, P], T]:
    @wraps(function)
    def run(root: Path, *args: P.args, **kwargs: P.kwargs) -> T:
        with task_operation(root):
            return function(root, *args, **kwargs)
    return run


@dataclass
class TaskState:
    task_id: str
    base_ref: str
    note_path: str
    started_at: str
    initial_files: dict[str, str]
    initial_note_hash: str
    phase: str
    final_note_hash: str | None = None


def read_task(root: Path, task_id: str) -> TaskState:
    validate_id(task_id)
    try:
        data = json.loads((state_dir(root) / f"{task_id}.json").read_text())
        state = TaskState(**data)
    except FileNotFoundError as error:
        raise ValueError(f"task is not registered in this worktree: {task_id}") from error
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError(f"invalid task state: {task_id}: {error}") from error
    if state.task_id != task_id or state.phase not in {"active", "complete", "archived"}:
        raise ValueError(f"invalid identity/phase in task state: {task_id}")
    if not isinstance(state.initial_files, dict):
        raise ValueError(f"invalid initial fingerprints: {task_id}")
    for name, digest in state.initial_files.items():
        if not isinstance(name, str) or not isinstance(digest, str) or not re.fullmatch("[0-9a-f]{64}", digest):
            raise ValueError(f"invalid initial fingerprint: {name}")
        owned_path(root, name)
    if not isinstance(state.initial_note_hash, str) or not re.fullmatch("[0-9a-f]{64}", state.initial_note_hash):
        raise ValueError("invalid initial note fingerprint")
    if state.phase != "active" and (
            not isinstance(state.final_note_hash, str) or not re.fullmatch("[0-9a-f]{64}", state.final_note_hash)):
        raise ValueError("invalid final note fingerprint")
    if not isinstance(state.note_path, str):
        raise ValueError("invalid task note path")
    parts = Path(state.note_path).parts
    folder = {"active": "proposed", "complete": "implemented", "archived": "archived"}[state.phase]
    if (len(parts) != 4 or parts[:2] != ("docs", "notes")
            or parts[2] != folder or not state.note_path.endswith(".md")):
        raise ValueError(f"invalid task note path: {state.note_path}")
    owned_path(root, state.note_path)
    return state


def write_task(root: Path, state: TaskState) -> None:
    validate_id(state.task_id)
    atomic_text(state_dir(root) / f"{state.task_id}.json",
                json.dumps(asdict(state), indent=2, sort_keys=True) + "\n")


def load_active_task(root: Path, task_id: str) -> TaskState:
    state = read_task(root, task_id)
    active = state_dir(root) / "active"
    if state.phase != "active" or not active.is_file() or active.read_text().strip() != task_id:
        raise ValueError(f"task is not active in this worktree: {task_id}")
    return state

from contextlib import contextmanager
from datetime import datetime, timezone
import hashlib
import importlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest


TASK_ID = "c431c060-64bc-4c0a-b495-5b0f7ef35dba"


def git(root, *args):
    return subprocess.check_output(["git", *args], cwd=root, text=True).strip()


@contextmanager
def repository():
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory).resolve()
        git(root, "init", "-q")
        git(root, "config", "user.email", "test@example.invalid")
        git(root, "config", "user.name", "Test")
        (root / "source.rs").write_text("fn main() {}\n")
        git(root, "add", ".")
        git(root, "commit", "-qm", "fixture")
        yield root


def seed_task(root):
    note = root / "docs/notes/proposed/task.md"
    note.parent.mkdir(parents=True)
    base = git(root, "rev-parse", "HEAD")
    note.write_text(f"""# Test task

Record-Version: 2
Task-ID: {TASK_ID}
Base-Ref: {base}
Type: tooling
Status: in-progress

## Context
Testing the production task lifecycle.

## Changes
Implementation has not started.

## Validation
Not run: task initialization; verification is pending.

## Knowledge refresh
```json
{{"status":"pending","entries":[],"none_reason":null}}
```

## Risks and follow-up
Not yet verified.
""")
    directory = Path(git(root, "rev-parse", "--path-format=absolute", "--git-path", "dsh-tasks"))
    directory.mkdir(parents=True)
    state = {
        "task_id": TASK_ID, "base_ref": base, "note_path": note.relative_to(root).as_posix(),
        "started_at": datetime.now(timezone.utc).isoformat(), "phase": "active",
        "initial_files": {"source.rs": hashlib.sha256((root / "source.rs").read_bytes()).hexdigest()},
        "initial_note_hash": hashlib.sha256(note.read_bytes()).hexdigest(),
    }
    (directory / f"{TASK_ID}.json").write_text(json.dumps(state))
    (directory / "active").write_text(TASK_ID)
    return note


class TaskStateTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(Path(__file__).with_name("task_state.py").is_file(),
                        "The worktree task-state helper is missing")
        self.state = importlib.import_module("task_state")

    def test_active_task_is_loaded_from_current_git_directory(self):
        with repository() as root:
            seed_task(root)
            task = self.state.load_active_task(root, TASK_ID)
            self.assertEqual(task.task_id, TASK_ID)
            with self.assertRaises(ValueError):
                self.state.load_active_task(root, "../active")

    def test_source_hash_rejects_escape_vendor_and_external_symlink(self):
        with repository() as root, tempfile.TemporaryDirectory() as outside:
            self.assertEqual(self.state.source_hash(root, "source.rs"),
                             hashlib.sha256((root / "source.rs").read_bytes()).hexdigest())
            external = Path(outside) / "fixture.rs"
            external.write_text("external fixture")
            (root / "link.rs").symlink_to(external)
            for name in (".", "./source.rs", ".git/config", "../fixture.rs",
                         str(external), "vendor/fixture.rs", "link.rs"):
                with self.subTest(name=name), self.assertRaises(ValueError):
                    self.state.source_hash(root, name)

    def test_snapshot_includes_untracked_files_and_dirty_contents(self):
        with repository() as root:
            (root / "source.rs").write_text("fn changed() {}\n")
            (root / "new.md").write_text("new record")
            hashes = self.state.snapshot(root)
            self.assertEqual(set(hashes), {"source.rs", "new.md"})
            self.assertEqual(hashes["source.rs"],
                             hashlib.sha256((root / "source.rs").read_bytes()).hexdigest())

    def test_malformed_initial_hashes_are_rejected_before_attribution(self):
        with repository() as root:
            seed_task(root)
            path = self.state.state_dir(root) / f"{TASK_ID}.json"
            original = json.loads(path.read_text())
            for values in ({"source.rs": None}, {"source.rs": "not-a-hash"},
                           {"../outside.rs": "a" * 64}):
                with self.subTest(values=values):
                    path.write_text(json.dumps({**original, "initial_files": values}))
                    with self.assertRaises(ValueError):
                        self.state.load_active_task(root, TASK_ID)

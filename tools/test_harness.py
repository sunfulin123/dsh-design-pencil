import importlib.util
import hashlib
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from knowledge import replace_json_section
from test_task_state import git, repository


SCRIPT = Path(__file__).with_name("check_harness.py")

VALID_NOTE = """# Example change

Record-Version: 2
Task-ID: c431c060-64bc-4c0a-b495-5b0f7ef35dba
Base-Ref: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
Started-At: 2026-11-07T00:00:00+00:00
Completed-At: 2026-11-07T00:01:00+00:00
Type: fix-bug
Status: complete

## Context
The user-visible operation failed.

## Changes
Repair the shared operation without changing the tool schema.

## Validation
- `node --test example.test.mjs` — passed, 3 tests.

## Knowledge refresh
```json
{"status":"reviewed","entries":[],"none_reason":"Fixture-only change with no product knowledge impact."}
```

## Risks and follow-up
None identified in the tested scope.

## Changed files
```json
{"files":[]}
```
"""


class HarnessTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("harness", SCRIPT)
        cls.harness = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.harness)

    def test_note_requires_type_status_and_evidence_sections(self):
        self.assertEqual(self.harness.validate_note(VALID_NOTE), [])
        self.assertTrue(self.harness.validate_note(VALID_NOTE.replace("fix-bug", "random")))
        self.assertTrue(self.harness.validate_note(VALID_NOTE.replace("Status: complete", "")))
        self.assertTrue(self.harness.validate_note(VALID_NOTE.replace("## Validation", "## Test")))
        self.assertTrue(self.harness.validate_note(VALID_NOTE.replace(
            "- `node --test example.test.mjs` — passed, 3 tests.", "TODO"
        )))

    def test_not_run_needs_a_reason(self):
        command = "- `node --test example.test.mjs` — passed, 3 tests."
        self.assertEqual(self.harness.validate_note(
            VALID_NOTE.replace(command, "Not run: documentation-only change.")
        ), [])
        self.assertTrue(self.harness.validate_note(VALID_NOTE.replace(command, "Not run:")))

    def test_missing_new_or_updated_note_blocks_a_task(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            self.assertTrue(self.harness.check_task_notes(root, ["crates/a/src/lib.rs"]))
            note = root / "docs/notes/implemented/task.md"
            note.parent.mkdir(parents=True)
            note.write_text(VALID_NOTE)
            self.assertEqual(self.harness.check_task_notes(
                root, ["crates/a/src/lib.rs", "docs/notes/implemented/task.md"]
            ), [])
            self.assertTrue(self.harness.check_task_notes(
                root, ["crates/a/src/lib.rs", "docs/notes/proposed/_template.md"]
            ))
            self.assertTrue(self.harness.check_task_notes(
                root, ["crates/a/src/lib.rs", "docs/notes/implemented/deleted.md"]
            ))

    def test_changed_invalid_note_is_not_ignored(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            note = root / "docs/notes/implemented/task.md"
            note.parent.mkdir(parents=True)
            note.write_text("# Missing evidence")
            self.assertTrue(self.harness.check_task_notes(
                root, ["docs/notes/implemented/task.md"]
            ))

    def test_support_files_are_not_task_records(self):
        self.assertEqual(self.harness.note_paths([
            "docs/notes/README.md", "docs/notes/AGENTS.md",
            "docs/notes/proposed/_template.md", "docs/notes/implemented/task.md",
        ]), ["docs/notes/implemented/task.md"])

    def test_note_location_matches_lifecycle(self):
        cases = [
            ("implemented/task.md", "complete", False),
            ("proposed/task.md", "in-progress", False),
            ("proposed/task.md", "blocked", False),
            ("implemented/task.md", "in-progress", True),
            ("proposed/task.md", "complete", True),
            ("task.md", "complete", True),
            ("other/task.md", "complete", True),
            ("implemented/nested/task.md", "complete", True),
        ]
        for location, status, invalid in cases:
            with self.subTest(location=location, status=status):
                with tempfile.TemporaryDirectory() as temp:
                    root = Path(temp)
                    name = f"docs/notes/{location}"
                    note = root / name
                    note.parent.mkdir(parents=True)
                    note.write_text(VALID_NOTE.replace("Status: complete", f"Status: {status}"))
                    errors = self.harness.validate_note(note.read_text(), name)
                    self.assertEqual(bool(errors), invalid, errors)

    def test_archived_record_cannot_satisfy_current_task_evidence(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            name = "docs/notes/archived/old-task.md"
            note = root / name
            note.parent.mkdir(parents=True)
            note.write_text(VALID_NOTE)
            self.assertTrue(self.harness.check_task_notes(root, ["tools/example.py", name]))

    def test_empty_change_requires_no_note(self):
        self.assertEqual(self.harness.check_task_notes(Path("."), []), [])

    def test_old_valid_note_is_history_not_current_task_evidence(self):
        legacy = VALID_NOTE.replace("Record-Version: 2\n", "")
        self.assertEqual(self.harness.validate_note(legacy), [])
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            name = "docs/notes/implemented/old-task.md"
            note = root / name
            note.parent.mkdir(parents=True)
            note.write_text(legacy)
            self.assertTrue(self.harness.check_task_notes(root, ["tools/new.py", name]))

    def test_v2_completion_requires_knowledge_and_change_receipts(self):
        self.assertTrue(self.harness.validate_note(
            VALID_NOTE.replace('"status":"reviewed"', '"status":"pending"')
        ))

    def test_ci_rejects_current_receipts_with_wrong_file_fingerprints(self):
        with repository() as root:
            name = "docs/notes/implemented/current-task.md"
            note = root / name
            note.parent.mkdir(parents=True)
            note.write_text(replace_json_section(VALID_NOTE, "Changed files", {
                "files": [{"path": "source.rs", "before": None, "after": "0" * 64}],
            }))
            self.assertTrue(self.harness.check_task_notes(root, ["source.rs", name]))

    def test_ci_uses_latest_receipt_without_invalidating_prior_task_history(self):
        with repository() as root:
            names = ["docs/notes/implemented/first.md", "docs/notes/implemented/second.md"]
            (root / names[0]).parent.mkdir(parents=True)
            first = replace_json_section(VALID_NOTE, "Changed files", {
                "files": [{"path": "source.rs", "before": None,
                           "after": hashlib.sha256((root / "source.rs").read_bytes()).hexdigest()}],
            })
            (root / names[0]).write_text(first)
            (root / "source.rs").write_text("fn changed_again() {}\n")
            second = VALID_NOTE.replace("c431c060-64bc-4c0a-b495-5b0f7ef35dba",
                                        "54ce4948-dc9f-4b41-81b7-9dcd7a174d20").replace(
                                            "00:01:00+00:00", "00:02:00+00:00")
            (root / names[1]).write_text(replace_json_section(second, "Changed files", {
                "files": [{"path": "source.rs", "before": None,
                           "after": hashlib.sha256((root / "source.rs").read_bytes()).hexdigest()}],
            }))
            self.assertEqual(self.harness.check_task_notes(root, ["source.rs", *names]), [])

    def test_editing_a_previously_completed_record_is_not_new_ci_evidence(self):
        with repository() as root:
            name = "docs/notes/implemented/old-task.md"
            note = root / name
            note.parent.mkdir(parents=True)
            note.write_text(VALID_NOTE)
            git(root, "add", ".")
            git(root, "commit", "-qm", "completed old task")
            base = git(root, "rev-parse", "HEAD")
            note.write_text(VALID_NOTE + "\nMinor wording edit.\n")
            self.assertTrue(self.harness.check_task_notes(root, [name], base=base))

    def test_ci_cannot_reuse_closed_identity_under_a_new_filename(self):
        with repository() as root:
            name = "docs/notes/implemented/old-task.md"
            (root / name).parent.mkdir(parents=True)
            (root / name).write_text(VALID_NOTE)
            git(root, "add", ".")
            git(root, "commit", "-qm", "old evidence")
            base = git(root, "rev-parse", "HEAD")
            renamed = "docs/notes/implemented/reused-task.md"
            (root / renamed).write_text(VALID_NOTE)
            (root / name).unlink()
            self.assertTrue(self.harness.check_task_notes(root, [name, renamed], base=base))

    def test_ci_rejects_stale_current_knowledge_document_receipts(self):
        with repository() as root:
            name = "docs/notes/implemented/current-task.md"
            (root / name).parent.mkdir(parents=True)
            kb = root / "docs/kb/product.md"
            kb.parent.mkdir(parents=True)
            kb.write_text("Current reviewed product facts")
            (root / name).write_text(replace_json_section(VALID_NOTE, "Knowledge refresh", {
                "status": "reviewed", "none_reason": None,
                "entries": [{"path": "docs/kb/product.md", "action": "updated",
                             "reason": "Checked product facts against the source.", "sha256": "0" * 64}],
            }))
            self.assertTrue(self.harness.check_task_notes(root, [name, "docs/kb/product.md"]))
        self.assertTrue(self.harness.validate_note(
            VALID_NOTE.replace("## Changed files", "## Other")
        ))
        self.assertTrue(self.harness.validate_note(
            VALID_NOTE.replace("Base-Ref: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
                               "Base-Ref: not-a-commit")
        ))

    def test_changes_include_worktree_and_untracked_files(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for args in (["init", "-q"], ["config", "user.email", "test@example.invalid"],
                         ["config", "user.name", "test"]):
                subprocess.run(["git", *args], cwd=root, check=True, capture_output=True)
            (root / "tracked.js").write_text("const a = 1;\n")
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            subprocess.run(["git", "commit", "-qm", "test fixture"], cwd=root, check=True)
            (root / "tracked.js").write_text("const a = 2;\n")
            (root / "new.js").write_text("const b = 1;\n")
            self.assertEqual(self.harness.changed_files(root, "HEAD"), ["new.js", "tracked.js"])

    def test_invalid_git_ref_is_an_error(self):
        with tempfile.TemporaryDirectory() as temp:
            subprocess.run(["git", "init", "-q"], cwd=temp, check=True)
            with self.assertRaises(subprocess.CalledProcessError):
                self.harness.changed_files(Path(temp), "not-a-ref")


if __name__ == "__main__":
    unittest.main()

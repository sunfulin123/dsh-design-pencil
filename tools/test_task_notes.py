import importlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from test_knowledge import entry
from test_task_state import git, repository


class TaskNotesTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(Path(__file__).with_name("task_notes.py").is_file(),
                        "The task notes lifecycle tool is missing")
        self.tool = importlib.import_module("task_notes")
        self.kb = importlib.import_module("knowledge")
        self.state = importlib.import_module("task_state")

    def start(self, root):
        template = root / "docs/notes/proposed/_template.md"
        template.parent.mkdir(parents=True, exist_ok=True)
        template.write_text((Path(__file__).resolve().parents[1]
                             / "docs/notes/proposed/_template.md").read_text())
        return self.tool.start_task(root, "example-task", "tooling", "Exercise the task lifecycle.")

    def ready(self, root):
        state = self.start(root)
        entry(root)
        (root / "source.rs").write_text("fn implemented() {}\n")
        note = root / state.note_path
        note.write_text(note.read_text().replace(
            "Implementation has not started.", "Implemented the source change."
        ).replace(
            "Not run: task initialization; implementation and verification are pending.",
            "`source.rs` — source inspection passed; behavior verified in fixture tests."
        ))
        self.kb.review_entry(root, "docs/kb/product.md", state.task_id,
                             "Product facts were checked against the changed source.",
                             "`source.rs` — source inspection passed.")
        return state

    def test_start_creates_unique_pending_record_and_blocks_another_active_task(self):
        with repository() as root:
            state = self.start(root)
            note = (root / state.note_path).read_text()
            self.assertIn(f"Task-ID: {state.task_id}", note)
            self.assertIn("Status: in-progress", note)
            self.assertIn('"status": "pending"', note)
            with self.assertRaises(ValueError):
                self.start(root)

    def test_preexisting_dirty_files_and_old_notes_are_not_new_task_changes(self):
        with repository() as root:
            (root / "source.rs").write_text("fn dirty_before_start() {}\n")
            old = root / "old-note.md"
            old.write_text("Preexisting unfinished work")
            state = self.start(root)
            self.assertEqual(self.tool.task_changes(root, state), [])
            (root / "new.md").write_text("This task added a file")
            self.assertEqual(self.tool.task_changes(root, state), ["new.md"])
            (root / "source.rs").unlink()
            self.assertEqual(self.tool.task_changes(root, state), ["new.md", "source.rs"])

    def test_initial_or_stale_knowledge_cannot_finish(self):
        with repository() as root:
            state = self.start(root)
            with self.assertRaises(ValueError):
                self.tool.finish_task(root, state.task_id)
            self.assertTrue((root / state.note_path).is_file())
        with repository() as root:
            state = self.ready(root)
            (root / "source.rs").write_text("fn changed_after_review() {}\n")
            with self.assertRaises(ValueError):
                self.tool.finish_task(root, state.task_id)
            self.assertTrue((root / state.note_path).is_file())

    def test_verified_task_moves_same_record_and_preserves_changes_and_evidence(self):
        with repository() as root:
            state = self.ready(root)
            before = root / state.note_path
            completed = self.tool.finish_task(root, state.task_id)
            text = (root / completed.note_path).read_text()
            self.assertFalse(before.exists())
            self.assertIn("/implemented/", completed.note_path)
            self.assertIn("Status: complete", text)
            self.assertIn("## Changed files", text)
            self.assertIn("source.rs", text)
            self.assertIn("source inspection passed", text)
            with self.assertRaises(ValueError):
                self.tool.finish_task(root, state.task_id)
            next_task = self.start(root)
            self.assertNotEqual(next_task.task_id, state.task_id)

    def test_finish_does_not_overwrite_an_existing_destination(self):
        with repository() as root:
            state = self.ready(root)
            target = root / state.note_path.replace("/proposed/", "/implemented/")
            target.parent.mkdir(parents=True)
            target.write_text("Do not overwrite this fixture")
            with self.assertRaises(ValueError):
                self.tool.finish_task(root, state.task_id)
            self.assertEqual(target.read_text(), "Do not overwrite this fixture")
            self.assertTrue((root / state.note_path).is_file())

    def test_completed_task_can_be_checked_but_cannot_hide_later_changes(self):
        with repository() as root:
            state = self.ready(root)
            self.tool.finish_task(root, state.task_id)
            self.assertEqual(self.tool.check_task(root, state.task_id), [])
            (root / "source.rs").write_text("fn changed_after_finish() {}\n")
            self.assertTrue(self.tool.check_task(root, state.task_id))

    def test_unaffected_knowledge_can_be_acknowledged_without_fake_body_changes(self):
        with repository() as root:
            first = self.ready(root)
            self.tool.finish_task(root, first.task_id)
            state = self.start(root)
            note = root / state.note_path
            text = note.read_text().replace("Implementation has not started.", "Updated a task-only guide.")
            text = text.replace(
                "Not run: task initialization; implementation and verification are pending.",
                "Not run: documentation-only fixture; no runtime behavior changed."
            )
            note.write_text(self.kb.replace_json_section(text, "Knowledge refresh", {
                "status": "reviewed", "entries": [],
                "none_reason": "Task-only documentation did not alter any product or KB sources.",
            }))
            (root / "task-guide.md").write_text("Task-only guide")
            self.assertEqual(self.tool.check_task(root, state.task_id), [])

    def test_commit_during_task_does_not_reset_start_snapshot(self):
        with repository() as root:
            state = self.ready(root)
            git(root, "add", "source.rs")
            git(root, "commit", "-qm", "intermediate fixture commit")
            self.assertIn("source.rs", self.tool.task_changes(root, state))
            self.assertNotEqual(state.base_ref, git(root, "rev-parse", "HEAD"))
            self.assertEqual(self.tool.check_task(root, state.task_id), [])

    def test_linked_worktree_uses_private_task_state(self):
        with repository() as root, tempfile.TemporaryDirectory() as directory:
            linked = Path(directory).resolve() / "linked"
            git(root, "worktree", "add", "-q", "-b", "task", str(linked))
            state = self.start(linked)
            self.assertTrue((linked / ".git").is_file())
            self.assertNotEqual(self.state.state_dir(root), self.state.state_dir(linked))
            self.assertEqual(self.state.load_active_task(linked, state.task_id).task_id, state.task_id)
            with self.assertRaises(ValueError):
                self.state.load_active_task(root, state.task_id)

    def test_abandoned_task_keeps_blocked_evidence_and_releases_registration(self):
        with repository() as root:
            state = self.start(root)
            note = root / state.note_path
            before = note.read_text().replace("Status: in-progress", "Status: blocked")
            note.write_text(before)
            (root / "source.rs").write_text("fn abandoned_change() {}\n")
            archived = self.tool.archive_task(root, state.task_id,
                                              "Stopped because the required API is unavailable.")
            text = (root / archived.note_path).read_text()
            self.assertTrue(text.startswith(before))
            self.assertIn("/archived/", archived.note_path)
            self.assertIn("Status: blocked", text)
            self.assertNotIn("Status: complete", text)
            self.assertEqual(archived.phase, "archived")
            self.assertIn('"path": "source.rs"', text)
            self.assertTrue(self.tool.check_task(root, state.task_id))
            self.assertNotEqual(self.start(root).task_id, state.task_id)

    def test_terminal_operations_cannot_race_other_task_mutations(self):
        with repository() as root:
            state = self.ready(root)
            before = (root / state.note_path).read_text()
            with self.state.task_operation(root):
                with self.assertRaises(ValueError):
                    self.tool.finish_task(root, state.task_id)
                with self.assertRaises(ValueError):
                    self.tool.archive_task(root, state.task_id, "Stop this fixture task.")
                with self.assertRaises(ValueError):
                    self.kb.review_entry(root, "docs/kb/product.md", state.task_id,
                                         "Review this fixture source.", "`source.rs` inspected.")
            self.assertEqual((root / state.note_path).read_text(), before)
            self.tool.archive_task(root, state.task_id, "Stop this fixture task.")
            self.start(root)

    def test_archive_rolls_back_if_releasing_active_registration_fails(self):
        with repository() as root:
            state = self.start(root)
            before = (root / state.note_path).read_text()
            active = self.state.state_dir(root) / "active"
            unlink = Path.unlink

            def fail_active(path, *args, **kwargs):
                if path == active:
                    raise OSError("fixture active removal failed")
                return unlink(path, *args, **kwargs)

            with patch.object(Path, "unlink", fail_active), self.assertRaises(OSError):
                self.tool.archive_task(root, state.task_id, "Stopped for this rollback fixture.")
            self.assertEqual((root / state.note_path).read_text(), before)
            self.assertEqual(self.state.load_active_task(root, state.task_id).phase, "active")
            self.assertFalse((root / state.note_path.replace("/proposed/", "/archived/")).exists())

    def test_archive_does_not_overwrite_an_existing_destination(self):
        with repository() as root:
            state = self.start(root)
            target = root / state.note_path.replace("/proposed/", "/archived/")
            target.parent.mkdir(parents=True)
            target.write_text("Existing historical evidence")
            with self.assertRaises(ValueError):
                self.tool.archive_task(root, state.task_id, "Stop this fixture task.")
            self.assertEqual(target.read_text(), "Existing historical evidence")
            self.state.load_active_task(root, state.task_id)

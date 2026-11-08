from datetime import datetime, timezone
import hashlib
import importlib
import json
from pathlib import Path
import unittest

from test_task_state import TASK_ID, repository, seed_task


def entry(root):
    path = root / "docs/kb/product.md"
    path.parent.mkdir(parents=True)
    data = {
        "version": 1, "status": "verified", "task_id": TASK_ID,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "sources": {"source.rs": hashlib.sha256((root / "source.rs").read_bytes()).hexdigest()},
        "reason": "Reviewed the current implementation.",
        "evidence": "`source.rs` — source inspection passed.",
    }
    path.write_text("# Product\n\nCurrent behavior.\n\n## Provenance\n\n```json\n"
                    + json.dumps(data) + "\n```\n")
    return path


class KnowledgeTests(unittest.TestCase):
    def setUp(self):
        self.assertTrue(Path(__file__).with_name("knowledge.py").is_file(),
                        "The knowledge provenance tool is missing")
        self.kb = importlib.import_module("knowledge")

    def test_valid_provenance_passes_but_source_change_and_deletion_fail(self):
        with repository() as root:
            seed_task(root)
            entry(root)
            self.assertEqual(self.kb.check_knowledge(root), [])
            (root / "source.rs").write_text("fn changed() {}\n")
            self.assertTrue(self.kb.check_knowledge(root))
            (root / "source.rs").unlink()
            self.assertTrue(self.kb.check_knowledge(root))

    def test_today_does_not_make_stale_fingerprints_fresh(self):
        with repository() as root:
            seed_task(root)
            path = entry(root)
            text = path.read_text()
            data = self.kb.read_json_section(text, "Provenance")
            data["sources"]["source.rs"] = "0" * 64
            path.write_text(self.kb.replace_json_section(text, "Provenance", data))
            self.assertTrue(self.kb.check_knowledge(root))

    def test_review_preserves_body_and_updates_active_note_evidence(self):
        with repository() as root:
            note = seed_task(root)
            path = entry(root)
            (root / "source.rs").write_text("fn changed() {}\n")
            self.kb.review_entry(root, "docs/kb/product.md", TASK_ID,
                                 "The behavior remains accurately described.",
                                 "`source.rs` — inspection passed.", action="unchanged")
            self.assertTrue(path.read_text().startswith("# Product\n\nCurrent behavior.\n"))
            self.assertEqual(self.kb.check_knowledge(root), [])
            refresh = self.kb.read_json_section(note.read_text(), "Knowledge refresh")
            self.assertEqual(refresh["entries"][0]["action"], "unchanged")
            self.assertEqual(refresh["entries"][0]["sha256"],
                             hashlib.sha256(path.read_bytes()).hexdigest())

    def test_review_without_active_task_or_real_evidence_is_rejected(self):
        with repository() as root:
            seed_task(root)
            path = entry(root)
            before = path.read_bytes()
            with self.assertRaises(ValueError):
                self.kb.review_entry(root, "docs/kb/product.md", TASK_ID, "TODO", "passed")
            with self.assertRaises(ValueError):
                self.kb.review_entry(root, "docs/kb/product.md",
                                     "54ce4948-dc9f-4b41-81b7-9dcd7a174d20",
                                     "Reviewed behavior.", "`source.rs` — passed.")
            self.assertEqual(path.read_bytes(), before)

    def test_duplicate_json_fields_and_unowned_sources_fail(self):
        with self.assertRaises(ValueError):
            self.kb.read_json_section('## Provenance\n```json\n{"version":1,"version":2}\n```\n',
                                     "Provenance")
        with repository() as root:
            seed_task(root)
            path = entry(root)
            text = path.read_text()
            data = self.kb.read_json_section(text, "Provenance")
            data["sources"] = {"../outside.rs": "0" * 64}
            path.write_text(self.kb.replace_json_section(text, "Provenance", data))
            self.assertTrue(self.kb.check_knowledge(root))

    def test_boolean_version_is_not_a_numeric_provenance_version(self):
        with repository() as root:
            seed_task(root)
            path = entry(root)
            text = path.read_text()
            data = self.kb.read_json_section(text, "Provenance")
            data["version"] = True
            path.write_text(self.kb.replace_json_section(text, "Provenance", data))
            self.assertTrue(self.kb.check_knowledge(root))

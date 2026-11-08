import json
import os
from pathlib import Path
import subprocess
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MaintenanceEntrypointTests(unittest.TestCase):
    def test_wrapper_runs_without_optional_js_flag(self):
        result = subprocess.run(
            ["bash", "tools/check-maintenance.sh"], cwd=ROOT,
            env={**os.environ, "PYTHON": sys.executable}, capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("harness lint OK", result.stdout)

    def test_notes_and_kb_are_not_gitignored(self):
        for name in ("docs/notes/implemented/maintenance-harness.md",
                     "docs/notes/proposed/_template.md", "docs/notes/AGENTS.md",
                     "docs/notes/archived/.gitkeep",
                     "docs/kb/README.md", "docs/kb/runtime-mcp.md"):
            with self.subTest(name=name):
                result = subprocess.run(["git", "check-ignore", "--no-index", name],
                                        cwd=ROOT, capture_output=True)
                self.assertEqual(result.returncode, 1, f"{name} must be publishable")

    def test_notes_top_level_matches_lifecycle_layout(self):
        notes = ROOT / "docs/notes"
        self.assertEqual(
            {path.name for path in notes.iterdir()},
            {"archived", "implemented", "proposed", "AGENTS.md", "README.md"},
        )
        for name in ("archived", "implemented", "proposed"):
            self.assertTrue((notes / name).is_dir(), name)
        self.assertTrue((notes / "proposed/_template.md").is_file())

    def test_package_entrypoints_use_the_same_gate(self):
        packages = json.loads((ROOT / "packages/package.json").read_text())
        runtime = json.loads((ROOT / "packages/dsh-node-runtime/package.json").read_text())
        self.assertEqual(packages["scripts"]["lint:maintenance"],
                         "bash ../tools/check-maintenance.sh")
        self.assertEqual(runtime["scripts"]["lint"],
                         "bash ../../tools/check-maintenance.sh")

    def test_wrapper_rejects_unknown_options(self):
        result = subprocess.run(["bash", "tools/check-maintenance.sh", "--unknown"],
                                cwd=ROOT, capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("unknown argument", result.stderr)

    def test_wrapper_routes_task_identity_to_harness(self):
        result = subprocess.run(
            ["bash", "tools/check-maintenance.sh", "--task", "not-a-task"],
            cwd=ROOT, env={**os.environ, "PYTHON": sys.executable},
            capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn("unknown argument: --task", result.stderr)

    def test_local_base_gate_requires_explicit_current_task(self):
        result = subprocess.run(
            [sys.executable, "tools/check_harness.py", "--base", "HEAD"],
            cwd=ROOT, env={**os.environ, "CI": "false"}, capture_output=True, text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("--task", result.stderr)

    def test_clippy_gate_does_not_promote_warnings_to_errors(self):
        workflow = (ROOT / ".github/workflows/maintenance.yml").read_text()
        clippy_steps = [
            line.strip() for line in workflow.splitlines()
            if line.strip().startswith("- run: cargo clippy")
        ]
        self.assertEqual(clippy_steps, ["- run: cargo clippy --workspace --all-targets"])
        self.assertNotIn("continue-on-error:", workflow)


if __name__ == "__main__":
    unittest.main()

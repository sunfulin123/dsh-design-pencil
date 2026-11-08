import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest


SCRIPT = Path(__file__).with_name("check_code_line_cap.py")


class LineCapTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        spec = importlib.util.spec_from_file_location("line_cap", SCRIPT)
        cls.cap = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cls.cap)

    def count(self, code, suffix=".rs"):
        return self.cap.effective_lines(code.encode(), suffix)

    def test_exact_threshold(self):
        self.assertEqual(self.count("const X: u32 = 1;\n" * 500), 500)
        self.assertEqual(self.count("const X: u32 = 1;\n" * 501), 501)

    def test_rust_comments_and_raw_strings(self):
        code = '''// comment
/* outer
   /* inner */ still outer
*/
const URL: &str = "https://example.invalid"; // trailing
const RAW: &str = r##"
// string content
/* string content */
"##;

'''
        self.assertEqual(self.count(code), 5)

    def test_rust_inline_tests_are_excluded_not_production_attributes(self):
        code = '''#[derive(Clone)]
struct State;
#[cfg(test)]
#[allow(dead_code)]
mod tests {
    #[test]
    fn sample() { assert!(true); }
}
#[cfg(not(test))]
fn production() {}
'''
        self.assertEqual(self.count(code), 4)

    def test_mixed_test_and_production_line_keeps_production(self):
        self.assertEqual(self.count("#[cfg(test)] mod tests {} fn keep() {}\n"), 1)

    def test_conditional_feature_is_not_a_test_exemption(self):
        self.assertEqual(
            self.count('#[cfg(any(test, feature = "runtime"))]\nfn keep() {}\n'), 2
        )

    def test_javascript_templates_regex_and_comments(self):
        code = '''// comment
/* comment
 */
const url = "https://example.invalid"; // trailing
const regex = /https?:\\/\\//;
const template = `
// not a comment
/* not a comment */
${1 + 2}
`;
'''
        for suffix in (".js", ".mjs", ".cjs", ".ts"):
            with self.subTest(suffix=suffix):
                self.assertEqual(self.count(code, suffix), 7)

    def test_jsx_and_typescript(self):
        self.assertEqual(self.count("const el = <div>https://x</div>;\n", ".jsx"), 1)
        self.assertEqual(
            self.count("type Props = { text: string };\nconst el = <div />;\n", ".tsx"), 2
        )

    def test_empty_and_comment_only_source(self):
        for suffix in (".rs", ".js"):
            self.assertEqual(self.count("\n/* only a comment */\n// comment\n", suffix), 0)

    def test_invalid_source_is_an_explicit_error(self):
        with self.assertRaisesRegex(ValueError, "parse"):
            self.count("fn broken( {")

    def test_valid_rust_foreign_type_and_slice_binding(self):
        self.assertEqual(self.count('extern "C" {\n    pub type Handle;\n}\n'), 3)
        self.assertEqual(self.count(
            "fn point(p: &[u8]) {\n"
            "    match p { [0x04, 0x20, raw @ ..] => (), _ => () }\n"
            "}\n"
        ), 3)

    def test_multiline_foreign_type_is_still_counted(self):
        self.assertEqual(self.count('extern "C" {\n    pub type\n        Handle;\n}\n'), 4)

    def test_foreign_type_recovery_requires_terminator(self):
        with self.assertRaisesRegex(ValueError, "parse"):
            self.count('extern "C" { pub type Handle }')

    def test_file_classification_is_precise(self):
        excluded = [
            "crates/a/src/foo_tests.rs", "crates/a/tests/api.rs",
            "packages/a/foo.test.mjs", "packages/a/foo.spec.ts",
            "packages/a/png-fixture.test-helper.mjs", "packages/a/__tests__/x.js",
            "crates/a/fixtures/sample.rs", "crates/op-host-web/pkg/op_host_web.js",
            "packages/dsh-node-runtime/web-bundle/snippets/a/src/op_ck_bridge.js",
            "packages/a/node_modules/lib.js",
            "packages/op-chrome-extension/vendor/snapshot-extractor.js",
            "crates/op-host-web/assets/canvaskit/canvaskit.js",
        ]
        for path in excluded:
            with self.subTest(path=path):
                self.assertFalse(self.cap.is_source(Path(path)))
        for path in (
            "crates/a/src/contest.rs", "packages/a/latest.js",
            "crates/op-host-web/src/op_ck_bridge.js",
            "crates/op-html/assets/snapshot-extractor.js", "scripts/stage-dsh-runtime.mjs",
        ):
            with self.subTest(path=path):
                self.assertTrue(self.cap.is_source(Path(path)))

    def test_baseline_threshold_growth_new_file_and_staleness(self):
        self.assertEqual(self.cap.check_counts({"a.rs": 500}, {}), [])
        self.assertTrue(self.cap.check_counts({"a.rs": 501}, {}))
        self.assertEqual(self.cap.check_counts({"a.rs": 600}, {"a.rs": 600}), [])
        self.assertTrue(self.cap.check_counts({"a.rs": 601}, {"a.rs": 600}))
        self.assertTrue(self.cap.check_counts({"a.rs": 599}, {"a.rs": 600}))
        self.assertTrue(self.cap.check_counts({"a.rs": 500}, {"a.rs": 600}))
        self.assertTrue(self.cap.check_counts({}, {"a.rs": 600}))
        self.assertTrue(self.cap.check_counts({"renamed.rs": 600}, {"a.rs": 600}))

    def test_new_owned_directory_cannot_bypass_the_cap(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "deploy").mkdir()
            (root / "deploy/worker.js").write_text("const x = 1;\n" * 501)
            counts = self.cap.source_counts(root)
            self.assertEqual(counts, {"deploy/worker.js": 501})
            self.assertTrue(self.cap.check_counts(counts, {}))

    def test_repository_wide_discovery_prunes_dependencies_and_generated_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for name in ("vendor/lib/a.js", ".venv-lint/lib/a.js", "dist/a.js",
                         "node_modules/a.js", "tests/sample.js"):
                path = root / name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text("this is deliberately not valid javascript {")
            self.assertEqual(self.cap.source_counts(root), {})

    def test_baseline_cannot_gain_or_increase_entries(self):
        self.assertEqual(self.cap.check_baseline_diff({"a.rs": 550}, {"a.rs": 600}), [])
        self.assertEqual(self.cap.check_baseline_diff({}, {"a.rs": 600}), [])
        self.assertTrue(self.cap.check_baseline_diff({"a.rs": 601}, {"a.rs": 600}))
        self.assertTrue(self.cap.check_baseline_diff({"new.rs": 550}, {}))

    def test_baseline_validation(self):
        for files in ({"a.rs": 500}, {"a.rs": True}, {"../a.rs": 600}, {"a.rs": "600"}):
            with self.subTest(files=files), self.assertRaises(ValueError):
                self.cap.validate_baseline({"version": 1, "cap": 500, "files": files})

    def test_cli_ratchet_and_failure_exit_codes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "crates/a").mkdir(parents=True)
            source = root / "crates/a/a.rs"
            source.write_text("const X: u32 = 1;\n" * 600)
            baseline = root / "baseline.json"
            baseline.write_text(json.dumps({"version": 1, "cap": 500, "files": {
                "crates/a/a.rs": 600,
            }}))
            args = [sys.executable, str(SCRIPT), "--root", temp, "--baseline", str(baseline)]
            self.assertEqual(subprocess.run(args, capture_output=True).returncode, 0)
            source.write_text("const X: u32 = 1;\n" * 599)
            self.assertEqual(subprocess.run(args, capture_output=True).returncode, 1)
            self.assertEqual(subprocess.run(args + ["--ratchet"], capture_output=True).returncode, 0)
            self.assertEqual(json.loads(baseline.read_text())["files"]["crates/a/a.rs"], 599)
            source.write_text("const X: u32 = 1;\n" * 601)
            before = baseline.read_bytes()
            self.assertEqual(subprocess.run(args + ["--ratchet"], capture_output=True).returncode, 1)
            self.assertEqual(baseline.read_bytes(), before)

    def test_cli_missing_baseline_fails_instead_of_bootstrapping(self):
        with tempfile.TemporaryDirectory() as temp:
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", temp,
                 "--baseline", str(Path(temp) / "missing.json")],
                capture_output=True, text=True,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse((Path(temp) / "missing.json").exists())

    def test_cli_rejects_baseline_growth_against_actual_git_base(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / "tools").mkdir()
            (root / "crates/a").mkdir(parents=True)
            (root / "crates/a/a.rs").write_text("const X: u32 = 1;\n" * 600)
            baseline = root / "tools/code-line-baseline.json"
            baseline.write_text(json.dumps({"version": 1, "cap": 500, "files": {
                "crates/a/a.rs": 600,
            }}))
            for args in (["init", "-q"], ["config", "user.email", "test@example.invalid"],
                         ["config", "user.name", "test"], ["add", "."],
                         ["commit", "-qm", "test fixture"]):
                subprocess.run(["git", *args], cwd=root, check=True, capture_output=True)
            (root / "crates/a/a.rs").write_text("const X: u32 = 1;\n" * 601)
            baseline.write_text(json.dumps({"version": 1, "cap": 500, "files": {
                "crates/a/a.rs": 601,
            }}))
            result = subprocess.run(
                [sys.executable, str(SCRIPT), "--root", temp, "--baseline-ref", "HEAD"],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 1)
            self.assertIn("baseline cannot be added or increased", result.stderr)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Count effective Rust/JS/TS source lines and enforce a shrinking legacy cap."""

import argparse
from functools import lru_cache
import json
import os
from pathlib import Path
import re
import subprocess
import sys

try:
    from tree_sitter import Language, Parser
    import tree_sitter_javascript
    import tree_sitter_rust
    import tree_sitter_typescript
except ModuleNotFoundError as error:
    raise SystemExit(
        f"lint dependency missing ({error.name}); install tools/requirements-lint.txt "
        "in a venv and set PYTHON to its interpreter (see COMMANDS.md)"
    ) from error


CAP = 500
ROOT = Path(__file__).resolve().parents[1]
BASELINE_PATH = "tools/code-line-baseline.json"
SUFFIXES = {".rs", ".js", ".mjs", ".cjs", ".ts", ".tsx", ".jsx"}
EXCLUDED_DIRS = {
    ".git", "vendor", ".venv-lint", ".superpowers", ".worktrees",
    ".playwright-cli", ".playwright-mcp",
    "node_modules", "target", "dist", "out", "wasm", "web-bundle",
    "tests", "test", "__tests__", "fixtures", "__fixtures__",
}
# These are build outputs or mirrored third-party resources, not source owners.
EXCLUDED_PREFIXES = (
    "crates/op-host-web/pkg/", "crates/op-host-web/pkg-ck/",
    "crates/op-host-web/pkg-webgl/", "crates/op-web-sdk/pkg/",
    "crates/op-host-web/assets/canvaskit/",
    "packages/op-chrome-extension/vendor/",
)
COMMENTS = {"line_comment", "block_comment", "comment", "html_comment"}
TEST_NAME = re.compile(r"(?:^test_|_tests?$|[.](?:test|spec)(?:[.-]|$))")


def is_source(path: Path) -> bool:
    name = path.as_posix()
    return (
        path.suffix in SUFFIXES
        and not EXCLUDED_DIRS.intersection(path.parts)
        and not name.startswith(EXCLUDED_PREFIXES)
        and not TEST_NAME.search(path.stem)
        and path.stem not in {"test", "tests"}
    )


@lru_cache(maxsize=None)
def parser_for(suffix: str) -> Parser:
    if suffix == ".rs":
        language = tree_sitter_rust.language()
    elif suffix == ".ts":
        language = tree_sitter_typescript.language_typescript()
    elif suffix == ".tsx":
        language = tree_sitter_typescript.language_tsx()
    elif suffix in {".js", ".mjs", ".cjs", ".jsx"}:
        language = tree_sitter_javascript.language()
    else:
        raise ValueError(f"unsupported source suffix: {suffix}")
    return Parser(Language(language))


def test_attribute(node, data: bytes) -> bool:
    text = re.sub(rb"\s+", b"", data[node.start_byte:node.end_byte])
    return text in {b"#[cfg(test)]", b"#![cfg(test)]"}


def known_rust_recovery(node, data: bytes) -> bool:
    """The pinned grammar recovers these valid Rust forms as ERROR nodes."""
    if node.is_missing or node.type != "ERROR" or node.parent is None:
        return False
    text = data[node.start_byte:node.end_byte]
    if (text == b"@" and node.parent.type == "range_pattern"
            and node.parent.parent is not None
            and node.parent.parent.type == "slice_pattern"):
        return True
    return (
        node.parent.type == "declaration_list"
        and node.parent.parent is not None
        and node.parent.parent.type == "foreign_mod_item"
        and node.next_sibling is not None and node.next_sibling.type == "empty_statement"
        and data[node.next_sibling.start_byte:node.next_sibling.end_byte] == b";"
        and [child.type for child in node.children] == ["visibility_modifier", "type", "identifier"]
        and re.fullmatch(rb"pub\s+type\s+[A-Za-z_][A-Za-z_0-9]*", text) is not None
    )


def effective_lines(data: bytes, suffix: str) -> int:
    tree = parser_for(suffix).parse(data)
    if tree.root_node.has_error:
        stack = [tree.root_node]
        while stack:
            node = stack.pop()
            if node.type == "ERROR" or node.is_missing:
                if suffix != ".rs" or not known_rust_recovery(node, data):
                    raise ValueError(f"parse error at line {node.start_point.row + 1}")
            stack.extend(reversed(node.children))

    nonblank = {row for row, line in enumerate(data.split(b"\n")) if line.strip()}
    rows = set()

    def walk(node):
        if node.type in COMMENTS:
            return
        children = node.children
        if not children:
            end = node.end_point.row - (node.end_point.column == 0)
            rows.update(range(node.start_point.row, end + 1))
            return
        if suffix != ".rs":
            for child in children:
                walk(child)
            return
        if any(child.type == "inner_attribute_item" and test_attribute(child, data)
               for child in children):
            return
        attributes = []
        for child in children:
            if child.type == "attribute_item":
                attributes.append(child)
            elif child.type in COMMENTS:
                continue
            else:
                if not any(test_attribute(attr, data) for attr in attributes):
                    for attr in attributes:
                        walk(attr)
                    walk(child)
                attributes = []
        for attr in attributes:
            walk(attr)

    walk(tree.root_node)
    return len(rows & nonblank)


def source_counts(root: Path) -> dict[str, int]:
    files = set()
    for current, directories, names in os.walk(root):
        directories[:] = [
            name for name in directories
            if name not in EXCLUDED_DIRS
            and not Path(current, name).is_symlink()
            and not (Path(current, name).relative_to(root).as_posix() + "/")
            .startswith(EXCLUDED_PREFIXES)
        ]
        for name in names:
            path = Path(current, name)
            if not path.is_symlink() and is_source(path.relative_to(root)):
                files.add(path)
    counts = {}
    for path in sorted(files):
        relative = path.relative_to(root).as_posix()
        try:
            counts[relative] = effective_lines(path.read_bytes(), path.suffix)
        except ValueError as error:
            raise ValueError(f"{relative}: {error}") from error
    return counts


def validate_baseline(value: dict) -> dict[str, int]:
    if not isinstance(value, dict) or set(value) != {"version", "cap", "files"}:
        raise ValueError("baseline must contain version, cap, files")
    if value["version"] != 1 or value["cap"] != CAP or not isinstance(value["files"], dict):
        raise ValueError("invalid baseline version/cap/files")
    for path, count in value["files"].items():
        if (not isinstance(path, str) or Path(path).is_absolute()
                or ".." in Path(path).parts or Path(path).as_posix() != path
                or not is_source(Path(path)) or type(count) is not int or count <= CAP):
            raise ValueError(f"invalid baseline entry: {path!r} = {count!r}")
    return value["files"]


def baseline_value(files: dict[str, int]) -> dict:
    return {"version": 1, "cap": CAP, "files": dict(sorted(files.items()))}


def check_counts(counts: dict[str, int], baseline: dict[str, int]) -> list[str]:
    errors = []
    for path, count in sorted(counts.items()):
        limit = baseline.get(path, CAP)
        if count > limit:
            errors.append(f"{path}: {count} effective lines > {limit}"
                          + (" (legacy ceiling)" if path in baseline else ""))
        elif path in baseline and count < limit:
            errors.append(f"{path}: baseline {limit} is stale (now {count}); run --ratchet")
    for path in sorted(baseline.keys() - counts.keys()):
        errors.append(f"{path}: stale baseline for missing/excluded source; run --ratchet")
    return errors


def check_baseline_diff(current: dict[str, int], previous: dict[str, int]) -> list[str]:
    return [
        f"{path}: baseline cannot be added or increased ({previous.get(path, 'new')} -> {count})"
        for path, count in sorted(current.items())
        if path not in previous or count > previous[path]
    ]


def previous_baseline(root: Path, ref: str) -> dict[str, int] | None:
    # Distinguish an initial rollout from an invalid ref or a failed git command.
    subprocess.run(["git", "rev-parse", "--verify", f"{ref}^{{commit}}"],
                   cwd=root, check=True, capture_output=True)
    listing = subprocess.run(["git", "ls-tree", "--name-only", ref, "--", BASELINE_PATH],
                             cwd=root, check=True, capture_output=True, text=True)
    if not listing.stdout.strip():
        print("Initial baseline rollout: review every legacy entry before merging.", file=sys.stderr)
        return None
    result = subprocess.run(["git", "show", f"{ref}:{BASELINE_PATH}"],
                            cwd=root, check=True, capture_output=True, text=True)
    return validate_baseline(json.loads(result.stdout))


def main() -> int:
    args = argparse.ArgumentParser(description=__doc__)
    args.add_argument("--root", type=Path, default=ROOT)
    args.add_argument("--baseline", type=Path)
    args.add_argument("--baseline-ref", help="git base ref; reject new/increased baseline entries")
    mode = args.add_mutually_exclusive_group()
    mode.add_argument("--bootstrap", action="store_true", help="initial rollout only; refuses to overwrite")
    mode.add_argument("--ratchet", action="store_true", help="only decrease/remove existing legacy ceilings")
    options = args.parse_args()
    root = options.root.resolve()
    path = options.baseline or root / BASELINE_PATH
    try:
        counts = source_counts(root)
        if options.bootstrap:
            if options.baseline_ref:
                raise ValueError("--bootstrap cannot be combined with --baseline-ref")
            value = baseline_value({name: count for name, count in counts.items() if count > CAP})
            with path.open("x") as output:
                output.write(json.dumps(value, indent=2) + "\n")
            baseline = value["files"]
        else:
            baseline = validate_baseline(json.loads(path.read_text()))
        if options.baseline_ref:
            previous = previous_baseline(root, options.baseline_ref)
            if previous is not None:
                errors = check_baseline_diff(baseline, previous)
                if errors:
                    raise ValueError("\n".join(errors))
        if options.ratchet:
            updated = {name: count for name, count in counts.items()
                       if name in baseline and count > CAP}
            errors = check_baseline_diff(updated, baseline)
            errors += [f"{name}: new file exceeds {CAP} ({count})"
                       for name, count in counts.items() if name not in baseline and count > CAP]
            if errors:
                raise ValueError("\n".join(errors))
            path.write_text(json.dumps(baseline_value(updated), indent=2) + "\n")
            baseline = updated
        errors = check_counts(counts, baseline)
        if errors:
            raise ValueError("\n".join(errors))
    except (OSError, ValueError, subprocess.CalledProcessError) as error:
        print(f"code-line lint FAILED: {error}", file=sys.stderr)
        return 1
    print(f"code-line lint OK: {len(counts)} source files, cap {CAP}, "
          f"{len(baseline)} non-growing legacy entries")
    return 0


if __name__ == "__main__":
    sys.exit(main())

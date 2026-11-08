---
description: "Use when editing Rust business logic, widgets, WASM, MCP tools or Rust tests in this repository."
applyTo: "crates/**/*.rs"
---

# Rust maintenance

- Follow [coding standards](../../CODING_STANDARDS.md) and
  [development harness](../../DEVELOPMENT.md); review with [REVIEW.md](../../REVIEW.md).
- New business files: at most 500 effective code lines; tests are exempt.
  Legacy oversize files cannot grow. Run the checker and tighten reduced baselines.
- Keep public imports stable when splitting; preserve command/undo/version semantics.
- Keep platform-free code wasm32-clean; typed errors and explicit resource ownership.
- CanvasKit widget_host changes need explicitly enabled CanvasKit tests, not only default workspace tests.
- Every independent task needs [notes](../../docs/notes/README.md) with exact validation results.
- Generate the task before coding; verify its explicit Task-ID and review affected
  [knowledge](../../docs/kb/AGENTS.md) before finishing. Do not reuse historical notes.

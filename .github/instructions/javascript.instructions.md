---
description: "Use when editing JavaScript, TypeScript, Node runtime, SDK adapters, browser bridges or their tests."
applyTo: "**/*.{js,mjs,cjs,ts,tsx,jsx}"
---

# JS/TS maintenance

- Follow [coding standards](../../CODING_STANDARDS.md),
  [commands](../../COMMANDS.md) and [development harness](../../DEVELOPMENT.md).
- New business files: at most 500 effective code lines; tests are exempt.
  Legacy oversize files cannot grow. Generated output is not a source owner.
- Preserve asynchronous ordering, cancellation, input validation and error causes;
  use finally for owned browser/process/GPU resources.
- Keep design semantics in Rust commands; wire tool discovery, dispatch and actual UI.
- Lint changed JS/TS with the task base ref; test the production Node/WASM seam.
- Add/update this task's [notes](../../docs/notes/README.md), including skipped and unrun checks.
- Start with a generated Task-ID, review affected [knowledge](../../docs/kb/AGENTS.md),
  and pass explicit-task verification before finish; source changes invalidate KB provenance.

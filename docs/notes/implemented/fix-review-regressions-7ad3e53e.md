# Fix asset store upgrade regressions, style catalog tests, empty rich text formatting, and clean obsolete design code.

Record-Version: 2
Task-ID: 7ad3e53e-e359-4363-b1da-bc4dcda32cdf
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T12:15:22.875414+00:00
Type: fix-bug
Status: complete

## Context

Fix asset store upgrade regressions, style catalog tests, empty rich text formatting, and clean obsolete design code.

## Changes

Retired template rows no longer prevent the shared asset store from opening and remain hidden without being deleted. Opening an existing document atomically imports supported document-local styles and theme presets once per shared target, honors previous migration markers, and does not overwrite an existing ID or resurrect deleted assets. Style guideline tests now use the current Talkdesk Cobalt catalog. An empty styled text caret falls back to the text node's base style so toggles can affect subsequent input.

In the SS integration, removed the unused template catalog and template-preview route; fixed explicit target collisions, draft-local tool search, independent gallery radio groups, POC-to-Synapse route recognition, session/gallery-scoped submission and queue cancellation, stale target validation, unresolved-image reporting, and unsafe automatic conflict acceptance. A conflict preserves the current editor canvas and pauses autosave. The embedded Web host also stops its own automatic remote acceptance so the host can protect pending edits. The live generation draft remains read-only pending a separately verified concurrent editing path.

## Validation

- `node --test packages/dsh-node-runtime/asset-store.test.mjs packages/dsh-node-runtime/asset-directory.test.mjs packages/dsh-node-runtime/asset-tools.test.mjs`: 27 passed.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 189 passed, 8 skipped; browser-only tests require explicit opt-in.
- `cargo test -p op-editor-core --lib`: 1276 passed, 1 ignored.
- `cargo test -p op-mcp --lib`: 542 passed.
- `cargo test -p op-host-web --lib --features canvaskit`: 782 passed, 29 ignored.
- `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets`: passed; clippy reported warnings.
- SS plugin full serial Node suite against the staged runtime: 478 passed; after the final integration refactors, 147 focused tests passed against the restaged runtime. SS package typecheck, build, runtime smoke and `pnpm doc-check` passed; two focused Vitest files passed 19 tests.
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/property-panel-browser.test.mjs packages/dsh-node-runtime/canvas-theme-browser.test.mjs packages/dsh-node-runtime/ai-design-loop.test.mjs`: 5 passed using isolated documents and Chrome.
- An extended SS ESLint invocation across changed integration modules reported 12 complexity/parameter-count errors and 19 warnings in existing integration code; a focused lint of the modified UI, queue and image modules passed.
- `vet` for the two dirty worktrees could not run within its configured $0.01 limit; it reported `DollarLimitExceeded`. This is not a passed review.
- `bash tools/check-maintenance.sh --base 6644990089bc122113f967a3dbabf5cf6d41665d --task 7ad3e53e-e359-4363-b1da-bc4dcda32cdf`: passed; `git diff --check` passed for both worktrees.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Reviewed empty styled text caret behavior and one-time import of supported document-local assets.",
      "sha256": "1b42a498f3e401f9bedccf7d71fb375c19c9bef182c0bc1d4c433b972e2b4da5"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Verified supported legacy imports and protected embedded editor conflict handling.",
      "sha256": "a8e5dd5c3c991efc8d8193fb04d853d2d7823c7052835b3bd0229939392acfe1"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Retired templates are deliberately not restored. An unresolved image provider is reported but cannot supply the missing assets. The read-only live draft does not support simultaneous human edits during generation. Browser/model and staged-runtime results are recorded separately; a deterministic model double is not real-model acceptance. Existing unrelated worktree changes were retained.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-editor-core/src/text_selection.rs",
      "before": "d5a3eb5ef4ff3361ffe76c0ba08a1440c1beafc632cd83967c7cb661f8b564a1",
      "after": "270195a858b26d0a27ece525db94258ecc543877cd7b60b913499ae34a9a7956"
    },
    {
      "path": "crates/op-editor-core/src/text_selection_summary.rs",
      "before": "243572aeb3bd71f6b104e01587a30632db64e4299f97f730e90a01c5bf80d5e8",
      "after": "adb1df6ef6b63d135351fbfc3ce91f26e16e58b35ff57547f2d9bae2280f6609"
    },
    {
      "path": "crates/op-host-web/src/live_sync_conflict.rs",
      "before": "3e5d22f98efd85cc21e204e15033800f635533591cb13424dfece1bf41418e1b",
      "after": "3ac9cb92125e3f7bfa0520060fd61ace2120af3b6bb0196192fe6b4e1224897f"
    },
    {
      "path": "crates/op-host-web/src/live_sync_glue.rs",
      "before": "eb2e3e4dd8dfaff1e73a754f14187662a08a2ad1780a92d2e6b52ded4e5ecd06",
      "after": "41578bf3cfe1a737545d5e4d7b4ffbf7e6c4dc8cdc1754388e6142a725f24d8d"
    },
    {
      "path": "crates/op-mcp/src/guidelines_tools.rs",
      "before": "c2082619f5dab08083c1206d0fa5135e5b99142edad429113fc70077dbc540a6",
      "after": "1ee61aa3e2be55c44c9f7359db5a5126f9dead108939fbefedd09e776f95833e"
    },
    {
      "path": "crates/op-mcp/src/mcp_read_tests.rs",
      "before": "0bed691aeaa8229ee4fc298bb25d540585bc7710179734394ee4b63d9316f29e",
      "after": "c41f8ecaefff5bf253494a85db1fddc5907f920cc5cee6c3b47fd55efd7a4efa"
    },
    {
      "path": "docs/kb/product.md",
      "before": "e6e22ff890f3b301900d23e3eebd5f5cfb901b68a5d80e3321cb5d5f59899ac4",
      "after": "1b42a498f3e401f9bedccf7d71fb375c19c9bef182c0bc1d4c433b972e2b4da5"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "f5455e4a1e777051a37535cc3d448b37bbe21fc1fe0117e8b39868c196aca38d",
      "after": "a8e5dd5c3c991efc8d8193fb04d853d2d7823c7052835b3bd0229939392acfe1"
    },
    {
      "path": "packages/dsh-node-runtime/asset-directory.mjs",
      "before": "5af435ae85d2130c27b1b6b27e52f5a9b279109c0dd494a081243b54c8b042cb",
      "after": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7"
    },
    {
      "path": "packages/dsh-node-runtime/asset-directory.test.mjs",
      "before": "3b030f798dd418b24d84b61eda2ce10de898b61711560883aa8d27f3f61ae43e",
      "after": "db59adb6bc09e94d512c86d91bb78ad58a0ec7a176cddffd0eb18917c2f515a0"
    },
    {
      "path": "packages/dsh-node-runtime/asset-store.mjs",
      "before": "1ac2e71d2e47465db223a87b316d584d845f54d52a7534208546ab1e1029e511",
      "after": "b6c5a3a2d9b284e6399cc0cb8942d3973982c45c300d2f92092c35385114ef68"
    },
    {
      "path": "packages/dsh-node-runtime/asset-store.test.mjs",
      "before": "0d4fd5e18ea2611ebe5f3aa3387a1c5caab9e5edb7a10da006315f562bf5b8d4",
      "after": "8badb38e655c1c36bb927175aa18862b8fa3bf90144b53f1d5f79f2c82a007dc"
    }
  ]
}
```

Completed-At: 2026-11-10T13:03:59.362186+00:00

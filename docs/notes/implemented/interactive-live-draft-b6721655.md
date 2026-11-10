# Enable safe interactive design drafts, synchronize selection at submit, and fix SS integration ESLint errors.

Record-Version: 2
Task-ID: b6721655-aac8-44fd-9c80-b538ced3ac29
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T13:06:36.452357+00:00
Type: fix-bug
Status: complete

## Context

Enable safe interactive design drafts, synchronize selection at submit, and fix SS integration ESLint errors.

## Changes

- Allow authenticated live-draft canvas edits, serialize them with AI writes, and reject stale document versions. Checkpoint successful edits before acknowledging them; roll back or retire the draft if recovery cannot be verified.
- Flush and lock the attached canvas before publication and explicit close. Preserve visited editor tabs across chat switches and keep drafts independently owned by their chat.
- Capture canvas selection against the native submitted-message ID and timestamp. Keep a bounded editor-side history, retry selection notifications in order, and fail closed when the original target cannot be verified.
- Extract functions in the SS design plugin to resolve the 12 reported ESLint errors and 27 more found by a full plugin-source lint run. Extract the Rust bridge and selection queue modules without increasing the legacy source-size limits.
- Build the current Rust/Node runtime and stage it, together with the rebuilt plugin, under `synapse-studio-dsh/plugins/ss-dsh-design` for local testing. The previous staged runtime was preserved.

## Validation

- `cargo test -p op-host-web --lib --features canvaskit`: 786 passed, 29 ignored.
- `cargo test -p op-editor-core --lib selection_capture_request_is_strictly_parsed`: 1 passed. The web-host `selection_` tests passed 24 cases.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`, with isolated `DSH_HOME` and `DSH_ASSET_DIR`: 189 passed, 8 skipped.
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/property-panel-browser.test.mjs packages/dsh-node-runtime/canvas-theme-browser.test.mjs packages/dsh-node-runtime/ai-design-loop.test.mjs`: 5 passed.
- In `plugins/ss-dsh-design`, `node --test --test-concurrency=1 tests/*.test.mjs` with isolated `DSH_HOME` and `DSH_ASSET_DIR`, `DSH_E2E_CHROME=1`, and `DSHPLUGIN_DESIGN_SOURCE_RUNTIME` pointing at the staged runtime: 494 passed. This includes a real Chromium/CanvasKit live-draft edit, checkpoint, selection capture and publication-barrier test.
- In the SS workspace, `pnpm exec vitest run --config vitest.config.ts plugins/ss-dsh-design/test`: 19 passed. `pnpm --filter @synapse-studio/ss-dsh-design typecheck`, plugin build, and `test:runtime` passed. `pnpm exec eslint plugins/ss-dsh-design/src` passed with 0 errors and 36 warnings.
- `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets`, and `tools/check_code_line_cap.py --baseline-ref 6644990089bc122113f967a3dbabf5cf6d41665d` passed; Clippy retained existing warnings.
- `bash packages/dsh-node-runtime/build-engine.sh`, `bash packages/dsh-node-runtime/build-web.sh`, and the plugin's `node scripts/stage-local-runtime.mjs` completed. The staged and source Web and engine WASM checksums matched.
- `bash tools/check-maintenance.sh --base 6644990089bc122113f967a3dbabf5cf6d41665d --task b6721655-aac8-44fd-9c80-b538ced3ac29` passed. The SS `pnpm doc-check` passed.
- An initial focused Node run without the required runtime environment failed to locate the skill file; rerunning against the staged runtime passed. The optional `vet --model gpt-4.1-mini --max-spend 0.01` review did not run because the estimated cost exceeded its configured limit.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Selection history and ordered retries change the editor-to-host selection boundary.",
      "sha256": "2dea81c6bf9a45dc4824c51b7e5c9ecd95a040e9646164dc5237b078f100e08f"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Interactive private drafts and message-bound selection change the product editing behavior.",
      "sha256": "bf50f953ec33c4f26c9ee2a8f6e839bea42cc58ebac5babeb51b406ba183ea1c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The staged runtime is a local dirty-worktree build, not a release-verified package. No real DSH desktop session or real model was started; the user will perform that acceptance. The automated browser and model-loop checks do not establish autonomous model behavior. Ambiguous or stale submission-time selections deliberately require the user to reselect rather than applying an edit to a later target.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "535ec442e34b8e74eda26e588339be5aaaeb04ddeca98244302984397c91db9b",
      "after": "7e48dda7beb4d4a85a2d2d129d72f965011aabba5069567cbd896198db06114f"
    },
    {
      "path": "crates/op-editor-core/src/bridge_protocol.rs",
      "before": "76420bff1536240f7ab090b2fdf16f199872f681eafdabff4150d65c53bd79a5",
      "after": "7797cc7ac863d799a8358049a334dfbfea052fbd78e56eb4aa2bad55aec409be"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/mount.rs",
      "before": "1ef7e2e2c08f70a8140364e11819a053c15d7f466e7e060fc73d849cf90433c6",
      "after": "9d6639241c7051702903219a1f18fb31b15befc4b50f262a4e4f8cdd5f3dc092"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/mount_keyboard.rs",
      "before": "66c006da2abdbc748d3c426b11de05c6d911381fd1d967c075fb439ef63f43a3",
      "after": "14733985448414a0eeaa03eecc167cf2b364b658b2c36f15f2c730fcf63b98ad"
    },
    {
      "path": "crates/op-host-web/src/lib.rs",
      "before": "bfe152429a7713570e6d03aced53c6a3e6d207ee1f1d0f7cc891ec5c92358202",
      "after": "565d424a59faae1a69cbff37e1b7ac01d5fca9c46f12793933ce22389e2bf3a5"
    },
    {
      "path": "crates/op-host-web/src/live_sync_glue.rs",
      "before": "41578bf3cfe1a737545d5e4d7b4ffbf7e6c4dc8cdc1754388e6142a725f24d8d",
      "after": "05029e909c98e92fa9c463eacf5d16bfe92e91c12b623366f1662cea5ac27477"
    },
    {
      "path": "crates/op-host-web/src/selection_push_queue.rs",
      "before": null,
      "after": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge.rs",
      "before": "22d70d69ae076d9e7882396fa96b384aa8606d6035274dded0ea1af374db8f3e",
      "after": "c946a25829b0fee6890c63ef47b820c2e5cb3c0bca351560dc4dfde72604669b"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge/selection_history.rs",
      "before": null,
      "after": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6"
    },
    {
      "path": "crates/op-host-web/src/vscode_bridge/startup.rs",
      "before": "1238a11d37b123358546a802095e714218a6480020f1039753fe864861932932",
      "after": "aa31a7d8b1f1cfc782813bcf332900b1fc848f85786df08325da93c1650f6d0c"
    },
    {
      "path": "docs/kb/product.md",
      "before": "1b42a498f3e401f9bedccf7d71fb375c19c9bef182c0bc1d4c433b972e2b4da5",
      "after": "bf50f953ec33c4f26c9ee2a8f6e839bea42cc58ebac5babeb51b406ba183ea1c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "a8e5dd5c3c991efc8d8193fb04d853d2d7823c7052835b3bd0229939392acfe1",
      "after": "2dea81c6bf9a45dc4824c51b7e5c9ecd95a040e9646164dc5237b078f100e08f"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "0a0b36d25b56a84b18c4700c65b540e2c24abb9d8fdac2b6bb179088c367369b",
      "after": "702c3f8a2ccc2f1728cfdf84c1ee9ddc8e94bef3a1f799c6031302ed3d9b9829"
    }
  ]
}
```

Completed-At: 2026-11-10T14:16:31.718958+00:00

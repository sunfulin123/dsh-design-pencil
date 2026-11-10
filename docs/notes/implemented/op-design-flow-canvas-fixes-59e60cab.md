# Repair OP style approval, enforce OP-only design workflows, categorize styles, and clarify editor canvas boundaries.

Record-Version: 2
Task-ID: 59e60cab-d63f-490b-8fbc-144f1b7867c8
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T04:05:05.484838+00:00
Type: fix-bug
Status: complete

## Context

Repair OP style approval, enforce OP-only design workflows, categorize styles, and clarify editor canvas boundaries.

## Changes

The core catalog now supplies a stable application category and a SHA-256 fingerprint of each complete style guide. Built-in categories live in the existing DESIGN manifest; uncategorized user imports remain visible. The OP skill explicitly requires native OP design, reference-scope reconstruction, editable structures, real screenshot review, and honest failure reporting.

The editor shows a one-screen-pixel boundary on unselected top-level frames and groups without adding document content or screenshot chrome. The host palette no longer replaces the editor's light and dark canvas defaults. The property-panel AI action is removed while the host retains automatic selection context.

The companion DSH plugin binds user style choices to the owning Session and original gallery, restores pending galleries from session results, verifies the selected guide fingerprint, and marks consumed galleries in result metadata. Explicitly refreshing an unavailable or changed guide retires the old gallery; within a clearly delimited design task a prior direct user style decision can survive a clarification. The style picker filters categories in a bounded scrolling region. The Host captures selected targets at inbox insertion and uses the DSH tool registry to isolate OP tasks from general writes and HTML routes.

## Validation

- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --all-targets`: passed, existing warnings retained.
- `cargo test -p op-host-web --lib --features canvaskit --quiet`: 780 passed, 29 ignored.
- `cargo test -p op-editor-ui --lib editor_root_outline_is_not_part_of_scene_preview`: passed.
- `node --test packages/dsh-node-runtime/asset-tools.test.mjs packages/dsh-node-runtime/design-style-plan.test.mjs`: 12 passed, including all 85 style categories and fingerprints.
- `node --test packages/dsh-node-runtime/*.test.mjs`: 183 passed, 1 failed, 7 skipped while Clippy and host tests ran concurrently; the 20k-node read median was 109 ms against the 100 ms limit. `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` passed 184 with 7 skips without changing the threshold.
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/ai-design-loop.test.mjs packages/dsh-node-runtime/property-panel-browser.test.mjs`: 4 passed, including real CanvasKit; these use scripted calls, not a real autonomous model.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/canvas-theme-browser.test.mjs`: passed after correcting the test to use the supported theme query rather than an uninitialized embedding bridge.
- `bash tools/check-maintenance.sh --base 6644990089bc122113f967a3dbabf5cf6d41665d --task 59e60cab-d63f-490b-8fbc-144f1b7867c8`: passed, including source line caps, harness lint, and knowledge provenance.
- Core `build-engine.sh` and `build-web.sh`: passed. The resulting local worktree runtime was staged into the companion plugin and its Host and Client built successfully.
- The focused DSH suite passed 47 tests, including real tool-registry nested dispatch and isolated Chrome gallery interaction. A staged-runtime suite passed 6 tests including CanvasKit and publication with a model double. A later 27-test style/discovery/source-runtime suite passed against the staged package, exercising bare `S1`, restart, stale/removed styles, and earlier direct style decisions; the full plugin run also covers these scenarios.
- `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=<staged-runtime> pnpm --filter @synapse-studio/ss-dsh-design test`: 399 passed and 22 failed. These match the prior unfinished baseline: five retired app-agent cases, one removed plugin-quality module, and sixteen former quality/enrichment/visual-review expectations. Their equivalence to the current runtime remains unverified. Full output: `/tmp/op-design-host-tests-final5-59e60cab.log`.
- Companion Host `pnpm run doc-check`: 46 passed and documentation checks passed. The optional `vet` review could not run because its configured model credentials were unavailable.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Review OP style catalog metadata, selection handoff, and editor canvas appearance against the implementation.",
      "sha256": "f111667bd274b6c5ffc9f1e002a89f4b001742794c4c5c260d3428958d9b1e66"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "updated",
      "reason": "Review editor-only root outlines and authored page background precedence.",
      "sha256": "e7eeb21f219b7683a543bcd915312d1b693369e50fc32988f2a38df52456e923"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Review style catalog metadata and full-guide fingerprint used by the host confirmation flow.",
      "sha256": "cb5bbf538576ef416339084902470d7ecb45ebdad96f784f069758a4baa96292"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The real model was not run; the user requested to start and test the application themselves. The 22 existing plugin-suite failures remain open and include quality-gate behavior, so they must not be represented as complete coverage. The unrestricted external clients outside the DSH registry are not covered by its task-scoped guard. Before the first gallery exists, an ambiguous conversation without a recognizable new-task boundary can still require the user to choose a style.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "bd2366583178796439e74d8a8f8ad59a44f79d11c76e484bd5ed94e97b474b67",
      "after": "62a1f4c50699b83d45589d535149d9b4ea70d50a383c7d07f6d9c5ef80617d16"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/manifest.json",
      "before": "da782227966914c2a1266e2bdfd6ccb2202c192dd8ba03579200c6e10b78c36d",
      "after": "9efb1e9f0b41fa6b237659ef26c9db64df313d6ac53eec870da0590e7fd81a12"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-op-design/SKILL.md",
      "before": "4bde67cc0792ba32c175e1ce7e69da33d6adc4e3fab7fe33003f831102c36abc",
      "after": "ff4482d34fca5d1e5f6b1548147470102d10c1161976462a30b3bdccac1f5d9c"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_semantics.rs",
      "before": "12fa2dd72346eb70198981a0f5e514c01f773a6bb881f5853e5a6c2c3251a8d7",
      "after": "e824cc1cae2126e23c8c556a521a01a70a5858d4ce8739df4086ca1dda6ffdae"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport.rs",
      "before": "dfe5a63a5c750f917d8cdb3844124889c002a6dc010d6c4f2f60985478327532",
      "after": "00c5ceeeb524c31d4c6160344d615f4b782d7b995b82ceb4990e08dad537e3b8"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport/builders.rs",
      "before": "9d265e6966188db51e0d87b8e2d0ec8bd972f6ad2a5a9a4c57e89de3b56f70cb",
      "after": "78d74d82e87d398d322667d80eecca4a4c919d117f0674bb47e3890a3b775e84"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport/root_boundaries.rs",
      "before": null,
      "after": "374fff8dfefa02124a11d409cbef005c3e99efb60971eb5ab3dcfaad5bbfca1e"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_tests/scene_paint.rs",
      "before": "a8be0ec3aae63c7366752b0e421ff4bf66feccd0741cc449095dd10ac60d65a0",
      "after": "31c06e7a334068492de86e327322674cbfdaa58ec977caba1abb37beb486c601"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel/hit.rs",
      "before": "85781d733791c82e8f62c495ec9c39f19ea3e611e8fe2ffd1ca9155bd121912a",
      "after": "eda2583b4ac326d355ee1485f1de9a35d83533c39d80ee6513fe2be7f0912392"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_action.rs",
      "before": "cab8156e98784840ee6329ad04bab3ac07dd91b3f49089fd4d3302fb244d6932",
      "after": "67946940b39af1b9b0bf53325f081aba299a39a8e8bb1bc9161b84516e3da4ef"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_collab.rs",
      "before": "383993be381401e364b4d9715cbcf99d2b8b7cf1d6b22a62c7c50c5012cafb01",
      "after": "96341136ada92aeff2304954188e733f26ea0bcf2831b29f95b38a57d75c431c"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_dispatch.rs",
      "before": "547be1b7e4abd8d849afbb5a49ef60e2e6470090fdd481f08d5ec31504e0c0a9",
      "after": "e884f79f67190b76d3ee289626862e307b30a2fb97bb4268364a819b7e2f697d"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_header.rs",
      "before": "09a5cad7ccb0ae199d5b0a94633e38c338f4fc685d6c032026b627b70e045fa8",
      "after": "6404dc9432c7648f9e226422fbfd3495f07240fa9569af85001dd626bfc414d4"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_layout.rs",
      "before": "a296d328d05fffb546e390d8e96dec7076e9d05704b695a6e7dba83332dcea61",
      "after": "3382ea495acd80a8791053145d8ec5b2382f6987e3e5401f72dcf06b64c9d551"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_sections.rs",
      "before": "fadce7ae488e5561c4b32ee084f9e98b397a5d42652997cae212594a55b84172",
      "after": "df31dfb95ab39bae9dd45a44f756bece31c479e9afafc9970239933b9a346230"
    },
    {
      "path": "crates/op-host-web/src/web_clipboard.rs",
      "before": "72dfe4eb3e37b86403d58ff25da180da5bc80eb7a617bcfc85461c12f1505b07",
      "after": "99a5719ff1cda613df019fe36ddbb6268f6c2400ec91da6ac5923c2f140b166b"
    },
    {
      "path": "crates/op-host-web/src/widget_host/property_dispatch.rs",
      "before": "d5fcec983ef1c74ca7f89baf067b2bdb5064bb250ff8469d71e7b9f638293da1",
      "after": "df708022651bc4ef49657b0b808786adb5f522c46ec7e2b95450cd49ac896035"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "a7c63fa6f683031d26e8a74964f46ba0732a37b95ef6154b35ecb55a069a07e7",
      "after": "e7eeb21f219b7683a543bcd915312d1b693369e50fc32988f2a38df52456e923"
    },
    {
      "path": "docs/kb/product.md",
      "before": "e756bda2017eab4b1cc236e9bbe95c6e8adcea675303794929636e0e7bcec088",
      "after": "f111667bd274b6c5ffc9f1e002a89f4b001742794c4c5c260d3428958d9b1e66"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "d5cef581020bee5f956427398ecc2b86cda2bdc41bd9d21d7bf4ac0fa76c65a5",
      "after": "cb5bbf538576ef416339084902470d7ecb45ebdad96f784f069758a4baa96292"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.mjs",
      "before": "e563af8232e5afc63c97b5479b6bdf0efc18417dea9f9508901a1e8c74c7224a",
      "after": "5aef23a27f2165cda16647908a140e24c84f3653f03ec1601655fb1bc2fcbc80"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.test.mjs",
      "before": "9c8dfb46d31429de45153f643f2f4fb6e40337301c39f5bbdc8592411482f68c",
      "after": "d8aad9cf6f405e4e1c39b47582670dde1ddd44e5708193109e8927b885e60ce8"
    },
    {
      "path": "packages/dsh-node-runtime/canvas-theme-browser.test.mjs",
      "before": null,
      "after": "1fcdbb5f674a3b19900ef3a07bbaa4f5d01cde762e0f0e18b7382fcb5d97c637"
    },
    {
      "path": "packages/dsh-node-runtime/property-panel-browser.test.mjs",
      "before": "5f193943bf8e4e19839d1595f59528fd43667c7bf3fabc2a482d2514d9814e94",
      "after": "a398025243603a0725cdef8d72430c00a6ffe1a981d17ec7360c23cb79a409ce"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "e357742b93bf5154bc7bbeae0ea51d0b561c3fcabc514d070009cd3938fd94ae",
      "after": "d1ee3d415b2f21fc2e7177da98ee81a194c90e224a9fca5ac7a67727b2f12991"
    }
  ]
}
```

Completed-At: 2026-11-10T05:00:33.864369+00:00

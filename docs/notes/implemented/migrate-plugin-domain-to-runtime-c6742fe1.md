# Migrate pure design domain modules (visual evidence, glyph ink measurement, PNG codec, device frames, draft/review/POC validators, and daemon/MCP client helpers) from ss-dsh-design into dsh-node-runtime

Record-Version: 2
Task-ID: c6742fe1-95ed-4d96-a9e5-66814297e374
Base-Ref: 316a6e5330bfd2795d7c7da72123321fadcf7e18
Started-At: 2026-11-12T08:35:49.971796+00:00
Type: refactor
Status: complete

## Context

`synapse-studio-dsh/plugins/ss-dsh-design` previously carried ~4,000+ lines of host-independent OpenPencil/Synapse design domain logic alongside DSH session/sandbox/UI adapter code, duplicating domain concepts outside `dsh-design-pencil`. Moving pure domain rendering, validation, decoration, and protocol modules into `packages/dsh-node-runtime/` establishes a clean boundary: `dsh-design-pencil` owns design domain logic and runtime protocols, while `ss-dsh-design` owns only DSH Cordis registration, `dsh-fs` sandbox confinement, session/turn state, HTTP preview/editor grants, and React client views.

## Changes

- Added 14 TLA-free ESM domain modules under `packages/dsh-node-runtime/` (each well under the 500 effective code-line cap):
  - Visual evidence & glyph ink measurement: `png-rgba-codec.mjs`, `glyph-ink-measurement.mjs`, `canvaskit-scene-env.mjs` (auto-detecting both source `./web-bundle` and staged `./bin/web-bundle`), `visual-evidence-styles.mjs`, `visual-evidence-painter.mjs`, `selection-visual-evidence.mjs`.
  - Document decoration & code-context sanitization: `device-frame.mjs` (lazy `import('./engine-session.mjs')` inside `measureRootWithRuntime` so synchronous `createRequire` callers never hit top-level `await`), `design-code-context.mjs`.
  - Draft canvas, quality pagination, review receipt, and POC ledger gates: `draft-canvas-contract.mjs`, `draft-quality-gate.mjs`, `draft-review-gate.mjs`, `poc-evidence-validator.mjs`.
  - Managed daemon & loopback MCP protocol helpers: `managed-mcp-client.mjs`, `managed-daemon-client.mjs`.
- Added `packages/dsh-node-runtime/plugin-domain-migration.test.mjs` covering RGBA PNG round-trips, CanvasKit exact glyph rendering and ink centering, device frame decoration and filtering, draft contract/lint/quality/review gates, POC evidence ledger validation, and MCP/skill helpers.
- Updated `ARCHITECTURE.md`, `docs/kb/product.md`, and `docs/kb/runtime-mcp.md` to document runtime ownership of these domain modules.
- Staged the updated runtime into `synapse-studio-dsh/plugins/ss-dsh-design`, deleted 7 internal duplicate files (`canvaskit-environment.ts`, `visual-evidence-painter.ts`, `visual-evidence-text.ts`, `visual-evidence-styles.ts`, `glyph-ink-measurement.ts`, `design-draft-roots.ts`, `design-draft-finish-review.ts`), and replaced migrated implementations with thin typed host wrappers via `src/runtime-bridge.ts` while keeping `src/editor-ai-target.ts` browser-isomorphic for `src/client/*`.

## Validation

- Passed: `node --test packages/dsh-node-runtime/plugin-domain-migration.test.mjs packages/dsh-node-runtime/package.test.mjs` (6/6 passed).
- Passed: `bash tools/check-file-line-cap.sh` (`2798 source files, cap 500, 231 non-growing legacy entries`).
- Passed: `rm -rf .history && bash tools/check-maintenance.sh --base 316a6e5330bfd2795d7c7da72123321fadcf7e18 --task c6742fe1-95ed-4d96-a9e5-66814297e374 --lint-js`.
- Passed (downstream `ss-dsh-design`): `tsc -p tsconfig.json --noEmit`, `tsc -p tsconfig.client.json --noEmit`, `node scripts/build.mjs`, `eslint` on all 17 modified TypeScript files (0 errors), `node --test --test-concurrency=1 tests/*.test.mjs` (504 tests: 483 passed, 0 failed), live source-runtime integration suite (11/11 passed), `node scripts/test-node-runtime.mjs`, Vitest (`19/19` passed), and `node scripts/docs/doc-check.mjs`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented runtime ownership of pure visual evidence, device frame, draft review, and POC validator domain modules",
      "sha256": "8486474a83f6a61e6085c9b920b0c6dd8806475828a75f233a681e1ca05f286e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Verified TLA-free ESM runtime domain modules, dual web-bundle layout discovery, and staged host integration",
      "sha256": "00ae30c9d88f688e2cc79e76adb4e5ca0d9a8fb08ec1542a638b034e425833a6"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Compatibility: All public `lib/*.js` exports in `ss-dsh-design` retain identical TypeScript signatures and runtime behavior while delegating implementation to `packages/dsh-node-runtime/*.mjs`. `install-runtime.mjs` `nodeRuntimeFiles` was intentionally left unchanged so synthetic minimal archive tests continue passing, while `stage-dsh-runtime.mjs` hashes and stages every non-test `.mjs` module automatically.
- Constraint: Runtime modules loaded synchronously by Node >= 24 hosts via `createRequire` must remain free of top-level `await`; any dependency on `engine-session.mjs` must stay behind dynamic `import()` inside async functions.
- Rollback: Revert the new `.mjs` modules in `packages/dsh-node-runtime/` and restore the corresponding TypeScript wrappers in `ss-dsh-design/src/`, then re-stage `runtime/`.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "7e48dda7beb4d4a85a2d2d129d72f965011aabba5069567cbd896198db06114f",
      "after": "4b7ac79add132b8160cd941228eeb6c41a6307c8a5a36cb582ee57f6268f4d7c"
    },
    {
      "path": "docs/kb/product.md",
      "before": "8f8ddcf9f02f71c80c4fc5f31712a5b1be19ba91427b5ad80e97f5ff41707251",
      "after": "8486474a83f6a61e6085c9b920b0c6dd8806475828a75f233a681e1ca05f286e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "88acf6978621d74723997b2ec4391cc018e6c04b3b490f01c962f44b5a2c2766",
      "after": "00ae30c9d88f688e2cc79e76adb4e5ca0d9a8fb08ec1542a638b034e425833a6"
    },
    {
      "path": "packages/dsh-node-runtime/canvaskit-scene-env.mjs",
      "before": null,
      "after": "6d8ce6115d9d6ca0605289f8b672bc39cb4229d9e6d00616a5f128c5294e9131"
    },
    {
      "path": "packages/dsh-node-runtime/design-code-context.mjs",
      "before": null,
      "after": "a97288c415bea6dc1ac695deca1e91c01a595d6c932ffe83e90823b1ade5e5f9"
    },
    {
      "path": "packages/dsh-node-runtime/device-frame.mjs",
      "before": null,
      "after": "dd38bfa8577554ad9be31ff6a4e29110d992603214be70be4b50890c64ed11ea"
    },
    {
      "path": "packages/dsh-node-runtime/draft-canvas-contract.mjs",
      "before": null,
      "after": "e83f9752eb823bb0a7bc26a77fdacbee0c0b051576f3e65b16eceaa62f916c83"
    },
    {
      "path": "packages/dsh-node-runtime/draft-quality-gate.mjs",
      "before": null,
      "after": "89382aaa79a14a7dfd29c9141b3c9538804c81a1c208540f2b83be2dec9c2f62"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.mjs",
      "before": null,
      "after": "ec234eeeebdc5391b96cc3518916f523c17e403b5bdafad2419a9c860d0889bd"
    },
    {
      "path": "packages/dsh-node-runtime/glyph-ink-measurement.mjs",
      "before": null,
      "after": "c26d485d811121b511968f8e752908a74572d3610421ebf381bc2ea615db5ea3"
    },
    {
      "path": "packages/dsh-node-runtime/managed-daemon-client.mjs",
      "before": null,
      "after": "4477fa8eb6cce9aa5148b19e80cb446e0787cd336db476f87efee784ac1b2ca4"
    },
    {
      "path": "packages/dsh-node-runtime/managed-mcp-client.mjs",
      "before": null,
      "after": "786ecf166cd5f6d31a02f313f20d5215c76e68fb05263c70430fb2a2474779b6"
    },
    {
      "path": "packages/dsh-node-runtime/plugin-domain-migration.test.mjs",
      "before": null,
      "after": "7e5dae8d115c7729623e45789d773580b825ba6bbf897fd4b266c1b51d38d675"
    },
    {
      "path": "packages/dsh-node-runtime/png-rgba-codec.mjs",
      "before": null,
      "after": "7788a0d4ae566bd8b0640b4acd2026612a8cbf8ac6815e604b6ffb0c43932483"
    },
    {
      "path": "packages/dsh-node-runtime/poc-evidence-validator.mjs",
      "before": null,
      "after": "4a3b31ca6fee925c79a68f5584baca7b3a429c99f2614a6ccc90174ee5f2f9ae"
    },
    {
      "path": "packages/dsh-node-runtime/selection-visual-evidence.mjs",
      "before": null,
      "after": "edc871f259adb1b329a91b3b373ecffe1c4d2f4ed3d1fc1e2bf459510773b57e"
    },
    {
      "path": "packages/dsh-node-runtime/visual-evidence-painter.mjs",
      "before": null,
      "after": "aa1b0474feb2758b0f5589bfc5c8e1c1cdfbcacf467683d4f03977292d68adee"
    },
    {
      "path": "packages/dsh-node-runtime/visual-evidence-styles.mjs",
      "before": null,
      "after": "e3e108c48464feb60a1d5632ac397aa669eb8bf533adf4602ab18d4ecedc27d5"
    }
  ]
}
```

Completed-At: 2026-11-12T09:20:05.657065+00:00

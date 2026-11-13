# Fix 4 P1 and 5 P2 review findings across root layout height, Chrome sandbox, POC mobile viewport, DESIGN font extraction, fileExists check, verify-source paths/copy-lint IDs, and renderer readiness/fidelity

Record-Version: 2
Task-ID: 986280d7-ad15-4a04-b9db-108f267f1320
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-13T01:36:39.019329+00:00
Type: fix-bug
Status: complete

## Context

Fix 4 P1 and 5 P2 review findings across root layout height, Chrome sandbox, POC mobile viewport, DESIGN font extraction, fileExists check, verify-source paths/copy-lint IDs, and renderer readiness/fidelity

## Changes

- **P1-1 — Root artboard height expansion vs fixed-viewport `900 -> 902` (`crates/op-pen-loader/src/layout_repair.rs`, `packages/dsh-node-runtime/design-canvas-plan.mjs`):** Reverted `height_can_expand_to_content_or_root` so unclipped numeric roots (`clipContent != Some(true)`) expand to fit overflowing content without truncation (`300 -> 512`), while `planDesignCanvas` seeds `clipContent: true` on `fixedViewport: true` (`explicit` `1440×900` / `390×844`) roots so fixed-viewport shells honour their exact declared height (`900 == 900`). Also restored `.ok()?` JSON fallback parity in `crates/op-editor-core/src/ref_resolve/typed_expand.rs`.
- **P1-2 — Headless Chrome OS sandbox (`packages/dsh-node-runtime/chrome-cdp.mjs`):** Removed default `--no-sandbox` from shared headless Chromium flags (only allowing opt-in `OPENPENCIL_CHROME_NO_SANDBOX=1`).
- **P1-3 — Exact mobile layout viewport in `capture-poc.mjs` (`crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs`):** Restored `mobile: false` in `Emulation.setDeviceMetricsOverride` and verified `window.innerWidth === width` so `<500px` mobile captures (`390` / `375`) never lay out at Chrome's `980px` missing-viewport-meta fallback.
- **P1-4 — Catalogue-wide `DESIGN` font extraction (`packages/dsh-node-runtime/design-spec-fonts.mjs`, `font-resolution.mjs`, `script-prelude.mjs`):** Added structured YAML frontmatter `typography:` and scoped Markdown `## Typography` parsing (role bullets, `### Font Families` tables, `### Hierarchy` font columns) with strict prose rejection, verified across all 85 bundled style guides (`talkdesk-cobalt` -> `Roboto`, `design-md:nintendo-2001` -> `Arial Black / Arial`, `design-md:sap` -> `72 Brand Variable`), and applied node defaults in `R()` as well as `I()`.
- **P2-1 — Genuine `fileExists` check (`ss-dsh-design/src/design-draft-finish-publish.ts`):** Replaced hardcoded `fileExists: true` with `verifyPublishedFileExists` checking `services.fs.lstat` and `fs.stat(pending.processPath)` after `writeText`.
- **P2-2 & P2-3 — Scoped `review/`/`shots/` exclusion & real `copy-lint` rule IDs (`verify-source.mjs`):** Scoped `review/` and `shots/` exclusion strictly to task-output directories so nested project directories like `src/review/` remain tracked, and aligned `app` copy-lint noise filtering with real `copy-lint.mjs` rule IDs (`copy-stat-strip`, `copy-eyebrows`, `copy-footer-signoff`, `copy-stale-year`, `copy-proof-figure`, `copy-rhythm`).
- **P2-4 & P2-5 — Verified exact CanvasKit multi-board `synapse_design_render` & consistent `rendererReadiness` (`ss-dsh-design/src/editor-host-mcp.ts`, `editor-host.ts`, `tool.ts`, `design-discovery-tool.ts`, `draft-review-gate.mjs`):** Added `renderDocumentFrames` capturing all visible active-page boards with `isolate: true` and checking `structuredContent.renderer` (`canvaskit-headless` / `canvaskit-editor`) before reporting `fidelity: "exact"`, attached `rendererReadiness` across all non-cancel `discovery` branches, and clarified `finish` without `review` wording.

## Validation

- `PATH="$HOME/.cargo/bin:$PATH" cargo fmt --all -- --check` — passed.
- `PATH="$HOME/.cargo/bin:$PATH" cargo clippy --workspace --all-targets` — passed (0 errors).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test --manifest-path crates/op-pen-loader/Cargo.toml -p op-pen-loader --lib layout_repair_tests` — passed (18 passed, 0 failed).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test -p op-host-web --lib --features canvaskit` — passed (788 passed, 0 failed, 29 ignored).
- `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh && PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-web.sh` — passed.
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` — passed (262 passed, 0 failed, including 85-guide font extraction and sandbox-enabled Chromium E2E).
- Host plugin (`synapse-studio-dsh`): staged local runtime, `npx eslint plugins/ss-dsh-design/src` (0 errors), `npx tsc --noEmit -p plugins/ss-dsh-design/tsconfig.json` (0 errors), `npm --prefix plugins/ss-dsh-design run build` (passed), `node --test --test-concurrency=1 plugins/ss-dsh-design/tests/*.test.mjs` (500 passed, 0 failed, 21 skipped).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Documented default OS sandbox preservation in chrome-cdp.mjs (opt-in OPENPENCIL_CHROME_NO_SANDBOX=1 only).",
      "sha256": "5b7624e55c45e57e1c0a8f62faef6e983b5ba6cc441cd9e4d5a9eb0a74eacb65"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented task-scoped review/shots exclusion, capture-poc mobile:false + innerWidth verification, 85-guide DESIGN font extraction, verified fileExists, all-stage discovery rendererReadiness, and verified CanvasKit multi-board synapse_design_render.",
      "sha256": "dbc335de5b5ff0a40f8fef64b7a3ff61c94c43f0e5f3589c6acc3be948b4eecc"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Documented unclipped root expansion vs fixedViewport+clipContent:true height preservation and R() DESIGN font defaults.",
      "sha256": "6e8dfdaaf8dc84c33a4a07e7963223799415c27b8e7afbcf1b42817e4d09bf50"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- `extractDesignSpecFonts` covers all 85 bundled catalogue guides; custom user-imported `DESIGN.md` files that describe fonts only in freeform narrative paragraphs outside `typography:` frontmatter or `## Typography` tables/bullets will leave `designSpec` unset rather than guessing from prose.
- Remaining minor review items outside P1/P2 (such as enforcing a dedicated question ID gate for Stage C's replica-vs-upgrade prompt or testing live prototype visibility relayout in interactive preview mode) remain documented for future follow-up if needed.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "1bff306e45669d3c2ab13fee3d613a5000941a6642a4ef72214a54c68008227f",
      "after": "b137ce4afba69f513623dd997c46c2dc0a9dca9b38aee5672a9a5a295b127f98"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-source.mjs",
      "before": "bdf20839e4112614d62f2a776c18443f21ef7cf02e4e9ac91ac2567d01bdfec5",
      "after": "6adefb68938454b4bab1fef58b4bdd766d49c52adba0292ff1e7f3b4027f3453"
    },
    {
      "path": "crates/op-editor-core/src/ref_resolve/typed_expand.rs",
      "before": "e9130cea9c12696e6d43ec8a9bedfd8fa41aa6ae459a95802cb32b4f979dfeeb",
      "after": "117758e63af50bf960cb9e72e3b2820344a2a38268bbba76c26a13121868ac1b"
    },
    {
      "path": "crates/op-pen-loader/src/layout_repair.rs",
      "before": "c1a1fae40f114a4d3349498fda2cdb2dee53d9584a236774a1a7189a26896274",
      "after": "61160fbdb0476558ec8759be9b75fa50659a558f5beabfaafbc23be77afcbde3"
    },
    {
      "path": "crates/op-pen-loader/src/layout_repair_tests.rs",
      "before": "e7efc098672e717738445a1bd727d307f088dcd08087aac9f8d32bf8f4d107a0",
      "after": "a061c40d6d84594028837e05b10d6c146cb8f954772a1710b4d0fc3b1b4309c6"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "738dd6646ce36f041bd8891c0c2e22d9cf59e149acde8bc36a34a59c1c60e42b",
      "after": "5b7624e55c45e57e1c0a8f62faef6e983b5ba6cc441cd9e4d5a9eb0a74eacb65"
    },
    {
      "path": "docs/kb/product.md",
      "before": "46cac4b686c5fe0efccf2c3b12b20154a381710fb7f3762245ab0f98f02507f8",
      "after": "dbc335de5b5ff0a40f8fef64b7a3ff61c94c43f0e5f3589c6acc3be948b4eecc"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "c39469ad9c3ca61cede73a4234e1934396ee9b7edbb3dfe962e1f255f42ce1be",
      "after": "6e8dfdaaf8dc84c33a4a07e7963223799415c27b8e7afbcf1b42817e4d09bf50"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": "5c8110795c0fac8fc8a8a63c8dbcc4f0877467f660f65f7dd8a0ffe0ac11083e",
      "after": "55f483266d2c0b231e4d22329a0f1b972b635e0960ef7541c9c5eabc6fe8419f"
    },
    {
      "path": "packages/dsh-node-runtime/design-canvas-plan.mjs",
      "before": "393ca86904976d925304aba36906f8f5831ce6db18167fa057e69f049344381b",
      "after": "677299d1011b953f99363c542981d7dfc98a7a6feb3d890e48e479bfa550a41e"
    },
    {
      "path": "packages/dsh-node-runtime/design-capabilities.test.mjs",
      "before": "81e1f1e1db521319b7595b1962cc937820c388222d347ef466369ed4d064e69b",
      "after": "337f0b789b12fec177ed8970b64853460468ded052c82f18bf81323b20d5bdf9"
    },
    {
      "path": "packages/dsh-node-runtime/design-spec-fonts.mjs",
      "before": null,
      "after": "2631c2650fdf3d93f5d3d7e7decf616721b5547c611384b2a580d2cc011650ac"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.mjs",
      "before": "894faf8d14728c87f62f09dedd101f7783ab12361bdabbb6400c099d0b3cfa30",
      "after": "e73282d119171b72a771c9c3e4507d324bf25623ea1474fec7869bcc6a9e0128"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.mjs",
      "before": "df5908624efcdf25560741be6044c648d107c4e9516e84a78e7186bb7fb65786",
      "after": "b19c4d56ef54cd8f25511337ce03963dd604a66d2a28b713914d307cbb83eb55"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.test.mjs",
      "before": "524d1c3c3ad295c1feb2fc2cc246ff64faf6e4c4ba54cf9c9584e5701fa01b6f",
      "after": "58bc30b10a8326dedd529b329fbd261135a646e8e30e0aec0547cbb27d13a7b1"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": "553c256bd2468114d8ec6fbb4ee5ac746c6eb0ec711f0d75e279fb1e22e960aa",
      "after": "ef79b9bfa67fbed8214547aeab1f5531550f69908dd1b86faa1a7c45a53ae86a"
    },
    {
      "path": "packages/dsh-node-runtime/script-prelude.mjs",
      "before": "17a6d731f948c5139633fbd92e29a14771beae349d516b8905b74b744b168398",
      "after": "f93cf95742f25d7bc18fd039404cfd626b146e41b61d7b7b0a21e37126bfa057"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "1bff306e45669d3c2ab13fee3d613a5000941a6642a4ef72214a54c68008227f",
      "after": "b137ce4afba69f513623dd997c46c2dc0a9dca9b38aee5672a9a5a295b127f98"
    }
  ]
}
```

Completed-At: 2026-11-13T02:19:27.089159+00:00

# Fix design-spec-fonts oxlint rule and bump DSH Node/WASM runtime to 0.8.5-synapse.6

Record-Version: 2
Task-ID: ef08f5ab-a364-4926-ad54-cb375445f031
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-13T06:53:53.380517+00:00
Type: tooling
Status: complete

## Context

Downstream `Talkdesk/synapse-studio#464` (`@synapse-studio/ss-dsh-design`) requires a published `0.8.5-synapse.6` Node/WASM runtime release bundling the `synapse-design/3` + `synapse-design-html/3` staged guidance, runtime-owned workflow/tool text (`design-workflow-text.mjs`, `design-tool-text.mjs`), discovery/POC/review gates, font-spec resolution, and the hardened headless Chromium + nested macOS Seatbelt auto-fallback. Additionally, `packages/dsh-node-runtime/design-spec-fonts.mjs` had a `unicorn(prefer-string-starts-ends-with)` oxlint error blocking `check-maintenance.sh --lint-js`.

## Changes

- Replaced `/^--/u.test(span)` with `span.startsWith('--')` in `packages/dsh-node-runtime/design-spec-fonts.mjs` so `check-maintenance.sh --lint-js` passes cleanly.
- Bumped `@sunfulin123/dsh-design-pencil-runtime` and `OPENPENCIL_DSH_RUNTIME_VERSION` from `0.8.5-synapse.5` to `0.8.5-synapse.6` across `packages/dsh-node-runtime/package.json`, `packages/bun.lock`, `.github/workflows/dsh-runtime-release.yml`, `packages/dsh-node-runtime/package.test.mjs`, `scripts/check-dsh-runtime.test.mjs`, and `packages/dsh-node-runtime/README.md`.
- Rebuilt `packages/dsh-node-runtime/build-web.sh` alongside `build-engine.sh` so the staged `node-wasm` payload matches current workspace Rust sources.

## Validation

- Passed: `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets`
- Passed: `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-web.sh`
- Passed: `node --test packages/dsh-node-runtime/package.test.mjs packages/dsh-node-runtime/font-resolution.test.mjs scripts/check-dsh-runtime.test.mjs` (`21 passed, 0 failed`)
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (`168 packages`)
- Passed: `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6 --task ef08f5ab-a364-4926-ad54-cb375445f031 --lint-js`
- Passed: `.venv-lint/bin/python -m unittest discover -s tools -p test_maintenance_entrypoints.py`

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Bumped @sunfulin123/dsh-design-pencil-runtime version to 0.8.5-synapse.6 in packages/bun.lock; runtime and MCP invariants in runtime-mcp.md are unchanged.",
      "sha256": "af05280b9484358cc2bce2485847fa6c88f0debb8a14dbd69bb615a18f2a87b7"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Compatibility: `0.8.5-synapse.6` preserves the `schemaVersion: 2` `node-wasm` manifest contract while shipping the new runtime workflow/domain modules and nested-sandbox Chromium fallback.
- Rollback: Pin `runtime-release.json` back to `0.8.5-synapse.5` if reverting downstream `ss-dsh-design`.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "73e3f16e553f0e3c6ac6a0139021f7516383015e5d764070bacfd97d7e3f6494",
      "after": "cf2f546b50fddc99de0f1a7f2ba1fb6708793e4ada63242a22832b1a2447aad5"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "011cb36da953e5bd94c59dbc2b07454c94703ac0db5f42d5300637e1245244fa",
      "after": "af05280b9484358cc2bce2485847fa6c88f0debb8a14dbd69bb615a18f2a87b7"
    },
    {
      "path": "packages/bun.lock",
      "before": "377168e3785ac2323fe54122c1511936c8476f15c35fa5639e4374880f7cdc4c",
      "after": "42fe41837c9683c3a5477fa0d2c2567ab2ef3a9bbf9d1a91fffb749f1c1c599e"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "e0eb7ca4560a1cd6d1d4425dd26b904d7fe95e23cba30978f511c101edb9f069",
      "after": "4a3b387c08841f7f0cc7354dc1e7e6e1e29d1ff85f7d98cbebac55bf5d858981"
    },
    {
      "path": "packages/dsh-node-runtime/design-spec-fonts.mjs",
      "before": "2631c2650fdf3d93f5d3d7e7decf616721b5547c611384b2a580d2cc011650ac",
      "after": "b2d04b58f5dc1374f63e0dca92708f7e4b77934fbffb6f5ebe5c130ac8fa4658"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "c7f2a67ff438aa2e239e774dc8d425ddeb8df96e5ff868cf572cef7dd6981de3",
      "after": "a273c01af4a2bf1c7fc1bd8736755925a3d0a79fc6d57ac443cbe75a2e6fd144"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "bdd48f90240266f013a83ddfd8bb45602554a621840717e5dcd2fe3c85c58024",
      "after": "c8a96b8f8ee6cf879c046f663925d36c5c0e9ad90dc9d5d2a2134e24fbe96fbb"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "08460ef53bab99e17b59b534d4b7df7d6737c2966f2e87caf7594ec2f62ee1c3",
      "after": "3c63c1f98e93ced7c5d04fe1bc4c7e548b6e5f852de641f484786c5dd664b307"
    }
  ]
}
```

Completed-At: 2026-11-13T06:59:50.236509+00:00

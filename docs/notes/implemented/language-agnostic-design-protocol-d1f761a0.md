# Replace hardcoded Chinese/English natural-language matching across Node runtime, Rust design lint, and core design skill with language-agnostic structured contracts and geometric/schema checks

Record-Version: 2
Task-ID: d1f761a0-d872-4e1a-9dc7-cbb83a180249
Base-Ref: 316a6e5330bfd2795d7c7da72123321fadcf7e18
Started-At: 2026-11-12T06:02:16.720651+00:00
Type: refactor
Status: complete

## Context

Replace hardcoded Chinese/English natural-language matching across Node runtime, Rust design lint, and core design skill with language-agnostic structured contracts and geometric/schema checks

## Changes

- Replaced natural-language regex parsing in `packages/dsh-node-runtime/design-style-plan.mjs` and `packages/dsh-node-runtime/design-canvas-plan.mjs` with deterministic structured parameters (`styleMode`, `styleId`, `platform`, `width`, `height`) and updated schemas in `crates/op-dsh-engine/src/asset_catalog.rs`.
- Replaced natural-language node-name substring heuristics in `crates/op-design-lint` (`widget_a11y.rs`, `structure.rs`, `missing_progress_ring.rs`) with language-agnostic schema `role` checks, mask-glyph/reveal-icon traits, and bar-series/ring geometry checks.
- Updated `crates/op-ai-skills/skills/synapse-design/SKILL.md` and `build.md` to enforce active conversation language neutrality, fixed positional `ask_user_question` route options (`options[0]` HTML POC first, `options[1]` direct Synapse design), structured style/canvas/POC/cancel contracts, and `secure: true` + `role: "password"` on sensitive inputs.
- Rebuilt engine and web WASM bundles, updated Node runtime and Rust lint tests across multilingual fixtures, and staged the runtime into `synapse-studio-dsh/plugins/ss-dsh-design` alongside matching protocol-only plugin updates.

## Validation

- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --all-targets`: passed (0 errors).
- `cargo test -p op-design-lint -p op-ai-skills -p op-dsh-engine --lib`: passed.
- `cargo test -p op-host-web --lib --features canvaskit`: passed.
- `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh`: passed.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 211 passed, 0 failed, 11 opt-in Chrome E2E tests skipped (`DSH_E2E_CHROME` not set).
- `synapse-studio-dsh/plugins/ss-dsh-design` staged integration (`node --test --test-concurrency=1 tests/*.test.mjs`, `tsc --noEmit`, `eslint`, `doc-check.mjs`): 502 passed, 0 failed, 1 skipped; 0 ESLint errors; all 8 `doc-check` gates passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Replaced hardcoded natural-language route/style phrasing with conversation-language neutrality, positional route options, and structured styleMode/styleId/platform parameters",
      "sha256": "6b96b6d188355a392df3845c2679966387f7650a2c18050eb175cb24dc9d7fb1"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Updated widget/structure/ring lint invariants and structured plan_design_style/plan_design_canvas schemas after removing natural-language regexes",
      "sha256": "29e6ce1c66b50a5526f93a0907299f2e2da1c2be24471a2f48e2fa07d8660698"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Structured `styleMode`, `styleId`, `platform`, and `route` rely on the LLM translating arbitrary human languages into schema fields per `synapse-design/SKILL.md`, while host state transitions (`ask_user_question` option order, gallery receipt tokens, turn counters, and `poc_handoff` turn gates) remain enforced deterministically in code.
- Opt-in browser Chrome E2E suites (`DSH_E2E_CHROME=1` in `dsh-node-runtime` and Playwright desktop E2E in `synapse-studio-dsh`) were not run in this headless pass.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "3b3a0dc51442c4759696bb4e46e3101e4a47f836fddc27052ab1554d9a780ea2",
      "after": "03db557fc4e78426a88f225905d9a5b77402bebf0dd41d62999279623f39fd43"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/build.md",
      "before": "33e70a4089f9334c758b690b0b8f3dac7dd08e06106712f7aeb5dab06febf8b7",
      "after": "47fbbd780ec857a3cd65df70df49551f3e6460df7a838c44a272e406b8969d29"
    },
    {
      "path": "crates/op-design-lint/src/detectors/structure.rs",
      "before": "b625c3742fe5a62cbd70eceb9356480264e02f6388992317311e58a6f459be9c",
      "after": "036226e35b383bf21dab52e51c6cdb63c1258d9e36136db4f977a330366c996e"
    },
    {
      "path": "crates/op-design-lint/src/detectors/widget_a11y.rs",
      "before": "5b37dd82ebbd4c7cc00cf94f40923e887b86205d6301249559ca332c0781dd31",
      "after": "2adc20f6bc58b4420b303241e297b4af21162ad9ccec7b7c7487a7223844cca0"
    },
    {
      "path": "crates/op-design-lint/src/missing_progress_ring.rs",
      "before": "c63d7ef04e5f56151fbef5a572065709b024890224a42db1d9f46e54a7f2b9fb",
      "after": "7effc53c70ff37530707e150aedc53619cdcc308c0ef705b64ad6d186503797c"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_catalog.rs",
      "before": "3257cc1974621905047204b462986ae6d25f27cbff57f2f205be902a766b29e5",
      "after": "0ccc4df25086e05e929cc9e2f359a95f8eadc611cd4053043bb0f4f8651e365d"
    },
    {
      "path": "docs/kb/product.md",
      "before": "c5c4f34dbe1ec8f2293465f973cd2c70a958603502efc6e062ef044ee05014ba",
      "after": "6b96b6d188355a392df3845c2679966387f7650a2c18050eb175cb24dc9d7fb1"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "9764ce5548468abc778fef57de76b68f9c5e93edafa50c8e54ff4af0b9fb88ac",
      "after": "29e6ce1c66b50a5526f93a0907299f2e2da1c2be24471a2f48e2fa07d8660698"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.test.mjs",
      "before": "18f54fdbf86b3f1ea7086edd12b021ba7d31d619af2b2606fe273a2008cf2ccd",
      "after": "7c0299be539cc37df19a971e3da02d47b4d0fefcbfdaffc2bb2ab9f00dd5eb7d"
    },
    {
      "path": "packages/dsh-node-runtime/design-canvas-plan.mjs",
      "before": "f3c780f638f328741849f4f14e8bfd43b7be1f9f00a3f27bf9b7793477ba5e9e",
      "after": "393ca86904976d925304aba36906f8f5831ce6db18167fa057e69f049344381b"
    },
    {
      "path": "packages/dsh-node-runtime/design-capabilities.test.mjs",
      "before": "beee54f334adf5da33f2436e1367bc2fdb969ba0e4f765250460c6feaf6b795f",
      "after": "81e1f1e1db521319b7595b1962cc937820c388222d347ef466369ed4d064e69b"
    },
    {
      "path": "packages/dsh-node-runtime/design-style-plan.mjs",
      "before": "d9c39a8bb75a580697619b1ae9b462760d6bf88f631505d0d8df141cb5014725",
      "after": "0cce1c3a4cb801a5a369cc5843bf6b7449b22313e6aed4bc96d60d3a1c841255"
    },
    {
      "path": "packages/dsh-node-runtime/design-style-plan.test.mjs",
      "before": "4dd95fbd3c7d7eb474912d243e19ac37a7e3f153e880b574c59f964172846581",
      "after": "261b2f13a5ac9846ee16b0a386a4f6002d75119f19eb9ea04be27d19d9818df2"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.test.mjs",
      "before": "87a08cc50fd26b6798b275ae9477e10bc2333b227c5135a7a0d8b657030387a7",
      "after": "1230331c3780636f06fc9546a66f2b2c3865526983fe6a631e9c48500bbda046"
    }
  ]
}
```

Completed-At: 2026-11-12T07:02:49.179803+00:00

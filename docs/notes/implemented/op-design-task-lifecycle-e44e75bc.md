# Implement renamed OP design skill, Project funnel, recoverable concurrent design sessions, and unified review paths

Record-Version: 2
Task-ID: e44e75bc-ac58-4311-89c7-7f272825a03d
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T07:43:58.044973+00:00
Type: feature
Status: complete

## Context

Implement renamed OP design skill, Project funnel, recoverable concurrent design sessions, and unified review paths

## Changes

Renamed the runtime-owned OP skill to `synapse-design` and updated the bundled runtime guidance. The DSH design plugin uses an explicit context funnel, permits approved Project context and collaboration tools, preserves unfinished owner-bound drafts and style choices under `.synapse/op-design`, and isolates editors by chat with serialized same-file conflict checks. The independent HTML skill now uses `.synapse/html-design`. Node design scripts reject missing parents and preflight variable-bearing scripts in an isolated engine before mutating the live document.

## Validation

- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --all-targets`: passed with warnings.
- `cargo test -p op-host-web --lib --features canvaskit`: 780 passed, 29 ignored.
- `cargo test -p op-mcp --lib strict_parent_rejects_a_missing_parent_without_emitting_a_command`: one passed.
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 193 passed, including real Chrome/CanvasKit checks. An earlier parallel run had one performance-budget failure under concurrent build/test load; the serial run passed.
- In the DSH host, plugin typecheck and build passed; the complete plugin suite reported 423 passed and 22 failed. The failing names exactly match the 22 failures recorded before this task. The isolated policy, style, draft recovery, and editor lifecycle suite passed 82 tests, and the real runtime screenshot/publication suite passed five tests using a model-route double.
- The core and independent HTML skills passed `skill-creator` validation. DSH `pnpm run doc-check` passed.
- `vet` could not run: neither `ANTHROPIC_API_KEY` nor `ANTHROPIC_AUTH_TOKEN` was available. No real model provider was contacted.
- `SYNAPSE_E2E_RECORD_VIDEO=0 pnpm exec playwright test --grep 'dsh-design (collects context|follows an explicitly selected local HTML skill)'` in the DSH host: two passed in an isolated Electron profile. The funnel scenario checks Project context lookup, a real Project file read, style selection, draft creation, and resuming the same draft after changing models. The first attempt exposed an optional Cordis service-injection error, which was fixed before the passing run. Both scenarios use deterministic model doubles.
- After extracting the preflight and parent-resolution seam, `node --test --test-concurrency=1 packages/dsh-node-runtime/script-expansion.test.mjs packages/dsh-node-runtime/engine-session.test.mjs packages/dsh-node-runtime/package.test.mjs` passed 25 tests, including missing generated parent IDs and rollback. The legacy code-line ceiling was ratcheted downward.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "The OP skill was renamed and its context-first workflow and workspace paths were updated.",
      "sha256": "345e71ff40b531dc6669dffe5d7ed16ffc6e37805c880c83d21dba87918fbfef"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "The script preflight and parent-resolution seam preserves legacy operations while failing missing generated parents in strict mode.",
      "sha256": "31e07d92dc5938260d05883186968c22475d3c6840f93fab996ec304be5065e2"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The 22 existing plugin failures concern retired app-agent tests, removed plugin-specific quality rules, enrichment, and visual-review repair behavior; they are not represented as passing. A model double or a real browser screenshot does not prove that a real model asks appropriate questions or judges image quality. The user will start the application and test with their selected model and Project; no user host or design data was used as a fixture. The staged local runtime is built from a dirty worktree and is not a release artifact.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "62a1f4c50699b83d45589d535149d9b4ea70d50a383c7d07f6d9c5ef80617d16",
      "after": "535ec442e34b8e74eda26e588339be5aaaeb04ddeca98244302984397c91db9b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/README.md",
      "before": null,
      "after": "b7f7e895aabb15043608da62a9275c7217b628b3dde63f6706a90e05732fe42b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": null,
      "after": "2740131f30a838a61b8b33942d80549dfde4a002e06970039fadd35217276c8e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/composition.md",
      "before": null,
      "after": "fa5f102d46f55aba4512fd6117ff88408ae1c783f97d7eed3c485f39ef67a33c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/direction.md",
      "before": null,
      "after": "45c2609903257842dcd269e7f76161fb29bd53e439c6789e43390063f9a762e9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": null,
      "after": "69e1875bd816605d92a24b72afc64cb06485c7c565f43940fa0d174e82216ea2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-op-design/README.md",
      "before": "b7f7e895aabb15043608da62a9275c7217b628b3dde63f6706a90e05732fe42b",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-op-design/SKILL.md",
      "before": "ff4482d34fca5d1e5f6b1548147470102d10c1161976462a30b3bdccac1f5d9c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-op-design/composition.md",
      "before": "fa5f102d46f55aba4512fd6117ff88408ae1c783f97d7eed3c485f39ef67a33c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-op-design/direction.md",
      "before": "45c2609903257842dcd269e7f76161fb29bd53e439c6789e43390063f9a762e9",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-op-design/review.md",
      "before": "69e1875bd816605d92a24b72afc64cb06485c7c565f43940fa0d174e82216ea2",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/src/synapse_op_design.rs",
      "before": "574519dfe1f80b23a29b4759b73114095ef9603da55c346a7093ee61016c86fb",
      "after": "b5acb076ec30d575699ee6668ebd385201d79aa248a2eaff880fc48287773fe0"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog.rs",
      "before": "c4dcd63af6724fa16f0d2cf4a90d2f2d24778ab23006b1c240924fe54973a128",
      "after": "328a762641bfc6e199e2c95b0ebafe5fddb34387393118ea94cdda1098e83001"
    },
    {
      "path": "crates/op-mcp/src/batch_design_result.rs",
      "before": "16bedbfe6916123f313e8ab56b7e1ef4a094825e8dc8fcf08c2fcfd8c90ad710",
      "after": "02570bf0bcdbdf3baa059b94ab10383c472c27d6caf05e413ba0f46138d9e32b"
    },
    {
      "path": "crates/op-mcp/src/batch_design_state_tests.rs",
      "before": "d9bd2c931d6ee961bed1dcc1469c3c90b39aa5e497b4d0019c7ff8dc0edf647a",
      "after": "0bee01589a86d7390777bd12e139e9a6beaba68a8c2573dc339e6f31c824c6e0"
    },
    {
      "path": "crates/op-mcp/src/design_prompt_tests.rs",
      "before": "ce093152cf31ee4c9cb146b1b81aaed9c5c1a15cdf4eccce43b08fe0522b72c8",
      "after": "1996ffac76ed348eb73ff06a153511084776561446759e43ea0717f62c88ccd0"
    },
    {
      "path": "docs/kb/product.md",
      "before": "ee54bb80a7a62c537f3c74e3f839068b297eca630ce8105c73cf6bd7cdb25570",
      "after": "345e71ff40b531dc6669dffe5d7ed16ffc6e37805c880c83d21dba87918fbfef"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "01f6ce7aed25625da69775b86424d549ff84fed425e698c6db31b68ed458c2e2",
      "after": "31e07d92dc5938260d05883186968c22475d3c6840f93fab996ec304be5065e2"
    },
    {
      "path": "packages/dsh-node-runtime/build-engine.sh",
      "before": "a1c91b67747e1a8beaec7573055b3b205c97aabca22792daa7b3a4d2aecea4f1",
      "after": "146e985413bc80be2c6fe368f8c39953c108047f4367d469e22ba4f5fe7d5290"
    },
    {
      "path": "packages/dsh-node-runtime/design-script-preflight.mjs",
      "before": null,
      "after": "7238b1e69d09607ad2c9245f527021dc2f86a3357ecac68cfced45e7200b6235"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.mjs",
      "before": "c9fa3fa102f1e4f434b8728088c5b932c2dcd369684c31d309438b7bdfc4c5a9",
      "after": "7bc9e67523c821b8d72aabcf004be3fb9d0f2b0e5fefcdbcf34265ef3b50dc4c"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "95389adec1cad11c4df19a41dca35c5738f287ca5be8dfee2f78dfea4ea8737d",
      "after": "5b999364b2eb2ba8388fa1951884fcd8aa3d29566500afbf6d2d30b652089a1b"
    },
    {
      "path": "packages/dsh-node-runtime/script-expansion.test.mjs",
      "before": "5af38fcf1dc93ca497e701d47cc987e11c4c4cada5f71001f2b6ba3cd2956b99",
      "after": "54ffbc142a37c8631733cd847b182130452a78001ee678be5c0ce9ff0fcb3685"
    },
    {
      "path": "scripts/stage-dsh-runtime.mjs",
      "before": "618807a6edb32142144f6c5a4588bcc757ce7361bc4b078e79d318e2b2f5705d",
      "after": "4f0411d45978fc33d59ce88fa3bd740c7e4417403af992735694b47c8345b6a1"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "d1ee3d415b2f21fc2e7177da98ee81a194c90e224a9fca5ac7a67727b2f12991",
      "after": "9619106862e79e415887a4b4a9c6dfd09079f14275b7720d26ada564a7f193b0"
    }
  ]
}
```

Completed-At: 2026-11-10T08:49:43.500186+00:00

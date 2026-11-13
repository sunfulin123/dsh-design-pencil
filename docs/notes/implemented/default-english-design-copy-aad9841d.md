# Default authored UI copy inside designs to English unless the user explicitly requests another target UI language

Record-Version: 2
Task-ID: aad9841d-8c80-4c60-a2fe-a70a71bd01d4
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-13T02:24:26.505808+00:00
Type: feature
Status: complete

## Context

Default authored UI copy inside designs to English unless the user explicitly requests another target UI language

## Changes

- **Separated conversation language from design UI copy language (`crates/op-ai-skills/skills/synapse-design/SKILL.md`, `build.md`, `direction.md`, `review.md`, `crates/op-ai-skills/skills/synapse-design-html/SKILL.md`, `references/judgement.md`, `packages/dsh-node-runtime/design-workflow-text.mjs`):** Kept user-facing questions, summaries, option labels, and handover notes in the user's active conversation language, while requiring all authored UI text inside designs (both HTML POC prototypes and `.op` canvas nodes) to be written in **English by default** unless the user explicitly asks to design in another language (or when making a local edit to an existing non-English design). CJK typography and Noto heading rules now activate only when a CJK UI language is explicitly requested or already present in an edited document.
- **Embedded skill tests & runtime staging (`crates/op-ai-skills/src/synapse_op_design.rs`):** Added unit-test assertions locking in the default-English UI copy rule, rebuilt `op-dsh-engine` WASM + staged `wasm/design-skill.md` and `skills/synapse-design-html`, and restaged the local runtime into `ss-dsh-design`.

## Validation

- `PATH="$HOME/.cargo/bin:$PATH" cargo fmt --all -- --check` — passed.
- `PATH="$HOME/.cargo/bin:$PATH" cargo test --manifest-path crates/op-ai-skills/Cargo.toml -p op-ai-skills --lib` — passed (220 passed, 0 failed).
- `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh` — passed.
- `node --test packages/dsh-node-runtime/design-workflow-text.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs packages/dsh-node-runtime/package.test.mjs` — passed.
- Host plugin (`synapse-studio-dsh`): staged local runtime and ran `node --test --test-concurrency=1 plugins/ss-dsh-design/tests/design-workflow-text-ownership.test.mjs plugins/ss-dsh-design/tests/design-source-runtime.test.mjs plugins/ss-dsh-design/tests/design-finish-gates.test.mjs` — passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Updated product KB to distinguish conversation language from design UI copy (English by default in HTML POC and .op canvas unless another UI language is explicitly requested or preserved in a local edit).",
      "sha256": "a6c3906c3eb876952721b3331c1068ba8ef6dddd5c3209940aae1d0776e7d156"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Verified runtime-mcp invariants remain unchanged after adding default-English UI copy test assertions in synapse_op_design.rs.",
      "sha256": "19aeb0ebe46f3948e145cbaf4abbc7fa1400ad00d7c5da4c00a5a36597a03ecb"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- This policy is enforced via the embedded `synapse-design/3` and `synapse-design-html/3` skills and runtime tool guidance; deterministic lint does not reject non-English text automatically because users may explicitly request localized UI copy or edit existing non-English `.op` documents.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "a5ab14b684bf7628cc6bff88ae3b563d042e9042f71fa9fd36811b150d7f6bbf",
      "after": "694922b259e1ee4ffeb568d86bef94dca1e408f502a4d6840cbfad15e6217227"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/judgement.md",
      "before": "98e0168b0722c9db4583a050bee298e8956012c0fedd4b7ff1a736dfb175078c",
      "after": "6ceb793db47b10db2448abf24b2e1a7599efe55ee17c1bab0103a64d70061fd0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "dc7e2687ed30aa47c7ec170c3ca62b7711eb353c3eb585f4897d6c990f269877",
      "after": "72ae0ad4524d437918d92887501598ae246b245ede6ac2af88b831e0abf4e417"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/build.md",
      "before": "b769509295150eb6aa36318928cbca41a8ec68460be99a9b73ba165d69f8e182",
      "after": "061fcdd9e0b406be741f799afd8bfa5780ad47b891a0e0539525f282c78db01e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/direction.md",
      "before": "45c2609903257842dcd269e7f76161fb29bd53e439c6789e43390063f9a762e9",
      "after": "a1fa394979150efbcd8c6e4028ded5d9e5fc6b16f6f67e73d9cdcfbf183f0211"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "7df8ab9ec8512ca7ee19672e18b9fc4423a97ab978926a0e7c1f083a68a5d10c",
      "after": "b5fb28762adab2638ca3ba9a85eb4dbea80924fba439538453e1a370c0569872"
    },
    {
      "path": "crates/op-ai-skills/src/synapse_op_design.rs",
      "before": "c6f40d523106243157a239b37fccc7bfbd46af71f2c3b2c66f5f96205339c16e",
      "after": "0caf24dc6772dc67e1c6b50e68151ab323b3da4ddd59822d00e7721e5a17bb89"
    },
    {
      "path": "docs/kb/product.md",
      "before": "dbc335de5b5ff0a40f8fef64b7a3ff61c94c43f0e5f3589c6acc3be948b4eecc",
      "after": "a6c3906c3eb876952721b3331c1068ba8ef6dddd5c3209940aae1d0776e7d156"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "6e8dfdaaf8dc84c33a4a07e7963223799415c27b8e7afbcf1b42817e4d09bf50",
      "after": "19aeb0ebe46f3948e145cbaf4abbc7fa1400ad00d7c5da4c00a5a36597a03ecb"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": "fd0376338ecd5a3b04106126910675a992fd1ba75a507eb68030c6d45ee8f462",
      "after": "8b93bde875d0937494a49ad7e1b20ab658564e41de1e71b74234a62dfe9c02dc"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "a5ab14b684bf7628cc6bff88ae3b563d042e9042f71fa9fd36811b150d7f6bbf",
      "after": "694922b259e1ee4ffeb568d86bef94dca1e408f502a4d6840cbfad15e6217227"
    }
  ]
}
```

Completed-At: 2026-11-13T02:36:52.086484+00:00

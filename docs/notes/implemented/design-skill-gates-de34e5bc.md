# Strengthen Synapse high-fidelity and HTML POC design skills, shared craft/judgement guidance, step gates, and scoring eval

Record-Version: 2
Task-ID: de34e5bc-8311-431b-b61a-4c504205ce9e
Base-Ref: 78a7605ba46e417c49240629dcc9d36410c970f0
Started-At: 2026-11-11T07:03:15.050603+00:00
Type: feature
Status: complete

## Context

Strengthen `synapse-design` (editable high-fidelity canvas) and `synapse-design-html` (HTML POC) so new designs receive explicit OP engine build rules plus shared engine-neutral design judgement, execute numbered stages with explicit completion criteria, and enforce stage gates on context collection, POC handoff, touch-target pagination, and final publication review receipts. Preserve existing dirty worktree state and local-edit behavior.

## Changes

- Added `scripts/eval-synapse-design.mjs` and `packages/dsh-node-runtime/eval-synapse-design.test.mjs` defining the three canonical benchmark briefs (`enterprise-list`, `chat-interface`, `poc-to-synapse`) and scoring step completion, screen coverage, linked `ref` reuse, variable binding ratio, blocking lint, critical touch targets, and POC screen mapping against `EngineSession`.
- Added `crates/op-ai-skills/skills/synapse-design/build.md` (`op-design-build`) consolidating non-templated OP engine layout, skeleton-to-fill progression, row width math, text wrapping/overflow, CJK typography and punctuation discipline, variable/Cobalt token binding, and linked `{type:"ref"}` component reuse.
- Added `crates/op-ai-skills/skills/synapse-design-html/references/judgement.md` (`op-design-judgement`) shared by HTML POC and high-fidelity Synapse design (`Operate`/`Persuade`/`Read`/`Experience` surface modes, six content states, interface copy, 12-check Non-Negotiable Quality Floor, and five-dimension review rubric), and updated `craft-floor.md` to reference it instead of a removed `SKILL.md` Stage 3 section.
- Upgraded `synapse-design/SKILL.md` (`synapse-design/2`) and `synapse-design-html/SKILL.md` (`synapse-design-html/2`) to numbered stages with completion bars and a direct-MCP vs. DSH-draft tool mapping table; wired `op-design-build` and `op-design-judgement` into `synapse_op_design::prompt("full", ...)` (while keeping `local` and `bootstrap` compact), `get_design_prompt`, and `get_design_agent_prompt`; removed marketing `design-principles` from the operational `web-app` guideline topic.
- In `plugins/ss-dsh-design`, allowed `op-design-build`, `op-design-judgement`, `schema`, `cjk`, and `icons` prompt sections during OP tasks; required substantive `contextSummary` (`>= 40` chars) and explicit `screens` (`[{name, states?}]`) on context completion; returned a stage/screen `checklist` on `begin` and `remainingScreens` + layout guidance on `batch`; verified task-local `DESIGN.md` hash, `evidence-report.json` ledger, source fingerprints, screen coverage, and PNG viewport widths in `synapse_design_poc_handoff`; paginated `touchTargetsNextOffset` during `finish` validation; and enforced a structured `review` receipt (`screens` with existing non-empty `nodeId` or disclosed `omittedReason`, POC `pocScreenshot` + `differences`, `screenshotSha256`-bound five-dimension `visual` observations when an image was delivered, six `states`, `reuseNote` when reuse candidates remain without linked `ref` nodes, and a 3-strike `blocked_review_limit` cap).

## Validation

- `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets`: passed (existing non-blocking warnings only).
- `cargo test -p op-design-lint -p op-editor-core -p op-dsh-engine -p op-mcp -p op-ai-skills --lib`: all passed (`op-ai-skills` 218 passed, `op-dsh-engine` 92 passed, `op-mcp` 544 passed, plus `op-design-lint` and `op-editor-core`).
- `cargo test -p op-host-web --lib --features canvaskit`: 788 passed, 0 failed, 29 ignored.
- `bash packages/dsh-node-runtime/build-engine.sh` and `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 221 passed, 0 failed, 0 skipped.
- Staged updated runtime into `plugins/ss-dsh-design/runtime` via `scripts/stage-local-runtime.mjs`, ran `tsc -p tsconfig.json --noEmit`, `tsc -p tsconfig.client.json --noEmit`, `eslint src --no-error-on-unmatched-pattern` (0 errors, 37 warnings), `node scripts/build.mjs`, `node scripts/test-node-runtime.mjs`, and `node scripts/docs/doc-check.mjs` (46 doc-check tests + all link/wrap/terminology/budget/readme checks passed).
- In `plugins/ss-dsh-design`, `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=<staged-runtime> DSH_E2E_CHROME=1 node --test --test-concurrency=1 tests/*.test.mjs`: 513 passed, 0 failed, 0 skipped (including `design-finish-gates.test.mjs`, `design-poc-handoff.test.mjs`, `design-real-publish.test.mjs`, and `design-source-runtime.test.mjs`).
- Live LLM benchmark runs across the three canonical prompts require live model credentials and interactive DSH desktop acceptance by the user; offline scorer CLI (`scripts/eval-synapse-design.mjs --list` and `--run`) verified against `EngineSession`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Updated numbered Synapse and HTML POC stages, inlined build and shared judgement guidance, and POC/finish review gates",
      "sha256": "d75e8991ae20306363e557351d62585541fede8bad13c81b47d897c3a994aaf3"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Updated prompt sections op-design-build/op-design-judgement, web-app guideline composition, staged judgement resource, and eval scorer",
      "sha256": "3d9dacfce2e48f38e1d003e0599ebb4bc3c87bf951e24efe9abbb86c31316ec5"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Structured visual review receipts bind observations to `screenshotSha256` and require all five rubric dimensions, but deterministic host checks cannot independently verify the semantic accuracy of model-written prose; spot-check saved session traces with `scripts/eval-synapse-design.mjs`. Existing unrelated worktree modifications in both repositories were preserved without committing.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "6b54338f0f12dbfb897ccd2a1558f36d2da383e10a1008a9c9f5b73b869756f2",
      "after": "c74f36cf8aecab4b41d97a9ba371a8456e6c07b0762e795e6f897bb3a97c93bc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/craft-floor.md",
      "before": "3bebcdb2581f51d6c714103e485403f61ee2538e9d434e20a467dd37628e95de",
      "after": "d1ffb88b1b4d8eb50c845dcef2ba65868206624ed50ae0fa6fe5d573411630bf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/judgement.md",
      "before": null,
      "after": "fa1d74d7999fa6062f845a46f9702cb1cd5162a49cc9d6d5fe70c5a605241120"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "c035838b5a76abd2077a1f4facff94e316a525d282c7a522157086e803786c49",
      "after": "3b3a0dc51442c4759696bb4e46e3101e4a47f836fddc27052ab1554d9a780ea2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/build.md",
      "before": null,
      "after": "8fe009a62413c85ce7a5841c0374faea86c9a93e0430f8d8c23e72a491ec6902"
    },
    {
      "path": "crates/op-ai-skills/src/lib.rs",
      "before": "178dc6dc25d4a13a5991bd15163236bd5171d5f2f75754a3623ff33242cbc5a9",
      "after": "1d63b25b59d1abdd2699d50257d6079c9080bf505bcc0d486a3039fc635affd2"
    },
    {
      "path": "crates/op-ai-skills/src/lib_tests.rs",
      "before": "d7b6c848ba0ad8d137a1201bef81ccf12f3b9489e8e73dbaa418b1c3e523a1c1",
      "after": "144b95cd5e28f349c45391ffafe5714219701c0b605463121437fb7c68edb5ac"
    },
    {
      "path": "crates/op-ai-skills/src/synapse_op_design.rs",
      "before": "ce21882f800a7377433dc3a44069f14ec511f84a7e1adde51e34802f75e3ff3c",
      "after": "e9a955465bfc006e5c258aec6b356f672815b683f29db771c960e98c637892b1"
    },
    {
      "path": "crates/op-mcp/src/design_agent_prompt_tool.rs",
      "before": "e422401006fd07231140bc5ae8558759600bd5524cd85879e0a624812c6b5156",
      "after": "67966b9a8b3c7bea78d29b653f8036471d931d6d2cc4a43068b9f54e990db564"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "57e243ea954138029144be9d356a78d5875c95f83466d30c2907a9e4b9034c59",
      "after": "b3125032adb70746becde64c24e7ec2695f69b602c77361d62a3c1c7f39dd3a8"
    },
    {
      "path": "crates/op-mcp/src/design_prompt_tests.rs",
      "before": "1996ffac76ed348eb73ff06a153511084776561446759e43ea0717f62c88ccd0",
      "after": "0f3404e3f63a6a7dc4eb7890a9809f22e71c7c79b5ae029008a4108e0b0cfa36"
    },
    {
      "path": "crates/op-mcp/src/guidelines_tools.rs",
      "before": "1ee61aa3e2be55c44c9f7359db5a5126f9dead108939fbefedd09e776f95833e",
      "after": "03b6fd3daabc6651be3ef28ea16fa533fa49d5d1a0c00e7b7a0c233745fb9cfa"
    },
    {
      "path": "docs/kb/product.md",
      "before": "1566b026728adaac0671e8eb155209dddc5521036fad8c6fcea451c15e856302",
      "after": "d75e8991ae20306363e557351d62585541fede8bad13c81b47d897c3a994aaf3"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "0c10987fbffe8eee645ef7f4cae06a18395efff85bef672c040ba45480fa083c",
      "after": "3d9dacfce2e48f38e1d003e0599ebb4bc3c87bf951e24efe9abbb86c31316ec5"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.test.mjs",
      "before": "d8aad9cf6f405e4e1c39b47582670dde1ddd44e5708193109e8927b885e60ce8",
      "after": "18f54fdbf86b3f1ea7086edd12b021ba7d31d619af2b2606fe273a2008cf2ccd"
    },
    {
      "path": "packages/dsh-node-runtime/eval-synapse-design.test.mjs",
      "before": null,
      "after": "f513cb2bf9c47a4818ae5b903ae3f369176881f88f5cdf9eeab5c5f79ca0acfd"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "df619e27b008036026bc088119b7962c17f94b3eded3edf121c5de1a6d8783e8",
      "after": "1921f913e553ed96928beee69878946aac9dda762c7021de2ea2659747623424"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "6b54338f0f12dbfb897ccd2a1558f36d2da383e10a1008a9c9f5b73b869756f2",
      "after": "c74f36cf8aecab4b41d97a9ba371a8456e6c07b0762e795e6f897bb3a97c93bc"
    },
    {
      "path": "scripts/eval-synapse-design.mjs",
      "before": null,
      "after": "b14d6724f5ec4a56d9141d994a83a278e66ff1fad051f3f398eaa8b2aa3a424d"
    }
  ]
}
```

Completed-At: 2026-11-11T08:32:07.609743+00:00

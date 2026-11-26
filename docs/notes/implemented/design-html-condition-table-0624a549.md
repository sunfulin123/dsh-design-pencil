# R2: forbid shell package installs in the HTML POC Skill and prototype tool text; replace 'when relevant' reference loading with an explicit condition table recorded in evidence-report contextSelection

Record-Version: 2
Task-ID: 0624a549-d865-42f1-86e7-0bef15173c16
Base-Ref: 8a02e4e43ea1db98a2a9e06b35aa13e84a94ea36
Started-At: 2026-11-26T09:16:04.593595+00:00
Type: feature
Status: complete

## Context

The HTML POC Skill asked the model to load specialist references "only when relevant", leaving more than 200 reference files to its judgement, and a sandboxed shell `pnpm install` left `.pnpm-store/` in prototype projects. The Synapse Studio host now refuses such a store, but no model-facing text forbade the shell install.

## Changes

- `SKILL.md`: new `## Reference Loading` table (row, observable condition, stage B/C/D, files). The model evaluates rows at the start of each stage, reads only matching rows, and records them as `contextSelection` in `evidence-report.json`. Reference paths no longer appear outside the table; the "only when relevant" and "optional supporting playbooks" wording is removed. Stage C forbids shell `pnpm`/`npm`/`yarn` installs while `synapse_design_prototype` is available and says how to recover from a reported `.pnpm-store/`.
- `references/poc-review.md` and `PROTOTYPE_TOOL_TEXT.description` in `prototype-authoring.mjs`: the same shell-install ban.
- `verify-evidence.mjs`: optional `contextSelection` shape validation; `verify-surface.mjs` preserves it when a final rerun rewrites the ledger.
- New `packages/dsh-node-runtime/html-skill-loading.test.mjs`: table rows have unique ids, B/C/D stages, non-vague conditions and existing files (skill source or the Cobalt skill export), `judgement` and `poc-review` are unconditional, reference paths appear only in the table, vague wording is absent, the shell ban is present in all three texts, and `contextSelection` validation accepts absent/valid and rejects malformed values.
- KB `product.md` and `runtime-mcp.md` updated.

## Validation

- Passed: `node --test packages/dsh-node-runtime/html-skill-loading.test.mjs` (4).
- Passed: `node --test` on html-skill-loading, poc-review-workflow, html-review, html-skill-migration, poc-browser-guidance, poc-startup-guidance, document-file, poc-review-temp, poc-stability (40: 34 pass, 6 skipped without `DSH_E2E_CHROME`).
- Passed: `DSH_E2E_CHROME=1 node --test --test-name-pattern "final capture reuses one browser" packages/dsh-node-runtime/poc-review-workflow.test.mjs`.
- Not run: a test that `verify-surface.mjs` preserves `contextSelection` across a final rerun (needs a real capture); the change is a single field copy.
- Not run: the full Node suite and WASM build, for the dependency reason recorded in task 77b04566.
- Passed: `.venv-lint/bin/python tools/knowledge.py check`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "HTML POC references now load only through an explicit condition table recorded in contextSelection.",
      "sha256": "b8fd28538c2c82bedf78db0db74994b740ee89e8da6adea60bb58d49ff9c00c6"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Prototype tool text and the HTML Skill forbid shell package installs.",
      "sha256": "c87bae95a9e80301ae7df676b8cba5e11c25da94869f99fa3ac0d0bb3157dc6a"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The table still points its unconditional rows at the full `judgement.md`, `surface-modes.md`, `poc-review.md`, `html-review.md` and `cobalt-workspace.md`; R3 replaces them with stage summaries under a byte budget. Whether a model follows the table is not covered by automated tests.
## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "bd17352e377cee384a96d20fdb2909ebcf93406dad0c81802f1f5ff71ec57602",
      "after": "634207068fb5ec8691c0ebdbd7e9d63841f7b0cbcc6af538a34e17a6675e251f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "82162030f3250a19395b3e21889659ddacbf470263c5f6e79fe172da49cceeb2",
      "after": "572fcfd57257f60acb095f7a699b8293114912f151786279fc337788de852177"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs",
      "before": "e3158b307af38cf7198bb93668de601d05032159d09416c1ab6e436510f6c225",
      "after": "60daae9140979baa10eb3f422fd43f9df30ef9b2b1192f3d745a816cee8ecbfd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": "efeb75ade57d2227fe3aea730e3a605eea828dc1b598fd63279acc2215f56b1e",
      "after": "36a9d98102b1583a28ff1884e58d4614ca5879e8a407fbe51c0c8b2fe0896cd9"
    },
    {
      "path": "docs/kb/product.md",
      "before": "c661d4c1932e46304e7ad3d184b075910f33bd248e6d14fecbf45241935a2049",
      "after": "b8fd28538c2c82bedf78db0db74994b740ee89e8da6adea60bb58d49ff9c00c6"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "ec51aa8dfcd5e51ef5e1cb5f18345cfc824641a43e92c24018b3fab1f5a0ff80",
      "after": "c87bae95a9e80301ae7df676b8cba5e11c25da94869f99fa3ac0d0bb3157dc6a"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-loading.test.mjs",
      "before": null,
      "after": "02f54e2b1a633946fb98bec9313cb2e192ee0ba4e51518edba00b3ca9fb7f80a"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-authoring.mjs",
      "before": "72d050a9d2f9ef52b754ee77f6d2c5683bb14bb4189ad3a3372827c05803ada1",
      "after": "6c2abf55c8d61e81b959cbe090e0209f3bd7da6497c442c573fc4c4eed75ee6c"
    }
  ]
}
```

Completed-At: 2026-11-26T09:27:53.279490+00:00

# Support same-turn ask_user_question confirmation for HTML POC to Synapse high-fidelity handoff

Record-Version: 2
Task-ID: 182fd873-233d-4cfa-9736-8ae727ebc5db
Base-Ref: 316a6e5330bfd2795d7c7da72123321fadcf7e18
Started-At: 2026-11-12T07:45:50.907916+00:00
Type: fix-bug
Status: complete

## Context

Support same-turn ask_user_question confirmation for HTML POC to Synapse high-fidelity handoff

## Changes

- Updated `crates/op-ai-skills/skills/synapse-design/SKILL.md` and `crates/op-ai-skills/skills/synapse-design-html/SKILL.md` so post-POC confirmation uses `ask_user_question` (`synapse-design-poc:<taskId>`, `options[0]` continue to high-fidelity Synapse design, `options[1]` revise HTML POC first, `options[2]` keep HTML POC for now) in the user's conversation language and immediately resolves `synapse_design_poc_handoff` in the same turn without asking for a separate chat message, while documenting integer pixel `viewport` widths.
- Updated `synapse-studio-dsh/plugins/ss-dsh-design` (`design-poc-handoff.ts`, `design-funnel.ts`, `design-poc-evidence.ts`, `design-discovery-tool.ts`, `index.ts`) so non-error `ask_user_question` completions recorded after `poc_recorded` satisfy the user-confirmation gate in the same turn (while blocking `options[1..]` hold choices on canonical `synapse-design-poc:<taskId>` questions), normalized `{ width }` viewport objects, and added regression tests reproducing the exported session trace.

## Validation

- `cargo test -p op-ai-skills -p op-dsh-engine --lib`: passed.
- `bash packages/dsh-node-runtime/build-engine.sh`: passed.
- `node --test packages/dsh-node-runtime/html-skill-migration.test.mjs packages/dsh-node-runtime/asset-tools.test.mjs`: passed.
- `synapse-studio-dsh/plugins/ss-dsh-design` (`tsc --noEmit`, `node scripts/build.mjs`, `tests/design-poc-handoff.test.mjs`, `tests/design-funnel.test.mjs`, `tests/design-finish-gates.test.mjs`, `tests/design-source-runtime.test.mjs`, `eslint`, `doc-check.mjs`): all passed with 0 ESLint errors.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented same-turn ask_user_question POC handoff confirmation and integer viewport width guidance",
      "sha256": "8f8ddcf9f02f71c80c4fc5f31712a5b1be19ba91427b5ad80e97f5ff41707251"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Runtime MCP invariants unchanged; refreshed SKILL.md provenance after POC question guidance update",
      "sha256": "88acf6978621d74723997b2ec4391cc018e6c04b3b490f01c962f44b5a2c2766"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Same-turn `ask_user_question` answers are accepted only when recorded in `snapshotEvents()` strictly after the latest `poc_recorded` checkpoint (or when `questionCount` advances), preserving protection against pre-record questions or unconfirmed `resolve` calls.
- Opt-in browser Chrome E2E (`DSH_E2E_CHROME=1`) was not re-run in this fix pass.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "c61bf5328121b30f42e1707995586753680a5d7452945f8370e1f6a045219d8d",
      "after": "541b5eb094c56dff52baf3b3147662e6337f4146fca4c020c1f8fce73b6f1acd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "03db557fc4e78426a88f225905d9a5b77402bebf0dd41d62999279623f39fd43",
      "after": "aee9478d50cc63ee3ae77782e518e507960b748060bffb29f8e2aa79ecdc59fb"
    },
    {
      "path": "docs/kb/product.md",
      "before": "6b96b6d188355a392df3845c2679966387f7650a2c18050eb175cb24dc9d7fb1",
      "after": "8f8ddcf9f02f71c80c4fc5f31712a5b1be19ba91427b5ad80e97f5ff41707251"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "29e6ce1c66b50a5526f93a0907299f2e2da1c2be24471a2f48e2fa07d8660698",
      "after": "88acf6978621d74723997b2ec4391cc018e6c04b3b490f01c962f44b5a2c2766"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "c61bf5328121b30f42e1707995586753680a5d7452945f8370e1f6a045219d8d",
      "after": "541b5eb094c56dff52baf3b3147662e6337f4146fca4c020c1f8fce73b6f1acd"
    }
  ]
}
```

Completed-At: 2026-11-12T07:56:48.010700+00:00

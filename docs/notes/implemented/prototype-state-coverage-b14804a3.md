# Require Design skills to discover, implement and verify state transitions present in design references and prototype controls.

Record-Version: 2
Task-ID: b14804a3-32e0-4a72-8733-0b25566a61b1
Base-Ref: b1893ffa1cff73b9ad6b833d0226735cb9d9c332
Started-At: 2026-11-20T09:12:44.420966+00:00
Type: docs
Status: complete

## Context

Require Design skills to discover, implement and verify state transitions present in design references and prototype controls.

## Changes

The HTML and editable design skills require the author to discover state transitions before finalizing the screen plan and to preserve states present in the reference. The HTML skill requires each exposed control to update business content and verifies the transition in the browser. The Cobalt companion specifies the six Workspace states and the route-level hook. The HTML skill is synchronized with its runtime copy.

## Validation

- Passed: `cmp crates/op-ai-skills/skills/synapse-design-html/SKILL.md packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md`.
- Passed: `node --test packages/dsh-node-runtime/{html-skill-migration,cobalt-docs,poc-browser-guidance,poc-startup-guidance}.test.mjs` (19 tests).
- Passed: `cargo test -p op-ai-skills --lib synapse_op_design` (4 tests). The first run exposed an existing exact-phrase assertion for inspecting DOM and handlers. The new discovery guidance explicitly includes that instruction.
- Passed: `git diff --check`.
- Passed: `bash tools/check-maintenance.sh --base b1893ffa1cff73b9ad6b833d0226735cb9d9c332 --task b14804a3-32e0-4a72-8733-0b25566a61b1`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record discovery and verification of referenced states for both HTML and editable canvas authoring.",
      "sha256": "ed949df2f2ba5d918131b155483fb23993ac665f2253a3f4b7f304e3476d8a7b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document the six toolbar states and the iframe acceptance check for Cobalt business routes.",
      "sha256": "0802f60825eb382b2c7e61e8690b17c947a8aea1b52e357292e99b3b05d8d1cc"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The guidance is verified at source and resource-test level. No fresh model-generated prototype was run with this Design runtime. The runtime binary and package are outside this change.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "c025ed2cb42f874e25544461d2b21bbedd063ff1165d9b5beafcc03d4d97ddd4",
      "after": "21014f31feb3aab1fba647ac008770b80f2a13b54d22c483758606e9695b66ce"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "3cca33419ca621571d6f22dc2e5b7489d6908ba575f1178ce25e84fec886011f",
      "after": "ab6455e4826a8ccef5a3f826572f258e97a029f4ce412de044a2313f3eb9a1fd"
    },
    {
      "path": "docs/kb/product.md",
      "before": "1d5e20e9ec56097539a50189f6a22f82c2a4f8cd358db9f37bf8c5168a1aeaf0",
      "after": "ed949df2f2ba5d918131b155483fb23993ac665f2253a3f4b7f304e3476d8a7b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "dcdebfb38f137f3fce1caca6c4fa2a9730f2cbab10a638a34c3cc617e39375cb",
      "after": "0802f60825eb382b2c7e61e8690b17c947a8aea1b52e357292e99b3b05d8d1cc"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "c025ed2cb42f874e25544461d2b21bbedd063ff1165d9b5beafcc03d4d97ddd4",
      "after": "21014f31feb3aab1fba647ac008770b80f2a13b54d22c483758606e9695b66ce"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "b7ce89b4c36077939d4af0e116dc60f10c1023106c30e80e1b3208cfc6e1c7e9",
      "after": "fb644a58d926c25e676e5463df62b0a3bdcd45f1da31e1926655f5c54f9d71c5"
    }
  ]
}
```

Completed-At: 2026-11-20T09:17:14.572939+00:00

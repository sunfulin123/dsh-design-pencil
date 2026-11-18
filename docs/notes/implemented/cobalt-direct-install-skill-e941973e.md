# Keep the shipped HTML Skill aligned with direct Cobalt installation

Record-Version: 2
Task-ID: e941973e-a9a4-467d-8ecc-3f84e08ac743
Base-Ref: d064e824d0742c9d7e0e616f94b6d2e21a9fd16a
Started-At: 2026-11-18T04:04:22.241825+00:00
Type: fix-bug
Status: complete

## Context

Keep the shipped HTML Skill aligned with direct Cobalt installation

## Changes

Align the source and packaged HTML Skill with the direct install workflow. The startup regression covers the main Skill and its guides so stale confirmation instructions cannot reintroduce a Question on retry.

## Validation

`node --test packages/dsh-node-runtime/{prototype-authoring,poc-startup-guidance}.test.mjs` passed all ten cases.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The shipped Skill uses direct install while preserving task-local Workspace preparation, component reuse and owned Vite startup.",
      "sha256": "103051a3a30341fa8c11f3e73509a733db24e8dcf7244b598ada1ac77e3aad98"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The stronger Skill regression keeps the documented direct installation boundary intact.",
      "sha256": "2abd5f896b3b579b9fb1506b60b20f606c13447ff317773f71d3f8ccf6b933d6"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The final packaged Skill is tested in the local SS runtime. Publishing a new pinned release is a separate step.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "f917c718a10fe988110f95e0a2be65acbfd022c18065246f10136a4425e14119",
      "after": "19c236d28ec350e289537c4e66d312314689c801f54d568909843ec16b5a5cc6"
    },
    {
      "path": "docs/kb/product.md",
      "before": "439bcbca3d2a5fb6d8b9413d8b8876c3766f7f12113eef4f416fa092615bb19c",
      "after": "103051a3a30341fa8c11f3e73509a733db24e8dcf7244b598ada1ac77e3aad98"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "de02826ba638ce44419b891000a72057f6cbdfc745c561ba776a26eea9d0e454",
      "after": "2abd5f896b3b579b9fb1506b60b20f606c13447ff317773f71d3f8ccf6b933d6"
    },
    {
      "path": "packages/dsh-node-runtime/poc-startup-guidance.test.mjs",
      "before": "be0ff9752c45905dd72a8ac59f6ec4ee830fccc136cea3c5a7b27b7de93142c9",
      "after": "b06d7ed0bdd60436bb10fcde6855e9d34bfe6d21ac0b8f453d3f9a7cd70ff1b8"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "f917c718a10fe988110f95e0a2be65acbfd022c18065246f10136a4425e14119",
      "after": "19c236d28ec350e289537c4e66d312314689c801f54d568909843ec16b5a5cc6"
    }
  ]
}
```

Completed-At: 2026-11-18T04:05:45.466811+00:00

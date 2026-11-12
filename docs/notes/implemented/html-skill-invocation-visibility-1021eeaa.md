# Mark synapse-design-html non-user-invocable in SKILL.md frontmatter

Record-Version: 2
Task-ID: 1021eeaa-7d5d-4e23-a271-535ff93fe896
Base-Ref: 316a6e5330bfd2795d7c7da72123321fadcf7e18
Started-At: 2026-11-12T03:00:42.469982+00:00
Type: fix-bug
Status: complete

## Context

`synapse-design` is the unified user-facing design entry point covering both HTML POC and editable Synapse canvas. Having `synapse-design-html` also appear as a user-facing slash command caused duplicate skill entries in Synapse Studio.

## Changes

- Added `user-invocable: false` and an explicit sub-skill description to `crates/op-ai-skills/skills/synapse-design-html/SKILL.md` so filesystem and runtime skill loaders treat `synapse-design-html` as an internal model-invocable sub-skill of `synapse-design`.
- Added frontmatter assertion in `packages/dsh-node-runtime/html-skill-migration.test.mjs` and refreshed `packages/dsh-node-runtime/skills/synapse-design-html` via `build-engine.sh`.

## Validation

- `bash packages/dsh-node-runtime/build-engine.sh` — passed.
- `node --test packages/dsh-node-runtime/html-skill-migration.test.mjs packages/dsh-node-runtime/package.test.mjs` — passed.
- `bash tools/check-maintenance.sh --base 316a6e5330bfd2795d7c7da72123321fadcf7e18 --task 1021eeaa-7d5d-4e23-a271-535ff93fe896 --lint-js` — passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Marked synapse-design-html user-invocable: false as an internal sub-skill of synapse-design",
      "sha256": "c5c4f34dbe1ec8f2293465f973cd2c70a958603502efc6e062ef044ee05014ba"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Added frontmatter user-invocable assertion in html-skill-migration.test.mjs; runtime and MCP invariants in runtime-mcp.md remain accurate",
      "sha256": "9764ce5548468abc778fef57de76b68f9c5e93edafa50c8e54ff4af0b9fb88ac"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Host plugins registering `synapse-design-html` programmatically (`skills.register`) must also pass `invocation: { modelInvocable: true, userInvocable: false }`; updated concurrently in `ss-dsh-design`.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "3854686ccd861f10ae536585d6dcc1896bc37a8bc76ef21d501629dd2d9beb3d",
      "after": "c61bf5328121b30f42e1707995586753680a5d7452945f8370e1f6a045219d8d"
    },
    {
      "path": "docs/kb/product.md",
      "before": "c19213914129866d9c8e80ef89f676c1b9f8e43fb5a61d7fac89ac9776848c6c",
      "after": "c5c4f34dbe1ec8f2293465f973cd2c70a958603502efc6e062ef044ee05014ba"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "0f9d3e3ee4398875bd259b161d9c8e17003e332838fdb0e015491668953ac2af",
      "after": "9764ce5548468abc778fef57de76b68f9c5e93edafa50c8e54ff4af0b9fb88ac"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": "d616a10a2286432bbf3bf762d3eb431dbdbc9ea69d37767c5ddcc31080d43759",
      "after": "4cd7b683911c62f3b070db2d7e9437898f0d62795da251d6e49f6b9faafde087"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "3854686ccd861f10ae536585d6dcc1896bc37a8bc76ef21d501629dd2d9beb3d",
      "after": "c61bf5328121b30f42e1707995586753680a5d7452945f8370e1f6a045219d8d"
    }
  ]
}
```

Completed-At: 2026-11-12T03:06:33.213067+00:00

# Reject incomplete exported Workspace project templates and return accurate install and iframe readiness guidance.

Record-Version: 2
Task-ID: 705a8ca7-a706-49b4-9a87-e5b16379816f
Base-Ref: a652faa0a182043488fdef046d9f65fbd95c345d
Started-At: 2026-11-20T07:03:38.884807+00:00
Type: fix-bug
Status: complete

## Context

An exported Workspace template without its scoped npm registry file still returned `ready`. The scaffold enumerated files present on disk, so an omitted input was indistinguishable from a complete template. Its command output also referred to a legacy network confirmation flow.

## Changes

- Read the required project template files by name inside the existing staging transaction. An incomplete export fails before publishing a prototype directory.
- Tell callers to report actual install failures, retain the project for retry, and confirm the expected business UI inside the Workspace iframe before handoff.
- Guide authors to prefer the official component when its API meets the requirement and retain extensions used for recipe-specific behavior.

## Validation

- Before the fix, `node --test --test-name-pattern='exported source templates' packages/talkdesk-cobalt/test/export.test.mjs` failed as expected: removing the exported `.npmrc` produced a published project and a ready receipt.
- `node --test --test-concurrency=1 packages/talkdesk-cobalt/test/export.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/prototype-authoring.test.mjs` passed all 14 tests after the scaffold fix.
- SS `node --test plugins/ss-dsh-design/tests/design-prototype.test.mjs` passed all 10 tests, including retry without a registry probe.
- The first maintenance run flagged stale references to the edited Workspace guide. Reviewed both affected entries and refreshed their source records.
- Staged Design into a temporary runtime, verified it with SS's `verifyLocalRuntime`, and prepared a Workspace with two business routes and the scoped registry file. The installed SS runtime was outside the test.

- `bash tools/check-maintenance.sh --base a652faa0a182043488fdef046d9f65fbd95c345d --task 705a8ca7-a706-49b4-9a87-e5b16379816f` passed after the knowledge review.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record the official-first selection rule and recipe-specific extension behavior.",
      "sha256": "d6645c44afd85b9cf46c94de6415ac9e7c60317f23fa82edd68b0cde663efb33"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document the required project template check before publishing a staged Workspace.",
      "sha256": "72a04239f1d124c13201db62e46c811e908a1d5e75fce292b99d62d6a0f58b09"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Component implementations, existing recipe imports, package installation parameters, Preview service handling and the SS release lock retain their existing behavior. A recipe-by-recipe component migration and a native pnpm lockfile are separate changes.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "fddf1a6b95ed350b7aa1f9669ab84c57972fbdbf42a8a2ba531b960500c0b98a",
      "after": "d6645c44afd85b9cf46c94de6415ac9e7c60317f23fa82edd68b0cde663efb33"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "68c10bb49a6a86e321f5af19c5ff790093baa1dcfc263d99e0e1724db4f2db12",
      "after": "72a04239f1d124c13201db62e46c811e908a1d5e75fce292b99d62d6a0f58b09"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "c927c4adb3e6f74314198c7d068f7fbef70bb5229d6ac777cb8a37b46810493e",
      "after": "69a3fbb2473518b59263608c1b194add396e41d55b2107e72130de2298cf793b"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "ea4affed93e8392179240b2434754d75009173064c686d7fbea60cad8ef4b618",
      "after": "997cce51919ca7efb240120f121bec1f41d95782aaf53aa7816cf4d983b293f9"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "cef4f733f95154705795ff754e0ed1cdba3bb55cba51e21e0d025fd25295394b",
      "after": "3b7911b36a25c6ad383b951a96cc3f869744f0a09793108a42e0298bd307a555"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "5b7cf09f6587b82b01dd9bfd6c7b31bd725f7d53df6bb65db86e493892dac903",
      "after": "f04e8f0a12a496ee0d3296aefcf4ab368290038181253da2f1c170323f029f79"
    }
  ]
}
```

Completed-At: 2026-11-20T07:07:59.128827+00:00

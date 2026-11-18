# Release the runtime with direct Cobalt dependency installation

Record-Version: 2
Task-ID: 2157e549-b2c0-4418-b7f6-c6a846f953a1
Base-Ref: d064e824d0742c9d7e0e616f94b6d2e21a9fd16a
Started-At: 2026-11-18T06:29:01.082360+00:00
Type: tooling
Status: complete

## Context

Release the runtime with direct Cobalt dependency installation

## Changes

Set the runtime workspace, lockfile, packaging assertions and release workflow to 0.8.5-synapse.10. The release carries direct Cobalt dependency installation and aligned bundled Skill guidance.

## Validation

- Passed: `node --test packages/dsh-node-runtime/{package,prototype-authoring,poc-startup-guidance}.test.mjs scripts/check-dsh-runtime.test.mjs` (27 tests).
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (168 packages) and `git diff --check`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Only the runtime workspace version changes in the lockfile. Dependency versions and archive verification are unchanged.",
      "sha256": "3dfc749723c502304b894c5de2879a106390850b7c7f20af705d87b69620587f"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The SS lock is updated after the release archive and its checksum are published and verified.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "42001ddb5053a2a8669c240df9779f0fe9c70b98d2385d4c7ed092ebeb3c35f4",
      "after": "45b20512c76c93497a3989872275f2d495d9456b0e7dcb11da6f787eb5fed422"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "2abd5f896b3b579b9fb1506b60b20f606c13447ff317773f71d3f8ccf6b933d6",
      "after": "3dfc749723c502304b894c5de2879a106390850b7c7f20af705d87b69620587f"
    },
    {
      "path": "packages/bun.lock",
      "before": "34278faaf819cdf7c2605a2277e67aa384bb78860555432969a97090fc2d0b51",
      "after": "72f78a9ca5dc37a77d84bd57ef003cd43bc8af8ac97148db22bd01ecc8878db0"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "143fff9a2829ad69f2d2b64cc1d8f769058a3bd2aa7891bb72893d4d63976ab1",
      "after": "a2246a7dbedccecd371e3c595c0f2a9ececdc903aa54479bd46f994d74d9251a"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "0dec3e21fdc163011497d1d53dc043accb87dba2ede9f6c004cd15a2507585a9",
      "after": "700f96fdd8e20fae138dcb4559c4aa946a1829f884127f468615e5b1967a76de"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "0e8742d4017632e7bd9dba7c8b3a2567fd6745e6cf6f23a4e591603e2ef1c0f2",
      "after": "00e3a4a78f0eec8147ba2099df0874cf4600a3b26f9496018150245aaeacfb67"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "f063f9fcc6bb5cd8a1717ca6a6029a09dd1d03bb5567656b9581640aa5085935",
      "after": "db5d733510a97ef659e9224305bb951d43f03c71d90efd7c18a37b1349c27991"
    }
  ]
}
```

Completed-At: 2026-11-18T06:31:57.906130+00:00

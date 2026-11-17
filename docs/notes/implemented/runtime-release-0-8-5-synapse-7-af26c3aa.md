# Publish the current Cobalt prototype and Browser Use guidance in a checksummed Node/WASM runtime for SS local packaging

Record-Version: 2
Task-ID: af26c3aa-b8dc-4ddc-b30c-2261b1bd28f6
Base-Ref: e84ec901beb3eae6e44e2706067b401efad0f85a
Started-At: 2026-11-17T08:03:24.332185+00:00
Type: tooling
Status: complete

## Context

Publish the current Cobalt prototype and Browser Use guidance in a checksummed Node/WASM runtime for SS local packaging

## Changes

Bump the runtime package, Bun workspace lock, release workflow, package assertions and release documentation to 0.8.5-synapse.7. The release includes the committed Cobalt recipes, protected Workspace shell, shared preview controls, complete source copying, local-document fallback and focused browser review guidance. Preserve the Node/WASM schemaVersion 2 manifest and locked interpreter dependencies. Filter the frozen Bun release installation to the runtime workspace and public root build tools so a release does not require private Cobalt demo packages; add a workflow regression assertion.

## Validation

- Passed: `node --test packages/dsh-node-runtime/package.test.mjs scripts/check-dsh-runtime.test.mjs` (17 tests).
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (168 packages).
- Passed: `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base e84ec901 --task af26c3aa-b8dc-4ddc-b30c-2261b1bd28f6 --lint-js` (existing no-await-in-loop warnings remain non-blocking).
- Passed: version-only read-only Codex-backed vet review; the standard API-backed invocation could not start without a configured credential.
- Regression: the filtered-install assertion failed before the workflow fix and passed afterward. A fresh manifest-only workspace installed with the release-pinned Bun 1.3.14 and both frozen workspace filters; no Talkdesk private dependency was installed.
- Passed: complete read-only Codex-backed vet review after the workflow filter change (no issues found).
- Passed: final maintenance gate and `tools/task_notes.py check af26c3aa-b8dc-4ddc-b30c-2261b1bd28f6`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The lock changes only the local runtime version to 0.8.5-synapse.7; QuickJS versions and WASM/MCP execution and packaging boundaries are unchanged.",
      "sha256": "2a3ea9f2f0d38ff2fa45452613388ab7390818162fc4323cee4a53fcaf737319"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The consumer must pin the new immutable release revision, archive SHA-256 and URL after publication succeeds. Existing release assets must not be overwritten. Publishing and downstream installation are verified separately from this version-only source change. Browser Use background Chat execution remains outside this release.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "cf2f546b50fddc99de0f1a7f2ba1fb6708793e4ada63242a22832b1a2447aad5",
      "after": "69315f5e3e7183f0db01bf0c510ffe92c4d4bacf949bc7d216bfaf76b234c139"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "4e0d7e5148e115b8c53e0e7b761d3e2b2e2c1463123f97ed9f8f2366fc13cc51",
      "after": "2a3ea9f2f0d38ff2fa45452613388ab7390818162fc4323cee4a53fcaf737319"
    },
    {
      "path": "packages/bun.lock",
      "before": "33cc3aaae3b8df0a7e42e3fce072992de210f683fca8cf3291adcceaa2ad37f0",
      "after": "188f2c25edb00951464ed94ddb9b9816f36b7c98e59ee74bbd3a02561471e93b"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "6196ced1ff4b2d9f349846a110afbe8cc8a5e95cc7700355850a2d9468f971b5",
      "after": "06c62e85940cef1578ac256b1f29e0474c9e5cd2b488f6f4357cc47ebc626612"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "a273c01af4a2bf1c7fc1bd8736755925a3d0a79fc6d57ac443cbe75a2e6fd144",
      "after": "9bbe083f20646acd9c8b9f89318e15073acb88f8dcd6a3745185f649c174e9e7"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "4dfa7f6d1903d1efe98dadc9cdcc902e89cb5f4bea6ab001c8c8e6f6eea072e9",
      "after": "cd5920e7435ec5bc90920a1c10ec837008c59f94b97baedc79cc5393ee2ead6e"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "3c63c1f98e93ced7c5d04fe1bc4c7e548b6e5f852de641f484786c5dd664b307",
      "after": "29d03352671288a0f5ee38ab10d5ef0f6172889fda0725bb0cc23cebd9f00fc3"
    }
  ]
}
```

Completed-At: 2026-11-17T08:13:51.938432+00:00

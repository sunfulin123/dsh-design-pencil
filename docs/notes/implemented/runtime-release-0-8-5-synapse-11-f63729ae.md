# Release English OP authoring and per-node metadata guidance

Record-Version: 2
Task-ID: f63729ae-bda9-45d6-913f-e79a87efd2b4
Base-Ref: d6512f5f289a525bccc4c879f5f37c46f4c53f15
Started-At: 2026-11-18T06:51:01.591409+00:00
Type: tooling
Status: complete

## Context

Release English OP authoring and per-node metadata guidance

## Changes

Pin the runtime workspace, lockfile, workflow, and release assertions to 0.8.5-synapse.11. This release carries the English OP authoring rules, per-node metadata instructions, and English inspector and finalization defaults.

## Validation

- Passed: `cargo fmt --all -- --check`, `node scripts/check-dsh-runtime-dependencies.mjs` (168 packages), and `git diff --check`.
- The English authoring and semantic metadata source checks are recorded in [the authoring note](english-op-authoring-99512af4.md). The release workflow rebuilds both WASM payloads and verifies the staged archive.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The runtime workspace receives an immutable release version for the English authoring change. Dependencies and release verification remain unchanged.",
      "sha256": "ee386e4ad9f1f5e244181c8e8edab37bc2e2ec6407540067bab67d00b0a674e0"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The SS lock advances after the published archive and manifest have passed verification.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "45b20512c76c93497a3989872275f2d495d9456b0e7dcb11da6f787eb5fed422",
      "after": "957845dad7447acd0fb12a5696867b6625f8830361321343e6d5f8ec1e89eb8d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "ea05f77456683337661b20d91fdf5a2e0c9761f4998b48ffb9c8a66f47afa087",
      "after": "ee386e4ad9f1f5e244181c8e8edab37bc2e2ec6407540067bab67d00b0a674e0"
    },
    {
      "path": "packages/bun.lock",
      "before": "72f78a9ca5dc37a77d84bd57ef003cd43bc8af8ac97148db22bd01ecc8878db0",
      "after": "251c03d913f3acca8296c6fa1c3fd6ac6e087bc4936e90e2861b71608fdfae81"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "a2246a7dbedccecd371e3c595c0f2a9ececdc903aa54479bd46f994d74d9251a",
      "after": "6e792bbe30fc8bdc83b48c7780fa4dfae19f68fe953c30ec4c8e8eade9f75b06"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "700f96fdd8e20fae138dcb4559c4aa946a1829f884127f468615e5b1967a76de",
      "after": "68eefa6c3d1401fc6c62cc0540f15b444ba371234d2fa5f60a8aad55b12987f0"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "00e3a4a78f0eec8147ba2099df0874cf4600a3b26f9496018150245aaeacfb67",
      "after": "90b8b5c84d5bcefde01782d43eecc660b38efd0344d7cc238539ff13dfd53bf3"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "db5d733510a97ef659e9224305bb951d43f03c71d90efd7c18a37b1349c27991",
      "after": "5513eaee70e9da6c19575cb24beb587b7f7d7bc32916767ebe5ef50bf18fd9a5"
    }
  ]
}
```

Completed-At: 2026-11-18T06:53:40.110815+00:00

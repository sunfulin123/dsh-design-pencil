# Release the Design runtime with explicit state discovery and coverage guidance.

Record-Version: 2
Task-ID: 433afe4c-3402-44f2-94f7-58ae46149908
Base-Ref: bf0eabbcff7bb6cbd0c1e083ff3d66cfa5138183
Started-At: 2026-11-20T09:27:41.551420+00:00
Type: tooling
Status: complete

## Context

Release the Design runtime with explicit state discovery and coverage guidance.

## Changes

Advance the Node/WASM runtime to 0.8.5-synapse.16. Keep the release workflow, package metadata, lockfile and package checks aligned. The release contains the state coverage guidance recorded in the prototype state coverage note.

## Validation

- Passed: `git diff --check`.
- Passed: `node --test scripts/check-dsh-runtime.test.mjs` and `node scripts/check-dsh-runtime-dependencies.mjs`.
- Passed: `bash packages/dsh-node-runtime/build-engine.sh` with the locked wasm-bindgen on PATH, followed by `node --test --test-concurrency=1 packages/dsh-node-runtime/package.test.mjs` (3 tests, including starting the staged Node/WASM host). The first run rejected older generated output as expected.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The preceding state coverage task documents the model-facing behavior. This task only advances the distribution version.",
      "sha256": "6deb6ef79f1dd294de3261129d9fe8ab0a0d6a34b1d2c9ea55617bb06e6d23a1"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The version update keeps the checksummed runtime staging and dependency contracts.",
      "sha256": "a1c5342f027e4553f68977a647523b66f59485a02459a480425b4e6f6b9b38e9"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The release workflow builds and publishes the checksummed assets for the signed tag. SS must lock the released archive, digest and source revision before distributing the new Skill.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "1100aec580a2a8063ad8271c0bed239cf8e1f6262992be7482df3ff2a0f8a20c",
      "after": "63608dc770f4fb894309bf1e34a56a77f18c5b57ea73167e0e1238d419218433"
    },
    {
      "path": "docs/kb/product.md",
      "before": "ed949df2f2ba5d918131b155483fb23993ac665f2253a3f4b7f304e3476d8a7b",
      "after": "6deb6ef79f1dd294de3261129d9fe8ab0a0d6a34b1d2c9ea55617bb06e6d23a1"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "0802f60825eb382b2c7e61e8690b17c947a8aea1b52e357292e99b3b05d8d1cc",
      "after": "a1c5342f027e4553f68977a647523b66f59485a02459a480425b4e6f6b9b38e9"
    },
    {
      "path": "packages/bun.lock",
      "before": "1feadd8399471dc90143048f6bf2d7fbe5efe0fc408d2eaf4f8c96520278bd94",
      "after": "7c14fc251ab67efa0d750b10661689816c296383638e3ec15d6fca040aed207f"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "e07193d874f19de9b6373491efb61494287dc34ab85129b28250a857fbebe05c",
      "after": "0485e03358f92e15d275705dde7af9e47cf1d8e2d0dc4551a2b0fc9af1883581"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "b6b93720b612f14d9a6ea7c48f6280466fdb2a979e9a54927d429325488e4610",
      "after": "16dfb339db4f7b819e509d3854853203c63d327380498ecc34020abcb40e204e"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "124239e9ec24a7c6d7b538ae881a83c2121300d975817f677feb7a60bfa98caa",
      "after": "4ed6ba463aa196fc99a62b3fe3552c615ace03d0b4207c5167e01ea52261fbaa"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "6d243b06c8151393614efff07914a75ea5268cd9a4a3f89803812c0ccee8e858",
      "after": "37c4529fb630131f14c39baf95c50003fac9e24dc6bb6c02fe0e125fd1495b8b"
    }
  ]
}
```

Completed-At: 2026-11-20T09:30:46.967417+00:00

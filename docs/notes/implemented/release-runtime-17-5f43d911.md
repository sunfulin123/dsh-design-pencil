# Release the Design runtime with artifacts/temp task folders, the HTML POC Reference Loading table and the bounded mandatory reading

Record-Version: 2
Task-ID: 5f43d911-459b-4160-b8f0-bb6fbebb15b5
Base-Ref: a7ab3b0b1d1391f6c007a09ba90539aa95780d7f
Started-At: 2026-11-26T12:46:32.722506+00:00
Type: tooling
Status: complete

## Context

PR #3 (merge `a7ab3b0b`) added `artifacts/`/`temp/` task folders, `review-poc.mjs --temp`, the HTML POC Reference Loading table and stage summaries. Publishing `runtime-v0.8.5-synapse.17` on that commit failed at "Validate release tag" (run 45804106172) because `OPENPENCIL_DSH_RUNTIME_VERSION` was still `0.8.5-synapse.16`, so no package was built.

## Changes

- Version `0.8.5-synapse.16` → `0.8.5-synapse.17` in `.github/workflows/dsh-runtime-release.yml` (`OPENPENCIL_DSH_RUNTIME_VERSION`), `packages/dsh-node-runtime/package.json`, `packages/bun.lock`, `packages/dsh-node-runtime/package.test.mjs` and `scripts/check-dsh-runtime.test.mjs`, as in the `.16` release commit `bc2744fb`.

## Validation

- Passed: `node --test scripts/check-dsh-runtime.test.mjs` (15).
- Not comparable: `node --test packages/dsh-node-runtime/package.test.mjs` passes 1 and fails 2 both before and after this change, because the WASM engine and `wasm/design-skill.md` are not built locally; the release workflow builds them.
- Passed: `.venv-lint/bin/python tools/knowledge.py check`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "packages/bun.lock changed only the runtime workspace version to 0.8.5-synapse.17; no dependency or documented behaviour changed.",
      "sha256": "0d45ee3496424170eff7003f49e7c059dcbf6747ea4efdf3bba7abd787614283"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The existing `runtime-v0.8.5-synapse.17` tag points at `a7ab3b0b`, which lacks this commit. The release must be republished from a tag on this commit; the workflow checks out the tag, so rerunning the failed run would fail again.
## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "63608dc770f4fb894309bf1e34a56a77f18c5b57ea73167e0e1238d419218433",
      "after": "afcd8f7271082c441c7d1f99fdd7538004e380cecdd5113e428ffb902f177bde"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "d1f81d4e9cd9d32b993fa78ee7f01a4914fe2467507e731ebcb3bae5b708beac",
      "after": "0d45ee3496424170eff7003f49e7c059dcbf6747ea4efdf3bba7abd787614283"
    },
    {
      "path": "packages/bun.lock",
      "before": "7c14fc251ab67efa0d750b10661689816c296383638e3ec15d6fca040aed207f",
      "after": "172ca0ad423e68b37d32be8bc10bf4b26c5981580c23d2fc540548c0f73163f6"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "16dfb339db4f7b819e509d3854853203c63d327380498ecc34020abcb40e204e",
      "after": "cf65beb438412a21fb86090bc185eb8f0b9281926e42fd0af33ee6aac47ea037"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "4ed6ba463aa196fc99a62b3fe3552c615ace03d0b4207c5167e01ea52261fbaa",
      "after": "fc227fb5eae087113795c640754016ad6ac4e71143763f616e742d8a8a0d452d"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "37c4529fb630131f14c39baf95c50003fac9e24dc6bb6c02fe0e125fd1495b8b",
      "after": "62127b6800c96bbadc4785c39e29f755b60700f58d850f3a2a8ab638bd090dd9"
    }
  ]
}
```

Completed-At: 2026-11-26T12:48:16.424299+00:00

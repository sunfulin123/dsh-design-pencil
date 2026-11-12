# Normalize HTML skill manifest LF hashes and bump DSH Node/WASM runtime to 0.8.5-synapse.5

Record-Version: 2
Task-ID: 3be8f564-270a-4d24-81d1-e1d18920c6d2
Base-Ref: 9c87cbfae2d383f8d0d5dac757d3167e97212e34
Started-At: 2026-11-12T09:49:05.545560+00:00
Type: tooling
Status: complete

## Context

Git's `* text=auto eol=lf` policy normalized four CSV datasets in `crates/op-ai-skills/skills/synapse-design-html/data/` (`charts.csv`, `google-fonts.csv`, `landing.csv`, `stacks/react-native.csv`) to LF in Git objects while `migration-manifest.json` still recorded pre-commit CRLF SHA-256 digests, causing `html-skill-migration.test.mjs` to fail on fresh Linux CI checkouts. In addition, downstream `ss-dsh-design` requires a new `0.8.5-synapse.5` runtime release bundling the unified `synapse-design/2` + `synapse-design-html/2` workflow and migrated pure design domain modules.

## Changes

- Updated the four preserved CSV SHA-256 digests in `crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json` to match the canonical LF bytes stored in Git and refreshed local working-tree copies.
- Bumped `@sunfulin123/dsh-design-pencil-runtime` and `OPENPENCIL_DSH_RUNTIME_VERSION` from `0.8.5-synapse.4` to `0.8.5-synapse.5` across `packages/dsh-node-runtime/package.json`, `packages/bun.lock`, `.github/workflows/dsh-runtime-release.yml`, `packages/dsh-node-runtime/package.test.mjs`, `scripts/check-dsh-runtime.test.mjs`, and `packages/dsh-node-runtime/README.md`.
- Rebuilt `packages/dsh-node-runtime/build-engine.sh` so staged skill assets match the LF source tree.

## Validation

- Passed: `node --test packages/dsh-node-runtime/html-skill-migration.test.mjs packages/dsh-node-runtime/package.test.mjs scripts/check-dsh-runtime.test.mjs` (28/28 passed).
- Passed: `rm -rf .history && bash tools/check-maintenance.sh --base 9c87cbfae2d383f8d0d5dac757d3167e97212e34 --task 3be8f564-270a-4d24-81d1-e1d18920c6d2 --lint-js`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "Normalized 4 preserved CSV LF hashes in migration-manifest.json; product design invariants unchanged",
      "sha256": "4505fba34f29e2f67f4c09dbe2a53428b8bbf91a25fc2b5b89627a1e965201e9"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Bumped DSH Node/WASM runtime package version to 0.8.5-synapse.5 in bun.lock; runtime MCP invariants unchanged",
      "sha256": "3790475e9a36bd672b650b69812b543ad45764ed1cf9d6da808d0f57303b6c02"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Compatibility: `0.8.5-synapse.5` preserves the `schemaVersion: 2` `node-wasm` manifest contract while shipping the new runtime domain modules and LF-verified HTML POC skill assets.
- Rollback: Pin `runtime-release.json` back to `0.8.5-synapse.4` if reverting downstream `ss-dsh-design`.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "127c1a05be354cd1396ff8b0d3582b7d9db621e5e538216a5e107129c375af4c",
      "after": "73e3f16e553f0e3c6ac6a0139021f7516383015e5d764070bacfd97d7e3f6494"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/charts.csv",
      "before": "ebb565308115f955791b0431797a89d9b3587c25d5babb9428d10712c4924817",
      "after": "a70ef7460b0eaaea8614f86a0d09a4bc38b467804179762464b5ca45b491baac"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/google-fonts.csv",
      "before": "2c03a3cd134d126bd9d6a7dc2a6360dc5272219ad6df3eb9315b031f806e1487",
      "after": "3fd2898fb0fdd31ba758bf05cfcd2b58cd0f038a20cf08e417d09e5a8a4a509e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/landing.csv",
      "before": "080cedbcd61ff8ec9520f33929baa76bee9589e783f83b2f8d824a466b6a46d7",
      "after": "121a2cac7cf21050234b5f80e7b4e182f10123536032e0f9ad862ad3aec9677d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/react-native.csv",
      "before": "a08ca77fcf6b6d9531982dce465366296013bfcf12d2938ac72ad57cf0c4f085",
      "after": "077aefc81d194895ecf7936b3ed298b978e36961f183e3a275f8acda19b5f621"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json",
      "before": "ce0d957cc81269c2834354c9b103b11560144f9c47f492492fa73a1c3d5bcac4",
      "after": "6eb8c4570fbf4a69c22b596a0560ccc2ce01aa7cbf733111bdd9f1895534ad8a"
    },
    {
      "path": "docs/kb/product.md",
      "before": "8486474a83f6a61e6085c9b920b0c6dd8806475828a75f233a681e1ca05f286e",
      "after": "4505fba34f29e2f67f4c09dbe2a53428b8bbf91a25fc2b5b89627a1e965201e9"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "00ae30c9d88f688e2cc79e76adb4e5ca0d9a8fb08ec1542a638b034e425833a6",
      "after": "3790475e9a36bd672b650b69812b543ad45764ed1cf9d6da808d0f57303b6c02"
    },
    {
      "path": "packages/bun.lock",
      "before": "904f7d67cda57d5767df5e9c3ec6dc221da1559810db4a3bfdbde6e4c7ffab60",
      "after": "377168e3785ac2323fe54122c1511936c8476f15c35fa5639e4374880f7cdc4c"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "be2baa5f53b688a8f87893450a187c71ceccb16c5b9490ec2dd344b60bca08af",
      "after": "e0eb7ca4560a1cd6d1d4425dd26b904d7fe95e23cba30978f511c101edb9f069"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "e42b6f63edde768abf7c39afa10396db64f7f6b831583e3e56a12d4db9c44bdb",
      "after": "c7f2a67ff438aa2e239e774dc8d425ddeb8df96e5ff868cf572cef7dd6981de3"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "1921f913e553ed96928beee69878946aac9dda762c7021de2ea2659747623424",
      "after": "bdd48f90240266f013a83ddfd8bb45602554a621840717e5dcd2fe3c85c58024"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "cfa2e2b9946a72cab86c379c3b5506da19a710d83cb6bd20fe2a5cccad20b18c",
      "after": "08460ef53bab99e17b59b534d4b7df7d6737c2966f2e87caf7594ec2f62ee1c3"
    }
  ]
}
```

Completed-At: 2026-11-12T09:59:11.547551+00:00

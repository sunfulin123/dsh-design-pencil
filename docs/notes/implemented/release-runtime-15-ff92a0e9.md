# Preserve the scaffold install and retry guidance contract and publish a validated Design runtime.

Record-Version: 2
Task-ID: ff92a0e9-0451-4973-9d5a-81a4d493be60
Base-Ref: 7a028d00d7bc445aa4a9c1c2ca6bbc4772a966ca
Started-At: 2026-11-20T07:56:38.247602+00:00
Type: fix-bug
Status: complete

## Context

The 0.8.5-synapse.14 release workflow rejected revised scaffold guidance. It expects both the named SS install/check actions and an explicit, project-local retry path outside SS. The unsuccessful tag carries no archive.

## Changes

Restore both clauses in the generator's next steps while keeping direct installation, actual failure diagnostics and business iframe verification. Advance the immutable release version to 0.8.5-synapse.15. Run release tests serially because the packaging and scaffold tests read and regenerate the same authoring resources.

## Validation

- The release workflow for 0.8.5-synapse.14 reports the earlier wording mismatch in `poc-startup-guidance.test.mjs`.
- `node --test packages/dsh-node-runtime/poc-startup-guidance.test.mjs scripts/check-dsh-runtime.test.mjs` passed 17 tests after the fix. `node scripts/check-dsh-runtime-dependencies.mjs` passed.
- The full parallel runtime suite exposed a shared-resource race and a timing-sensitive fixture. `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` then passed 320 tests with 48 conditional skips and no failures.
- The changed-scope maintenance gate with JS lint passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Restore the existing scoped installation and retry wording and increment the distribution version with the same dependency and staging contracts.",
      "sha256": "dcdebfb38f137f3fce1caca6c4fa2a9730f2cbab10a638a34c3cc617e39375cb"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The scaffold guidance keeps the same autonomous and project-local installation contract while restoring the expected tool action names.",
      "sha256": "1d5e20e9ec56097539a50189f6a22f82c2a4f8cd358db9f37bf8c5168a1aeaf0"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The SS lock must refer to the released .15 archive and its actual digest.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "89178893b5c4726c5e933d6a37266ab70a6a8cc436a361bedb10688b77debe55",
      "after": "1100aec580a2a8063ad8271c0bed239cf8e1f6262992be7482df3ff2a0f8a20c"
    },
    {
      "path": "docs/kb/product.md",
      "before": "8a3db772ea88f0d6521dc57ed2b41754c9edd6c27ea99f6b39f4f9bb9f0988ab",
      "after": "1d5e20e9ec56097539a50189f6a22f82c2a4f8cd358db9f37bf8c5168a1aeaf0"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "dde11d53c7a00e7523faedf3bcf2f54ac517cfae056d4228bfb1652ddcefc190",
      "after": "dcdebfb38f137f3fce1caca6c4fa2a9730f2cbab10a638a34c3cc617e39375cb"
    },
    {
      "path": "packages/bun.lock",
      "before": "e44b6579dd946966e34835d5021e059d4fe0e6e3f3e5ad30509939b6993690b6",
      "after": "1feadd8399471dc90143048f6bf2d7fbe5efe0fc408d2eaf4f8c96520278bd94"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "2983cdbb9ce517ca4b725c2e3620602544c17e874e61db581a727a19dc1bfa08",
      "after": "e07193d874f19de9b6373491efb61494287dc34ab85129b28250a857fbebe05c"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "957dd81c9b9c1a70ae52eea2681067c22601d39dbe73e865854df40b74e3d993",
      "after": "b6b93720b612f14d9a6ea7c48f6280466fdb2a979e9a54927d429325488e4610"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "ebe98445b796ebddacff4094c4f7ca4284b2734a2821db7703b8d1f6d1968baa",
      "after": "124239e9ec24a7c6d7b538ae881a83c2121300d975817f677feb7a60bfa98caa"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "f04e8f0a12a496ee0d3296aefcf4ab368290038181253da2f1c170323f029f79",
      "after": "0afca37fe5afeb903689c081fccda510eaf4101a452bb00703c1df0277ddd289"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "c6aa084fe98fbbfbd51da225d634438fddb0071eb7a55deceaaa8ffdd3d6b246",
      "after": "6d243b06c8151393614efff07914a75ea5268cd9a4a3f89803812c0ccee8e858"
    }
  ]
}
```

Completed-At: 2026-11-20T08:00:11.803554+00:00

# Publish the Cobalt authoring guidance and scaffold fixes in Design runtime 0.8.5-synapse.14.

Record-Version: 2
Task-ID: ee29d36e-e8ef-42cd-8738-6890f478b346
Base-Ref: a652faa0a182043488fdef046d9f65fbd95c345d
Started-At: 2026-11-20T07:43:22.820336+00:00
Type: tooling
Status: complete

## Context

Synapse Studio consumes a pinned and checksummed Design runtime. The updated Cobalt authoring guidance and scaffold checks need a new immutable release for SS to consume them.

## Changes

Advance the Node/WASM package, Bun lock and release workflow to 0.8.5-synapse.14. The release contains the Schedule page title, the shared extension recommendations, official-first selection guidance and checks for required Workspace template files.

## Validation

- `node --test --test-concurrency=1 packages/dsh-node-runtime/package.test.mjs scripts/check-dsh-runtime.test.mjs packages/talkdesk-cobalt/test/export.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/prototype-authoring.test.mjs` passed 32 tests.
- `node scripts/check-dsh-runtime-dependencies.mjs` and `cargo fmt --all -- --check` passed. The release metadata changes leave the dependency versions and Rust source intact.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The Bun lock changes the runtime workspace version while keeping the build, dependency and staging contract.",
      "sha256": "dde11d53c7a00e7523faedf3bcf2f54ac517cfae056d4228bfb1652ddcefc190"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The GitHub release workflow builds and verifies the platform-independent Node/WASM archive. Synapse Studio must pin its version, originating commit and downloaded archive digest.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "3bc76aa555d1218726ef667a40e4aeeaabd384158e33a947a4938c34ae5217c7",
      "after": "89178893b5c4726c5e933d6a37266ab70a6a8cc436a361bedb10688b77debe55"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "f6e014a88d5afe6ade419bd28cf59a65827588c71fb4d2762805035bd4f208b3",
      "after": "dde11d53c7a00e7523faedf3bcf2f54ac517cfae056d4228bfb1652ddcefc190"
    },
    {
      "path": "packages/bun.lock",
      "before": "6e37d894bea05c9f3d5a5225e0d838c585590c104ec0f15238eb686da53f962b",
      "after": "e44b6579dd946966e34835d5021e059d4fe0e6e3f3e5ad30509939b6993690b6"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "526eac054b3a4c956961a18467f81e8ae89e5a6c1b81cad9f621afc5eaf9b391",
      "after": "2983cdbb9ce517ca4b725c2e3620602544c17e874e61db581a727a19dc1bfa08"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "b5ef897f472ab1ab0a927780e2a7214233f565f13d76606856af13055f1f997e",
      "after": "957dd81c9b9c1a70ae52eea2681067c22601d39dbe73e865854df40b74e3d993"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "6a2352a3804ab84481d1a7c4e4550c6c7f4c5ea52e659e19a3509b5fab23ef22",
      "after": "ebe98445b796ebddacff4094c4f7ca4284b2734a2821db7703b8d1f6d1968baa"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "7cbfd9f4614bd421f6a13eb53c2d750067a3e87d946b64102135cbd8484320ff",
      "after": "c6aa084fe98fbbfbd51da225d634438fddb0071eb7a55deceaaa8ffdd3d6b246"
    }
  ]
}
```

Completed-At: 2026-11-20T07:46:04.294184+00:00

# Remove the private registry dependency from the source-inspection release test and cut a new immutable runtime version.

Record-Version: 2
Task-ID: f8f9e662-a047-4534-bd26-8e34c90cdbbe
Base-Ref: 758b75c78089436b3c85ad79252fd7b16c578c7c
Started-At: 2026-11-18T01:45:16.519505+00:00
Type: tooling
Status: complete

## Context

Remove the private registry dependency from the source-inspection release test and cut a new immutable runtime version.

## Changes

Use the public workspace TypeScript parser and an owned declaration fixture in the authoring inspector test. The assertion checks module resolution and actual JSX use without installing private Cobalt packages or claiming rendered verification. Bump the package, lock and release workflow to 0.8.5-synapse.9 to retain the immutable previous tag.

## Validation

- Passed: targeted source parser test in `prototype-authoring.test.mjs` using public TypeScript and local declarations. Scoped lint and diff checks passed.
- Passed: `node --test packages/dsh-node-runtime/package.test.mjs scripts/check-dsh-runtime.test.mjs` (17 tests).
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (168 packages).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The test resolves TypeScript from the public workspace and owns declaration-only fixture metadata. The runtime packaging boundaries and locked interpreter dependencies remain unchanged.",
      "sha256": "914af65d0c51cde44ac68749da2733637f35083c33e6ad38a403f76f88e9512f"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The declaration fixture does not establish private Cobalt rendering. SS pins the new verified archive after publication.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "4538bfadad60e55c590b334a8d49f89c1da5c7bad9df19fd138fac639d1f1c47",
      "after": "42001ddb5053a2a8669c240df9779f0fe9c70b98d2385d4c7ed092ebeb3c35f4"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "333f68c34d7f15adc94429fe9bdca1cbb21a24627d32162caac8a623e5bad0b2",
      "after": "914af65d0c51cde44ac68749da2733637f35083c33e6ad38a403f76f88e9512f"
    },
    {
      "path": "packages/bun.lock",
      "before": "2be41da3502a4597e314eaeaa057668e06601f21974cc5e106f96f9a8aa02f79",
      "after": "34278faaf819cdf7c2605a2277e67aa384bb78860555432969a97090fc2d0b51"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "d84e5f1635b8b7132eaa284ea153df8c60ac134075ea95401b1f06f16857ec1e",
      "after": "f51bb304fff2a6939ca8b97ea0853c37e40f72821d069b2de72bcd1d9dbe610b"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "9928a2822cf2f50560ea57d97430b9ebeab324e7b3a2a2a0a66dd107174edab3",
      "after": "0dec3e21fdc163011497d1d53dc043accb87dba2ede9f6c004cd15a2507585a9"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "6487af7aee503d6d8d9f8cca84df9bf33a10dac8d0eace71acc7d9e60ba25638",
      "after": "0e8742d4017632e7bd9dba7c8b3a2567fd6745e6cf6f23a4e591603e2ef1c0f2"
    },
    {
      "path": "packages/dsh-node-runtime/prototype-authoring.test.mjs",
      "before": "a42782c914321f08510f5e21c8a4eef9171c82db5c395e53bf05956575ae703f",
      "after": "72bc959d71b0681e084a8c8ef20e7e82e7a1e28639598f47189d3e0a767f1f3c"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "1561dec31b9e541be1c4d31e74c3efbb371500108c69e13ec5f12d66d4575f61",
      "after": "f063f9fcc6bb5cd8a1717ca6a6029a09dd1d03bb5567656b9581640aa5085935"
    }
  ]
}
```

Completed-At: 2026-11-18T01:50:15.493054+00:00

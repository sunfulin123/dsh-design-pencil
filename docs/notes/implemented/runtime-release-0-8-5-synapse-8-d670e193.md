# Publish the checksummed HTML import and Cobalt authoring runtime for the SS PR.

Record-Version: 2
Task-ID: d670e193-44fa-4fc9-a519-1455aafd004d
Base-Ref: 5b642aecb4d14fcff5f02037249b44a975bedec3
Started-At: 2026-11-18T00:17:17.218944+00:00
Type: tooling
Status: complete

## Context

Publish the checksummed HTML import and Cobalt authoring runtime for the SS PR.

## Changes

Advance the Node/WASM runtime package, Bun lock and release workflow to 0.8.5-synapse.8. Package the HTML multi-state import and canonical Cobalt authoring modules and their pinned Skill resources. Keep the release manifest schema, dependency selection and immutable asset upload policy. Preserve snapshot color extraction through multi-board imports. Merge later palettes without replacing earlier definitions or changing native board geometry.

## Validation

- Passed: `node --test packages/dsh-node-runtime/package.test.mjs scripts/check-dsh-runtime.test.mjs` (17 tests).
- Passed: `node scripts/check-dsh-runtime-dependencies.mjs` (168 packages).
- Reproduced and corrected: the existing rich-HTML test observed zero exported color variables. The same test passed after reusing the snapshot palette extraction. Three focused grouping, cumulative palette and CanvasKit checks passed.
- The initial broad run overlapped Electron and reported two timing failures. Both tests passed in isolation with the original thresholds.
- Passed: `node --test --test-concurrency=3 packages/dsh-node-runtime/*.test.mjs scripts/check-dsh-runtime.test.mjs` (324 passed, 40 skipped). The renderer restart test now waits for its owned operation before counting starts. Final targeted palette and restart regressions passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Retain the prior snapshot palette using the shared converter and wait for the real headless restart completion in its regression.",
      "sha256": "5d47d1891ac9812fc01aed012a015cd567eaf2e735ce08fa2de779fd53c66f54"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Review the runtime workspace version bump and the renderer restart test synchronization. Locked dependencies, renderer grace thresholds, production launch behavior and build contracts remain unchanged.",
      "sha256": "333f68c34d7f15adc94429fe9bdca1cbb21a24627d32162caac8a623e5bad0b2"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

SS pins the release only after checking the uploaded archive hash and manifest revision. Private Cobalt application installation requires network reachability and remains separate from runtime packaging.

## Changed files

```json
{
  "files": [
    {
      "path": ".github/workflows/dsh-runtime-release.yml",
      "before": "69315f5e3e7183f0db01bf0c510ffe92c4d4bacf949bc7d216bfaf76b234c139",
      "after": "4538bfadad60e55c590b334a8d49f89c1da5c7bad9df19fd138fac639d1f1c47"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "39d60860b757f659720b069c5f5da2a5c69acdec4dc4e7a16aba0e5362248a8f",
      "after": "5d47d1891ac9812fc01aed012a015cd567eaf2e735ce08fa2de779fd53c66f54"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "7a8691d66f26e73f7783837b1d2c87fe404ca73710a26b5459436d8149c72a19",
      "after": "333f68c34d7f15adc94429fe9bdca1cbb21a24627d32162caac8a623e5bad0b2"
    },
    {
      "path": "packages/bun.lock",
      "before": "188f2c25edb00951464ed94ddb9b9816f36b7c98e59ee74bbd3a02561471e93b",
      "after": "2be41da3502a4597e314eaeaa057668e06601f21974cc5e106f96f9a8aa02f79"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "033f2c7db77950c1561fefea625f5a0fdbdb24c36be72970924c54ddfe595285",
      "after": "d84e5f1635b8b7132eaa284ea153df8c60ac134075ea95401b1f06f16857ec1e"
    },
    {
      "path": "packages/dsh-node-runtime/headless-renderer.test.mjs",
      "before": "6a6befb9f86d7de290cba53bbbb5a502279c613679a3c6ad425951a62c261227",
      "after": "a15a19e97cf7afa781615a4869a2d482af8e4caf893422cb86604ac3e7eabeaa"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-checkpoint.mjs",
      "before": "381f97402a2b9817289935ff930b4af430e6703ee0043d712504c726405f4ffc",
      "after": "b3a6d1311324c1719733c5657982cd04d4f23e758abd793ed083f08cb7d78b49"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.mjs",
      "before": "fa14ab1e8dcad2d6f03bf6ac2b077cee5e8e04cdf267df4a8bd9eb29d9d14151",
      "after": "92cfdaaa59dd29e8c5a4e28ef954d80dc0f8fb365d375093bf79286bfe37f814"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.test.mjs",
      "before": "c73c523489edd39f3bc5f8ff0481f11db113615e19bf7b65bfd459033f823e43",
      "after": "ba9abeadab138492dd8384533fd6b3c85329965be98005acf1486820e63028ec"
    },
    {
      "path": "packages/dsh-node-runtime/package.json",
      "before": "9bbe083f20646acd9c8b9f89318e15073acb88f8dcd6a3745185f649c174e9e7",
      "after": "9928a2822cf2f50560ea57d97430b9ebeab324e7b3a2a2a0a66dd107174edab3"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "cd5920e7435ec5bc90920a1c10ec837008c59f94b97baedc79cc5393ee2ead6e",
      "after": "6487af7aee503d6d8d9f8cca84df9bf33a10dac8d0eace71acc7d9e60ba25638"
    },
    {
      "path": "scripts/check-dsh-runtime.test.mjs",
      "before": "29d03352671288a0f5ee38ab10d5ef0f6172889fda0725bb0cc23cebd9f00fc3",
      "after": "1561dec31b9e541be1c4d31e74c3efbb371500108c69e13ec5f12d66d4575f61"
    }
  ]
}
```

Completed-At: 2026-11-18T01:39:55.490962+00:00

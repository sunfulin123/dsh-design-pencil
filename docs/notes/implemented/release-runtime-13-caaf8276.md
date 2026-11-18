# Publish the next checksummed Design runtime for Synapse Studio

Record-Version: 2
Task-ID: caaf8276-a871-4ea0-8af7-b22a24884143
Base-Ref: 3552d71527d96ce986ebd0ccb9859fc43e972b6f
Started-At: 2026-11-18T15:09:54.255792+00:00
Type: tooling
Status: complete

## Context

Publish the next checksummed Design runtime for Synapse Studio

## Changes

Advance the Node/WASM runtime to 0.8.5-synapse.13 in the package, Bun lock and release workflow. This version carries HTML viewport fidelity, offline icon and SVG resources, startup diagnostics and the split browser extractor.

## Validation

`node --test packages/dsh-node-runtime/package.test.mjs scripts/check-dsh-runtime.test.mjs` passed all 18 tests. The dependency policy, Rust formatting and Chrome extractor bundle synchronization passed. The underlying changes passed the browser and native regressions recorded in their task notes.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The runtime package version increments without changing the build or dependency contract.",
      "sha256": "68c10bb49a6a86e321f5af19c5ff790093baa1dcfc263d99e0e1724db4f2db12"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Synapse Studio pins the released runtime version, the source revision and the published archive digest.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "4db96c217bb7f045e658780f4ffd466d0348bf6c0114169421882b4a31e87907",
      "after": "68c10bb49a6a86e321f5af19c5ff790093baa1dcfc263d99e0e1724db4f2db12"
    }
  ]
}
```

Completed-At: 2026-11-18T15:10:34.490268+00:00

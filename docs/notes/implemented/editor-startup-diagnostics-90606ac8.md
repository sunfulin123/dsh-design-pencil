# Report string errors when the managed editor rejects a malformed OP document

Record-Version: 2
Task-ID: 90606ac8-2952-4fa2-b50f-46a49fd49651
Base-Ref: 3552d71527d96ce986ebd0ccb9859fc43e972b6f
Started-At: 2026-11-18T14:36:11.038245+00:00
Type: fix-bug
Status: complete

## Context

Report string errors when the managed editor rejects a malformed OP document

## Changes

Format both JavaScript Errors and Rust/WASM string errors on stderr when the managed CLI fails. The editor continues to reject invalid OP data before reporting a successful handshake.

## Validation

`node --test packages/dsh-node-runtime/package.test.mjs` passed all three tests. Before the fix, the malformed image mode fixture exited with code 1 and wrote `undefined`. After the fix, it reported the schema error and kept exit code 1. The staged runtime also completed the valid handshake and shutdown.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [],
  "none_reason": "The change corrects reporting of an existing managed CLI failure. It leaves the document schema, startup handshake, and failure policy unchanged."
}
```

## Risks and follow-up

Packaged hosts receive the improved diagnostic when they consume a runtime release containing the fix.

## Changed files

```json
{
  "files": [
    {
      "path": "packages/dsh-node-runtime/cli.mjs",
      "before": "7885dc1d9483c4d1bdd4e9f5dce74a5b072eb53cb5459cb2697dcae73b82b043",
      "after": "ef2bbe4a2bbdceb1e83652054bf7184fc2cd42ec3c93131b5e0c83ef1325ce8a"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "3a443f54d71e606e4b0dbd74a4e16c31b5bb9977e98f8b69ea2d0c2a4f3de47a",
      "after": "2bab08cc02d57e34a8241ea4f5933311b3e64d668cfac97dd430756f8e5a1e0a"
    }
  ]
}
```

Completed-At: 2026-11-18T14:38:09.073068+00:00

# Embed remote SVG and font ligature paint in imported designs

Record-Version: 2
Task-ID: e8ec169f-a59b-4f85-acdc-5f509466dab0
Base-Ref: 3552d71527d96ce986ebd0ccb9859fc43e972b6f
Started-At: 2026-11-18T14:41:40.002250+00:00
Type: fix-bug
Status: complete

## Context

An SVG image could load in Chromium but remain an external URL when canvas export was blocked by origin policy. A source font could register successfully while its ligatures still failed to paint in the design renderer.

## Changes

Read bounded SVG response bytes from Chromium and embed a transparent raster derived from the original image. Keep a bounded compositor fallback for visible images whose response cannot be reused. Embed visible icon ligatures even when the source font registered, preserving surrounding editable nodes. Apply the same resource conversion to single-board and resumable captures.

## Validation

`DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-{fonts,frame-snapshot,import,state-import,state-visual,fidelity}.test.mjs` passed all 57 tests. The regression stopped the cross-origin SVG server before checking the colored pixels in CanvasKit. A read-only replay of the reported HTML embedded a transparent PNG and 13 ligatures, then rendered with a fresh font cache. SS staged the worktree runtime, built the Design plugin, and passed its `test:runtime` smoke.

The focused JS and task harness check passed. The combined maintenance check reported a pre-existing worktree issue in the earlier fidelity changes: `snapshot-extractor.js` has 1,090 effective lines against its 1,017-line legacy limit. This task did not change that file.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Document embedding downloaded SVG bytes and browser-painted font ligatures for offline HTML imports.",
      "sha256": "8faa1a7316f0ce3396f644ac6f122aeb4f7bdb7b42e491d94942d4b00f8000ac"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The importer uses the existing browser access and size limits. Resources that were blocked or could not be matched remain explicit coverage gaps. The bitmap assets are self-contained; ordinary source font registration continues to use the font cache.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "e8aba221a4f1321ac2367b3f48f0900c3b51324725c4079ae2baf3f03a4ff998",
      "after": "8faa1a7316f0ce3396f644ac6f122aeb4f7bdb7b42e491d94942d4b00f8000ac"
    },
    {
      "path": "packages/dsh-node-runtime/html-browser-capture.mjs",
      "before": "3d506fadf7ab78aa2f3f8bd3d46c1a717e330a3f79ec70283a6fb98f494c28ec",
      "after": "c33d16405bee279cd0b7a30a3da78a4bd2401fba41eb146508568dc0397a0fc6"
    },
    {
      "path": "packages/dsh-node-runtime/html-capture-page.mjs",
      "before": "8a85c86547f3cf55d292792b4cbc80472c2e17ad5a7c17c446119a738d511523",
      "after": "668a18d29b1ed30db659f891784e60dde91cab313ac99f0a17b3fe32d451ab3e"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.mjs",
      "before": "3ee0a23fa536b94242e4bd625de78b8e6594b88ef5bef80893d15245e8be6998",
      "after": "749aec8750a2a048abc25867d58fdbbb1b96d3e3c5a7f6c7c2bb80f0419e72dc"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.test.mjs",
      "before": "2de84932f5b6521c97f56ad240255a50f555bcbe5eba8edc3458f0f04b7f9975",
      "after": "049d124e0b54770d5d557096a7c4e2d9751a6b54368b1c316cb46132cccd2711"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-snapshot.mjs",
      "before": "c406e44491d02448a4bf695972cc302cd9db847dc9fd9d9dcf00ad4543109b6c",
      "after": "f24e356fb4e56e271262abc2bc97323e5a331d02381c47def56bb58698e1849e"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-snapshot.test.mjs",
      "before": "00bea491d45b47829298d80bd8b5e97c1aac8fe8c05fd4d19cc66a7049531a19",
      "after": "ba17a4b7a8a6c27c83298a7a731d8a94a1bd815497b014eff810445e7c951a6a"
    },
    {
      "path": "packages/dsh-node-runtime/html-import-tool.mjs",
      "before": "c83c4b54ad208661e1bf55be66dc6ba329d12d03876939a2d8712a5aacad9089",
      "after": "e29f82f5bf2ba6b90001b1e78cd92ab1ea14d7481ceb740fc4b676dfb046085a"
    },
    {
      "path": "packages/dsh-node-runtime/html-import.mjs",
      "before": "5a7ca4ef1f8758134d75d1a642cfbdf4a1e6739c3e2a7d28bd03720446d5e790",
      "after": "90f3741f7f4b2122a7a960fe03def2ddd1e961184b994e32fb2f17261b5f87d8"
    },
    {
      "path": "packages/dsh-node-runtime/html-snapshot-augment.mjs",
      "before": "699bd3ff1534f56aa769e5146e04c012718fa33010c26bf378739a8d7cee0b8b",
      "after": "9a96a2a4ff1febf0e03c381f12ab9c67ac4ada067511a85d6a625cb21053ec41"
    },
    {
      "path": "packages/dsh-node-runtime/html-svg-assets.mjs",
      "before": null,
      "after": "2f77f4f48443f9238ae4479d8569c9f0fbfa9af6a05c9cd94b22806f7171a5c9"
    }
  ]
}
```

Completed-At: 2026-11-18T14:54:15.412267+00:00

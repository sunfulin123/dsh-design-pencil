# Preserve browser layout and paint when importing a responsive HTML page with iframes

Record-Version: 2
Task-ID: 52f079e1-5f89-4013-a70b-870d9cc80df1
Base-Ref: 3552d71527d96ce986ebd0ccb9859fc43e972b6f
Started-At: 2026-11-18T13:58:55.987122+00:00
Type: fix-bug
Status: complete

## Context

A same-viewport replay showed that the source itself reflowed with a narrower application frame. It also reproduced missing inset selection accents, square ends on rounded asymmetric borders and undersized placeholder text.

## Changes

- Retain native input placeholder font, color, position and content clipping.
- Convert sharp offset-only CSS inset accents to editable geometry. Clip asymmetric inside strokes to their round box silhouettes.
- Document the outer viewport versus the embedded application viewport. The Synapse Studio Host passes an optional width through analysis and every continuation batch.

## Validation

- `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh` built the Node/WASM engine and CanvasKit editor.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-state-visual.test.mjs` passed all seven tests, including local pixel assertions on a same-origin iframe and placeholder style.
- A read-only same-state replay at 1440 × 900 measured a 1.63% whole-board mismatch. The wide state with its secondary pane closed measured 0.80% at 2118 × 1279. Both use the existing per-pixel tolerance of 24.
- The SS job suite and focused Electron import scenario passed. Electron checked the specified 1200 CSS pixel viewport on each saved board.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Document how the browser viewport, native placeholders and supported selection strokes map into imported designs.",
      "sha256": "e8aba221a4f1321ac2367b3f48f0900c3b51324725c4079ae2baf3f03a4ff998"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The source has some localized icon and stroke-style differences that a whole-board ratio can underweight. The regression separately checks the supported selection, corner and placeholder cases.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_overlay.rs",
      "before": "bee0cd1e45ed9efb03fb1671704d356de2c18ed8d1ebe669bf47933d920a6c4e",
      "after": "0c25a23fc53fae892d00e2b81fc6231b349b173012867abca98b0dfc659b6bcc"
    },
    {
      "path": "crates/op-html/assets/snapshot-extractor.js",
      "before": "726acddb0534de1e562674944af7a233b79c27c67ccb9704aa44afa6ea4d84f1",
      "after": "03e82eb537bca896a5f14a43e3853645e832c9088890c24927c5b51c82149042"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "2141fbf9c92d4a073d495435f698947cf1dca475a5e4300781771925dc12982e",
      "after": "e8aba221a4f1321ac2367b3f48f0900c3b51324725c4079ae2baf3f03a4ff998"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "1f425fd8e0d40424f8b595f16e404f79acebed0047c7b652c4b406566ecfda79",
      "after": "66c771d4fe41f96671426977caaf0633d7916721914d157404827b0725fe4bc3"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-visual.test.mjs",
      "before": "923a6b775faf10a3d9bede18b9bdd96ab97e8f45ca913761f3767e6b003bb075",
      "after": "0fe365420c1b90ada2d086aea9bc1c90bbd752e137d8954f779be1db8531138f"
    }
  ]
}
```

Completed-At: 2026-11-18T14:35:23.782085+00:00

# Preserve JavaScript FontFace sources and SVG-masked icons during HTML import

Record-Version: 2
Task-ID: e5addd2f-8415-4bb2-a624-7a511ff016df
Base-Ref: 3552d71527d96ce986ebd0ccb9859fc43e972b6f
Started-At: 2026-11-18T13:43:06.921931+00:00
Type: fix-bug
Status: complete

## Context

The browser importer enumerated CSS font sources and left JavaScript-created font faces without download candidates. CSS SVG masks also lost their paint when the snapshot recorded only the element background.

## Changes

- Record declared URL alternatives for JavaScript-created faces in each browser document. Collect only faces present in its font set and reuse existing font download and registration safeguards.
- Capture CSS URL masks and inline SVG masks from browser paint, including accessible frames. Match each crop to its snapshot node and record visible-area, geometry or resource limits as coverage gaps.
- Bound long-document capture to decoder-sized bands at source scale. Keep unmasked surrounding nodes editable.

## Validation

- Before the fix: the Chromium regression found no source for the constructed face and no shaped image for the SVG mask.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-{fonts,frame-snapshot,import,state-import,fidelity}.test.mjs` passed all 48 tests, including source order and registration, root and iframe CSS masks, and inline SVG masks on a 4,500-pixel document.
- A read-only replay imported the first board of the reported source and registered its original icon family from the page, without font or mask warnings.
- In Synapse Studio, `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <design-checkout>`, `pnpm --filter @synapse-studio/ss-dsh-design build`, and `pnpm --filter @synapse-studio/ss-dsh-design test:runtime` passed. `pnpm test:e2e:prepare` and `SYNAPSE_E2E_RECORD_VIDEO=0 pnpm exec playwright test --grep 'dsh-design imports iframe screens into one resumable design'` passed the focused Electron import scenario.
- Vet was unavailable because the configured provider credentials were missing.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Document dynamic FontFace provenance and compositor capture for CSS and inline SVG masks.",
      "sha256": "2141fbf9c92d4a073d495435f698947cf1dca475a5e4300781771925dc12982e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Mask assets capture already composited pixels, including their background. The existing original TTF/OTF requirement remains in effect for document font registration. Existing published runtime pins require a new release to distribute this fix.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/html-import.md",
      "before": "4c8d9b9ee5c9e99761200d4c679ec359ceecc1fa3198188915acda45f02c1e71",
      "after": "2141fbf9c92d4a073d495435f698947cf1dca475a5e4300781771925dc12982e"
    },
    {
      "path": "packages/dsh-node-runtime/html-browser-capture.mjs",
      "before": "d84ab7aa8bb104133d3dd83fc176460b0e296d53154c45fe17abc9812ab81548",
      "after": "3d506fadf7ab78aa2f3f8bd3d46c1a717e330a3f79ec70283a6fb98f494c28ec"
    },
    {
      "path": "packages/dsh-node-runtime/html-capture-page.mjs",
      "before": "afd942a92ef43337a32136dc8456fe91beded3badee2bb6c5533fd5e5b358ca4",
      "after": "8a85c86547f3cf55d292792b4cbc80472c2e17ad5a7c17c446119a738d511523"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.test.mjs",
      "before": "445fa93e63748aebb0b1ebe16af05f4bafc52bcd2af39c5352fd2bf109dbcb0a",
      "after": "2de84932f5b6521c97f56ad240255a50f555bcbe5eba8edc3458f0f04b7f9975"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-snapshot.mjs",
      "before": "d621ee53bf0829dd94f1e28a54b7a8dace2759282a5811500209346dc7769fc8",
      "after": "c406e44491d02448a4bf695972cc302cd9db847dc9fd9d9dcf00ad4543109b6c"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-snapshot.test.mjs",
      "before": "b8f6936331df607aef4ca67fd97f75765cc7c2db76545b87a9afd81773e2e7b3",
      "after": "00bea491d45b47829298d80bd8b5e97c1aac8fe8c05fd4d19cc66a7049531a19"
    },
    {
      "path": "packages/dsh-node-runtime/html-snapshot-augment.mjs",
      "before": "50012369534a256d887cd006487e3072100c9f86f785000919527b9d7dd176f0",
      "after": "699bd3ff1534f56aa769e5146e04c012718fa33010c26bf378739a8d7cee0b8b"
    }
  ]
}
```

Completed-At: 2026-11-18T13:57:37.230678+00:00

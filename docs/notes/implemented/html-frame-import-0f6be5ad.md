# Import editable same-origin frames and checkpoint captured HTML states

Record-Version: 2
Task-ID: 0f6be5ad-4744-446b-9675-a536d4654920
Base-Ref: 886eabd43287bc418711312241457e47850c7eb3
Started-At: 2026-11-18T07:38:02.477456+00:00
Type: fix-bug
Status: complete

## Context

Import editable same-origin frames and checkpoint captured HTML states

## Changes

The HTML state importer traverses reachable same-origin iframe documents during discovery, replay, and editable capture. Locator plans can use an explicit frame path and an exact semantic target. Editable child trees retain their scrolling offsets and clipping within the parent snapshot. The runtime emits progress and durable per-board checkpoint receipts. The SS host publishes the same version-checked output file before advancing another batch and supports explicit save of stopped partial results.

Original icon font sources are resolved before conversion. When a face cannot be registered, uniquely matched Chromium glyph pixels preserve its observed appearance. Missing crops remain resource gaps.

## Validation

- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/html-state-{import,groups,visual}.test.mjs`: 30 passed. `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-frame-snapshot.test.mjs`: editable child text at projected viewport coordinates, 1 passed.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-fonts.test.mjs`: 12 passed, including a dynamic iframe font, rendered glyph fallback and a missing crop report.
- The actual Team Requests delivery reopened as one editable document with four structurally verified boards. CanvasKit compared each board with the Chromium source at 1440 × 900 and measured pixel differences of 1.48% to 2.06%.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Capture iframe screens and save existing boards before advancing.",
      "sha256": "9c5cfaafa6b365b19951e3c4a75b46bb02c485b0cfec3a38a29dd1302255a36c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document the HTML import checkpoint and scoped action contract.",
      "sha256": "08b6a10b431c9387d6d1d4a63c5a4d8e6f7de3449a7deaac1be82e03c136575a"
    },
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Document iframe traversal, placement, checkpoint delivery and resource evidence.",
      "sha256": "09d6a90ff2dce9d1ddf344995e22eb1a074493b79a6ad7d1e5edfac0c7f08e97"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The Team Requests sample retains other pending candidates, internally scrolled content, and glyphs without verified crops as coverage gaps. Cross-origin or inaccessible frames are reported separately. The installed product receives this change when it builds with the updated runtime.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "4ade5f181d0eb3bc04c6b58cc1ec988c11460e755d23e7e85b91c3afd1ebeda3",
      "after": "8bb5583151d6661708698f567e32c8627894de5cbc9e68b0ddcc40c8ed778fc9"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "5d47d1891ac9812fc01aed012a015cd567eaf2e735ce08fa2de779fd53c66f54",
      "after": "09d6a90ff2dce9d1ddf344995e22eb1a074493b79a6ad7d1e5edfac0c7f08e97"
    },
    {
      "path": "docs/kb/product.md",
      "before": "d037d0edc883249cc6a5c16e78a89c3fd912f9fa8e115f5b1d50b375a3fc16ef",
      "after": "9c5cfaafa6b365b19951e3c4a75b46bb02c485b0cfec3a38a29dd1302255a36c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "ee386e4ad9f1f5e244181c8e8edab37bc2e2ec6407540067bab67d00b0a674e0",
      "after": "08b6a10b431c9387d6d1d4a63c5a4d8e6f7de3449a7deaac1be82e03c136575a"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "6e792bbe30fc8bdc83b48c7780fa4dfae19f68fe953c30ec4c8e8eade9f75b06",
      "after": "46016ee098bda668e06d1c0f59839deccd19ce98fb25e42a8b4a283cc53b1b7f"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": "cb69699f9b1e99f7646b0cafac2109383179421539dedd2e4ccbdcd058c944b6",
      "after": "c4a6658d126d18c3bd8b28007c111da1337cfcc6ef327e1c5b7498e2b14fd4a6"
    },
    {
      "path": "packages/dsh-node-runtime/html-browser-capture.mjs",
      "before": "fa7baf1c2fd0550410f4e5fa9a3094aa543ce9f6f38d5018e329e30bd6229739",
      "after": "d84ab7aa8bb104133d3dd83fc176460b0e296d53154c45fe17abc9812ab81548"
    },
    {
      "path": "packages/dsh-node-runtime/html-capture-page.mjs",
      "before": "e6a42fb86c4214b17934ca9f83151c2b14ae015cebe27fc98db9404321f6ac69",
      "after": "afd942a92ef43337a32136dc8456fe91beded3badee2bb6c5533fd5e5b358ca4"
    },
    {
      "path": "packages/dsh-node-runtime/html-font-defaults.mjs",
      "before": "c7b21f10a58bb74c9131ec620ad171a938b4f167f2f11170b3ab7c78176f8671",
      "after": "b8449adf30f0257f864d1b6b5ceb42e0b77c49786389a008cb182229f26cde8a"
    },
    {
      "path": "packages/dsh-node-runtime/html-font-stylesheets.mjs",
      "before": "d9a6afb775c8cff92e0a13b97cc7ac194e13b98a648a0d0e7365ab5cb58494a1",
      "after": "b0f449b2d03f1b085031f2e1839a3de72a40d158acb0be71b56e76ccc03836b2"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.mjs",
      "before": "07353531c9cef3cda0f56d5fe777245712fd1ca75b689874fdb687f63cc33603",
      "after": "3ee0a23fa536b94242e4bd625de78b8e6594b88ef5bef80893d15245e8be6998"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.test.mjs",
      "before": "253e52003e303bfa39e34bf13e867b4476697917929a161c3301419360ab3fb8",
      "after": "445fa93e63748aebb0b1ebe16af05f4bafc52bcd2af39c5352fd2bf109dbcb0a"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-context.mjs",
      "before": null,
      "after": "6c2bc5f4516b10b0ecbd0eeea93d9dc59bfab516d2b7b0f0b5c9e88e6efa7779"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-snapshot.mjs",
      "before": null,
      "after": "d621ee53bf0829dd94f1e28a54b7a8dace2759282a5811500209346dc7769fc8"
    },
    {
      "path": "packages/dsh-node-runtime/html-frame-snapshot.test.mjs",
      "before": null,
      "after": "b8f6936331df607aef4ca67fd97f75765cc7c2db76545b87a9afd81773e2e7b3"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-actions.mjs",
      "before": "1adbae6a3ba7fe5cb321f83b8a52337f168bc2b29cf8093fbcf8243ac8523bbb",
      "after": "69cebeddcbccb6e1f99e3121efdb40c2663e59ee47708a295364121cbdcb3eab"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-checkpoint.mjs",
      "before": "b3a6d1311324c1719733c5657982cd04d4f23e758abd793ed083f08cb7d78b49",
      "after": "9ec218611e9c0c5c784229124c905518ea303d66150de19a25adbe998d73293d"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-discovery.mjs",
      "before": "7c7dbb7ee22dcbf2f5b31968884f13e83ba01ea2adf3f7ff04014d6ad4b28a99",
      "after": "e95f6403c81d0c6fb30dcfa4e26c5c9d2d8cb9e9dfcd9c07f3f72247c5a7629b"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.mjs",
      "before": "92cfdaaa59dd29e8c5a4e28ef954d80dc0f8fb365d375093bf79286bfe37f814",
      "after": "17c0a1508d7139fbe5155fcbb25cd2759c39757c170aadf50ebc04e3b235fb23"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-import.test.mjs",
      "before": "ba9abeadab138492dd8384533fd6b3c85329965be98005acf1486820e63028ec",
      "after": "7865a2d0626aed66a7b8c80d914d0ec761e087eba8d7c3a5e83f1f04d53c1d2a"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-input.mjs",
      "before": "5d81a1a101b181f25a4c9e4253234a63651d2910a785a69db4435211975096ba",
      "after": "857caf9117b36435116513c7ab2ab44308fe06b7aaeff3a163079feaea58406b"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-report.mjs",
      "before": "ddc82acebce2ebe8015242d9f2d8cb419f7af89485d8367c3b70eb3c779eb64e",
      "after": "6b7994cee132e675eb62e002e8b17efaf25f403f016dac6c460e959c6389f576"
    },
    {
      "path": "packages/dsh-node-runtime/html-state-resources.mjs",
      "before": null,
      "after": "be78ab22b8a0b510f8716c7a507e17252b40db3389a8a2425ee82c90a3a5b05d"
    }
  ]
}
```

Completed-At: 2026-11-18T08:16:34.240333+00:00

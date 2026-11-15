# Add source-copy Card widgets, ECharts gallery and screenshot-faithful Team Schedule recipes using Cobalt, inspect WFM source read-only, switch callback note to Textarea, and synchronize AI docs, SS and maintained preview.

Record-Version: 2
Task-ID: f888d1cd-9e01-4664-9e2f-bb305f51d987
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T08:22:49.694388+00:00
Type: feature
Status: complete

## Context

Add source-copy Card widgets, ECharts gallery and screenshot-faithful Team Schedule recipes using Cobalt, inspect WFM source read-only, switch callback note to Textarea, and synchronize AI docs, SS and maintained preview.

## Changes

- Added Card widgets and retired the compact Users list recipe. Includes all supplied metric/donut, template, empty-chart, use-case, sentiment, keyword and shift-distribution patterns; local add/configure/delete, Done/Discard and shift selection work.
- Added a shared real ECharts renderer and ECharts gallery covering prediction/history, stacked CVO/AHT and staffing/shrinkage, and scenario comparison. Theme-aware canvases resize and release observers/renderers on unmount.
- Added Team Schedule with the screenshot header/toolbar/filter strip, 24 hourly columns, six metric rows, 306px sticky agent column, 60px rows, green/yellow/striped event segments and pinned pagination. Search/sort, local filters, selection, adherence and event create/edit/delete are available. Search wraps rather than collapsing inside the narrower Workspace business frame.
- Changed Add callback Note to the copied Cobalt Textarea with multiline input. All controls/icons use Cobalt or local Extensions; ECharts supplies charts and our CSS composes the schedule grid. Upstream Atlas, Cobalt and WFM remain read-only.
- Recorded read-only WFM source revision/hashes in recipe support/recipe-sources.json. Updated catalog, generated recipe docs/AI indexes, workspace companion, documentation navigation and regression expectations. No extension package import/install is generated.
- Staged the complete runtime into the SS worktree, updated its scaffold contract test, integration README and existing owner Agent Note, and built the plugin/desktop. Updated the maintained 57481 prototype: Admin → Card widgets / ECharts gallery, WFM → Team Schedule; Conversations retains Active call with the new Textarea.

## Validation

Passed:
- `bun run docs:build` in packages/talkdesk-cobalt: docs/example typechecks, Vite demos and 279 Astro pages.
- `node --test test/reference-recipes-browser.test.mjs test/active-call-browser.test.mjs test/site-browser.test.mjs test/table-edge-browser.test.mjs test/export.test.mjs`: 17/17 passed. After the final toolbar/pagination adjustments, reference-recipes-browser.test.mjs passed 4/4 again, covering 331/390/640/1125/1440px and dark mode.
- Active call callback Note asserts a TEXTAREA and preserves a multiline note through scheduling. Card tests exercise screenshot content and add/delete/Done/Discard. Schedule tests measure 104px header, 48px filters, 306px sidebar, 60px rows, 46px working events, fixed footer, search, filter apply and create/edit/delete.
- SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: 1/1 passed against the final staged bundle, including the new recipes/support/provenance and no installable Extensions package.
- SS `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build`, `pnpm run doc-check` and `node --check plugins/ss-dsh-design/tests/cobalt-project.test.mjs` passed. Builds emit existing third-party directive/declaration and chunk-size warnings.
- Created a fresh project through SS's staged cobalt-project.mjs, installed with `pnpm install --offline --ignore-scripts`, mounted copied Card widgets and built successfully. Refreshed final recipe sources through a further SS scaffold export.
- Actual 57481 browser navigation opened WFM Team Schedule and both new Admin pages; three gallery canvases rendered with no page exceptions. Final native Profile → Theme → Dark and Phone preset checks measured a 331px business iframe with exactly 331px document width and footer bottom 798px inside its 798px height. All six page states were switched through the real shell toolbar without exceptions. Maintained server and old hashed assets are preserved.
- Vet reported no issues for the new recipe units and final integrated scope. The final toolbar-only and 331px pagination reviews reported no issues.

The 390px shell preset leaves a 331px business iframe; an additional check caught page-size overflow there. The native pagination wraps to two rows below 360px while staying pinned. Default focused ESLint reports this test file is ignored by the repository configuration; rerunning with `pnpm exec eslint --no-ignore plugins/ss-dsh-design/tests/cobalt-project.test.mjs` passed, alongside Node syntax and scaffold contract checks.

Initial checks caught invalid native props, an inaccessible hidden-icon text expectation and a 1px filter-band mismatch; these were corrected. One navigation check ran while Astro was rebuilding its output and found no index.html; the complete suite was rerun after build and passed. These initial failures are not counted as successful runs.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "No engineering policy or public runtime contract changes for additional Cobalt recipe content.",
      "sha256": "28dae2894e6a70371e64c17f5739356c1893a7345c42a872d7e563976e84b5ff"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Include the 331px business-frame pagination boundary in the verified recipe behavior.",
      "sha256": "ddef9a03614462cc554f5c327a599f238767702632118724c7d64a54bfa350f6"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The final narrow pagination adjustment stays inside copied recipe CSS and does not change runtime contracts.",
      "sha256": "fcde82fdface39621f857b3394a2243ba3a5d1824973f429d018e3bf07a2ae98"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Data and persistence are local examples: no telephony, WFM backend, model service, scheduling solver, real timezone conversion or queue-membership model. Metrics pins toggle their pressed state but remain visible; only Day view is provided. Widget edit handles are visual references, without drag/resize. No new E2E/Cucumber document generation was added. Source-copy/SS packaging and browser rendering were verified; no fresh model-driven SS conversation or packaged DMG/Electron workflow was exercised because no Host/Client/native contract changed. Native ECharts supplies legend/zoom behavior; the focused tests verify canvases, themes, resize and card actions rather than exhaustively checking every chart gesture.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "1bd5e6ccbb3a2f0559b3e8d4db8ac5dce0bebf31e7505fe8dac3130cb0e80a16",
      "after": "ddef9a03614462cc554f5c327a599f238767702632118724c7d64a54bfa350f6"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "b335253bf46b79d2c1c229a713130d18029be890b54441651a45764ffef2d080",
      "after": "fcde82fdface39621f857b3394a2243ba3a5d1824973f429d018e3bf07a2ae98"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "1b31b67078c341d304d1bfc8bd80ce8b1a4a248e1913f0700beb350530dce6f6",
      "after": "28dae2894e6a70371e64c17f5739356c1893a7345c42a872d7e563976e84b5ff"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/main.tsx",
      "before": "f253da3c6012164e0f33d1b950a8f5c1b71190ba252103044076b251bfae1173",
      "after": "5b9172bd577ad6491ece491fe84cc4982db5729c19b762660aadcff534d3b1a2"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "0a8b7c499b90851c561ea88cdb13684ab1a1980c10b1b7b25c6e1411622993ad",
      "after": "d34807de54c4fae55d44b8e15ff3cb5825ade1ad0d6f0ec0bbc44b5ce74bc0c0"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.md",
      "before": "5695a9850724c74e2a463de051e921a766769830dec44e025bfe077262322ad8",
      "after": "69df037bae4daec70663471e9450a8e1cf1c14c3b331763ea4851c4d85f2db41"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/card-widgets.md",
      "before": null,
      "after": "40698212b1a453b5e65180cb0e5c15566d892a026b232dd7b145fbcadfc607be"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/card-widgets.tsx",
      "before": null,
      "after": "59efa6de48c184edca0be1a80013662b99a58e9e77047a5201c4d06974522783"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "34ab0f698027d629d02785cb758473749b899a7553bcfb290eb5ee9d4d5bed51",
      "after": "a99499f6126374731b20f2196181a8e068e67c30b2adbeb759b96d1c3629a37e"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echarts-gallery.md",
      "before": null,
      "after": "7be7a511f994e2e608bb84d96f1d536837ba6217aea9a9c0d28a18f5ec4366e0"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echarts-gallery.tsx",
      "before": null,
      "after": "e646abb507aa5087f38745c974501e68d0831893cbe5d0c78c6435e50eb5af8d"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.md",
      "before": "92cba9a3ecf008a80b7af3689abc72b5080a1ad1e5ab6ad1b97ac8d5991eef38",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.tsx",
      "before": "5964c6cc5183bc1aff218322a4143054775c14d140ff040cc52a155fa46ce47b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/call-dialogs.tsx",
      "before": "16efbc16284031624935236f971d23069abd4f9ddec4f71e52b4ab0ca75b3221",
      "after": "ef9256ce86a4f279df0241a30c5133c8b18c64852d99af3b3a85b8c43b511b92"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/recipe-sources.json",
      "before": null,
      "after": "6fcb0a5ab65c02d3c8def00d1612380b40cc65380be78d4fc94bd348c0a92e44"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/reference-charts.tsx",
      "before": null,
      "after": "9e6900bede41b025e0ca44dfb6285038e2db4f160bd448757cbb029d2341d6ea"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-data.ts",
      "before": null,
      "after": "e6f14ae1e965f7eedcba571d1182585ae897b9e6c8541faf8663f9e6f12dea2b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-header.tsx",
      "before": null,
      "after": "f87c7a2f1dfa1b5014ac9f1d03ab94a853a86a5c724bc83c748388e9e90aa8e2"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-timeline.tsx",
      "before": null,
      "after": "2640c6ee583ab2b563d26c073c2e35a796d7c5352bca800e3587dcf671b7e629"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/team-schedule.css",
      "before": null,
      "after": "c87d08d0e1e445ace1c3183e979d6b9085a2be0d2aac9ed64ed56d6b81d22977"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/widget-gallery.css",
      "before": null,
      "after": "e372c5c6b2a04075d3db143b7e066c7114295bd629101f58fa184e58c1874e95"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/widget-patterns.tsx",
      "before": null,
      "after": "868ccb988eda8a89f273164af366d8bd1b33d4fced9b288c77b85d86e88475b2"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": null,
      "after": "2d60f060a88f5efb264e0f8a727c9b423ce067cb41e2159bec77564005e24c8f"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.tsx",
      "before": null,
      "after": "e48888a556cba19e6af728d95fe4ee85a0b512184e6e2bd3d23cb694ba24b456"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "af00a788a054a68f886301d7e5c935cdfdac2760ca626234042affec71c4b907",
      "after": "5a3306606fcac95ce1da64f3830b7406522d103210a136361b3aec9926e1c7b5"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/lib/catalog.ts",
      "before": "83fab739d43f6d5c05d38240838d1ebb6e63578a39d41358246c1af84b325ed9",
      "after": "2ff203b0c8ed6420df8f10657069293e47c28282c73c932b4eb14f3aa398a423"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/index.astro",
      "before": "720dff21342e7ca8161dd029a561638899484b8fd4c33bb97a83d9a8e86ccb8e",
      "after": "3ef6519a19d656f1722a4f3b2617a16eea0b17acc49e51b0fecb01bb47d3d1fa"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes.astro",
      "before": "be4b4a68fbe2d5161c9ed8720df15c13662c0523135c6e14b839e100a8b26eba",
      "after": "131295f25fa6585d3307cc315274f4feaf373f6bc2af19b89e52bfb7516e732d"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "a4d2b5f0b1ec74199f0e513432529004112b982894c85300cdb246a0931df872",
      "after": "0b135e83f28d6001657c01ca14b7ce929ac644b9a32c18b501b365e9958d3412"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "04cf50995ce021de7bb9263cee2bcb55d530573d7c9e7b3ce1eef5e342cbb4fc",
      "after": "53267d06781ed6cc5a699f057b4614c0fedd59207846557c479345e27198f6c9"
    },
    {
      "path": "packages/talkdesk-cobalt/test/active-call-browser.test.mjs",
      "before": "8064513586c44c2f875012040f39feecbde572a0f57f169aab62de5dff2dfd2c",
      "after": "1a6ddb9f509dc6b1c16cf267dae84fef9d4b2c2001eac43d077ab65f2c80dfe6"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": null,
      "after": "91f9e7af529bd0ddfdd53bcf52e1af218058364fd987258d4a3470028c87d30c"
    },
    {
      "path": "packages/talkdesk-cobalt/test/site-browser.test.mjs",
      "before": "4c04d93ff0a52d01e7406c41e51da2aea0ba29ce263fa1730d85aed773a29c03",
      "after": "784d406aa82e61d8f78c307df3d1800747a1f2e12fef73e062ea2bd82d3c475c"
    },
    {
      "path": "packages/talkdesk-cobalt/test/table-edge-browser.test.mjs",
      "before": "1a36c188e40c70099cca592e2e0e2f75412ef89c8b744a3054b80b49517b915d",
      "after": "d0c59b26da3ac2bca2afb8a92e3a7d8f4ca58b6105b9a226269de080327c083e"
    }
  ]
}
```

Completed-At: 2026-11-15T09:02:15.743880+00:00

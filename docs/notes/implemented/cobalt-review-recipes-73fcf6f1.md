# Refresh notification and mobile review UI, fix bounded list pagination/header/filter flow and add screenshot-faithful Echart insights recipe

Record-Version: 2
Task-ID: 73fcf6f1-6ec3-4661-b66b-f82c5b89f762
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T02:59:21.142464+00:00
Type: feature
Status: complete

## Context

Refresh notification and mobile review UI, fix bounded list pagination/header/filter flow and add screenshot-faithful Echart insights recipe

## Changes

Owned chrome renders compact notification history with accessible read actions and sample items, and replaces Desktop app sizing with a fixed 390 × 844 Phone preset. Adapter version 6 validates persisted preset values and never widens the phone to fit optional areas. Upstream snapshots remain unchanged.

ListPage uses the local AppPage/AppPageHeader with compact title/description spacing and vertically centered actions, a draft Filters SidePanel, and a bounded BasicTable. minTableWidth applies inside the column scroller while pagination remains within the host. The layout observer watches bounded allocation, not row content, and short bodies can scroll below 200px. A full-shell regression first failed with footer bottom 1338px in a 536px frame; it passes after the fix.

Echart insights reproduces the supplied page composition with date/range navigation, queue chips and draft filtering, Summary, chart creation/removal/collapse, two predicted series, dual axes, legend, tooltip and data zoom. The modular Apache echarts 6.0.0 renderer uses Cobalt theme tokens and cleans up chart/resize/theme observers. Filters uses existing Cobalt controls with a local badge anchor and an accessible button name on narrow screens. All metric/queue content is sample data; production data stays host-owned.

The AI index derives support-file imports, CSS and package roots, including echarts subpath imports. Skill guidance, MDX, recipe contracts, source indexes and SS packaging tests cover the new templates. Strict generated-project typecheck also exposed and repaired the existing Badge union spread and Textarea event declaration boundary; their runtime behavior is unchanged.

## Validation

- `bun run docs:build`: PASS, strict docs/examples checks, React demo bundle and 276 Astro routes.
- `node --test test/export.test.mjs test/wfm-upgrade.test.mjs test/chrome-layout.test.mjs`: PASS, 8 tests.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/package.test.mjs`: PASS, 9 tests.
- `node --test test/insights-browser.test.mjs test/list-dialogs-browser.test.mjs test/table-edge-browser.test.mjs test/site-browser.test.mjs`: PASS, 7 tests.
- `SYNAPSE_COBALT_TEST_URL=http://127.0.0.1:57481 SYNAPSE_COBALT_TEST_PROJECT=<SS-generated-project> node --test test/list-viewport-browser.test.mjs test/notification-mobile-browser.test.mjs test/review-toolbar-browser.test.mjs test/chrome-browser.test.mjs test/titlebar-theme-browser.test.mjs`: PASS, 5 tests.
- `node tools/build-skill.mjs` and SS `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <design-worktree>`: PASS.
- SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS, 1 test.
- SS `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build`, `pnpm run doc-check`: PASS.
- Fresh SS-generated project `pnpm install`, `pnpm exec tsc --noEmit`, `pnpm run build`: PASS.
- `vet 'Review final responsive Filters action using existing Cobalt controls with a stable local badge anchor and accessible name, error-scenario reset, plus the two small strict TypeScript boundary fixes.' --agentic --agent-harness codex --max-spend 1`: PASS, no issues found; focused type repair and responsive Filters reviews also pass.
- `git diff --check`: PASS in both worktrees; vendor hashes pass provenance checks.


Passed: bun run docs:build (strict documentation/example typechecks, demo build and 276 Astro routes); source export/provenance unit tests (8); runtime cobalt-docs/cobalt-scaffold/package suites with --test-concurrency=1 (9); SS staged helper contract (1); focused Insights/list Dialog/table-edge browser suites (3); documentation navigation, 199 executable examples/recipes and list interactions; full-shell phone/notification/list viewport/toolbar/chrome/native-theme browser checks (5). Generated SS prototype pnpm install/build and strict tsc --noEmit pass after the two declaration fixes.

Browser evidence uses Chrome and actual copied shell iframe, not only isolated demos. It covers light/dark, 360/390/640/768/1024/1440 widths, row-only scrolling and stable footer position, aligned header centers, draft Cancel/Apply, fixed phone dimensions, unread history, all six states and eight flags. Insights checks date/range, filters, Summary, chart creation/collapse, theme rendering and non-overlapping wrapped control rows.

SS plugin/desktop builds and doc-check pass. Earlier typecheck failures, the full-shell paginator reproduction and responsive screenshot failures are retained as regression evidence; they are corrected rather than reported as acceptance passes.

Final gate: `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 73fcf6f1-6ec3-4661-b66b-f82c5b89f762`: PASS, code caps and task/knowledge checks; lint warnings remain visible without errors. SS `pnpm exec eslint --no-ignore plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS. Final native browser reload shows the new Insights entry, chart and named controls. Review checked source-copy paths, immutable inputs, effect cleanup, iframe bounds, theme tokens and unchanged SS Host/Client contracts; no blocking finding remains. No model-driven SS session or production service integration is claimed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The changes extend Cobalt templates and acceptance coverage without changing maintenance, coding or review policy.",
      "sha256": "0fdc21abbc9bf3800fd30550d1a5f27d243863d24714b1fb3c50f48dcf2bcc05"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "Final lint cleanup removes one unused import only; reviewed Cobalt behavior and source-template contracts remain as documented.",
      "sha256": "8950a08d68833ed3a70612ca4ee46248967480acfd13d3dd6eb7d8adcef46e62"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Verify final immutable input hashes and copied recipe paths after lint-only import cleanup; no runtime transport boundary change.",
      "sha256": "b332561598788e7332dff199328191a4b02500c42009316cd7a12f0f0bb6a78b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

No commit or push is performed. Existing projects are not migrated by add. The review server remains at http://127.0.0.1:57481 with a disposable project created from the SS staged helper. Cobalt private registry and theme/font CDN access are required. Chart predictions, queue membership, notification content and new charts are local samples; no production WFM or Atlas services are accessed. Model-driven creation inside SS remains the user's acceptance step. No generated E2E/Cucumber documentation is added. Vite reports large-bundle warnings; native extension harness/dependency declaration warnings remain visible.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "aaad403bf02eb20c87479750067cb6e84a00ba419c460312d19024404c82638e",
      "after": "8950a08d68833ed3a70612ca4ee46248967480acfd13d3dd6eb7d8adcef46e62"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "0413d07b87cc55a69c3bd84236ae4ca52f293e246dfa39699ef924826f25196e",
      "after": "b332561598788e7332dff199328191a4b02500c42009316cd7a12f0f0bb6a78b"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "f5785079fe7986ba5dca18a37f5e624753dab26f02ffd82f63edefe8b7521c1e",
      "after": "0fdc21abbc9bf3800fd30550d1a5f27d243863d24714b1fb3c50f48dcf2bcc05"
    },
    {
      "path": "packages/bun.lock",
      "before": "04411df8e515f66fde5e82be10249bb3ba66e6b229e3d47f0de49816be0b00c3",
      "after": "2d7953e0e1109d4f033a06a941fb86f833e940c20c06243811686698cba7f597"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "16bccecb3f0bc5ca139fc442acc92b9a8bdf5b3dc6ae3942d9b6a38a8e6c3f43",
      "after": "c8ad27674213e0c00d0bd8a2c4412bc4456c9ec0e5245cfad5a544f8f3d48ba3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": "a10b2e8afcaf9900c594d321aea7e052e2a013cce637077a6cbcfc31185e6ec9",
      "after": "c7485b6dc3972c5b8d35e5da220772b8f66af693ccbef8b07af8aee1e662fdda"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "ca32ad809fb299b24cbd801f3d1bc80e43b95fe29769df5543b7fd504994b963",
      "after": "e1cd7ff3ff3d418cb5ab3509be64cd3bcbd5b7c01562f20f1c09ebfa6087ab59"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/app-page/app-page.tsx",
      "before": "61ea6d10e69886811cc550c5995226d196e05162e1dbe16a79686aab05dab9b1",
      "after": "e92bdf882dc7a2bb67361cc04e95c7ee22b3971ebda2a2fa68041a043d6b24ea"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/badge/badge.tsx",
      "before": "db170edc91164f70e8a1ba02635c3013bc3f537fc4a43155091801f549a90385",
      "after": "250e97240aed3ed34dfe34bb63d0f021da2856b1bedc20d55a6c702dec3f6753"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/basic-table.module.css",
      "before": "48b56035820807eebcf97676d1ae6a88745391cca117d5f0674e01ef6affb4fa",
      "after": "548c6bb1153e4d666fa3d83ae65faae86aee858de3f3c4c68668e146accee983"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/basic-table.tsx",
      "before": "c546399e8e25ba868663a4047539a8fc1265544adecf9f62bb76ea2c491520c6",
      "after": "6c7040a97e8ce2f543cc366220584eb56dac07a7f191961b23b11355c68bcb1d"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/table-layout-measure.ts",
      "before": "86b9616fab79afc788353ace89bb79b1dafef6b20a0c63a8a07068a34e68ad92",
      "after": "f068186339c999ee80f4a435fea70a13bb1c9de539e5f43037c4942cc3ae6c8c"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/textarea/textarea.tsx",
      "before": "5cf75d6c6270d90056ffe00dbe3f325cd815882f3792fe66b2892a219052ab53",
      "after": "2c919d5c58f88f4b998287407bac1c11cf5b11c051fcb0dacf700503d3a514a5"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/basictable.mdx",
      "before": "1724cbdb6833f14ca34d8e42dd82d94289889cbd33565edcedfb209f865be8d3",
      "after": "369ca8c403fb6c3dad3157022edf3f5c741fdc304e4cd2b9f4ae6c4b355aefcf"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/index.html",
      "before": "5d9824cfd18abf0cda1ac612d869befae3fa2ed1a42dbd59fc9bf1376d4a70bc",
      "after": "04ef1b33eabca512e1389da1c8e4932f02d25b5389684842b97f95878bbaa936"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "bce47d31c9fee79454f72b57686f587c428f7a18bd92bd0ddd832f519f3a5910",
      "after": "10a341f0ea2bfe5033c501fcdc298a0f64dd6c6d36e875b889b411ee9c9b7af3"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "524b9b259e660d20b22324b3bbcadeb4df02e409fac25aefe795375326da69e7",
      "after": "9c2d2a51fe1e714d0a060f9e8f908257c5db9790cc3778ce27b3a61cfe700037"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/detail-page.md",
      "before": "aca20ec515e2158182bcce918472291b1b0e9c38549ea137f1c617b39ddaa231",
      "after": "bef979ac194c4b61f558510ad51a0a7cda212e36e2286062eb92f8f1636d644c"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": null,
      "after": "bf6d485db122847fc55cb2cbf2c5e8144ccd56072c339b3d71da83ef11e112e8"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.tsx",
      "before": null,
      "after": "6a9078ccc7eae070291b84323780e15cf5aae4bd109afcfac459b8156c7267ad"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.md",
      "before": "c215093ac7131d9d68db12536cb2991966688b9db5a8d645797e2c59b106db71",
      "after": "92cba9a3ecf008a80b7af3689abc72b5080a1ad1e5ab6ad1b97ac8d5991eef38"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/form-page.md",
      "before": "a77e0b663e0f67b6b5ab167fc5f4ecbd50a0fca4c5cf019ba1945d4421bfb948",
      "after": "43f6f6f13df47b44624daa20c5f8b52d7fbfed40d602728257754cdd7c5f35ad"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "d1e827b21d6f86c44f503502ef24cb3c49a05948d8dd1a433ae6ca76b3956bc2",
      "after": "675e03bf0712ef2652a3e1bafe139e0aefb436cc1392a5077b01e5e3e4e07359"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "06044fd31c160f1999ab6899b58e3197b43317faa45874085dce9b1fdbbd18a7",
      "after": "439123885692854aa6f7a585fcacd773b9f512ab1209e2112dd668956d5bf78d"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/filter-button.tsx",
      "before": null,
      "after": "abc3637236c61c374d3f06dd16e8eadeb0ea436553e71342bc5c6347322a2cd4"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-chart.tsx",
      "before": null,
      "after": "8f0b6cb00e3d6077972b35090725b3e7dc86882bb8748f63f3402ad896dc1450"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-filters.tsx",
      "before": null,
      "after": "aaf8bb34418e4a0e23f7f64f2e4ab2ab065ede0c3504e35d7aa7f584b4dbef4d"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights.css",
      "before": null,
      "after": "69e76272debb10101b6b12c538369ffa0e22feae7a35638bc6fd1b89ce97aca3"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-page-filters.tsx",
      "before": null,
      "after": "aa7236088e4f1d50be8356bcbbd3910687e3b6d3a0976112e37e23d5b923f61b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-page-header.tsx",
      "before": null,
      "after": "35a4422ecec8c7da87b12a040506447b65d2503d47aa1c906def01317272967f"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "c887d9da9267221c1fa5b2a22c2f80274556785e144936dc510c15c2b7d14b83",
      "after": "5d501b8948a1836d36ecfa1f8bbd36ec85b33a2577f9eb514425b69a11af5897"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "9bc98c2626c50299b0807391a10a12285e68290b1853129f7415ec4f2f7e0074",
      "after": "f207c1d2ca9f840a67dbdc967aaa37e1fb32e9856feb36b0c8f3fd3c3813e0c0"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/workspace-chrome.md",
      "before": "ee9696f685a1b6facd9cbd80dad4239c948899a5c40b793abfde027c9a8d98f2",
      "after": "060987dea59c5b670a5723589569fd16ca43e5bcdfea6dba1f9d19ac3d2c0aee"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/notifications.tsx",
      "before": "2ce3df725cc2c5c650549fa138860cd6e10cf3f0a14f0c55afcc35e6d806ced1",
      "after": "6abab93d2e7e9e8795137cc2ec74ee52da96b8c0e1e34150eeb3720a66692210"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/workspace-chrome.css",
      "before": "aa33ef2bf485bfaace011dbc5ca9583cd733c55998dd1f774f99b193bf3b5896",
      "after": "6767db7ea455f0714e9f7f248b7ce1db9c088f90578f4d6ea5fd87d6370e57e3"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/dependencies.json",
      "before": "6b99a8cd1bb80f222e8e37a3ef7f343126aea1f6ade3af1ff6fa77f40fc500ec",
      "after": "a1eaa0225e41d23acb892765a8a77446d2de5889d76a45c63c02d2627c1a4273"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/main.tsx",
      "before": "f94883a6c28e172c721ca34859376c9a0e69a5ccdcf103c4d11df4df5544047a",
      "after": "34a542cec37dfa44b38cefd3f297f936fa1790dd1e84b5142665d0f4f1f72a87"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.tsx",
      "before": "9412192b92479fa71c4bc5ddd30b33941525f99a99c8768046003c02cb85e973",
      "after": "d10136a4a93f2052c9ac8e8c0ab014ce4da17dca586129dc6017a918298daa0f"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-browser.test.mjs",
      "before": null,
      "after": "02fbc7d54803c8aae7dc908f93d1f483783d0989e0d1cb3fc03661f1acd8134e"
    },
    {
      "path": "packages/talkdesk-cobalt/test/list-viewport-browser.test.mjs",
      "before": null,
      "after": "a9c39cf934a7f4cd8e87ee92d155a3fff255bc3d5d7c63d0184a9a98c2351a3b"
    },
    {
      "path": "packages/talkdesk-cobalt/test/notification-mobile-browser.test.mjs",
      "before": null,
      "after": "c18796fa77098982fea396c9a074625c866ce04ab02b6ff04bd5d70447ec4408"
    },
    {
      "path": "packages/talkdesk-cobalt/test/review-toolbar-browser.test.mjs",
      "before": "11597f7316de578f15f9195893e7f47f39474e4fa7dc2b50e65db60b7c49ce2e",
      "after": "ac075d33b4c97bebf9699071abaf66ff7ee598e456c2454074cd8249bb8c1845"
    },
    {
      "path": "packages/talkdesk-cobalt/test/table-edge-browser.test.mjs",
      "before": "742134586a945787a4b6e8f266fa5c7ea3dbb90c37575cbd3aaacbad94aa9798",
      "after": "1a36c188e40c70099cca592e2e0e2f75412ef89c8b744a3054b80b49517b915d"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": "85380b63b2eed0a9322ea97f508b89ee6fbc6dae29927d27cf8db81d4291cc25",
      "after": "9b228cb19d73dfd5b1f9650bd66ad591d329104b19d5a926d108fb7c1d929a8a"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "f3e31263ea316c0817b532b6120dafcb4901c786af0448e3abfc801b69154b07",
      "after": "a855ad8fc7f66ac7f1d859cbcd751203aa2356d57a89174ab77e4914d76082f1"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-shell-adapter.mjs",
      "before": "96f7dc40db4f725d090307b3e7f3cad8bde27bea56aa45e0c64ca4c0e285dcb5",
      "after": "25dddac104cbbeff2a974a92a54b260bf77142fb207baf855171b5c8da68958d"
    }
  ]
}
```

Completed-At: 2026-11-15T03:34:38.381118+00:00

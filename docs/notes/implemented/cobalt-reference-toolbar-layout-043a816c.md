# Fix reference-page trailing whitespace; use Cobalt badge wrappers and a single-row Toolbar for a simpler AI reference Team Schedule.

Record-Version: 2
Task-ID: 043a816c-1d52-4ef9-b01f-4789dbffb4cf
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T09:40:12.208586+00:00
Type: fix-bug
Status: complete

## Context

Fix reference-page trailing whitespace; use Cobalt badge wrappers and a single-row Toolbar for a simpler AI reference Team Schedule.

## Changes

- Fixed Card widgets document overflow caused by absolutely positioned native hidden form/focus nodes escaping the content scroller. The shared card/chart layout positions its internal scroller and bounds the page; inner content retains scrolling.
- Team Schedule now uses native marketplace Toolbar/StartContent/EndContent on one row, with horizontal scrolling at narrow widths. Removed Select/adherence controls and their unused demo state/renderer paths.
- Requests and shared Filters actions use official BadgeContainerWrapper, with counts outside button text. Header timezone reuses Extensions TimezoneDropdown with an optional customInput: the existing native globe/city/chevron Button opens the same searchable, grouped IANA popup at native medium width. The bridge forwards click/ref/disabled and synchronizes aria-expanded. Default field usage remains available.
- Reserved 16px under dataZoom in shared gallery and Insights renderers to avoid clipping complete slider handles inside the canvas.
- Updated recipe composition, integration docs, component API, authoring indexes, Cobalt companion and SS scaffold contract assertions. Recipes are explicitly composable AI visual/interaction references governed by the user request. No upstream or production WFM behavior was added.

## Validation

Reproduced before changes: reference-page document height exceeded its viewport; the old Select control was present; canvas pixels reached the bottom edge of the zoom renderer. The new browser regressions failed on those paths before fixes.

Passed: `bun run docs:build` (docs/examples typecheck, demos and 279 Astro pages); the targeted browser suite covering reference recipes, Users and Insights controls passed 17/17. After custom timezone trigger and popup-width work, reference-recipes-browser.test.mjs passed 8/8, including keyboard open, aria-expanded, London search/selection, native single-row geometry at 331/640/1125/1440px, outer document bounds and clear canvas space under zoom handles. Source-export and documentation browser checks passed except one mobile documentation focus assertion in a concurrent run; its isolated rerun passed 1/1 without code changes to that unrelated navigation surface.

SS scaffold contract passed 1/1 against the staged runtime, including timezone/toolbar/badge composition and absence of removed controls. Focused ESLint, Node syntax, SS doc-check, plugin and desktop builds ran on the updated assets. Final live 57481 checks opened the compact timezone with Enter, searched/selected London, measured all three toolbar control centers at 129px, confirmed Card widgets document height stays within the business iframe after scrolling to the bottom, and verified clear canvas pixels below comparison zoom handles. No page exceptions occurred. A fresh project created with the SS helper installed from the offline pnpm store and built the copied Team Schedule and timezone/badge/toolbar closure successfully. Plugin/desktop builds, SS doc-check, explicit ESLint, source syntax, knowledge checks and maintenance passed. Vet reported no issues for native controls, the custom timezone trigger and zoom bounds.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record native reference controls, compact timezone trigger and corrected scroll/zoom bounds.",
      "sha256": "89cf8a808683878a1eeb40b14bcbadaa948df6b8e672ccee3d523cb64ed81d9c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Optional timezone trigger and reference controls remain source-copy assets under the established runtime boundary.",
      "sha256": "258bf8f99988c44431307300862e27c5380fa4e2b6c90c428dbce6b8d82ff763"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The same scoped bug-fix, component reuse and evidence requirements cover this reference-layout correction.",
      "sha256": "9d572964be8f19ae63d3d0309463fb1f8c4fc9b157e6216f35dae22424bcbe36"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

These are design references with local demo interactions, not a production scheduling implementation. Timezone choice stores IANA identifiers without converting backend data. Narrow toolbars scroll horizontally to preserve one row. Only local copied sources/adapters changed; no Cobalt, Atlas, WFM or Harness upstream edits. No commit/push or running SS profile installation. Existing build/lint warnings remain nonblocking.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "72a24d103376b46eaad33cce6469cab3621a6026477eb6ec624554f4576c9d2c",
      "after": "89cf8a808683878a1eeb40b14bcbadaa948df6b8e672ccee3d523cb64ed81d9c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "15636a1012a4a22c4116dd1f0019814d0eb4a5a0c22d471013b30ad4666c56a1",
      "after": "258bf8f99988c44431307300862e27c5380fa4e2b6c90c428dbce6b8d82ff763"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "b0a6ac41f25e2d1fae1b1e150a25efb77204449f208166f9ddf8ef6a1052decc",
      "after": "9d572964be8f19ae63d3d0309463fb1f8c4fc9b157e6216f35dae22424bcbe36"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/timezone-dropdown.tsx",
      "before": "86cda1bc38c6ab7fa597e4446ba52271f8f2a3bea3a6e707e56b310338f107f1",
      "after": "eca9fbcc8971ddd216f9dc77a7ae9526f0e2ed35d70ac9fd65e4c6c58090e4f0"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timezonedropdown.mdx",
      "before": "39ea44bffcae6f111019d7b2642ae61a732c2e1be259c00a32ee034b1d89c50a",
      "after": "3a5849963efb44c83dfa4bd3ca0281581f21fdc5888fbc55e184d4ac45527f43"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/card-widgets.md",
      "before": "40698212b1a453b5e65180cb0e5c15566d892a026b232dd7b145fbcadfc607be",
      "after": "6db432e9a4de479ee8ea229c402706f21cce6336ecfc79e0fae052a833b7f14c"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "3022650e85d2e0c3993bc66559d6ca3fc2113f2776462bd72303d439975bc211",
      "after": "c12def14458056a1b576ea3e85e1f2f16473ceccc01e3c2ea05fcb3ad88b548a"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": "28f3c88af0763c770f1767d77baf357fc8d02293af05cfd270bc568801dff71a",
      "after": "b5beaff2916ed5edd3da8a7ce62ea99077d5084af91098215cb2b98734746aa5"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echarts-gallery.md",
      "before": "7be7a511f994e2e608bb84d96f1d536837ba6217aea9a9c0d28a18f5ec4366e0",
      "after": "dafe4c9e116e184da51a2b7a39c5c2a9bf2e9e26c53bd3d6cd6d4d5cc2d09b44"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "8d71bf9aed9f970a0986eb4837f70816cad4c867dd362611e51f69707593c6c7",
      "after": "b90c5ffa8c10648023fafef7a94191495e7a4fbfb6308691c842f8d6119a1bde"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/filter-button.tsx",
      "before": "ee8b57e8693f8f72b10572784f386589459c240f1642108369ae8f26ed706b65",
      "after": "389f1013360bc1f6af4bc2ab6e299d51de4852863b1734daa677962d373cc83f"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-chart.tsx",
      "before": "2279717f64e05912ea6c73229645c34c712f875589a788dadf48f15ed6dee3f6",
      "after": "26856c854ea12d13609c432a7996cb94e6cde63aa13ab509e46571ac42bc1ff0"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/reference-charts.tsx",
      "before": "9e6900bede41b025e0ca44dfb6285038e2db4f160bd448757cbb029d2341d6ea",
      "after": "0fc6686944d0824dc6f526c0cb8c1a1558a6747c6c83066bb759292c73199050"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-header.tsx",
      "before": "f87c7a2f1dfa1b5014ac9f1d03ab94a853a86a5c724bc83c748388e9e90aa8e2",
      "after": "b4d6231db8af3d1013d2b61039bae94365de3cf198631af08ed5f09e2f2bff80"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-timeline.tsx",
      "before": "2640c6ee583ab2b563d26c073c2e35a796d7c5352bca800e3587dcf671b7e629",
      "after": "a9154cf1b53c92a968f8c57501dfd3a1cc32bc4721f43813fa935dd70cc2d001"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/team-schedule.css",
      "before": "1cc104ffa715b83e557c0fcbe34529ffa6fe7885085d5902bf28a4cd4eab197d",
      "after": "231bd4214c2860a5392d19f242d9c5e1d573322521b7e0e265e74e5e4f1f0236"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/widget-gallery.css",
      "before": "e372c5c6b2a04075d3db143b7e066c7114295bd629101f58fa184e58c1874e95",
      "after": "d242d4f6969d85dad985b73c23e5fd6b21b299f55c404edeb3de2b2401018694"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "4758975bd2a97402ad2b60ef9c52a128a10450ac4e3bf01f6b64048f677724ba",
      "after": "c13d4d448464c9d20d8c8ef7bfbba1f0e473f92658f57b8253cf24b5cd50b889"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.tsx",
      "before": "e48888a556cba19e6af728d95fe4ee85a0b512184e6e2bd3d23cb694ba24b456",
      "after": "d2fba731b862307e456326e2dd3bb51dda033d2cec6a15a9b2e1019cd61369ba"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "5a3306606fcac95ce1da64f3830b7406522d103210a136361b3aec9926e1c7b5",
      "after": "52014689e0a39575ce76a2ffba6db6d5bff99fbf55cae374ef525473752d346c"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "0b135e83f28d6001657c01ca14b7ce929ac644b9a32c18b501b365e9958d3412",
      "after": "3e2863c67efc3d22100b0e57b855df7ff7f53b186b132591ea96cf73593991d9"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": "c43739614ae23d6c356d80368ccf8a6e63b0ffe3e487268ffccff82f03f423b4",
      "after": "40b3eb69f3ebda59ccbef85361653b5c4945d2bc21f2aeb7c2ac1e0619c5a86c"
    }
  ]
}
```

Completed-At: 2026-11-15T10:03:22.891647+00:00

# Use native marketplace Toolbar for applied schedule filters and position native badge containers at the top right of request/filter actions.

Record-Version: 2
Task-ID: b2836bdf-b403-45e3-a05a-b405f2832ceb
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T10:04:20.728716+00:00
Type: fix-bug
Status: complete

## Context

Use native marketplace Toolbar for applied schedule filters and position native badge containers at the top right of request/filter actions.

## Changes

The applied-filter strip now uses official marketplace Toolbar/StartContent/EndContent, matching the date/search row. Both rows preserve one-line layout and use their own horizontal scroller at narrow widths. Requests and shared Filters use native BadgeContainerWrapper positioning props with a negative vertical gap to place the count above the action's right edge; no manual badge CSS is used. Recipe integration docs and the companion identify both native rows and the top-right anchor.

## Validation

The new browser regression failed before the fix because the applied-filter row had no Toolbar role/name. After the fix, `bun run docs:build` passed and `node --test test/reference-recipes-browser.test.mjs test/users-header-filters-browser.test.mjs test/insights-controls-browser.test.mjs` passed 18/18. The browser measures native badge top above the corresponding button and its horizontal anchor at the right edge, alongside narrow/dark layout, timezone search/keyboard, inner page scroll and complete zoom handles. Final SS staged scaffold contract passed 1/1; plugin and desktop builds passed. A fresh SS helper export supplied the final source closure to the maintained 57481 preview. Actual browser checks found both native toolbar rows and measured request/filter badge tops 8px above their button tops. Vet reported no issues; maintenance and knowledge checks passed with nonblocking lint/build warnings.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Both schedule toolbar rows use official components and native badges anchor above the action right edge.",
      "sha256": "0c4fa36d14f5bd3169834173aada0137c0c2365e116a7d090a45d8eadfba4b71"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Applied-filter Toolbar and badge positioning remain copied recipe content with unchanged source/runtime boundaries.",
      "sha256": "12b7cc970995d7caba414ead5ded0a1aee4b6390fdb75e126d785d42f62bbe00"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The existing lightweight regression and source-copy governance apply without policy changes.",
      "sha256": "0b357b55d88e8938fe4a721acb3b006c6be987255ad62a410fb23978b4068cb9"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Reference demo semantics and local sample interactions remain unchanged. Toolbar rows scroll horizontally on narrow screens. This follows the [reference controls and timezone work](../implemented/cobalt-reference-toolbar-layout-043a816c.md); no upstream, Host/Client or public engine contract changes.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "89cf8a808683878a1eeb40b14bcbadaa948df6b8e672ccee3d523cb64ed81d9c",
      "after": "0c4fa36d14f5bd3169834173aada0137c0c2365e116a7d090a45d8eadfba4b71"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "258bf8f99988c44431307300862e27c5380fa4e2b6c90c428dbce6b8d82ff763",
      "after": "12b7cc970995d7caba414ead5ded0a1aee4b6390fdb75e126d785d42f62bbe00"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "9d572964be8f19ae63d3d0309463fb1f8c4fc9b157e6216f35dae22424bcbe36",
      "after": "0b357b55d88e8938fe4a721acb3b006c6be987255ad62a410fb23978b4068cb9"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "c12def14458056a1b576ea3e85e1f2f16473ceccc01e3c2ea05fcb3ad88b548a",
      "after": "4bcdbef099fd30396510d38ad8dc3e7fb8a9d9f387169fb2234a3f157ca85206"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/filter-button.tsx",
      "before": "389f1013360bc1f6af4bc2ab6e299d51de4852863b1734daa677962d373cc83f",
      "after": "78c581f7ca02aeb61c9831364319ce2cd68f466e1678479c198b010830e537ff"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-header.tsx",
      "before": "b4d6231db8af3d1013d2b61039bae94365de3cf198631af08ed5f09e2f2bff80",
      "after": "b7f91aaff9a43f67662f1d877c2f4de24582dee3794409a8342a3f0afb573bff"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/team-schedule.css",
      "before": "231bd4214c2860a5392d19f242d9c5e1d573322521b7e0e265e74e5e4f1f0236",
      "after": "9e9130a0fdbe4acde6d02407a38359f9ea8d37a6f7cebab016d23c4139fdac27"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "c13d4d448464c9d20d8c8ef7bfbba1f0e473f92658f57b8253cf24b5cd50b889",
      "after": "4c530b956e15b3fc077a8112ed274f4ff4ac766cf2aaaebe21bd6bc8f6a7c659"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.tsx",
      "before": "d2fba731b862307e456326e2dd3bb51dda033d2cec6a15a9b2e1019cd61369ba",
      "after": "c4397d1d641ab6548a45b18537eeb264cdebf4ce0203677071dcfeafb83dac11"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "3e2863c67efc3d22100b0e57b855df7ff7f53b186b132591ea96cf73593991d9",
      "after": "3592d90f98e984d68b58854031e59f5353c9ebd117a6f68b0a4a476bf0a7f2e3"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": "40b3eb69f3ebda59ccbef85361653b5c4945d2bc21f2aeb7c2ac1e0619c5a86c",
      "after": "7983d8302acab92706168a873f75cb67139867c194dab79621bb644512d1d197"
    }
  ]
}
```

Completed-At: 2026-11-15T10:10:04.479281+00:00

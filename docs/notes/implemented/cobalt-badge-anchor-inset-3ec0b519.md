# Inspect native BadgeContainerWrapper positioning props and inset shared Filters/request badges against button top-right corners.

Record-Version: 2
Task-ID: 3ec0b519-3a05-436e-8f33-5dffc370a1b4
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T10:15:32.395239+00:00
Type: fix-bug
Status: complete

## Context

Inspect native BadgeContainerWrapper positioning props and inset shared Filters/request badges against button top-right corners.

## Changes

Inspected the official badge-container wrapper and position-hook source. originPosition chooses the button point; directionPosition chooses the badge translation. NE/SE translates by (0,0), placing the badge's left edge at the button's right edge. NE/NW translates by (-100%,-100%). Shared Filters and Team Schedule requests now use NE/NW, gapX=0 and gapY=8. The right edge hugs the button and a tiny 16px badge overlaps the top edge by 8px. No upstream/component colors or CSS positions were changed. Recipe integration docs and companion explain the prop mapping.

## Validation

The stricter regression failed before the fix: the request badge right edge was 806.61px while the button right edge was 785.06px, so the entire badge sat outside. Native source and browser measurements establish the direction error. After the prop correction, the shared filter scenario covers Team Schedule, Insights and Users in light/dark mode at 390/1440px, including medium and icon-only controls. Native positioning rounds/caches its anchor; an observed 2.56px inset during font loading is permitted, while outside expansion and missing corner overlap remain failures. Passed: `bun run docs:build` (docs/examples typecheck, Vite demos and 279 Astro pages); `node --test test/reference-recipes-browser.test.mjs` (10/10, including all three Filters references, both schemes and medium/icon-only controls); SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs` (1/1); plugin and desktop pnpm builds. The staged SS helper exported the new source into the maintained prototype. Actual 57481 checks hovered Team Schedule, Insights and Users Filters and measured corner overlap/right alignment. Vet reported no issues; final maintenance and knowledge checks are recorded by the task gate.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Correct native badge expansion so request and Filters counts overlap the button top-right corner.",
      "sha256": "dab3231af3d25dece0039d83a77a1ce3eb7297c569aab13098526c0b9838317c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The change only adjusts native badge positioning props in copied recipe sources.",
      "sha256": "48e3d4a8ae43c2f18412db58144776ac595b99eff31339ffa3e6c895f5b1b987"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Native prop inspection and a failing rendered geometry regression follow the existing lightweight bug-fix requirements.",
      "sha256": "87db840600cedc772446f8ad5e627791a055d65a7a062bdb21f497952ced6ac7"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The 8px offset is for these tiny 16px badges; another badge size needs a matching overlap. Badge number/content affects width, which NW handles through percentage translation. Source-copy and SS staging contracts remain unchanged. This corrects the outside-right placement in the prior [toolbar follow-up](../implemented/cobalt-schedule-filter-toolbar-b2836bdf.md).

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "0c4fa36d14f5bd3169834173aada0137c0c2365e116a7d090a45d8eadfba4b71",
      "after": "dab3231af3d25dece0039d83a77a1ce3eb7297c569aab13098526c0b9838317c"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "12b7cc970995d7caba414ead5ded0a1aee4b6390fdb75e126d785d42f62bbe00",
      "after": "48e3d4a8ae43c2f18412db58144776ac595b99eff31339ffa3e6c895f5b1b987"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "0b357b55d88e8938fe4a721acb3b006c6be987255ad62a410fb23978b4068cb9",
      "after": "87db840600cedc772446f8ad5e627791a055d65a7a062bdb21f497952ced6ac7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "4bcdbef099fd30396510d38ad8dc3e7fb8a9d9f387169fb2234a3f157ca85206",
      "after": "4465f1c32de5a91ac1fecd82a0984a55c6c0df8078ffd7d830755e51b16e0f58"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/filter-button.tsx",
      "before": "78c581f7ca02aeb61c9831364319ce2cd68f466e1678479c198b010830e537ff",
      "after": "929c884711d8b7dc72e0ed4621ecc9ac9d73db3d59fb1518e62c6a81cdf0ff0d"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/schedule-header.tsx",
      "before": "b7f91aaff9a43f67662f1d877c2f4de24582dee3794409a8342a3f0afb573bff",
      "after": "1a354fb3dd88a40eb98e231f11115c74e8c71ed8a369afc4799e669d3e010914"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "4c530b956e15b3fc077a8112ed274f4ff4ac766cf2aaaebe21bd6bc8f6a7c659",
      "after": "0020319c26a0920c18876b519df09fa517a4bfd3f1919fd29dac81cf1e74c7dc"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "3592d90f98e984d68b58854031e59f5353c9ebd117a6f68b0a4a476bf0a7f2e3",
      "after": "31faf23f94049922b8b35398f0117f5d577acf7c58d8d66c57eb1ba61ec5b819"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": "7983d8302acab92706168a873f75cb67139867c194dab79621bb644512d1d197",
      "after": "0f1981bb6ff4e4e0e2a4f74db006e56626f98986ac1d0e1bd558e0a91a07073c"
    }
  ]
}
```

Completed-At: 2026-11-15T10:25:10.567203+00:00

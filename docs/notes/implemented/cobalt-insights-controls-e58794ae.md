# Use native SelectionGroup and agent MultiDropdown, tighten date spacing and match filter/count tag sizes

Record-Version: 2
Task-ID: e58794ae-6625-4f9e-8d39-88c068661472
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T03:47:06.874052+00:00
Type: fix-bug
Status: complete

## Context

Use native SelectionGroup and agent MultiDropdown, tighten date spacing and match filter/count tag sizes

## Changes

Replaced hand-composed time-range buttons with the pinned native Cobalt SelectionGroup/SelectionGroupOption in single selection mode. The group keeps intrinsic width beside the date and period navigation on desktop; the date field fills its 220px slot and has an 8px gap to navigation.

Agent filters use the copied searchable MultiDropdown inside Extensions SidePanel, with local sample options, selectable/removable values, select all and draft Apply/Clear behavior. Labels, state and overflow counts refer to Agents. Applied tags and the +N count use small core Tags (20px), with a semantic keyboard-focusable count button that does not impose Button sizing.

SidePanel uses the same local Cobalt PortalProvider pattern as Dialog so marketplace dropdown popups stay within the modal focus and stacking boundary. This fixes the reproduced panel overlay intercepting real option clicks; no forced clicks, global z-index changes or upstream edits are used.

Updated recipe metadata, supporting source/CSS, style guidance, AI lookup contracts, generated component documentation, SS owner docs/note and packaged-source tests. Native range review uses radiogroup/radio semantics rather than Button locators.

## Validation

- `node --test test/insights-controls-browser.test.mjs`: initial regression FAIL, 0/4: rendered date gap 51px, missing native SelectionGroup/MultiDropdown, tag/count height 20px/24px.
- `bun run docs:build`: PASS, strict docs/examples checks and 276 Astro routes.
- `node --test test/insights-controls-browser.test.mjs test/insights-browser.test.mjs`: final PASS, 5/5; native radio keyboard/selection, searchable agent selection, Apply/discard, chip count, numeric spacing/tag heights, both themes and 360/390/640/1024/1440 layouts.
- `node --test test/export.test.mjs test/wfm-upgrade.test.mjs test/chrome-layout.test.mjs`: PASS, 8 tests.
- `node --test test/list-dialogs-browser.test.mjs`: PASS in the combined regression command; existing Create/Import workflows preserved.
- `node --test --test-name-pattern='ListPage reuses' test/site-browser.test.mjs`: PASS, 1 list/details SidePanel integration test.
- `node tools/build-skill.mjs`: PASS.
- SS `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <design-worktree>` and `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS.
- Fresh SS-generated project `pnpm install`, `pnpm exec tsc --noEmit`, `pnpm run build`: PASS.
- SS `pnpm run doc-check`, `pnpm exec eslint --no-ignore plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, plugin and desktop build: PASS.
- `vet` focused control review and modal-local portal review: PASS, no issues found.

Search assertions wait for filtering to remove unmatched options. Native SelectionGroup keyboard navigation moves focus; selection is asserted after Space. A panel-level Escape dismisses the draft, so the apply path closes the dropdown with an ordinary in-panel outside click before Apply. Screenshots compare the actual Cobalt controls and do not infer correctness from code alone.

`SYNAPSE_INSIGHTS_REVIEW_URL='http://127.0.0.1:57481/?frame=app&app=admin&page=insights&scheme=dark' node --test test/insights-controls-browser.test.mjs`: PASS, 4/4 against the built SS prototype. Final Astro controls/Insights suite: PASS, 5/5. `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task e58794ae-6625-4f9e-8d39-88c068661472`: PASS with non-blocking warnings. SS strict project typecheck/build, updated helper test, plugin/desktop builds, doc-check and test-file ESLint pass. Native user-browser refresh confirms the corrected controls in the existing preview. No full Electron model-driven authoring session or production service integration is claimed.

Final source review preserves the native default primary selection appearance without local color overrides. `SYNAPSE_INSIGHTS_REVIEW_URL='http://127.0.0.1:57481/?frame=app&app=admin&page=insights&scheme=dark' node --test test/insights-controls-browser.test.mjs` exercises the built SS-generated business frame in addition to Astro demos. The local preview stays at the existing URL and uses the current packaged source.

Final `vet` review of native primary appearance, date/desktop geometry, Agent MultiDropdown portal ownership and matched Tag surfaces: PASS, no issues found. Source/provenance, type/build evidence and real browser interactions have no unresolved blocking finding in this scope.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The follow-up fixes component reuse and acceptance assertions without changing development or maintenance policy.",
      "sha256": "83184d95a163067d1930b3db34c3d10f6ccd8585fc596678606adb2d4f971230"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "Final controls retain native primary selection styling and intrinsic width; documented Agent filtering, spacing and tag contracts remain accurate.",
      "sha256": "4aac5243761e749bc2d7612fed9c89977eae86c8729c1aa35c7bdd41a416cb66"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Verify final source fingerprints and local portal/radiogroup semantics after native appearance cleanup; there is no transport contract change.",
      "sha256": "97a62fcb49a6e31181f4e84eb042c09fb0ccd7fba48cecd2250d2df631bf9344"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Only owned source-template adapters, documentation and SS integration are changed; Cobalt and Atlas upstream inputs stay immutable. No commit/push is performed. Existing user projects are not overwritten. The same disposable review URL is updated from an SS-created prototype. Agent membership and chart values are sample data and are not backed by production APIs. No Cucumber or generated E2E operation documentation is added. Vite size warnings and existing non-blocking lint/declaration warnings remain visible.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "8950a08d68833ed3a70612ca4ee46248967480acfd13d3dd6eb7d8adcef46e62",
      "after": "4aac5243761e749bc2d7612fed9c89977eae86c8729c1aa35c7bdd41a416cb66"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "b332561598788e7332dff199328191a4b02500c42009316cd7a12f0f0bb6a78b",
      "after": "97a62fcb49a6e31181f4e84eb042c09fb0ccd7fba48cecd2250d2df631bf9344"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "0fdc21abbc9bf3800fd30550d1a5f27d243863d24714b1fb3c50f48dcf2bcc05",
      "after": "83184d95a163067d1930b3db34c3d10f6ccd8585fc596678606adb2d4f971230"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "c8ad27674213e0c00d0bd8a2c4412bc4456c9ec0e5245cfad5a544f8f3d48ba3",
      "after": "ecb437e003b847ed58b56c3ba73433b93dbd0c9ff82918104c8f0f3392b13772"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "e1cd7ff3ff3d418cb5ab3509be64cd3bcbd5b7c01562f20f1c09ebfa6087ab59",
      "after": "5cc13b8990c083f3cc472b857aa8e58057f07dadfa34be409f720d6241a1f2bf"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/side-panel/side-panel.tsx",
      "before": "b909ca3352a69c0bd8ca2e0fc38009ece04a3056bcffa7824e8bad9d1d492587",
      "after": "75943455bcb2d7424947c2ac5c34a6de700963477e543b529b5ed1a573c348d5"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/sidepanel.mdx",
      "before": "0a8ccd96916165883ea739deb9df47b6cf4dcf61ccf3d4c62b4a5e63d0bf962c",
      "after": "e99e297677f3bee7d1590576b2aa05c7bb6078ff37b2d4338a80b1274d774e7d"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "10a341f0ea2bfe5033c501fcdc298a0f64dd6c6d36e875b889b411ee9c9b7af3",
      "after": "87d24cb47c95e0644e054c12787296bfce7936beb3467d53ae901cd1c4411117"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "9c2d2a51fe1e714d0a060f9e8f908257c5db9790cc3778ce27b3a61cfe700037",
      "after": "b1ac61d9a248cbb357f0ed045afb5d530140e2c36ab24bc11c5632ac22d3f414"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": "bf6d485db122847fc55cb2cbf2c5e8144ccd56072c339b3d71da83ef11e112e8",
      "after": "76b48643476620cf00c293104256b4202c7b84ca08f0f511fbdd0f13adcf4398"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.tsx",
      "before": "6a9078ccc7eae070291b84323780e15cf5aae4bd109afcfac459b8156c7267ad",
      "after": "e539f144b3d263c5cc91c5d271558a8180967dc9251d91e6c67030d56362fb91"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-filters.tsx",
      "before": "aaf8bb34418e4a0e23f7f64f2e4ab2ab065ede0c3504e35d7aa7f584b4dbef4d",
      "after": "1ffb38f2453361d1d618ba5842e749e06aaacf2f8969bb91020ba1f8e4334332"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights.css",
      "before": "69e76272debb10101b6b12c538369ffa0e22feae7a35638bc6fd1b89ce97aca3",
      "after": "8468755267cc3675c06c97c2793ec886f4aaed7df64011a6c7ab73e4ebce8c7f"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "5d501b8948a1836d36ecfa1f8bbd36ec85b33a2577f9eb514425b69a11af5897",
      "after": "54c8448513fe7afd9a3b85435a778dfc68f866ba861b24cabbcfe64294002b8a"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "f207c1d2ca9f840a67dbdc967aaa37e1fb32e9856feb36b0c8f3fd3c3813e0c0",
      "after": "f84ea8574fd23c8941ae40d3ef5326a36c119e454571078bfbb8dec38071bb8b"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-browser.test.mjs",
      "before": "02fbc7d54803c8aae7dc908f93d1f483783d0989e0d1cb3fc03661f1acd8134e",
      "after": "0b873e96ebb297196eb99a62723629b296b20e651e4cbe6acbfbc6d9ea54a2fb"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-controls-browser.test.mjs",
      "before": null,
      "after": "853fccb8eb6d25291309fc73038fc3f39e05d62e8314d5ce92bc6a13b00c4cc1"
    }
  ]
}
```

Completed-At: 2026-11-15T04:06:18.221971+00:00

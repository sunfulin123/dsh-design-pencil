# Keep Insights applied filters inline, wrap Team Schedule controls within the viewport, preserve native badge anchors across responsive variants, and sync templates/SS preview.

Record-Version: 2
Task-ID: 59893d7a-cc53-484a-a810-6acffc894547
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T12:01:32.129052+00:00
Type: fix-bug
Status: complete

## Context

Keep Insights applied filters inline, wrap Team Schedule controls within the viewport, preserve native badge anchors across responsive variants, and sync templates/SS preview.

## Changes

Insights applied filters use a 48px native Toolbar inside a bounded horizontal scroller. The native TagGroup field uses auto width and a non-growing flex item; labels, tags and overflow count share a center line. Cobalt controls and keyboard removal remain unchanged.

Team Schedule control and applied-filter Toolbars wrap groups and individual controls within the business viewport, with auto height and zero fixed minimum widths. The timeline retains internal scrolling and fixed pagination. The shared native filter badge rebinds its measured anchor when changing between labelled and compact buttons; this avoids retaining an 80px anchor after the button becomes 32px wide.

Updated recipe contracts, generated integration docs, AI Workspace guidance, owning SS README/note and scaffold assertions. Regenerated and staged the source templates into SS, then rebuilt the existing 57481 preview from SS-generated copies without changing routes, user data or upstream snapshots.

## Validation

- Before the fix, `node --test --test-name-pattern='applied insight labels|native wrapping Toolbar' test/insights-controls-browser.test.mjs test/reference-recipes-browser.test.mjs`: both regression tests failed. Insights filter height was 100px with labels/tags/count on three center lines; Team Schedule controls extended beyond a 331px viewport.
- `bun run docs:build`: passed typechecks, executable demos and 279 Astro pages.
- `node --test test/insights-controls-browser.test.mjs test/reference-recipes-browser.test.mjs test/users-header-filters-browser.test.mjs`: 21 passed. Includes light/dark inline filter geometry at 1440/990/640/331px, schedule wrapping/bounds, badge anchors, timezone, pinned pagination and phone agent visibility. The first post-fix run exposed stale compact badge geometry; keyed native anchor rebinding corrected it.
- `node tools/build-skill.mjs` and SS `stage-local-runtime.mjs <Design root>`: passed.
- SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: passed. `pnpm exec eslint --no-ignore plugins/ss-dsh-design/tests/cobalt-project.test.mjs` and `pnpm run doc-check`: passed.
- Scoped `vet --agentic --agent-harness codex`: both reviews reported no issues.
- SS `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: passed after staging. Existing dependency/chunk warnings remain visible.
- `node /private/tmp/toolbar-wrap-live.mjs`: eight actual Workspace iframe checks passed for Insights/Team Schedule in light/dark themes at 1440/390px outer windows (765–897px and 331px business frames). Verified fixed 48px Insights metadata row, keyboard Clear all, wrapping schedule controls within frame bounds and no page exceptions or horizontal document overflow. Built and published the maintained 57481 preview from newly generated SS template copies, retaining existing routes and hashed assets.
- `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 59893d7a-cc53-484a-a810-6acffc894547`: passed with non-blocking lint warnings.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Team Schedule controls now wrap within the business viewport and Insights applied filters retain a compact inline row.",
      "sha256": "8c0157de476424cbdb09a1fdab4dabd2283de182b417c42bf1eb5c50e6d1486d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document native TagGroup field-width adaptation and native compact badge anchor rebinding.",
      "sha256": "1c53d052f622813cd13732db816f6fb6f7e84ca49455adc1948ea310f311ab2a"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Local recipe layout corrections retain repository ownership, public contracts and verification policy.",
      "sha256": "5bc3362f9356fac7872c03ca36c1e1e7cf7578b8b7cb0f1f8db73525cc57aa4c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The requested Team Schedule wrapping behavior supersedes its earlier horizontal-toolbar-scroll contract. Insights keeps only its applied-filter strip internally scrollable on narrow widths. No new controls, API, dependency, E2E document generator, upstream mutation, commit or push is included. Existing build/lint warnings remain non-blocking.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "86481ce2846124d99ad7322f41af68facb23e0621a333d403773091515222dcc",
      "after": "8c0157de476424cbdb09a1fdab4dabd2283de182b417c42bf1eb5c50e6d1486d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "bacb4f750d2c1b3ee4ce11364f41437ede9456934ba1e54922acd8489ef4d14e",
      "after": "1c53d052f622813cd13732db816f6fb6f7e84ca49455adc1948ea310f311ab2a"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "42879cc08dc40a7aa9a52212a47655bfb8df9ca21e1e291b397e7bfb9b60c322",
      "after": "5bc3362f9356fac7872c03ca36c1e1e7cf7578b8b7cb0f1f8db73525cc57aa4c"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "9ca3fa3acf7cf9710a9c6f4388afe41cfdd609e08faa6209d538fd17ceaf082b",
      "after": "f8039a028971366c9aa309050f5e69892c9a813e0e0ec2b309912c535e55b041"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": "f3198fa8ef44ba833ea0c100f79fe3b700fc4b950d6a03d19715f158371884e9",
      "after": "75b721903b137450470251f79791a19ef4c7e35671a465b1f514ec25731a9283"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.tsx",
      "before": "f838aa0404c085733c7e075cf99f9fce43426b346cf8a89db3ba8c2b47e51c17",
      "after": "b802dc97c61e50442306b64b88f2da8186d0a53c8cf9f9926950aa1387dd18bd"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/filter-button.tsx",
      "before": "929c884711d8b7dc72e0ed4621ecc9ac9d73db3d59fb1518e62c6a81cdf0ff0d",
      "after": "c62bb83168efb253664d55e044479df56daaeeff4db0ff2926f460d0c0e4af42"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights.css",
      "before": "dac7e83c534d5f1eebac7e31cb044c1209bb0648e4fb28c6be780546eb902863",
      "after": "b9eb874216020c4c06abdbe28b53829c92e16f9e19991d3e5344c0e9fd78c063"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/team-schedule.css",
      "before": "9e9130a0fdbe4acde6d02407a38359f9ea8d37a6f7cebab016d23c4139fdac27",
      "after": "e93c48bbcfdd6f624be60ef66f627df99eb83287754cb7acef377323a8cb3875"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "0020319c26a0920c18876b519df09fa517a4bfd3f1919fd29dac81cf1e74c7dc",
      "after": "7a33951fb1eaf0c314657ce836ae39c91f9bf6abd7c6019ff67fd7903744878a"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.tsx",
      "before": "c4397d1d641ab6548a45b18537eeb264cdebf4ce0203677071dcfeafb83dac11",
      "after": "416fd94b7b677a0958c31eca6460990aeea89a840301fc0777151d734dfc0966"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "9926c954ad987d135912b260c5c8b95319f5e41fbe809c8166ef945b8661a8c3",
      "after": "fa4452a0ea8f05a021a24475db62fdb4b68d64055c17078b8144abb12ab34e99"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "a4ee81e766e0cdf805cc558b90e4fa82209c6b36a9d1d164ee82bdcfb1d86b90",
      "after": "682594f2234257b3210f45a5531f16dd828ffa6a126ca81b281f092079447786"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-controls-browser.test.mjs",
      "before": "b973b5392deb8dc49b03dd96573f64ad9de0213855452d89b41962c15317a0b8",
      "after": "796a519b8f54e7636cf86e765bfb68be0ed78efecd0143203a2080599d4c9949"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": "0f1981bb6ff4e4e0e2a4f74db006e56626f98986ac1d0e1bd558e0a91a07073c",
      "after": "8de20f2ecf273f0f118bdae066cdf6752c36235cc835b984d865fd9ec196c95c"
    }
  ]
}
```

Completed-At: 2026-11-15T12:13:23.795303+00:00

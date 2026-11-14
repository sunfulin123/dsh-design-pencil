# Redesign Astro documentation with persistent sidebar, main reading area and top theme controls

Record-Version: 2
Task-ID: 1d0fd6dd-aff7-44bd-a209-9b71bd122685
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T12:06:42.590067+00:00
Type: feature
Status: complete

## Context

Redesign Astro documentation with persistent sidebar, main reading area and top theme controls

## Changes

Kind: software documentation application. Voice: technical-dry; category and component names first, short functional labels, no invented claims. Verified facts: 29 Cobalt Extensions component pages, 204 examples and four recipes from the authoring registry. Main action: browse a component or recipe.

Layout plan: 64px persistent header, 272px scrollable navigation, main reading width up to 1120px with 48px desktop and 20px mobile insets. The sidebar becomes a keyboard-accessible drawer below 960px. Header appearance controls persist light/dark/system and document accent choices; the official Cobalt preview retains its component brand colors. Example panels provide Preview/Code tabs and local theme overrides.

The user's explicit documentation/sidebar/main request takes precedence over the invoked skill's marketing-page hero, full-screen sections, random palette and decorative moment prescriptions. Use the skill's hierarchy, equal edges, functional copy, real live UI, restrained motion and rendered checks. Existing Talkdesk branding remains the default; no photo, invented brand, marketing section, scene or decorative effect is needed.

The reusable library is Cobalt Extensions, with canonical `components/extensions`, `content/components/extensions`, `examples/extensions`, `recipes/extensions` paths and `@openpencil/cobalt-extensions` imports. Original WFM provenance and DOM identifiers stay intact. Exported Skill resources preserve old-path aliases; old document URLs redirect and old demo queries/registry IDs resolve. New projects include an old package-import alias; `add` leaves existing projects' dependency snapshots intact.

All 29 component source folders receive generated READMEs with purpose, exports, API links and runnable examples. `components/extensions/INDEX.md` and the machine registry expose descriptions and keywords. The generator derives these from authored MDX and source exports, keeping a single API authority. Generated projects retain the indexes and linked docs/examples, with adjusted paths. The companion directs models through these sources before implementing pages.

Demos dynamically load the selected entry. Mobile focus trapping excludes closed navigation groups. The users recipe companion correctly describes its default export. No upstream Cobalt or original WFM source is changed; no SS Client or tool schema is added.

## Validation

Passed: `bun run docs:build` (306 pages, including 30 compatibility redirects); documentation/example TypeScript checks; `node --test test/export.test.mjs test/wfm-upgrade.test.mjs` (5 tests), including every README link in source and generated projects, deterministic exports, legacy aliases and unchanged vendor hashes. Component typecheck/build and 21 unit tests pass. All 204 examples and four recipes render after dynamic loading. Focused navigation tests (2 pass) cover canonical pages, old redirects, search, persisted light/dark/accent, system-theme changes, Preview/Code keyboard operation, mobile drawer and overflow at 320/390/768/820/1024.

Passed: Node runtime docs/scaffold/package checks (9 tests); SS packaged scaffold check; SS Design plugin suite (504 pass, 22 skip); plugin and desktop builds; SS documentation checks. A fresh project installed offline, built both canonical and legacy imports, and passed the real multi-Dock/page/scenario/theme browser fixture. Model-driven SS acceptance remains a user test.

Screenshots at 1440/1024/820/768/390 were inspected. Navigation/main edges, mobile reading flow and the real recipe render correctly. Source line cap and JavaScript lint pass, with lint warnings visible.

Design-skill diagnostics are not a full pass: its marketing layout checker crashes (`r.sections is not iterable`). The first finish gate reports `GATE: FAIL 25 (round 1 of 3)`, predominantly full-screen marketing sections, hero/moments/selling-copy and container rules incompatible with the requested documentation workbench. The input focus ring, tap targets and clipped descriptions were corrected. The iframe focus-visible diagnostic remains open; no independent visual acceptance of that specific cross-frame focus state is claimed. No checker files or waivers were used. Copy lint has zero FAIL and two retained WARN: real registry counts and em dashes from component descriptions. Performance improves parsed JS from 2864 KiB to 1704 KiB and transfer to 340 KiB; desktop/mobile JS-size FAILs and busy-host timing WARNs remain because Cobalt dependencies are substantial. Vet cannot review the aggregate diff because its 13.9 MB input exceeds the 1 MB agent limit; it did not pass.

Final diagnostics: `GATE: FAIL 25 (round 2 of 3)`. There are no waivers. The user-requested documentation layout takes precedence over incompatible marketing-page prescriptions. Open findings are preserved here, including the iframe focus diagnostic rather than declaring a visual gate pass.

- hero-fill        main#main-content > div.reading-area > section:nth-of-type(1) "Start with a page recipe"  [1440, 390]
- flush            main#main-content > div.reading-area > section:nth-of-type(1) > section.example "Preview C  [1440, 390]
- nav              header.docs-header  [1440]
- text-only        section#component-list "Cobalt Extensions"  [1440]
- cta              section#component-list "Cobalt Extensions"  [1440, 390]
- copy-headline    main#main-content > div.reading-area > div.page-heading > h1 "Cobalt design library"  [1440]
- section-gaps     section#component-list / main#main-content > div.reading-area > footer.docs-footer  [1440, 390]
- section-tile     main#main-content > div.reading-area > div.page-heading "Cobalt design library"  [1440, 390]
- section-tile     main#main-content > div.reading-area > section:nth-of-type(1) "Start with a page recipe"  [1440, 390]
- focus-visible    div#recipe-extensions-users-list-preview > iframe "recipe.extensions.users-list"  [1440]
- moment-none      (the page)  [1440]
- hero-screen      main#main-content > div.reading-area "Documentation/OverviewCobalt design libr"  [1440]
- section-height   main#main-content > div.reading-area "Documentation/OverviewCobalt design libr"  [1440]
- one-section      main#main-content > div.reading-area "Documentation/OverviewCobalt design libr"  [1440]
- one-section      div.reading-area > section:nth-of-type(1) > section.example > div.example-toolbar "Preview  [1440]
- one-heading      h2#recipes-title "Start with a page recipe"  [1440]
- container-edges  header.docs-header "Talkdesk/CobaltDesign libraryColorColor "  [1440]
- container-edges  main#main-content > div.reading-area "Documentation/OverviewCobalt design libr"  [1440]
- container-edges  a.skip-link "Skip to content"  [1440]
- container-edges  aside#docs-sidebar "Documentation✕Search docs⌘ KGetting star"  [1440]
- container-edges  header.docs-header > div.header-brand "Talkdesk/Cobalt"  [1440]
- container-edges  header.docs-header > div.header-brand > a.wordmark "Talkdesk/Cobalt"  [1440]
- container-edges  header.docs-header > div.header-brand > a.wordmark > span "/"  [1440]
- no-visual        section#component-list "Cobalt Extensions"  [390]
- container        page  [1440, 390]

Maintenance passes: `bash tools/check-maintenance.sh --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 1d0fd6dd-aff7-44bd-a209-9b71bd122685`; all maintenance unit suites, source cap and task/knowledge lint pass. SS `pnpm run doc-check` and `git diff --check` pass. The preview was restarted with the current static build and the canonical BasicTable URL returns HTTP 200.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Document sidebar/theme authoring and general-purpose Cobalt Extensions with generated component retrieval indexes; retain bundled SS behavior.",
      "sha256": "9c605be77952f7b1d28524f955caed5c585b775540bfbc3eb081e94518a47991"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Verify canonical Extensions resources, generated compatibility aliases, component indexes and preserved MCP/SS entry path.",
      "sha256": "fca1268acf652b5a484092570d0b2532e2a0b9238b8d8dd72c0d5f3daf74f33c"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Retain source authority and task evidence requirements; browser profiles are generated artifacts excluded from source scanning.",
      "sha256": "6c72b509dcb3ae96283e0da4f646b19059500d9313c5995d6d76f38791e6e78b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Installed SS remains a bundled snapshot; resources were restaged and plugin/desktop bundles rebuilt. Astro and AI resources share source ownership; remote documentation refresh is not implemented. Original WFM selectors remain compatibility identifiers. Marketing/performance diagnostic gates remain open as described above. No commit, push or release is performed. Documentation preview: http://127.0.0.1:4322/.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "70d41165a07773e05fe25c51e23c9f822753a5d8b66b3b931307740ad750d261",
      "after": "702c1ce5d44748097c5432f11fe4ced9d00da770a809a8219bfcf48a4b66b4d9"
    },
    {
      "path": "COMMANDS.md",
      "before": "e82bb2ea65603ae60ca8af8e4e102e29dbda386ed88d5aae9f355d74ce1144a0",
      "after": "f30f51e300674d7aa5f62af5210442135d0dbb29215d7ca75f4c6c06902e6f34"
    },
    {
      "path": "docs/kb/product.md",
      "before": "3baea4966524fcb4b3c73122d8b4e8b0af8b97e6b7dbf75dd32d9c063a56e372",
      "after": "9c605be77952f7b1d28524f955caed5c585b775540bfbc3eb081e94518a47991"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "eea35848703babbdf2b8fcb8347af69d47b50f2aad8c72c99f998bb073eea476",
      "after": "fca1268acf652b5a484092570d0b2532e2a0b9238b8d8dd72c0d5f3daf74f33c"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "b1a9e73d65f1cd7925bb97bb4090b16deda39e5f15bb47fce749cdfdb1630297",
      "after": "6c72b509dcb3ae96283e0da4f646b19059500d9313c5995d6d76f38791e6e78b"
    },
    {
      "path": "packages/talkdesk-cobalt/.gitignore",
      "before": "232c55e2b558f65171dda0bdf3cc32308332f5e82f1dba5bf3f4f53d4b9f9f84",
      "after": "56fed65d13a2558816c0499a5d18572addef21e8d132cd88e3bae4cfdcf2c3a1"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "ee2abce393948cac072580b30af9aaf4115e8f03cf445dd79507c208b693ea2d",
      "after": "a6282f223a20ee1e3f4dc8b76930e6d34fee28dc1fb127d0e54a6dcf78ab8da1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/.npmrc",
      "before": null,
      "after": "0e6558d2295243d10d15ed5589a133809e0f8de4f56df560d52ed5e5e54522dc"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/INDEX.md",
      "before": null,
      "after": "2d9f59e8434820e43e6e2ad3e432038ed35a4b8ede079f5b0cc8bf297ffdb673"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/README.md",
      "before": null,
      "after": "5e374d85632e95499a0edfbd206ae68c8a606764ac020c5ea3278476a75f0230"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/demo/index.html",
      "before": null,
      "after": "e83ddfe909d99ee9c91539a9f505dc2d7d969302e72194a04c53fba3e918aa6c"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/demo/main.tsx",
      "before": null,
      "after": "cd33d2219a08a8a1520858055264a64afe4d24d76ad04174db0f919f3338876d"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/package.json",
      "before": null,
      "after": "d360ea4a7a23e273f9808699b246cebabfbc93a0c18d15ec295accfcda9106a0"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/__tests__/cobalt-upgrade.test.tsx",
      "before": null,
      "after": "f3b5797ade2e657ab02e62a9c0b1de13209db515907742951f077dbdc8098319"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/app-page/README.md",
      "before": null,
      "after": "1bc5c2c4387bb1bedc2222d931f709483971983eaba8435c8ed52bf48316c919"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/app-page/app-page.tsx",
      "before": null,
      "after": "61ea6d10e69886811cc550c5995226d196e05162e1dbe16a79686aab05dab9b1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/app-page/index.ts",
      "before": null,
      "after": "6af06e80dbef119b386329d5b07ae5d784547b53956a292f5c5f67b010ec413e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/badge/README.md",
      "before": null,
      "after": "1be4d84f8514b9fa31454e523090c8ad8f4b60895b74ff08288520f98ef9d753"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/badge/badge.tsx",
      "before": null,
      "after": "db170edc91164f70e8a1ba02635c3013bc3f537fc4a43155091801f549a90385"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/badge/index.ts",
      "before": null,
      "after": "ab1fc34603cd6aee91104cc3c59442f32ef1245421e2924533edeb3ba2a8c4dd"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/README.md",
      "before": null,
      "after": "4dbe428e4cd29cfe842214535e9a2f0bba0ac35273d912558eaefaebec59704f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/basic-table.module.css",
      "before": null,
      "after": "4cda0c0d56b1fe00d01ed77e466de7b559e5fb0aac17229852c3c03fc59940d2"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/basic-table.tsx",
      "before": null,
      "after": "c546399e8e25ba868663a4047539a8fc1265544adecf9f62bb76ea2c491520c6"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/index.ts",
      "before": null,
      "after": "533f3031462901dc7686120e036397d092183d867b21bfe9bc287e9f9c1e72b3"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/basic-table/table-layout-measure.ts",
      "before": null,
      "after": "86b9616fab79afc788353ace89bb79b1dafef6b20a0c63a8a07068a34e68ad92"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/button/README.md",
      "before": null,
      "after": "a8a5ff1dc6154bc9d46a59d5ee4a5fba7ea938cdf0e9b540c43278661dc36310"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/button/button.tsx",
      "before": null,
      "after": "b76b0ea24b7d594e57857f95f309a844b7b31b8d142d705c65791a1c1a4c16f6"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/button/index.ts",
      "before": null,
      "after": "ac62e0bfb1d8ac93f956eff59ff0b5341a1623a95eccab48e68c0f81895e46ab"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/card/README.md",
      "before": null,
      "after": "b324e57240cbe256558e447ed8e8554c6cc8377d896178f20558cdf0f2a8ad52"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/card/card.tsx",
      "before": null,
      "after": "fa2ff2eab881bcb41fa7c6343723b561fa3041d636740a4ba7d42ffa5e63a8cc"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/card/index.ts",
      "before": null,
      "after": "fa1f8ac1273b6e808d1d6aaa1da77f2c0b6cd79c721d8196c6bf4127522caf68"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/chip-group/README.md",
      "before": null,
      "after": "9c6c2a44fdb7380283fdfe55c87f6a88a3866cb797027e7bd790a5c3f18d8702"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/chip-group/chip-group.tsx",
      "before": null,
      "after": "d726033f8c9dde394032c6b43a357fd6a8e793e83ef36960c6190bb9e6be2d45"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/chip-group/index.ts",
      "before": null,
      "after": "aa26892cb26b17f63395d9ccefcaaa0b07a7d59794bb808504e7b9791629e135"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/choice/README.md",
      "before": null,
      "after": "7bb6c38e6949135e28bbe6257204c0e6c25f929b60f063742ec0752ed4eb1965"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/choice/choice.tsx",
      "before": null,
      "after": "864408e281d0d50284be3f35354f83183be43afb347dc70ab926598d2ea43d8a"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/choice/index.ts",
      "before": null,
      "after": "b7baef04eae812059c3d8bff083d2ca75a90dc200cdc0662fbc9bec044cd6897"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/collapse/README.md",
      "before": null,
      "after": "3f283d8e428c95579506cac4dfdbecee2914b41a403296e745437302b38fa74a"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/collapse/collapse.tsx",
      "before": null,
      "after": "5c5d57bb71fc1ab260a5fa42c011c6605dee0dc6d3d91dc1b68204896abd3720"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/collapse/index.ts",
      "before": null,
      "after": "b2d08d8f5bdaf91acbeff2830e51a17a2ea1b131bd31f0b764104a42cd1a2e6b"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/confirm-modal/README.md",
      "before": null,
      "after": "cdb373d321d0a0dcdf8381cfc4374aa5eded05762e68a70f723937d26e1883be"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/confirm-modal/confirm-modal.tsx",
      "before": null,
      "after": "a0d5de2a3e407be642d59e91a49440f234267c103582145eb26f94310ee39b91"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/confirm-modal/index.ts",
      "before": null,
      "after": "40254d21f1156e6d4dc223c4ae5e7116b4bd95c5cf5f34e424fc30244e22f8db"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-picker/README.md",
      "before": null,
      "after": "a50945901dc4a7df2c76c19917e70ca08cfa2b2d7c3a546f22b3b4b2a1b283c8"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-picker/date-picker.tsx",
      "before": null,
      "after": "27fd15700a483d7a2b0ede5f1b58d726e2b63af6cfe3f4d6f7d21739eef8bdca"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-picker/index.ts",
      "before": null,
      "after": "f562d7c16a43c66fb6b254dd4d6c473973bacdea99ffbf39c2b8320001e96850"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-range-picker/README.md",
      "before": null,
      "after": "8457266101f3fa7e480cff7e2ebcc582db5d413b578b2fce9ad999b748d25ace"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-range-picker/date-range-picker.tsx",
      "before": null,
      "after": "584a66c76b97f58cbf5425291f7eb954a47888f0b2c6f87816a5325344607ed4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-range-picker/index.ts",
      "before": null,
      "after": "e38dda63b2f9dc677a8e615fbd889fd1c3c7cb674f525bdd323378421aa74de4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-time-picker/README.md",
      "before": null,
      "after": "278195d5dead3b80de022fd8731a249297c10b95c0265a791214b27dfcabc086"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-time-picker/date-time-picker.tsx",
      "before": null,
      "after": "a54ac0800eafe3b0335c39d75a38704e9cae3b1b353c4d78af2a5f6e9f6e6764"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/date-time-picker/index.ts",
      "before": null,
      "after": "5c55b5b15e7c5cef7066b0b8b96f397c0405d811ac00b2c2f18ba8d084535261"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dialog/README.md",
      "before": null,
      "after": "bba6cf03bdf42a50bd99d8ca5be7bb28447af4099a1e7b2e523d8e68ecb45651"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dialog/dialog.tsx",
      "before": null,
      "after": "338c7dafca8ffbf8531fb43904a2e1b2887de27756347490e0a1a42209113002"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dialog/index.ts",
      "before": null,
      "after": "afd69030901d98fb7d96b75b906d635afeaad16d2d6776a540c4943bde60f729"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dropdown/README.md",
      "before": null,
      "after": "ddf6cac9a461aaa92773c27ac13e3f1df09744a14134e4dd6ad443267c72fa0f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dropdown/dropdown.tsx",
      "before": null,
      "after": "e1b07aef1938e5963920dabccda5e45d288b0502fe7bf3ba8bb3c79ada6610b4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dropdown/index.ts",
      "before": null,
      "after": "fad016f7df559b6ae4fbaa79fc8b1b9cb6366e3a1814533d92ac319c9662d691"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/filter-toolbar/README.md",
      "before": null,
      "after": "5d7f03a7c5009e6eaa090667bb508d85dbc0e6402d1c2ffb984887b9dfaa27b2"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/filter-toolbar/filter-toolbar.tsx",
      "before": null,
      "after": "35642b9a33a4215ab9a142329259cf46243ee8dae315c32c211ee1565f0ff199"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/filter-toolbar/index.ts",
      "before": null,
      "after": "cf78396fe6168ca2f8c1510d684d31eb73326c83a7263abf4c6986b484b6e322"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/form-field/README.md",
      "before": null,
      "after": "f7d817c46d028e39a0ce77e321ccd2dfb3eefe13bdfbea723adf6e3f059049d0"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/form-field/form-field.tsx",
      "before": null,
      "after": "88492e8ea27d9c8d3868b12bc8c480e5c7e3ed923ca3dce7d7077e425eadc3af"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/form-field/index.ts",
      "before": null,
      "after": "20572dfe90d382703fb2f74d88b6860d79a5d0c916de833043734081c061b820"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/index.ts",
      "before": null,
      "after": "152bc5f897a7c1847245b2f032852b1029f4b02bb3ee0f4fc3a28ce562ee6319"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/input/README.md",
      "before": null,
      "after": "005cb03b4e5a45e41b52793e2607a6c7cb6f0a62b42be1c79c81d45c9e43336b"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/input/index.ts",
      "before": null,
      "after": "51f9d424e9cdb87f68462ac426fe204bfedcbc1fa9fa68bb517a5f97d674d4c3"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/input/input.tsx",
      "before": null,
      "after": "2ff255aaa3ebd7b33155ddbccda534ba6d1e6559ce1e883caf3ead4c70e285b4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/interactive-message/README.md",
      "before": null,
      "after": "7288250082c9e612e784a8f1f3951ddbd5a1c6e03ace424caa8745e9de175852"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/interactive-message/index.ts",
      "before": null,
      "after": "aaa8b7a5964832deabddc6d3c016dc99a7d8ecc822f55f4c99322f20b30800e7"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/interactive-message/interactive-message.tsx",
      "before": null,
      "after": "cce0fb409f998c8d4f229048bf024f70625ab4960a6b484fd131919333deab92"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/multi-dropdown/README.md",
      "before": null,
      "after": "4cab5ac2b6064e76307a6214e3de4aa08ab804e01956a8261f8bfbffdb9afe26"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/multi-dropdown/__tests__/multi-dropdown.test.tsx",
      "before": null,
      "after": "9fe69db645f2cefa7cf3a0599c9321fac9ee038586637d8b5c3531887828fb55"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/multi-dropdown/index.ts",
      "before": null,
      "after": "09240cd213276043a18c31cf6386c89a21f7510513baa0770b172f64e6425308"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/multi-dropdown/multi-dropdown.tsx",
      "before": null,
      "after": "db3b79fb005f4906cbffd1911252dcf2662d5b96484ff0d89f8c9c5b10c35e15"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/popup-trigger/README.md",
      "before": null,
      "after": "93176fc2f63a8627cb1c2e8aac4f1eb30105a8734a1ef070332d115a6b0c8394"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/popup-trigger/index.ts",
      "before": null,
      "after": "7797b1e7c1bc58754a8ba1a46cbcdc972a08224542fa03a1f16c9cbdd071d87a"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/popup-trigger/popup-trigger.tsx",
      "before": null,
      "after": "850ee1626e3d861c0b8b86997c71fe3d0ada06b7e5c06809797f92ac0e005374"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/react-app-env.d.ts",
      "before": null,
      "after": "3efb87b3dd29ebfea03ab717fe50fcffa9bb46e408c51de1316a31b3d6d3ce5c"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/select-group/README.md",
      "before": null,
      "after": "4778ed0416a750a05f7119c09b0a4a9297c7da4d8d3138df5f660f4cff6091f4"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/select-group/index.ts",
      "before": null,
      "after": "239b5651d8b10936b41ed3b88da3aa2e9f52238eb163c0de02de4e73552d2164"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/select-group/select-group.tsx",
      "before": null,
      "after": "7d543004cb555ac5da00465d36ec4fb9576274139c831c7b14b9c891d56b8bcf"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/side-panel/README.md",
      "before": null,
      "after": "cf063b30ceb29b2f50a9734fe3122f3e76800a811f9c528678c51045eca2b175"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/side-panel/__tests__/side-panel.test.tsx",
      "before": null,
      "after": "190cc76ba423b65149003081b9ad334501ecda976add5038f1a6e8efdfc80e64"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/side-panel/index.ts",
      "before": null,
      "after": "3b14c735ac8a4d320a8f8673a0faa0799813f515ae80650a7afc207bb6248b65"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/side-panel/side-panel.tsx",
      "before": null,
      "after": "b909ca3352a69c0bd8ca2e0fc38009ece04a3056bcffa7824e8bad9d1d492587"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/stepper/README.md",
      "before": null,
      "after": "3976a2a478c79255ac593cf4145acb6ea3447503ac45357d0a498c7ac4f22aa1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/stepper/index.ts",
      "before": null,
      "after": "2195650735dcecd518fd0dd8fd67f3a2922dd9fe6ae1b6389496ca1c2bec2d0e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/stepper/stepper.tsx",
      "before": null,
      "after": "42495dccab9676062c61b8b440bbe035f912debc6a25b0f3c37265598889ed04"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/test/setup.ts",
      "before": null,
      "after": "a46d66851af2c056e805fdd574bf5ec3adb1181c43c5e41f0a1c592e338afe64"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/textarea/README.md",
      "before": null,
      "after": "6284937bdfd2e0789f3a3142a89aba1dab68ba2bb8c2d54f80e370d37a54c0d2"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/textarea/index.ts",
      "before": null,
      "after": "4bf80f5c5bfd2f1e3c3d2c1a3846c2d243ddd858d10ddd0b6692574a0b234c02"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/textarea/textarea.tsx",
      "before": null,
      "after": "5cf75d6c6270d90056ffe00dbe3f325cd815882f3792fe66b2892a219052ab53"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/time-select-input/README.md",
      "before": null,
      "after": "6e60faa9470fec3f184f75d8f3dd2d6c643fbb6f68aed129f1b9a73b0e6bce55"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/time-select-input/index.ts",
      "before": null,
      "after": "267d2c4d4444c361b64a09fa552cf30315bb595b043e235aefca240cf8f080bd"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/time-select-input/time-select-input.tsx",
      "before": null,
      "after": "e3e93e0838736ca5731f7b8e8956cb2a3d342df38efd2e3fa7c8e76ee9a02d51"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/README.md",
      "before": null,
      "after": "7f3553824613832bbe92916f7683f35a4835f25fe96fc904ddd05d96cbc6e4d6"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/index.ts",
      "before": null,
      "after": "a8d5b3c63c06f42f2a47db5592561df613a08a17079f8bffa2f1e22009f3cbc5"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/timezone-dropdown.tsx",
      "before": null,
      "after": "86cda1bc38c6ab7fa597e4446ba52271f8f2a3bea3a6e707e56b310338f107f1"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/timezones.json",
      "before": null,
      "after": "9a09028fc86f66ed642a253115d5984781159c55725e5540332c2bddf5370a6f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/toolbar-wrapper/README.md",
      "before": null,
      "after": "704f341393bb94bb8d6a53b4150bd231ce57c08ba36606e3041330504df33c6f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/toolbar-wrapper/index.ts",
      "before": null,
      "after": "60c18a40f4e0f1d6de7c8b6cd63153c13863e097f69a6beaf50a4785edc81696"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/toolbar-wrapper/toolbar-wrapper.tsx",
      "before": null,
      "after": "ff5fac9407f713a155b73c1f85ee1e43103991e659256ba369380a3315fcaacf"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/typography/README.md",
      "before": null,
      "after": "fb7efe685e6bbb028aad6a9c4104b62b00cd3978a2175de182c184382ed54e4a"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/typography/index.ts",
      "before": null,
      "after": "b670327e1370a2f1bc523ac2eb505c9ae8230b01e104a37d4d559faabdd1622e"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/typography/typography.tsx",
      "before": null,
      "after": "211ea58573c086e38dd0aa3995789b13deac8e15ad136b8cc11f082ca940ec24"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/upload-file/README.md",
      "before": null,
      "after": "9ba6ecd20bb6470ea01ab807e65da904d06a26b637c92e0832295f2ab90c9d43"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/upload-file/index.ts",
      "before": null,
      "after": "4d145b5628c34e95ba102be7b9e9c6f38125332590563c8ec664403e5f2ef95f"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/upload-file/upload-file.tsx",
      "before": null,
      "after": "aa54b416c4bf94c8fc2b38ae98abdce2d9bf84c5c31329f15b417125741343bb"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/test/browser.test.mjs",
      "before": null,
      "after": "70b9928d7e587ef33144ccba44a052474cd81a6e0707fe342aa90844feab6b76"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/tsconfig.json",
      "before": null,
      "after": "b7b47e18bac6e20640ef8c37245b20623a927f95262f59853cdafea52b0fd70a"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/upgrade.json",
      "before": null,
      "after": "51a816808498f2fcc8378d66364894e19aafc90e78164d8405c7d45cb0d0f028"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/vite.config.mts",
      "before": null,
      "after": "468f04ef6cb6b875a4e44a291cfccac389b8a9c501e5ae78d5fa610a73e9cbd2"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/vitest.config.mts",
      "before": null,
      "after": "bee52256d9b3fdb9eb6892aaae5b75c6520aece98cb0bcf6b087d18ee319b1db"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/yarn.lock",
      "before": null,
      "after": "e5c113ff7c046559e37d25023c8571ee124c617e4ce988b1b6749039088385e0"
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/.npmrc",
      "before": "0e6558d2295243d10d15ed5589a133809e0f8de4f56df560d52ed5e5e54522dc",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/README.md",
      "before": "ce2595fa1c10528e38583b06af2fa4c302a7747111f84bf6b69a7f987411b666",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/demo/index.html",
      "before": "e83ddfe909d99ee9c91539a9f505dc2d7d969302e72194a04c53fba3e918aa6c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/demo/main.tsx",
      "before": "3077ad7af7eeaada505d3c1c80eb8db6c106fbb3c4abb482e1f13779e76e5bdd",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/package.json",
      "before": "abb7bda9aafdf0270f2cdb9baee02a7950ba5655c68e65ea8795c09d52aa8ad1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/__tests__/cobalt-upgrade.test.tsx",
      "before": "f3b5797ade2e657ab02e62a9c0b1de13209db515907742951f077dbdc8098319",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/app-page/app-page.tsx",
      "before": "61ea6d10e69886811cc550c5995226d196e05162e1dbe16a79686aab05dab9b1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/app-page/index.ts",
      "before": "6af06e80dbef119b386329d5b07ae5d784547b53956a292f5c5f67b010ec413e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/badge/badge.tsx",
      "before": "db170edc91164f70e8a1ba02635c3013bc3f537fc4a43155091801f549a90385",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/badge/index.ts",
      "before": "ab1fc34603cd6aee91104cc3c59442f32ef1245421e2924533edeb3ba2a8c4dd",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/basic-table/basic-table.module.css",
      "before": "4cda0c0d56b1fe00d01ed77e466de7b559e5fb0aac17229852c3c03fc59940d2",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/basic-table/basic-table.tsx",
      "before": "c546399e8e25ba868663a4047539a8fc1265544adecf9f62bb76ea2c491520c6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/basic-table/index.ts",
      "before": "533f3031462901dc7686120e036397d092183d867b21bfe9bc287e9f9c1e72b3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/basic-table/table-layout-measure.ts",
      "before": "86b9616fab79afc788353ace89bb79b1dafef6b20a0c63a8a07068a34e68ad92",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/button/button.tsx",
      "before": "b76b0ea24b7d594e57857f95f309a844b7b31b8d142d705c65791a1c1a4c16f6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/button/index.ts",
      "before": "ac62e0bfb1d8ac93f956eff59ff0b5341a1623a95eccab48e68c0f81895e46ab",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/card/card.tsx",
      "before": "fa2ff2eab881bcb41fa7c6343723b561fa3041d636740a4ba7d42ffa5e63a8cc",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/card/index.ts",
      "before": "fa1f8ac1273b6e808d1d6aaa1da77f2c0b6cd79c721d8196c6bf4127522caf68",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/chip-group/chip-group.tsx",
      "before": "d726033f8c9dde394032c6b43a357fd6a8e793e83ef36960c6190bb9e6be2d45",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/chip-group/index.ts",
      "before": "aa26892cb26b17f63395d9ccefcaaa0b07a7d59794bb808504e7b9791629e135",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/choice/choice.tsx",
      "before": "864408e281d0d50284be3f35354f83183be43afb347dc70ab926598d2ea43d8a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/choice/index.ts",
      "before": "b7baef04eae812059c3d8bff083d2ca75a90dc200cdc0662fbc9bec044cd6897",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/collapse/collapse.tsx",
      "before": "5c5d57bb71fc1ab260a5fa42c011c6605dee0dc6d3d91dc1b68204896abd3720",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/collapse/index.ts",
      "before": "b2d08d8f5bdaf91acbeff2830e51a17a2ea1b131bd31f0b764104a42cd1a2e6b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/confirm-modal/confirm-modal.tsx",
      "before": "a0d5de2a3e407be642d59e91a49440f234267c103582145eb26f94310ee39b91",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/confirm-modal/index.ts",
      "before": "40254d21f1156e6d4dc223c4ae5e7116b4bd95c5cf5f34e424fc30244e22f8db",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/date-picker/date-picker.tsx",
      "before": "27fd15700a483d7a2b0ede5f1b58d726e2b63af6cfe3f4d6f7d21739eef8bdca",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/date-picker/index.ts",
      "before": "f562d7c16a43c66fb6b254dd4d6c473973bacdea99ffbf39c2b8320001e96850",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/date-range-picker/date-range-picker.tsx",
      "before": "584a66c76b97f58cbf5425291f7eb954a47888f0b2c6f87816a5325344607ed4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/date-range-picker/index.ts",
      "before": "e38dda63b2f9dc677a8e615fbd889fd1c3c7cb674f525bdd323378421aa74de4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/date-time-picker/date-time-picker.tsx",
      "before": "a54ac0800eafe3b0335c39d75a38704e9cae3b1b353c4d78af2a5f6e9f6e6764",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/date-time-picker/index.ts",
      "before": "5c55b5b15e7c5cef7066b0b8b96f397c0405d811ac00b2c2f18ba8d084535261",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/dialog/dialog.tsx",
      "before": "338c7dafca8ffbf8531fb43904a2e1b2887de27756347490e0a1a42209113002",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/dialog/index.ts",
      "before": "afd69030901d98fb7d96b75b906d635afeaad16d2d6776a540c4943bde60f729",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/dropdown/dropdown.tsx",
      "before": "e1b07aef1938e5963920dabccda5e45d288b0502fe7bf3ba8bb3c79ada6610b4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/dropdown/index.ts",
      "before": "fad016f7df559b6ae4fbaa79fc8b1b9cb6366e3a1814533d92ac319c9662d691",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/filter-toolbar/filter-toolbar.tsx",
      "before": "35642b9a33a4215ab9a142329259cf46243ee8dae315c32c211ee1565f0ff199",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/filter-toolbar/index.ts",
      "before": "cf78396fe6168ca2f8c1510d684d31eb73326c83a7263abf4c6986b484b6e322",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/form-field/form-field.tsx",
      "before": "88492e8ea27d9c8d3868b12bc8c480e5c7e3ed923ca3dce7d7077e425eadc3af",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/form-field/index.ts",
      "before": "20572dfe90d382703fb2f74d88b6860d79a5d0c916de833043734081c061b820",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/index.ts",
      "before": "152bc5f897a7c1847245b2f032852b1029f4b02bb3ee0f4fc3a28ce562ee6319",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/input/index.ts",
      "before": "51f9d424e9cdb87f68462ac426fe204bfedcbc1fa9fa68bb517a5f97d674d4c3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/input/input.tsx",
      "before": "2ff255aaa3ebd7b33155ddbccda534ba6d1e6559ce1e883caf3ead4c70e285b4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/interactive-message/index.ts",
      "before": "aaa8b7a5964832deabddc6d3c016dc99a7d8ecc822f55f4c99322f20b30800e7",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/interactive-message/interactive-message.tsx",
      "before": "cce0fb409f998c8d4f229048bf024f70625ab4960a6b484fd131919333deab92",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/multi-dropdown/__tests__/multi-dropdown.test.tsx",
      "before": "9fe69db645f2cefa7cf3a0599c9321fac9ee038586637d8b5c3531887828fb55",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/multi-dropdown/index.ts",
      "before": "09240cd213276043a18c31cf6386c89a21f7510513baa0770b172f64e6425308",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/multi-dropdown/multi-dropdown.tsx",
      "before": "db3b79fb005f4906cbffd1911252dcf2662d5b96484ff0d89f8c9c5b10c35e15",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/popup-trigger/index.ts",
      "before": "7797b1e7c1bc58754a8ba1a46cbcdc972a08224542fa03a1f16c9cbdd071d87a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/popup-trigger/popup-trigger.tsx",
      "before": "850ee1626e3d861c0b8b86997c71fe3d0ada06b7e5c06809797f92ac0e005374",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/react-app-env.d.ts",
      "before": "3efb87b3dd29ebfea03ab717fe50fcffa9bb46e408c51de1316a31b3d6d3ce5c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/select-group/index.ts",
      "before": "239b5651d8b10936b41ed3b88da3aa2e9f52238eb163c0de02de4e73552d2164",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/select-group/select-group.tsx",
      "before": "7d543004cb555ac5da00465d36ec4fb9576274139c831c7b14b9c891d56b8bcf",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/side-panel/__tests__/side-panel.test.tsx",
      "before": "190cc76ba423b65149003081b9ad334501ecda976add5038f1a6e8efdfc80e64",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/side-panel/index.ts",
      "before": "3b14c735ac8a4d320a8f8673a0faa0799813f515ae80650a7afc207bb6248b65",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/side-panel/side-panel.tsx",
      "before": "b909ca3352a69c0bd8ca2e0fc38009ece04a3056bcffa7824e8bad9d1d492587",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/stepper/index.ts",
      "before": "2195650735dcecd518fd0dd8fd67f3a2922dd9fe6ae1b6389496ca1c2bec2d0e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/stepper/stepper.tsx",
      "before": "42495dccab9676062c61b8b440bbe035f912debc6a25b0f3c37265598889ed04",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/test/setup.ts",
      "before": "a46d66851af2c056e805fdd574bf5ec3adb1181c43c5e41f0a1c592e338afe64",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/textarea/index.ts",
      "before": "4bf80f5c5bfd2f1e3c3d2c1a3846c2d243ddd858d10ddd0b6692574a0b234c02",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/textarea/textarea.tsx",
      "before": "5cf75d6c6270d90056ffe00dbe3f325cd815882f3792fe66b2892a219052ab53",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/time-select-input/index.ts",
      "before": "267d2c4d4444c361b64a09fa552cf30315bb595b043e235aefca240cf8f080bd",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/time-select-input/time-select-input.tsx",
      "before": "e3e93e0838736ca5731f7b8e8956cb2a3d342df38efd2e3fa7c8e76ee9a02d51",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/timezone-dropdown/index.ts",
      "before": "a8d5b3c63c06f42f2a47db5592561df613a08a17079f8bffa2f1e22009f3cbc5",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/timezone-dropdown/timezone-dropdown.tsx",
      "before": "86cda1bc38c6ab7fa597e4446ba52271f8f2a3bea3a6e707e56b310338f107f1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/timezone-dropdown/timezones.json",
      "before": "9a09028fc86f66ed642a253115d5984781159c55725e5540332c2bddf5370a6f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/toolbar-wrapper/index.ts",
      "before": "60c18a40f4e0f1d6de7c8b6cd63153c13863e097f69a6beaf50a4785edc81696",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/toolbar-wrapper/toolbar-wrapper.tsx",
      "before": "ff5fac9407f713a155b73c1f85ee1e43103991e659256ba369380a3315fcaacf",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/typography/index.ts",
      "before": "b670327e1370a2f1bc523ac2eb505c9ae8230b01e104a37d4d559faabdd1622e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/typography/typography.tsx",
      "before": "211ea58573c086e38dd0aa3995789b13deac8e15ad136b8cc11f082ca940ec24",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/upload-file/index.ts",
      "before": "4d145b5628c34e95ba102be7b9e9c6f38125332590563c8ec664403e5f2ef95f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/src/upload-file/upload-file.tsx",
      "before": "aa54b416c4bf94c8fc2b38ae98abdce2d9bf84c5c31329f15b417125741343bb",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/test/browser.test.mjs",
      "before": "70b9928d7e587ef33144ccba44a052474cd81a6e0707fe342aa90844feab6b76",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/tsconfig.json",
      "before": "b7b47e18bac6e20640ef8c37245b20623a927f95262f59853cdafea52b0fd70a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/upgrade.json",
      "before": "51a816808498f2fcc8378d66364894e19aafc90e78164d8405c7d45cb0d0f028",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/vite.config.mts",
      "before": "468f04ef6cb6b875a4e44a291cfccac389b8a9c501e5ae78d5fa610a73e9cbd2",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/vitest.config.mts",
      "before": "bee52256d9b3fdb9eb6892aaae5b75c6520aece98cb0bcf6b087d18ee319b1db",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/components/wfm/yarn.lock",
      "before": "e5c113ff7c046559e37d25023c8571ee124c617e4ce988b1b6749039088385e0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/apppage.mdx",
      "before": null,
      "after": "487cbd6df6838159fcb5fd4448ed6bd044da987499a68a2831eacb9a17369777"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/badge.mdx",
      "before": null,
      "after": "1aae3092e8fbcdccc14c3388316ffb09cf81da142a10e276546f4ad5a7dac887"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/basictable.mdx",
      "before": null,
      "after": "c5df3d7b20a60dac30fd76e1a4b930584435641ede1710a8a5ece0cc0f4b036c"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/button.mdx",
      "before": null,
      "after": "190c523f7bec59b592a9b7e3bcec594e55f8a83020d42070d9331c5a84ffaa75"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/card.mdx",
      "before": null,
      "after": "1bc1a15d86681012493df0e9770b911f6f239372dcdf7140b0ad41372939c4db"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/chipgroup.mdx",
      "before": null,
      "after": "c73b28622f4aa2fdf250a4633ac3d2dae88eab3cfe9f25cce2106d26b2eb7632"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/choice.mdx",
      "before": null,
      "after": "ca2ae3b592c7332c3eb8e2a200a9cc0572568d02eed24f19927bd7bcf2366b7c"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/collapse.mdx",
      "before": null,
      "after": "44f98fbf44605cc0b55c360a54ac11eb3217887b1dc5517e9793402164203860"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/confirmmodal.mdx",
      "before": null,
      "after": "a671565c87b62f7d351e8afd3f5f6b9070b7b140dfe62862d498e6c0df071bb9"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/datepicker.mdx",
      "before": null,
      "after": "33b9020efd11b8be1e6113a6326c7d90d36ad527722b64afc350ac10edfc4587"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/daterangepicker.mdx",
      "before": null,
      "after": "0033c972c0ae80a5d75466907a0c0ffc2ce8c859beb93e7a5b26fde29dbc6150"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/datetimepicker.mdx",
      "before": null,
      "after": "40e0fbdabf312599d87d7322e2f51739d529e7466d98277d089020e65888559f"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dialog.mdx",
      "before": null,
      "after": "b22b9f67fc6a3b346108ffedf1425dc5fec35dfbf307d2358248f5d0b58dad20"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dropdown.mdx",
      "before": null,
      "after": "a49b3a550f2a98582f5da8fb3f2ffae09e1efd11897d0637960b3b3b0ea6f160"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/filtertoolbar.mdx",
      "before": null,
      "after": "a0e2e99fecd203d525bd7d994339eaaaa1ba3ad59a9f351b7786eb99a7143862"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/formfield.mdx",
      "before": null,
      "after": "4fe3af143194145c13c48cb1006b73487a9b19591a1fa6d35b6586e61c8d3398"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/input.mdx",
      "before": null,
      "after": "4a7fcc27a985bab90a13e76cd50e6ded54f4aaf53082e597e24094967e306205"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/interactivemessage.mdx",
      "before": null,
      "after": "ff086672b294e0cefc3c2c27bc17067c5638bbd7778031b97aa1a660f7e9986d"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/multidropdown.mdx",
      "before": null,
      "after": "ad01d523e617b66d2f4036e5d9e7a156ce497d097562b848bc7f875b6a9cab03"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/popuptrigger.mdx",
      "before": null,
      "after": "354e794bee697c4e92edfe7aeeea5d7b7e1dfeb0aba7ddb8a8030adf8ffe35f8"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/selectgroup.mdx",
      "before": null,
      "after": "a7bdab17488695e4dbde6867a7ae8b5c31c2550e970922b347fab817169ba941"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/sidepanel.mdx",
      "before": null,
      "after": "2f901290fd6c72a81b61fe9f749ba753b5a40f4c9823964272c1414e6cf7d565"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/stepper.mdx",
      "before": null,
      "after": "fd8c4978fac75b2b19efe7ac74b8895d95d72a86c31a803b662724ee257e3d1f"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/textarea.mdx",
      "before": null,
      "after": "ab123cd75ea42eca068d035f26dcb8fb0cb63ca7c8c2c47d8a3f1fdcd2d10291"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timeselectinput.mdx",
      "before": null,
      "after": "942220dd5204ec359a65fdec88d54de746cc7ca093aad57c37c4644af864a9de"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/timezonedropdown.mdx",
      "before": null,
      "after": "c81f018f5dc4af4ff9491eb436daf870de82f31b59334bd4021407a33c6488ea"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/toolbarwrapper.mdx",
      "before": null,
      "after": "d52e310342c0aa192a0a6e68806ad57b8189f888f6db6141f2246d4ae6a21b18"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/typography.mdx",
      "before": null,
      "after": "3a2052152e64bda4c33263418400426aa825c343652e0e01c5409f94ea4c6b2e"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/uploadfile.mdx",
      "before": null,
      "after": "8243c753d9f5d8b38d8a4d87ff68b161ccc2c067c96ec8d9daa3f9a8df918440"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/apppage.mdx",
      "before": "cb58a012171c84d06729048c0a1f3d83d0cb55570fb4519c60c647c797f69c13",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/badge.mdx",
      "before": "2d52b48412d0c77fe36389fda7eb9f10dc66ed19c72e0a5a82dcbd9799e973bb",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/basictable.mdx",
      "before": "d284ac33bbcd1daca9494aeadc0ca11f61800b2e6d9aa126f41c23ade35bbea8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/button.mdx",
      "before": "f8541e50d2c58c2025fbc23733aa23d8cbf94c0fbcb9348827d88d404a3365a6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/card.mdx",
      "before": "72d7511d6cdd624e366be8dc02845a79a7e40b7637a558489050d81bc941dfad",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/chipgroup.mdx",
      "before": "b534f56f1ff920acd45d672ebecd20ef1d08d2feb33ed2762a37f467b3d7a202",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/choice.mdx",
      "before": "ae0909f3c159a081abd3e82a9f17357fc8b4f19b748c337915295d7a0f7535f4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/collapse.mdx",
      "before": "d998c4681a4bebe2b7f99614617e2b9aee880b765bf5008b344645c08406f1c0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/confirmmodal.mdx",
      "before": "5739971c31a4ceab32a962f272a918f8f2cf0cbe6292da4b6f8cac6ee7b3123f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/datepicker.mdx",
      "before": "dd5f6c561df58c1707ddb9bfe2d24a6a6ce3fe8fe028fa8065ef2337544f4cae",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/daterangepicker.mdx",
      "before": "84c6ddbe28b7c02f9f8be5236e87259d5ad0f49af0fe3491b655be58d9c7bc47",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/datetimepicker.mdx",
      "before": "a791713be8528f2937434258a0f3b07d817ede1da623651bec110b229d288c68",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/dialog.mdx",
      "before": "92a5fb50143a913603c4725c8c754200805a30519e560606d598f457010c1844",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/dropdown.mdx",
      "before": "29e220251f0c563e6c6545517163cd925d4030086d62e42571dd57c3e4ddfce4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/filtertoolbar.mdx",
      "before": "00c97aa7631d23109a95751a1b0b6421cc81e2b7aa73d49c2f76baec01326d84",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/formfield.mdx",
      "before": "22a5e134ca34ed98c6afd5307623804dda9b5f05098f9f8852d80a4e272f393c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/input.mdx",
      "before": "8a8d9934b537a8696fab2014f381495ff31edd421cad1b3aa5391cc09b97df91",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/interactivemessage.mdx",
      "before": "c06d337ce9d8851dc84e72b81a6bcff9d224e26c45f739acb42b8625441d0b5d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/multidropdown.mdx",
      "before": "35b50fee13a89ba417c42f14a4bb36826773e2c5fd490fd021ebfb413684edce",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/popuptrigger.mdx",
      "before": "6ebccbf3402223893e2177a61bdad581302ee671fa10086cf0834eea570e6a52",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/selectgroup.mdx",
      "before": "5aa512d758e3f1441e73f960abc86efc26ca5b853053882e88b6ca84bf6ed675",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/sidepanel.mdx",
      "before": "b35bd644edb5068b622a6246039111e4bd5a2060a89e8d1a4ba915e5e1a48dc7",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/stepper.mdx",
      "before": "b2221e9431de25d525055adda8f02b29904814bdda6784d1d724f9e89253e68e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/textarea.mdx",
      "before": "00c1a23220dc643685246006f895396d1b1399467bdd9faed6b9fcfc59a082eb",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/timeselectinput.mdx",
      "before": "33441e94f959589e75ff39849889d46567f9daaab0979685823e135fc5a22e41",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/timezonedropdown.mdx",
      "before": "5caf677f45e036edbb62597f37cbfec6d82464ecbe43ca9ed548573dba611ac8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/toolbarwrapper.mdx",
      "before": "79dc4e37d21f7f8bad756288de1a90e345c192e7ad09db46b14435b5fa0939e6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/typography.mdx",
      "before": "6d791d39ce6cd3a5232ca83437232421e898544f203500450956ef64af66ee56",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/wfm/uploadfile.mdx",
      "before": "fec33c6f061ffccafa20163b935abb7fd95c0bfaeec7472d2028d7059ffcabf1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/demos/main.tsx",
      "before": "a8f12be799a895f2c603c1646a4478be3074f0957280ce4075422a71495f70a3",
      "after": "62a3d398cae3b6d7abc0849a3a0e73198150527dd168afe3d21de686b8039098"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/tsconfig.json",
      "before": "8f4768d65d0246dfd99d4c7a714f0e6afdd16c75842c8a29566e3be5c5d52da8",
      "after": "a81949499a13d6f4ba92afc63efb9b313596c685bb8727a40208e03b2475f4ac"
    },
    {
      "path": "packages/talkdesk-cobalt/demos/vite.config.mts",
      "before": "a4d77fa3fea297fcb68ca37b1353e8ca1a4a2d3cb9788a30615e41f2f694c60d",
      "after": "80dcb42c7b5401b77a3c6eab30ed057a6215e2e50fc58a71d1656cecd83dd55f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-1.tsx",
      "before": null,
      "after": "ae9c1946f021aa4f29b911e88550d90aea84004eeabb1e9019806cc51183d22a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-2.tsx",
      "before": null,
      "after": "4ca78417a5e24dd76cfe3652e834161bbbb1c9124a491bd0fa7af4c0373bc2a3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-3.tsx",
      "before": null,
      "after": "57141621d067253949cbcb48710911dd095b432b5625111f9a63b4c42674871d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-4.tsx",
      "before": null,
      "after": "d2c71a8fc9ee86f55fdbbe23849301038c9841bf205e2325279cccbc185a1341"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-5.tsx",
      "before": null,
      "after": "845befb2d213a7882ba1a638e8bd08164f71f3667805546bd256c6712e734401"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/apppage-6.tsx",
      "before": null,
      "after": "ae23693c2c66358c4ab0e13052790dbb9a2ed3f55d2a079dcaa62817d42167cd"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-1.tsx",
      "before": null,
      "after": "40722b5617dee2082173bcf81f57e900dd3007fb49e485c87d50b5ac95775617"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-2.tsx",
      "before": null,
      "after": "b55e9df2f2504b4e29106d0365afe5dcbf5fd5171609093e6acac5518a5b7448"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-3.tsx",
      "before": null,
      "after": "783c8a5e740f77fe55aec9dd9b2828fb86714ccbd9b83773abf8bc203458ebf0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-4.tsx",
      "before": null,
      "after": "ecc7de5be1fa99fa4243f937d6e479913749a20b13c2b6ffe613b7da78b9ed7a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-5.tsx",
      "before": null,
      "after": "decaf0330ba0c2ff5da55c2943a5529c9a31e29dbb92d8b21fd1a465c85eab64"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/badge-6.tsx",
      "before": null,
      "after": "6c480d1cbdcb535dbd312af3c71e29ad9b105eba9224a1d4ab0313f2e9523f58"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-1.tsx",
      "before": null,
      "after": "cba9e5a1eaf6ab511f1718d9546d0a4c6f29f59dffaa74c22761ec09c1853bb8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-10.tsx",
      "before": null,
      "after": "a0b4ee8b3b2906cc9e6afae71349feea65c87a6bcae06c48d110739980b77954"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-11.tsx",
      "before": null,
      "after": "d378d0deec5c1719c4b6d18ebcc90f21599352328e06eeb818745203059fbc98"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-12.tsx",
      "before": null,
      "after": "277d3bdeec75e95244201598244b4a9c8561992d9f3dd271d7969702d3ace1c4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-13.tsx",
      "before": null,
      "after": "c0af9eb3091329469e88f02bc55cd1f7ed1373c72b55d1fc7f7eff54cab83a81"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-2.tsx",
      "before": null,
      "after": "e7873d189f25826bc325678e4da0d803e88f82055fb6d92529dbfff7acab3d79"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-3.tsx",
      "before": null,
      "after": "060298619a85f6dfb7e7c042b3a1d99aeedd0daf3730c46fc82ab7a1d315b405"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-4.tsx",
      "before": null,
      "after": "f1dd7f6613a657052062b7d0a3846ded007f8ee4f0d5272ed26abaea62aa75f7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-5.tsx",
      "before": null,
      "after": "2e119dacfc069474234f9e0c66322f4b1ff7040a60bf2e8aab9509173962ab46"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-6.tsx",
      "before": null,
      "after": "df2effd19631663969e5d74a0429ac7c28e854ce175429dbd8b3425c12007f9d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-7.tsx",
      "before": null,
      "after": "e4ec3b07b7dd84dcf3ef2c0541026450a6f1105164500aae1c0a2a699bba0ed3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-8.tsx",
      "before": null,
      "after": "8cac66d9499fcef0dd428cbfc6098b62bae2c6738969cede575a6d2d6590d5f8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/basictable-9.tsx",
      "before": null,
      "after": "f53a2294727076169a6f866d30005625f5f5c4c0644d4951cfabc716d4fa7e53"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-1.tsx",
      "before": null,
      "after": "47247e7d40b33cf0b9bd10e2f361d90c3ee6fbefcbb75670ad1746ce6f641d5c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-2.tsx",
      "before": null,
      "after": "86e1428b11eea542ee6dca0933bd058b8c44f1d93dce785c061ebf4c4b009adf"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-3.tsx",
      "before": null,
      "after": "cc755995d8e0100f48378cab3e0c974cae2049ef37854b04c16d5e34221b7bda"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-4.tsx",
      "before": null,
      "after": "810b8dfd6d842ee3ea9a0cafa7641146e4a10c13eb6798d35e1de5765fbb9bfa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-5.tsx",
      "before": null,
      "after": "454ad6e4eeba6a2604231c72c306132213ee1a85e5f1339bf540047ccbe46444"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-6.tsx",
      "before": null,
      "after": "54beb42b31422f9abb8f954b55d745a87b4f056aca7f928ae3068d8eee010872"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-7.tsx",
      "before": null,
      "after": "910a8bbf648fbcba37ca976ee8738ace7c75602839ce87a8316d17af4af9bedc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-8.tsx",
      "before": null,
      "after": "12fb3aeceb87eaaf69a475cf06cf90d933f15a3f81936b70b3d6aff235924f16"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/button-9.tsx",
      "before": null,
      "after": "d7bb4966f1da6fd19785d0666ac1d027b55b33c18c1fbd45646b3011da334dda"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-1.tsx",
      "before": null,
      "after": "e9ebee8328168820a70f89fc6d7c463e8aff4ec89f8fad6219d26dbb4a343cdf"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-2.tsx",
      "before": null,
      "after": "5162ff9fd54f800de57d4c3cabc573647c722e78b04dd898b36254cf966b7a9b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-3.tsx",
      "before": null,
      "after": "08ee84408097b9c668525a0169a994de36a830e4e2d9b8b171d6764f9ec4f130"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/card-4.tsx",
      "before": null,
      "after": "614ea3b871aa5c807804679b6d8fef4da0ec3aaf70084ca9fd347bc2ba651103"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-1.tsx",
      "before": null,
      "after": "f5cf6bfa29b23cc6a509ef111b22bf9027f20a8f9c923dc04871a469e9b3f8e5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-2.tsx",
      "before": null,
      "after": "6d44da041bd2129ecd743cd212cc6956ceca08698530e8bc18c407af7fb186ae"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-3.tsx",
      "before": null,
      "after": "5163685896c73f797e977e175ac96fab18a21e2487512324781debdc4782bf78"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-4.tsx",
      "before": null,
      "after": "a83a809c2683d055b083028342edc0a74e7ade8b4bba4759362d61fb808afcee"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-5.tsx",
      "before": null,
      "after": "e32c28ab20358f289646f14ce1448481ae2d8353d1e77a2c441964220dec956f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-6.tsx",
      "before": null,
      "after": "869840aed3417080f48730a841992770e40c051de0f73eae0e7b5cc660e5aa26"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/chipgroup-7.tsx",
      "before": null,
      "after": "b2661f71a82ea9ca305a812823b58f61b9c4dfec4f4cb22789318e8b26327404"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-1.tsx",
      "before": null,
      "after": "7cce33fbee99f13004c75ec3fa8f8b0e6f82084425ee1ac103ec72bb073a116d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-2.tsx",
      "before": null,
      "after": "410938c46a54778cdc98f952dec6fb7e54b84c5bec120dc620f9fb1614f3a1a7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-3.tsx",
      "before": null,
      "after": "83436145089fde6543fee70989508c95b099105a05adb0f21b09b44c568e8fdf"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-4.tsx",
      "before": null,
      "after": "73b2201f96ce0bfbae3dc572841a37f4a9e834411e26ada723a70131ba261c84"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/choice-5.tsx",
      "before": null,
      "after": "f2893f97e974f43b8f09c39439a8eefd59b3d5b65ab0d9e9d14acc0545f19a19"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-1.tsx",
      "before": null,
      "after": "2e92d5f13dbe3e1f4e1d945805f279b91f9272e57121ce36abd1d48b37ac293f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-2.tsx",
      "before": null,
      "after": "9f6d50bd1a58bf0f29dd063738d20926f94573469630c711bbd08187ebbc2042"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-3.tsx",
      "before": null,
      "after": "c0f401d062c35bda1b8711a6ef93c9a3c6b9957b9677d5be46370a69ad975256"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-4.tsx",
      "before": null,
      "after": "e384980bc074adc46bbcd12ee1ac81895304e15df4520c57298e4a5d3d80d5c0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-5.tsx",
      "before": null,
      "after": "3551d2aa93840eae618a51618fe2d6ecef444fe538094be80da031d66d83e634"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-6.tsx",
      "before": null,
      "after": "6f8ed7fd4f90c5ec2f8a9cf2a07c0df6ed6516945d723e53c115826d6f48da10"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/collapse-7.tsx",
      "before": null,
      "after": "7c3ee32509bf3b269f19b4fa1c549c21392177d80ad61afaff958d7663ffac4a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-1.tsx",
      "before": null,
      "after": "758909c9030181fa883ccf184ec23315f5a250e89542c71fdb11d5cf68e11103"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-2.tsx",
      "before": null,
      "after": "8c3360c72cbea5bbabb7e2ba42486dd986956fb4d7ff5175a75beba195ee8d7e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-3.tsx",
      "before": null,
      "after": "800fb165df501724225a041a3dadce3de8137add1bc0625fcb4deedf92246900"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/confirmmodal-4.tsx",
      "before": null,
      "after": "cb72f61395689611a8b66c5b1c9e400cad1bda6690079052f929d75bce0bc53c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-1.tsx",
      "before": null,
      "after": "916a0fca533ab5f96d41c7403df5cdd3ddac1e840fb28a3a350c87f299639fc8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-10.tsx",
      "before": null,
      "after": "6702798083fb049104750fa7c8496194071bff24be52ed139ccde9d0a48ce6a0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-11.tsx",
      "before": null,
      "after": "470d314f0414a62930f9d34e7d331ce892e17f7ed32390ba9275bc18d99cd930"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-12.tsx",
      "before": null,
      "after": "23077a7778f9ac128119e87d31e9ea4266c159c66544d7e97ac65781636d197e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-2.tsx",
      "before": null,
      "after": "55402433ce2d7b101f402f37b4df9a7cf6a920eff4d6f5f2f7a3c1e04b366bf3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-3.tsx",
      "before": null,
      "after": "458f46506042fca7159e43f0ce3ca5694fb6f649a7470958f48aafe0de58e13c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-4.tsx",
      "before": null,
      "after": "d3460452bce63a6c9ee53b1295c168091ac5862b7d340fe3a29fbfb696b9b516"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-5.tsx",
      "before": null,
      "after": "083dd8a572ddd5f6536cae065d170c05a1b16b790b8e41e7a897d384c35e6f22"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-6.tsx",
      "before": null,
      "after": "c6e7c6a368322b793d21dc60fb7ed4cd77bf3244053c9dd674467ec898afad5c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-7.tsx",
      "before": null,
      "after": "16ae35fae12ce3f9a84c1cb383a4c006cb451aeb48d5d468238162745d797c02"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-8.tsx",
      "before": null,
      "after": "58ae4000580650b4ddc85ccd34cd79c6fb0e3b2c3714c339f8feeb3b0c95ebe7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datepicker-9.tsx",
      "before": null,
      "after": "c3e0af278d709e709d74fe04b9964e72cdb179c4e43ae2c0a2c04edcbb7074b0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-1.tsx",
      "before": null,
      "after": "04b70db543ab5435c1c211fa331ba5f07144807b85ba12d8c959991c28d4fcd4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-10.tsx",
      "before": null,
      "after": "d638c3fe6c0eae8ba4e2e731ad74af6a47f2277a664ce72f57f313ae4c23996b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-11.tsx",
      "before": null,
      "after": "a316751fc211c6106dd8cb8d480d5d50d6aeda5899d59ec2c645442389cc01dc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-12.tsx",
      "before": null,
      "after": "544c3423a28def596f61fa3543ac1653450cf339e7425722c19a970e482110f8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-13.tsx",
      "before": null,
      "after": "1d0cac86eb4f577e5f16349afa4dc1141947fc43f87c20e37dfdf7bdd1630ff2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-2.tsx",
      "before": null,
      "after": "e188ab506d29f294217eb650f5057919205f456d37a1b1eba809b33e396396b2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-3.tsx",
      "before": null,
      "after": "682a4cf1479f10f5cac558ef22707748ded879f568c38def180c2e3c8e3e2c0f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-4.tsx",
      "before": null,
      "after": "22a0363981ed9717a1377841af7695a45bfb76c4d8cfc074cf5e7b3ebed6f93a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-5.tsx",
      "before": null,
      "after": "58a49cb5d56b48efaf6a6d8c2da9bd2b75ab97f278b6c54db1d8165df7866d7a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-6.tsx",
      "before": null,
      "after": "8c516af126354b475697773e7fdcd81b31906852cb1a0a623b7c778225967ec6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-7.tsx",
      "before": null,
      "after": "afbcd58cb97b0739539b940ce6ea281b758866e8f86b4701ba2854c44bf34da5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-8.tsx",
      "before": null,
      "after": "2cc254053006a1c9f18ed68746d1fc93684a369fb46dba26eeb0145d33204573"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/daterangepicker-9.tsx",
      "before": null,
      "after": "c058a3ae6f2333aa77dfaca6c54c93a0f440a26da8340e57b5fbfcb0b4ea6274"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-1.tsx",
      "before": null,
      "after": "4a68b417d8e403b99f6e3b43abbb5f21df392f920aa57bd0deb33838a6fca294"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-10.tsx",
      "before": null,
      "after": "2353bd8c3ba7fe64e939a0c3f843a506c031f4e003c0df5c840beb4454eb794c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-11.tsx",
      "before": null,
      "after": "0518fb33cfb6d804d67f4c6e0daca45a7986c1e9d0c94e477e3ce9718c90bc15"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-12.tsx",
      "before": null,
      "after": "1b309b17f69896b18ee74e1925561ce104512830f0d3cba0f70b3ef86a545c08"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-13.tsx",
      "before": null,
      "after": "566b7ed614d8af4cc2b5a267fa49f9af88d5ef88ab9555ce78dd7b719878a395"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-14.tsx",
      "before": null,
      "after": "5b1423c0299d98a58b7b239e945bb11acf53e9c771d384a0da564869fdc5fcdc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-2.tsx",
      "before": null,
      "after": "900a541c5c51998cc162a5ec441d6e4e028acb8068cbe9a03d2073e619b47ea6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-3.tsx",
      "before": null,
      "after": "9f061a99f44a6c6124f8ff5159bfbf775762b09609a467a9750febcc6fc51dd7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-4.tsx",
      "before": null,
      "after": "7a11ba484e35b8b7345cdd0eb00f5d690755b703f0d2259ed4e0eac55fd9ebfe"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-5.tsx",
      "before": null,
      "after": "e6c3d133f5476ffa3fb8c78441c8a31da89355ff59aeec38ac0a7a8b548d4ca7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-6.tsx",
      "before": null,
      "after": "a0d5c6e26bb200b707dec8f8543c390ecfb7a4db3f01ebee937a326f34d932e8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-7.tsx",
      "before": null,
      "after": "8362d72930a7d4dc0c9b46f0bbe88cb6dc430ce1e8f0a71d409ae89ba93ffbb3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-8.tsx",
      "before": null,
      "after": "7ee56622503440e429b0f744987420dbc585b520260d6f5e4791aa14766d88ad"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/datetimepicker-9.tsx",
      "before": null,
      "after": "c62777c885419aa1ce39197db04cff09baabc5bc8e5191001b3f665d9bef47b0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-1.tsx",
      "before": null,
      "after": "2935f99adeef36f215db384a7686cca163ffd075143359a073d4fafa162c5a41"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-2.tsx",
      "before": null,
      "after": "07634e3d5910b026a6515cc7e7f7fd4e0d61d1269728b1e4119e45203c1f6621"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-3.tsx",
      "before": null,
      "after": "eb60bc8e585e077ab90c711a1e673ec263b242791ee7c1fdf9a5fa0415a77fc0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-4.tsx",
      "before": null,
      "after": "811de9b4236a55fd53e1340449b48feefcc6e695039fdaae55600877488b4841"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-5.tsx",
      "before": null,
      "after": "69406ea206d7b90b63bdd490d08169a07702d569e38637f219c7560e3a9ade81"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dialog-6.tsx",
      "before": null,
      "after": "a7dcec2961d208c1b0d30fbf25e47a449612806060d3dbd7b8f072e543fb7d1b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-1.tsx",
      "before": null,
      "after": "317696d72f0ee43d551ed5e1950456fda8957c6944f47b32e93c25ca852095b8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-2.tsx",
      "before": null,
      "after": "7095565824e574533490b979fee5747d6a8f244d4b8c818ca491d35be81d4113"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-3.tsx",
      "before": null,
      "after": "a9e1c47df466488fecc15f2da11ec1077a038f4fd1c2a5c88b30065215b2179b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-4.tsx",
      "before": null,
      "after": "4ad4958ebb57b871b34cc571ae3782e4836db83fad7f98f763475930e661a5f9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-5.tsx",
      "before": null,
      "after": "55b5edc345622bd793ef8a9679502124a37ae9bcafa87981b9641220dec34612"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-6.tsx",
      "before": null,
      "after": "fb60677c7ec61713ce0f9f55ffbf8ab1a4a67c657fca83271d3d7e0e14123d50"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/dropdown-7.tsx",
      "before": null,
      "after": "03c3441759821bc82df578009f7a239f0cc65fa998dd81670aeac08969a0b904"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-1.tsx",
      "before": null,
      "after": "15358b4ab20189909c4eb1fdcf9497febc649b3e86db0941144cf4611475b3bf"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-2.tsx",
      "before": null,
      "after": "c01a81f7691aafdde377fa008bb13f2982fc29d4d9fd13f184a2a4c7cfbb7ca1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-3.tsx",
      "before": null,
      "after": "69c99804837f51f39e165ac3963a884aa665ca8fc58808567196810baeea802d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-4.tsx",
      "before": null,
      "after": "fc6ea354628a3aa0585997489c81e42357a0de3f19e758607ce7d6671be036b1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/filtertoolbar-5.tsx",
      "before": null,
      "after": "1e2d35c1fd231ff3b696178cca48db77db4dabf65fcb395dd9481f343979d1bb"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-1.tsx",
      "before": null,
      "after": "955e2b6ed7724ec402b75cef762a4d87ad9fbad414eee902b11699d23041471c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-2.tsx",
      "before": null,
      "after": "cad8412bcb6a5f0b56026fce8f1193165583fb82b0ff4c7a58ce98f6415e6037"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-3.tsx",
      "before": null,
      "after": "a47480f71d40ccd95847d3a564b3dfb6a4585466fa7be58ee7df4f2b75eb01e4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-4.tsx",
      "before": null,
      "after": "3a81fe29d9731a88ee5429720fe0851a52e398460ab5779d47a05d3c6b001ae5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/formfield-5.tsx",
      "before": null,
      "after": "75124aebad752b12ad23a9512e0912d0c9c679cabbc2cf84912a6ed497158f1a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-1.tsx",
      "before": null,
      "after": "d65adce5a6a2a553b116462aab0dab5b7f0d7cc41f2db304600353a37f69900f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-2.tsx",
      "before": null,
      "after": "326cf7926a30e939dc83dbb3d28028836fc62da3b3b92697c5b6d23b0f3556a7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-3.tsx",
      "before": null,
      "after": "e9aa3486159854c1dd5521e5b03aa43621edb90e4ef3cc3c8453918eccf9c357"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-4.tsx",
      "before": null,
      "after": "657c647a87c2b832b6d0101c4d6b8120dd00e38ccd078f7cdab3a786569aded3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-5.tsx",
      "before": null,
      "after": "ce38746e046810e07801d16b85b48c3308f2532d969af3b19787813efb5b6460"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/input-6.tsx",
      "before": null,
      "after": "bf5b55bfc03074b787835acc7d3f5aeb53c9d8ec13449467eb83101ec56c3702"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-1.tsx",
      "before": null,
      "after": "85d37bf70b40eef9701a2b105a3a5082defab8e2e7a6a6850c81ecb73082af9f"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-2.tsx",
      "before": null,
      "after": "458aea8503ee06186dcb7253c39f2fbfd03a26158d3d4d06bbc9b94fca064e28"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-3.tsx",
      "before": null,
      "after": "001490ee28c1824af74df3d6c7e765f67bf4453b192dfce4a09b3eebb7e2ecda"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-4.tsx",
      "before": null,
      "after": "99cbf08f48db5f05a50de2ad1fad3fcfd8e84c35acdf7486efb56f608ea3940c"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-5.tsx",
      "before": null,
      "after": "67835e8096a503980e804472701bcc574971b1b5a61e237a3b24bffd67be8fbb"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/interactivemessage-6.tsx",
      "before": null,
      "after": "13e63cb6e359d1d04c3635f755edc03d33efe20a541ca82b542342f4858d062a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-1.tsx",
      "before": null,
      "after": "e28390b71403648d5f388001e67b26314526b6ece16573f142617691efae4a59"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-2.tsx",
      "before": null,
      "after": "9dcef47507e64f99d7b5146978d0112a2a3a34bd9d03191a8e0ba813b044dac9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-3.tsx",
      "before": null,
      "after": "befeac9150a25c5687ee58205e9c4f35c7afef34f483b8269c77cc33d7850d43"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-4.tsx",
      "before": null,
      "after": "b6ffa8bd87b17bbdf09cc73c2a9747161acb7be901df2a387d32a09746660dd5"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-5.tsx",
      "before": null,
      "after": "8d10a63881b7fd571679775b104b54b128366429c472078ff3e95e0beb32d2ab"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-6.tsx",
      "before": null,
      "after": "f900fece54c13b9c5aa586a052126d9e2da2a9d030262a6c0d429de54369f00b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/multidropdown-7.tsx",
      "before": null,
      "after": "8b17ee6573d52b1a86bb0e3bc2cd2b89a44522545f76e7879c8a4433ea6042cc"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-1.tsx",
      "before": null,
      "after": "0a257b51883edc2ed201314196f96500e3935de073d2e1f028f6ef2ba8b2dfe8"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-2.tsx",
      "before": null,
      "after": "b2894142edca13c3520a62385fa4089ba9eb7e4c134a903e877b542ce356be5a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-3.tsx",
      "before": null,
      "after": "bc745b07bed589881cb8b0f561b1873a970bd0af86731eca038f28dca734eee4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-4.tsx",
      "before": null,
      "after": "d83264d2777620237a5e6a8d5e751456b0b2d1dba1c0af242e32c21bd2600507"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-5.tsx",
      "before": null,
      "after": "119e6ab818b432227dc6084f6737396ed32514dd0bee90a6a920722ee6df265e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-6.tsx",
      "before": null,
      "after": "5cfdb3e9069f993ebb61fb250881e48de18de5e90e97f5794e7abdd5f01633f7"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-7.tsx",
      "before": null,
      "after": "6c7e1f231483ea89c4c99c68945414e07d31da6e5c9cee7b07fccedcaad0eee0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/popuptrigger-8.tsx",
      "before": null,
      "after": "fa4ae67294879920cc1611f402ee1117594643d674d11188a3b946487ab81bde"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-1.tsx",
      "before": null,
      "after": "ba01d10d91b3e40f8e26039988d1abd1bae4805111c0922ad734b49c02b61f62"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-2.tsx",
      "before": null,
      "after": "4f97ca2d93edc520c9bd5db178cc6eb5d02258cbae1740c5b78ed78ade6748a0"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-3.tsx",
      "before": null,
      "after": "0d31251f8d6b59468e5e2b230e91b727a61cf8dc514f103a6c12c6fd2c261cab"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-4.tsx",
      "before": null,
      "after": "f488420f157cda852785457e3e88bef157d0cd9336282093b24f8483ce36e6f1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-5.tsx",
      "before": null,
      "after": "2a990d4b4bcde1e9da10f2957c1047e52420c62e364235ca6c2a332ce14172c2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/selectgroup-6.tsx",
      "before": null,
      "after": "e905878848ad47b6845d94c9cdf662930a5ecd7cd8137989610f78986c3ce9ba"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-1.tsx",
      "before": null,
      "after": "51b176826e78fe482b2e250a330559d8571621581685d0dddc17fef983215671"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-2.tsx",
      "before": null,
      "after": "c759f6ad92d9139013ed9c88bd23f8cc84793f85b4a79c6017e66640f02f8b54"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-3.tsx",
      "before": null,
      "after": "697c50f8a9cc81ca5da0c887fd85de7d6a5353f9b9c5418905224e48c8675914"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-4.tsx",
      "before": null,
      "after": "ee7afded8fac73fffea23dd85376910fe835db0e908411a4b053fcb61705ad88"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/sidepanel-5.tsx",
      "before": null,
      "after": "bffe42f11621c171fd86e7b99475e7d534f2b44d4b7431021d379df075eb3eff"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/stepper-1.tsx",
      "before": null,
      "after": "9e7d435aeb9138a3f4e718a4a1fa8d64bc7d08a304596fc11a1b4d7d82311e86"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/stepper-2.tsx",
      "before": null,
      "after": "ed4904d0991a76ebc4180e0d803d7aaf7907cc713a2044896644c4bfd810db94"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/stepper-3.tsx",
      "before": null,
      "after": "dec7086ff0801763bb39a1434340cf5f5c4e96faf0873a9ea001140afcaabe63"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-1.tsx",
      "before": null,
      "after": "c1a4ec067807d330bb5d7a2976b27cd73d2b81d313605d79a4a1fbf8a02b7e9a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-2.tsx",
      "before": null,
      "after": "0844991cd13f3e838df2b990acd58544e71402d12cd1bd2e4bb273fbc1345616"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-3.tsx",
      "before": null,
      "after": "78097606cacaeb524d48ebdf284b8e064c27518573cdec872572ae7ab5516fc3"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-4.tsx",
      "before": null,
      "after": "fb6e2d5548509129cd08ef1cf551cbf29c287055bf563313f2b8b4c02580de30"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-5.tsx",
      "before": null,
      "after": "842805042ce6b34295bae8a5383bbf8bbca341f6d665fdeb44027f030077e212"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/textarea-6.tsx",
      "before": null,
      "after": "2e0bbf86d507e09b3d56d5c1279137a2f6f16bde57ca6592d076ded99377d6fa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-1.tsx",
      "before": null,
      "after": "e01a867d17b73502e11df9d222b9f1272b35c0fbea4797a2616b78217fb698c4"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-2.tsx",
      "before": null,
      "after": "e481dd373d3ea1f3f72b439250f411b443b3a6a69b816b35e5aa4f502cbea773"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-3.tsx",
      "before": null,
      "after": "fe441fefd2e3e50cd8a6e9d23f4d7e2213e8a567513478a3b31570b78bdaf45e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-4.tsx",
      "before": null,
      "after": "7b2fdc749afd7cb1c932010e8239dc88dc5c6f0f0f82e2ec074248a70e3f016e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-5.tsx",
      "before": null,
      "after": "75bf5e67f1c23ee90a95bb963506f04358d2bd833f970b79b8c7360f5336b665"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timeselectinput-6.tsx",
      "before": null,
      "after": "1a1f7410e28343da3de895658952e1c5986aebfbce42c3a2de7965a5a25f695a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-1.tsx",
      "before": null,
      "after": "29d5a20889a098334c11f79a6434f8c5a81b9aad5d996ac112c74149f4f9ff51"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-2.tsx",
      "before": null,
      "after": "abc85932344938d40f2e5375329eeb5cc4047e7484a115d0d9e4eaac689ddf02"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-3.tsx",
      "before": null,
      "after": "9acb927a0aa0f4c1821c2c4119e35f0343d1fc41c86d4ef6d0978158ada2f448"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/timezonedropdown-4.tsx",
      "before": null,
      "after": "5c2e7fd22d48bf98ee145d03cb7350bffe7ed4f768d1d12e6d2d0704f2a0b8a9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-1.tsx",
      "before": null,
      "after": "ba68bd4df6055404842b2e15170c73aa840bcf41a4b5d79109cd77648abb0af1"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-2.tsx",
      "before": null,
      "after": "2bc0362db6fc57eda63636bb1d5f0d4bf574be5d3c709548acf5386507139b4e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-3.tsx",
      "before": null,
      "after": "4a4c93329123f029952a209248f50531233c5185e5931b679f49a48ef6d442d9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-4.tsx",
      "before": null,
      "after": "665139a9ac28d83df8162f69727061420e64a9de1bc8fcf500c5b7bb0f570466"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-5.tsx",
      "before": null,
      "after": "894f7886da2cf6aa2a68c92f2b6a9d805d52c47cd533f3a585b0e8a4a0fff10d"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/toolbarwrapper-6.tsx",
      "before": null,
      "after": "29119523a1ef952673eb4474353709e2661e2dafb7905c2bde1c46995dfa37e2"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-1.tsx",
      "before": null,
      "after": "7d9174378febca9e565775b84d75cea6c96b72466e660a8ccef6e6ec22389daa"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-10.tsx",
      "before": null,
      "after": "e0e7858f80cd6af0457aaf07df3bc17825435f4230e400e6b44b0be93fc41bfd"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-11.tsx",
      "before": null,
      "after": "20b6af39cb9902d379944fac023febf3d6bd0f4def97b4a38402442e93adca15"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-2.tsx",
      "before": null,
      "after": "7da14ae653d7dc469bc9d23a200182bad060212e4b84e43632fb96053bcf5d5b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-3.tsx",
      "before": null,
      "after": "a06f986d9789e317328d1d2ccd67a36dc6c4eff34082abc49811afb0e7733fca"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-4.tsx",
      "before": null,
      "after": "24d8cf7651a842ac25a72c0301d0439b8a97e8c3200fced818030368664ea82b"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-5.tsx",
      "before": null,
      "after": "fde5d68746c307c5c7099cd5e555bc1e5cb81a0549dc1ad57d3468e03b5410b9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-6.tsx",
      "before": null,
      "after": "b53cc6eb30032c388dc20ba810296c9b884ffef3f5f94cd12e24be09385770eb"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-7.tsx",
      "before": null,
      "after": "6354ed872f0218b0577ffce91ce6c7a087869ae02f18e8bf795e8f6f43457104"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-8.tsx",
      "before": null,
      "after": "0915967f59d17445116c91ce3961328a8ac3f375ca26f4c0bfaf4b2d7a0af683"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/typography-9.tsx",
      "before": null,
      "after": "56cf4b04dc63653cee36541d60b17402c34615049629b1f472cd1291bd7c0723"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-1.tsx",
      "before": null,
      "after": "0b24e638245435d7d99a6e65e94f19093e52b5ccff2a50d7168cf7f44a778405"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-2.tsx",
      "before": null,
      "after": "2a2df558fbe874a5b6f077024693ec4b1416e2ae1f7e85d51593176482897ede"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-3.tsx",
      "before": null,
      "after": "df33f30f0c883dc3c58ebcfd955f1f6253980e1baec09fe49fdd16982ae2c048"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-4.tsx",
      "before": null,
      "after": "5a2135f6e231770dfd651b02500ef5601bee1b269f4cd3500b06aedabddf4f8a"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-5.tsx",
      "before": null,
      "after": "391b2e4d03dd5e2d6f02f7635ac195a8b47d94f3ed69066f7d7670caf2f0b75e"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-6.tsx",
      "before": null,
      "after": "ceda1c4401c63a6822f69e49d82026405f28675017c23a992177aff667e1fad9"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/extensions/uploadfile-7.tsx",
      "before": null,
      "after": "e013560843d1b2e7430682d74a4452a2350c70bc6072f5481270e2c72de76db6"
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/apppage-1.tsx",
      "before": "3161fb157d5fcb011ca6761d6fc8cb15775d5d3c76372cc8d25a6addd8ebd0ae",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/apppage-2.tsx",
      "before": "274a470b3666a971363eb8498eeebb8b3dcbe79e5fa6f0e4a777d7b3654cda09",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/apppage-3.tsx",
      "before": "44178599e2c5e651a7de1c5cd9970a9250a4b604578a451de220ba8762ad4c25",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/apppage-4.tsx",
      "before": "9ae7d5c158e846724f9919254f05301557200ec131f02e6baa35b03156450025",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/apppage-5.tsx",
      "before": "47962a2e1ab1dd328268f870a5eee6c3d150f69276c72adfb3f228c3689578c1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/apppage-6.tsx",
      "before": "739d7efc4f1c8fbce2b997a46810edcfe2da65cc2a3eb97a6f9c79faa64c15cd",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/badge-1.tsx",
      "before": "e1450e50bf8aa4e9d342c93f3dc92c2dbcdbbd04ea012178529c68b094786bf3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/badge-2.tsx",
      "before": "86c76c9e3e6379260b5fa27683114c8cc55b6d66b13877572e3b7697c85e8f3f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/badge-3.tsx",
      "before": "4446c39cf5fc79689f2a5326135f0172053ed141366b926d919f5ca239085170",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/badge-4.tsx",
      "before": "a164b7a0fdecbf490738830c038ed056a1d30a05e6fa14f016ce3fe09b91fd74",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/badge-5.tsx",
      "before": "b1e38263c0ea0d62b55ac6adb3ba634bdc3345892de03da9cfb396b84a2bcbc8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/badge-6.tsx",
      "before": "7d23d9fd101958479c26a636d4e6e08b792813ecb26357be4cc6658e8db3ad6a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-1.tsx",
      "before": "3cf3ba5ab6f8299d8cfde3d1db370e75354536ae489775181e71440ed646c005",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-10.tsx",
      "before": "94395d87e9bce23fd765aeb212bb8ab7cc782d2203302593ec6f89e0867c1400",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-11.tsx",
      "before": "9e632ad3f9861ea9e05728f78b0b92785e30ba6381038a92da48215ec9aae174",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-12.tsx",
      "before": "d933dd1a5a4f057307124593a5097103288e8b540eb170a8371585c20a5b0fde",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-13.tsx",
      "before": "9783120071eabdc6d93b7bc6fc075682dc52073cf711da31c0664ac9ed463b3e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-2.tsx",
      "before": "6edb19298c70d8f8fd9479942df80978751990c910e3add94559b09dc407ebcb",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-3.tsx",
      "before": "0b8c0fe5b85150321c4ccd11cb97068c8d6b356140740ee7e714df5238b6335a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-4.tsx",
      "before": "3f344c9f78c5676914a728a23fadc16a910b6bc25002569872a28c7ce1abdf18",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-5.tsx",
      "before": "eeee5ec78348281d783902dadd7690bcafa8c2fcef1658a2d37371edd586e21f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-6.tsx",
      "before": "21f0ed488275b3ca691cf578f58c29e926407d9f9b234d6e7fcaa2bdf6e415ff",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-7.tsx",
      "before": "2046039d2869411c47f92b4dcd6025528bc8fa48fecfdce56942cbe953692e1d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-8.tsx",
      "before": "36c11d53383bec8302ce893ff593757640c9569260c57602b677f79605017f8c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/basictable-9.tsx",
      "before": "d68b2eff6d800cbc74cb4b394752c8a599fd5be48b62a1c0f932847c24e78723",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-1.tsx",
      "before": "3e65347372fb44303803578b113b60484827280c05fa7d2baaf0bc980b4add42",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-2.tsx",
      "before": "c3a1efb9e52c19f4f488f1c360abbe2866c30b2033c025dcfc9fec495395be81",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-3.tsx",
      "before": "c0c5daf83ac0154f126406f1fd4a4ac2c6a02f45039e888b6a351dae9179b90b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-4.tsx",
      "before": "363b08cef82a853e979b9d862189e13c3ca99be4158c5126982eb0c7d9322ef2",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-5.tsx",
      "before": "9619e1aa75d7fbccdea1c4f3f6da5bd0ff5f8202496c79a16bc0657bf9ddcc55",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-6.tsx",
      "before": "3679d2d551b7507cac08d60133aa96dc729a0c7cb485fb9955d460ca72060af1",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-7.tsx",
      "before": "adf9fc4655ecdc520cc480c7fbdbed406b5f9d911db44c5bdf74fa006e76553a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-8.tsx",
      "before": "917e919372818c7c197e6a22f5572d9c1d0b79be459e9903355114f84f1c3d2e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/button-9.tsx",
      "before": "ec1180099ac43073017841f0062ee410c4447f90726c60832e4b91477413b127",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/card-1.tsx",
      "before": "2b60076a921caa30d9f47663edf7ed438be256c12c9d824858015b570578b3af",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/card-2.tsx",
      "before": "70cd1b7d64c82359c4c2310d938b55eeb0065abdd33af63f01dbb7834230a7ca",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/card-3.tsx",
      "before": "a5a62ea93ae67e670d5ace1c20e35dc975cc0d404c4a355406e3f65442819b39",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/card-4.tsx",
      "before": "682400c2303e49fb4e62df95f844768d918d5c5897d07e9bc3011f7a94ab957e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-1.tsx",
      "before": "9a18f2217370153eb605fb7bc1517aac84b46ab7c2c31d0005ab137873457d50",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-2.tsx",
      "before": "4ef5e73c46a9c3b6d3f57c5d69ea3eab0774db555926a039378542e7fcce7dc3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-3.tsx",
      "before": "25ad2909c1a4fca1f9eabb1e78260200ed1ec6614bc5667c7a9ea8717d12b5a8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-4.tsx",
      "before": "f2f21b819eb63af9d6a63a2e23a6710bd7aa988abb7bf08e9da1511167c1f448",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-5.tsx",
      "before": "b5c2854b2206c0ca02b13c91c274e369dae83b418a5d8d73c7801d87994fd1f9",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-6.tsx",
      "before": "8cf1db66384381f3215230d5a1c68137370605d82f419273facc6616367cf837",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/chipgroup-7.tsx",
      "before": "ed187741b0eb227c3390436dcdf1a1b14b162b6ba30fe8e93d83ca31638ba371",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/choice-1.tsx",
      "before": "127da3ac10c351c056c6e7b33b4e52d09d91d5fe32f9c45d94ab722134655b76",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/choice-2.tsx",
      "before": "f755941412bab5c825eb0809287ed48b3d7680fd83723e51e972c16e9553b2f7",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/choice-3.tsx",
      "before": "458a63be3a1e6147cb997e235238b40841b979dc6fd258266735123495ca127e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/choice-4.tsx",
      "before": "2f41258d536020acca5cfa4fa0baa8453045050deba2cc22b4909ed455ebe209",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/choice-5.tsx",
      "before": "b892da1c373c63f07b2d279413e85148d0aff35265d8ddac3eb745a84e852ce9",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-1.tsx",
      "before": "ad3aa08b1b5953f5b8c3ddf2b1537313656d351f9f0b5c4558d6975bfdcf3b2c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-2.tsx",
      "before": "2511b863114009841816e6f2982c99afa0a5ba48eae8df69f752e8b64deb2377",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-3.tsx",
      "before": "b2a0da845372986bc47161186aa3beaebbc9662b9e4b4ff6ba783e4bf571ba22",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-4.tsx",
      "before": "93f24cb082796b0ed6777b9fffe88d25e7dfe4a3658a56de046803196b2820c5",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-5.tsx",
      "before": "4759deaa9d183455b864cf3d7f09c2a504c02a55da0ddb7011c3eb11b3123ac4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-6.tsx",
      "before": "5c5602eec5357ff2cf27c15085562f422a2207f1ceee45c70a7dbd920a04d771",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/collapse-7.tsx",
      "before": "38c7c87738cf533d0799cacd0015cb4136dd501cd310689f77e483bee78af937",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/confirmmodal-1.tsx",
      "before": "0b617cf18f6f62f5278b70bef2b102352e1294ecc62f2321fcd2c5149fadc785",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/confirmmodal-2.tsx",
      "before": "a4c21169ed7623fb6f1c0f4f581e026901b575908ab36e1dcae5e2da12569230",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/confirmmodal-3.tsx",
      "before": "34b38e0d9aac63b5e0945bc7429b99d835a1bcb57dc4e7047665122bb72cf80f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/confirmmodal-4.tsx",
      "before": "1484b8603013a5c33f9ea497257f3e56a4c6f7cdcb49ee03935d996156bffacd",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-1.tsx",
      "before": "0c48b29cf5211fa4c58b4b81f884dc816f4cd0e486723d0c425f28c0c569dc16",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-10.tsx",
      "before": "aa86303cc1081ce845e6f2a1c4aebc19e0d454c421e036bc305a5bcad6279500",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-11.tsx",
      "before": "6d799788a3b3e0a6a064926728f19493b4eda0a977e4a5cc4a3153b667c33f99",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-12.tsx",
      "before": "830255747ba39d4e5fd3c9f102bb2b78979b1c3c14e23146a0e8ebfcb8aefdf8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-2.tsx",
      "before": "f138509dc7855dc41fd7b007c38abcbe97207d730a749109111e90e6130b005b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-3.tsx",
      "before": "3af1a60cc21c95bbb3fbe75f002f6bd3b601b373db87501a4be2cd40a7d08b53",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-4.tsx",
      "before": "1fd351b9bf3b37807b6f870c359b7477f3e2a1a74a1c3380a29df52856d4770c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-5.tsx",
      "before": "2b3a20f8cfa426a89abe333cccb25aefeed29e70806bc74ff63d4b293911b14a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-6.tsx",
      "before": "709076c3f5f59703fc9a1d775595058bb73cb88b6765ed5424ffc0e81534fc22",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-7.tsx",
      "before": "cbea6acb71018751adc2673877c3115402734e44b148df8a5627e33ccce030b2",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-8.tsx",
      "before": "e307f8bf678ff761fdc8427d0ed7d540d7eaf774b4cf27e4b0ee2adfdb9a8aab",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datepicker-9.tsx",
      "before": "c9e0f47d6bc7fc5abfb02004aa0df9aa995e6a563a0b6143a1b93a9be936f3f9",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-1.tsx",
      "before": "1bf8b882f61c7597738ecccb5756a6c917d924e2085cdfdd71f74f4f247b0520",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-10.tsx",
      "before": "6ffd41ef4f6e886164c85f525a7aa3c5bf44dead8893ae7659988f82968983a9",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-11.tsx",
      "before": "878058fc2de49b383152104810b9c332115aa2e52b30166c39c58ea66c0df176",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-12.tsx",
      "before": "d3d92c4de6ddab2223deddaab15beacc8dfe0f3b7d95fc61319d01fc95acb60c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-13.tsx",
      "before": "c8b66cefe648c7561dfc37ca933189c67e762be49b4a2935bc1ec169901b9da7",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-2.tsx",
      "before": "1652c3dc41ca5e4c0f42c9958a878bafce0b600150e9e80e14910f1aa508ce57",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-3.tsx",
      "before": "1e87c4c2e91e5b8c1b0e324558a8625938f664140fc110b69e01a36e4320e981",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-4.tsx",
      "before": "9170b03c2a892b1c6badd9bbdbba89f6aafea025c0aebfae90d39fddcbc6603c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-5.tsx",
      "before": "005097c602bae8fbb815b4e9f1ff9bc6e1ab2e48a22fc516d1f1464a26cdd91c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-6.tsx",
      "before": "6941e2dd836eebc461399ac9491bab450eb438cb80a9dc23d57d3e4690d76b00",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-7.tsx",
      "before": "ae18884191b9bbc3470a69e69e35e686a5f32b81d7c96d8031b5cfc27230c308",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-8.tsx",
      "before": "b5d3ed51fe2ccadd7f7f05185e85524e458b39ad4659c62a11472f7a3949379c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/daterangepicker-9.tsx",
      "before": "e81a0910508c6cebef52aff23edfe7ed13b0c38a079b618bc9e3afeb315e0ae3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-1.tsx",
      "before": "39a0c256ee172149d0d6f1cf56d81ddf695937e27439316455aa570a9ec9c877",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-10.tsx",
      "before": "2ada05e6c5ce1c406008be0da9eaccbb64d78e21831bb17904354e5de2099b42",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-11.tsx",
      "before": "2002ab9da4abf7159ac5d98d0be12d71ba7ace4af221e6df591ebaf4ef1d0c74",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-12.tsx",
      "before": "26682e44f8fbbfab87a9e957f36b2e26a4184743b8ae236a2d7f238ee98db663",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-13.tsx",
      "before": "ced027902e93fb49539072edf82569a11af86b05f67d950e7c6da22b922e2aea",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-14.tsx",
      "before": "d188fd434061638ddf483ac372de68720c01a5d4bf4f4402ffce7504ef0ef575",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-2.tsx",
      "before": "fe4e8f78a4b6d360c97ff7c8e7ad53900822f4e035ce2061f24ac131c88c3bb9",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-3.tsx",
      "before": "735bdd964fb748255a5b008946b449a90d101cda3c97dce3f3c448b210c6876b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-4.tsx",
      "before": "384bad633aef04783bc8a8c34cdeeba501f56310c1c6b1ad427592af913c6312",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-5.tsx",
      "before": "96cdfb31aa3df5879b7980bc16dfb6823888688ba21cc99dd9c669f4f4e6ac42",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-6.tsx",
      "before": "173ca602ceef90e1f7de6237f934daf943dae3d744773fd0283b3127011c287d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-7.tsx",
      "before": "3658bb4116a25234f1a588d3a60f2341dd3b2b056b004d06a511bdcdc33d145f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-8.tsx",
      "before": "fac0870c469d32b98356c7460e1ab7ca7ff62aba3e9eb654b58e524f7c32822d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/datetimepicker-9.tsx",
      "before": "524b7bae06e9615695a3fee36f526cb63b27c0b8de46287b36aebd176b1f5455",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dialog-1.tsx",
      "before": "531577cf7b621ece1433e38246e06c29e5ba4403c1962527246c3e1cf33c1e34",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dialog-2.tsx",
      "before": "9925dbe09b90988a722580a5d34da4717be60e15013cbdb9a8ce99571311eaad",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dialog-3.tsx",
      "before": "0f2829ae3877cf817e9f66f04232a9110481339b6939bae5c389a205a20bea24",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dialog-4.tsx",
      "before": "796c80aa0cfa07df3630b7dcb184248c5279408b42d3733a446427099d56c7d8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dialog-5.tsx",
      "before": "c1801e33cd0e34b23076a3ea7f0a4202c034ce48fd5566849f343c3f4d31753d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dialog-6.tsx",
      "before": "96eac71ac2f4ca5b2a93b4d3fa9e872b94f18ff785db0e9889cfc188b987ab5c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-1.tsx",
      "before": "ac545222b1020de84a423a391e861ab795586abb8bc5515ccf2153f48f5d941c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-2.tsx",
      "before": "af832cc0ed98281955fab558e5230b8e078b6f0e8cd141498853ed7f5571310a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-3.tsx",
      "before": "f37a7660401864fe5d85f23734f0a72ed89003296b6d3c42012ac20ffb1d7997",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-4.tsx",
      "before": "ea2bc8e5d4608c0604387873a72ad2c6c2ae88806b2ff00d84260c238588ba6e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-5.tsx",
      "before": "2da178d1319629ad52ed36def9eed03f65c7578cf4c40595d196f98b01e3d6ce",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-6.tsx",
      "before": "f1cd9cbda0101f5e94c5a6c895d24a033e517d78400ba182a30c64ba69668163",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/dropdown-7.tsx",
      "before": "3e648946a75b00a574f4c89cd3ce7a469cd7d4cf70e6d066c2e64c05a1896e23",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/filtertoolbar-1.tsx",
      "before": "0b6d63d6fdfd18291892f905dd37796295670c7b905bb5e2468cb0cdd6259f38",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/filtertoolbar-2.tsx",
      "before": "36337e5f92bfedd831f2d6c1599faa5411bf776b3d459ad76a4f19d1c4b74a12",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/filtertoolbar-3.tsx",
      "before": "841bd1d4af7ec1c9fbe50f5989fb0d267ada815b40d5d013dcebd3a1abb8e338",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/filtertoolbar-4.tsx",
      "before": "fcc4a8e6ab25ebfd1bfb7523d0704f03687a49b931a4a73e4f5b7593f173bdea",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/filtertoolbar-5.tsx",
      "before": "eb5fbb5aba9bedfeba892507d2d68fad5a30f2ffd469ea0e78dc9813ff15f8ff",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/formfield-1.tsx",
      "before": "7299043871acfa7db44bb7244bc48d924c87cab23ff20396be9058f3bfdde30b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/formfield-2.tsx",
      "before": "3e49361dcf285f3dc9431b089d6c57e19b93360edb2794b93f194c02ab384939",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/formfield-3.tsx",
      "before": "bfa3fceb88ac9571aabea6691e953baa3d467b8573e67d00da68d51de6d25969",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/formfield-4.tsx",
      "before": "f256c8ee16922882e5195671186c922093812bb0bfcaf30927912064d958f805",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/formfield-5.tsx",
      "before": "c02b1d758f6383c8d5d63b78d30d0bdad036be8306485ef3e83ffef21db8eee6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/input-1.tsx",
      "before": "74dc42bd25a33556c3822394db6d84a008e042e74e6096da1f999212b68bf41f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/input-2.tsx",
      "before": "71ff988028c1f2ae9f36b15819a209e3b9ce711dd364d92103c88848c314bf7a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/input-3.tsx",
      "before": "6d7717046414ae15639d5fd85d6a220b88a809b82d648ebe22ad0afbc44086f8",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/input-4.tsx",
      "before": "e7eebd7fb0da54190a839d9b2bbfa48898a5fc83036e2931c2522bab42269e70",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/input-5.tsx",
      "before": "3275b368463b1836e74c7b17fa2244f201804215c628d115a157e3fa6c83d5f4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/input-6.tsx",
      "before": "21a536180196137762701b8cae82eb1e314b84a50372dcc33bc22b49ad001537",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/interactivemessage-1.tsx",
      "before": "c1f2e6c4536236631770691b6658f04eecd51f0410d47e03a0ee340a179157c4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/interactivemessage-2.tsx",
      "before": "30867f015d3358362c090432546443533f1cd13e71ea55715c1d252ab5b1ed90",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/interactivemessage-3.tsx",
      "before": "693a20131d43bfe07557058b3bde95bba9c10548acc2c2747ea6fd786bac159f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/interactivemessage-4.tsx",
      "before": "acbd5c03e5a26bc31851b9f9e06c5c871db896a7cf6697410af83a926d0655c6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/interactivemessage-5.tsx",
      "before": "22a9886029b33c0c8dbcf1489b96a0b6dc48422a8131758a0e1b8d7baeb2e38a",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/interactivemessage-6.tsx",
      "before": "8157b2325e07e1c7a8b0434575aae4f9d9007bd5b637f8b0d8372326f76445f3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-1.tsx",
      "before": "e0a9c8023717bbe1d6fd411ab5bfc86c51b757eb08c6716e5755dd46981530de",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-2.tsx",
      "before": "e06d78b0409e3f83e5b6d7b5154ab4d7c013e1c38a7a99b9d3717ff6d2daceff",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-3.tsx",
      "before": "a7cd12318f76d8c2f0d3171c21b622e743fd3af170cf9f5c078e572d1ab3d863",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-4.tsx",
      "before": "e7b7a040acc8f9150cf76841de46fb78d94647182356f5228ac81433185efaec",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-5.tsx",
      "before": "d73edfdfe016cde53a5e83b4ea126461820ea10dc9da969f9757110ebd85f475",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-6.tsx",
      "before": "1ed006d5fa9c13d450bd881fc07b6b48ae4749517f7332cc8b670c612b08a144",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/multidropdown-7.tsx",
      "before": "17fa86836eb3434cd7c2a02a3b2fa14ea3c9bf6fbb736707b1709153107dc012",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-1.tsx",
      "before": "ba313ce1971676d3dbf699ff3e2ecbfc2c7f886ddf83cb0a75d69a80c0136d43",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-2.tsx",
      "before": "78f055cfd375d1e8b6dc2f95facd806415c9c448a91206a1e429e6466ae364c6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-3.tsx",
      "before": "5668e148502ff40ce695105fd702d61a770804f015c40abcdc263838374ffd42",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-4.tsx",
      "before": "e28a7ed9b30255a177e60be121719b9931b7fc9aad1d9a6a6a8a41125b3f1000",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-5.tsx",
      "before": "adebf0758a99273dffa31d78991950c406e9e87c8d00dbf3bd3624b8fdf1c7f0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-6.tsx",
      "before": "662a4f58674521a58d1ca019d4402c185e9c80888c3e66870506342e39e8e423",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-7.tsx",
      "before": "323243b4b01e2a619042f27cc490b3a1e0948519753df38831ab3622d50bc3d4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/popuptrigger-8.tsx",
      "before": "9ddc8021599745a50be809f7b0b38e31b8ccebc406265747d8a2e5f036bf756c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/selectgroup-1.tsx",
      "before": "f3da1d9d5644dedd9aa9308b5fb12c1f28b42428c3ae411d3dfc7f5db96b335f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/selectgroup-2.tsx",
      "before": "c7c191fbfda7c08e4e808c6eb1c3fff8c28fc112703d44541041e2a57f900eac",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/selectgroup-3.tsx",
      "before": "17e0e20dda36caaecde1637cb398959232b21015c2c5ca1652d9d81028c19bf4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/selectgroup-4.tsx",
      "before": "60cdcf25a448db4f444c39e004967004d7a61ebe61882431d31c26594fdb97f0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/selectgroup-5.tsx",
      "before": "4bbd6bf9cb0cf75dd8e9af78e1522e684b7e6953594447cd7d18cc2c9bfb8f23",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/selectgroup-6.tsx",
      "before": "a07e30eb05792832f2b437b843eef28aa41ae0f83f2eced79a33dfe0de6de38b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/sidepanel-1.tsx",
      "before": "e040fcc3eebe1474cc2aa541606f899d461595e4354a9b6ef152ae687b840dc6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/sidepanel-2.tsx",
      "before": "571238af506e0e6eb43d95170c6acd5a385295aa6fceacd06dd75f2d3c5ece7c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/sidepanel-3.tsx",
      "before": "b06b7a08028d4fb5eb1da3e8fd7e29b1d165768b3b99d7426760fc36c0a4884c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/sidepanel-4.tsx",
      "before": "f16ad05417340227730e82b974b8b1ceb90c8d94fe4efa15f9e451f6961b35d3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/sidepanel-5.tsx",
      "before": "d3e120f832fae171a66e06667b2b19283131fd279d4b2464b01c4894e1ca91b9",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/stepper-1.tsx",
      "before": "aee012991532c3da0e742574427366877912d170bcafbb186d5591d71805b2fb",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/stepper-2.tsx",
      "before": "2868ac359da2a91285fa72d5f6f05d473b7abd8789b1945241bc40af3e65d1a6",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/stepper-3.tsx",
      "before": "80003b5b9f07bbd85d4a7392b2d32e722dbb746a4ade6c352ecf6b57c73122a0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/textarea-1.tsx",
      "before": "f1ca4e263de661b6e1840dca349c2ff8ad2ddccb5d5bc740242c3c4904643baa",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/textarea-2.tsx",
      "before": "2e1d86f1538151212a2b344d532c23c3f9b920bf83a560a0fc45296324f0bde0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/textarea-3.tsx",
      "before": "c748d634670702311976dec8a5c14df45f219a904e658dc04fdaf21024df123e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/textarea-4.tsx",
      "before": "c823bb55ca799ae20e7751f45143bcf2d6f7698baf0815c3586b02427b33b938",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/textarea-5.tsx",
      "before": "f6ecd479305d2147e25a350d50de1dee0c83aa78e1f102cdb53da621abe57117",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/textarea-6.tsx",
      "before": "73c2f61d09b5153df995d877fd2179a325ad7fbb807493587bfd6d2ce89c4d16",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timeselectinput-1.tsx",
      "before": "04eee70a09a9edd9916cefaacc3d281819abb14c155e348b5caacfeb9084e588",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timeselectinput-2.tsx",
      "before": "08d15b5b3f3eca462e19f3eef0ac95399444a0979f60573d3e7ad8908d71ddf4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timeselectinput-3.tsx",
      "before": "b2488b24c934bbb75761a29a7cd36a78c8154cd11e4377389ea215992667c894",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timeselectinput-4.tsx",
      "before": "1c39fb616993e98f04dd795ee50a2102426e43f1087fddd7219f6927fabde26f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timeselectinput-5.tsx",
      "before": "bb0b4c0dc67934796ad675248307367f9b78eb3108ba72f25a298f291593596d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timeselectinput-6.tsx",
      "before": "e284940500294c5f50ef63ad624b45eff84061eab1284c1407b217110747be60",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timezonedropdown-1.tsx",
      "before": "0d61403a52d9cc1eb25c8c2f7d1985777faa157dce42b3ca46d00ca2c6dab291",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timezonedropdown-2.tsx",
      "before": "346f64eff6e143488070591806ea17067add9c3ce272ffe9555dae58f0bb5326",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timezonedropdown-3.tsx",
      "before": "dbc3d9799f40840b91b0c7ff04e610337aca84379dee35ab04284882ffa68601",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/timezonedropdown-4.tsx",
      "before": "f84250d8e8ab088bc4813934adae7122dfe5d20682704209a3edda4240b44c43",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/toolbarwrapper-1.tsx",
      "before": "eb95eed3d5c53874f31d63129482b835bbaa3d1cab0172bd5ba40b4056fb4ec2",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/toolbarwrapper-2.tsx",
      "before": "00b626571bab473350e72ef848667d94ec34291168dc7af50207dc597044d900",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/toolbarwrapper-3.tsx",
      "before": "9cf667e0a7f3efc460ecd7594757dd712a21de8f350511dcdf888500184cf10f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/toolbarwrapper-4.tsx",
      "before": "6b16d688af9990602268fbf6f8f7b03e7e2e4dacd4c056c6c98a2f65b142392b",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/toolbarwrapper-5.tsx",
      "before": "9b16830b9442a92fbf50dc1dd3c1ca85d65a7e77eb2f4ca50b156aeb8b215bb0",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/toolbarwrapper-6.tsx",
      "before": "e40d4f08f446c0ae6460069cb57869a8ce7ec35eb518eb2259d32917ef236a64",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-1.tsx",
      "before": "cdd6cb6385ba1a148b6c771af9f5c1f06a351e7587cfdfe29e707f9705b75da4",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-10.tsx",
      "before": "e2ab873ac7096003c12e8c03d89a1cbbcf830419fa4564d88dbd1d84366d5034",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-11.tsx",
      "before": "b7166cb171dc0dac126103784bf41f1de746511248625879b031841d4488643f",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-2.tsx",
      "before": "682ad254ebabe5c63d51a4d148951ee4d3141ddfbb6dd4abac097c48d8a82a85",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-3.tsx",
      "before": "8f3444376f668539d54e1c1d13dff8c3283408a48c0bbf5498f663defd952023",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-4.tsx",
      "before": "100eecea12b172304c00a75ffc7f67574a0692805481897677cc50a01c051101",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-5.tsx",
      "before": "2580515c919832e982cf3daf2017306645b516cd6942393fec9f27f2cd441b8d",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-6.tsx",
      "before": "ca156f3a55b7c953cf2e0a2c8f7c7d0e07b189f0e6ccfe3e7ce294e4fc1db113",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-7.tsx",
      "before": "aa18973369285a3c0753b192722e6b7d13997d4757bcd00bfdbe2d457c8e88f5",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-8.tsx",
      "before": "6c02df0f97ac501aad677c9441780a303dfc96cfcde0b4b2d867f29589caa3de",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/typography-9.tsx",
      "before": "c6204bae73601371eef14a60c9174720cbd9e59c298c7498b891c5aa7e204c32",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-1.tsx",
      "before": "4263efd5d7103a9f5a0b37aa463196f4327e3fbb6f68704b7ad5cb5d1c1f1383",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-2.tsx",
      "before": "b99df7baba82d559425ac599ea5835ac1cabbd239c510ab6db1152a17bb21f86",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-3.tsx",
      "before": "1ec5778f8ada74b8fe6fbab5af24838336f74107fb4effe93d93dd3d4dde139e",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-4.tsx",
      "before": "1b34f586e4805226b6b92fa64232cb82789c7d478003e996fc71d24dcb6291ec",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-5.tsx",
      "before": "4c3858bb55a207567a1d400653de47af9cfff9ec2b76442749a05c2e26a96080",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-6.tsx",
      "before": "5d3984c14e0f4c346273a0f7d9fbef47482e93ca944c1b8e96375b4a33aa780c",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/examples/wfm/uploadfile-7.tsx",
      "before": "83805ffad3e657ba7312ae2b809d07c098bdce4f2be86e647b9a22831efeb617",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "a324ce4c4aefc0e9555a5d3568109d743fbbb0a10ee8799ffc21989c764e6e16",
      "after": "5b5a5321a42ebdf79edf86cea5771120f1417ee4618a7e91d5e27d1fb8e10948"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.tsx",
      "before": null,
      "after": "c7559966c669a5786f1ca1fe2ec3d47d2ec7eebd85ca96d3bd4bbea15a969dbf"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/wfm/users-list.tsx",
      "before": "baa98d8750d32ad900d4491c3905cb8735017d262e7016ad5a37081d38934fc3",
      "after": null
    },
    {
      "path": "packages/talkdesk-cobalt/site/astro.config.mjs",
      "before": "0472c82cf2d582b258a668bea8509179b19212a646dee12338096f001f521ab8",
      "after": "790e5ff19d84faff32a185de8613c908b744e8fdf7e7fe3f05a0ccf04e898e6c"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/components/Example.astro",
      "before": "d2b2b065f6d5bf27ec3bd8bd3ea6435e41b9a0ad588624f07a91a6081db303f7",
      "after": "426636d3ad73e7e02f4a4ea10b6668504d69fb7159f4e41f3b3e0566b276e857"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/components/Sidebar.astro",
      "before": null,
      "after": "29d9fbb9e7e7586cb1ac461a9202a4e96e9ccd8823f0fe4c1aee7364876e70a3"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/layouts/Page.astro",
      "before": "b12600227d332565f1a63ce80b37d4c7dfaaf7541e1aed3a7496eb1dbf630901",
      "after": "39dbea09c84b7c947d837072632f8fcee3f3b38dcb1aae05ab3fe09db5064988"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/lib/catalog.ts",
      "before": null,
      "after": "d25fb4ed267a46bbc87e15a1709490865a8ef32a30135ce2e17d42a36a6dfd8b"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/index.astro",
      "before": "e4478f60e2636db07c4dac4c2ce9ade21d6882e7166e13666d64f5874dfde392",
      "after": "720dff21342e7ca8161dd029a561638899484b8fd4c33bb97a83d9a8e86ccb8e"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes.astro",
      "before": "5ae09b86159ed66d6b3a16eec8e837f6b84355671b73ece7d7d0f343fe581847",
      "after": "6b963182f8252fafff41ff0975194737eacaf800b3712dae0fc2d409ff61ba87"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes/[id].astro",
      "before": null,
      "after": "f232423148c03f7a89e51c4b91f0f8feef65d3d288089764c6449c1d7a6b4fe1"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/recipes/wfm-users-list.astro",
      "before": null,
      "after": "6724b9fc7e7f85e54f154d2c9b1700f75bb17d6881b1faeddb855abdc7f7ffef"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/reference/[...slug].astro",
      "before": "f3a9d542a3a7f0f28e36af3602ee14b3054700cea113ad7182a6800296e6154a",
      "after": "12a0ebe99b88664adb59af133f4a527a18c8f9cf1e85e219fa9b431b758d675d"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/pages/reference/components/wfm/[slug].astro",
      "before": null,
      "after": "d5b0ce59248174642fad32bdf1798fc1a2f08b742d6b46941ac2d505e9152934"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/scripts/docs-shell.ts",
      "before": null,
      "after": "699079dd1436cb79f32895a5da0b0ad28d4da17add6e762b01b820e7c57917bc"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/styles/content.css",
      "before": null,
      "after": "a115d7f8bcf622d39e8817b4ff1e97d2526cd8b654b2c3410ad2d25e83f1ffb9"
    },
    {
      "path": "packages/talkdesk-cobalt/site/src/styles/shell.css",
      "before": null,
      "after": "f0d065b3cb432cc7adda8579070a614449713a3f9d586e5cf5a49f9e0bc02b67"
    },
    {
      "path": "packages/talkdesk-cobalt/site/tsconfig.json",
      "before": null,
      "after": "fb6a725312b8e867d7d8a444b7a8f9021c7a61f3e1e0b4cdbcb0063488c6d413"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "2e004dac531c9907f179e3d410e0b63519c3fef940cc3206d8612164fef26b14",
      "after": "3aadf0ea9e473123dc125c2e148465e040fff3315d3255c5e3d6c25fe6b70282"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "b1640564d45e24244b5bb97679b430d3198579c3b4e5db321dfac6a16522867d",
      "after": "7313526462050a20ecbe6fdf3811a5b727bad12c09beed2dc87c987b2e139ddc"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "d2d289c1373ee50a8c9b02fdc5b54636a619cadfa8cc00865c2ea24634692749",
      "after": "ffd354a735c12a0acc50fb6c6588dec8409f07cc196696140ff1f525c9204f68"
    },
    {
      "path": "packages/talkdesk-cobalt/test/site-browser.test.mjs",
      "before": "2fbe43e7c9d4863c9113af219fd43cfff34870c74966682fe6f73873ecb929e0",
      "after": "6e554e88b8f4ec73a0ec19d17698fceba7ca1f161fad097db629770f98b8f857"
    },
    {
      "path": "packages/talkdesk-cobalt/test/wfm-upgrade.test.mjs",
      "before": "570f8a8f8a60e89024313e89f6489374ed05b42549e0ddc90ad8b4d25b2b764c",
      "after": "83bdbe3687537d05ec1a37a756b745f917c2095479e69a9fe6ddb7c56f696254"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "edab7af6c406994724f58179f39f0aed4ac5f84d8ec9301c0ef469aba3c1fa67",
      "after": "daadcd0d04317d55b1790bb26ed434a4759285c15ecc24f62b83db7397284f3b"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/component-index.mjs",
      "before": null,
      "after": "f708daabb20462b64579a9fe1e195b4dc1a7b701f8b9d4f288132f4daba78c53"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/content.mjs",
      "before": "e79497c9d029e8e7c055e91b1fc3c165d2f79914c1491fabe83d28e4d572f39f",
      "after": "631f7cd19ed774d43bb036cba4dc61bde71a75668e9b7f204673a03aacae390a"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/export.mjs",
      "before": "d6fdf88bfa0294309db060878ab6588c1e71fa6a8a5a720c8592a328f5ad4fa7",
      "after": "7824e228e745521f4e4805ec0411da1f411e26baa81b739e13228e344d9edb2e"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/import-examples.mjs",
      "before": "839f246754eeeb03bf222b00b85ddde939cb2260503dbcd2d4f38c803e52b24f",
      "after": "019c4bff573816c648d9c7949ccdb61cccbe8c54959b45d3055aec80fb94bf3e"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/site-content.mjs",
      "before": "55690c4dbf578c85f0bfad3ba261ae6214815d020441bed5603035cbd83c4f31",
      "after": "62e962a16b309c0c403f59a76cdc7089f98a06508d9c34165acf8cb872c2da37"
    },
    {
      "path": "tools/check_code_line_cap.py",
      "before": "d6d9d744e782bef4c89f323c5c7b2feb8e73180386676e69f96610ed2efa982d",
      "after": "e77517158c5ad30a6d8f96ec7e760bb11ae3ccdaa9d7cd0cbd7c1de988728224"
    }
  ]
}
```

Completed-At: 2026-11-14T12:56:25.535553+00:00

# Prioritize AI retrieval and verified recipe reuse; compose ListPage from BasicTable and marketplace Toolbar

Record-Version: 2
Task-ID: b4eff3ad-aec2-43f8-a91c-8e5b0bd3679f
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T12:59:11.620197+00:00
Type: feature
Status: complete

## Context

Prioritize AI retrieval and verified recipe reuse; compose ListPage from BasicTable and marketplace Toolbar

## Changes

The AI authoring contract is the primary deliverable: a bounded read-only `cobalt-lookup.mjs` search resolves exact local source/API paths; `AI-INDEX.md` explains selection, path bases and qualification rules. The authoring registry joins 29 extensions, 156 migrated entries/documents, 204 examples and four recipe contracts. Legacy component documentation paths retain their content-relative base while explicit AI paths use the bundle root. Styles remain tool-ID lookups. Source/API duplication is avoided: adapted template pages and their registry narratives point to maintained recipes instead of preserving stale inline code.

Recipe metadata records intent, states, limits and host integration; default exports, package imports and supporting sources are derived from the TSX. Generated projects copy the lookup, rebased registry, integration Markdown, supporting data source and complete local reference content. The original Cobalt registry's failed-example qualifications remain intact. Adapted pages and registry narrative pointers have explicit original hashes and local adaptation records; no upstream checkout changes.

ListPage uses Cobalt Extensions BasicTable for columns, sort controls, table state widgets and pagination. Page state owns filtering, sorting the data, slicing pages and selection. Marketplace Toolbar owns both controls and the reserved 48px filter row. Clearing filters preserves the table top. Search moves below the toolbar at small widths and uses aria-labelledby because the pinned Search overrides aria-label with its query. Host callbacks are optional but disconnected actions are disabled; data and callbacks are prototype-local until connected. Success/loading/empty/error/permission/partial are driven by the host scenario.

The SS plugin keeps its existing runtime entry and public tool surface. Its packaged-helper regression covers the AI index, lookup and ListPage supporting source; README and the existing feature decision record describe these runtime content changes. Other SS public routes, Client UI and cross-unit architecture have no documentation impact.

## Validation

Passed: `bun run docs:build` (306 pages and TS checks); `node --test test/export.test.mjs test/wfm-upgrade.test.mjs` (5 tests); the tests resolve extension/API/recipe docs and sources in the authoring module, exported Skill and generated projects, including supporting files, legacy aliases, lookup search/ID results and all recipe package dependencies. They preserve the old failed-example flags and verify adapted template narratives no longer duplicate stale recipe code.

Passed: `node --test test/site-browser.test.mjs` (4 tests), including 204 examples and four recipes, original documentation navigation/theme controls, and focused ListPage interactions. ListPage evidence covers 48px Toolbar height, child center deviations within 1px, unchanged table top after clearing filters, select-all via real keyboard input, record details, sorting, paging, search, no-match, 360/640/1024/1440 widths and success/loading/empty/error/permission/partial states in dark appearance. Search-label behavior failed before its stable aria-labelledby fix; the final run passes.

Passed: Node runtime Cobalt docs/scaffold/package tests (9 tests); SS packaged helper test; Design plugin and desktop builds; SS doc-check. A fresh project was created using the documented lookup/source integration, installed offline and built. Its real Workspace frame verifies host create/edit/refresh callbacks and top-toolbar error/permission scenarios; its standalone app verifies dark/partial rendering. No live model provider or model-driven authoring run is claimed. The source and template provenance checks retain unchanged upstream/WFM snapshots.

JavaScript lint passes with warnings visible. The full maintenance gate passes: `bash tools/check-maintenance.sh --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task b4eff3ad-aec2-43f8-a91c-8e5b0bd3679f` (maintenance unit suites, 500 effective-line source cap and task/knowledge checks). `git diff --check` and SS documentation checks pass. SS resources and both desktop profile bundles are rebuilt with the latest lookup/guidance; the List page preview responds at http://127.0.0.1:4322/recipes/list-page/. Vet could not analyze the aggregate 14.2 MB diff because the agent input limit is 1 MB; it is not a passing review. This task validates AI retrieval and executable integration, not the prior marketing-page layout gate or a new visual quality certification.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "AI documentation keeps single source authority, explicit qualifications and rendered behavior verification; engineering policy is unchanged.",
      "sha256": "ab502ecd1062f7b347c5df7f0d8ec384931137f6c0bb1a4b212e33b5a97fa62d"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "AI lookup resolves task intent to exact package/API/source and qualified recipe contracts; ListPage uses BasicTable and marketplace Toolbar.",
      "sha256": "79838529a378ec5cd5c27810478a3c131e3c2d2542350fa14726a3acb685314e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Keep MCP/SS entry stable while adding bounded local lookup, explicit package/path bases, recipe contracts and supporting sources.",
      "sha256": "2a170783bab67c70bcf3a0e28578de9b8fe186824a583272525f6f69730c2701"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Original migrated examples with failed compilation remain explicitly qualified; maintained examples/recipes are the executable entry points. A compiling recipe is not a finished business workflow: host callbacks, production persistence/authorization and target-specific keyboard/geometry review remain necessary. Marketplace packages retain older React peer-range warnings, and Vite reports a large Cobalt chunk; no dependency versions are changed. Generated projects copy the complete local reference content, increasing disk size to keep indexed files usable. `add` preserves existing pages and dependency snapshots; it does not silently upgrade older projects. SS model-driven creation is a user acceptance step. No upstream checkout, commit, push or release is modified/performed.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "9c605be77952f7b1d28524f955caed5c585b775540bfbc3eb081e94518a47991",
      "after": "79838529a378ec5cd5c27810478a3c131e3c2d2542350fa14726a3acb685314e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "fca1268acf652b5a484092570d0b2532e2a0b9238b8d8dd72c0d5f3daf74f33c",
      "after": "2a170783bab67c70bcf3a0e28578de9b8fe186824a583272525f6f69730c2701"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "6c72b509dcb3ae96283e0da4f646b19059500d9313c5995d6d76f38791e6e78b",
      "after": "ab502ecd1062f7b347c5df7f0d8ec384931137f6c0bb1a4b212e33b5a97fa62d"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "a6282f223a20ee1e3f4dc8b76930e6d34fee28dc1fb127d0e54a6dcf78ab8da1",
      "after": "42b0013a040137818420853fa746be6e46308b7661b1e85680afa3444e7f9d25"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": null,
      "after": "46007df05e577bbc570e776c7f84873dadb948293c5c7f5fcdd56d30a31814cf"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/detail-page.md",
      "before": null,
      "after": "4310c2e563616fedf2790cfd1c6696585b9ebdec0c898978df550aab7ec63f7c"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/extensions/users-list.md",
      "before": null,
      "after": "6c3029412d42e0c9d4cc01c1e359475b629f226899c8fcbab535c319107b7d35"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/form-page.md",
      "before": null,
      "after": "afa9bb690464676dbc9240f53c6c3ed1b0ab205933bb39075dc6620b8b31087b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page-data.ts",
      "before": null,
      "after": "f5c55bdece74fb250ae7d29f120d0b0e5c147ac0f0b54ccd3593c337b2b75343"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": null,
      "after": "fa47fb257b47308971dad0f6b03a099967dc15149f38c481ce9919cf7781461b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "478f51ab155be38cb002f7c43b4d17fb4a01e9fe4aa25eb2400721f58fe588e5",
      "after": "0fc13844fed92a6eaf5a2025fbb99aefb67978b1d6edd6aa37b32d4f989f562b"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": null,
      "after": "1a4c716b3b955fb5cff6affa54d9922f6fadee7b60067d860e969661f28da687"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/components/marketplace/toolbar/toolbar.md",
      "before": "6293083983f3e6044d31adcf7da6b8e59b3af20cdea6007e4a696bf483e14cf1",
      "after": "19ed871f3ef5987fcb7d8a7445eafeedc1efd60402f3a5873b0b36f57090ad62"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/layout-templates/detail-page/detail-page.md",
      "before": "968d95789d72f18752d1be1b03f7231dec4ca7e4c2facff8faf33a3f023cb592",
      "after": "5846eb36149c08b257ea9842f7616135b4f91445924f05df524ec14451d0cb2f"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/layout-templates/form-page/form-page.md",
      "before": "d4bd912b192a55b7b2eeb0cead351211033060a5e78211716820f4a6594daab8",
      "after": "ab54c3d9333116159a8b4f05a2cacde3fc02e076301f7abe931b8cb1572ebf14"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/layout-templates/list-view/list-view.md",
      "before": "457492bb6be4e182a852d174e28698ed43a2416dd3174f075be8d781a1cea0fe",
      "after": "225d5fb62b68cae1b58090959ed9c2155bd186a54a00218037e760d48a923c2e"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/registry.json",
      "before": "312b33f7744a631d2c818773627af7df84adf9722d21039ea11a2c7e67b8b8ce",
      "after": "21259556d6a39f9ce70d28f6057d0a65302a69c9697debc41590a21f7700cba5"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/source.json",
      "before": "83fab14e9d8a63b3cc8b143d9a84ef2581b19b54148f2bef42d32217fbaa1ce7",
      "after": "5697453e87a21a17ffd0800984317c154656c65d22e2f62611fb8c07ca378da2"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "3aadf0ea9e473123dc125c2e148465e040fff3315d3255c5e3d6c25fe6b70282",
      "after": "8220e007f37f944f134d71bb67dd2c2d6df56aac8d408d5d8b9271bf8ac06f4d"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "7313526462050a20ecbe6fdf3811a5b727bad12c09beed2dc87c987b2e139ddc",
      "after": "e9a203ebb992b493c0793bbe5f96d98945b46146aa09568e82a8a9ec7ba58790"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "ffd354a735c12a0acc50fb6c6588dec8409f07cc196696140ff1f525c9204f68",
      "after": "3522aa4b9bc3abfe2212e8ade871a345232bc6732907dc8ce4ec44b60673b284"
    },
    {
      "path": "packages/talkdesk-cobalt/test/site-browser.test.mjs",
      "before": "6e554e88b8f4ec73a0ec19d17698fceba7ca1f161fad097db629770f98b8f857",
      "after": "b9000db66426cacd88b23df55d371c5b9bf4d2a30217224d069c7f1359c28e19"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": null,
      "after": "e2e107c3a77fb06d5814537719cd77516e4fa315f713e42ac7a351fa4580d11b"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-lookup.mjs",
      "before": null,
      "after": "565b133040ae7d34cda6976c2f2440433ef1b5f38244303aac55e0fa0d7e234c"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "daadcd0d04317d55b1790bb26ed434a4759285c15ecc24f62b83db7397284f3b",
      "after": "c37191a133c062a86666073b37b1260773f1697461cbf9de25f5ae4557408cf6"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/content.mjs",
      "before": "631f7cd19ed774d43bb036cba4dc61bde71a75668e9b7f204673a03aacae390a",
      "after": "0ea0f092b31c1c85b9ad9a7a6b109c8c57c4ea3eb0d6d315d27ea84d9a32fd3f"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/export.mjs",
      "before": "7824e228e745521f4e4805ec0411da1f411e26baa81b739e13228e344d9edb2e",
      "after": "b06a724aa8e7ea129ec5a989aa93ab9648abce43a48d534ab5db4b2b629abe13"
    }
  ]
}
```

Completed-At: 2026-11-14T13:39:59.684556+00:00

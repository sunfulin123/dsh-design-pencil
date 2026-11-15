# Adapt generated Workspace chrome to the pinned Atlas redesign and sync AI guidance with SS

Record-Version: 2
Task-ID: c28c8cc8-af1d-413d-a0f0-1a506e5f6987
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-14T17:38:48.949638+00:00
Type: feature
Status: complete

## Context

Adapt generated Workspace chrome to the pinned Atlas redesign and sync AI guidance with SS

## Changes

Saved the cumulative authoring baseline as ff6ba744 and SS baseline as 8aba1ab36 without pushing. The two repositories remain on their Cobalt worktree branches. Excluded Astro development metadata from the baseline; preserved hashed upstream documents including their original whitespace.

Added owned chrome presentation/geometry templates pinned to Atlas revision 7014efc11 and design commit deb486689. The project-copy adapter imports them after the immutable shell stylesheet, applies 44px title bar/48px Dock dimensions, shared light/dark surfaces, card/drawer borders and exact iframe width costs. Source provenance records original snapshot hashes, Atlas source hashes and owned template hashes with adapterVersion 4. Existing SDK stubs, multi-app routing, review toolbar, pnpm and source-only component reuse remain. The helper's add action preserves existing shell sources and provenance.

Updated the selected Cobalt prompt, local companion, Workspace pages, registry narrative pointers, Astro documentation and SS owner documentation. Stable locators cover title bar/search/notifications/secondary controls and named drawer actions. The upstream Atlas checkout and vendor shell snapshot remain unchanged.

## Validation

PASS: focused chrome geometry/adapter tests (2), module source/provenance tests (8), strict documentation and example compilation plus Astro build (275 pages), and serial module browser regression (7). The actual SS-packaged helper creates a fresh pnpm project which installs and builds; generated-shell browser acceptance covers both schemes at 360/390/640/641/768/1024/1440, logo and Dock center offsets <=0.5px, exact iframe/readout agreement, card gaps, pinned/hover navigation, expanded Dock, secondary resize, multi-app pages, Create/Import and SidePanel. The prototype toolbar regression covers seven sizes, six scenarios, eight flags, Reset and keyboard dismissal (2 tests combined with chrome acceptance).

PASS: serial runtime Cobalt/docs/scaffold/package tests (9); SS helper (1), plugin build, desktop build and doc-check. Eight critical SS resources match owner bytes. Two vet reviews of the authoring diff report no issues, including the complete staged source scope. Source cap passes across 3366 files.

Initial checks exposed verification issues: an incorrect fixture named import, searchbox/portal locators, and the shell PATH lacking wasm-bindgen; these were corrected and the affected checks rerun. An overlapping docs rebuild caused HTTP failures in browser tests; rebuilding then running readers resolved that interference. Concurrent tests that stage/export the same authoring content raced on generated component docs; the complete runtime test scope passes with --test-concurrency=1. A parallel documentation-navigation run failed a focus-trap assertion; isolated and serial reruns pass, without a claimed production fix. Detailed logs and before/after light/dark screenshots are under /private/tmp/cobalt-chrome-* and /private/tmp/ss-cobalt-chrome-*.

Exact commands:

- `bun run docs:build` in `packages/talkdesk-cobalt`: PASS, strict documentation/example typechecks and 275 Astro pages.
- `node --test test/export.test.mjs test/wfm-upgrade.test.mjs test/chrome-layout.test.mjs`: PASS, 8 tests.
- `node --test --test-concurrency=1 test/site-browser.test.mjs test/form-field-browser.test.mjs test/table-edge-browser.test.mjs test/list-dialogs-browser.test.mjs`: PASS, 7 browser tests.
- `SYNAPSE_COBALT_TEST_PROJECT=<fresh-SS-project> node --test test/chrome-browser.test.mjs test/review-toolbar-browser.test.mjs`: PASS, 2 tests; added status/notification coverage is rechecked separately with the same SS fixture.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/package.test.mjs`: PASS, 9 tests.
- `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh` with `/Users/franklin/.cargo/bin` in PATH: PASS, existing compiler warnings remain.
- `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`: PASS.
- `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build`, `pnpm run doc-check`: PASS in SS.
- `pnpm install` and `pnpm run build`: PASS in a newly generated SS-packaged prototype.
- `vet 'Review complete owned Atlas chrome migration, source provenance and synchronized AI guidance; no upstream edits or new UI flag' --agentic --agent-harness codex --max-spend 1`: PASS, no issues found.

Read-only SS review follows td-ahd-code-review on the diff from 8aba1ab36. Applied security-reviewer and architecture-reviewer definitions plus prose, tests and package provenance checks; no actionable findings. Conditional Client React/design, performance/concurrency and contract reviewers do not trigger for this SS diff of owner prose and packaged-helper assertions; the actual generated UI has separate browser and authoring vet evidence. No Electron/Host/Client public contract is changed. Technical KB and Product KB remain unchanged because plugin ownership, resource transport and user workflow boundaries are preserved. Model-provider/Electron acceptance is not claimed.

`bash tools/check-maintenance.sh --lint-js --base ff6ba744 --task c28c8cc8-af1d-413d-a0f0-1a506e5f6987`: PASS, harness/task/knowledge checks and source cap; warnings only. `git diff --check HEAD`: PASS in both repositories. Final notification/status checks also pass on the SS-created project; keyboard assertions wait for the legacy menu hook's deferred initial focus before Escape. The review guide records that readiness condition. SS helper ESLint passes with --no-ignore (the ordinary invocation skips its tests directory). The final staged vet run also reports no issues after the notification/status readiness assertions and guide update.

SS standalone review result: REVIEW_VERDICT=PASS; BLOCKING_COUNT=0; REVIEW_ROUND=1. This task note is the review evidence record; no separate spec report is created.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Source templates and scoped chrome styling preserve existing ownership and 500 effective-line constraints.",
      "sha256": "f144a15b00bbe2280435a67695517caa914dff99eca539fcdd060703a0e5f78a"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Bundled HTML Skill and static delivery seams are preserved; Atlas presentation and source provenance remain private template details.",
      "sha256": "6b60ed2ca06f0ce91addac20d762516550e4a30eab204b8803fbb48f411162fd"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Updated Workspace chrome guidance, registry narrative pointers and pinned adaptation provenance now match the generated shell.",
      "sha256": "0b7407be16510181d1087e3ee085584ddeca8e9635ccb7c94b24d0224ba8ca77"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The Atlas-derived UI is a web prototype adaptation, not the production Atlas runtime: search and SDK services retain their documented stand-in limitations. No new UI flag, remote docs refresh or generated E2E/Cucumber documents are added. Existing projects are not automatically migrated. The current SS release pin is unchanged; local testing consumes the staged runtime. Model-driven acceptance remains the user's SS test.

Build/export operations mutate shared authoring output; run them separately from content readers and browser builds. The observed parallel documentation focus failure is not proven fixed; isolated and serial coverage is the verified evidence.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "702c1ce5d44748097c5432f11fe4ced9d00da770a809a8219bfcf48a4b66b4d9",
      "after": "f1e136ecdbc61ea2f6c50bd311d9cd1b0fe4a8bda526de18fc3e37bc36c5d4d4"
    },
    {
      "path": "docs/kb/product.md",
      "before": "beebe937b43a28746f8fd4fdf2da75e6b2494fea4d6930b9a9f0c8490b6a55cb",
      "after": "0b7407be16510181d1087e3ee085584ddeca8e9635ccb7c94b24d0224ba8ca77"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "92f282790793c7e136155eab57e98c9f202a1f637b1c569a36709002b79ae560",
      "after": "6b60ed2ca06f0ce91addac20d762516550e4a30eab204b8803fbb48f411162fd"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "10a2e268149079a300dda20d02a88726f5020be5cb4110e17771a25cc4cc8cc6",
      "after": "f144a15b00bbe2280435a67695517caa914dff99eca539fcdd060703a0e5f78a"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "ca39bee18a90d58de9ce64ea574bdae949b026eff2575aadea6bfaa26ff9b9d5",
      "after": "16bccecb3f0bc5ca139fc442acc92b9a8bdf5b3dc6ae3942d9b6a38a8e6c3f43"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": "aeaf343b04cbe2837b922310a9b94bee6c83c3e3533a6dc59b259d1be8259192",
      "after": "b26ba45060beda99dc560db140303aaeabaa35322878ab17514188ef056332a2"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "b44d96f74d46fea4c947f1de648f15893235dbf7267a0a333f0996cdb250e52f",
      "after": "2d429af23184556f7f5fe2c5b72a2916dc9bea1703729e1fba3238ee928b31ff"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "e21ec9ac8b197e8b914c73d1d0bc5a9831e6b78b2fdbe2e1f60177fe5fb982a7",
      "after": "b6be17b83d4018f667397f9836764d0a74ce3e5a6661d94578116e8d0fc63b6c"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/registry.json",
      "before": "213e81da60cb7a60bc82171195233c2ea62d1b81abccb00d225dc7da73ac0d17",
      "after": "f25cca0ef89dfc4c33d7f9d3aed9ea07bf0bdfd4fa23dbfacebb5d29709438b9"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/workspace/dock-and-drawer/dock-and-drawer.md",
      "before": "9bd40148398d9675eeb940bd8fd3aaca044dd0893168ecc44489ada80f4bf5f6",
      "after": "f9fc2e83bef5ad1c1dd92aa7519936c96fb450116d1a65715776667564afe8da"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/workspace/overview/overview.md",
      "before": "33df52045fc1992e14a060ff977cfa97efd9d9da6d5f3e09479200e3c7405a15",
      "after": "c692184d3e1b6188cc22d12b8eb4e6178fc5229f6843fbf08ee30e58822480e9"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/workspace/space-and-viewports/space-and-viewports.md",
      "before": "68e5b3b3f2133b8aed9f02887c75e7c8e265f5046be8fd1c8f811d1e337a548c",
      "after": "9c3f49a530e3000ab0c011d9a0a993a7aed2396cf009a246429eac2ad0ea4b60"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/workspace/title-bar/title-bar.md",
      "before": "9564bd24350cd330fe43324ff876a0a31b706956ed55f92ab4ec776eba7bab84",
      "after": "08a257cac5eee1f49cc4cb5cd0f2f17977c38a061ab6e7ec169e09f0fe02a7a2"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/source.json",
      "before": "acd7747ef1a650d23c64b75043dd0f59e02f2b362b1916e020b19b939604116b",
      "after": "e160fc5cb3f39d03ab21167186b0b77cee5aa159365b26c9cb8d55bf52d5a2aa"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "93a63c8b297ae933490c091bd3d75a9b232c6c4c3ac465eebb3394d8dcb843a0",
      "after": "04a3c118dbf64260dbdeb27c51eea8f623d74842b48f244e8745fed255381a48"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md",
      "before": "8c1abf2e120b7cd994fdb915c7d9b17e8e28ed1a5f26936a1a5cd960b69876ba",
      "after": "04cf50995ce021de7bb9263cee2bcb55d530573d7c9e7b3ce1eef5e342cbb4fc"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/workspace-chrome.md",
      "before": null,
      "after": "1b7dea624a9cdb4faade80267caeed7245489e5977841d66ca24ae2891c87ec3"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/source.json",
      "before": null,
      "after": "0c2b88e995feb1032ead40daf7d997b22d647adc94e592df0dbe3979a4489618"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/space.ts",
      "before": null,
      "after": "522bb25a8f802ff1722969705abf0883b778997c2c54fe89796b30ed4bc7d2a0"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/title-bar.tsx",
      "before": null,
      "after": "715e57f5f2ec45545d9d10f340becbb4b2a755ea7b4c0056c5fde795ed81d5dd"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/workspace-chrome.css",
      "before": null,
      "after": "b569c881b832ef7cfbfc0ab412183149098c372eb92c20b8bdfd63f022a63d17"
    },
    {
      "path": "packages/talkdesk-cobalt/test/chrome-browser.test.mjs",
      "before": null,
      "after": "23d3d9262742523969b43fcfac900bfe9648c06ca3831f75d78936209c5f55e2"
    },
    {
      "path": "packages/talkdesk-cobalt/test/chrome-layout.test.mjs",
      "before": null,
      "after": "0c0a964b7333af539620f2a37703015736cb739fd95a510c2b7c169d7465dc08"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "e0980b2fa2359a407159f50c724ee9bc30e36921721f269965368121d0ab20f9",
      "after": "f6a45837b0ea880d2eecc32f62de4d3aa08d62b9fedaf3d285687ee3ff11cc56"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-shell-adapter.mjs",
      "before": "14130d4715004b1cf4018eb49e076ae17f313a2d0904e08fd99460fba03630eb",
      "after": "a36e86316a26497ced7a7a5cbcdfcc2884501f341be7f9961a54bf15df14550e"
    }
  ]
}
```

Completed-At: 2026-11-14T18:00:19.790054+00:00

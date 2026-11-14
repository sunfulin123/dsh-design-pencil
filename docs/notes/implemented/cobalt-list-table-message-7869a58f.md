# Render ListPage selection guidance through BasicTable messageComponent below the table header

Record-Version: 2
Task-ID: 7869a58f-8144-4a8d-ab39-29c7854009bd
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T16:53:10.640581+00:00
Type: fix-bug
Status: complete

## Context

Render ListPage selection guidance through BasicTable messageComponent below the table header

## Changes

ListPage passes its batch-selection guidance through the existing BasicTable messageComponent prop. The standalone pre-table banner and its outside padding wrapper are removed. BasicTable owns placement as its first body row, directly after the column header and before user rows; no component API or upstream source is changed. The message keeps its info styling and adds list-selection-message as a stable test ID. Permission state omits the table and its selection guidance.

The recipe catalog and BasicTable MDX explain this composition; generated recipe contracts, AI Markdown, indexes and SS copies derive from those sources. The packaged-helper test checks messageComponent and the message locator. Existing SS README/Agent Note describe the same source-template/ListPage capability and need no additional implementation detail.

## Validation

`node --test --test-name-pattern='ListPage reuses' packages/talkdesk-cobalt/test/site-browser.test.mjs` fails before the fix because the selection message cannot be found inside BasicTable. After `bun run docs:build`, the focused browser test passes, including new table-body containment and numeric header/message/first-data-row ordering assertions plus existing selection, sort, search, paging, filter stability and scenario checks. Documentation/example typechecks and the 275-page Astro build pass. The actual header/message/data screenshot is inspected.

`node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build` and `pnpm run doc-check` in SS: PASS. The helper asserts messageComponent and its locator in the generated recipe. Byte comparison confirms staged recipe TSX, generated recipe guidance and plain BasicTable API documentation match source.

`bash tools/check-maintenance.sh --lint-js --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 7869a58f-8144-4a8d-ab39-29c7854009bd`: PASS, source cap, maintenance tests and task/knowledge evidence, with lint warnings only. `git diff --check`: PASS.

The messageComponent implementation and its API are unchanged, so verification targets the real ListPage composition rather than duplicating the component implementation in a new unit test.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The existing source-template ListPage product capability is unchanged; message placement belongs to its component and recipe contracts.",
      "sha256": "7ab5b9361cc2bd9789becc84ef89e188e861e96045965e52e454d4d1b469a505"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Clarify that ListPage delegates header-adjacent guidance to the existing BasicTable message slot through the same local source-template path.",
      "sha256": "c41e450ec1dab2452fb12ddda3434ca4c878351c536cd9d69da65b7530e4c052"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Preserve ownership and regression evidence requirements without a process or architecture change.",
      "sha256": "ac595bb28201fbd2ebaf902c76e0c15a8fdabff5634485a6f8c29bd6b4c67c05"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

New generated projects receive the revised recipe; authored projects are not replaced. Cobalt private registry/CDN requirements and existing build warnings remain. No upstream edit, new API, E2E documentation, commit, push or release is included. Vet is not rerun because the previously verified aggregate-input limit remains blocked; no automated review result is claimed. SS user acceptance follows restart.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "1c4998152cab61bd6442afdb3fe0188e0f71ca6f80105dd2e3484556cec085fe",
      "after": "7ab5b9361cc2bd9789becc84ef89e188e861e96045965e52e454d4d1b469a505"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "5eabba106c4e1e6b0c415a3454bbb875d48ad5810f55e2840f27b620fd7c0c7a",
      "after": "c41e450ec1dab2452fb12ddda3434ca4c878351c536cd9d69da65b7530e4c052"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "ac51fc4b6f139c932bf2b5ab21ee3e15e7585bd05a078297f7983322ca0fd53d",
      "after": "ac595bb28201fbd2ebaf902c76e0c15a8fdabff5634485a6f8c29bd6b4c67c05"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/basictable.mdx",
      "before": "6ab0184266db9b7d82682ba169fa7ca0a42505517141ce9224dd387c0b91e6df",
      "after": "1724cbdb6833f14ca34d8e42dd82d94289889cbd33565edcedfb209f865be8d3"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "87a254dd2bc79addcdbd0340ed9bb2f7f1c77d88bcb5efd5bbb42be465998ce2",
      "after": "6e0d35a2401497eecb68582e91427c873eb521bb88a302aa73e360af55a4bda0"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "3c5c4cb74954dd5383037c66432d265b7c64e2af87e20baae10e815b3ef86b1a",
      "after": "4a12679ac33a72b25f9928b77d46dac54ff6d1e1ba637d59a324a46be8b32931"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "bf1e259d267d9f02c00c50a12ef1f7c363d7fb4422b6d0ab9c01fd802831d85f",
      "after": "788fcb0085fa1999c6bd3c6ad884609134b1a31e4421b4a03d6cc0e0f40fcfaa"
    },
    {
      "path": "packages/talkdesk-cobalt/test/site-browser.test.mjs",
      "before": "7b6d5668e88e3bf400e50d89a4e4daf1479ca2b5ee3c480ac6c24c8995f05f47",
      "after": "4c04d93ff0a52d01e7406c41e51da2aea0ba29ce263fa1730d85aed773a29c03"
    }
  ]
}
```

Completed-At: 2026-11-14T16:57:12.892964+00:00

# Make ActiveCall geometry independent of the host box-sizing reset, discovered while wiring the maintained 57481 demo Conversations Dock and moving Insights to WFM.

Record-Version: 2
Task-ID: abc97029-e87d-4db5-8e8b-2721107257de
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T07:41:29.199715+00:00
Type: fix-bug
Status: complete

## Context

Make ActiveCall geometry independent of the host box-sizing reset, discovered while wiring the maintained 57481 demo Conversations Dock and moving Insights to WFM.

## Changes

The maintained 57481 preview now registers the existing conversation Dock entry as ActiveCall, preserving its production icon and omitting a duplicate shell drawer. The existing WFM Dock entry retains all six menu labels, and its Insights route runs the formerly Admin-owned Insights page. Admin now exposes Users without Insights. Preview routing changes live only in the disposable review project, not the source shell or upstream.

Embedding the copied recipe exposed a genuine source defect: the demo global reset masked content-box sizing. Added a recipe-scoped border-box rule, leaving other apps and host elements unaffected. The source regression switches the host to content-box and checks the 164px header, 360px queue and pinned 66px footer.

## Validation

`node --test --test-name-pattern="host border-box" test/active-call-browser.test.mjs`: FAIL before the fix, header 204px instead of 164px.

The maintained preview builds with `pnpm run build`. Actual Chrome navigation verifies Conversations opens ActiveCall, WFM Insights renders its chart, all six WFM links remain, and Admin Users renders with no Insights link. No browser errors. Final source, SS synchronization and geometry checks are recorded below.

- `bun run docs:build`: PASS, including TypeScript/demo/Astro checks.
- `node --test test/active-call-browser.test.mjs`: PASS, 4/4 including the before-failing host reset regression.
- `node tools/build-skill.mjs`: PASS.
- `vet <scoped box-sizing fix> --agentic --agent-harness codex`: PASS, no issues found.
- `pnpm run build` in the maintained disposable preview: PASS; current hashed assets copied before HTML.
- Final actual 57481 Chrome navigation: PASS; existing Conversations opens the recipe with a 164px header and working Hold/Resume; existing WFM Insights renders the chart; Admin Users remains with no Insights menu. Zero page errors. Screenshot: `/private/tmp/cobalt-live-conversations-final.png` and `/private/tmp/cobalt-live-wfm-insights-final.png`.

- Final SS synchronization: `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <Design source>`, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs` (1/1), `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: PASS.
- `bash tools/check-maintenance.sh --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task abc97029-e87d-4db5-8e8b-2721107257de`: PASS.
- `git diff --check HEAD`: PASS.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "Recipe-scoped box sizing preserves documented dimensions and source-copy boundaries; live demo menu reassignment does not change source shell contracts.",
      "sha256": "a0308febc3a103de942599331b7daf9b320a850da229aaa821d5aa2b2d73afd4"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Recipe-scoped box sizing preserves documented dimensions and source-copy boundaries; live demo menu reassignment does not change source shell contracts.",
      "sha256": "747ab3743852b06b4d61124d4ef5e1bf76eb9ba4259805e8de8f4f71cd184128"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Recipe-scoped box sizing preserves documented dimensions and source-copy boundaries; live demo menu reassignment does not change source shell contracts.",
      "sha256": "26bbc41bfb52c36faa26ef93f684dd9da4e667facae1fcea0b668f0bb9f83a4b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

This preview remains a disposable review project. Existing user projects are not overwritten; new copied recipes receive the scoped sizing fix. Real telephony remains unimplemented. Cobalt/Atlas upstream inputs are unchanged. No commit or push.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "cc3ca569633d3cf0e2289a02d57ed6fd3d9be58be54f9532348c6b251e82384c",
      "after": "a0308febc3a103de942599331b7daf9b320a850da229aaa821d5aa2b2d73afd4"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "fc369a1cbe04e95b7dc1568e69f684c35e37833c5ace0fe0c490564d52b4afdc",
      "after": "747ab3743852b06b4d61124d4ef5e1bf76eb9ba4259805e8de8f4f71cd184128"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "4d5e5a9d3b4be4d08af9fcd1e230dca3971258d6cd8ce9a6594a36810d539543",
      "after": "26bbc41bfb52c36faa26ef93f684dd9da4e667facae1fcea0b668f0bb9f83a4b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/active-call.css",
      "before": "70e4e2f3bc1d493cfb62b7c443c0cb0370f613be4b014b54e2c5332bb4668070",
      "after": "0b2a3c8644a97dc1ef9885d794facf552d51a4e491b143826009ac8b7fdafdc4"
    },
    {
      "path": "packages/talkdesk-cobalt/test/active-call-browser.test.mjs",
      "before": "70f4a36c227d0f699d9964237ac8ad0fdc5c3f95c8bc9547ea0030b9fbccdbb7",
      "after": "b4f266cc081d34c1d7c571b359863b0a35ae32fc53947920c476dc78b4efd5de"
    }
  ]
}
```

Completed-At: 2026-11-15T07:44:19.691744+00:00

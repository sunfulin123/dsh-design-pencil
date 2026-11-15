# Give Team Schedule agent search a fixed 160px width without flex growth; synchronize source templates, AI contract, SS and live preview.

Record-Version: 2
Task-ID: 6d1d1f6e-a6b4-416a-9e96-3360017e04d9
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T12:14:18.585417+00:00
Type: fix-bug
Status: complete

## Context

Give Team Schedule agent search a fixed 160px width without flex growth; synchronize source templates, AI contract, SS and live preview.

## Changes

The Team Schedule agent search has a fixed 160px width and flex basis with no growth/shrink; max-width protects unusually narrow parents. Native Cobalt control height, colors and behavior are unchanged. Toolbar wrapping remains enabled.

Updated recipe integration intent and AI Workspace guidance; generated recipe Markdown and source copies follow the same export path. SS README and implemented scaffold note remain current: no integration, dependency, lifecycle or public contract changes are introduced.

## Validation

- Regression before the fix: `node --test --test-name-pattern='native wrapping Toolbar' test/reference-recipes-browser.test.mjs` failed at 331px because the search grew to 187.09375px instead of 160px.
- `bun run docs:build`: passed typechecks, executable demos and 279 Astro pages.
- Final `node --test --test-name-pattern='native wrapping Toolbar' test/reference-recipes-browser.test.mjs`: passed; the actual native field remains 160px at 331/640/1125/1440px, with bounded wrapping controls and native badge anchors.
- `node tools/build-skill.mjs` and SS `stage-local-runtime.mjs <Design root>`: passed. SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, plugin build and desktop build: passed after staging.
- Recreated source copies with the staged SS helper, built the maintained preview with pnpm and merged assets before index publication at 57481. `node /private/tmp/search-width-live.mjs`: passed four actual Team Schedule iframe checks across light/dark and 1440/390px windows; native search width was exactly 160px, controls remained inside their business frame and no page exceptions occurred.
- Scoped `vet --agentic --agent-harness codex`: no issues found.
- `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 6d1d1f6e-a6b4-416a-9e96-3360017e04d9`: passed with existing non-blocking warnings.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Team Schedule agent search now keeps a fixed 160px width inside its wrapping native Toolbar.",
      "sha256": "c89dd41d568b7ccd76f7e5650542762407c1d94ca426fbeafbee295c05f6b7c5"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The CSS field-width adjustment retains the same source-copy export, native controls and wrapping integration boundaries.",
      "sha256": "e15d057ba922e55dcabf21a7f25005ad3c24b726ea38b30b7af4fac118c22615"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Field sizing changes no repository ownership, coding policy, public contracts or task lifecycle.",
      "sha256": "6b1e3a0941d7748a4d4180be1c8b6458fc73e6be734f18c33ead4aa59dfc4e9f"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Only Team Schedule search allocation changes. No upstream source, business state, route, dependency, commit or push is changed. All controls remain native Cobalt. Existing warnings are not promoted to failures.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "8c0157de476424cbdb09a1fdab4dabd2283de182b417c42bf1eb5c50e6d1486d",
      "after": "c89dd41d568b7ccd76f7e5650542762407c1d94ca426fbeafbee295c05f6b7c5"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "1c53d052f622813cd13732db816f6fb6f7e84ca49455adc1948ea310f311ab2a",
      "after": "e15d057ba922e55dcabf21a7f25005ad3c24b726ea38b30b7af4fac118c22615"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "5bc3362f9356fac7872c03ca36c1e1e7cf7578b8b7cb0f1f8db73525cc57aa4c",
      "after": "6b1e3a0941d7748a4d4180be1c8b6458fc73e6be734f18c33ead4aa59dfc4e9f"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "f8039a028971366c9aa309050f5e69892c9a813e0e0ec2b309912c535e55b041",
      "after": "18943147dbea06dfad0f4310f750e85f003078a8212d2462fbbfb93b86c3dd73"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/team-schedule.css",
      "before": "e93c48bbcfdd6f624be60ef66f627df99eb83287754cb7acef377323a8cb3875",
      "after": "f9b9130e2fc5c84cc07ae5ac0272acf6887874dabba11741300dc90bd00cc2a2"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/team-schedule.md",
      "before": "7a33951fb1eaf0c314657ce836ae39c91f9bf6abd7c6019ff67fd7903744878a",
      "after": "cd14abb753957ca2749be3ffac0cc9b4878cefc805d07b2332ff10012a51ac07"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "682594f2234257b3210f45a5531f16dd828ffa6a126ca81b281f092079447786",
      "after": "2264154daf9e3d0008c1281ab2d1f9845c859c551921c38d0daaf8d3f3c92799"
    },
    {
      "path": "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs",
      "before": "8de20f2ecf273f0f118bdae066cdf6752c36235cc835b984d865fd9ec196c95c",
      "after": "b029cebfd5043859484da3d01344775c77e33e273be9ddee0daa9235d490cf78"
    }
  ]
}
```

Completed-At: 2026-11-15T12:18:05.322241+00:00

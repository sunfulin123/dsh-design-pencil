# Use pinned Atlas title bar controls and native Cobalt theme states; correct search, status and avatar parity

Record-Version: 2
Task-ID: 0d3701f8-f1fd-44ef-9d6e-26c67e7fd689
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T02:25:11.772772+00:00
Type: fix-bug
Status: complete

## Context

Use pinned Atlas title bar controls and native Cobalt theme states; correct search, status and avatar parity

## Changes

Corrected the owned Atlas chrome adaptation: removed FakeInput search and custom trigger color/typography overrides. Search, status, initials avatar, notification and secondary-area controls use the pinned Atlas TitleBarButton/frame/Tooltip implementation and original CSS. Maintained status/profile/notification compositions preserve the existing mock menus/actions. The original Atlas files remain byte-identical with per-file hashes; only the generated frame's Tag v2 default import is adapted to the named Cobalt v3 export. Adapter version 5 records that API-only change. Declared official Tooltip 1.0.1 and classnames 2.5.1 dependencies and updated the workspace lockfile.

Updated the local AI companion, Workspace guidance, source provenance, notices and SS owner docs/tests. Staged SS resources contain the same maintained templates. A fresh project created by the SS-packaged helper installs and builds, and its output is published to the already-running loopback preview URL. The visible user browser was reloaded and shows native BUTTON search with alpha background, 12px font and 500 weight. Original Atlas and ai-docs vendor snapshots are untouched.

## Validation

Regression evidence: `SYNAPSE_COBALT_TEST_URL=http://127.0.0.1:57481 node --test test/titlebar-theme-browser.test.mjs` fails before the fix with DIV !== BUTTON. The same test passes after publishing the new SS-generated build, comparing control backgrounds, typography, hovered and expanded states against an unmodified Cobalt Button under the same loaded light/dark theme. The primary-expanded comparison uses the matching hovered state, rather than comparing a hovered control to a normal reference.

- `node --test test/chrome-layout.test.mjs`: PASS, 2 geometry/adapter/provenance tests.
- `bun install`: initial private registry connection failed; after the user's VPN reconnection the retry succeeds, adding the real dependency packages without shims.
- `bun run docs:build`: PASS, strict docs/example checks and 275 Astro pages.
- `node --test test/export.test.mjs test/wfm-upgrade.test.mjs test/chrome-layout.test.mjs`: PASS, 8 tests.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/package.test.mjs`: final PASS, 9 tests. An initial package check detects stale THIRD_PARTY_NOTICES in built Skill resources; rebuilding through `node tools/build-skill.mjs` resolves it before successful SS staging.
- `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`: final PASS in SS; no stale-resource bypass.
- `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: final PASS, including original primitive hashes and the explicit Tag import adjustment.
- `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build`, `pnpm run doc-check`, `pnpm exec eslint --no-ignore plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS in SS.
- `pnpm install` and `pnpm run build` in the fresh SS-generated prototype: PASS. A targeted `pnpm exec tsc --noEmit --target ES2022 --lib ES2022,DOM,DOM.Iterable --module ESNext --moduleResolution bundler --jsx react-jsx --esModuleInterop --skipLibCheck --types vite/client src/workspace-shell/shell/TitleBar.tsx` also passes.
- `SYNAPSE_COBALT_TEST_PROJECT=<SS-generated-project> node --test test/chrome-browser.test.mjs test/review-toolbar-browser.test.mjs`: PASS, 2 browser tests covering both schemes, 360/390/640/641/768/1024/1440 geometry, all size presets, six scenarios, eight flags, menus, navigation and recipe workflows.
- `SYNAPSE_COBALT_TEST_URL=http://127.0.0.1:57481 node --test test/titlebar-theme-browser.test.mjs`: final PASS, actual live preview theme parity.
- `vet 'Review Atlas native title bar controls, Tag import-only compatibility adaptation and theme parity regression' --agentic --agent-harness codex --max-spend 1`: PASS, no issues found.
- `git diff --check HEAD`: PASS in both repositories. Original Atlas checkout remains clean; six critical templates match SS bytes.

Full generated-project `pnpm exec tsc --noEmit` fails in unchanged Cobalt Extensions Badge and Textarea sources (conditional badge props and textarea focus-event cast). No error is reported in the changed shell path. This is not a whole-project typecheck pass. The pre-fix temporary project cannot provide a compiler baseline because its TypeScript installation is incomplete; no empirical before/after claim is made for those two diagnostics. The focused shell typecheck and production build are the verified evidence.

`bash tools/check-maintenance.sh --lint-js --base ff6ba744 --task 0d3701f8-f1fd-44ef-9d6e-26c67e7fd689`: PASS, task/knowledge evidence, source caps and lint with warnings only. Pristine Atlas inputs are classified under `templates/vendor/atlas-titlebar/`; the owned helper declaration remains in maintained chrome sources. An earlier lint check correctly reported the pristine Tag v2 import against local v3 and an unused owned import; the pinned-input placement and explicit generated import adapter preserve upstream bytes while linting the actual maintained integration. No color-rule suppression is used. Final staged `vet` review after the pinned-input placement also passes with no issues found.

SS standalone diff review follows td-ahd-code-review definitions for security and architecture, plus prose, dependency/provenance and tests. No Host/Client boundary or public transport contract changes, and no actionable finding remains in this scope. REVIEW_VERDICT=PASS; BLOCKING_COUNT=0; REVIEW_ROUND=1. This task note is the evidence record. The known full-project typecheck diagnostics remain explicitly qualified above.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "No governance or cross-runtime boundary changes; original Atlas inputs remain read-only and per-file source caps apply to maintained compositions.",
      "sha256": "f5785079fe7986ba5dca18a37f5e624753dab26f02ffd82f63edefe8b7521c1e"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Current title controls use copied immutable Atlas primitives and native Cobalt state styling.",
      "sha256": "aaad403bf02eb20c87479750067cb6e84a00ba419c460312d19024404c82638e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Pinned Atlas sources live with vendor inputs; generated project adaptation preserves the existing Skill resource/POC interfaces.",
      "sha256": "0413d07b87cc55a69c3bd84236ae4ca52f293e246dfa39699ef924826f25196e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The prototype retains mock menus/SDK actions and is not the production Atlas application. Original stateless UI/CSS is pinned; Tag import adaptation is explicit and does not change theme behavior. Full-project Badge/Textarea type diagnostics remain outside this top-control correction. The local staged SS runtime requires rebuilding/staging for distribution; no release pin or external upstream repository is changed. No new commit or push is made.

The preview at http://127.0.0.1:57481 serves the fresh SS-generated build, mirrored into its existing disposable delivery directory to preserve the review URL. `/private/tmp/cobalt-titlebar-live.json` identifies the actual new source project. Screenshots and exact logs are under /private/tmp/cobalt-titlebar-* and /private/tmp/ss-titlebar-*.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/THIRD_PARTY_NOTICES.md",
      "before": "f569cf706d7bd96a2f8ec77a1947a3cd93ea37b27fad1dba2f09eb4a66f20907",
      "after": "3acb29cd38343cca4941eefdf1e8df7336ba9cf41d82696a9ac73398de7a970e"
    },
    {
      "path": "docs/kb/product.md",
      "before": "0b7407be16510181d1087e3ee085584ddeca8e9635ccb7c94b24d0224ba8ca77",
      "after": "aaad403bf02eb20c87479750067cb6e84a00ba419c460312d19024404c82638e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "6b60ed2ca06f0ce91addac20d762516550e4a30eab204b8803fbb48f411162fd",
      "after": "0413d07b87cc55a69c3bd84236ae4ca52f293e246dfa39699ef924826f25196e"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "f144a15b00bbe2280435a67695517caa914dff99eca539fcdd060703a0e5f78a",
      "after": "f5785079fe7986ba5dca18a37f5e624753dab26f02ffd82f63edefe8b7521c1e"
    },
    {
      "path": "packages/bun.lock",
      "before": "a6d7f4aeba3e1334635faf64c86f790bf4d1c201262ad94a6c9704c79a1c0e00",
      "after": "04411df8e515f66fde5e82be10249bb3ba66e6b229e3d47f0de49816be0b00c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": "b26ba45060beda99dc560db140303aaeabaa35322878ab17514188ef056332a2",
      "after": "a10b2e8afcaf9900c594d321aea7e052e2a013cce637077a6cbcfc31185e6ec9"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "2d429af23184556f7f5fe2c5b72a2916dc9bea1703729e1fba3238ee928b31ff",
      "after": "ca32ad809fb299b24cbd801f3d1bc80e43b95fe29769df5543b7fd504994b963"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "b6be17b83d4018f667397f9836764d0a74ce3e5a6661d94578116e8d0fc63b6c",
      "after": "bce47d31c9fee79454f72b57686f587c428f7a18bd92bd0ddd832f519f3a5910"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/content/workspace/title-bar/title-bar.md",
      "before": "08a257cac5eee1f49cc4cb5cd0f2f17977c38a061ab6e7ec169e09f0fe02a7a2",
      "after": "345e3835dd04bc0476f2fb6a1e3e5b90b4365abeac4d75d86ff76364b9a80ae0"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/source.json",
      "before": "e160fc5cb3f39d03ab21167186b0b77cee5aa159365b26c9cb8d55bf52d5a2aa",
      "after": "ea71c4addd8d64bbb1eee1b6cbea3afd290c7ed90e65e5ae56ecb6564d7ae508"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "04a3c118dbf64260dbdeb27c51eea8f623d74842b48f244e8745fed255381a48",
      "after": "9bc98c2626c50299b0807391a10a12285e68290b1853129f7415ec4f2f7e0074"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt/workspace-chrome.md",
      "before": "1b7dea624a9cdb4faade80267caeed7245489e5977841d66ca24ae2891c87ec3",
      "after": "ee9696f685a1b6facd9cbd80dad4239c948899a5c40b793abfde027c9a8d98f2"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/class-name-formatter.d.ts",
      "before": null,
      "after": "cdf832c2623624854061072221b87d0121753c6a2858cd6a14319ca6bd5804e8"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/notifications.tsx",
      "before": null,
      "after": "2ce3df725cc2c5c650549fa138860cd6e10cf3f0a14f0c55afcc35e6d806ced1"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/profile-menu.tsx",
      "before": null,
      "after": "b4a0108dc7957b74c2c6db93a82091516ffb1337073a50c9d885cf90f4a3bcd8"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/source.json",
      "before": "0c2b88e995feb1032ead40daf7d997b22d647adc94e592df0dbe3979a4489618",
      "after": "15c5ab6109164d0c946c37067f333b4b12f20569c66dde4cd970f0f9ba226fa8"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/status-pill.tsx",
      "before": null,
      "after": "aaf3384067f2429a0b8b0b074408cb1518cf4eeda3a99cea523923569b54e38b"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/title-bar.tsx",
      "before": "715e57f5f2ec45545d9d10f340becbb4b2a755ea7b4c0056c5fde795ed81d5dd",
      "after": "0df735f907a0475f6de53c2f45481fc4b375062fc6c61700f6f087944a04f87f"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/chrome/workspace-chrome.css",
      "before": "b569c881b832ef7cfbfc0ab412183149098c372eb92c20b8bdfd63f022a63d17",
      "after": "aa33ef2bf485bfaace011dbc5ca9583cd733c55998dd1f774f99b193bf3b5896"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/dependencies.json",
      "before": "8807aa101afed48b2ff6ef1eb3b7fe75e14481e79bb20763bb96c88ab0dddf10",
      "after": "6b99a8cd1bb80f222e8e37a3ef7f343126aea1f6ade3af1ff6fa77f40fc500ec"
    },
    {
      "path": "packages/talkdesk-cobalt/test/chrome-layout.test.mjs",
      "before": "0c0a964b7333af539620f2a37703015736cb739fd95a510c2b7c169d7465dc08",
      "after": "7a8315930bad6f875404d572523d94799c20bb4b54b39fe0cd0e2a1fc674c9b4"
    },
    {
      "path": "packages/talkdesk-cobalt/test/titlebar-theme-browser.test.mjs",
      "before": null,
      "after": "d275a6febf4fd88b8ea8bd3bf31866163e36d216ba11c3e70abd00481f96e24a"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "f6a45837b0ea880d2eecc32f62de4d3aa08d62b9fedaf3d285687ee3ff11cc56",
      "after": "f3e31263ea316c0817b532b6120dafcb4901c786af0448e3abfc801b69154b07"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-shell-adapter.mjs",
      "before": "a36e86316a26497ced7a7a5cbcdfcc2884501f341be7f9961a54bf15df14550e",
      "after": "96f7dc40db4f725d090307b3e7f3cad8bde27bea56aa45e0c64ca4c0e285dcb5"
    }
  ]
}
```

Completed-At: 2026-11-15T02:48:38.203500+00:00

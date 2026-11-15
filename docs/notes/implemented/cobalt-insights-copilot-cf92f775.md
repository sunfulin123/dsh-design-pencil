# Add native Insights split actions and source-template Copilot chat panel

Record-Version: 2
Task-ID: cf92f775-bb0f-4277-bf81-60e5dd171e14
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T05:10:41.886852+00:00
Type: feature
Status: complete

## Context

Add native Insights split actions and source-template Copilot chat panel

## Changes

Added native SplitButton export actions, a chevron_down secondary button and the real Cobalt Popover composition in recipes/support/insights-header-actions.tsx. CSV/JSON exports contain the local sample summary. Ask Copilot opens a Cobalt ModalPanel with ChatBubble, a scrollable conversation and a fixed Textarea composer. Enter sends, Shift+Enter inserts a newline, and composition events protect IME input. Replies are deterministic local samples; no model connection or credentials are introduced.

Updated recipe catalog, source indexes, module guidance, Cobalt style data, SS packaged-helper assertions and the existing SS owner docs/Agent Note. Official Popover 1.2.1 and ChatBubble 2.2.5 are installed, pinned in the maintainer manifest/lockfile and declared in prototype dependencies. Upstream inputs are untouched.

## Validation

- Before implementation, insights-copilot-browser.test.mjs failed on the previous built recipe because Export insights actions was absent.
- Private registry installation initially failed; after the user's VPN retry, bun install passed and updated the lockfile with the real official packages. No shims or substitute implementations were used.
- `bun run docs:build`: PASS, strict docs/examples, demo bundle and 276 Astro routes.
- `node --test test/insights-copilot-browser.test.mjs test/insights-controls-browser.test.mjs test/insights-browser.test.mjs`: PASS, 6/6. Native CSV/JSON download content, keyboard dismissal/focus, Enter/Shift+Enter, 120-character limit, both schemes, 360/390/640/1024/1440 widths and existing chart/filter controls.
- `node --test test/export.test.mjs`: PASS, 3/3; `node tools/build-skill.mjs`: PASS. SS stage-local-runtime.mjs exports and verifies the current source payload.
- Fresh project created using SS's staged helper: `pnpm install`, `pnpm exec tsc --noEmit` and `pnpm run build` PASS. The final keyboard repair was copied from the staged SS resource into this disposable fixture and rebuilt.
- `SYNAPSE_COBALT_TEST_PROJECT=<generated-project> node --test test/insights-workspace-browser.test.mjs`: PASS, 1/1, real shell navigation into Insights, light/dark propagation, 1440/390 windows, in-frame chat and native Popover. Its first run exposed an input Escape regression; the fixed handler calls React Aria continuePropagation for unhandled keys, leaving dismissal to ModalPanel.
- `SYNAPSE_INSIGHTS_REVIEW_URL=<generated-app-frame> node --test test/insights-copilot-browser.test.mjs`: PASS, 1/1; no page errors. Rendered artifacts are /private/tmp/cobalt-insights-workspace-{scheme}-{width}.png and /private/tmp/cobalt-insights-copilot-{scheme}-{width}.png.
- SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS, 1/1. SS Design plugin build, desktop build, focused helper-test ESLint and pnpm run doc-check: PASS. No SS Host/Client/IPC or Electron interaction contract changed; Electron E2E was not selected for this source-template change.
- Focused vet reviews for native API compatibility, visual layout, semantic theme/icon and keyboard fixes: PASS, no issues found.
- `git diff --check HEAD`: PASS. The live published URL was also tested with `SYNAPSE_INSIGHTS_REVIEW_URL=http://127.0.0.1:57481/?frame=app&app=admin&page=insights node --test test/insights-copilot-browser.test.mjs`: PASS, 1/1. `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task cf92f775-bb0f-4277-bf81-60e5dd171e14`: PASS, including 500-effective-line/source and knowledge checks; non-blocking existing warnings remain visible.

Browser acceptance waits for native panel travel and focus restoration before measuring. Visual inspection corrected native Flex's full-row default width, dynamic CSS precedence on the panel and semantic dark-theme heading colors. ChatBubble content uses Cobalt Flex padding. ECharts redraws when the theme stylesheet loads so the first frame uses resolved theme tokens.

The same review URL, http://127.0.0.1:57481/, serves the updated SS-generated delivery. Earlier failed candidates and the previous verified delivery are private disposable artifacts; authored user projects are not overwritten.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record native Insights export and local Copilot source-template behavior without implying a live assistant.",
      "sha256": "59851e03022b7ff51650fb1f5185ca399d19a466edbc6384f5bd310a91c8caef"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record copied support dependencies, dynamic Cobalt CSS allocation, theme-load rendering and React Aria unhandled-key propagation confirmed in Workspace.",
      "sha256": "058f52ff4a02ecd048d866d5ca92a64a844f2234c4de04571e249656d2da95bd"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "The feature remains within existing source-copy, native-component and rendered-validation rules; no engineering policy changes.",
      "sha256": "15b9fdfe2e25b2e62baadd888b09a4e53139a262ab3354bc72d7efbcbbddaebc"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Conversation and exported metrics are local samples, not a connected AI service or live analytics. Production integrations must supply authorized data/services. Source templates, recipe guides, generated AI indexes, Cobalt style guidance and SS's packaged runtime are synchronized. Cobalt and Atlas upstream snapshots remain unchanged. Existing projects are not automatically migrated. No commit, push or generated E2E/Cucumber operation document is introduced. Existing Vite chunk-size and non-blocking lint/build warnings remain visible.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "4c3a135c995685d9307dcb320929724306599cca562460bccced1ee0e57b19d0",
      "after": "59851e03022b7ff51650fb1f5185ca399d19a466edbc6384f5bd310a91c8caef"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "978242afbe36af81042d7b5980d3479e19928acf40d7b3471b685d551fe1b3bc",
      "after": "058f52ff4a02ecd048d866d5ca92a64a844f2234c4de04571e249656d2da95bd"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "f869f5c74b16f0f9b0725106cc99455e67bf615d0c806dc1896c2bfef4a45cd4",
      "after": "15b9fdfe2e25b2e62baadd888b09a4e53139a262ab3354bc72d7efbcbbddaebc"
    },
    {
      "path": "packages/bun.lock",
      "before": "2d7953e0e1109d4f033a06a941fb86f833e940c20c06243811686698cba7f597",
      "after": "6aca3b33570a214f1be840285747ab2a479e3b6f3c630d553b28b10b2baf6297"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "6c601b3ab7ca2a4c40b6cf242e4bd59bcea625aba940958564838ed07bda6e3a",
      "after": "f7526d09b42da0d52c815ad1794ce43b0b65be210d93d08da93715e6f392771a"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "aab2e4fee5328af69ef38bf5999a102f05e0173e176be75706ac976859093671",
      "after": "e105ea695852aab14a8cef7bbfea1b770f63b9a804b144b1230c60ac8e02d8e7"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "e869e80d0ada5e6ab53a9402bab1dc3b162bead014cfa072dddf177ccc22453b",
      "after": "6cdcc76670fb46c8c7313d84eacbb31e7787628925c8880a0c7c303e0b718eb8"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "8aa8a395f63f0fc04adba617a159ce808a33e9ec9a12cbcc2820a02b8903dc65",
      "after": "d8d2383902a35b06ff6465becbb3de4e521534af0f13347ab4a8a5e7994eb977"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": "76b48643476620cf00c293104256b4202c7b84ca08f0f511fbdd0f13adcf4398",
      "after": "85c72ea4074095586752e04b25a63efb246d092d7fd26d7b5eca1841d68e1d30"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.tsx",
      "before": "e539f144b3d263c5cc91c5d271558a8180967dc9251d91e6c67030d56362fb91",
      "after": "d3e39d9b596d3464f8edeb88505d7f5264fe8b266627a1f3e605692ae44cc5a7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-chart.tsx",
      "before": "8f0b6cb00e3d6077972b35090725b3e7dc86882bb8748f63f3402ad896dc1450",
      "after": "2279717f64e05912ea6c73229645c34c712f875589a788dadf48f15ed6dee3f6"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-copilot.tsx",
      "before": null,
      "after": "bcbe62b23b676e7ae3668da222dcb57b453f56ea3cf04ae6ed0a0ffd33a6d3da"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-header-actions.tsx",
      "before": null,
      "after": "8b50d8840718f0d4b9739d47288aa067e7c9ed852317ae2228730bdc44e93a72"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights.css",
      "before": "8468755267cc3675c06c97c2793ec886f4aaed7df64011a6c7ab73e4ebce8c7f",
      "after": "a6e724df6a18ef8f7b1143e136a51121a4ab130d5a0f9193e3f07f8779d99ce4"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "54c8448513fe7afd9a3b85435a778dfc68f866ba861b24cabbcfe64294002b8a",
      "after": "03d656ac31b0e1a25c3229b54dd0a418a44627650ba4caab605d845d3ded5d47"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "bed63c712d52cbbe6d85542e4f1d821c4c366debea147e341faf27f515684868",
      "after": "f91b5c4ab03f1319437a3fbb6595d475591a1d5d131a2197272c9c06222704ce"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/dependencies.json",
      "before": "a1eaa0225e41d23acb892765a8a77446d2de5889d76a45c63c02d2627c1a4273",
      "after": "89d32cce0f1137d7b212cf8fdec588c3af7ac724cdfe43fd42b7ec910f321fc6"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-copilot-browser.test.mjs",
      "before": null,
      "after": "a98e8539b969046fc0493d6f65325c52df2bdfbc211c8ece201769f8d839e187"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-workspace-browser.test.mjs",
      "before": null,
      "after": "d28d60a6ea76ea36e9eea76dbbc728f2d44e5e5c7a2c913798b27707a4a73205"
    }
  ]
}
```

Completed-At: 2026-11-15T05:53:39.064218+00:00

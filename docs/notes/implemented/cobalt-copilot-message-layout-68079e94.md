# Align sent Copilot bubbles to the right and place transparent Ask action before export

Record-Version: 2
Task-ID: 68079e94-7533-4fbe-80c0-dfe16c257fd7
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T05:56:32.001524+00:00
Type: fix-bug
Status: complete

## Context

Align sent Copilot bubbles to the right and place transparent Ask action before export

## Changes

Sent messages use a non-growing, auto-width content column, right alignment and a trailing native tiny Cobalt Avatar. The metadata and bubble share their right edge; bot messages remain left-aligned. ChatBubble keeps native colors while long words and newlines fit its bounded content area.

Ask Copilot precedes the Export SplitButton in DOM/tab order and uses native variation="transparent". Removed the owned resting background override. Updated recipe integration/composition, generated AI references, module/companion and Cobalt style guidance; SS runtime staging exports the same sources. SS's owner README and Agent Note remain accurate: its public/helper/Host/Client contracts are unchanged, so no duplicate SS document delta is added.

## Validation

- Initial `node --test test/insights-copilot-browser.test.mjs`: FAIL on the old built recipe, because Ask Copilot followed Export.
- `bun run docs:build`: PASS, strict docs/example checks, demos and 276 Astro routes.
- `node --test test/insights-copilot-browser.test.mjs`: PASS on the maintained demo, including intrinsic short sent-message width, right-side avatar, action order/transparent background, existing keyboard/download paths, light/dark and 360/390/640/1024/1440 widths. Actual SS fixture acceptance additionally checks long unbroken text.
- `node --test test/export.test.mjs`: PASS, 3/3 source-template and project export tests.
- SS `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <design-worktree>` and `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS.
- A fresh SS-generated project uses the staged helper, `pnpm install --offline`, `pnpm exec tsc --noEmit` and `pnpm run build`: PASS.
- `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: PASS; existing non-blocking build warnings remain.
- Focused `vet` source review: PASS, no issues found. Rendered screenshot inspection confirms short right bubbles and the transparent action before Export.

- `SYNAPSE_INSIGHTS_REVIEW_URL=<generated-app-frame> SYNAPSE_COBALT_TEST_PROJECT=<fresh-project> node --test test/insights-copilot-browser.test.mjs test/insights-workspace-browser.test.mjs`: PASS, 2/2. Actual pnpm-generated app and complete Workspace navigation/theme integration; long unbroken sent text wraps inside the transcript.
- `SYNAPSE_INSIGHTS_REVIEW_URL=http://127.0.0.1:57481/?frame=app&app=admin&page=insights node --test test/insights-copilot-browser.test.mjs`: PASS, 1/1 after publishing the updated delivery. The same review URL returns HTTP 200.
- `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 68079e94-7533-4fbe-80c0-dfe16c257fd7`: PASS, including source size, knowledge and task evidence; existing warnings remain visible.
- `git diff --check HEAD`: PASS in Design and SS.

Actual prototype metadata is /private/tmp/ss-copilot-message-layout.json. Screenshots under /private/tmp/cobalt-insights-copilot-{scheme}-{width}.png show short sent messages on the right with native avatars; /private/tmp/cobalt-insights-export-light.png confirms the transparent Ask action before Export. Browser interactions also preserve native overlay dismissal and focus return. SS owner docs and Electron tests were not changed because the public plugin and Electron contracts are unaffected; the packaged helper and actual Workspace iframe are the acceptance path.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Correct sent-message alignment and native transparent Ask/Export order in copied Insights templates.",
      "sha256": "8fde3c4b2f655cd540704525a81c0c463bc47d9722d34d52f2fce8f2de9b057f"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record non-growing message columns and native transparent-action styling instead of full-row stretching and local fill.",
      "sha256": "e06195bf530aa176d0a2d63e76e91fd75f42af8db4b138b5891ef506c872ec43"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Existing Cobalt source reuse and rendered geometry rules cover this local layout correction; no engineering policy changes.",
      "sha256": "3015579a141c8a2e7c737057703fc61ca04b43dd6fe1e59938d3ab411835db5c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

No upstream Cobalt/Atlas edits, commit or push. Conversation replies/export data remain local samples. The generated project is disposable and does not overwrite authored user projects. Source reuse stays local-copy based; no Extensions package installation or compatibility layer is introduced. Native keyboard dismissal and IME handling are retained.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "59851e03022b7ff51650fb1f5185ca399d19a466edbc6384f5bd310a91c8caef",
      "after": "8fde3c4b2f655cd540704525a81c0c463bc47d9722d34d52f2fce8f2de9b057f"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "058f52ff4a02ecd048d866d5ca92a64a844f2234c4de04571e249656d2da95bd",
      "after": "e06195bf530aa176d0a2d63e76e91fd75f42af8db4b138b5891ef506c872ec43"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "15b9fdfe2e25b2e62baadd888b09a4e53139a262ab3354bc72d7efbcbbddaebc",
      "after": "3015579a141c8a2e7c737057703fc61ca04b43dd6fe1e59938d3ab411835db5c"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "f7526d09b42da0d52c815ad1794ce43b0b65be210d93d08da93715e6f392771a",
      "after": "62f262b5ce59aff19def2699825a39465326158e68065950f2e5125df35b6bc1"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "e105ea695852aab14a8cef7bbfea1b770f63b9a804b144b1230c60ac8e02d8e7",
      "after": "f13bd2797127d05a257b47b974a38355a5fd4aa0de7ad26817e32ace902506b1"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "d8d2383902a35b06ff6465becbb3de4e521534af0f13347ab4a8a5e7994eb977",
      "after": "2b74b7a5c70d650b0d0ee664a793e00750881d2c4205f09d20adde97ea0ccf74"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": "85c72ea4074095586752e04b25a63efb246d092d7fd26d7b5eca1841d68e1d30",
      "after": "28f3c88af0763c770f1767d77baf357fc8d02293af05cfd270bc568801dff71a"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-copilot.tsx",
      "before": "bcbe62b23b676e7ae3668da222dcb57b453f56ea3cf04ae6ed0a0ffd33a6d3da",
      "after": "85f568c8bd89560cc3aff942c005ed1f5640f0d73fcf5cb733c26ac73475e990"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-header-actions.tsx",
      "before": "8b50d8840718f0d4b9739d47288aa067e7c9ed852317ae2228730bdc44e93a72",
      "after": "e613b63146775c88b6b85c36fc3aefe7c316c206a323766234c5ba159c998f6f"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights.css",
      "before": "a6e724df6a18ef8f7b1143e136a51121a4ab130d5a0f9193e3f07f8779d99ce4",
      "after": "a869bcfd99145b00873397b2d80d6a36f7bee7fc6d0f9402d24504ed66981564"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "f91b5c4ab03f1319437a3fbb6595d475591a1d5d131a2197272c9c06222704ce",
      "after": "a4d2b5f0b1ec74199f0e513432529004112b982894c85300cdb246a0931df872"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-copilot-browser.test.mjs",
      "before": "a98e8539b969046fc0493d6f65325c52df2bdfbc211c8ece201769f8d839e187",
      "after": "0b1a3481d50a4e405f01f32b421585bbab09e2eae12542c735bd240878c1d896"
    }
  ]
}
```

Completed-At: 2026-11-15T06:06:30.531044+00:00

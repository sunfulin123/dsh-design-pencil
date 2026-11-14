# Implement responsive owned prototype controls with accessible locators and executable review scenarios

Record-Version: 2
Task-ID: 85e6cd92-249b-45ed-bb7f-c5d6b04554c7
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T16:29:12.302076+00:00
Type: feature
Status: complete

## Context

Implement responsive owned prototype controls with accessible locators and executable review scenarios

## Changes

Owned review-toolbar/review-dropdown templates replace the copied PrototypeBar through a re-export adapter. The upstream snapshot remains unchanged. The review chrome provides three dropdowns for dimensions, page state and Feature flags, viewport-clamped non-modal panels, native buttons and switches, visible focus, Escape/outside/Tab-out dismissal and focus restoration. Compact widths hide secondary labels/readout while retaining a 56px row, 44px trigger targets and current values. Its semantic neutral palette follows the shell's light/dark scheme independently of business frames.

All triggers, panels, close buttons, options, switches, counts and reset actions expose stable prototype-* test IDs and accessible names; current values are associated through aria-describedby. The companion documents these locators. Existing SS browser tests use the dropdown entry before locating options. The scenario message channel remains unchanged; the business frame exposes a data-prototype-scenario attribute for delivery diagnosis, while visible business-state assertions remain required.

The user narrowed scope before E2E authoring resources were added. No generated E2E/Cucumber documentation, locator manifest or Playwright scaffold is included. Repository-owned acceptance tests verify this UI; runtime companion/README and SS resources describe the current controls.

## Validation

Fresh generated Quality Center/Users project passes pnpm install and pnpm run build. A targeted pnpm exec tsc --noEmit check of review-toolbar.tsx and imported modules passes with React JSX, ES2022, bundler resolution and skipLibCheck.

`SYNAPSE_COBALT_TEST_PROJECT=<fresh-project> node --test test/review-toolbar-browser.test.mjs`: PASS, one real Chromium acceptance scenario covering all seven size presets, all six scenarios (including visible loading/empty/error/partial/permission results), all eight flag switches, expanded-Dock effect, reset-flags/reset-prototype behavior, keyboard Enter/Escape and focus return. Light/dark screenshots at 320/390/768/1024/1440 were captured; toolbar height is 56px without horizontal overflow and all three panels remain within the viewport. Desktop/narrow light and narrow dark screenshots were inspected.

`node --test test/export.test.mjs test/wfm-upgrade.test.mjs`: PASS, 6 tests covering deterministic source exports, copied templates and unchanged WFM provenance. `node --test packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs packages/dsh-node-runtime/package.test.mjs`: PASS, 9 tests covering guidance, shell creation, immutable source hashes and actual staged runtime startup. No Rust or protocol change requires a WASM rebuild.

`node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm --filter @synapse-studio/ss-dsh-design build`, `pnpm --filter synapse-studio build` and `pnpm run doc-check` in SS: PASS. The packaged helper confirms owned toolbar/redirection and accessibility resources. Final byte comparison confirms all four toolbar/scenario templates in SS match current authoring source and locator guidance is staged.

`bash tools/check-maintenance.sh --lint-js --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 85e6cd92-249b-45ed-bb7f-c5d6b04554c7`: PASS, source cap, maintenance tests, knowledge/task receipts and lint with warnings only. `git diff --check`: PASS.

`vet --agentic --agent-harness codex --max-spend 1` cannot review the aggregate uncommitted input: 14,308,937 characters exceed the agent's 1,048,576-character maximum. No passing vet review is claimed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Document owned responsive prototype controls and their accessible stable locators without changing business-page ownership.",
      "sha256": "5aaea432b6a429fc6a3a0819883c55cefdbbe910c0b843e2f9c354aba73e84e7"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record owned review toolbar templates and copy-only shell redirection through the existing runtime export boundary.",
      "sha256": "1adadccf2f8382f273362f698c8f28290b5bed2a3641465b481c186e971828dc"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Keep existing ownership, real rendered validation and task maintenance rules; no engineering policy is changed.",
      "sha256": "6e220076032e562532b7d887c03b971fa12d1b57652770a355946a5b7ca7e2ca"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Newly generated projects receive the updated controls; authored projects are not overwritten. Private Cobalt registry/CDN requirements, legacy peer warnings and Vite bundle warnings remain. The business frame's scenario receipt does not replace reviewing its actual UI. User-directed E2E documentation is deferred. No upstream edits, commit, push or release are performed; SS live-model acceptance remains the user's next step.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "b0ac091ba2d1e6556deb1d66215466b9cd2ce94254a6dd7f3730ef2815202881",
      "after": "5aaea432b6a429fc6a3a0819883c55cefdbbe910c0b843e2f9c354aba73e84e7"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "cd0f57e2e1a5cee29df594e94fb1d67d9ce986d2569fc6ef18e38037227b6088",
      "after": "1adadccf2f8382f273362f698c8f28290b5bed2a3641465b481c186e971828dc"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "8cabd5bcd199c7977635928384a51e848de12a30014dc00950f07b8c5c8c4436",
      "after": "6e220076032e562532b7d887c03b971fa12d1b57652770a355946a5b7ca7e2ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-scaffold.test.mjs",
      "before": "7bb04cbdca639b1bf77fd54ea008f28dd13f2a1d4b984087b07de8d99f185b63",
      "after": "aeaf343b04cbe2837b922310a9b94bee6c83c3e3533a6dc59b259d1be8259192"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "d6bb32fdfebfe95ec749d0f9e55e8114e848e64cb75be842d5fef86fe63b3744",
      "after": "0ab290aea53f2f7cae20e54f64953bb6051efd3276624a84be88fcaa6cc9db5e"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "0ac61a821bb9b299fa3f178276040175bd8b15931b5450ed3d14350f8039c70b",
      "after": "09669bd9d0decf06036b920e321d51ab5b55624f2267b5b902a46344c392e5f8"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-dropdown.tsx",
      "before": null,
      "after": "8ab23a0a5bf192124c993f73a24e50b702cf0b5a0bf200965914c3b885f31caa"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.css",
      "before": null,
      "after": "a2b5e7a5d6bd7c6f96c456d5600245be2cd74135e791a8872952705916f92e63"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.tsx",
      "before": null,
      "after": "409faa48d1c355958e8c7fc4fab0bf26bc045b73d76779b14993f2dd75d12cd7"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/scenarios.tsx",
      "before": "c32944899ec78ff503586ad7e7b6b67e33a801e18b04f05a55100c042594634f",
      "after": "3607f40040ff9d7caa33c497a08f21216b5e98b5e4ee656927c3fa8cad050658"
    },
    {
      "path": "packages/talkdesk-cobalt/test/review-toolbar-browser.test.mjs",
      "before": null,
      "after": "8ef8529a8dc1f0b82557179fe134641558bba7c85e9609364eb6b1702da798e7"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "edc3b0202656542e6ad4c3c6d4becf5e1be62ed7bb896a029b2ad94d92ce441f",
      "after": "e0980b2fa2359a407159f50c724ee9bc30e36921721f269965368121d0ab20f9"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-shell-adapter.mjs",
      "before": "abfb29bebee8042cef3b5e5f45b898ac093f111f2f6b3f6b1cd879c694e836d9",
      "after": "14130d4715004b1cf4018eb49e076ae17f313a2d0904e08fd99460fba03630eb"
    }
  ]
}
```

Completed-At: 2026-11-14T16:40:43.368678+00:00

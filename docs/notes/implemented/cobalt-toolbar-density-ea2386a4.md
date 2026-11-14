# Match approved toolbar density, remove Prototype branding and preserve accessible controls

Record-Version: 2
Task-ID: ea2386a4-cf6f-4315-82a5-86038c94bdf9
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T16:43:16.269669+00:00
Type: fix-bug
Status: complete

## Context

Match approved toolbar density, remove Prototype branding and preserve accessible controls

## Changes

The owned toolbar removes the leading Prototype wordmark, its independent monitor icon and unused brand styles. The Size selector retains its meaningful device icon. Desktop trigger/reset height is 36px within the existing 56px bar; narrow screens retain 44px touch controls. The flags count uses a quiet badge, selected values are semibold, chevrons/reset use consistent stroke icons, and desktop option rows are 40px. Flags helper text is limited to the first two rows, and narrow flag panels scroll within a 420px height cap. Semantic light/dark palette, stable names/test IDs, keyboard handling and business content remain owned by the same modules.

The runtime companion and module README record the density contract. The SS packaged-helper test rejects leading brand markup and verifies 36px desktop CSS. No upstream source or generated E2E documentation is changed.

## Validation

`SYNAPSE_COBALT_TEST_PROJECT=<project> node --test test/review-toolbar-browser.test.mjs` fails before the fix because the leading review-brand node exists. After copying the three updated owned toolbar files and running `pnpm run build`, it passes: all presets/scenarios/flags and resets, accessible controls, keyboard focus, light/dark and 320/390/768/1024/1440 viewport/panel geometry. New assertions require no brand node and exact 36px desktop / 44px narrow trigger heights. Updated desktop and narrow screenshots are inspected against the approved mockup. Inspection of the open Flags panel caught narrow count-badge truncation; narrow triggers now use smaller internal spacing and an unboxed count. Assertions require all three default selected values to remain unclipped at every tested width.

The generated project's targeted `pnpm exec tsc --noEmit` check covers review-toolbar.tsx and its imports using React JSX, ES2022 and bundler resolution.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The existing product contract already describes responsive named controls; trigger density and branding are runtime presentation details.",
      "sha256": "1c4998152cab61bd6442afdb3fe0188e0f71ca6f80105dd2e3484556cec085fe"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Specify brand-free review chrome and separate desktop and narrow trigger dimensions in the owned template contract.",
      "sha256": "5eabba106c4e1e6b0c415a3454bbb875d48ad5810f55e2840f27b620fd7c0c7a"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Preserve source ownership, regression evidence and maintenance requirements without a policy change.",
      "sha256": "ac51fc4b6f139c932bf2b5ab21ee3e15e7585bd05a078297f7983322ca0fd53d"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Only owned templates and adapters are changed. Existing authored projects are not overwritten; SS new-project acceptance follows restart. No E2E/Cucumber documentation, upstream edit, commit, push or release is included.

## Verification scope

SS packaged-helper creation, plugin/desktop builds and doc-check pass. The helper rejects brand markup and asserts 36px CSS. A final stage after the narrow badge adjustment publishes the current CSS. Source cap, maintenance checks and JS lint pass with warnings only. Vet is not rerun because the known aggregate-input limit remains blocked (14MB of existing uncommitted context against a 1MB maximum); no automated review result is claimed. SS README and existing Agent Note already describe responsive owned controls without imposing branding or trigger dimensions, so no further SS prose change is needed.

`node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/cobalt-design-quality/dsh-design-pencil-cobalt`, `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm --filter @synapse-studio/ss-dsh-design build` and `pnpm --filter synapse-studio build`: PASS after the final CSS consolidation. `pnpm run doc-check`: PASS. Byte comparison verifies all three staged owned toolbar files match source. `bash tools/check-maintenance.sh --lint-js --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task ea2386a4-cf6f-4315-82a5-86038c94bdf9`: PASS with warnings only. `git diff --check`: PASS.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "5aaea432b6a429fc6a3a0819883c55cefdbbe910c0b843e2f9c354aba73e84e7",
      "after": "1c4998152cab61bd6442afdb3fe0188e0f71ca6f80105dd2e3484556cec085fe"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "1adadccf2f8382f273362f698c8f28290b5bed2a3641465b481c186e971828dc",
      "after": "5eabba106c4e1e6b0c415a3454bbb875d48ad5810f55e2840f27b620fd7c0c7a"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "6e220076032e562532b7d887c03b971fa12d1b57652770a355946a5b7ca7e2ca",
      "after": "ac51fc4b6f139c932bf2b5ab21ee3e15e7585bd05a078297f7983322ca0fd53d"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "0ab290aea53f2f7cae20e54f64953bb6051efd3276624a84be88fcaa6cc9db5e",
      "after": "b44d96f74d46fea4c947f1de648f15893235dbf7267a0a333f0996cdb250e52f"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "09669bd9d0decf06036b920e321d51ab5b55624f2267b5b902a46344c392e5f8",
      "after": "93a63c8b297ae933490c091bd3d75a9b232c6c4c3ac465eebb3394d8dcb843a0"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-dropdown.tsx",
      "before": "8ab23a0a5bf192124c993f73a24e50b702cf0b5a0bf200965914c3b885f31caa",
      "after": "31847ab3b40da018563777777b89760ebc82e8a9997cf00fd4da4d4da343dc44"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.css",
      "before": "a2b5e7a5d6bd7c6f96c456d5600245be2cd74135e791a8872952705916f92e63",
      "after": "d14f9a367329aaffb35531c4ae6d6ea4667fa6158fe8317564ec171014729e19"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/review-toolbar.tsx",
      "before": "409faa48d1c355958e8c7fc4fab0bf26bc045b73d76779b14993f2dd75d12cd7",
      "after": "9412192b92479fa71c4bc5ddd30b33941525f99a99c8768046003c02cb85e973"
    },
    {
      "path": "packages/talkdesk-cobalt/test/review-toolbar-browser.test.mjs",
      "before": "8ef8529a8dc1f0b82557179fe134641558bba7c85e9609364eb6b1702da798e7",
      "after": "11597f7316de578f15f9195893e7f47f39474e4fa7dc2b50e65db60b7c49ce2e"
    }
  ]
}
```

Completed-At: 2026-11-14T16:51:12.641387+00:00

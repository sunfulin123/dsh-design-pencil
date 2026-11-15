# Tighten Users title and description using Cobalt typography scale and spacing tokens

Record-Version: 2
Task-ID: 05a635f4-79dd-4cc5-b489-5e7f2abe58e1
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T04:34:58.153998+00:00
Type: fix-bug
Status: complete

## Context

Tighten Users title and description using Cobalt typography scale and spacing tokens

## Changes

The compact Users header forwards an optional native Cobalt heading scale through copied Extensions Typography. Users selects medium (24px font/32px line-height), with the body description in a Cobalt Flex gap 0 stack. The title keeps h1 semantics; other Typography consumers retain their configured defaults. There are no negative margins, clipped line boxes or custom font-size overrides.

Updated component MDX, recipe/source guidance, style data and SS's packaged-header assertion. This applies design-taste-frontend's grouping, hierarchy and rendered-review methods to the existing Cobalt enterprise header; the user's Cobalt constraints own its typography and palette. No new marketing page, hero, asset deal or whole-page restyling is introduced.

## Validation

- `node --test --test-name-pattern='heading and description' test/users-header-filters-browser.test.mjs`: initial FAIL, actual 28px/40px versus requested compact 24px/32px.
- `bun run docs:build`: PASS, strict docs/example checks and 276 Astro routes.
- `node --test test/users-header-filters-browser.test.mjs`: PASS, 5/5; compact scale, text-box separation at most 2.5px, filter/layout regressions and light/dark at 360/640/1024/1440.
- `node --test test/export.test.mjs`: PASS, 3/3 source-template export tests.
- `node tools/build-skill.mjs`: PASS.
- SS `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <design-worktree>` and `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS.
- `vet` focused compact-heading review: PASS, no issues found.
- Fresh project generated through the staged SS helper: pnpm install, TypeScript check and Vite build PASS; delivery refreshed at the existing review URL.
- Actual SS-generated preview: Users browser suite PASS 5/5, including both schemes and 360/640/1024/1440 widths; full-shell list viewport regression PASS 1/1.
- SS plugin build, desktop build, focused helper-test ESLint and doc-check: PASS.
- `check-maintenance.sh --lint-js` against the recorded base and task: PASS, with non-blocking existing warnings.

Not run: the skill's marketing-page deal/hero/full-site gate; this request changes an existing Cobalt component composition only. Its palette, marketing sections and asset rules do not replace the user's Cobalt design system. Real rendered checks use the repository's browser regression suite against maintained demos and the SS-generated prototype.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Verify compact Users typography and grouping through native Cobalt scale and source-template reuse.",
      "sha256": "4c3a135c995685d9307dcb320929724306599cca562460bccced1ee0e57b19d0"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record native heading line-height as part of visible spacing evidence, separate from nominal Flex gap; no engine or transport changes.",
      "sha256": "978242afbe36af81042d7b5980d3479e19928acf40d7b3471b685d551fe1b3bc"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "This is a bounded typography repair under existing source reuse and rendered verification rules.",
      "sha256": "f869f5c74b16f0f9b0725106cc99455e67bf615d0c806dc1896c2bfef4a45cd4"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Only owned source templates and SS integration are changed; Cobalt/Atlas upstream inputs stay immutable. No commit or push is performed. Existing authored user projects are not overwritten. The existing review URL serves a disposable SS-generated project. No generated E2E/Cucumber operation documentation is added. The optional heading scale is ignored for body variants; native Cobalt CSS owns dimensions and states. Non-blocking Vite/lint warnings remain visible.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "49eab80f6e6e566eabb9b9b1c1dfa6db4423716db5ced9f6c801133c72a53028",
      "after": "4c3a135c995685d9307dcb320929724306599cca562460bccced1ee0e57b19d0"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "b1ed5ce1a18b041733e441b9aa0f860137fda47e404097b10df681cc73eadef4",
      "after": "978242afbe36af81042d7b5980d3479e19928acf40d7b3471b685d551fe1b3bc"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "5e8e5b517c784ce3678fca739abc06a124b886c05c1bb666815f72fc9a4be30e",
      "after": "f869f5c74b16f0f9b0725106cc99455e67bf615d0c806dc1896c2bfef4a45cd4"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "7dd5681a4047c960c4f81fd86d20aef22307b214268968be314778f992f4f775",
      "after": "6c601b3ab7ca2a4c40b6cf242e4bd59bcea625aba940958564838ed07bda6e3a"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "b4542f914cd9d09efe51edcdb1cbf7587229e0137dcca060535c78ff9a8b00f8",
      "after": "aab2e4fee5328af69ef38bf5999a102f05e0173e176be75706ac976859093671"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/typography/typography.tsx",
      "before": "211ea58573c086e38dd0aa3995789b13deac8e15ad136b8cc11f082ca940ec24",
      "after": "1e0f0873e4fc6618cfd2148dca55c3f6766d4e616c04423005933b04f16575c8"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/typography.mdx",
      "before": "3c8248e18b4ae6659bf05655326897d729d81726836b5a5b53a32a79f9316ea7",
      "after": "1949cf5bb3cb9ef1b84e3c2b29fb7c75934412c250fb61d21f9cc0b1f86b1627"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "c9012d70bbc9d9657b69d23064afb3789932a759f46c5e27dd2eead9febe1096",
      "after": "8aa8a395f63f0fc04adba617a159ce808a33e9ec9a12cbcc2820a02b8903dc65"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "446eefde88acf1437f423add3b84a9fa3b15bc72557d17ad49e2fd32b54339f1",
      "after": "8d71bf9aed9f970a0986eb4837f70816cad4c867dd362611e51f69707593c6c7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-page-header.tsx",
      "before": "0fe926d1a1f3b5e1fe172435ecdf57c755a6cf5b89673f0c9de5a316b1920e3a",
      "after": "146c7dd32c570274834449e4a2cc4f33b5409a1b76ac3d3735454766c6170bb4"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "6a244ef6a3260c5a09037757ad34997aadbe177ead27523d37b08baaaeec206b",
      "after": "bed63c712d52cbbe6d85542e4f1d821c4c366debea147e341faf27f515684868"
    },
    {
      "path": "packages/talkdesk-cobalt/test/users-header-filters-browser.test.mjs",
      "before": "94c2f5203874bd3bf5004d4d8455cd1354eb5def01f35e82635e09951d7f6629",
      "after": "5eeb41cf41c461aba6806ab40c650f3db718641037a15da4104252f8ad0537da"
    }
  ]
}
```

Completed-At: 2026-11-15T05:02:27.779710+00:00

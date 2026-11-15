# Use extension page-header semantics and correct Users filter trigger sizing and label/control spacing

Record-Version: 2
Task-ID: 7dfb2f72-3cee-4276-b2e4-19890b12d17f
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T04:07:04.579589+00:00
Type: fix-bug
Status: complete

## Context

Use extension page-header semantics and correct Users filter trigger sizing and label/control spacing

## Changes

Users already uses the copied AppPageHeader container; its title and description now also use copied Extensions Typography page-title/body roles. The inline Refresh action uses the native tiny size to keep the text block compact, while the title/description group remains vertically centered with the right actions.

Users Filters uses a medium 40px Button with a normal icon, centered with Search in the existing 48px marketplace Toolbar. Applied filter chips use medium 24px Tags. The reusable filter trigger defaults remain compact for Insights.

FormField restores a 20px line-height for direct controls and leaves 8px under the label/counter row. The reproduced checkbox has a 0px layout height because it inherits Box's zero line-height, letting its 20px painted checkbox extend over Activation. The shared fix prevents that collapse instead of adding local offset padding. Prefix/suffix InputGroup layout is retained.

Updated component MDX, recipe integration/composition, source indexes, style/Skill guidance and SS owner documentation, note and packaged-template assertions. Upstream snapshots remain unchanged.

## Validation

- `node --test test/users-header-filters-browser.test.mjs`: initial FAIL, 0/3 (title/description lack Extensions markers, Filters is 32px, Checkbox height is 0 and label gap is 4px). The applied-tag regression also initially fails at 20px versus 24px.
- `bun run docs:build`: PASS, strict docs/example checks, React demos and 276 Astro routes.
- `node --test test/users-header-filters-browser.test.mjs test/form-field-browser.test.mjs test/list-dialogs-browser.test.mjs test/insights-browser.test.mjs`: PASS, 8/8, including both schemes and 360/640/1024/1440 widths, title/description semantics and spacing, 40px search-aligned trigger, 24px tags, 20px checkbox height/8px label gap and existing Create/Import/Insights interactions.
- `node --test test/export.test.mjs test/wfm-upgrade.test.mjs test/chrome-layout.test.mjs`: PASS, 8 tests; original WFM/shell sources retain traceable hashes.
- `node tools/build-skill.mjs`: PASS.
- SS `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <design-worktree>` and `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs`: PASS.
- SS `pnpm run doc-check` and focused packaged-test ESLint: PASS.

Source review covers shared direct-control layout, preserved InputGroup behavior, local source reuse and unchanged Host/Client contracts. Browser geometry measures the actual Checkbox button rather than its hidden input.

Fresh SS-generated project `pnpm install`, `pnpm exec tsc --noEmit` and `pnpm run build`: PASS. SS plugin/desktop builds, helper test, doc-check and focused ESLint: PASS. `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task 7dfb2f72-3cee-4276-b2e4-19890b12d17f`: PASS with existing non-blocking warnings. Final `vet` review: PASS, no issues found. The existing preview URL serves the built SS-generated source rather than the authored documentation demo.

`SYNAPSE_USERS_REVIEW_URL='http://127.0.0.1:57481/?frame=app&app=admin&page=users&scheme=dark' node --test test/users-header-filters-browser.test.mjs`: PASS, 5/5 against the SS-built source. `SYNAPSE_COBALT_TEST_URL=http://127.0.0.1:57481 node --test test/list-viewport-browser.test.mjs`: PASS, full-shell iframe pagination, draft filter Cancel/Apply and header group-center checks. The browser screenshots show a real 20px checkbox with 8px separation and the copied header typography.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Verify Users extension typography, normal filter dimensions and shared FormField geometry after the reported visual defects.",
      "sha256": "49eab80f6e6e566eabb9b9b1c1dfa6db4423716db5ced9f6c801133c72a53028"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Record the verified Box zero-line-height/Checkbox paint-vs-layout invariant and the shared direct-control baseline correction; no runtime transport changes.",
      "sha256": "b1ed5ce1a18b041733e441b9aa0f860137fda47e404097b10df681cc73eadef4"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "This fix follows existing source reuse and numeric rendered review policy without changing development standards.",
      "sha256": "5e8e5b517c784ce3678fca739abc06a124b886c05c1bb666815f72fc9a4be30e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

No commit, push or upstream edits are performed. Existing user-authored projects are not automatically migrated. The disposable review prototype is updated at the existing loopback URL from the SS staged helper. Backend callbacks remain host-owned; local users and filters are sample prototype state. No Cucumber or generated E2E documentation is added. Native component/default-appearance assumptions are verified in rendered Chrome; Vite size and existing non-blocking lint/declaration warnings remain visible.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "4aac5243761e749bc2d7612fed9c89977eae86c8729c1aa35c7bdd41a416cb66",
      "after": "49eab80f6e6e566eabb9b9b1c1dfa6db4423716db5ced9f6c801133c72a53028"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "97a62fcb49a6e31181f4e84eb042c09fb0ccd7fba48cecd2250d2df631bf9344",
      "after": "b1ed5ce1a18b041733e441b9aa0f860137fda47e404097b10df681cc73eadef4"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "83184d95a163067d1930b3db34c3d10f6ccd8585fc596678606adb2d4f971230",
      "after": "5e8e5b517c784ce3678fca739abc06a124b886c05c1bb666815f72fc9a4be30e"
    },
    {
      "path": "packages/design-data/styles/talkdesk-cobalt/DESIGN.md",
      "before": "ecb437e003b847ed58b56c3ba73433b93dbd0c9ff82918104c8f0f3392b13772",
      "after": "7dd5681a4047c960c4f81fd86d20aef22307b214268968be314778f992f4f775"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "5cc13b8990c083f3cc472b857aa8e58057f07dadfa34be409f720d6241a1f2bf",
      "after": "b4542f914cd9d09efe51edcdb1cbf7587229e0137dcca060535c78ff9a8b00f8"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/form-field/form-field.tsx",
      "before": "14f40d118e20a5707f884b535bd7fb7da2d9c42390f5608eca9646e1f28e6b3e",
      "after": "727db9cc620f905d1e2f55bddee5ba4676ebcf3e2c935dba93d145af896ca5f7"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/formfield.mdx",
      "before": "c4980f2f71dc7331471250df537a57f877f8d525c76aaeb46d60e5a02b192730",
      "after": "79b18e0c8077c2e2d38ac494ed6ee5620ca9e63c5f2c4c40655945ee77e77016"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "87d24cb47c95e0644e054c12787296bfce7936beb3467d53ae901cd1c4411117",
      "after": "e869e80d0ada5e6ab53a9402bab1dc3b162bead014cfa072dddf177ccc22453b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "b1ac61d9a248cbb357f0ed045afb5d530140e2c36ab24bc11c5632ac22d3f414",
      "after": "c9012d70bbc9d9657b69d23064afb3789932a759f46c5e27dd2eead9febe1096"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "675e03bf0712ef2652a3e1bafe139e0aefb436cc1392a5077b01e5e3e4e07359",
      "after": "446eefde88acf1437f423add3b84a9fa3b15bc72557d17ad49e2fd32b54339f1"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "439123885692854aa6f7a585fcacd773b9f512ab1209e2112dd668956d5bf78d",
      "after": "d5b029144112bdda9f9159ec702e3842af3d59d7f515d21a7ecb00aeadf6ffb6"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/filter-button.tsx",
      "before": "abc3637236c61c374d3f06dd16e8eadeb0ea436553e71342bc5c6347322a2cd4",
      "after": "ee8b57e8693f8f72b10572784f386589459c240f1642108369ae8f26ed706b65"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-page-header.tsx",
      "before": "35a4422ecec8c7da87b12a040506447b65d2503d47aa1c906def01317272967f",
      "after": "0fe926d1a1f3b5e1fe172435ecdf57c755a6cf5b89673f0c9de5a316b1920e3a"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "f84ea8574fd23c8941ae40d3ef5326a36c119e454571078bfbb8dec38071bb8b",
      "after": "6a244ef6a3260c5a09037757ad34997aadbe177ead27523d37b08baaaeec206b"
    },
    {
      "path": "packages/talkdesk-cobalt/test/users-header-filters-browser.test.mjs",
      "before": null,
      "after": "94c2f5203874bd3bf5004d4d8455cd1354eb5def01f35e82635e09951d7f6629"
    }
  ]
}
```

Completed-At: 2026-11-15T04:31:27.754643+00:00

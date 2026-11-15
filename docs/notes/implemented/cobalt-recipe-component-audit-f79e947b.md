# Audit every maintained recipe against Cobalt and Extensions inventory, replace duplicate UI controls, document intentional compositions and synchronize templates/AI docs/SS.

Record-Version: 2
Task-ID: f79e947b-0570-4dfa-a53a-b418809c058a
Base-Ref: ff6ba7446a201959e8419684d4c4720922cb3f3c
Started-At: 2026-11-15T11:29:58.744491+00:00
Type: refactor
Status: complete

## Context

Audit every maintained recipe against Cobalt and Extensions inventory, replace duplicate UI controls, document intentional compositions and synchronize templates/AI docs/SS.

## Changes

Audited all eight recipe entries and their support TSX/CSS against core, marketplace and copied Extensions inventory. Migrated Users/Insights removable filters to native TagGroup; queue cell overflow to copied ChipGroup with a keyboard-operable native Button; Copilot and callback markers to native Avatar; call/card emptiness to marketplace EmptyWidget; callback surface to copied Card; assigned counts to native BadgeContainerWrapper. Removed obsolete badge and button styling. The native queue badge remeasures after font loading.

Recipe catalog composition links, generated Markdown/component READMEs, AI authoring entry and Workspace guidance describe these choices. Existing native Flex/Heading/Text layouts remain valid compositions. Specialized scheduler geometry, ECharts, callback connectors and requested call waves remain intentional; the documented Timeline API has no phone-avatar marker slot. Upstream snapshots and SS Host/Client boundaries are unchanged.

Updated SS owning README, implemented scaffold note and export assertions. The refreshed source-copy payload is staged into the current SS worktree; existing preview routes and business data are preserved.

## Validation

- `bun run docs:build`: passed typechecks, executable example build and all 279 Astro pages.
- `node --test test/active-call-browser.test.mjs test/users-header-filters-browser.test.mjs test/insights-copilot-browser.test.mjs test/form-controls-browser.test.mjs test/list-dialogs-browser.test.mjs test/table-edge-browser.test.mjs test/site-browser.test.mjs test/export.test.mjs`: 22 passed; one Copilot entrance-animation geometry failure. Isolated Copilot rerun passed; the check now waits for native panel bounds before measuring.
- First component regression batch: 24 passed with one obsolete callback section-boundary assertion; the check now measures the actual copied Card boundary. A later strict queue-badge check caught obsolete spacing and late font anchoring, which were corrected before final acceptance.
- `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs` in SS: passed after whitespace-tolerant assertions for formatted TSX.
- SS `pnpm exec eslint --no-ignore plugins/ss-dsh-design/tests/cobalt-project.test.mjs`, `pnpm run doc-check`, `pnpm --filter @synapse-studio/ss-dsh-design build`, and `pnpm --filter synapse-studio build`: passed. Existing Zod declaration/chunk-size warnings remain visible.
- Fresh project created by the staged SS helper: `pnpm install --offline --ignore-scripts` and `pnpm run build` passed.
- `.venv-lint/bin/python tools/check_code_line_cap.py`: passed.
- Final `node --test test/active-call-browser.test.mjs test/insights-copilot-browser.test.mjs test/insights-controls-browser.test.mjs test/users-header-filters-browser.test.mjs`: 16 passed, no failures or skips.
- `node tools/build-skill.mjs` and SS `stage-local-runtime.mjs <Design root>`: rebuilt and staged the final payload. Final SS scaffold suite passed; plugin/desktop builds passed after staging.
- Final fresh project `/private/tmp/cobalt-recipe-audit-VlP85a/verified-project`: created by the staged SS helper, installed offline and built with pnpm. Its source copies updated the existing 57481 project; assets were merged before publishing index.html.
- `node /private/tmp/cobalt-recipe-audit-live.mjs`: 32 actual Workspace checks passed across eight routes, light/dark themes and 1440/390px windows (narrow business frames 330–331px). Keyboard drawer navigation, native bot Avatars and Copilot sending passed; no page errors or document horizontal overflow. Desktop frames also reflect the existing optional drawer/secondary area. Native dock tooltips interfered with pointer-only automation, so acceptance used the visible drawer's keyboard navigation; no forced clicks or upstream changes.
- Scoped `vet --agentic --agent-harness codex`: final review reported no issues.
- `bash tools/check-maintenance.sh --lint-js --base ff6ba7446a201959e8419684d4c4720922cb3f3c --task f79e947b-0570-4dfa-a53a-b418809c058a`: passed after refreshing verified authoring-index source fingerprints. Existing lint warnings are non-blocking.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Component reuse changes do not alter repository ownership, task lifecycle, naming or effective-line policy.",
      "sha256": "42879cc08dc40a7aa9a52212a47655bfb8df9ca21e1e291b397e7bfb9b60c322"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "AI authoring entry now names existing-control discovery and intentional domain composition; eight recipe behavior remains verified.",
      "sha256": "86481ce2846124d99ad7322f41af68facb23e0621a333d403773091515222dcc"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Verified the generated AI entry and SS source-copy delivery after the final guidance edit.",
      "sha256": "bacb4f750d2c1b3ee4ce11364f41437ede9456934ba1e54922acd8489ef4d14e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Recipes remain local design references; no production telephony, analytics or scheduling service is added. No E2E/Cucumber document generator, shell migration, upstream update, commit or push is included. The hidden native submit button is intentional form plumbing. Existing 57481 preview is refreshed by merging assets before index replacement, retaining previous hashed assets and routes. The final live acceptance and maintenance gate passed. Full Electron interaction tests were not rerun: SS changes concern packaged recipe/reference assets and their scaffold contract, not desktop UI or process boundaries.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "dab3231af3d25dece0039d83a77a1ce3eb7297c569aab13098526c0b9838317c",
      "after": "86481ce2846124d99ad7322f41af68facb23e0621a333d403773091515222dcc"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "48e3d4a8ae43c2f18412db58144776ac595b99eff31339ffa3e6c895f5b1b987",
      "after": "bacb4f750d2c1b3ee4ce11364f41437ede9456934ba1e54922acd8489ef4d14e"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "87db840600cedc772446f8ad5e627791a055d65a7a062bdb21f497952ced6ac7",
      "after": "42879cc08dc40a7aa9a52212a47655bfb8df9ca21e1e291b397e7bfb9b60c322"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/chip-group/chip-group.tsx",
      "before": "d726033f8c9dde394032c6b43a357fd6a8e793e83ef36960c6190bb9e6be2d45",
      "after": "048bbc68ca26ef1d9c4d16b4bd2c599f64cb88af81661fdfce2baa14401f130f"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/chipgroup.mdx",
      "before": "8dcea41e11c9a300134c22cf16c8e028698f7bc6e6b9a485bdd58ceefe94d5f2",
      "after": "e5f0f152a6b9e04cd2c085d97a915fdef95f2ce877af7406d0fe462935fc6ddd"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.md",
      "before": "69df037bae4daec70663471e9450a8e1cf1c14c3b331763ea4851c4d85f2db41",
      "after": "b7d163b94241ed3deade1d61dabcc6153932385a47249e36589de8ba74b55a1c"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/active-call.tsx",
      "before": "2cea59ebe4e4402a21312a058e749aa916b191a7b3c24a6255643fca65489fef",
      "after": "38aff19bfabff66a07e5556bf6e66ef19e71cddfd37e84b4d9e1527f762112ad"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/card-widgets.md",
      "before": "6db432e9a4de479ee8ea229c402706f21cce6336ecfc79e0fae052a833b7f14c",
      "after": "6a2ac0c60cfc166e579c2ed9c3376a169db87ca31530a3bc9907fb56a8e6382d"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/catalog.json",
      "before": "4465f1c32de5a91ac1fecd82a0984a55c6c0df8078ffd7d830755e51b16e0f58",
      "after": "9ca3fa3acf7cf9710a9c6f4388afe41cfdd609e08faa6209d538fd17ceaf082b"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/detail-page.md",
      "before": "bef979ac194c4b61f558510ad51a0a7cda212e36e2286062eb92f8f1636d644c",
      "after": "5df261372fd33c762c9c39235cf9957a365b6637ebaefa219a4754557648c22e"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.md",
      "before": "b5beaff2916ed5edd3da8a7ce62ea99077d5084af91098215cb2b98734746aa5",
      "after": "f3198fa8ef44ba833ea0c100f79fe3b700fc4b950d6a03d19715f158371884e9"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/echart-insights.tsx",
      "before": "d3e39d9b596d3464f8edeb88505d7f5264fe8b266627a1f3e605692ae44cc5a7",
      "after": "f838aa0404c085733c7e075cf99f9fce43426b346cf8a89db3ba8c2b47e51c17"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/form-page.md",
      "before": "8f07a97db03df17392b12362aee7bc6464338f1c45fb5ccd686cb3b38511c8e5",
      "after": "8d8ab0db6123882e23cc5d7f49f85b06d034beeb44549ca0b3b7e14b20bdd0bd"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.md",
      "before": "b90c5ffa8c10648023fafef7a94191495e7a4fbfb6308691c842f8d6119a1bde",
      "after": "ba10bd5a24ada0e647c2f1e89e883f05d08851d0cdbb217b1cab9bfc64e48c21"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/list-page.tsx",
      "before": "d5b029144112bdda9f9159ec702e3842af3d59d7f515d21a7ecb00aeadf6ffb6",
      "after": "6b20341a78b8371b500d486bd738fe654f3d73727fca488230b7937cea473586"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/active-call.css",
      "before": "f59c51bf35cd992764d1eed37967deeb75ff765bc08d046d7d6ea0385a5a496f",
      "after": "3d5fa64c209c6d673073a08176ece6eda7d96d239c21f3436fec1db04174ade7"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/conversation-queue.tsx",
      "before": "1b1192496825a09b015a3437b3d678913855fe7bb994a9ed16fc11b06c5f1552",
      "after": "f21f968f745400393cb180fa06bf756260d7311d44f9e499508d18601c9be9c4"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights-copilot.tsx",
      "before": "85f568c8bd89560cc3aff942c005ed1f5640f0d73fcf5cb733c26ac73475e990",
      "after": "91f6c570a97cbb87b1ca0111d4f1fd0384ef5f4a7e0ba99daa6c3e6dc14b7792"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/insights.css",
      "before": "a869bcfd99145b00873397b2d80d6a36f7bee7fc6d0f9402d24504ed66981564",
      "after": "dac7e83c534d5f1eebac7e31cb044c1209bb0648e4fb28c6be780546eb902863"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/list-user-fields.tsx",
      "before": "cbc4afbe7c43cd2f0bb2889951c5ca592515c6cfcf2dfe456b25d41806ff0aea",
      "after": "21838a42f97e6582831103d8edcbf57c649b1ca6827c648181b51eb8c79b69b6"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/widget-gallery.css",
      "before": "d242d4f6969d85dad985b73c23e5fd6b21b299f55c404edeb3de2b2401018694",
      "after": "9b3f65b5a9ec7e54268375ae015bdcb3ed1abaa46b8c745d2a7bcaf3b82c1f87"
    },
    {
      "path": "packages/talkdesk-cobalt/recipes/support/widget-patterns.tsx",
      "before": "868ccb988eda8a89f273164af366d8bd1b33d4fced9b288c77b85d86e88475b2",
      "after": "a5acb61620bd41ccb562cc63f0246351fddb0207a6090eaf3769ce1c1549c2aa"
    },
    {
      "path": "packages/talkdesk-cobalt/reference/AI-INDEX.md",
      "before": "52014689e0a39575ce76a2ffba6db6d5bff99fbf55cae374ef525473752d346c",
      "after": "9926c954ad987d135912b260c5c8b95319f5e41fbe809c8166ef945b8661a8c3"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "31faf23f94049922b8b35398f0117f5d577acf7c58d8d66c57eb1ba61ec5b819",
      "after": "a4ee81e766e0cdf805cc558b90e4fa82209c6b36a9d1d164ee82bdcfb1d86b90"
    },
    {
      "path": "packages/talkdesk-cobalt/test/active-call-browser.test.mjs",
      "before": "1a6ddb9f509dc6b1c16cf267dae84fef9d4b2c2001eac43d077ab65f2c80dfe6",
      "after": "198992129f1a924338e864729f3eb11d9c244b8efae3aebefcb8012884d73024"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-controls-browser.test.mjs",
      "before": "853fccb8eb6d25291309fc73038fc3f39e05d62e8314d5ce92bc6a13b00c4cc1",
      "after": "b973b5392deb8dc49b03dd96573f64ad9de0213855452d89b41962c15317a0b8"
    },
    {
      "path": "packages/talkdesk-cobalt/test/insights-copilot-browser.test.mjs",
      "before": "0b1a3481d50a4e405f01f32b421585bbab09e2eae12542c735bd240878c1d896",
      "after": "a6422acae7d04cd68ee6db271edf57f45dc9478a9685fdee99bf2e509b917020"
    },
    {
      "path": "packages/talkdesk-cobalt/test/users-header-filters-browser.test.mjs",
      "before": "5eeb41cf41c461aba6806ab40c650f3db718641037a15da4104252f8ad0537da",
      "after": "ad19326d49052c6640b901ce3e490636b9de5436df21da7cc1d67138f51e243c"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/authoring-index.mjs",
      "before": "9b228cb19d73dfd5b1f9650bd66ad591d329104b19d5a926d108fb7c1d929a8a",
      "after": "20406742dfa1b43636086d30baec932b39400e0183dde61c78627ca68b61b637"
    }
  ]
}
```

Completed-At: 2026-11-15T11:57:53.351663+00:00

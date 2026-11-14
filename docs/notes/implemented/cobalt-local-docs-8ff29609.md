# Bundle Cobalt component guidance and remove runtime ai-docs checkout dependency

Record-Version: 2
Task-ID: 8ff29609-72e2-4b0f-8b8c-9a68436e5899
Base-Ref: 001b5f0a52d05d460702d91ecb04e03cc255f174
Started-At: 2026-11-14T09:34:17.416526+00:00
Type: feature
Status: complete

## Context

Bundle Cobalt component guidance and remove runtime ai-docs checkout dependency

## Changes

Migrated the pinned Cobalt component registry, all component/hook/provider pages, foundations, recipes, patterns and Workspace guidance into the runtime cobalt-reference library. Migrated all 1199 referenced images; all registry document paths resolve locally. Replaced the two documentation-checkout setup entries with owned local instructions, recording original and adapted hashes. Added the Talkdesk product design contract to the selected talkdesk-cobalt style, rebuilt production engine WASM and staged it in SS. The library is Host-side data, outside Rust include_dir inputs, to avoid embedding approximately 100 MB of images in engine WASM.

## Validation

- `node --test packages/dsh-node-runtime/cobalt-docs.test.mjs packages/dsh-node-runtime/cobalt-scaffold.test.mjs`: 7 passed. Tests first failed on external checkout instructions and missing local content; the compiled-style test failed against the old WASM and passed after rebuilding.
- `PATH=/Users/franklin/.cargo/bin:/opt/homebrew/bin:$PATH bash packages/dsh-node-runtime/build-engine.sh`: passed.
- `node --test packages/dsh-node-runtime/*.test.mjs`: initial run 265 passed, 13 skipped, 2 failed. Fixed the package fixture to include the newly required resource library. The 20k-node timing test exceeded its tight median under concurrent file activity; isolated rerun results follow.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 267 passed, 13 environment-gated skips; no failures. The isolated package/timing rerun passed 4 cases with 2 browser-gated skips.
- `node --test --test-concurrency=1 packages/dsh-node-runtime/package.test.mjs packages/dsh-node-runtime/cobalt-docs.test.mjs`: final resource-boundary revision passed all 6 cases. The library stages inside the HTML Skill resource directory, while its canonical source and images remain outside Rust include_dir.
- SS `node --test plugins/ss-dsh-design/tests/cobalt-project.test.mjs plugins/ss-dsh-design/tests/design-policy-registry.test.mjs`: 5 passed. Final packaged-helper/style test passed after restaging, verifying local component/foundation hashes and production-engine selected-style content. Local staging, desktop build and documentation check passed.
- Full-diff vet exceeded the Codex input limit because it included the copied reference corpus. The attempted temporary-index staged fallback was unsupported by vet agentic mode; the real index stayed untouched and the temporary index was removed. SS agentic vet passed with no findings. Source/contract review covered the owned prompts, build/staging seams, local-path boundary and tests; full-corpus automatic review is unavailable at the tool input limit. Reference content integrity is covered by source hashes and local resolution tests.

- `bash tools/check-maintenance.sh --base 001b5f0a52d05d460702d91ecb04e03cc255f174 --task 8ff29609-72e2-4b0f-8b8c-9a68436e5899 --lint-js`: passed, warnings retained. Final source and SS documentation checks and diff checks passed. Both built desktop profiles expose the local library inside the HTML Skill resource boundary and return the migrated Cobalt style contract; external clone/pull directions are absent from the active companion. Upstream Cobalt checkout is clean.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Verified local references and product design prompt, including final Skill resource boundary packaging",
      "sha256": "d2eca1abfa05db3aeaf5f22acf732766a3016feef00dfbee4faf0420203e0f1d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Cobalt reference data is packaged inside Skill resource boundary but canonical images stay outside Rust include_dir",
      "sha256": "8666181cfcc7fa67bc665ea6cfd26cc55ff42856899ba490b6aa8b77c6a1bf84"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The reference library adds approximately 100 MB of documentation images to the host payload, not to engine WASM. External docs download/update is prohibited in model workflow. npm packages and stylesheet/font CDN access retain existing requirements. The published pinned runtime still needs a future release; this worktree is staged for SS testing. Upstream checkouts and existing user-created docs directories are untouched. The user will perform live-model SS acceptance.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "f6f9673a5216d331c8c07817750f52634717388d6ac80b5e40e2e51a5c020be9",
      "after": "2b32064f79682a80ecf4d734c2ef5e60723610e24e5f6314e53a4d3b7f95df65"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/talkdesk-cobalt.md",
      "before": "c660869685ec2c4091996c9bd0f9c7498dda07a21a55bd50a3f9a02ce991e0c0",
      "after": "609eeaa10345eab18ac6b996d868f769a5599e2a61675ef25be2859664b3039b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/THIRD_PARTY_NOTICES.md",
      "before": "b10c1847a19077c31df566ffc291208ecd60db573a3526c12860a4908b6f24e4",
      "after": "f569cf706d7bd96a2f8ec77a1947a3cd93ea37b27fad1dba2f09eb4a66f20907"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/cobalt-workspace.md",
      "before": "4999eb388c99f4fe0d84e8c7229c86b1ddca730542726413adbcc70ac21355b4",
      "after": "cbf3e7c6240789e538d3f34e47f6006e9b6ee8179fe0147534163150e5b6d37d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/cobalt/INDEX.md",
      "before": null,
      "after": "d989a207d95679a4b1a4ea37724d79629eff08e36a977c9be7f464a66e587143"
    },
    {
      "path": "docs/kb/product.md",
      "before": "9dcf460c04f3a61a00d207103d7541d2cc98581c2a8df87e679cbf1e726b9f97",
      "after": "d2eca1abfa05db3aeaf5f22acf732766a3016feef00dfbee4faf0420203e0f1d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "b8ea7140808ae0c5d5f311dafad193c6dbd3d67f94bd323662c256dc351fa8f5",
      "after": "8666181cfcc7fa67bc665ea6cfd26cc55ff42856899ba490b6aa8b77c6a1bf84"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "eb609e7779cf6429c5d8dcb238198ce6c5261765b7818085c35736ef62904dc7",
      "after": "c12571f1898683bb40b34ff81ce6f9621831a98435c726df2f9eb5dfe594a1f7"
    },
    {
      "path": "packages/dsh-node-runtime/build-engine.sh",
      "before": "44421eeb9caed9824137272953317a344c2323046a9a40fc6c8906ace566e90a",
      "after": "2e267ec2df6baaa6acbc3f1023a05218f331d0df092c0c27d50a9f8e4a581d8e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-docs.test.mjs",
      "before": null,
      "after": "5b831939b442918d642721c8474e800a7e9c7ad7e3eb9f53c8ccd409561c5393"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/.npmrc",
      "before": null,
      "after": "56fa5c8c47ee6c3768f50b32ac4fb91c3ced68f8e25d0a76943a865df5e2c8c2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/anatomy.png",
      "before": null,
      "after": "02594624044d109e447d1a63d1b490939a73b1becbda82396bd4fbd740c0a4ce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/guidelines-when-to-use.gif",
      "before": null,
      "after": "12599cf22dab2f1a34f5ee85f704dc39772b500c3c08755cffac431897e18a4c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/orientation-horizontal.png",
      "before": null,
      "after": "89f36ed69ad74264f267f27ccedd24bfa3df2297240e2c3e99031026d145332d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/orientation-vertical.png",
      "before": null,
      "after": "a86ab23451f3b76f7b775901827802b2d3fcc64c08d9a45e0dede1af5b1c636a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/sizes-xlarge.png",
      "before": null,
      "after": "a407c45f205268ba348509139b1a37ed7508788c074e8bf5b1d3e7de4be6a228"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/theming.gif",
      "before": null,
      "after": "b0733a7ee4434eafa84d3c65c900d6db087f4b78b0c35861564dd83e0b90aa35"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/variants-modifiers-2.gif",
      "before": null,
      "after": "c761b50418ef2471ad7aafdb75d3a235778f339d22292a4e24e94e407bfdfed4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/3dots/variants-modifiers.gif",
      "before": null,
      "after": "206b9a65c3941bbfef50dbb8ba1da64847bd2a1a40fb43339f996b533824701a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/anatomy.png",
      "before": null,
      "after": "d1688fb5085cf55199bc2ea51b5e9121057ecbac87adc5cec402f124c44c3b95"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/arrow-default.png",
      "before": null,
      "after": "b4e535d2abfe6f5a11e8c89c5ec471a0d519f2804277ae815966a39bc50d489e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/arrow-inline.png",
      "before": null,
      "after": "b4e535d2abfe6f5a11e8c89c5ec471a0d519f2804277ae815966a39bc50d489e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/dimensions-maxwidth.png",
      "before": null,
      "after": "ab85f881a215fb518bfa9f00140b88cc12167c6dbe76cafe0b8de6483d8f7785"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/interaction-multiple-items-open.png",
      "before": null,
      "after": "51dae8085922c101921d3290c925d18d0803c72326931a3ca0fa6a0efb069082"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/interaction-single-item-open.png",
      "before": null,
      "after": "ed8247b05b24fd4e1d2c248570ab68ba7ff2cbcd41114de5df18d92c595824da"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/quantity.png",
      "before": null,
      "after": "eada1e1891cbeae79f068463b142b5fb624ec76243fbd0d427dd6ba5c833ae3e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/spacing.png",
      "before": null,
      "after": "8eeed398dd0182683fba6ac58dd04da8bb248c854eb7b4ce3136bef3b66aae66"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/text-truncation.png",
      "before": null,
      "after": "45f80a72fd4cab0ce4be57505eb17648e99047297227969329fefc68ad7ed88c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/accordion/usage-group.png",
      "before": null,
      "after": "5d036fe59c395e8e20b89b32944669b3bcbb65fdfd0bf88e33e5f6c1a9561332"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/anatomy.png",
      "before": null,
      "after": "e0098f44fb7d93f1a364a91530e0603e5fe7db959fdb414851c37396c2d520c2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/badgecontainer.png",
      "before": null,
      "after": "4b4e244f06d92a2a9b86ecdc10221a0cb87ab0c8befce648a73f757be1e3a5ba"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/do-s-don-ts-badges-do.png",
      "before": null,
      "after": "0e812592b93ebbce0679f031d9a72110aed6c6d148625075c8f3467bc4e4c80a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/do-s-don-ts-badges-dont.png",
      "before": null,
      "after": "121d7355c5119c9203b835c9e2c5d8334f439a75dca753934f106ae89115bd0e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/do-s-don-ts-colors-do.png",
      "before": null,
      "after": "aff8d54b3bb4c572d25fc0075d7f3eccaa961c1aff6151c9054fc4fe2cdcb680"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/do-s-don-ts-status-do.png",
      "before": null,
      "after": "b4361ae513a5fb04f62490c36d41c3dfc15cfcdb3a9697c50a7106abfadaca40"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/do-s-don-ts-status-dont.png",
      "before": null,
      "after": "88f86783e55975e1e5edd9f457750c243c21467748037d8ec3edf930ca941819"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/group-avatargroup.png",
      "before": null,
      "after": "23c575b30d0334b34974d605b206194f1a60cd44c8732d736ef4f38c06f262a6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/group-standalone.png",
      "before": null,
      "after": "b1c3063cc28bc4d7fac9c798b1cdc99c1df157dc2483139898ce184a1b9db2ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/interactive-avatar.png",
      "before": null,
      "after": "c1723e653eccf4fc0e5565509fc2e03e468220673f427a0faebc2c7dbc434579"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/modifier-icon.png",
      "before": null,
      "after": "1f2005e4cbe3da1c5250708cef1e33b636bb4c0a079023de876d4276abb7821f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/modifier-picture.png",
      "before": null,
      "after": "809b840fdb4884585e53e9a4cc43532612ab7789ea354a372fc155d2fa3df3df"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/modifier-text.png",
      "before": null,
      "after": "b1c3063cc28bc4d7fac9c798b1cdc99c1df157dc2483139898ce184a1b9db2ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/modifier-with-status.png",
      "before": null,
      "after": "ea61667b05699940f5c575eadff70bd18825e2c6cf46f01e66f9d79f12966851"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/placement-chatbubble.png",
      "before": null,
      "after": "1282fafa4ab6d978c09b9e8a0b6dd901de3af84940766a5d6baea67a6b047538"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/placement-list.png",
      "before": null,
      "after": "4e8a9b6e7b76dcb704154392b7a66a709e675a3d0d35cfb4585cc14781872655"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/placement-table.png",
      "before": null,
      "after": "c0561850d43863867a65b2f32520bf40c5177eef631950e9437599e844a840c0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/productref-inside-list.png",
      "before": null,
      "after": "e2172deb7a04936a61ce226ee3ff297249ab7678bc9d9619114f5c652a7dd369"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/productref-inside-table.png",
      "before": null,
      "after": "c469183ba52904561c14ff54ddbe0f30e2753445c418ba869ee3b786c0d491c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/state-active.png",
      "before": null,
      "after": "a900d23b136491d1574bd61d04d5c0af2f42ce3f23369178dadf39a5c79e00f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/state-default.png",
      "before": null,
      "after": "b1c3063cc28bc4d7fac9c798b1cdc99c1df157dc2483139898ce184a1b9db2ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/state-focused.png",
      "before": null,
      "after": "1642eb28956de977bf6a6da1f9a53a6dc0e8a68786af247315a01a54d0753679"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/state-hover.png",
      "before": null,
      "after": "887c753fe3b66a2cece1848b5b2e91474d5b0e23b730f1f36818b336b89a654d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/status-shape-available.png",
      "before": null,
      "after": "aad79bb2057a404e9a45eb18e608dc5522ead7012f355f3b399332158c1df23d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/status-shape-away.png",
      "before": null,
      "after": "1b51e8d14c903a62d9f1d87952c2fd2dcfe9cc29c0bc99557f54c6f9b9008b49"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/status-shape-busy.png",
      "before": null,
      "after": "42dad1b14cfb4b9275a41f7b6c4a782493241dc8fb9f1b49e6e868eb33902165"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/status-shape-offline.png",
      "before": null,
      "after": "3d5c644e8f717e63e7007626c61c375cfa72ea6f7d0054879117a60fe6ae6166"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/type-basic.png",
      "before": null,
      "after": "c28d6c746f1ceaaafe8a8c05ebce314d8aeaa7134a136fb6f0d8f5d9aa1947de"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/type-light-primary.png",
      "before": null,
      "after": "2f4d429202f1b4a3bcae7b6350f1456c599960a7bbe0cc2547ce302f99f5da1d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/type-primary.png",
      "before": null,
      "after": "b1c3063cc28bc4d7fac9c798b1cdc99c1df157dc2483139898ce184a1b9db2ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/usecases-do.png",
      "before": null,
      "after": "a0539751fc50bae2c3175c437e4ff625e58bdb6964128c04aa692494cb6a03d9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/avatar/usecases-dont.png",
      "before": null,
      "after": "8c92e1fe2388d83994ee11d2faa4fdac10a32542e4c8668627f5d095853fd03c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/anatomy.png",
      "before": null,
      "after": "41941c8a0a4feee5eb3161fcc89c6beff699714aa49be7d003b615ddbc8c424d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/dos-and-don-ts-do-2.png",
      "before": null,
      "after": "ec4711ffe824a44d1ffd9961a61314c21946e4ba2001830962927f0e247525d2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/dos-and-don-ts-do-3.png",
      "before": null,
      "after": "1f565bfccbd10703970cc336b15dcc7497a6d41449f5c9bb29379f4dfe157e3c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/dos-and-don-ts-do.png",
      "before": null,
      "after": "99918080ac5330dbb3bc6fc5fb03f7ac93be1a46ce33a7a5d13477489508a3c5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/dos-and-don-ts-dont.png",
      "before": null,
      "after": "93d91cb9563b3417f525fc241fca4a0172d346e72359a6c127562429b3d1ef76"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/element-new-associated-with-a-tab.png",
      "before": null,
      "after": "761f3bad384acb03cb28f0df91f92d2d7271e75d129a37f1915421adc989b828"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/element-number-of-applied-filters.png",
      "before": null,
      "after": "cbea9810ddd082b42c3cc7635250dcf8a4bc24f2efdb6c052188f1a11f848d40"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/element-number-of-unread-notifications.png",
      "before": null,
      "after": "a8327cdc2b3a640ceacaf25877eddbdeae7b487783ab509cda4e21e6cd21ebe5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/overview.png",
      "before": null,
      "after": "73c8db8a9520664ad2b35ecd726f1b5c57d7882506980c2ae2b1b0969c61389d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/variants-position.png",
      "before": null,
      "after": "b059308eefccfbdafd1d0936da4f29de458e1f7447c883c66bd8b6342441554d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/badge-container/variants.png",
      "before": null,
      "after": "3e52a6cdbcf3ca47122d75951b1ef825496d6fe23d928c4476147047566037e1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-circular.png",
      "before": null,
      "after": "df015d73da2c7005c881c5b16b26c162e763e2e82e31005c19a83224271d3b63"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-large.png",
      "before": null,
      "after": "224a031df2b59f99b4d87bdb84855ae49d16b0649d47e354037c631092849bdb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-medium.png",
      "before": null,
      "after": "c3ed72b24e39d0f62692b721406bb76caf24d7ee7249bfdcfa747b6ac38c59a7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-none.png",
      "before": null,
      "after": "4c10058a9c41394603d379d5db687a94949510049d005e3d64bce43b7d7b0fb5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-pill.png",
      "before": null,
      "after": "ecc5394ff1cd36c207f7751ee258d53f8b432bcb538903803eedabfaa11d51d5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-small.png",
      "before": null,
      "after": "2db570097cff631fc0a7e91a737eeec732d036b2447929660731c7d5e4dcddf9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/border/border-radius-xsmall.png",
      "before": null,
      "after": "ef40cf8ce452622c6947797cd93cdfc2dff2bdd2215b0d6afd678c2fe8ac4c75"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/buttons-vs-links.png",
      "before": null,
      "after": "f3dc9be87c2add0f48ec7ef2116c48cfceb5f27aeb9e852397c7e22abc39fe27"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/code-icons-as-labels.png",
      "before": null,
      "after": "b3613b96cd648267b92087c3d93c2a9f1626a470b13ee1188b57cf2077e9d7fc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/content-do-action-verbs.png",
      "before": null,
      "after": "0ca5abc573910be87235e0a27cf4c0a19015cb2de129a922839feca64134888f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/content-dont-yes-no.png",
      "before": null,
      "after": "a6a0c5c378c8e8c452fd06da90da0b02fe6e0c52ba0f508a4b2a40f661bad1b2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/do.png",
      "before": null,
      "after": "eba1c314809a0d5a709d02a119ba0f112024469180bc78f7e0353be0d35f8bd7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/dont.png",
      "before": null,
      "after": "74652af2403962fba2cc907080c324b27dd63fdac8cefb1e0f6e950643d46bfe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/group-header-exception.png",
      "before": null,
      "after": "cc81c6ea887136ec679b329263a94498a64067828f3fdf91fa1eafd3ec3cd897"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/group-regular-12px.png",
      "before": null,
      "after": "1393b08be3fc0545596c820d9e9ad11fee00a858a0f0014e786b1ccfaed7e598"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/group-small-4px.png",
      "before": null,
      "after": "8e777c56abd18426f466ddb637f35c466d1871a5d36ec101dfbe5081becb91f1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/icon-label.png",
      "before": null,
      "after": "c597e735f63d0a12f96817006976e9dddc63b51781ed6e3e5b2c6be35ba0b248"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/icon-only.png",
      "before": null,
      "after": "362a384d683e137271656dd13899aca5afdd7a850e9f836cc0684e604498e30a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/button/label-icon.png",
      "before": null,
      "after": "65dd0c1368d984c77809a3a4b069fe860ed00b770cafc6b3d01827e768693a3d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/anatomy.png",
      "before": null,
      "after": "b8ae0c343afed0956a6a572a5752fb5045e95f46177c3e0d9ffc62c328772b88"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/borderless-large.png",
      "before": null,
      "after": "68d7cf59caa9be5b5b702923443ad7f5f0f6491cdbf05dd70313bca9f3a39b49"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/borderless-medium.png",
      "before": null,
      "after": "1394ecf495fb272f534aaad4fd4a7d37c8c039ab400e7999d27b114a3e2b1f0a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/borderless-small.png",
      "before": null,
      "after": "5411b2e09866812a46824d177da24e87dd799f2bc2704ecae5ae7b7249d54c62"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/cards-inside-card.png",
      "before": null,
      "after": "04dd8d407ad317949f79eb7c5b2d26503f11a282b3ebf9f0e34e2235f60a77ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/group-spacing-between-cards.png",
      "before": null,
      "after": "98aa937bcebaf895329e030567d6a54c0da95019d7d124bb1b2e75cbafc46d62"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/header-border-large.png",
      "before": null,
      "after": "63368c8dfa9aeea4c483234118404f327766a0d5c2bcfd96c5e32a3669d81464"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/header-border-medium.png",
      "before": null,
      "after": "9d50ef6b84b402466d976adb58cb46bd98d344ae8094527c58ffc356caa3528d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/header-border-small.png",
      "before": null,
      "after": "9bd81a77819399e575a9da3bfa79910482d681ae03d19277e596e2fe53db48f8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/interaction-draggable.png",
      "before": null,
      "after": "8987ee99313bb25b3795660c0da11dda80e9f1dffb56ea7e9fabbfc021c21263"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/interaction-expandable.png",
      "before": null,
      "after": "6077fb49b11f88df8c0ce54364635c5ec4f51a92bf33824dfdc094e24f361302"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/modifier-footer.png",
      "before": null,
      "after": "de8aefd158b340f63224a8c006a9e9b954179c9d28b718f8f57521f292df60ef"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/modifier-header-action.png",
      "before": null,
      "after": "803355bef4ea06f9739f0e2e6b46aae2292eaf76751264c60ed56e6b759c62e8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/modifier-header-footer.png",
      "before": null,
      "after": "12cdf8c98f84a20a562ca680375beb321b3f422ce5e483df10a2af980d031374"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/modifier-header.png",
      "before": null,
      "after": "b25e4c77b8c05d50b8d31304564197f4e1e398fb08be863f8a8da2498a9811d3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/modifier-without-header-footer.png",
      "before": null,
      "after": "898086b50f4110f45a56188d31f0b980a643115969b817ca3b58b1e72d79bdb6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/responsiveness-large.png",
      "before": null,
      "after": "0c64665d7dbd9acb0f4d002cd7058f9777ac453e91cc07428502ee7fc63a626b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/responsiveness-medium.png",
      "before": null,
      "after": "f0e0b85f6691cac50aff44f624010de5b3e0ee8429b3f154573caaa24e9c495f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/responsiveness-small.png",
      "before": null,
      "after": "50732d7e6acd737f13c586050bc1c984cf3bc8c2ebc8436a3e6754a808e3330e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/size-large.png",
      "before": null,
      "after": "9010187f9ddfa5643edaf19563904e31d943bb8a2749857e921f7498a6810109"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/size-medium.png",
      "before": null,
      "after": "4990f05e731a15750d14d2ec1f7388a10ad76a67843138ac85d7fd28d5d91299"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/size-small.png",
      "before": null,
      "after": "ed0a02883385a2d33a32c29cee98654d2f5265a8d5338ced62c78ee97e08f69d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-active.png",
      "before": null,
      "after": "2c783dbd4beabe37946cefaef18c2ed865a9038746e6b5cc50c89a27edb0baee"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-default.png",
      "before": null,
      "after": "9010187f9ddfa5643edaf19563904e31d943bb8a2749857e921f7498a6810109"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-focused.png",
      "before": null,
      "after": "0780d28d9f8b9e22fd4887c440920704734be47b1fa60e69efd1cb6e6f5a50e3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-hover.png",
      "before": null,
      "after": "432acc1017c0fbd34fb63e2e78c2fd75f6ad08b0e731afa03173c4aa1c357adc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-outlined-active.png",
      "before": null,
      "after": "041d55e72b514519a475097810b5938ac0ffdbfcbbda823eea9321bf1cc6cc72"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-outlined-default.png",
      "before": null,
      "after": "a1a1e4e80c23bfda54a845c11af9ceddfbfa651286b4f19171d418a78faec1b2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-outlined-focused.png",
      "before": null,
      "after": "7f717fc69b8b125b9e3458dfdfb7b24ea1bb55eede8d806cc24b4464b9654a31"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-outlined-hover.png",
      "before": null,
      "after": "4b5f3d39cb3e950ebf8efe583ac24642d6abc486b3f97e9d0795e0d19a3a242e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-outlined-pressed.png",
      "before": null,
      "after": "88c006c820490e7e2139b1414dff9b2b5f8a3276438d2c9298287fe3f9332ff8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-outlined-selected.png",
      "before": null,
      "after": "610ea90252d2f47907160abe7bf58584206cad27b9b814e4b53efbcb26f3960f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-pressed.png",
      "before": null,
      "after": "cc16ee640d7eeeed7a1444ffb12cf7c32e5ee82863bb99ea1a9fa148e3c52ede"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/state-selected.png",
      "before": null,
      "after": "48e04cd9a70c01435547c8778ebed9cc399e697ec687ee066017d0db6483163f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/style-default-card.png",
      "before": null,
      "after": "9010187f9ddfa5643edaf19563904e31d943bb8a2749857e921f7498a6810109"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/card/style-outlined-card.png",
      "before": null,
      "after": "a1a1e4e80c23bfda54a845c11af9ceddfbfa651286b4f19171d418a78faec1b2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/checkbox/do.png",
      "before": null,
      "after": "a29956def56fa0c23975aca27a14d7a61a4b3934c21b9d3ab8500d3ee118edc3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/checkbox/dont.png",
      "before": null,
      "after": "1573dd486e4d3c98316be0e63cd753a17e45be4ee3026961049c510dc6c1589d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/checkbox/group-2.png",
      "before": null,
      "after": "18d9bbadeb36cf00730e090a2241234882d8f3e019e3039b7aba9cef16e4d160"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/checkbox/group.png",
      "before": null,
      "after": "536c37211cfb1cc9d0123d660d18435d38600d34ace368e7b243ffdbb00d5fb6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/checkbox/variants-sizes.png",
      "before": null,
      "after": "bbc250583473f792669b10ccd0e2462cf79f6a497696d3b28f9f232f7135f29c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/checkbox/variants-spacings.png",
      "before": null,
      "after": "a93513c3163742673b42b52f20ecdb72d0e7740e333b5553bc56de56351b256d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-avoid-sorry-do.png",
      "before": null,
      "after": "9f38b4438e100043a3747fdc9b1fab059b43eaf4795a19f90723e6dcf1475bdf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-avoid-sorry-dont.png",
      "before": null,
      "after": "7b8f0a4550539dd32b9f5b914758c68ea9397f1a134c4f1d127182a5ed341cf0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-date-abbreviations-example.png",
      "before": null,
      "after": "6f7c7ae29a687db8102cf889a2dd0b6731a6800632f6a9f542925ebb0cebddde"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-delete-vs-remove-delete-do.png",
      "before": null,
      "after": "17b38aa30c909b59c37d5f939c52af05f418f613021bc587903633f453726dd4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-delete-vs-remove-delete-dont.png",
      "before": null,
      "after": "4ea944e960e1f58a13378a2fa30662646a664b43467ee659ef5b5deb670001af"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-delete-vs-remove-remove-do.png",
      "before": null,
      "after": "7087ce1e42601a5c0551359389167304303061ace2b265e540a462efb1553e32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-oxford-comma-do.png",
      "before": null,
      "after": "05728829316f77e44520e1b7a64137a8edf646a1e9aa7eb82b60078f5855beeb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-oxford-comma-dont.png",
      "before": null,
      "after": "e1d654b1c4a52e2c75f2d295fedab0f2a68656499163b2f1ab8dfaee4fde96fa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-sentence-case-do.png",
      "before": null,
      "after": "eba1c314809a0d5a709d02a119ba0f112024469180bc78f7e0353be0d35f8bd7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-sentence-case-dont.png",
      "before": null,
      "after": "f82937aa1ef47bd26f5f519ec52189f8f6854b215197e8a5b3524266359acc2d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-use-numerals-do.png",
      "before": null,
      "after": "b3325d53514762a435455356208271a7681a3bb186a2ce57af23bdeea3fff7ae"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-grammar-and-mechanics/grammar-use-numerals-dont.png",
      "before": null,
      "after": "1c03a6aaf55e7badfca1eaed730727fd03190c9dcd168c6e033103aa5f7b5069"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-word-choice-consistent-words/word-choice-avoid-sorry-do.png",
      "before": null,
      "after": "9f38b4438e100043a3747fdc9b1fab059b43eaf4795a19f90723e6dcf1475bdf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/content-word-choice-consistent-words/word-choice-avoid-sorry-dont.png",
      "before": null,
      "after": "7b8f0a4550539dd32b9f5b914758c68ea9397f1a134c4f1d127182a5ed341cf0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/anatomy.png",
      "before": null,
      "after": "d8163a2cfcbd4b0ec9fb1479268ee1414755c459fd09817265bff8da2dc96a2e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/behavior-interaction.gif",
      "before": null,
      "after": "7ddf082048bdb170ba02f1bd62a6905efe51ea3842099f608ab15ef5d4094eb4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/behavior-responsiveness-2.gif",
      "before": null,
      "after": "43628a1e83cabb19ad80195d2a5f8188e01259a8e7f1a4babf5d404b3e4c542a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/behavior-responsiveness.gif",
      "before": null,
      "after": "a92d24fcbe4a89e6d356c19711d95b8c0c56d4a9ea085d1ae7afa9e800f9cba9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepicker-active-range.png",
      "before": null,
      "after": "1d6a424e18f4b577ecd720c83bf2b6acbc94f78f91890fdc5446518afd26c2d8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepicker-active.png",
      "before": null,
      "after": "d0ffecbcac55ffae49f1e4a63ae9cc63b7a17d09fb422c8557688085287d1c8a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepicker-default.png",
      "before": null,
      "after": "5aff070899ded8c6512a5e26bae3acff8b2a9bda88e720ab0c60d97055637d57"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-active-first.png",
      "before": null,
      "after": "5158a32990888c96e0e905d6972b518a54f5b7cc179c9bd860af99d14ed41dd9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-active-last.png",
      "before": null,
      "after": "e3e7628f0089791398ec2db12465d1a632af6573622aa92be925017c176b00d0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-active-range.png",
      "before": null,
      "after": "c6151d0858fb14ce0c1bbe214bf2f25337b279ece4dcc0c96ead262f07029243"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-active.png",
      "before": null,
      "after": "9b2650ca0621f9dd8348729722647b5f702765556a672d1d8b53406f8a67a3ee"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-currentday.png",
      "before": null,
      "after": "4e952c5d6615c8c2b827b07810651dcddcd2915a7081bd6278ce7d5e16243434"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-default.png",
      "before": null,
      "after": "814610d2c9a65b9713bf5c78ce1b112635c853fb103d540d7a75b8b643ed51f4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-disabled-currentday.png",
      "before": null,
      "after": "402925a8bfd0cd23373cb24eb8aa7b169dae12ea29d46287f463b75704130cbf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-disabled.png",
      "before": null,
      "after": "eeeb165d98fa31e4d094789fe1fb683436d9e7d67380646d60ea0c682cc4d30c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/datepickeritem-item-hover.png",
      "before": null,
      "after": "d78f9f781f48aa36364daa92dab8c93e30e10cbef09bccb3e117b602c14e090e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/dates-range-selection-with-invalid-dates.png",
      "before": null,
      "after": "efe4d06bacfc176d9a78b6e22a13490cf8628cde2058607ed72504e7a45f364f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/guidelines-do-s-don-ts-do-3.png",
      "before": null,
      "after": "a5c068ee8f5fce49e18e567ba2e42b44add51b97c8450b3b33b2465228e18da6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/guidelines-do-s-don-ts-dont-2.png",
      "before": null,
      "after": "16b17126f661f9d20f4b68d013f65e40e14d88039a8f75323471326b35e80ceb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-custom-months.png",
      "before": null,
      "after": "dbe06fc5e861a5f12300516681b5be75c96239a0a4f7f979b4a510ebce56a154"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-custom-weekdays.png",
      "before": null,
      "after": "18df8ee9fd41afe833737ac94a427b731446c7ccaad06eb71a07196fe0d96e83"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-disabled-days.png",
      "before": null,
      "after": "17e677d0843116134579bb457a5267ce55efc872ba863d294026bfbfa36bb709"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-highlighted-days.png",
      "before": null,
      "after": "0ab5d62c2fa915c2aee3b584adc6968a905f37373b2d4d157f0ea7a4cc7b7deb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-selected-day.png",
      "before": null,
      "after": "83f454047d26327aa6ad4c0d1478774ffc72992dbbbd11a5a5e98fea718413aa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-starting-on-a-different-weekday.png",
      "before": null,
      "after": "69b34333773007ff585c4d3d311844f0acfe7363c5b062dddad97b509a8c50d8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-with-navigation-default.png",
      "before": null,
      "after": "20a36b8c843b474062f5a2d1b0c6e0b1ce9f2c24efa1207d885ea738f3bcc2ec"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-with-timepicker.png",
      "before": null,
      "after": "917f290d1f91d71cccb95f380fe373c42ad640f0ae244ccaa7f8fd6424f17e4f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/modifiers-with-today-highlighted.png",
      "before": null,
      "after": "f1fe8a47fbaf9619cfc269488c43dc2883c501ff6341dda69aeea8eb7f92a0f2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/placeholder-range.png",
      "before": null,
      "after": "f8bf59108ba79da484faa4aa56c9e293540438589dcf4de02d0923013627943d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/placeholder-single.png",
      "before": null,
      "after": "a2f65c782ccd96045020939289e121354af331e3efc8d9586f29e860a2fd50f0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/position-above-input.png",
      "before": null,
      "after": "a5e138abdba43b2bdf93e180bc0e96d282801702f71f6a19664a2e08a861d267"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/position-below-input.png",
      "before": null,
      "after": "5a520d59b6ba80dbe6b7f5787701f16c938b3faf408bbe9bf54d42ec99fa53fb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/use-cases-changing-the-month.png",
      "before": null,
      "after": "309eb038e4926ce21927e0a7b855a4cc2278af055f4e4654db14754f84c39c8c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/use-cases-changing-the-year.png",
      "before": null,
      "after": "d0ef594f99a854eba63359d2b4f34bd02ea7bf4dd5129fef57408ec0fecd25c9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/use-cases-custom-option-do-2.png",
      "before": null,
      "after": "3db4ff6d6e6bd9d36962d1bf1c594bf209d95bb5f3e48e75d46bec42b7041945"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/use-cases-custom-option-dont.png",
      "before": null,
      "after": "f002e02916e5e088e0e6ab454aac1655e27a3834d16ac886fb159accc0deab4c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/datepicker/use-cases-technical-limitations.png",
      "before": null,
      "after": "1427ea799102f67bf3e68ad67c8510a9478482eff9b0d3a1986ba9ed75d55923"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/anatomy.png",
      "before": null,
      "after": "61fafbd1ab1a3541def6a7ca5676ba6ddfe64c319c627a83422266d67ed880e6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/color-applied.png",
      "before": null,
      "after": "75dde3093979a138a9a90df4fc7ad0de43f25f5f0855c014c1cefd8b664b26f0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/color-default.png",
      "before": null,
      "after": "8bbb29b1d25193d004beff7417bc524d707d9303717665f72b334021083b1860"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/color-gray-background.png",
      "before": null,
      "after": "a5a8a181ad875ec4004d8ff1581fea9721d468d1a7b89a853f775c76136ce1b6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/spacing-horizontal-margin.png",
      "before": null,
      "after": "b2b17afaabdedf7aeb13bb5446922cf455ecfa8561c0c847453c902dab49cfe9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/spacing-horizontal-no-margin.png",
      "before": null,
      "after": "2e9febbbdda05c7e66e7b316776b36f74afdc69f252b90b601fa8f8767f780b9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/spacing-vertical-margin.png",
      "before": null,
      "after": "8f96c2d56ae3231f28a335dd41783b5ad6a1cf70ad668a4e4c5016faa764a528"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/spacing-vertical-no-margin.png",
      "before": null,
      "after": "b107616e9d3aa3f99a388951e3f6c90030704c21eeb1687a3132904d6803be5b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/usecase-dividing-sections-do.png",
      "before": null,
      "after": "90b0b8c67fa5103edb71281d32328afed2c97328651c29468d7dd9c8ae5711f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/usecase-dividing-sections-dont.png",
      "before": null,
      "after": "637ba0944b454aaf5ee7009343222dbb4f70ecab93ce8784af30dfd79348c96d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/usecase-using-labels-do.png",
      "before": null,
      "after": "62f5a7a2b70cf1befe60bd08056f35078b58b93dfe3a003e292f33420ac2d10b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/divider/usecase-using-labels-dont.png",
      "before": null,
      "after": "e7d4e6e84a7e9fd8c1bf601b6e73ba5bcb98dc612bce167af3e640c3749c9878"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/anatomy.png",
      "before": null,
      "after": "2e69f0330c15186e2b3f116aa4cb5f0518545df734a31c34819f0ed00f177362"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/examples-do-2.png",
      "before": null,
      "after": "41c8845acdf941dd9edefdbe19254e75cb7751e77d76ae6e6d60575b6eea00f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/examples-do.png",
      "before": null,
      "after": "5a89dd5d4a382ef86bb2f58154b1e2361289b25b3eb8f8a96b5905cec1cb129d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-dragging-file-small-viewport.png",
      "before": null,
      "after": "168d93556a0148563c8862772957a8d7357abd66fe3e15030c50622550f149a7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-dragging-file.png",
      "before": null,
      "after": "07037504111bffa85997f9e3bea9c418365d410b05d21479eecd212601d9756b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-error-required-small-viewport.png",
      "before": null,
      "after": "c306f36852366230548a0fd115fcd6788df930b8b6a904840fd910715c517985"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-error-required.png",
      "before": null,
      "after": "746d8078922563be33c153f9abd2b70429be59129e853efba63b85b7a2ab4f29"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-file-dragged-small-viewport.png",
      "before": null,
      "after": "8be7418e4724ec23d5ddbb995a3d810822c7840612c23e38e7fe88384d0f4217"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-file-dragged.png",
      "before": null,
      "after": "ce1f586665e74120dee89060c44fbff589ae54887e2097165bafd8650eab7232"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-file-imported-small-viewport.png",
      "before": null,
      "after": "8885ccd5206a59d85fd87a520d1c6fa541ef5de943be8a66ceed965c6518b9fd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-file-imported.png",
      "before": null,
      "after": "ccde897567bdd4d2689c127a93cf77bcdce772f2feddf08720ed6cf679befdff"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-focused-small-viewport.png",
      "before": null,
      "after": "3f501eb52ff51bbaf75bbdcf25b01ce3bbab6b5cc6e52fc1137b42eaac8dba69"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-focused.png",
      "before": null,
      "after": "0b91c9e2c144b2d699441d4674f0bdf189dd4ed55cb4e757f8ada206509ace13"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-importing-error-small-viewport.png",
      "before": null,
      "after": "88fa0a3d66603397dee2f1fa9a7001171eba3c30b7408c8910fb0218522dee94"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-importing-error.png",
      "before": null,
      "after": "da667b69d5c62db71c48419138e4249b4ff14c56d6c09d1ccc4644044eee682b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-importing-the-file-small-viewport.png",
      "before": null,
      "after": "d9a7a332e2cb07004e425608e0477beee99f554f0b8e3e8c920109996ffafb79"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-importing-the-file.png",
      "before": null,
      "after": "d4b0ff9d926ffc629258f5d3a851ca3789f7eb80b755557cb8391b52135f620a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-invalid-file-s-dragged-large.png",
      "before": null,
      "after": "90ecae16c49116a8f1cd9c223fe92c52320aa55794a197ee3babe1c763e2f92b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-invalid-file-s-dragged.png",
      "before": null,
      "after": "ccaca700ddf9b1162081dfaf1105c340533cc0e0e2cdf579bd1d88aa113f0100"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-loading-file-small-viewport.png",
      "before": null,
      "after": "b0f4d22f6d09c7dc5b91e7600c8ce3a3dc13f70fabdbb7c51b6b5fef7f7b442e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-loading-file.png",
      "before": null,
      "after": "8dbbc98906a0ebf5c51dcea9c374d939a21f1d951e1c90c73d7ef841ab9c3c35"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-start-small-viewport.png",
      "before": null,
      "after": "23bcd658fc48ce6129970bd1f17af49ba4946ed36d1cfbc2c7c1cf841fc2f0aa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/experience-start.png",
      "before": null,
      "after": "9ba93328844338dcc73594cf17d7cca0b2be5f68c18adcbee8c24b9a3ddf8c0e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/interaction-general-experience.png",
      "before": null,
      "after": "9f2f49d4cd8c309161bebe66e1180842d3ae014e48b4daecb3bf385c361333ae"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/modifiers-with-illustration.png",
      "before": null,
      "after": "27d4f29142e7b5a212c000162b05643c6b104b5a9664fe0e0121b106098ae44c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/modifiers-with-label.png",
      "before": null,
      "after": "06782500ff5d9c953d142bca94f7601aa3e7a32d284a55412a724d6c65db8899"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/modifiers-without-illustration.png",
      "before": null,
      "after": "bbc6afb09be34595bcfd709f181ddc43b7878523c0b0fcf8d1d7a7f5feb786c0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/placement-inside-a-modal.png",
      "before": null,
      "after": "dcdfb98e61f12c49153a01e61649d499a4eb934b2661ae9a89d0ae42c164e1cd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/placement-inside-a-panel.png",
      "before": null,
      "after": "713ddbe50330440c7a7919d70e4319d9d3213e816e423a94f18511a413b8d559"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/sizes-large.png",
      "before": null,
      "after": "f67c2d28d7d599f62cf1cb0d49d8bf76dfa9d085dd81a24131c826f67cc647f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/sizes-medium.png",
      "before": null,
      "after": "92fbc3869fe273f0bd4445833b85d5edf4e9b71a4824fe23f4c8fab8dfc8d7bf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/sizes-small.png",
      "before": null,
      "after": "f831dd0042db131c0a37d9553029e8f204c87329950103fa0df1dbff10d4632f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/spacings-spacing-large.png",
      "before": null,
      "after": "c431435cd9bf48f0fcc9801786c46c02c60169989c170bc782f299f4328a2f61"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/spacings-spacing-medium.png",
      "before": null,
      "after": "e4089993e92568f5cdd91ca028275b4666b6787409cf7fb861080ab55828a575"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/spacings-spacing-small.png",
      "before": null,
      "after": "4a56f9370988d09b20031c4965bbdff0aa32044817fdcd4fb913a9dd24ec1080"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/states-default.png",
      "before": null,
      "after": "1f9cc985afba7e4f074647e616bd4edd4688fd59317f8ac579dcecf4c54ec710"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/states-error.png",
      "before": null,
      "after": "4bfef28f471edd08b62812892ac7f17935e9bccd845ea1c82391554d6e39af42"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/states-focused.png",
      "before": null,
      "after": "6a51f3ae0ed1683c98dc4aa0ec997fc86ad5f40c627f187df461a5bc5a6f452b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/drag-and-drop/states-hover-drag.png",
      "before": null,
      "after": "8b7aeff83fdce999ce01ec80829f9f974f7124650cc4baf72cb466a902f85c11"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/action-on.png",
      "before": null,
      "after": "99fb8aa3aba9df9c49ba2e9367db3d6a22c414a05c7c3f756bec89e0f4debb8a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/anatomy.png",
      "before": null,
      "after": "c02cc5580820168b0c3abbb14d0113c192615b8ec3ea85605418361a4f2749e3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-actions-list.png",
      "before": null,
      "after": "b619091cf276fcec043b8710093bfbdeb7cf112241174a6be48dd6254157f67f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-actions-search.png",
      "before": null,
      "after": "94152611165f86b9f914246782d45a34284fe10a1ea56479bc305749a5853cac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-interaction.png",
      "before": null,
      "after": "2c7d1fe8241d444dd7f579ea1b5210eae7185d3b389d941e056a6f6aea813d8c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-loading.png",
      "before": null,
      "after": "30d8aaaad9ace57d70bdf75d49fd6ff6b24d046abee0de20837752ef4fc15f34"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-scrolling.png",
      "before": null,
      "after": "2c6ba03c492d2c602b325a86257ca54254057e85815bc05536172351a0b8af01"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-tree-selection.png",
      "before": null,
      "after": "c00de1bc4719844abd2d1ee6cb8974c2fcbddf1c442513b39db96dd545321067"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/behavior-truncation.png",
      "before": null,
      "after": "0c659b06a24375fa70f5d7431928aeaa7af107efa4d664658ff748e11b36f7db"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/cover.png",
      "before": null,
      "after": "4b3cdf97dac85427a42521a10b22ed2a6c021f749dd160fddf29468a327657a3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/default-dropdown.png",
      "before": null,
      "after": "fff5f5ef17de69d3d524fa5c2b7e19f908ac1ff3ce6168cae0c9356c9e5b2039"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/do.png",
      "before": null,
      "after": "e0c77ded1593c35e1ca5e3cc718f51cae44ae6cb4d91c3e2137011e62d43a0a8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/dont.png",
      "before": null,
      "after": "7c4dcb49ec886b120d59261a9066cb1bf56cf38f06389e34c0247fce4b8b0b08"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/general-loading.png",
      "before": null,
      "after": "a8362210a9d3cd7be7ca73ed0c97e7e10362ed615cf19ae3ad17424901c91ae4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/general-tree-selection.gif",
      "before": null,
      "after": "c30f0f6b72a6fbfc3a28d82cb9bc2d6bd48b2b57198e333834e9900ba368487c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/internationalization.png",
      "before": null,
      "after": "e9461325e916f8c51ce69dbbc7e220ed0993096933182374d560c2c369e16eda"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/item-from-a-dropdown-menu.png",
      "before": null,
      "after": "0423498d9d7f3f069b73e3201ccc6dcafcd89c40c76633eb4766122b72e051e4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/microcopy.png",
      "before": null,
      "after": "a7f3306576ce89638ab5e8dd29ef241702dfcd89eeac7053e5029cf84ef36ab6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/modifier-default.png",
      "before": null,
      "after": "61af61f0d67aa925fd6c73f8b48b0664d8fb428e3d4f86707ee4b3308c871f15"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/modifier-icon-on.png",
      "before": null,
      "after": "8155e482d2fbfcf4d3432e8b0bd7db0f475a7062bb9cfb31c386f6a47dce34c0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-search.png",
      "before": null,
      "after": "b330bcefb5cf45640621273104e062781162cc22ae92b76c20e6e3508eb176ae"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-dismissing-items.gif",
      "before": null,
      "after": "daf9c7eed8fea118df995514d516dbaac687b3c19fa180a0b44c220cfcedd5de"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-navigation-2.png",
      "before": null,
      "after": "83e33f22005d34ecee149b3f5fedf6e559c2b217f2e02e0bd0fcf97562b52150"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-navigation.png",
      "before": null,
      "after": "4bd3058473c7a83037cbd5130790cb39a28a14200f6f4b4bf2c205a16398f28e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-opening-2.png",
      "before": null,
      "after": "e816c24e29906f4032c4ae33fe5004453ec8f61754c315b52d943747e88a9689"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-opening-3.png",
      "before": null,
      "after": "2ef04edc79f259d65d9cc4632d2f5d7a94fe776ccf9c308a11e12a1aa868525f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-opening-4.png",
      "before": null,
      "after": "169fffed134b1d7d99c4b2ec3d205f76c26339e12726d2eb6699ac9af338a114"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-opening.png",
      "before": null,
      "after": "a05ebab144d50f9bae87174ce24e04af0aacce963120b1b97eeae1bc22b3477b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-search-2.png",
      "before": null,
      "after": "4468d9973a43f8569505a9d8bd85341675355a880072ec6084e5906f86a1b22e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-search.png",
      "before": null,
      "after": "777b05cb7d8a6230ae7a0098a13bb304379596a8aac0e8c7824469597e757f77"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-select-all.gif",
      "before": null,
      "after": "5d045da624dbcee356c9863d14b3616d8e8a0fbf18e4d17a17eed8ac1cf7ef63"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-tag-maximum-width-2.png",
      "before": null,
      "after": "9d22bb498933bc4992a7b4e5c272aef9a12b0637a8301c5aa316e177ab02f4fc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/multiple-selection-tag-maximum-width.png",
      "before": null,
      "after": "ea001658b4193700663f86da7be689d7f342cb35a2dc98f901fd4bfd300d6d0e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/nested-on.png",
      "before": null,
      "after": "d25ab2ced835393fd63fee0ac626f4506661a46498e075e9e6fe5edc5106c3c8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/right-value-on.png",
      "before": null,
      "after": "eb3e4586baa0b13cc1826d30d322c184228dc8100f0373b8927b3747ecacd950"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/single-opening.png",
      "before": null,
      "after": "694758b0e586253e21eb8d37077b6e5ee3da4cdf618d93f50695d94d65c5ebab"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/single-search.png",
      "before": null,
      "after": "7e11ead1615f8224f7f8cc6fe7e0f292fb2f08188f7258888af0eb273d7e0382"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/single-selection-navigation-2.png",
      "before": null,
      "after": "9f64458443b19ec462eb0274deda72adb3add969bcc76125492c564da6dfbc31"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/single-selection-opening-2.png",
      "before": null,
      "after": "b9e266474536d8451fd771488f09876a996f517372ad29625d22804c8df0ffed"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/single-selection-search-3.png",
      "before": null,
      "after": "f7a19f6900837f8f8008bf8326ccfd27afaf21b7d30c198346754ef7aedd673e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/single-selection-search.png",
      "before": null,
      "after": "31d7621c84c4ab4e651a17cd76ef0e83e95dd89c3aae3aa2179a775c60b8aac5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/spacing-0px.png",
      "before": null,
      "after": "9de1cb9a74cce61a32cb6b1b7f34acdac2323128a2bbd67e5ea866c8827c81c0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/spacing-bottom-guide.png",
      "before": null,
      "after": "708d421d9d6ef08bfa08b6b8bd4a2a6b77360e21eb713c5ab0025022a306a054"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/spacing-top-guide.png",
      "before": null,
      "after": "903b74ebdd93f9bf925e4b26c5b7d2456dbc6af75bebb3fdc47347d0fcae71ee"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/state-default.png",
      "before": null,
      "after": "8ea5b7f57ca34a77b3833ab9a144e562c0cb79ba956c31c3442cb0960680c03d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/structure-group-title.png",
      "before": null,
      "after": "b7eaa971b3a5a50388ec25139b17d9d9bdf37f3d0861e513b18be8474614f8b1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/structure-load-more.png",
      "before": null,
      "after": "7e25bca1b4e7fa96a8d7cf8398121a3f6d43f773d6cd1a648b87c3e741438756"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/structure-search.png",
      "before": null,
      "after": "f2b1989e3985587fad52eb1488e4fff66b0793be0154a197c8e7fc01d81e986b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/dropdown/tag-on.png",
      "before": null,
      "after": "eb1c063aedc118b80c23e16e01ce778f0767cf66e786f31511e0ba99e18c8ce2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/anatomy.png",
      "before": null,
      "after": "d9c7922418732210c081cd2fa1554ce4eefff42560755b2eab291b8eff47ef8d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/baseline-grid-example.png",
      "before": null,
      "after": "a2924d96ca8fcb50883734bdf9f9aa6ee727ce0554dd0ec83ada0d62c56b529e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/baseline-grid-text.png",
      "before": null,
      "after": "e79763f5b8cbdc69bb61776e98a1beac2d3b385be13fcbcac0cd2705acf62f3a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fixed-example.png",
      "before": null,
      "after": "7f3b6f4cab36e30f14c5a609568beb3b3cb43c19c4c102db7cef381497d4c95d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fixed-large.png",
      "before": null,
      "after": "a45054db16f7893cd9e9824516f69acfa3d44af4036510b6ada6ea398816d5f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fixed-medium.png",
      "before": null,
      "after": "77f34c21c3eacac6ff268dcb30cb056bfece08a23d6f3cf5d690310904a8a52c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fixed-small.png",
      "before": null,
      "after": "17df3fc4aff26ae78a5901918125dd8970fc5f683ba1582a99efe2b7f8d84893"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fixed-xlarge.png",
      "before": null,
      "after": "67d37c2d885eb3dce0fabac0c3364d666e2f095e592a228062b48c1ade700e14"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fixed.png",
      "before": null,
      "after": "9a0da07d59fce299d0d5706f64ddf268fa3cb4b1fd9fd13644d0ecb2aaa96775"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fluid-example.png",
      "before": null,
      "after": "abf03632762d83965270fd58b650a4ffd268eb51ff5be781f8ea71c17a7ca10d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fluid-large.png",
      "before": null,
      "after": "fa58c100c0270d50163aa19c8b8b48bc67125070d57eda3b5907b5b9cfb274a8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fluid-medium.png",
      "before": null,
      "after": "10f878baca773e60173b3244e0ca83a3842d659fffc8a62fc3d2a75f2463f945"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fluid-small.png",
      "before": null,
      "after": "6c00d7efc51f93d9d15fff44cb5f2b8c926252705cd252b7127532d4b3e101f4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fluid-xlarge.png",
      "before": null,
      "after": "cdbbf68894799cee2fcbdb6e985e0e6b01bb09cea88de13907233ef5553558ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/fluid.png",
      "before": null,
      "after": "d20600cd23336fdc21b1ce80e4d9f59549fca45d7f3a7a61992d0804e798cf72"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-container-example.png",
      "before": null,
      "after": "bada4d08a433e231b79bcd98b533bba55f9f8df4b325bbc20e3024bef90de999"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-container-large.png",
      "before": null,
      "after": "211a73261416baccca30ecdb3eb376680871abfeff1be011e68e848b52d2d1a0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-container-medium.png",
      "before": null,
      "after": "10f878baca773e60173b3244e0ca83a3842d659fffc8a62fc3d2a75f2463f945"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-container-small.png",
      "before": null,
      "after": "6c00d7efc51f93d9d15fff44cb5f2b8c926252705cd252b7127532d4b3e101f4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-container-xlarge.png",
      "before": null,
      "after": "c3031f8d586ab840fd575373016c3f3f9a4a6e7044649a0dfab0f5d3b1d79d87"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-container.png",
      "before": null,
      "after": "cdbbf68894799cee2fcbdb6e985e0e6b01bb09cea88de13907233ef5553558ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-example.png",
      "before": null,
      "after": "1212331a13bac30b54d80bd9966aa5c4f2fca62b9c8f8bec058b9ef92ea32784"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-large-closed.png",
      "before": null,
      "after": "1cc622b399471794dfd58d016b007946dc72e91f3b7bc044034aec0839dfd4c1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-large.png",
      "before": null,
      "after": "515d790d58edc2b1c6fc4a7376e85b15141755e5dadfd7b34dd1af16c2d8e2a4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-medium-closed.png",
      "before": null,
      "after": "3f2e631b63a99c9c4ec3789a01993d6b6e71a51ff4e35e5249db39e0be45cbe9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-medium.png",
      "before": null,
      "after": "332ad754d13f0a67cf357cdfed6bf178d4aa8354953e7bfb8c2d7bc8fa75705c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-small-closed.png",
      "before": null,
      "after": "f985523a511f2ffa302015b41f5d69e3b75efb069cbd31738a25dbe4cb32e45e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-small.png",
      "before": null,
      "after": "905d802c428ca5460285765d14f95ae2f6e23f2041b943e1c3f6e2913b85a16f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-xlarge-closed.png",
      "before": null,
      "after": "25644a3836188cda1683fa5f2d388ee0f80b124f2ff6dec9ae62846c7c0ae082"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel-xlarge.png",
      "before": null,
      "after": "98f573b68654301d1690443ac70495d9df38162a98303343e265bbcacde745ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/one-push-panel.png",
      "before": null,
      "after": "a441984c3be120185c0ef060742cd0f7cd93c4f9a1c08bbde222260430c5d27e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/push-panel-with-fixed-grid.png",
      "before": null,
      "after": "cd07d339c74a73e648245df1f7264e638e239f6e40e2a744ef6474e54b75c31a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/push-panel-with-fluid-grid.png",
      "before": null,
      "after": "0e97151da0558710aa65574250f0cd99ef65dfc9c953a19dee96aab49e2aa108"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-13-example.png",
      "before": null,
      "after": "02510f5cef2b4a9daed7be9587505240a78770c7c106787a2bdedcb7caea0b22"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-13-large.png",
      "before": null,
      "after": "3e22539c257cdcdf46548b3aebf63724531648996d0039f33b3ed93438cf4221"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-13-medium.png",
      "before": null,
      "after": "6ef96ad5e26748d23249ef5e56e13fb2103ac24e22495683d021e93de37179ad"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-13-small.png",
      "before": null,
      "after": "d5dd621afa2f58ceba46dae56bf87e744645ab7788488f5519210e52fc830d6a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-13-xlarge.png",
      "before": null,
      "after": "883b37c16732b8588d0e280ebbca417d2e6de3e9e0cdfc908c8433a978db2e45"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-13.png",
      "before": null,
      "after": "18a53bfa39c0d1cce90875d04729d86e0ce46faf4640d8a190cf3fbca6bc703d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-22-large.png",
      "before": null,
      "after": "99130a60d839e17cca831b0d39e03423f072b5827d34c6ea13346ba006c4d0c1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-22-medium.png",
      "before": null,
      "after": "dc4ac7496b501e5b26006326b25a49ef29f2b9994ee22a3b3019bcdf013e4c29"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-22-small.png",
      "before": null,
      "after": "801910db40a8437cf0f3c93bd02a61f643151f6017ad2a415a51ac0248628c1d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-22-xlarge.png",
      "before": null,
      "after": "c3a99eaea06ebec07bfd8a19f898dacb2db3856200c0fb26f518e208226e44c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-containers-22.png",
      "before": null,
      "after": "c99842b238bc8bd293bdf17bba3732e52009f437acfbe94824c114227a111de2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-example.png",
      "before": null,
      "after": "07014d182a29d34784faaaf583197aca0326b793504ab232ac8b0481a8b76de2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-large-closed.png",
      "before": null,
      "after": "597ae0f14736ba6ea702aadc3dec1ad95ee59001dab4f3806203de378682111b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-large.png",
      "before": null,
      "after": "f3f168af1b9fd19c5377ffebaf7bc65d8b9cc97de188f7d05b10c1674c5fb60b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-medium-closed.png",
      "before": null,
      "after": "5129fd2e72114c40db4d82b50b686cb7aa130452b09ce2eed774147a432bd6de"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-medium.png",
      "before": null,
      "after": "4c7b275893b6415fe470b17e89e256bba7f65a3d2afa614dad105460149ed598"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-small-closed.png",
      "before": null,
      "after": "8de020c94337843224fca3b4b90bd848424a1e1acc00c4cb6f58b44e6ed0c357"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-small.png",
      "before": null,
      "after": "2b242bba40275901038793e1aaa5aaf3d60ce7b83d91c2c0bdf423efd79c9588"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-xlarge-closed.png",
      "before": null,
      "after": "cdfd1df531d5eecce346eaa486f930c7ad6f4526333ee8d287033214408a7310"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels-xlarge.png",
      "before": null,
      "after": "d4f56d8230df8031b8e05161eb0cbf8e05c707a5ed1d8c3aa3f5c730bd1658d9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/grid/two-push-panels.png",
      "before": null,
      "after": "49cb6f9a0af75b590c1162bb45e8a452ed17fde59109a826e5116fa519a01096"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/anatomy.png",
      "before": null,
      "after": "566cc8e8a4738d96fe6b67b836882894c22f7e38b4e9c6df561c73f50bc559de"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-2-secondary-and-1-tertiary-2.png",
      "before": null,
      "after": "e7b282027682158fd5123b781366219b99c0e364396657d2789bd010c55cc74c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-2-secondary-and-1-tertiary.png",
      "before": null,
      "after": "6ad72a1b1540269bce87793e2b5cdc2c7cc4bec349dd1f39a771273482494cb3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-destructive-action-open.png",
      "before": null,
      "after": "4c20fca0bddcf03c6276518035f1bb0ea3f32b09f82cc5b37b129d3e161df9bc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-destructive-action.png",
      "before": null,
      "after": "7f1eda8090c68dc5dc31cf5c781c4b7222cedb4b35f0857755f88f96fb9331a3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-tertiary-action-open.png",
      "before": null,
      "after": "23453e63fd2f359ad17af20af83b06a57f4a8f15722951336cb9b7028eb30987"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-tertiary-action.png",
      "before": null,
      "after": "8e0d4a2ec0bbdf36e4f168becc9ca47594d81f367ab93a0ea5eea1101203492c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-toggle-and-destructive-action-open.png",
      "before": null,
      "after": "c5c6cfbcbd4700de875fd54068e45c48ae25d7a8afa8b3abcb6d4c65d477b020"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-toggle-and-destructive-action.png",
      "before": null,
      "after": "6a4d6a2f5d506d308dc8455a8e620e03da161afd9a92a1f97b6523cda74daa01"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-toggle-open.png",
      "before": null,
      "after": "3610e9b14aa0bca6997c4edd9674ab381fda8614cc6ec64f954000bc4202f006"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/divider-toggle.png",
      "before": null,
      "after": "33162b6bd1eb761a9ed7d4f113ae5ae03459fc31af8ac7628ac0022644eb0b3d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/dividers-section-headers-and-dividers-small.png",
      "before": null,
      "after": "251ae5a590706b2e5b8ef3d7fefee9288724ffaed85e1de1f16ed2e2605fdbc3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-actions-large.png",
      "before": null,
      "after": "51ed0973cfea51a488fd79b53088b31d73ff482feacd80456eaaa59a26c061d0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-actions-medium.png",
      "before": null,
      "after": "fc8c7843cd05116a55e98d38f8ec7517bf3a683ac028c4bcbcb00c3a71c28854"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-actions-small.png",
      "before": null,
      "after": "76acc2cee90b74fb0e9344c6e9b16dc267383423f1ee39a1cf7d8f04060d3e5d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-and-multiple-2.png",
      "before": null,
      "after": "bcf49aaf01a1831980a7a1fea0d7eba2a873d2b8606cef11bc44781b08ff86db"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-and-multiple-3.png",
      "before": null,
      "after": "e15a31ac6c214728480219cef026af72eb7771da03db104fcb5e37717435509c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-and-multiple.png",
      "before": null,
      "after": "f1d33e4f6f163012ca4d22939e56f1e3093516cc7c26dbda40a397bb5e5dcce8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-and-toolbar-2.png",
      "before": null,
      "after": "97119573769c552fdefa9d969673e21a64298ceafcc94ab5d34a7fbc87085abf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-and-toolbar-3.png",
      "before": null,
      "after": "1dbb6171035100a7a1ef8a33a3bc94fcf78e205d1b653a2eaf3d8b3d29a8787a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-and-toolbar.png",
      "before": null,
      "after": "dfb827f32a590085b78074722c758e4ff7eb7d291bc21e6b5ab481d0e92378c6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-large.png",
      "before": null,
      "after": "a12ed724e5441feb0cb176189c45b1eb71339824514fb8804635d8e7cd8cdea6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-medium.png",
      "before": null,
      "after": "2b88b1071f5a3159e35d49a4a9f4cf3b00856cc839b541ffa258aa08a1298dab"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-header-with-nav-small.png",
      "before": null,
      "after": "7e0d615725ac7e1bccdd4ddcc402af8073e04d4395413db5764897253d5bb159"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-headers-with-and-without-borders.png",
      "before": null,
      "after": "4c74a3224413b80f57654e4e2df146d11bf96339c8c33554fd65597f233f0b13"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-simple-header-large.png",
      "before": null,
      "after": "6df64e84ea8f01f9e180f43d86866438d9b077843685e8aba8a40d6b562b6ca1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-simple-header-medium.png",
      "before": null,
      "after": "4e366bdd8633f8150b6db952b3ac6868ca57b7bde71572c06958d82fadc4534d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-simple-header-small.png",
      "before": null,
      "after": "7414ed6a0b406acf586f2b2aaa460b5f7193b643efcf9011afbbcc7c917a0a6b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/group-used-with-a-nav-toolbar.png",
      "before": null,
      "after": "f19b776e5a77b8ac3a14d64c8c636d46a455511c91ef732645caff567c3771d2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/guidelines-placement.png",
      "before": null,
      "after": "9817f84cb3dadae28567efa03db6efb409a64f703b907fd8f7297ca4a8d72f3c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/headers-vs-section-headers-on-panels.png",
      "before": null,
      "after": "17d096dd8a965d1d78f2d1ddfae9c07d792de485808c8463877fbcc6fbc109f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/headers-vs-section-headers-on-the.png",
      "before": null,
      "after": "b2c9f481383ccc93ac76db2df03be9a87822e6e3e5bf50071564ec131bd5f07e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-required.png",
      "before": null,
      "after": "531710fcb4df782704c0bc69f2b0b983ba0dbc291ba916458c3e2b0a102ed66d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-with-description-action.png",
      "before": null,
      "after": "51bc32f54b7e1ee84c3f72936274e74ada6f3428c92864be43a6b49cbd1e65ad"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-with-labeledicon.png",
      "before": null,
      "after": "58b5cec79f4083bc06bd646726b76eb6fa86cd7c07bd844bb32e24f383959eda"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-with-pre-title-dark.png",
      "before": null,
      "after": "c4ea80372c9ceb476ced8c5851531cc7b79fdf8ae351f44b8ffa7c442b50d6c9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-with-pre-title.png",
      "before": null,
      "after": "0a1cbdc097fb99c24ac4ca2d3d2c3d9e025379e2608624a19829d2dd8cc46c2d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-with-subtitle.png",
      "before": null,
      "after": "90e540c7bb8ce9c41d7d1eba3f3236b6e8b08565da52866cbc59d8fafe1b4312"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-with-title-action.png",
      "before": null,
      "after": "ce9c71ef8cc67fb4175f22295aab3e8dbf4d29e080200323158e335098aafde9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/modifiers-without-pre-title.png",
      "before": null,
      "after": "792111c60cde48c200955b4c02891e9cbe3681c350aa2fec9616c2c4f2238654"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/sizes-size-large.png",
      "before": null,
      "after": "5721a3da587d4b3bae329d4ec85639542b5a4e8937498ec945c31985577d5913"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/sizes-size-medium.png",
      "before": null,
      "after": "4b4fd17bb45fe1bdd7b678ac38f722d2007ba7d5f7e549075c433dc172e1dd5b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/sizes-size-small.png",
      "before": null,
      "after": "f20b46b81814805a92d20d7adc0d9763b8f43762513efad5a7fc557baef138bb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/spacing-spacing-large.png",
      "before": null,
      "after": "aa526dcfab02ba50a60fad0506fd08b1a2df0ab64aaa57b77fe9e00180fd71d9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/spacing-spacing-medium.png",
      "before": null,
      "after": "42ff3304770f86fc29ca2614b94950ef21e98f360e54a2aff1038b2b1ff8cb5d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/spacing-spacing-small.png",
      "before": null,
      "after": "a3cd78f4793efb403baa9106a7ecc5bb20d6b494fd74ca26cc380fd550a18f0b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/style-multiple-secondary-actions-open.png",
      "before": null,
      "after": "f6ea22cc5c493b6426f47cf84390c44696c05b1245f2300e735fe23ca8224d54"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/style-multiple-secondary-actions.png",
      "before": null,
      "after": "0c3f0291ad7b3c7f06eb41c94a2f5e1d9995d8f18f48f7eb770fe4b882eac898"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/truncation-long-description-large.png",
      "before": null,
      "after": "fc24fa0dc742f39ede51bcfe0757257b17eac0dbb31916d5e1a6d942b3cb61b5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/truncation-long-description-medium.png",
      "before": null,
      "after": "f56f3b4efa3b94aad0c6531afcb27e7c955a04fff3941ba147ee63dfe38e572f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/truncation-long-description-small.png",
      "before": null,
      "after": "8814719f7ade85025a0f669dff3e8bc5fc5d8850383bdc99221a8aad90b862be"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/truncation-long-title-large.png",
      "before": null,
      "after": "f60736a02d64fe200eaa2a5f78379a0469f1c8d2f411635cdf2c0f6e8d0351f8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/truncation-long-title-medium.png",
      "before": null,
      "after": "c5ab64a84531fae289312f8afd19719f71cb5bfde8eb092f96ae08a2779656c7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/truncation-long-title-small.png",
      "before": null,
      "after": "52171ad54f6a0515d147088b28b0f7b8e843049f08dc9fb2556ffb9832af9cc1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h2-large.png",
      "before": null,
      "after": "c91993c2a10df499ee71f1b36095b88cb9dcaff4532670cf784bdf829b49bb7b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h2-medium.png",
      "before": null,
      "after": "631a1fec622d28ec604b683e36ced43f43ef05c05608ce2a2fb6397cfd78a2be"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h2-small.png",
      "before": null,
      "after": "067d04be6ebe431eba872e61eb8ef2cc58184febb57c8d329858ac1c891bfdf4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h3-large.png",
      "before": null,
      "after": "bab3bee40de998e27322ba74866cb7e93ab7482c2d0b683e6bd690610f60c189"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h3-medium.png",
      "before": null,
      "after": "946fa9b5cc9aaeea63eee60f9777478316df36d2ffbe2b88bbff14671f4b6dcd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h3-small.png",
      "before": null,
      "after": "a5fe91f70037c30a6d27fbba18db929c2a678a9417ef74d994e3b66a91bec01a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h4-large.png",
      "before": null,
      "after": "97a110842e94656c9819463ee6ef1e79a6fec9dd880196fb1467962a8aa84b4b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h4-medium.png",
      "before": null,
      "after": "acdb266dc12836ed78a44c3a8e8ad15f34e8667e7d4994b4ec0947d31bb053f6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/types-h4-small.png",
      "before": null,
      "after": "8585bd224ed9a4062a845f87e8424a9ab35c03b145ef318a0c3f17a670b255eb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-3-secondary-and-2-tertiary-2.png",
      "before": null,
      "after": "b7e827d4cc6f587b322e3a6034eea5a403b38329818f7910197c91b91ce6eb96"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-3-secondary-and-2-tertiary.png",
      "before": null,
      "after": "ba0a09e54b11a074540891d8da524e3acf374e62819458953e3cd33384a574d7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-3-tertiary-actions-open.png",
      "before": null,
      "after": "6c7116a1feb5bb0ccf86258f5be2de2d3ac1ffd4804997bac4c117339da6004f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-3-tertiary-actions.png",
      "before": null,
      "after": "6bef1e000eec763ef7f060295db7bbb1f2812b685e8f361a83745cfabb05e2b7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-5-secondary-and-1-tertiary-2.png",
      "before": null,
      "after": "c0e0175f97681af2db2f320824dc1e0642d9759d8126ae4af241b99abdddb1db"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-5-secondary-and-1-tertiary.png",
      "before": null,
      "after": "038fa0697ed9b0c0ac1e4641a1f578f5e0b2c9cd863c6d5f556a3f4c9ac74c12"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-5-tertiary-actions-open.png",
      "before": null,
      "after": "cd19627570024c5ee69ff22b9cf5d5e81f11d03bd3f317e1d3e0340922e67292"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/header/visibility-5-tertiary-actions.png",
      "before": null,
      "after": "5b29df13743b0c061d58d253b4761b80f33ce706b85e5c9f39878223c438dcd4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/alignment-do.png",
      "before": null,
      "after": "2d8a04317bd345f774b5dc775a427a74ad01584ff76512e3720c51031c0e1b6b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/alignment-dont.png",
      "before": null,
      "after": "275e386cdf57bfd75d15f92cf10b045321ea02826c967e57181e3f9f6d052af8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/family-over-friends-do.png",
      "before": null,
      "after": "688b31c69740298c32e71a001250e31f7c26dcc80137740756394f4c3260516c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/family-over-friends-dont.png",
      "before": null,
      "after": "01e292f326ed34a91401b2633339ee2f7c0bcb5055d6779ca979b682930ec62e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/icon-sizes.png",
      "before": null,
      "after": "60d5a245e15b914e60a429fbbe6812095c4764c95a60f29ad4aa68733909e9cb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/informative-title-do.png",
      "before": null,
      "after": "2cf4b95479c38bae9579d346a258d5a7edd8ba7a68ad5e053b6e8405158c8d31"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/informative-title-dont.png",
      "before": null,
      "after": "ae55a3c3dc3ac109969e4002784b52fdae4306523208e1d0eca75dc07c2fa606"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/pair-icons-with-text-do.png",
      "before": null,
      "after": "12c346e93434d81dd30acc42f54ad78a7f30e57cb50f86ce7fcfc471c62b64bb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/pair-icons-with-text-dont.png",
      "before": null,
      "after": "f005a7a792fc651a1fcba74fe73d256d96d0d40b77c82678e2916d8e6cc2b15f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/simple-over-detailed-do.png",
      "before": null,
      "after": "518a6d93c54778aff74b0ce4509f41f9895e27e90472a64863d190fda806b92b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/simple-over-detailed-dont.png",
      "before": null,
      "after": "c2dcab1e215d06e880d38cea7b9ef0ac3b301afad3bfba2c592780505c4e0888"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/usage-20px-search.png",
      "before": null,
      "after": "fe813a6a0d77a0f2d54fb0562661b5e984fadb375a8830310aaa627cd52b9939"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/usage-24px-media-controls.png",
      "before": null,
      "after": "40afe7d5a016ee3a0a0be081fa9f012a8798fe2db16df836510fa4b27f03351d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/iconography/usage-48px-major-icon.png",
      "before": null,
      "after": "263518da6d72bffc2c4119f62a19ddb002ed9e1727619dc5b2d62a44db0cdca5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/anatomy.png",
      "before": null,
      "after": "f82e3c4afc092a70268d5e0a32a1a948f773dbb4c6315be240b5f67f6d91432a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/dodont-caution-1.png",
      "before": null,
      "after": "b4cf9eb9c2a57530c2ea8c398e3cbee99e1c5beae3c95f06c1099b9bd2087b29"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/dodont-do-1.png",
      "before": null,
      "after": "9c2153d6023fde1c60bdb46cf076061a7e406edea290765c23cae1b53614bd9a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/dodont-do-2.png",
      "before": null,
      "after": "4b9850abf12e980cfb95e7c280375d405c03035fa2edb0f7787acfcabc500400"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/dodont-do-3.png",
      "before": null,
      "after": "ff285c93b2326d357d1771d65e3e0647a1ca6a99a3925afd6ec18dc5c60f2f3d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/quantity-2-items.png",
      "before": null,
      "after": "4eec694886a9a334d6ccaa0a020a278ea82f98dd2c078dd776910c0ae632c8d1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/quantity-3-items.png",
      "before": null,
      "after": "d90d6f2255db9818d0d47a78ddad821fa5cca98bad7e482a57f40f7032448d19"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/spacing-annotation.png",
      "before": null,
      "after": "a8ee1044e4b1e2665558fefb470111f3ab79449baca8f51e83a8bc1f7e622af9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/spacing-first.png",
      "before": null,
      "after": "b31de866c547e9735c7f450009ee5393aa25dbb62e1e7413b7bea30380487cdf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/spacing-last.png",
      "before": null,
      "after": "b6273953306af9c75c03a3e071070e6dc102304996a20e157c8f5fd3e2a9021f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/spacing-middle.png",
      "before": null,
      "after": "8556c6826b1cfa96fd32dbe545fe1a5dfd2ed8e0e673ac9551973957bd7c67f2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input-group/text-truncation.png",
      "before": null,
      "after": "9bebdfd2944c58488df4a3ba9523417479973b98d360bdc74d83484d5462d567"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/active-placeholder-input-active-placeholder.png",
      "before": null,
      "after": "627f5bed45b5f700a618af679b025a1351334d0ae8fd7827e1cb3f013e9e370a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/anatomy.png",
      "before": null,
      "after": "304c71963c1f71a0f0ce8a1840721474f9968a8ed5457fa533164e2f8a9e4783"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/behavior-length-of-the-input-do.png",
      "before": null,
      "after": "2cda21c93a2a8e3d37ddaa422708cf149eb364a5357bc11a445e4a99ca587e38"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/behavior-length-of-the-input-dont.png",
      "before": null,
      "after": "17a477fd1ab08254071ba304dfac739a87400eb90930a4c3a6f7427161c29a56"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/behavior-previous-search.png",
      "before": null,
      "after": "07005405623c6f0fea19c1ad7ef509f0b83f0ef446869524cddf8e0389346775"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/best-practices-avoid-the-use-of-2.png",
      "before": null,
      "after": "8c27ce71174f0c144c755412830ee6edc29fb68592b18ce081e6b2b94b7ef5f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/best-practices-avoid-the-use-of.png",
      "before": null,
      "after": "26aef910e4eeafc2f1a92437e8f5f53781e792ac7531137e5a095e54d49dab82"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/best-practices-provide-a-valid-label.png",
      "before": null,
      "after": "58e0f42be9e5dd6639c14c1452fbef18421795071825171ca8a691aadbe3ab91"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/best-practices-validation.png",
      "before": null,
      "after": "008e421d066f8a13050fcdbae9d6396dd56e05971799d204f41248bf1d27127f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/do.png",
      "before": null,
      "after": "e96bc955e5b7bc083a5fb2a65ba3d03271434e3df97c86e44d0f835844889ba5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/dont.png",
      "before": null,
      "after": "a9723295b68f52b5f88eaa4cad220c0d8382617ba4fea9a1586ade6d85a6ef67"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-do-2.png",
      "before": null,
      "after": "c27907de6929d27e09a52600ab07185c08c7bf865bd78f80563ce682d4b20a45"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-do.png",
      "before": null,
      "after": "863ecc01eee464916268ae7d3bed56ea325fd6c5d2ce28145c6597f7e9a57734"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-dont-2.png",
      "before": null,
      "after": "2a6457f42dad5993b773124a932c4666038555acc44670f51e0a91da40d8b59f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-dont.png",
      "before": null,
      "after": "65867c1063e83cd057d211b9cdf0063d67bdef43d9d2fd85cd83e5bfbf9f2b4d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-placeholder-text-do-2.png",
      "before": null,
      "after": "ca50334530ebaa09cbaacbb32257244df0b135ff39eef02a8aa035be5ced2c25"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-placeholder-text-do-3.png",
      "before": null,
      "after": "74e1e0a96d95939b963a2cb2c563a0101247e69e807989605a2f373e2c52f784"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-placeholder-text-do.png",
      "before": null,
      "after": "8c6810194daf356d05f758c0230b4433f8058e8f2e56361aced765d7e998e985"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-placeholder-text-dont-2.png",
      "before": null,
      "after": "3b14869d3c561e5390da2b48705e5357ef01c8dc91d9b8b255ba7bc7874af79d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-placeholder-text-dont.png",
      "before": null,
      "after": "c3d9fcd502903ef87f2c94beb7935cc541c3ee395ccce4e96e39820c19d7cf2b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-search-fields-do-2.png",
      "before": null,
      "after": "85e9cdf48460409cc336494a7b9207acb3d976bf0fbb35afcfcda34942315e64"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-search-fields-do-3.png",
      "before": null,
      "after": "4d17a624d42344f944267928d01c841ec939af1429bf1b6d720140ddcfeae428"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-search-fields-do.png",
      "before": null,
      "after": "175746e5ccc87a9e16a8f158393292557ac52240e0d2c217ca3f03c265b8ddca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-search-fields-dont-2.png",
      "before": null,
      "after": "7f54d1e98b71b8bb4744ee417c569c61d492b15c5550a812f0821890df9d738b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-search-fields-dont-3.png",
      "before": null,
      "after": "ef108e018a70bd09aa54f334d05c2e5e68a514f715e8c08a7cda9b5f43e3c184"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/include-a-label-search-fields-dont.png",
      "before": null,
      "after": "3ff3dc5b72358ac7bcbd8eb239e0e04233997d3d9191eaa307c0535e4512a73b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/on-dark.png",
      "before": null,
      "after": "c3f4e12083ab5098157da691016db9bc7e85eae6ac3c2322af6160f70e68bed0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/order-input-focus-order.png",
      "before": null,
      "after": "109ce5a5116eddddd5ef27a9ab7683e124a239b611864f67ed441b63d5d39995"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/right-aligned-numeric.png",
      "before": null,
      "after": "4660c94a7cab53a8bb92b567169456ec7941c2502f648fcc57e07721d8323902"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-active.png",
      "before": null,
      "after": "7114a184507f5ab03fd58b96e5a1a676bf33a29b2a141c9fea05c43c5b352fa3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-default.png",
      "before": null,
      "after": "fea9dc101f756deab34507cc58db78d95226c52564dc686aecdf938ab92073cf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-disabled.png",
      "before": null,
      "after": "06c804675f3db14abdbbde35ce8f53a682368dc0f2464b9dd3cfe4cda3a5f31b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-focused.png",
      "before": null,
      "after": "7114a184507f5ab03fd58b96e5a1a676bf33a29b2a141c9fea05c43c5b352fa3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-placeholder.png",
      "before": null,
      "after": "234104da7bd2dc9a8afec09d00a103cc2213d4afd0eca28f903d08e3c3f69fc1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-readonly.png",
      "before": null,
      "after": "ad9bcae1120725e1a2916211f261aa520723b1dc60a149151d465a21dc3254fe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/state-required.png",
      "before": null,
      "after": "4fe742751cb2412e60e1efc01ceaa6d78378f7dd3aa05f2115b18e7504dd6efe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/states-input-error-placeholder.png",
      "before": null,
      "after": "400a901888acdf53becc64ae4b9197a3f980f5965839ad21b232edc3246eb740"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/states-input-warning-placeholder.png",
      "before": null,
      "after": "341f05cd616b51be8815ee6f016cbb6a388966ebd91b182737a27a95380a6c1a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/supporting-label-description.png",
      "before": null,
      "after": "32b0399509239c2356ba3752ac7f75e8edf6d2ca96f251675615fbc7917dc687"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/supporting-placeholder.png",
      "before": null,
      "after": "fdd0df758636496f0eedfa0723879ff5db7ebd4031f0ba39aa0c1d7952ff7c23"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/validation-error.png",
      "before": null,
      "after": "d35115f3d34cb650dcd0d21aa869cc62378d6d2f70e571eba33a24866b90552e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/validation-wait-to-validate-do.png",
      "before": null,
      "after": "7e1228cc3f8236e77dc5160df4e1741cf9f2de3a28669969d4c2b08972cc6f39"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/validation-wait-to-validate-dont.png",
      "before": null,
      "after": "3f3bd0190a314b1380338595afc6ce7bf9a566e1479268b97131363966ca4331"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/validation-warning.png",
      "before": null,
      "after": "185b563f667eef889cca14fc3d21011dbfd3bd3e528034f7291fffbcca463c20"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variants-password.png",
      "before": null,
      "after": "dcc31e6ff39d8b9ce2421d64dc298dae0a3dd365b78964ab173fc883ff6b7101"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-currency.png",
      "before": null,
      "after": "f38729f50b49ccb6dc370dbe2d804675ca64ddbac9b81c49d38c051258a959bb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-email.png",
      "before": null,
      "after": "d434799c2d915197ab6d83cac02270b4e9017ba97b2d1aad359c211bccc07f6e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-inputgroup.png",
      "before": null,
      "after": "4a4f376b97a1b43bd408d1b163d93e7346682180d9c02f8258f8b4812e644187"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-max.png",
      "before": null,
      "after": "e6d2fc74747d25ae80a172ea499647cc9907f2a445c7343c2c1152259da926c1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-number.png",
      "before": null,
      "after": "676ea11ee05532506fcb0c5d25788fb9b54638b654fc291afe96e4ee5bea4d23"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-password.png",
      "before": null,
      "after": "2f35f1cb3ccd7c871d7a19a0bf6872fa548c6a4ce6d4b1315f7733066f99ac14"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-search.png",
      "before": null,
      "after": "bb20893bc50349b4c8c9ea3ff8a1a386b208380bab2da1d099b7bae0cd8a5d33"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/input/variation-text.png",
      "before": null,
      "after": "766cfa87d3de34d3128cbc6cdc19aa74a7adcec04dcfce9a9349139695058c2c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/anatomy.png",
      "before": null,
      "after": "1c87c0292d0ccf84267b4d67dba784996d79b3ca79f9874169848565cea88ff1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/arrangement-full-width-2.png",
      "before": null,
      "after": "76d361dab5e50d709f20bc6341799a678e5c89355040e353a4bc28604a7aa420"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/arrangement-full-width.png",
      "before": null,
      "after": "b974fd7fd34b16258ba152f766295917d7828b1c970a2ce8da17dff6e854e8c4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/do-s-don-ts-label-color.png",
      "before": null,
      "after": "6b896dced0b9d07a0e155095aa1a6dc38280134bc5f919ff763ccab712055a21"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/internationalization.png",
      "before": null,
      "after": "ef84f9a6f70d29c0713e7ba2c96c8276b896227db654077a91578f056292aebb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/label-color-dont.png",
      "before": null,
      "after": "1aa21184b53faa03e3f1790e76e04ac0b4a66aeb1c2a5903d17ef7dbd1775089"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-description.png",
      "before": null,
      "after": "2eea3ec008aef899cc37dbbbefe5dcd459018e457d5e366e567a15188b699a52"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-info.png",
      "before": null,
      "after": "d0444d40c46b75eed8f425a86f138040df2243bd5019205b6d2c87fce455da0a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-label.png",
      "before": null,
      "after": "12e37d76bbfaa540fa2c0c68440065fd3b01d796542809d1d62354b0acd1863e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-link.png",
      "before": null,
      "after": "8b9a7fb860a6c890f0166640e86f139812fce3ce63e4e88ea16973dd1c52fc4b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-required.png",
      "before": null,
      "after": "49b4a6066dfaba26398ce3b54b34cb901b071368486d6c8f3532b78825e3b142"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-secondary-label.png",
      "before": null,
      "after": "fc4b0ef7a4fc2767bb872d1e7ed39706eb78a26ca1a96c83da3c7f09664ef1d8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-tag.png",
      "before": null,
      "after": "916a43916833763772f41f70e4043bc8956123af3cbac5f94f4dae87e3e09c31"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/modifier-tertiary-label.png",
      "before": null,
      "after": "f141ce1e0e5b4b54f5f3124cd0abb7e57c0c19653d1584e201831756018bc198"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/optional-do.png",
      "before": null,
      "after": "61915e7c641f41a1e5f523ba76991b09e404d98b97df9fe5a7ddcfbf33fe1c32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/optional-dont.png",
      "before": null,
      "after": "cb5995eecf3574a418539f5df4783ceae695d444ecc51c654e9563a3459aa622"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/overflow.png",
      "before": null,
      "after": "bfdca5c6654f5f2ad7cc68dcb6beb3f46954e28f7b1e0534e619cc9e92f043e4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/position-top-right.png",
      "before": null,
      "after": "ad129131d6b0aff5412c37bbf5597c2f8f1d3649e1468543782135ac8c9bb1f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/requirement-do.png",
      "before": null,
      "after": "9f2a2de78cd106194deb70db415cb66eda1baf8dfbc53cb3af5db395d4b4f776"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/label/requirement-dont.png",
      "before": null,
      "after": "70ff89140e3a2a006888ca0e31595c903aa74f0d36bc53134318e17674f38c9e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/anatomy.png",
      "before": null,
      "after": "e6bce5669bf1d7914323c6ba508d191726a1e1226ba9337c3ef5d77f46e5646e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/cases-in-table-cells-to-show.png",
      "before": null,
      "after": "6ba685a3f04ee7d9d914004e4dc28c49a430d23289e378b37be21b3992e408b4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/cases-in-the-header-to-highlight.png",
      "before": null,
      "after": "3abb9eea6c6029ca6f590a959c470bdf2f21b7a18cc767a1f0b4d56dba64cfd9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/colors-icon-and-label-info700.png",
      "before": null,
      "after": "87872f2331a0556a9b721aabdc5d5fda4316409651660958414f90c95290ab28"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/colors-icon-and-label-secondary800.png",
      "before": null,
      "after": "33d5aacc91f9a5932a52d85fb6b03de9ed37933fb3cf12bbe70cc7f014ccad9d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/colors-icon-info700-and-label-secondary800.png",
      "before": null,
      "after": "82611e02a6e15096ac9657f5b2171ba8036696c914f3bced339ac613824213c4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/guidelines-group.png",
      "before": null,
      "after": "49a2e5d88fe280f5ccc2fbe502ca7d3a175da06cf0c5eb835953d157625f99df"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/labeledicon-link.png",
      "before": null,
      "after": "02e0a1002eadb6fa26c77e4d1c6272b9b1337a79afef5ff90f94c95f94064535"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/labeledicon-transparent-button-with-icon.png",
      "before": null,
      "after": "b676ebe2d90d0d2f4e30dcbb7a16701827a0431967aafb6798e7bb6d16d0fd7d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/sizes-large.png",
      "before": null,
      "after": "a3ab75f95d2ede912dfcbea525a19af7704a97d70d0893353014949b72df574e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/sizes-medium.png",
      "before": null,
      "after": "e2b8f6d8d466a39cdeb8a55ccb4670574d646704ad4b113eb54a11f40ec75425"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/sizes-micro.png",
      "before": null,
      "after": "cb427243bf21e057062a26681519d23321e77ecdd47e342b9fd7d7864b11a389"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/sizes-small.png",
      "before": null,
      "after": "bded1bebee39fe3810574b4b4dab5935845d796c16eb31ffda392d7db1d6a0db"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/sizes-xlarge.png",
      "before": null,
      "after": "e1c97c9bcd2108c2f24366ef0605a499304075329fe4d243f0bd146deca7f293"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/labeled-icon/sizes-xsmall.png",
      "before": null,
      "after": "00070795d04d2347ead1edcafef546ab02a024dd4455b75d521f24c303119ee3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/block-example.png",
      "before": null,
      "after": "d1f9a82370db72e2acdd683c3f7c1a12e8f4e624fcde08047a13cbeabfa21364"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/block-large.png",
      "before": null,
      "after": "75bb3f4db3cfe1db8efa93875c66b4bb645b225c564899fe9a6033c066c7a631"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/block-medium.png",
      "before": null,
      "after": "f63d579ca779397d608563701628edb94a68140c1b727ca4b9dca61033deda2a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/block-small.png",
      "before": null,
      "after": "f7dd82826f12b2570bfae0026c9516ea3c4f9e5aca91a2f27284df57baab3c57"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/block-xlarge.png",
      "before": null,
      "after": "58acdbd725c134431114bf5161611cc6907aaab8c121448913963cb0dd8ce329"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-calendar-example.png",
      "before": null,
      "after": "379196a5450cc010957a24338858a217abc797cdbbb778053b1365d9578f8109"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-calendar-large.png",
      "before": null,
      "after": "857e5a21cb6ab6b1601288dcd2d4eee90d5b54cc8a8bd716f19939442508c8f8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-calendar-medium.png",
      "before": null,
      "after": "258eaf12c1b04f1b6c27f3dba04366312ef84dc345fdd77aaf64b0bc18e8ca53"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-calendar-small.png",
      "before": null,
      "after": "585eff6c310e77dd9602a1cc08295bcade38bce1275f20fb81eaa8057643b7fd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-calendar-xlarge.png",
      "before": null,
      "after": "ce549463ed2ea470958e30badf4668a10f5cc7c9957b203c77a30cd42baa84e3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-form-example-one-push-panel.png",
      "before": null,
      "after": "8ce346a52359b635b2691ae0172d30bec9373bf18d689473496885cbe115389c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-form-example.png",
      "before": null,
      "after": "aaa046aac31259ff16572f7a20e841104c1d7fde2d11aa11d783e52960df3b0b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-form-large.png",
      "before": null,
      "after": "c695800148be749c7567ee5d287d68dd078528c691ad57f74570616937c453dc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-form-medium.png",
      "before": null,
      "after": "c55e1e897a6cd27c9ff7a476ccd7057bd38b50e74ae9fa29bdc57055a826d8a7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-form-small.png",
      "before": null,
      "after": "c839b621148d5090a92101d10334788b87bb8723967c3b784162a1203445dae7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-form-xlarge.png",
      "before": null,
      "after": "4b0a0194258c005444ccfb170b4d9072b0c5e419a9d4a55c8aab6f6bbaae4f8c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-large.png",
      "before": null,
      "after": "4e2c25d27df566f0d0ea1a38d3d65ee0f7ce395cc3e0dbcde1cd970bf5b89e88"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-medium.png",
      "before": null,
      "after": "2c0e4b62a3ea3aeb95f9cde9cb2dcce62eb0e76a4ec2245c69b9c805b22606a7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-small.png",
      "before": null,
      "after": "8b25e45100f2c376f661e6e5c8ebe6891b228dc09808b33c8b5cc3cbae03a8ce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-table-large.png",
      "before": null,
      "after": "211a73261416baccca30ecdb3eb376680871abfeff1be011e68e848b52d2d1a0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-table-medium.png",
      "before": null,
      "after": "21ce582e430de58d3b7775d512e39458db2b012fb39ed8395dc7266ef616da0f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-table-small.png",
      "before": null,
      "after": "dbba4182941558021983e471ba68d81e4d73502f6579f2b28dc37d3f57e03523"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-table-xlarge.png",
      "before": null,
      "after": "c3031f8d586ab840fd575373016c3f3f9a4a6e7044649a0dfab0f5d3b1d79d87"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/column-xlarge.png",
      "before": null,
      "after": "e0779963f5502c553709697444dbfa15a4a540d2623786d6a10ea906255e1727"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/flow-example.png",
      "before": null,
      "after": "07014d182a29d34784faaaf583197aca0326b793504ab232ac8b0481a8b76de2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/flow-large.png",
      "before": null,
      "after": "2c1983f7fc05db112b2cd0416ca4052af184b61c9716ff8c71659826c53649ed"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/flow-xlarge.png",
      "before": null,
      "after": "e52ed8e5db60b1c1132b24395ace58a245f67323f3b66a2a2177692b614420b3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-card-large.png",
      "before": null,
      "after": "62a15269c1fccea0e8546ba5b88108897df04132bb20436797b8fd08abb02ac5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-card-medium.png",
      "before": null,
      "after": "4fc8bcdf48aa37fe4aac3a191da06230e88932da427c94286d4e933c34a7f73b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-card-small.png",
      "before": null,
      "after": "552e01c215625c3caff307b6c766d965f0f73c872d25522859693a57e9fc05f1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-card-xlarge.png",
      "before": null,
      "after": "5e3c5e7d4608c650742e2bbc7c4d25b798550e7059261299515f966c35095ddc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-example.png",
      "before": null,
      "after": "abf03632762d83965270fd58b650a4ffd268eb51ff5be781f8ea71c17a7ca10d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-large.png",
      "before": null,
      "after": "f1726ea28cd2e3fb28001062fa91dc2d07b67e9580132453ffc2e80c63b8a56e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-medium.png",
      "before": null,
      "after": "0d40c419ab332de22b7829bd69642bb49538e28675b8ba6104090bfc685ffd7a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-small.png",
      "before": null,
      "after": "06683491658ca446e56f9c813f842dd77511780d32cf586a01bf9cc27fcc59ed"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/hierarchical-xlarge.png",
      "before": null,
      "after": "6cecb7c2d513497d434e4007ec575dc976068702438184185863d4a495a24b82"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-cardmodules-example-fixed.png",
      "before": null,
      "after": "cfc9f24b200e3dc8d5ae6d875155951ceb4d20b9cb4c59758f2660a15dfd74f1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-cardmodules-example-fluid.png",
      "before": null,
      "after": "a218abb6927bd1889f1a2fb96a2af858310799edfe1f5a2f72fd0be587377c97"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-cardrows-example-fluid.png",
      "before": null,
      "after": "bada4d08a433e231b79bcd98b533bba55f9f8df4b325bbc20e3024bef90de999"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-large.png",
      "before": null,
      "after": "ecf904a5766a4ec23192f31ca171e35e18ecf87380bd144651415593d03abf63"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-medium.png",
      "before": null,
      "after": "eb801ea20e66d0c60ba300b0db4167f55199d8691bea1884b16a53688f6e5041"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-row-large.png",
      "before": null,
      "after": "d4d8eea26c71b34268f697336ef21dc47c44acc66fa6169a75108dc54adc35f2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-row-medium.png",
      "before": null,
      "after": "4349659a23438cca07c173a118bd191bfa6cf868cc7e698fc6e7e3a69bce043f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-row-small.png",
      "before": null,
      "after": "e6a17f3c6d8368ae9dc7e702e24fe8f4fd5750341dd716822e76f60076586093"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-row-xlarge.png",
      "before": null,
      "after": "cfacf20b02bf8ab61455dbce7d2317ac68083b151f3c335a3523b0e32996e51d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-small.png",
      "before": null,
      "after": "77666d0ebc4d6d7478667d11ada022b5e692dc4a9ea8b00fc8b264570d13dc20"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/layout/modular-xlarge.png",
      "before": null,
      "after": "98c4bd0d49fa92b3b44a13ad44c3b475eced1c23b926102a6e9e593bb8e4767e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/anatomy.png",
      "before": null,
      "after": "47083d716952f0e04ef7e4f82ac10b753df39ad511135b328d9f4b287eab434e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/comparison-button.png",
      "before": null,
      "after": "b676ebe2d90d0d2f4e30dcbb7a16701827a0431967aafb6798e7bb6d16d0fd7d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/comparison-link.png",
      "before": null,
      "after": "02e0a1002eadb6fa26c77e4d1c6272b9b1337a79afef5ff90f94c95f94064535"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/group-link-on-message-banner.png",
      "before": null,
      "after": "fe6057120f2ca923bfaa0d47cf74366af32e7dc0b38a0fcf4dc2ade02ec916f4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/group-link-on-message.png",
      "before": null,
      "after": "e2a3afc7657a16d81c9b659a8f4875e208eb8aa44d3886bfa84c5f32d029b555"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/group-link-with-text.png",
      "before": null,
      "after": "7bf6cad9114c784782d8744a554da043e6f9cd176d931ea784679b12ff1cbe3c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/size-medium.png",
      "before": null,
      "after": "15d79e30f23c2fa3bb59175f5844e177c708b0561eca2c39ffdeebf7669a18b5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/size-small.png",
      "before": null,
      "after": "02e0a1002eadb6fa26c77e4d1c6272b9b1337a79afef5ff90f94c95f94064535"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/state-default.png",
      "before": null,
      "after": "02e0a1002eadb6fa26c77e4d1c6272b9b1337a79afef5ff90f94c95f94064535"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/state-disabled.png",
      "before": null,
      "after": "58bae7750c55de97f223c7a71058bc4b562ce88df9c8b8214541c49fa8de5a27"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/state-focused.png",
      "before": null,
      "after": "ffe24373970440472fd413985471c8341fedb77413bd354ddb0cdaf645f448ba"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/state-hover.png",
      "before": null,
      "after": "361442d51bcf4a13cca447714a03d2ddca9e232baa9bcab6cb1a12261ebf7948"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/state-pressed.png",
      "before": null,
      "after": "02e0a1002eadb6fa26c77e4d1c6272b9b1337a79afef5ff90f94c95f94064535"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/link/state-visited.png",
      "before": null,
      "after": "fd362a9c052322203d3a43a1afbd19f8b6ed81a4ba0cae9f0cbfd9dca50f74c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/actionable-content.png",
      "before": null,
      "after": "3f70c1df1f8c4b8e0717ea11f6c8039403a8ad062daa8e6de3a6efaa53380911"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/anatomy.png",
      "before": null,
      "after": "10f641b5fa9f2498b5ad6d8507e85796d900db798af3ca7aeac49cae69b0e8bd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/group-divider.png",
      "before": null,
      "after": "6487acad656c601c0698f8422202b1b5f4b5db32da6cbfcccfaf06462ada6893"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-action.png",
      "before": null,
      "after": "dda904d902a6145d1eda442b755badaa7de8ec059fa9eab80099e93ed496a1a5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-asset.png",
      "before": null,
      "after": "20eba2aeec518ebb0cfe31f64e8027cc8008c3fa1d8b06136e80058c6aeca707"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-avatar.png",
      "before": null,
      "after": "4986aa6190ad91cadb104a50488c6668e9788284c0a6029f2df0c85b2b3be9b7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-description.png",
      "before": null,
      "after": "791bbf38dbb9776381f48fd26165f773590221826c5ecef9f1516fefe63f09a4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-icon.png",
      "before": null,
      "after": "9a4422c061b5cf0e244d7155735b4d692a09c65b1c90d9e847f11b2ce06ef86d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-secondary-label.png",
      "before": null,
      "after": "abb520d76b6556a5e64da14b25968918efbd82a82f5fbda0a1f89de520eb8ad4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-tag.png",
      "before": null,
      "after": "049bcd44441f0e969b236fe332f4b2926d4e9f4c57c206d08f727a15817a60fc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/modifier-text-only.png",
      "before": null,
      "after": "8b1ba7adf451ecfe0933779589dbab340d5fe7dd956d18d34b801e8e5c93812d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/size-large.png",
      "before": null,
      "after": "a1a83481e38417887ab36ad284fe93f36c3c18befdc489a1e0612f5848f4fb93"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/size-medium.png",
      "before": null,
      "after": "1d8dba0f7532bc241a235753d988cba3b241e5bcfc6e416fca1be8f55bbf55d9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/size-small.png",
      "before": null,
      "after": "b79e39a1793ae425f4e9e34fdc0b2e573bbabc2596e32efb2d60d051f61845cb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/state-active.png",
      "before": null,
      "after": "dae9b6ee9db4a7e6bf3dddbce3b3c5ea03a2348d7b17988b31d1215d0bf8076a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/state-default.png",
      "before": null,
      "after": "a1a83481e38417887ab36ad284fe93f36c3c18befdc489a1e0612f5848f4fb93"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/state-disabled.png",
      "before": null,
      "after": "9e75c5ddbde28a0b5fdb31d6a1b1de0375630df32d4d2626c696993a6bd2b00b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/state-error.png",
      "before": null,
      "after": "012e1b944b30304da1cc5d125b7a198583f96b0f3e27d7b977118a17ea33387d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/state-focused.png",
      "before": null,
      "after": "89b66266b5f24e8feac4b167d07732014802148ff65bbe8b8edf32a0dbcdedb9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/state-hover.png",
      "before": null,
      "after": "80e006b76dc4d78f2a5f764075abce64d99073ab46f0c8008743d40a39ba6dc5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/list/text-truncation.png",
      "before": null,
      "after": "279f362324012cfa25906c959a82487bc7d8b3e51633de87279d028479523f90"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/anatomy.png",
      "before": null,
      "after": "5838ca194c360143fc62a4876fc9da63e592144a7beda9f7c8d1276b4525eb66"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/guidelines-do-s-don-ts-do-2.png",
      "before": null,
      "after": "50790e1d98b936ce0de18d4513d01991947c09acd1bf2a6c88d0ff554a7ef447"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/guidelines-do-s-don-ts-do.png",
      "before": null,
      "after": "5275f7b33d8695a965a44f66608869779778b4d0f230c4df819f00bfb3236555"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/guidelines-do-s-don-ts-dont-2.png",
      "before": null,
      "after": "370360b0830f34276f2b87a22e71b4c6873b05f0775197ac38504a55f3811559"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/guidelines-do-s-don-ts-dont.png",
      "before": null,
      "after": "9ed0fc2ebf42445925c1bc98cdc848032b4d8eb99ebde0931b7ccc9c7f057ea0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/types-microcopy.png",
      "before": null,
      "after": "bb912f3ba3af496089fb5d75e41c8aab437e8b677ccf960a47da07d627de98fb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/mark/types-paragraph.png",
      "before": null,
      "after": "48c9a4957e74b81562f1117ecbe468b347d87a46c10b13a1c5eac32431155a4b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-alignment.png",
      "before": null,
      "after": "44b2150692cd61e67bb7b96ede1ad5553355db397fdc91be76238373f3e66f63"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-content-do-banner.png",
      "before": null,
      "after": "05d2603b5cf72a9a461b853296cd4546a13f5364f65e977cc2e9851d644c18e3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-content-dont-banner.png",
      "before": null,
      "after": "df5c9aef6489498153567bcc3105b0640b0a91e8d11e897b54a79d2b99191ba7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-placement.png",
      "before": null,
      "after": "2b02299f6417b8bd6dc3874d3baa612d5694e905d46e29ffbd5fa1f492a64828"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-responsiveness-padding.png",
      "before": null,
      "after": "e0bfc7a7fd5bfd5a804e9747deb0bb924c8d248cfb6e1c16cf246f3f94a01126"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-responsiveness-sizes.png",
      "before": null,
      "after": "f6d54826eaec503cfc89ee1e561fc3b53bd322f3621d92f1518e01d352b5f0ee"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-styles-overview.png",
      "before": null,
      "after": "8f9a978fdc7f4c1fc3f59d5803f429ddddd336dcc92af0c328c73c79a1a944dc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-types-banner-content.png",
      "before": null,
      "after": "b699d58312e27bc122cd0b34926646965fa11744a3cae97fb666a6d6bbfad613"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-types-banner-styles.png",
      "before": null,
      "after": "9fd4b4db54c4615af91d6cd58f1a41d127f04b2ae2099d711990cbde5f81fe80"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-types-basic-content.png",
      "before": null,
      "after": "102bc6d144ed94840c5fa2b423c2e95513fb024936048d7f91c3577b385b7257"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-types-basic-styles.png",
      "before": null,
      "after": "d3564f9411018bdc6fe6537f879b1ec6e914c98d41a44728d7786447b702fb93"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-types-block.png",
      "before": null,
      "after": "f8ff8bf305681784f6745f4b8518799282389340ca21992b22ff989a1859e770"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/message-variations.png",
      "before": null,
      "after": "f1667079f0e137227bd70654a54131a8ae0671f5c79693b2e499238803a0c505"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/responsiveness-medium.png",
      "before": null,
      "after": "cf7f439cad8b0241fccb6a006f4984af1ff989fa9a79dc69b3e8116d0b8a506a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/responsiveness-small.png",
      "before": null,
      "after": "a475bbf10932b3e9b6f1615d3fdfc4ed82f8a822a4c36b61079f79410edc2666"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-anatomy.png",
      "before": null,
      "after": "57029aea532645c6cdfe9ed5964ddf00e7c1835a8f722fcd0d90f7edc9615c18"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-do-error.png",
      "before": null,
      "after": "7a0ba16cd0fa35a011d3f2a05cc5d0ea294c9849832dc3f72a96f7d9cd86964c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-do-loading.png",
      "before": null,
      "after": "941b7782e4e3518a18819f9a13f493f8431f1c67090a0565467e0dc095ce094f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-do-success-1.png",
      "before": null,
      "after": "d2897faf8e74921c05bf881df097f0cb5d0a707df2b892c0d60ad9558219438e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-do-success-2.png",
      "before": null,
      "after": "a7e99c40c3ccb4c90a5e91523bb245cf584f3217900f0502df33317e414fafc0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-dont-error.png",
      "before": null,
      "after": "c2727200dbd3e5f9541502824e7e78b9e2a2a8d03004ef5e432be180c3eb1867"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-dont-loading.png",
      "before": null,
      "after": "9d05adf87cc0c2652364065fba55aaeee90e3c6ceb921087ef4d0ad630979d86"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-dont-success-1.png",
      "before": null,
      "after": "0b052453eb4d6623a4b405b702ff5cea2f802f9cd601361bf7f6314f3d7e7477"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-content-dont-success-2.png",
      "before": null,
      "after": "0c7881eac090f617db1ea271994e244e50fbea6324ca7dcdf46d8e98de3bbc62"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-group.png",
      "before": null,
      "after": "1a7e9cfc70ce9db440d549166518dea8147d48520d8f437c84f8cf26e12a532f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-modifier-dismissible.png",
      "before": null,
      "after": "10838fe058cbfb84fdb406795f4919c0f0ac8175e91589b0c807a4449cacd86f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-size-large.png",
      "before": null,
      "after": "21b4d4ffd831853a21b43b58ad8d45d330dced876d20519ba6de9b4d9311361b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-size-medium.png",
      "before": null,
      "after": "4a0d50f8b00b7ce30a3ed1fa2d49dea714d268898041edccf92ec0f9001dfb18"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-size-small.png",
      "before": null,
      "after": "8567ac425b8300b2521e08611d538f995a4f23a60ef51b8ddaa5046c012b4f4e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-timer-decision.png",
      "before": null,
      "after": "3de381804c2fa8d3dd3830bf767ec6b6c2110e5f39fd76c8f6fe2023d4b9ec18"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-type-error.png",
      "before": null,
      "after": "176ca6b3f39e565375cdc048b7089c8974f9414f034a1ad46953933b87a055b7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-type-info.png",
      "before": null,
      "after": "16a6b1e471f8375f575c9126531540bd179d8e51b536da086fdbab6e9348df60"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-type-primary.png",
      "before": null,
      "after": "fb166b942c15606a0ea928662ad537e26a90154f9aac0ec8a3f0e11d8ff4763e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-type-success.png",
      "before": null,
      "after": "a43a19ebeae3a15539b3fee2f77de5b025c09aee66bee96f66d335be95cda5fe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-type-warning.png",
      "before": null,
      "after": "d1ca7743484429e4b761b11eddf6841544f942ac43865b625f22c637a1053954"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/message/toast-type-white.png",
      "before": null,
      "after": "9ade831fb38a6f2b404dcc33c8d6803ebaab517f59c570742e554b21856d9d01"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/alert-and-error-modals-do.png",
      "before": null,
      "after": "18723757e7a7c9bf3bdfbe5114e6ccffcc63f9c35df92a40b3ef54606cf12a60"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/alert-and-error-modals-dont.png",
      "before": null,
      "after": "539f7e82b7bc67733e5005fd90d701bb6b6ad8659198362f3d64c95f0f662432"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/anatomy-2.png",
      "before": null,
      "after": "1a61f10c521a7225eb3c1c14729d022eed5eb138df09359ae5b483047520f04f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/content-do-example.png",
      "before": null,
      "after": "a8dfff4a73b43b353c601d2bd8d5e982d23dc5c8aae811fc384ac9925d60ebc2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/content-dont-example.png",
      "before": null,
      "after": "049b873f7edf814574e0b6fb2657f526af007ff3b816803af5968de941fcfa35"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/dimensions-max-height.png",
      "before": null,
      "after": "a4cba3a9b7e716befa0802307f2791ada268f0e01cdfb853a1571ae82f2899f7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/guidelines-placement.png",
      "before": null,
      "after": "736db2ac565b81175c5ff58a7ca6dbd16b781749cc807e3862cc641b5fd4192e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-alert-large.png",
      "before": null,
      "after": "25cd25e28db8b689afc43f5db25fa6f948e2649e0fdf3643434832a1e7a6adf1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-alert-medium.png",
      "before": null,
      "after": "57f342ebe54002f89ac8fe794b4a03faaacf64a27f718ffd7fc1930d640fb576"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-alert-small.png",
      "before": null,
      "after": "e3cb9cd869344560686c76e2172f3b3dbab0a6c0f6b574b9d5a357a92f2f8eb5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-alert-with-component-large.png",
      "before": null,
      "after": "976498c1e145da88ca60a472da0e2290761dfdd8bbc8195d26cbfa4d3b9df60f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-alert-with-component-medium.png",
      "before": null,
      "after": "f21591479527ba06248c420cc2c60af54a29c4b93fbc8d3435865f149ac5a403"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-alert-with-component-small.png",
      "before": null,
      "after": "b0e4fa4cc66ebfe4b58209d05d0ae519dee32a17abc0796f173c5f979e8074eb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-error-large.png",
      "before": null,
      "after": "dba6c4e2f2761e0fc5cbe2794046bd086be87f5e00524931f05117160e33cbb5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-error-medium.png",
      "before": null,
      "after": "f29782fade9b44f1ce20255cbc9cf2c8ec458f1c40564633316153336f131249"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-error-small.png",
      "before": null,
      "after": "0383ee8399bd28098630dd7d0db66cc5f1a1e27fc89377c701fe2465c49ebd24"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-error-with-component-large.png",
      "before": null,
      "after": "dc4b0d52055e73ad1fbfe4b021f66f1ba86b772fbdf38c31c2c1912d12283988"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-error-with-component-medium.png",
      "before": null,
      "after": "aab161ae54adde3da479385048abc6756e24c2016ebbc7a07bbd2c14133b9d7b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/modal-error-with-component-small.png",
      "before": null,
      "after": "297f517c641d08fc2f72c6c1f7430c956e962283101b31c84a8df2ee0d7f6fb1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/responsiveness-minimum-screen-resolution.png",
      "before": null,
      "after": "4137d83131337e6f8f6888d68c2462016fc0562950579036e4af6b3792850330"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/responsiveness-padding.png",
      "before": null,
      "after": "e3746fd7810cc9e56ee0252aa94367a08b79b068d313af8db485d6171155fa9e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/sizes-large.png",
      "before": null,
      "after": "51e65f0211ce0693a545de6c2596443e371e9af964a838720a0d33d2baf7eee2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/sizes-medium.png",
      "before": null,
      "after": "1e59bfd37cf443684ffa9e3be3d70e40b328a82ce006397439718b7b009b3877"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/sizes-small.png",
      "before": null,
      "after": "8790203fea93e08e372ab4a239025e6c546d954d54ba7dd4b413506da6fa8f65"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/modal/use-cases-popup-in-modals.png",
      "before": null,
      "after": "2b60ee7c580361e37ec23d961725cf2a800c0b0f32a271a3ca4630b428bafa5d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-fixed-drawer-large.png",
      "before": null,
      "after": "84f0eb90528fb88cf65eed63cd005ebc1790bcaeed67a450e31413e14d171927"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-fixed-drawer-medium.png",
      "before": null,
      "after": "c06165eee4a010326e64aca4639080fe2e6e7ef539e8bf81da3c130de1bfd896"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-hidden-drawer-large.png",
      "before": null,
      "after": "008072a405ccc1e5cd0831a4764563db8c848aba77a750e09fd621e2985b77f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-hidden-drawer-medium.png",
      "before": null,
      "after": "7e845fc746f42bbef4a52158b20f3be9119dca0afc16641a2de44a9158177747"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-hidden-drawer-small.png",
      "before": null,
      "after": "6f41b69730dcd5926e6ef04091e3bdf8e5c6419801dfced28be860bb727a4921"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-large.png",
      "before": null,
      "after": "76452791c0903aec284d8d62516e384dd5d2a78776af989d5ecfc83b0b16a0ae"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-medium.png",
      "before": null,
      "after": "44eed339df25b34d43ff4baad94d13377f7f1537e15bf0ceed37fff01eb6cc89"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-fixed-drawer-large.png",
      "before": null,
      "after": "c3ce90d5f89deb2d14c31a1eb73771c4df7c7d7f5130fffafc51363f436bed75"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-fixed-drawer-medium.png",
      "before": null,
      "after": "f8d8961bd6aa4afe1a0fe07ec06b6515df489d925d3e725d21322bc8add01173"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-hidden-drawer-large.png",
      "before": null,
      "after": "f32bb03b8a0632bd8513c9518700403f16e7c09134900a18458358a71f87c134"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-hidden-drawer-medium.png",
      "before": null,
      "after": "bf3856bf2d0ac9d7bddb1ff1d139785351b45ea623edf2931c0266bb13871027"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-hidden-drawer-small.png",
      "before": null,
      "after": "f66c9334b166bc2a97bcbce9bbfafcab52469b9bae8ec903a7ce059d1549a1d3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-large.png",
      "before": null,
      "after": "1aec28a9c702f204affcdcce8128072423136043f077ade5883bbc82b4ac74f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-medium.png",
      "before": null,
      "after": "aad651935138a63639d75f979bd15975412b67cac9147d433652ad8eab693451"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-multiple-toolbars-small.png",
      "before": null,
      "after": "2bee5c93d1b84b81df89a7b074c07e0e097f7cb9b6e6120012b2fde2a3defce7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-small.png",
      "before": null,
      "after": "3fedd07cf3b09ab08f08f4027d4093e10dec401f31ba565eeea12bf58d6e82d6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-fixed-drawer-large.png",
      "before": null,
      "after": "6908d6874f3138d1443474681087901bcb47866428369e60e73d39882459e1ff"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-fixed-drawer-medium.png",
      "before": null,
      "after": "618dddb06a3d5eab325191e3ff8527299fc147f50d4dfe5332657adb59b16a7c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-hidden-drawer-large.png",
      "before": null,
      "after": "5fe9a00f912d42701c88c19cac899da41f4a5eef6bdef306abcd0056ba1da846"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-hidden-drawer-medium.png",
      "before": null,
      "after": "473fc008803ecf4188d7b6a1744d97523022496665d5d97e3fb97a01239eabb2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-hidden-drawer-small.png",
      "before": null,
      "after": "b0b5648dca17c2d6a5b9bcd7de6e3692b571d6965f44dc5d92d36d26b0df39e4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-large.png",
      "before": null,
      "after": "5652ccd5600f2c07894f6a13bfd749e5bd9b74546a81c9e45ebfef99887d7327"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-medium.png",
      "before": null,
      "after": "c33c2ccb10cb55ba4e976b33bfb5111f939019f87d5fbbd1ed63b15d131b660d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-header-with-nav-toolbar-small.png",
      "before": null,
      "after": "ec4b37edde82e6f5b7959a6a5679c312335f0e0339497e27951d3dde6f180083"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-fixed-drawer-large.png",
      "before": null,
      "after": "b968ee03deb9dd1a014f3a3b1a4b69fee8ca9033126fb78c1a14bfb8a143fc75"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-fixed-drawer-medium.png",
      "before": null,
      "after": "e02d98f529b7df8c653d8dae4641ba7ff176768005730e53d8bf19f691626fbd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-hidden-drawer-large.png",
      "before": null,
      "after": "bffdd0a240e8d6bdda064c809d385ec0a2ff6a352d49d6ee73f19d51544c0d75"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-hidden-drawer-medium.png",
      "before": null,
      "after": "c985b7a7099c9b4d5c397b586eea84cf6c0057d6900def8d369025c6f95a2e38"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-hidden-drawer-small.png",
      "before": null,
      "after": "a204e4b0704fefadf648fd57e99d705ecace143c29f10bb9b99757f1a9475d73"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-large.png",
      "before": null,
      "after": "e116bcc72061a0e4aed044988cab6ca53b8db54f1a34519d96b4e36bd608dcd0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-medium.png",
      "before": null,
      "after": "7e57d3f2340c9eae4fc3ca8b5c06e758a8dad4649e6207afe38cb44bff32ff00"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/general-layout-simple-header-small.png",
      "before": null,
      "after": "f06829697d39d694af5d570eaa89ddce9d56605b1b935c0482d466548d1840b2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-default-large.png",
      "before": null,
      "after": "caa10ab0b87757e94066c9ae638668b01eb32fd07b9809a17c1c105066cd1118"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-default-medium.png",
      "before": null,
      "after": "dc1cf2c531428a121345a43dd53f6d0e09465b7e3b673642dfbd1eea95ecaf01"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-default-small.png",
      "before": null,
      "after": "860511e8f16222326ea1b8e97393b11aa58e3059392a0f2bb0496986228b0d55"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-overlay-large.png",
      "before": null,
      "after": "c5efcf385ad08a942da9a1baa6a5703b67ef407d8db2111dd6491071e5e1c74e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-overlay-medium.png",
      "before": null,
      "after": "5bc5cef5d69259177156836466d4c11e34ea10ca8fb71c4f7d7d83df78768ada"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-overlay-scroll-large.png",
      "before": null,
      "after": "c5efcf385ad08a942da9a1baa6a5703b67ef407d8db2111dd6491071e5e1c74e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-overlay-scroll-medium.png",
      "before": null,
      "after": "5bc5cef5d69259177156836466d4c11e34ea10ca8fb71c4f7d7d83df78768ada"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-overlay-scroll-small.png",
      "before": null,
      "after": "3377f3fbe9b70c12639cec8da79b77d1982a267a337223b78f49f7d0aeb9d20c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-overlay-small.png",
      "before": null,
      "after": "3377f3fbe9b70c12639cec8da79b77d1982a267a337223b78f49f7d0aeb9d20c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-scrollable-large.png",
      "before": null,
      "after": "bfc68143a880ba0aee73bb39cf15f363fe3488be9e66a65eb50c5c99fe5a38e7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-scrollable-medium.png",
      "before": null,
      "after": "d212f7a6d3eda673e8616a726ed52e45373fcbd4435e7320c1861b679e404dc1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/panel-scrollable-small.png",
      "before": null,
      "after": "dec8852bbd497d8961d0187c08b88e12f2398190980b1879249478e1f6d2076c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-fixed-drawer-large.png",
      "before": null,
      "after": "a955bbdaeaf57787f5e45bbaf9093f0b4073919754ea7ad0200f9fcb48cfaf88"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-fixed-drawer-medium.png",
      "before": null,
      "after": "45d3fad3865acfec1379099fc8d056d92e56e00c7ec9addc0c4246c151387bb0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-hidden-drawer-large.png",
      "before": null,
      "after": "bc0557b4f667c94c95a6f839a0010026d585e344461136eb9a7bca8e10068185"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-hidden-drawer-medium.png",
      "before": null,
      "after": "51db9b4685231b113dd312cbdb78574be6cdfe0489a088794eaf8e084692c564"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-hidden-drawer-small.png",
      "before": null,
      "after": "4801b81ac69a0d7c82ceb4e18f51d79c6badfcd4d453ea1415b3199162536da5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-large.png",
      "before": null,
      "after": "28506542e95b03eda74a5d31ede545d02c5139e3e74e8127b159d1791f0c2bea"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-medium.png",
      "before": null,
      "after": "f2d5f141b3fe0063644f987e122becae65d5f95f740c9539a409c9c06ab12a6d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-fixed-drawer-large.png",
      "before": null,
      "after": "78bd2172810ce9ad34e1b9b89cbdcbd7d1decdc608c6958cfef06793f42f418d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-fixed-drawer-medium.png",
      "before": null,
      "after": "1bbdd60ba78e2ff877e238ad19f6fa4030919d3fc1455c5ada1eda8ae9f0acdc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-hidden-drawer-large.png",
      "before": null,
      "after": "54bb154ff33b6e53fe2f0e343dbff598d9d6fcdb60fda2e34bd73aa24a8cc130"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-hidden-drawer-medium.png",
      "before": null,
      "after": "f0ab0b4533faeec5af4ffc213b618df035e4721dd9ca12d8baea2462964579eb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-hidden-drawer-small.png",
      "before": null,
      "after": "ae77ecd9d6e16ec0a2cc86863ce5692cc099c0051f63f4e8796c879907f42f56"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-large.png",
      "before": null,
      "after": "f7a962fcc84547d9735053c404be4048044846b1c6c92e56d3f1659d6cbbdb75"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-medium.png",
      "before": null,
      "after": "e59939e047e8e5ac2d090f3d3df8a351a813da8e53ab311e443c017b5a07a4e8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-multiple-toolbar-small.png",
      "before": null,
      "after": "2bee5c93d1b84b81df89a7b074c07e0e097f7cb9b6e6120012b2fde2a3defce7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-small.png",
      "before": null,
      "after": "5b6802644eda0cd56acd62cb31daa99ed49589b7bb5b60458084a94b907a4ed1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-fixed-drawer-large.png",
      "before": null,
      "after": "bb3f648dd9be8e5ecc5d4aaf109bcf53d7f5f68ef64c4937ecac40e88fef4a5d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-fixed-drawer-medium.png",
      "before": null,
      "after": "c67b3ba2088e20e64b9cac9d903367bfcfb8cdcdaf76e2926fc1b1a63382f682"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-hidden-drawer-large.png",
      "before": null,
      "after": "17e2d2af8975d1a3c2c36be5c8657004e28f5554dbd7866f640eaa88aa3f57fe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-hidden-drawer-medium.png",
      "before": null,
      "after": "c92cbd08e1c6ab057d2da6c9380293792da70f9ea98abaaba98e05c1e14d3b44"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-hidden-drawer-small.png",
      "before": null,
      "after": "a786a3385f8ab05146e4501c86ed851da9ca7ce136264baa8f6534fab53864e6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-large.png",
      "before": null,
      "after": "889920155c4ff3febc6c279a31e95490f8f599b7b5d98f1da70baa27b18b56c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-medium.png",
      "before": null,
      "after": "473101de97b5df44f15b7cf21fa5d2a8c2e1eda5f09e5ad04539bfd4246f668b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-header-with-nav-toolbar-small.png",
      "before": null,
      "after": "32362f2d3409f25d230bb5e8f1ecefb14bec2c29082c973290f717565bcde4ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-fixed-drawer-large.png",
      "before": null,
      "after": "1c8d7da7ee4d9729bf24a46764823227623cfe1c8ead38b25f547335710519eb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-fixed-drawer-medium.png",
      "before": null,
      "after": "9612ca9a46995b403f194aabd0ae76d4d0eb7589e8aa1eb68ae14e357ef0558b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-hidden-drawer-large.png",
      "before": null,
      "after": "86f28e7b286c97c25b162af922e4d81c84cd280d0687012cfde811f610409d15"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-hidden-drawer-medium.png",
      "before": null,
      "after": "ec6a59bc96c293bee699af26f9da1068d3ed045ea84089b263aa23de67ecf403"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-hidden-drawer-small.png",
      "before": null,
      "after": "2e54efb6d90403dd45444f7f61fcceb66fac0db4fd2aa25df22ce0b662614ac4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-large.png",
      "before": null,
      "after": "86b6efb7bf0bc23d223acb8a30f23136d51b66a30b41b33d3d0727f1afa4144d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-medium.png",
      "before": null,
      "after": "e372305c6723bc92c6058f265f146cd7a95820bc82c3b01bb34aaaadab5cd941"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/most-used-templates/table-simple-header-small.png",
      "before": null,
      "after": "4152d2646e70a7b455495f2acd8679257ec730c69e14755f42b3b9e5e80c76f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/intense.png",
      "before": null,
      "after": "0d5592ee8a2ee1641238e66ff63151c8aa4775e6ddf74f3a6345e4a582f0c238"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/light.png",
      "before": null,
      "after": "826afee0c9b1b59f58b5b59cdec89c9cdfd01451def720f3431c8aa54280ba9a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/medium.png",
      "before": null,
      "after": "2336c8b30d331f86214ecd29e97b89ab1aa15b15fcff2cba2b1b5f200929091e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/opaque.png",
      "before": null,
      "after": "bfe314c65afc02eddb1f935083c8a8d2ee4bd050f267175cb83ece793b5aa6ea"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/semi-opaque.png",
      "before": null,
      "after": "b1e5690fd0599536faca8589a0631dc19fb46267ab7bb835356f4cd009ddc1c5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/semi-transparent.png",
      "before": null,
      "after": "01726f50bcbf258824d4d51c8f592eddee5745d7991e16469c1a7ce348f448cc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/opacity/transparent.png",
      "before": null,
      "after": "fd62ed1be6c6a23777ecf195a24b4d12211912b9e838495bf37d8ae09b865302"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/anatomy.png",
      "before": null,
      "after": "474cf62cdd419ab649128d3648c2c85eea6f590e1fdf2f7742a70bdf1ea1f7eb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/background-large.png",
      "before": null,
      "after": "87faaa78a74fc517c0ceee4ecce1d26804ccdf6dcdb1644402bd55d8cef5d80a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/background-medium.png",
      "before": null,
      "after": "4019b90af640b6c1f4cd00e8ebebade03da83ba28f1fbe9adad5230cb7d2a397"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/background-small.png",
      "before": null,
      "after": "20e28307de067dd5e275736fb2631ca4aa73a979d4e48e0b56b03258a2802415"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/jump-large.png",
      "before": null,
      "after": "35093542236e0579c0df1db64be6701a80c4689bd55965a08e909649c96d3527"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/jump-medium.png",
      "before": null,
      "after": "b6427b1414ef31733ce6d104a60906518edf0b564c0c31aebe3d9dbfcdea267f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/jump-small.png",
      "before": null,
      "after": "d459619ab06133f436df2f3fc61a71e3b3866b63440bd30f850111a9e7874e49"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/label-large.png",
      "before": null,
      "after": "818be457d0ca156cf1b9d64e87e94d49a03ec378393a18b3eed239d2759ef51c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/label-medium.png",
      "before": null,
      "after": "50d36e8cc1f96083cbe7bdcce5a3dfe487acc352bbed569b83bf9d8ee01fb887"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/numbers-large.png",
      "before": null,
      "after": "bcf3d9979c2f0f762ce8e94bc70d1aa007b8a80212de3f0aeed27ef253fa54cb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/numbers-medium.png",
      "before": null,
      "after": "f9ddb67edd4140e40a3e5abfaa78f3c9dcf53c1c6bd8336a399dc3d4440a24af"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/numbers-small.png",
      "before": null,
      "after": "f6e0e5bda937cde291cba4666e7b8bf952eac16dbcb81d620068603b66b3aa9f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/options-large-2.png",
      "before": null,
      "after": "d699830ea847a7e6c4704a74f0e747224f003c1bd802fa907a624e626bb6283f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/options-large.png",
      "before": null,
      "after": "ae82ceb797cea1018ac581f4e19cd59a96fb2a81d23a923217bb25d7237bbbcc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/options-medium-2.png",
      "before": null,
      "after": "ebb5cdcf022d3ca68ff4a5f53eb811dbffae0cde6d08a94326292db7d8dde9ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/options-medium.png",
      "before": null,
      "after": "c81e1ccb080c839bdfce40bc14080c994143ef21ec7ad4061cb57b9ceeb0558e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/placement-placement-panel.png",
      "before": null,
      "after": "da41136371567c0bb531df794cc778a85a1c48616f949a040971c10b2ac596ce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/placement-placement-table.png",
      "before": null,
      "after": "1e3f4ef8459985fca63a5e2d7d656768f3009efe42e750447ad48383938a39f6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/responsiveness-responsiveness-large.png",
      "before": null,
      "after": "118fbb10b3333dcc70c8190a4fe10d6ae4359ff4ec5bc081e59fe94847f13588"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/responsiveness-responsiveness-medium.png",
      "before": null,
      "after": "c434439cf01464ac58b36399a7f6d7d4d754e1b716ae42537ae287fdc21261d2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/responsiveness-responsiveness-small.png",
      "before": null,
      "after": "25d016fbaba9940bab0448babbc24f2741d03c3ad4234307be172276bd45027a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/sizes-large.png",
      "before": null,
      "after": "1789e72e9cf1a0dfe3e8bba56a711bf96f097b9f1a932e2fc294810e1a43ac24"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/sizes-medium.png",
      "before": null,
      "after": "0201cbda6412fecd9b04ba8413911c5461571eca7a280338de969ff5b4c53f85"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/sizes-small.png",
      "before": null,
      "after": "e973a7e821c616f6ee3e2614f852ecde8505d89f74db96bb57c9c0f169ed1b22"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/variants-dimensions.png",
      "before": null,
      "after": "4fbea24866b0c6e537148cc108d180ec16159c76f6084d69f2c3abe7d82ffa0e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/pagination/variants-spacings.png",
      "before": null,
      "after": "107cc5eb8a1ca8f025f7707906b46ee94789ebeb4e73d32b3fccd84d0e7b87ed"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/anatomy-2.png",
      "before": null,
      "after": "899ca21227146bde236d38001c3dc013ab357719ee4ef779124535f9f3c27618"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/app-large-viewport-and-small-padding.png",
      "before": null,
      "after": "dd8f508c50d71e8a4d0f0800f386bc097151b545eb5981f8fae2aea83410e0fd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/app-medium-viewport-and-small-padding.png",
      "before": null,
      "after": "32b246695d1c381bf73c73106b5217cb8d3f99b033e7e6b60ad69a813b6df75a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/app-small-viewport-and-small-padding.png",
      "before": null,
      "after": "57fe34641903075e27345621825ec8bac4c3b65c689bc8f362193cbb8e33c7d9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/group-header-2.png",
      "before": null,
      "after": "df4138e8b705980bf76fbbb75a8b40ebba3ab7d38fa0ed538cf4a45002db7955"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/group-header.png",
      "before": null,
      "after": "5f32a9935db1586eac789f36a4b2c1de71d9a4676450848292fa025d4d051bdf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/group-secondary-area.png",
      "before": null,
      "after": "c4dfd2aec432cc3c48bd8ea5644fed42d4f12742ed9085b420ecca076bbc3134"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifier-without-header.png",
      "before": null,
      "after": "6d5f6735c03a901d680607baac87014fc176ea76de288a53a43c0ef65aa1e9d3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifiers-with-scroll.png",
      "before": null,
      "after": "37f193758197acf4d0b721c2a471bcb5b0b5b9644c1922aed42bba3ed0b04c29"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifiers-without-actions.png",
      "before": null,
      "after": "4b9694fc0aace458faccafd05ab84ce3a8e5bd2ffb42f5d3a3a4bd5fd447ef9b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifiers-without-dismissible-button.png",
      "before": null,
      "after": "231b3be4887b3a2c7db94433f060e36da741a1c49229fab32806f094c5a684dc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifiers-without-header.png",
      "before": null,
      "after": "b2792ee5e27f2fea712f041d0e1a908d3d6a02f91d112081213709a34696e096"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifiers-without-nav.png",
      "before": null,
      "after": "18fd3084338a3a3ec7cca042caafd3b61bbafc19a1d15cdfcc750ba78eef46c2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/modifiers-without-overlay.png",
      "before": null,
      "after": "77d2dab2c967198d2996e5398ea4f98890679fb2fb289ea34e7902f38299d278"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/padding-large-viewport.png",
      "before": null,
      "after": "66ca659bf8e87c55d04b6045f0f2c96ce7a2a4ce49415e89b8a69a6a16c6aa31"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/padding-medium-viewport-and-padding.png",
      "before": null,
      "after": "779399caf744711442e18e58155f96b3424e98a45224202766a6e452b376f4f9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/padding-small-viewport-and-padding.png",
      "before": null,
      "after": "fa92d280db54f6ac88f44645a787587e14a53a967ee5959c544538fc3b57b3eb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/placement-left.png",
      "before": null,
      "after": "e9d3beb2acea0639dd646240e215f0e9a646e6df10f5bcd2293a1c7e879e1de3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/placement-right.png",
      "before": null,
      "after": "8759cb2e6ec0b14e2451c5019efcfcc451c60c9d5d3de65be7ad57cc361d26ea"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/sizes-large.png",
      "before": null,
      "after": "33c9abce337aed1e1875676f695e378fc6bf417e6b1efd1b160ffe7896625921"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/sizes-medium.png",
      "before": null,
      "after": "b4392bef38e4b8298a7316ca5faa297651e33556a79b67f26eb62a0e352936e6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/sizes-small.png",
      "before": null,
      "after": "201a167ee009555016e0da3e8a9fc8776d2723b9d01393ebf5968578146f7c67"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/panel/sizes-x-large.png",
      "before": null,
      "after": "9d7f0810bc2a0b003bc625277052f802c70e994296f20a1fa52c8903ca136aef"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/placeholder-image.svg",
      "before": null,
      "after": "51d3d36d724545c8ffe43a830b9771a5cceaae4bdeea982e8fc518f7c94e6d05"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/alignment-do.png",
      "before": null,
      "after": "1be42d020d3fcb97790986246f73d4f350c62e65066deb03b22243e7454f4ccb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/alignment-dont.png",
      "before": null,
      "after": "b3fc16337a25b063347b65148a367f5023bfe2bcae01afb922067681e37a934a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/anatomy.png",
      "before": null,
      "after": "7a58be20810d09e2abe8e84b86a367b979803bf0db274a2f1f7312f87ab8c031"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/inner-padding.png",
      "before": null,
      "after": "bf9c8a8b0c8d1e5b32183b9feb316ff5b9d4cacf4ca185289b7f298b39c38004"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/interaction-dismissing.gif",
      "before": null,
      "after": "366bf675b73438651174a941b20e309b2b02a015b3d8e7d0a6eeaafa46e1b805"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/modifier-dropdown-guides.png",
      "before": null,
      "after": "dc0b3556fd285861d3f61709e1281afba22cd6d27bb5e654f08947cc6c295fed"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/modifier-standalone.png",
      "before": null,
      "after": "795221ad637dde6a94ea22ab53cbc67786bf3c3617c9b2597fbf119165891c32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/popup-menu-list-items.png",
      "before": null,
      "after": "06fe37677aa7fc0cda61185f51c27c46a1582fdb4e2eb2081f14fb4433073270"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/popup-menu-top-guide.png",
      "before": null,
      "after": "99d99fe7d4c05b55d502cc33b84a0c753fb9be9fbed33cb5cacbf5429368dcce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/position.png",
      "before": null,
      "after": "d257c0af9b6003db5fc11cb2b4c9b9f1e00895c404631481fddd660de938691f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/size-large.png",
      "before": null,
      "after": "35e6ba7a26d25aaa1a552dfd007314f897d3ec0d559e566f78706efbfa697554"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/size-medium.png",
      "before": null,
      "after": "06d3a1e62260703ce6dc4867e3a173865f7c068f55ae9c03a6cde8e37c28dadb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/popup/size-small.png",
      "before": null,
      "after": "b944622b4c33fdfc41796a63dfedbe3ace37dbccdef6bb89a1a07deb470ebe14"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/anatomy.png",
      "before": null,
      "after": "62a879a5db8e300753675960d460fe2eb2aad1e28bd7c2810017b96b0ba06bdf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/content-do-1.png",
      "before": null,
      "after": "227c2aa48ef65a85940651ba4622420b493108d910cb73ce707ca627af5da320"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/content-do-2.png",
      "before": null,
      "after": "22543e8927c8acdb71d70e356c95997808566f072110450fb1467af748ff66d8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/internationalization.png",
      "before": null,
      "after": "70552929f9b92e0ae12c13a5867bbf32cd6522ddbf38706598bbc92a480d80d7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/modifier-isolated.png",
      "before": null,
      "after": "031212bad0039f8545ecd93744333e5c070af9592571e4602f2dccb132a79fe8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/modifier-with-description.png",
      "before": null,
      "after": "97daf841e5e1a17ed1a34ed63b1e07e3c3c900d52d036a3098e7b578d9eb0e91"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/modifier-with-label.png",
      "before": null,
      "after": "39a189e451888d008015fb84165cb0a2bee8d6da5d925c101b1e007c85cc99cf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/placement.png",
      "before": null,
      "after": "0faebc1b125a90f317577bd6b6013abdd712c45da6ff71e1d4f29ce67c1d16f8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/progress-0.png",
      "before": null,
      "after": "e73bc21c12d3320fd4585fb6654f3d1aa0d80ddc551b5f999cffb0b2753dcec3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/progress-100.png",
      "before": null,
      "after": "5c7bed344afcfd41e93b5ea6cf1566dd747ed4fcd871c1489d2f59c464a550b7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/progress-25.png",
      "before": null,
      "after": "e4e2f10d43acc42ecd4f35b8e72078682e42ca31d333af86ff8848309a757410"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/progress-50.png",
      "before": null,
      "after": "f61a92be32605242a5f146b826fb6a7cbf0e0eb2560a26c6c539df877b1b0ffb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/progress-75.png",
      "before": null,
      "after": "3d92b2a7e31800c783602dac433758eeecc1dd2a69bfd2cb87b6c96739fbb4f0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/usage-complete.png",
      "before": null,
      "after": "b63f9a65600ba338b2de480ae5ea1667df076580d3dbf6ba93b3b71c8360f1a1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/progress-bar/usage-uploading.png",
      "before": null,
      "after": "f29ff2db8239498fd1e2a2077de43a77d5bb32976d99f8f77c2c650e151a7497"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/radio/do.png",
      "before": null,
      "after": "d16e5b7b40619e351e3b8867bd2589f96dca4a3198d279860b60ad6576f74c86"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/radio/dont.png",
      "before": null,
      "after": "04d34ecb00c5c5f87177a52e7b3f54cac19e42916bf4ad2742ea915ea0849bf8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/radio/group-2.png",
      "before": null,
      "after": "18d9bbadeb36cf00730e090a2241234882d8f3e019e3039b7aba9cef16e4d160"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/radio/group.png",
      "before": null,
      "after": "9fc74a3011357f54d564406e3fbf87d34c69a0c1a8be321e2208d68937ae0ac4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/radio/variants-sizes.png",
      "before": null,
      "after": "3f3ee6e1095a2e9f994e2ed1929d77298aaa897bfc66e61922d3f8a2bc0a8c66"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/radio/variants-spacings.png",
      "before": null,
      "after": "73ded074b2c264dbaac932748450a6247c63ec088b4f683a2815cca5898dee6c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/recipes/app-shell-drawer-open.jpg",
      "before": null,
      "after": "636d27d90553d4ad6bbf3fa8c126aff2521228b0425a2e5887e17ee7fa626dcd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/recipes/app-shell.jpg",
      "before": null,
      "after": "201c4b573e03b76a832a92c708e4a4df818860d877122d8b9b5cd16f938944a0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/recipes/detail-page.jpg",
      "before": null,
      "after": "a93cb3cfdd2cb4339e409b1efac94c7912244477995f71bfeab0bbf5f5bce545"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/recipes/form-page.jpg",
      "before": null,
      "after": "ef7bc46549c300ca9f022ede7301e16e7304670477b79e0f107620bb4d314402"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/recipes/list-page.jpg",
      "before": null,
      "after": "71d9cbe30de8002c03711e58d92a10b7887a85721cc1bad1d6e249ad69ac61fa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/button-icons-rtl.png",
      "before": null,
      "after": "0d0a4483b59bbbb077387483444d7809b6f0c20f569e75e25815d28e305935cd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/calendars-rtl.png",
      "before": null,
      "after": "9c9f1dc38f4c3b1d68e11a1183601203600fa13afa618c443998c3ad54642dff"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/differences-in-word-sizes.png",
      "before": null,
      "after": "bdc24407d8aae74f693f53c675d0b54c0681b4ec33980b2a0889460aa82b29cb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/dock-symmetrical-icons.png",
      "before": null,
      "after": "85d48325daae7d50d211e41df0cafc88a8b7f79bd9450209e3832962007c9eb8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/dropdown-rtl.png",
      "before": null,
      "after": "79d9ff62309e58ed71614b5cc5f06e59603305d8d09c09b0cdcaf49c569fab91"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/english-characters.png",
      "before": null,
      "after": "ecc85c468ef83085a30eeed673123022c23567f5598cd97c7e237fe92554e0b3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/font-rtl.png",
      "before": null,
      "after": "05d7cfb2c2804d370391e590f23abcdafa4cd85657586afe8d72799e3666cc6d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/forms-rtl.png",
      "before": null,
      "after": "09c620f1349eccd81d7c5934660c2c9807724de2bc0abbdaa9034334ca9566d0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/hijri-calendar.png",
      "before": null,
      "after": "d2f694a498787c872f8e077516b81589de126130be5bf9c5afae80f2a422d692"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/logos-and-trademarks.png",
      "before": null,
      "after": "90e86108967440194f8b3039c65112d6305249fd65f851769f1bc2d3ba666017"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/media-controls-rtl.png",
      "before": null,
      "after": "09f08a04233974cef05f032b9fa09153c5a433e0430fe8a582a4fe6b7808167a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/mirrored-icons-depict-direction.png",
      "before": null,
      "after": "aafdd2b71fef300d51356099e953605a2107b7e6d9ceaab7f2c67e36b21098e2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/mirrored-icons-specific-direction.png",
      "before": null,
      "after": "3691ee84dff8e6a861e08224277469e58f142835ce09d9ebb7ec49e3625b41b1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/rating-page-selectors-rtl.png",
      "before": null,
      "after": "0819351855035ac22bfd14367e1af051dc5cb4c906b53c5e513011a347105914"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/right-handed-icons.png",
      "before": null,
      "after": "9841f0f926ae8affce23b963238b9cd45061cd4a9a2bbddfc2935fd38656d880"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/sliders-rtl.png",
      "before": null,
      "after": "0d8a79e18912feb673ac4756ddfc8165f6f6346f6137750daad0fd0aa32ebb20"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/symmetrical-icons.png",
      "before": null,
      "after": "1923b44fdd27336d85a29eee4644ddaf5e5b45202945c3a8f7d2db50d8a8d944"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/tabs-rtl.png",
      "before": null,
      "after": "798d4c514653f3b0f66924e7bc40197ba9b53834fc8686c85dfd1243f76fcfcb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/text-reading-order.png",
      "before": null,
      "after": "de2766a3623b41381f29b3eabc3ef377532f91af9be3f8ad621e54f197513ea0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/time-icons.png",
      "before": null,
      "after": "6ac02af1d419e026a902556673f3142642ddef9ca8af9ee338b776fb1cbc21da"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/toasts-rtl.png",
      "before": null,
      "after": "562d50bf0a03e78141ead75949f4ed754b78f0121cf51c0a8562852db0bb004f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/rtl/toggle-switches-checkboxes-rtl.png",
      "before": null,
      "after": "3870b1971aa7109cbbda80acebb36f96913ad48196a0e05e61eddc546d18e0a9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/anatomy.png",
      "before": null,
      "after": "7498255cb8990d1eceba4dec336634218f1a6eeb509a44ac064b4d1655420490"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/arrangement-full-width.png",
      "before": null,
      "after": "300b9ae71fcf90b40101561ccda3f6c309d2e0918981254931fbda2dd7b410fd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/arrangement-variable-width.png",
      "before": null,
      "after": "e654ee04428de145aa6ed6e88bc9dc59831a3a6adffcded2c8c01ad52d9f4d38"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/behavior-interaction.gif",
      "before": null,
      "after": "935fc71937f8eb60a9b987d2b1a8f6fd5608a74fb089b3736b79055337e07953"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/behavior-loading.png",
      "before": null,
      "after": "1fd438547c9ba4b1e0826b42e1c1cb15e79990f69b740bcafeb3f19357ce1705"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/behavior-text-truncation.png",
      "before": null,
      "after": "0d98e42dba54b37e5218e388800a26d7f69204b867e6b558cca4896e3d329949"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/cases-search-popup-with-items-and.png",
      "before": null,
      "after": "02c944857ddfb8e5e8be2f094ff0e16227e4291ca39066e6db12d3486404a004"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/cases-search-results.png",
      "before": null,
      "after": "8de1f4ff280e9ce10f96a6cdd38c877b8b27c6fb91620b973a383901a9a99c3c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/guidelines-do-s-don-ts-caution.png",
      "before": null,
      "after": "b23383d8e94ce8e2321be26ec9a8b392a725aedf14c8de51b0c00fbc65112ea7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/guidelines-do-s-don-ts-do-2.png",
      "before": null,
      "after": "86b0be4a2d5e422cae222a5734b2b4211cb9261047a914d2ebaac59fe6c16936"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/guidelines-do-s-don-ts-do.png",
      "before": null,
      "after": "84efbb007f389f72bdf552e417af6ec47946eb3c410d16711c601188d8f1b06c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/guidelines-do-s-don-ts-dont.png",
      "before": null,
      "after": "1c87c0e29fcccc40644ca51b6b3cc0594fba69a526f368f7b368e7f77ed2e364"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/modifiers-standalone.png",
      "before": null,
      "after": "0b49b1eec83db866e72be2b69222c94507e738af293a64d1d30083faaf72ab1b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/modifiers-with-hint.png",
      "before": null,
      "after": "0a1bb55f959e37432f6f2ddec615d2f7bc4863960a9fb04011dd8df7d6f57a24"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/modifiers-with-label.png",
      "before": null,
      "after": "da1c2900db3930e429b55749e9789e8f768aa2c836828b7d60235bc5b4d1a416"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/placement-pages-forms.png",
      "before": null,
      "after": "3f40eac82b4c9752757bfffcd03a0d2a924baf0cc0de27667aaca43ec89c9bb9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/placement-panel.png",
      "before": null,
      "after": "1b953ad1b524960cc7d3d6cb9fe9e999edb80be1fa773617e858f9e6b07ec7df"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/placement-toolbar.png",
      "before": null,
      "after": "f98ee3ab5d8907d80622256638db3410a205e6ab7370535e5790bec02f691c20"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/search-input/variants-spacings.png",
      "before": null,
      "after": "4f716a9a8d54f348a40e6320863a32f4a6d967e5f5d4eac92ac837b682f23e32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/anatomy.png",
      "before": null,
      "after": "285b4e4cba2fc1b10046431042d8b8bdcaa923f3b04ae6156d9d0d4d6db76ecc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/appearance-do.png",
      "before": null,
      "after": "8c7595f9f2480c0ad005801ab16407f7d81e97e1646c7318a1b77aded1b89b68"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/appearance-dont.png",
      "before": null,
      "after": "324d111dc99ccd93890e30fcb681f499f52f5810e6267849c305c29a36fa7385"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/collapsing.png",
      "before": null,
      "after": "8628b2ba1a205ef517b8d0816240694b9249ae1aaa496a338023a79961f50d6c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/content-icon-label.png",
      "before": null,
      "after": "3f528d96cef9661c91463e3e09d075264442664f2ddf4a83bd700e42cd4ed14f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/content-icon.png",
      "before": null,
      "after": "53559720e4ee17d440a0b986339c6f23dd684fcd59b5a377a6b9015449ae38db"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/content-label.png",
      "before": null,
      "after": "58a41e93b028799f5a182a6a612d5e7a3d87d8d5a338e171166469267c89d532"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/cover.png",
      "before": null,
      "after": "84545aea6e991a9dadad54c42dec469ad694394df51bf37a2fc43c184a154418"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/days-of-the-week.png",
      "before": null,
      "after": "75bf3774ffc74396e8b7cccfe81dc252ac306810c3d8698aa6ac7ce5e388ab4f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/error-disabled-selected.png",
      "before": null,
      "after": "b52159f5084e595d54bef533900fac085c1eeb7b13e893748aeaa0e00a8864e4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/error-disabled.png",
      "before": null,
      "after": "1c9033bef05b259b4f50fc503af247e73b6d3539c94690c497460e504d95685c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/guidelines-ivr.png",
      "before": null,
      "after": "e4bd92464b0ea6247dca53076491908c49ea7903e62e5f7506eb068ee87f015a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/multiple-normal.png",
      "before": null,
      "after": "9ec385fb82bdc4884ca813db096f6e459bf31289782bdd5385ceafa26e9dbaad"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/multiple-selection.png",
      "before": null,
      "after": "bb488f7ef50abe970c5d1ead620174938641f30e2557a9af4a93517d32a268f4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-12.png",
      "before": null,
      "after": "64edd4f06e237d6810e5f47c072f30ffc491d974cd47180a30f61a7fde40eea6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-2.png",
      "before": null,
      "after": "42ea7f7b80dc1d562bac6afbf3047b1c5158f5a38c2e27b905e92d650e7ee882"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-7.png",
      "before": null,
      "after": "0a0424d09ef4de0cdb434b87bd3da8edd111aa3920a67344c4c1e15956aab26e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-disabled.png",
      "before": null,
      "after": "091012fb1d886329c853a1a8da99faa71e484d11aadf4bcdaab28886ae13493d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-options-10.png",
      "before": null,
      "after": "d533e05a4eb376ef75ea44d4758bbfc1dc04457ff25a11291408b36656280bf0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-options-3.png",
      "before": null,
      "after": "8af33811ae45f2608ae27ce34a0e7ad689d746fabdf8e1a1abf9d599ab425a4c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-options-4.png",
      "before": null,
      "after": "c4cfede33a6a961e7aad9b2ff047fbb8bbeb20d337d0929c91dc4af61ab44363"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/options-options-5.png",
      "before": null,
      "after": "2f66a046c990afda3c2336d5338ecf1b8382e18360b398535e194318078c2d2f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/orientation-do.png",
      "before": null,
      "after": "22f0c0f24b0c2a9a4b4709fdb5be86937a49a9890faa93d42a77e074f2a476ce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/orientation-dont.png",
      "before": null,
      "after": "fa7bb660a6d7922b51eb0986deb93a82e777727c897e2439db7e30c068123496"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/rtl.png",
      "before": null,
      "after": "f48f93dcc198d55aa61f6f45423a13de6812778312ebedf2c5745a6b043049fb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/single-selection.png",
      "before": null,
      "after": "3aef25aff4b652762fef6dd9e98313cfc331aa2bfc05544e7477482a7fb4b3ed"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/size-large.png",
      "before": null,
      "after": "3f528d96cef9661c91463e3e09d075264442664f2ddf4a83bd700e42cd4ed14f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/size-medium.png",
      "before": null,
      "after": "38ef6b07a6d4ec0ad4083a17e5a23a2275994c139667ff63b7daad6992635435"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/size-small.png",
      "before": null,
      "after": "2d40c9ccba695d211a28f7d71dce1f8c1d5b7552d2b5499c99370e96342ea828"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/state-disabled-selected.png",
      "before": null,
      "after": "953db7698b29a8fe78fad34884a42aa1775104170f99978e12284e605b4d2998"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/state-disabled.png",
      "before": null,
      "after": "28cfbfaa6f4d1bcbdc3abf23a7a68db3faa673dc43a9c8582b7cb7d9a58cca20"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/type-default.png",
      "before": null,
      "after": "3f528d96cef9661c91463e3e09d075264442664f2ddf4a83bd700e42cd4ed14f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/type-outlined.png",
      "before": null,
      "after": "49857333cb721ae616318dd637baff6feb3840b99a908e259c9f01992abb77d6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/warning-default.png",
      "before": null,
      "after": "4b3aea96dfda9a7e10bc6e3ae889f7603332aa30302fae9ed34274c70fe774d2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/warning-disabled-selected.png",
      "before": null,
      "after": "4b3aea96dfda9a7e10bc6e3ae889f7603332aa30302fae9ed34274c70fe774d2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/warning-disabled.png",
      "before": null,
      "after": "2c42c92dfaba71f82b6f36098368c6088063e6871b2305ecbf587cc0dc39cd1c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/warning-hover.png",
      "before": null,
      "after": "4b3aea96dfda9a7e10bc6e3ae889f7603332aa30302fae9ed34274c70fe774d2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/selection-group/warning-selected.png",
      "before": null,
      "after": "5a7d2a41d7efbb5258b6fb292906022dcfcb119a60f10011cf60f5ef54b512be"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/shadow/example-applied-on-modal.png",
      "before": null,
      "after": "ed9e4527f6b49e0298c541cd8af2aea2fbabab2bbe0884052d07af0066b1cd9f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/shadow/level-1.png",
      "before": null,
      "after": "febe0c4d11bb17b1e8fd88c0d94e7aa45123190efbccc5c0b268fc349187b934"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/shadow/level-2.png",
      "before": null,
      "after": "3d10c6e04d451ba5b9b86be12df75459fb1f05b6fb451f71270b6bdd29e470d6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/shadow/level-3.png",
      "before": null,
      "after": "be06710babd002a620e33b34ea6cf6dc4c753cb8665aa9e02fe8d66999e200f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/shadow/level-4.png",
      "before": null,
      "after": "32bd51f8a24ac1ca9cdcbad39a8798644e91f56803b7c01f0a7e912e5d3424d8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/skeleton/anatomy.png",
      "before": null,
      "after": "cd607e35e7c7720cc47779d25e96d5a8d2c7ee8020a374141a0b6dd5a5e77d1a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/skeleton/guidelines-group.gif",
      "before": null,
      "after": "7c376a08df1974aecbb2b5e168f817df41b6855d6da5d2934ee7f7aec84a8136"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/skeleton/guidelines-when-to-use.gif",
      "before": null,
      "after": "9af2b3b1e2b26e950a930640c0eb3c8f5c6e59fbec3cfbee460cec46d8d39053"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/skeleton/guidelines.gif",
      "before": null,
      "after": "9d0b8b7def8fa895f55408b6e2567cd03ebc12192bc4bf85d2e83e076e448dc9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/anatomy.png",
      "before": null,
      "after": "efd324bc11f4c297e3abf3a977d0d6662e0e1504cd5c2f4a877f3808cd6120fd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/do-s-don-ts-range-do.png",
      "before": null,
      "after": "76e896bed392bc2e74e018da8e9d47ceb6f99910f8bed90d6e53a43a84aef48e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/do-s-don-ts-range-dont-2.png",
      "before": null,
      "after": "33ff4e9cea25a0360171ebd9a603dc5cba71cd308b0dd7f6027b2e39edf032e0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/do-s-don-ts-range-dont-3.png",
      "before": null,
      "after": "ea247ed45424666b6b1cd9ec671f3ab57e3c0feec2994c82247edc91323ce3a2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/do-s-don-ts-range-dont.png",
      "before": null,
      "after": "7afb27a42fbff77be5f16973ebaee62d76b605878d1d2204bcf1105723b6f77a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/do-s-don-ts-single-point-2.png",
      "before": null,
      "after": "6039cd3030e1bc64586369b4e46d79bbf072d1af84fca7488141b8a2d1265256"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/do-s-don-ts-single-point.png",
      "before": null,
      "after": "e79f95e0924297605f7b4d64c80c0dfcb4f467c062241239cc5527670ddfcd95"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/modifiers-range-with-tooltip.png",
      "before": null,
      "after": "b77a6ed92ddfb6acc268d70a25cd2776d5a1f07b63976560bc18bf73223d0e82"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/modifiers-range.png",
      "before": null,
      "after": "53cd2c2978026eb7f19b4ef108240c3b20519303bcac27b222c83773c34f2d1a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/modifiers-single-point-with-tooltip.png",
      "before": null,
      "after": "9825bc5e5b12c8fdacf02df9f7ecb9e87bf6cc5d2059c158fdc261a1f222706a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/modifiers-single-point.png",
      "before": null,
      "after": "a504c2774174128667dee1fd1c7b59a2a2b2811d19ef13063d0b940ed6ab15ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/progress-0.png",
      "before": null,
      "after": "f2bcdf7c922908524381d16ab0ce28a004f3b4697e2d1a054d8fb7c5e26d805c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/progress-100.png",
      "before": null,
      "after": "6b56654990fc45970561f5e00db0720fd1d87d651a6a1460696e112ddb376a91"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/progress-75.png",
      "before": null,
      "after": "63bd31cd06c6d8aba70ee7a70862e2c9b490b5fc2b2d5ea96079369c5ee0f5da"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/states-active-dragging.png",
      "before": null,
      "after": "c397fd5880a405e825dcb68ba24a1bd2d002a636f78cdae4fc2eba32646c60e0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/states-default.png",
      "before": null,
      "after": "28c58b242bdaecba08112a38335b8b18a04560c3a84b35d0574de32fedc8b7fa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/states-disabled.png",
      "before": null,
      "after": "d662d41a8aa011498d199839c576d7a55224ed753252f77852eb567bc28fae11"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/slider/variants-dimensions.png",
      "before": null,
      "after": "f2a59bab9ee1781f1b4f61fd74f86def1b3330a85a01991cad808058a249cfaf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-giga.png",
      "before": null,
      "after": "73aefe9f33ad33be2e95b7da9f9a1f90f6dfd59033f24c7c6d31fe595446a3f4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-large.png",
      "before": null,
      "after": "6141a982b7b4a0205d4e06c8b8e6085c3c58561788ac28f14016e8aceb8bbce6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-medium.png",
      "before": null,
      "after": "0cd1a39d8e147fe04b1581fd6e7769e12854352c6dd2140435757b1f3039de8f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-mega.png",
      "before": null,
      "after": "f58654f3ef3d2080cb6267905c59e4cecd553cba9dbfcd9124ed1a81ae26dd9d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-micro.png",
      "before": null,
      "after": "e40fb21c1f132669dcc9a7a7fc346087a67efa86fe2dee302e82c8214d882153"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-nano.png",
      "before": null,
      "after": "cfe13ca2e767475f0f02b777d594cb1339b18698b57e0ea68b08612a4fd2cddc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-small.png",
      "before": null,
      "after": "dc2286f4231f0a7942cf53a50a325274a88f7215e7bbbaffb404a2e3a2125b6b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-xlarge.png",
      "before": null,
      "after": "2d4e97693a7c5eb31a7268445ac04e381554d7e699035537d3ac3e3d61c508ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-xmega.png",
      "before": null,
      "after": "2c2991ec0c0a7f4fdd72a0cc31c37e53c40d3a9887fdf64403931e12080270f6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-inset-xsmall.png",
      "before": null,
      "after": "766b71500c82e2eed45a69d66aea28ef2722f8e0b366a4853b05482f978c0f40"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-large.png",
      "before": null,
      "after": "06b650e787b429dab9c05e0f11c4d391aeaf99ca18088bf96ba346c17a1ad984"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-medium.png",
      "before": null,
      "after": "3e000b3b9dc1a64f272784b803d95a7df8f301de8efc8e438dda033c6f23805c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-mega.png",
      "before": null,
      "after": "6912198fc5d3ee94d012da218364b6b7baf230e7c8737e1738a13c53d7c7e741"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-micro.png",
      "before": null,
      "after": "cb4c44fe2bc93f7df9228f0100f43cbe1b234ed1d23dae9b797d3e968c71df48"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-nano.png",
      "before": null,
      "after": "87e46bb20db049af592bcf4dbe217651835ebe56cf2300c3fbfb88fd6e93223e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-small.png",
      "before": null,
      "after": "d94784a7c1f44278d28ffef7c4fa5a0dc661bcbf4880f9779a56740faa6f4880"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-tera.png",
      "before": null,
      "after": "ac101dbc6d33c647053e66c274a9c853096ef11a9e8e722347a6619eebb3f70d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-xgiga.png",
      "before": null,
      "after": "994690692668b441daa50a02be920667ebbd6017c2aee66924f4c6a1b59a707a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-xlarge.png",
      "before": null,
      "after": "082625cfbdcef92c2b76de696a192cd0b647fee2a397a39b8c02524b5a6490d6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-xmega.png",
      "before": null,
      "after": "349740d44cf005e8877cfadc0ae3a05c88abb77ad32547908cf5640c3c4437cd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-xsmall.png",
      "before": null,
      "after": "67bf9bbfdf60d8aa05927103834119e99c6b3794cc1bdffd7da9fe49c8d0dfc6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spacing-specs/token-xtera.png",
      "before": null,
      "after": "2def9e2114a8c8344e4e725f20abe7a50b0c0cc7ae50e99f83125dadff953987"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/anatomy.png",
      "before": null,
      "after": "60026df84e643fe5acd831f905512160181e52c80ca478293d34be033df4fbd6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/guidelines-group-2.png",
      "before": null,
      "after": "f176f51db623e848eeb189998b82158c1010545a42d2a5128a3e7f4c2c6ce0b0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/guidelines-group.png",
      "before": null,
      "after": "c9dbfa512c7df533a8c5423a0ae8e21c0dada8a24f6e79100ec90f82e7dfbfe8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/internalization-rtl.png",
      "before": null,
      "after": "3eabf117f2f9868c5a52fceee64c242497f134235ea5a895d206ff13ed0e1f8a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/modifier-with-label-horizontal.png",
      "before": null,
      "after": "08baf780d04f2d1502a3a2d611d10093d770a9ce137530a0b80a70b9407a2c1e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/modifier-with-label-vertical.png",
      "before": null,
      "after": "a57db38a9593ae727fc0d737f64ffe42f30af800ae7d4288c75f47ac9a3d3f5b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/placement.png",
      "before": null,
      "after": "2e954d96e963aa09ab3b6a957d4b6855924f1ad3e70239d6e19872b8c4c844f7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/size-large.png",
      "before": null,
      "after": "9f54ea365946f94c71a1bb6c5879a1d3758505d25b54abf21acf9a62703f5ef5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/spinner/when-to-use-inside-a-button.gif",
      "before": null,
      "after": "3753f8c7c1007934ba0a7fd136399798b2d80eb730008fb6502ac6514591b176"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/anatomy.png",
      "before": null,
      "after": "9d167853c41ac350fc5bec00f475053ae67ed7f6213334c1c5ffef40e46bca11"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/orientation-horizontal.png",
      "before": null,
      "after": "0d245af09e96d481bbb61a5349c9b5e10d482b0bc31255b19bd3e2bf450b5944"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/orientation-vertical.png",
      "before": null,
      "after": "1ec91558903fa945e648bf47a8fd9788488b42d6cc1a974e75973915c7607801"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/placement.png",
      "before": null,
      "after": "062138f615d5d52b4e0ad000be2b7b2bdebf2e1db0c719ae30e5bdf118019355"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/progress-1.png",
      "before": null,
      "after": "9ddcba3edd9c4816f70d244b4245cb426111717f26eeb383e2b683570ce1306c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/progress-2.png",
      "before": null,
      "after": "5b1695b2e38befb07ee13152afda25c02e465f903b4eb65f569f1b2ded4f2b55"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/progress-3.png",
      "before": null,
      "after": "0a70bfda0b85ff8c222700399bebc2b3dc72a75df67689523f988f33b6f139b6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/progress-4.png",
      "before": null,
      "after": "65ea3c36d7621bc6b3daf9bace48d032252e69e4df82d8408a147654a7e0efce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/progress-5.png",
      "before": null,
      "after": "515094022b5e143b94961b33a915d0263a455ff5188a421a4c66322cf5855ebf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/progress-6.png",
      "before": null,
      "after": "034e9c4fe5021e027bfe9f660ca9625ecaa0ef728d7535fbf00dded979fca19e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/quantity-3.png",
      "before": null,
      "after": "2182087f0b3bb064ca709309cbbf89361bb88ebb8ca9281ecd41ab7933465340"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/quantity-4.png",
      "before": null,
      "after": "0d245af09e96d481bbb61a5349c9b5e10d482b0bc31255b19bd3e2bf450b5944"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/quantity-5.png",
      "before": null,
      "after": "19b9623cdfc0ecd0b591d73bdd2842cb9c2b9dd91562049dff6cc4ff34a0da76"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/quantity-6.png",
      "before": null,
      "after": "515094022b5e143b94961b33a915d0263a455ff5188a421a4c66322cf5855ebf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/spacing-default.png",
      "before": null,
      "after": "f621075b5fd5d98b4a2fcf8a28f2dc97a1ee4f8992bbf89c9f918e7a7447eebc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/spacing-with-padding.png",
      "before": null,
      "after": "589a8872f68cfbc2ec754125a35e89e1b777c02f18ad82b31bfa9fb5723ff843"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/usecase-full-page.png",
      "before": null,
      "after": "93986a107f1b55ad50a541ef310234d0e461a4390450a04ff0d5244b0d7812f2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/usecase-modal.png",
      "before": null,
      "after": "85f05837b21ddc1b1eebba12a8cc5752c9123d08870dcae0026eb6e53e88ba98"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/stepper/usecase-panel.png",
      "before": null,
      "after": "221a791d3f1dddff9d506ca79e679da9a8b8c2c24c5cbdb38d65c9196712009f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/anatomy.png",
      "before": null,
      "after": "21312037d892b4fbb71da96311935a11a20f0476100e9bcf04cabd65a6909d15"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/content-do.png",
      "before": null,
      "after": "1ce9cb7f4c28ba2e8c39de21825338a986180dfa75f851bbd0f0d2c3c788300b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/content-dont.png",
      "before": null,
      "after": "c550fb1097eb7bcef4d956ac0edcbf04705784af5659def62800bc336400110e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/modifier-nav-with-divider.png",
      "before": null,
      "after": "fe5de095d4391d0186e88c3b577d4db63693382eff01eb7141e986bad54750bb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/modifier-nav-with-navigation.png",
      "before": null,
      "after": "74949093c90011150edfed9924b5b61c179eb1e0569f7500d30aff9197b7614c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/modifier-nav-without-divider.png",
      "before": null,
      "after": "792dbce11307e3d6ab2cec2494a3f0279a3a0f8ef2df5fc1638c4d5aa20e74a9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/modifier-tab-with-badge.png",
      "before": null,
      "after": "ab51b66d71cc7c6859e622383305cd370826c4f8fdef4ba0b811a9a35e3b6653"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/modifier-tab-with-tag-and-badge.png",
      "before": null,
      "after": "850fc0c5ac351f78ba0e056917e3b047711490fecc3088bd94560f9e5b5c28af"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/modifier-tab-with-tag.png",
      "before": null,
      "after": "14b5156ef9a44e6147940686d0c4ce08aefcd352689cc8c9004ee61db128a4a3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/quantity.png",
      "before": null,
      "after": "cbdad8a99b45de316861132aed539aecbd1ebc090e52a9a7366dc02f94ae552f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/sizes-large.png",
      "before": null,
      "after": "303a0ebf14a9ae4b5352d2240758fba2cb196790661099bed9ef6bfb73955400"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/sizes-medium.png",
      "before": null,
      "after": "1550833f10e0d89eaa2e31f47ae20d8892db435fb8bbe5d379fde16634ff5ea0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/sizes-small.png",
      "before": null,
      "after": "c4f919788eb64da6f1a6e52d7efa85dd5a434cd6bb9a0e1bad0f6504f097fd2f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tab/spacing.png",
      "before": null,
      "after": "3d75129ff4b7fcbe5170b3d436907587d92705e5a883811a8d695fa75512fb9c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/accessibility-voiceover-table-list.png",
      "before": null,
      "after": "70ca74dd6d42ea22f339877161c961f899ca4e0c72b8ec95e02dcf1958900bc9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/cells-padding.png",
      "before": null,
      "after": "72536f2bcdab850edcd0222c88f7a5ef6c3ff15ba84820d0c1189755794f2fdc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/interaction-resizable-columns-2.png",
      "before": null,
      "after": "f5738e20941890a74df4b7b10723f5cff3affd467fed1600ebdf288a67a332e4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/interaction-resizable-columns-3.png",
      "before": null,
      "after": "aae711f77c6069f030f5d5fdffa8418dd5e3221981ffd3456b6f89cc99b20f31"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/interaction-resizable-columns-4.png",
      "before": null,
      "after": "eac116a6dbde49aa3338d31edb724fb99ba932053e9f5a8b390671444d268851"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/interaction-resizable-columns-5.png",
      "before": null,
      "after": "107bb057b371d4564ac61f9cdba9684cf2f85bdde39076b14fcfd2ca5e94eea4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/interaction-resizable-columns.png",
      "before": null,
      "after": "a2c74a1aee509829120f6dd6f3d1c6b438044005ee9b0a0f5d58ab139fcf8cbd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/lazy-loading.png",
      "before": null,
      "after": "e4e068d11ee15866d36d9b1f11cd4a589acd964c702de35681207ac5c01abc19"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/options-table-options-option-selection.png",
      "before": null,
      "after": "c41b77dd2ef3be080b47e2b6303ba94a075a6226906f4f2e27c710995a3c7c3e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/options-table-options-selection.png",
      "before": null,
      "after": "b95fa81678549e4d9689160c5efc50fc6908fc06c280db9962f7aae692945668"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/row-large-row-small-viewport.png",
      "before": null,
      "after": "389e6a8c51b4bf91cb575d3635c422d361e9978fe25adadfa4bd0e495eef7c25"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/row-medium-row-small-viewport.png",
      "before": null,
      "after": "d9e23b0a005834032466120895f322549654b46808a84f8be5a42833c9fca96b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/row-small-row-small-viewport.png",
      "before": null,
      "after": "fbebd22a3fcfd228c247c0fea5c5261fe1205398dd7fbed1bad971c26c36c2b8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/scroll-small.png",
      "before": null,
      "after": "c5ceef3ad402bb6f59c572a44aa99617301cbd3d7afd07eb4a0d32be13ab1093"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/selectable-header-checkbox-states.png",
      "before": null,
      "after": "31958d0c5987302c8265c157504d0b43040356e1dbe00f36877d51b121372414"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/sortable-sorted-ascending.png",
      "before": null,
      "after": "37c1f47abdb65357743265f020325ab40f35b8c0d3cabf067935ecd9654ca929"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/sortable-sorted-descending.png",
      "before": null,
      "after": "84a3e44c9c21851d5e1b8667bce132560a44273159eff1bbc5d95c761053e0bd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/sortable-unsorted-disabled.png",
      "before": null,
      "after": "20ca2a7c1edc35b7a4c8aac8408ddfdef8db668e5d7e334e472beae5a9468aeb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/sortable-unsorted-hover.png",
      "before": null,
      "after": "1aeea26576229506829b82f2fdcd02e803fed8702f82919c7296b596cef1b739"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/sortable-unsorted.png",
      "before": null,
      "after": "0ec2b96cc680a4d64c7d1782122af0c8b5cb5c26f2c05c7b42e2c1bf9543d76e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/table/status-rows.png",
      "before": null,
      "after": "c06c8c9aa88c63e68cbdee253620bbbb256dd30c016d402bd9839d3702999267"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/anatomy.png",
      "before": null,
      "after": "3979723976a1096070847f7d82b986f06b892fc21c180f9e6030ce86c7a87699"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/content-do-status-names.png",
      "before": null,
      "after": "23b9e024b458d4ad449cca8aed3c3b8970d45ff438160d94525c831b2bf2b59a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/content-dont-status-names.png",
      "before": null,
      "after": "d204a2ced8994825a2e96698f5e32198ea3b7a6e4d515bb3c6413404a73660ce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/content-text-truncation-examples.png",
      "before": null,
      "after": "c807476cf9bce1265148e369b760b7a2f56c6fa780a96f1f1d9168474cdc1316"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/dimensions-max-width.png",
      "before": null,
      "after": "b4931a3e31335de1b0479c4e774aaf3cf752ee9083155fa0fbe6ee3673bf6975"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/group-overflow.png",
      "before": null,
      "after": "4f4c81cd7014d5cbfd7a85377d435dad3da1bcc9b28670b472eeb28a01b87575"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/group-spacing.png",
      "before": null,
      "after": "0e5e3cad1d94daad979ccfa95756f97023c387bf8566cc2abf1e2a6d2af3d83a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/guidelines-group-2.png",
      "before": null,
      "after": "f859e09e3526f1e9328ec02368a825e1c79ba1f3d5e048b3ab19a6b2c88d5bca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/guidelines-group-3.png",
      "before": null,
      "after": "5963990c5511fcccf2d6b3291bc977f7ff089186fe338074f316941690634f69"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/guidelines-group-4.png",
      "before": null,
      "after": "852ab8c49437264cba612ead8ca72256f1fd3e5ca7d8bf4772c6fc748a610271"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/guidelines-group.png",
      "before": null,
      "after": "342900852ac9c27566febf4797f02fa0f19a1f68ee411c900511ffa59eec84d7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/modifier-dismissible-icon-label.png",
      "before": null,
      "after": "85e1c6079d5dee26b1bcf73019b9a945f9bdbbd6fe253653c9432d35dedb99fe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/modifier-dismissible-label.png",
      "before": null,
      "after": "5b08ca9fcbb02656bf6720261f7513425a1ed22c7f7b801dd1349141bc2e49b6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/modifier-icon-label.png",
      "before": null,
      "after": "d368458b6140e5fa5402eb6333b1c54d23d94e8a56796bf50316430ae10256a5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/modifier-label-only.png",
      "before": null,
      "after": "d81a16ed2a37934745c1f9fc31917b74bb39a3123824dc5429457202c3e5d2e7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/modifier-only-icon.png",
      "before": null,
      "after": "8c3e9674f3fd80e6c1d2bd16a6dc4824d27ab71ab7f77374cbc44bb787db09f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tag/shape-only-icon-badge.png",
      "before": null,
      "after": "27f3e68b3f298d371347ce5e08ef39d3f965cfedbe64193dc93044aeb33d7682"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/content-do-blank.png",
      "before": null,
      "after": "e2789e448ea53eba32b1b7dacba774a37805ed370b9e50375fdb430e5c675d5b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/content-do-example.png",
      "before": null,
      "after": "df91d5f699f9425760b765b957e5dbed5a99547cc83b288410fbee3ade54be00"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/content-do-prefilled.png",
      "before": null,
      "after": "0be374d2be208f2e92900996f43d1938a00e5528f47608937262b1589bd56276"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/content-dont-extra-text.png",
      "before": null,
      "after": "dd14be7507171278e633b042bc8dacded538d2f89131649af560324d6cbd599d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/content-dont-placeholder-only.png",
      "before": null,
      "after": "09400c4be5c3c2213deaf16f5fac5f46f3c1b2f13063c876784f95877998f650"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/state-medium-disabled.png",
      "before": null,
      "after": "6f16532021dae41983604d484483b2ee9d0eb3a909d4201f5b101fa2f7b91286"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/state-medium-error.png",
      "before": null,
      "after": "20e595adf192b23a9dc1131c47c627885722bd4596207fba2a1825ec1a805aa6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/state-medium-placeholder.png",
      "before": null,
      "after": "a139476775c20cb9bd606971bd8df2466e2638493fd1cdb84e822020afdd99cc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/state-medium-readonly.png",
      "before": null,
      "after": "5e7319a4b99a3c0f85a05565bd1dd8163b4da79e96f4ed5293938d2f51287cc2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/textarea/state-medium-warning.png",
      "before": null,
      "after": "ab9f900c6724f8a30f8709bac8215c0b2ae99436eff0792dae7e1a70a03fffe0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/anatomy.png",
      "before": null,
      "after": "7c1bbd6de10aab203a240d58f06b16bb55ee8a9c5ccad9ca14bb4624f0164ed4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/behavior-no-partial-do.png",
      "before": null,
      "after": "5f3c47850e46d6c177a28a92c8c2a6d3df3b465f367fe7f7441bd6ceffd589b1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/behavior-no-partial-dont.png",
      "before": null,
      "after": "53a38b859590e006ba5b7e13f6443bb1f8d333778b091067902e797c71f54983"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/behavior-toggle-copy-do.png",
      "before": null,
      "after": "b9fb68d0659ff994248613b7a0c259def7c18e237b2aa07869392d3f04cb3dc3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/behavior-toggle-copy-dont.png",
      "before": null,
      "after": "da1016c191e20d1e616522f8fe2fe76ee34f0ce5eb88b2e9aad903e08898672b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/behavior-visual-language-do.png",
      "before": null,
      "after": "a12c9398326393428a8a1d435b7de9104fca68b921c26070fcb201e7c6126b58"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/behavior-visual-language-dont.png",
      "before": null,
      "after": "5181ce442156bc1c15cf76d0f57a646ef4613b0456d281b8237e686435e66eeb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/checkbox-do.png",
      "before": null,
      "after": "fe3ff80d4b123676eafec4dc87969ef4dd1b2fd63bb0dd0a82cef0b45a602f45"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/checkbox-dont.png",
      "before": null,
      "after": "66f59edcde9c351d3d9b400cd629921eca76f4b6cb266c1024b63e1122a52f61"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/content-example-disabled.png",
      "before": null,
      "after": "f902638bc9684fd4afa9c15054e1bffb10515f74fa431aa790d78ee9cbcb2c9b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/content-example-enabled.png",
      "before": null,
      "after": "320f59746f774b647cee4e837eb0befa20e2739c3ec139bad35967faa3fc7c49"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/interaction.gif",
      "before": null,
      "after": "18032fa1132f41cf249b8d4c571bab8382547914c8e9e6d668a1864d006acdb1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/internationalization.png",
      "before": null,
      "after": "81b542e962f8867fd746e31a57b0aaf641084d2cb0f4c51b3b6185c305578cf9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/orientation-ltr.png",
      "before": null,
      "after": "16cac7c65d6f52540ec1634fc086d4db02641c045697baecb65d39be289533af"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/orientation-rtl.png",
      "before": null,
      "after": "838d450e0ee20fb945b1b3675e3f1027d5ef0a69711acd577626bc381d9ce6dc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/overflow.png",
      "before": null,
      "after": "fdd153da005f02999b94dad48960a19e8aecc6ee47060198681d55aab63ac8bc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/radio-do2.png",
      "before": null,
      "after": "553aaac7f3941fd8cd4cc915fc8d618c1e60eb6afe448022268464cac4adf768"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/radio-dont1.png",
      "before": null,
      "after": "11aab42ab0c165651406da9c6dc5c9436d6929ce971d68ca6d3ce50440137eae"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toggle/radio-dont2.png",
      "before": null,
      "after": "5726d5e845d8c94f85b061662764d616add71b893b17bc592f9b0b42dccabbff"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/actions-large.png",
      "before": null,
      "after": "d1048ca9d55d1a164a31dfbd82ecff749d881b0da529575e5b1102c97abbcacc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/actions-medium.png",
      "before": null,
      "after": "21ee9951af526cb475742ef6f53ad935af95263b8ebbb7c79e1bee557f5a431c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/actions-small.png",
      "before": null,
      "after": "9e8f2233e431458c34a4945221af564b1180c778b64c96d61adc326f3daf4428"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/anatomy.png",
      "before": null,
      "after": "d87135af1a29da62e93307d0a4b28c6a50982fd0d92fabea1fa774f46a9b958c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/applied-large.png",
      "before": null,
      "after": "00ae1d927f45e3f08742f64f37977a1f932651064c01d8a2d62a7be95cc44e19"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/applied-medium.png",
      "before": null,
      "after": "7512a8bd9070406056caa4da1bcde121bfe8ab75759c1bd7a055147bbacce134"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/applied-small.png",
      "before": null,
      "after": "3f9a48c14094a3eeefb8a2cbc60b5e46a510d923305d1a0f6c292c8850389a32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/input-large.png",
      "before": null,
      "after": "8b7dd41b6e2de744df6444ab01e0df6a0f97b08a4a0816d51ccd34d83ade47c0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/input-medium.png",
      "before": null,
      "after": "3e088fec2c08a4e2c645ecf8486f6306491e8b343835c4df627d3597f2d46390"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/input-small.png",
      "before": null,
      "after": "5d56d01975f2ed36101a85cfcd12bc05a8c165cd7be692d1171b6a73c06edd1f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/items-large.png",
      "before": null,
      "after": "cdb204a3479999d3632e993cd224cf2a5c61a1df0ff2704fc724d6324796a0e9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/items-medium.png",
      "before": null,
      "after": "16755125e4f24bac869bb2c45410fca3b547ebea5a637ee8faf54ff3e4ab5252"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/items-small.png",
      "before": null,
      "after": "96e4354fdaaaa1cb412b1dd04caa6da59d5a7a7b93590915c3e4a11295e55e4d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/overflow-overflow-large.png",
      "before": null,
      "after": "f5afc77ce903771a1b66b38f17b15df480dc2a8e5987c8414ea612e44c308b7c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/overflow-overflow-medium.png",
      "before": null,
      "after": "1e565f135edbed541c11300bae82b76237fef86cb88c73d7cac62c626b1ad541"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/overflow-overflow-small.png",
      "before": null,
      "after": "0f756fa859f4bf6d3137afbd61c652c6402cb859d1a503a5677e4b424f72e673"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/placement-placement-large.png",
      "before": null,
      "after": "f62c39c6f121eb938eb981a19d924b1b0b8fe4039c9e93a7d3015c8d2781e77a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/placement-placement-medium.png",
      "before": null,
      "after": "a90197144e51f7cb5dc76d1b4a8d298a568c0c4da4caca8a3bf53a300a7388d3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/placement-placement-small.png",
      "before": null,
      "after": "a4ec6215ace3fa060eca11c41cd4aca82f0104d5e8098853f64d2c284565b174"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/responsiveness-responsiveness-large.png",
      "before": null,
      "after": "f9a80069c233ad278d54df884612a85334a3ece7c32b2e73d9a8e3703139b1ff"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/responsiveness-responsiveness-medium.png",
      "before": null,
      "after": "589b651d8c687cd13043e186e407742fe8618a34a24fcca08ce6534ce49471bc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/responsiveness-responsiveness-small.png",
      "before": null,
      "after": "79ccf276cf18a6a64377084213c25ad8771cf88e43c59a1024735eae8a713213"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/selected-large.png",
      "before": null,
      "after": "0605d592e89a03ff314a6547940237a779b4e462bb2c5f6bdb72ce2689c1439b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/selected-medium.png",
      "before": null,
      "after": "98e21206e443c002d7220321624a6ecf9377411629df5e7c63a5205cb33a9b0c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/selected-small.png",
      "before": null,
      "after": "fc8f4d3bcfb6772dce9ad814a8e8f37352567077046e3864fa89c489eaca32ae"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/sizes-size-large.png",
      "before": null,
      "after": "5e76f9ec68c2eed6bd1f1f7041fca1906c542f4c2f8d3e818c4457d46660a2c9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/sizes-size-medium.png",
      "before": null,
      "after": "c21263a9736dc245c61b3cc9fea011ea317c99c1405d0306f46ab703642a4bd7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/sizes-size-small.png",
      "before": null,
      "after": "e86a38665970a0d59567beff4d18c0d22d508521baed5656271303f64fcb26b9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/toggle-large.png",
      "before": null,
      "after": "555afedf5eeb3afc68fac1117fe7dcddea0f4b7339adda78c8f327443f2c79fa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/toggle-medium.png",
      "before": null,
      "after": "54bcebb6c5aaaa1b54f9ad248eebda53dccb480005764d8356f8e4d1cc568bc9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/toggle-small.png",
      "before": null,
      "after": "3ffde83a94cf7ce45464d660e75b6addc1db679d139722fb2597d135a2db6fa5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/variants-dimensions.png",
      "before": null,
      "after": "f6844e66cb6d9cc8cf10393297c801ead7c4729452c78315d8afcc0f8cf6f5ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/toolbar/variants-spacings.png",
      "before": null,
      "after": "209b7bd85ec0dc5ebe27587fce2e5708ebf19ed85e37325bd7ac56d7fae4ee05"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-dark.png",
      "before": null,
      "after": "142bdba9883acbca676a895db07783e849ff116d1d5842b70536f7bd5a51de82"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-error.png",
      "before": null,
      "after": "e36b163e11821751a919d1b57c1a96c265548b8ddbd9e63f4a391a1a4880c756"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-light.png",
      "before": null,
      "after": "ccccab3b7e20e0b09598e4e3cfbb225e39f3bb170aca81f6ba4e000a7052d071"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-when-to-use-error-light-2.png",
      "before": null,
      "after": "dfb9f963863558be059e6788de00e8b6c2808bf85b2674eeea7f565ed63193c9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-when-to-use-error-light-3.png",
      "before": null,
      "after": "ffec07b96f1ff4d3331510fadf0c388fa12ab78a5b8f8c72420f93395173144a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-when-to-use-error-light-4.png",
      "before": null,
      "after": "d05aad419d274649a4ce10fd77daebb6fb08966486e08bba2ed8cdfeb4b60b6a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/colors-when-to-use-error-light.png",
      "before": null,
      "after": "40571deafb47f95af0ff225c65c52d43a80f8acce7fcd185ca28eaa8cc7d965f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/do.png",
      "before": null,
      "after": "e079ae5410cbb6d5b605fe8a0510e6709b44610decb268d0b916238ad8d7d380"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/dont.png",
      "before": null,
      "after": "307d1da381a0c5fe0ada301f6fac647e296fd6f4a189d7f8735666e0322286f0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/guidelines-placement.png",
      "before": null,
      "after": "8d2de6fb1306220a1d4402df620606e391377b7d2330c2b31843864cfd1ae8b2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/tooltip-vs-statefulpopup-2.png",
      "before": null,
      "after": "e0e0cb3d6a676598065f18d3fe2a6cebf02d07e2b2bd7a81d7683f3ce9059bc2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/tooltip-vs-statefulpopup-3.png",
      "before": null,
      "after": "c41338ab2a5ec7c7430773af071ec94ed220aca60dfd8cc2927c3ed588e79b04"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/tooltip-vs-statefulpopup.png",
      "before": null,
      "after": "d5a15e1e7955954add7a9bfc75af4921431ed589740448877dcb58bd1e7187ec"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/use-cases-disabled-paired-element-caution.png",
      "before": null,
      "after": "965c912929bbd5970c00526ba278eb204343505d2d828c4a4572a30e4b0d9a56"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/use-cases-disabled-paired-element-do.png",
      "before": null,
      "after": "9e61012613241619eeddea07757ed8d39167c0d3b387de433b77a7abaaf2881b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/tooltip/variants-spacing.png",
      "before": null,
      "after": "a44d14094c474d47b7563d8ff4a2c0174c09ca6420ecc45bb6e774665371f998"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-capitalization-button-do.png",
      "before": null,
      "after": "d6737ec0a0656c671b04dfe0014578b935ac7566bdbff0af2a6def898a3ac50d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-capitalization-button-dont.png",
      "before": null,
      "after": "222e45e0149db0fed4637a98f010b88057ee98a42756d0186257f23aeed22373"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-capitalization-tabs-do.png",
      "before": null,
      "after": "f78c5d097bd8fa6bb53b587b1ee0e7b26e53dd5b8521aaab9e06788a9da30f04"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-capitalization-tabs-dont.png",
      "before": null,
      "after": "54335f16ca0ad7356e2b4ae988e00cdba4d6a8495785c8cda16f27c7408f8bfb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-line-length-desktop.png",
      "before": null,
      "after": "9a5c7e4bcdcea1c44b29572a7b96dac5f88f7404e5c701d4d6157aea73b42a8e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-line-length-mobile.png",
      "before": null,
      "after": "c9b090848c32c5666d946f4ec45662cba2b99f7898175e0225fd6188572d7236"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-scalable-content-do.png",
      "before": null,
      "after": "85c93346d93df735b9e6ed102e4515ff92097b377e97a1aba3f6abc41a23324d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-accessibility/accessibility-scalable-content-dont.png",
      "before": null,
      "after": "59ae8e1ebe93cfd9f5ab75c95ac00fbb2c12526cdd45f241f311716ba975a354"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-family-base.png",
      "before": null,
      "after": "db6fca944364e5b13b9efd33d95b5355cb60e50693dd6efffb39260feed9b86b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-family-mono.png",
      "before": null,
      "after": "33cf17d254ff98e6afc81357fb52a4d25cb2f7f6f0e72c1df40f349c4774cdad"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-giga.png",
      "before": null,
      "after": "f29d8bdfc32870ff69c60bf248b271ac39226b190b25c78bbbdb395a5b687bd2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-large.png",
      "before": null,
      "after": "8c7a66324f6f817f71c81156ef107d64e8dacea20c8de74c7a1eea162001156a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-medium.png",
      "before": null,
      "after": "0828c9449b30fdcc4b5ac3cca33ed5e75d0c172ea8506249000e0ce7aafc01a6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-mega.png",
      "before": null,
      "after": "0b409d9859964189c6dc969a4dd9bc2eb2bf3381223a59c764c724d9e208b709"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-small.png",
      "before": null,
      "after": "1634106caff85b53f3638f05b4c4369a3f7c1fed59e4bbcc0e1cac18b4c31d71"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-tera.png",
      "before": null,
      "after": "78fd69ae2a79b5a5248ef1a8339463f6eb5a1fa11ee1eef8aabcd974a705833e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-xgiga.png",
      "before": null,
      "after": "e5a5db4c84745b3ec7de14e08489d6e74670aba09bec52e09dd339e43ea1442a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-xlarge.png",
      "before": null,
      "after": "2f4ae9f308ae1e2755a2ba6437b9ddbfdc7d57ae896e3d7d3ee5cb3437db2b9b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-xmega.png",
      "before": null,
      "after": "4db90e2cc415c13433e11a8124c724fc6fcb022e6d77fdac0d267f89216d45b5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-size-xtera.png",
      "before": null,
      "after": "3d0ef029f4601ca90173bb538f22e59dc5cebe3f7f7f8a924d30342a9ec1eec9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-bold.png",
      "before": null,
      "after": "7e653845dc90e7e09dd772424c71a959fa0c61aa23166abe0fb33e208581f78c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-light.png",
      "before": null,
      "after": "58e5aac31d3b2f256f8d70eca093a860f29953cf2bc4ca565736773205365288"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-medium.png",
      "before": null,
      "after": "cde515d9a9cfde4400ef92be42131bc669ff7994777b473f3cd2e4f92d1187c4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-mono-bold.png",
      "before": null,
      "after": "1b841b69d58ac4855bec4e5282fadde15ecbfc9470b953c2d57902d39b399de7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-mono-light.png",
      "before": null,
      "after": "694c740bc191a26282a8481a6d8c41cf6847f75d34f48b52f53a7e2ce6d15295"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-mono-medium.png",
      "before": null,
      "after": "b90aacde8f2a8203e547850b0c72e0f566f4a306c525e8cc6b3794be71a68286"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-mono-regular.png",
      "before": null,
      "after": "077d924ab6e5344f52cfb926a92bafa9f3cdbf36c05ac2220002af0c1aa9ffdd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/font-weight-regular.png",
      "before": null,
      "after": "04c94152a3cfe0759b017d47858680482417b9ea55a57a152280244628c0eef1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-default.png",
      "before": null,
      "after": "deb66e255720c120b1958c98a48641839f200b2e4b4b75d82f43383d1a9c15c4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-large.png",
      "before": null,
      "after": "fcc86457696c70517deb7990fc1090c7b10360807a4483dfa42557b87a0cc179"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-medium.png",
      "before": null,
      "after": "23df8b8af54af866806bd64abb110ed6dff3acd7a20b742c37131a5d4b86ff66"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-mega.png",
      "before": null,
      "after": "889fe974e5268f76a5155641e199a41d4fe4f7c4a171d44509af2a2573e02e4e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-small.png",
      "before": null,
      "after": "a95c4cf65e9d39db6c9d7992a04febec663f8fd3f70c277791377ca7ea68346b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-xlarge.png",
      "before": null,
      "after": "cc3b965557fe33d00fa663eadd9d5a2304740e7ab66c3f0d7ee45b38d4873bc4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-font/line-height-xsmall.png",
      "before": null,
      "after": "ba20aa5a2c7f56dbbc12df5898dc3f971d26aefb1e9082f01042492ebe3fcb1b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-scale/scale-content-paragraph-microcopy.png",
      "before": null,
      "after": "e44884a6c9c8f1297875dbffdb7303c429e32da0340b07152bda5526f4209363"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/typography-scale/scale-heading-scale.png",
      "before": null,
      "after": "5db23114dca06afc05f25b4e2b82b08f794183b51f27225d9175600c2bbece29"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/units/baseline-units.png",
      "before": null,
      "after": "7fa607e5abde24639d5f683b4283359eb399d2e843634c390e2db0c5afa7523b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/viewports/breakpoints.png",
      "before": null,
      "after": "29b2269265376c009a03a2950299d7ce639785dfd0cd0fc6cd8ce03080ee823b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/viewports/large-components.png",
      "before": null,
      "after": "da8c6be8fb9e1eb2668b011b295c021e49523cb43a262619c761f8d3ae507c53"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/viewports/medium-components.png",
      "before": null,
      "after": "b552c4569e4d811b39261c7d93e025f6a50b9315853184d5f605e4cffbfe5771"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/viewports/small-components.png",
      "before": null,
      "after": "cab4d2f206943da1e3f174d8bf59969fe9f4f4eb01d79a899410994c193a1bdd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/viewports/viewport.png",
      "before": null,
      "after": "facae29caf9823f304edbc01f27a3c67803601fbf1122c18a20c6144aa7ae072"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/dock/app-status.png",
      "before": null,
      "after": "86645e50b3246d3829937952b383144e659ebe55e92375821384b034eadbdeaa"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/dock/height.png",
      "before": null,
      "after": "adc1ab8479bca5327b629efa78e173e07a93d88749e53a0094e9d38d2f8d64c7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/dock/navigation-levels.png",
      "before": null,
      "after": "706f3a57547ece6a4b41b23381557be8646d802027a689ebdcdfb17159c9dbc5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/dock/overflow.png",
      "before": null,
      "after": "59d0980386c15b9cb1dc7e1016cb67c2e5ffd112fbdc0986b4e8b67e66df76b0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/drawer/anatomy.png",
      "before": null,
      "after": "5cf4b25113d13a527a2bdc93ed0ddcb2c05cfba8d1fe43cab48b1cfc2ee94409"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/drawer/collapsed-selection.png",
      "before": null,
      "after": "9a50ff7b3d9258131f81084b37cc0fc2ef982c7347fcba7c791a4e3b8e624f17"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/drawer/overview.png",
      "before": null,
      "after": "556390577f47dd8a8637805e7e0fa03e0aace03f9e5d14dee7cd10422b3d436c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/drawer/small-window-hover.png",
      "before": null,
      "after": "c044a769221ca61a3779d60d8ecedb7d7d9f0969acf73aea7105704b76075339"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/drawer/states.png",
      "before": null,
      "after": "74e8df82a6c8cb2b71fc15caaa1175b094ef0d5f3fa9e1c9eb5d6f8a7f593e2f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/drawer/support-suite-groups.png",
      "before": null,
      "after": "bca73399544aeddd2e5b6dbacb671efd94be8370031cb491690b3cce45bb6f4a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/messages/banner-do.png",
      "before": null,
      "after": "05d2603b5cf72a9a461b853296cd4546a13f5364f65e977cc2e9851d644c18e3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/messages/banner-dont.png",
      "before": null,
      "after": "df5c9aef6489498153567bcc3105b0640b0a91e8d11e897b54a79d2b99191ba7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/messages/banner-problem.png",
      "before": null,
      "after": "a92f9827cada5e52823900795bc6fadf5a6366e0d58dcf686b8afcc9e815d7d1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/messages/banner-solved.png",
      "before": null,
      "after": "9bdec129acf3469f86ba1c2759d639afcb8e5e18288cea116fe25718f8efd4f0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/messages/notification-center.png",
      "before": null,
      "after": "ca1d6fac0fad8d6bbab21983c094749e3b0d4ed1a4578b925d02fd916ec65736"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/overview/components.png",
      "before": null,
      "after": "390fb3bc819eeafd94ac36f56980cbf551373c83140f22e479fc4b13f64be059"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/overview/desktop-default-size.png",
      "before": null,
      "after": "3f35c89d3b8af6b9430219e2364162a39ec52299b117b9831b2e92365764ee4c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/overview/desktop-minimum-size.png",
      "before": null,
      "after": "7a19d81a8a9473b52de67136c2d42bf59ee9043531014d50b11a4e1d5f425a2c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/secondary-area/app-selection.png",
      "before": null,
      "after": "a46574189f0c91e8d0d416dff1e835efa9d35a4b2d918bdc1c4e33ebf638781e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/secondary-area/browser-toast.png",
      "before": null,
      "after": "095b17d324592611386250ec0ae4386b6516a45614fe9874f8d4d03a10073306"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/secondary-area/desktop-resize.png",
      "before": null,
      "after": "56f6ac2aee15f3de879707bd729d283a9c730c35af32edaa22751b0b75d2084e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/secondary-area/overview.png",
      "before": null,
      "after": "3e11dce71969c0e5ae751b473145eadaef2fd98a4575190fd7e8a2c0e714ecb1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/secondary-area/specs.png",
      "before": null,
      "after": "ef2740e316da5a766e49fe8b6e0df0f68a0d8c71a4cb8f00a1be94b6e2e4f274"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/space/priorities.png",
      "before": null,
      "after": "8d2cbe9548ab296b4bddf91fad75297ce2b7aafe6dd0daf60fc640a54cf1f80f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/macos-large.png",
      "before": null,
      "after": "5002ca66b7b9f250871b4de13dd24b2929248e06aecda7030f8eedfe77eccc4f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/macos-medium.png",
      "before": null,
      "after": "da52625b73529df48c86ba5e81b74b8eb476a2b40fbf038d8e35f2ad6366ed43"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/macos-small.png",
      "before": null,
      "after": "3532a7bb764c2e3939ac75d9c8120ec0517478c6fa7d60d5b9e409be5efd1ec9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/overview.png",
      "before": null,
      "after": "6a592929aae20c0be18b00088f308a8cc7ddc0d8544535eba5fd2e5ff0387d57"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/sign-in-macos.png",
      "before": null,
      "after": "99ed1758aa7f71663b74827e8d8524295eebfed7ec80ed99a5fc991df164257a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/sign-in-windows.png",
      "before": null,
      "after": "1efd65457ef4ae6ba61a057a9634553cba8128e940299fc261919fa0215a90c6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/web-large.png",
      "before": null,
      "after": "b7e0b69f75f1b7b031986c67405ef8fe8becfd75b3f6841d1a6bf4be0f2d33dc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/web-medium.png",
      "before": null,
      "after": "99876d22718464328d7a686f24ba8e35b780da92e973ca28c4b7e9ac75671492"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/web-small.png",
      "before": null,
      "after": "79fb02925b4a657b1576486ead596767fe31f23699e4053df6e0746efb697685"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/windows-large.png",
      "before": null,
      "after": "1207de55983b49eebe34bfb03fafd382e08fe215879ace327af101ffbbfcdc16"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/windows-medium.png",
      "before": null,
      "after": "fd7525eea6633b3e3b6fb69c844ddb0aa16f1e03ee934317ae3042ffbb3145f3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/assets/workspace/title-bar/windows-small.png",
      "before": null,
      "after": "49b363cee0d106dfa52986d2b914b500b5fe239ca5dba6f9573c60fac62e54b8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/accordion/accordion.md",
      "before": null,
      "after": "285183024912d904e2b56780cfadc4c576abe390c9f7876491e2e3786a3f569e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/avatar/avatar.md",
      "before": null,
      "after": "1d6b2686d8a4baf5d0e504cba88349e4d1de8944d7379c359c9ca1a1b3d48177"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/box/box.md",
      "before": null,
      "after": "c4704299523a702aea06d0f1922cdff75d2bb356417aeadce3ab7dca19542560"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/button/button.md",
      "before": null,
      "after": "feba9f415955487a926d438e73015472da3b6a4eb2a96df5d603a5b27363e9fc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/calendar/calendar.md",
      "before": null,
      "after": "1271b91016efa9c88624358c19231522bdd83b6f4126a90dfd877ea846eecdd9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/card/card.md",
      "before": null,
      "after": "7f0b44019b02290512782a191ae44ce150246f8a9b1b1949b611be2847d3bc6a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/chat-bubble/chat-bubble.md",
      "before": null,
      "after": "650a635761a2302d26892e1c6ff80bf2cbebd7f3292d9aaae37b1f450a99d5c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/checkbox/checkbox.md",
      "before": null,
      "after": "7bea138ebf9212fd8cac5682284821216ad7f5483ccd3958943cce8a8e4cb065"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/color-input/color-input.md",
      "before": null,
      "after": "fcfc4846bd1205ec3d44314fb7d5472d33e6fe2c5a268bd414078eac3fed5d86"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/date-picker/date-picker.md",
      "before": null,
      "after": "c4e9d23ae3e168127c16d7e21b89f31d380cd582d6fc9f5072a88ffa54a33dac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/divider/divider.md",
      "before": null,
      "after": "93347e4fd9e7a4f0ca461a9102f8d35425fd3c70096523f3ee8135ef3e0fd755"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/dropdown/dropdown.md",
      "before": null,
      "after": "b63f9fb0065c4437d43a9974a144ae34da2d985474b91fb372c1281d29cc0668"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/fake-input/fake-input.md",
      "before": null,
      "after": "35716f06261532dc93c26f994411c2e5eff7c163cc5a47816b90e27b41e74e25"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/field/field.md",
      "before": null,
      "after": "ee0b30344b7d89274028e92178d8d0380afc482b35152bdc99a98a222d5ac9dc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/flag/code-values.txt",
      "before": null,
      "after": "99df5cb90733cba5a93d982933a605b8b93cf3600d02b03a846eac2734aeeb57"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/flag/flag.md",
      "before": null,
      "after": "496dfd1d644b50323af339ddadf1c2839fc8b8339121293c5983f7b12433f0c6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/flex/flex.md",
      "before": null,
      "after": "ecd87c9c82d2cc36538e17cd3e209f088ae6e620a934e1afb2b58f47e265d9be"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/grid/grid.md",
      "before": null,
      "after": "345fc1ebd4dd6298916fa2583dc31bf58192cd32d69d4a378f14dbd7318bc606"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/icon/icon.md",
      "before": null,
      "after": "631828b3c840787d576b2f97981d6ccdb672f509f2dfd1c6a82f6244024c80c8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/icon/name-values.txt",
      "before": null,
      "after": "2046dba20251dc622d0a7ef642760ffd1ea6494b7c464f3f663d99f0aca1e606"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/illustration/illustration.md",
      "before": null,
      "after": "c229bbbff8b14b4585fc6fe8546d069969d28928e990f3b2aeb5520ca63b6307"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/image/image.md",
      "before": null,
      "after": "0483e5fa4a49866087f5944af40d014d3e7b914aa420183980e16191ad7f4b4e"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/input-group/input-group.md",
      "before": null,
      "after": "1a6eb573957bf78a79e117f0d41ccd959bc3f2b980f05be9b3c241198da56edc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/input/input.md",
      "before": null,
      "after": "97043c91f2af3d22078c29b2edcd483e27ec98260a322ef9340121dd703eacb0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/label/label.md",
      "before": null,
      "after": "09077fee98e9905a52bd1d9ab03d8865271c2bf1bf677faa6d1c5a0ec00bbf9b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/link/link.md",
      "before": null,
      "after": "bb144761f067ceaa0b064b443a843a2988a0d72922410ec49433d0d3e7e4941f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/list/list.md",
      "before": null,
      "after": "febff04decea6e19ec729af06bf05263043f8f62d75e754a7e90936d5297d106"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/mark/mark.md",
      "before": null,
      "after": "322b31a8a86d43645aa4760fc8b7282a8db9ca09c64557cb22a63830655f4cdd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/menu/icon-values.txt",
      "before": null,
      "after": "2046dba20251dc622d0a7ef642760ffd1ea6494b7c464f3f663d99f0aca1e606"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/menu/menu.md",
      "before": null,
      "after": "ee4bf01c26847b94eef58fdb9e89e05cbd89c9802ae90bdeb774bf15df1edbf6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/message/message.md",
      "before": null,
      "after": "9b114c3ce35bc58734e2802b97c0e34e77a08e08330b41591a2b3d70c90a48f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/modal/modal.md",
      "before": null,
      "after": "ae420f7e2e94ba51c4a9643b71109f6f676560c9f1586efc4a118f0cbce7a773"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/number-input/number-input.md",
      "before": null,
      "after": "d2efda04398e0537a0218c786510f3b86e1d8edf68f79bae5b6b48788c47909a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/overflow/overflow.md",
      "before": null,
      "after": "588328268737fde9e579115d5a6ba1f80324f5fb02ce89250d8d7abb3e242a95"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/pagination/pagination.md",
      "before": null,
      "after": "cce51bbfcecb7ab20340ea15276e2055e387e7f4b0a06a36dcfcb4ab7c29ce44"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/panel/panel.md",
      "before": null,
      "after": "33f0c324c0bd756841343add362b45bb2d290318231dac9055bf186bf2f69cf0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/popover/popover.md",
      "before": null,
      "after": "bd9aa58bec26a5bccd43d746cdb11ddb3ca28bff92f1d835d1e1230a86d27fcc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/popup/popup.md",
      "before": null,
      "after": "6cd79863bab7fa41a261910184a167b123b1cabe78a5194a179bcde9761d380c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/progress-bar/progress-bar.md",
      "before": null,
      "after": "71ae2f034a2c6d005c0772aefec341c6d4a036cbacc006a90b01d4cd68677522"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/radio/radio.md",
      "before": null,
      "after": "9898091f5ff94c2cb2369e64eab6aca6c0395f74f423c0d9430382a0e5d961ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/rating/rating.md",
      "before": null,
      "after": "002c83d9ef9c41b3f3aa6949d32736b588b0917259695b626f2b4492d31059b7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/required/required.md",
      "before": null,
      "after": "483553e5126004dde9cbaa0f43bbbe5884d24f55a31867253882b9dbfc17e4bf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/scrollable-shadow/scrollable-shadow.md",
      "before": null,
      "after": "ab77058487ac2c2a6240cabfc8721972757cdc3c5d36e7ebe596dd6309aa2408"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/search-input/search-input.md",
      "before": null,
      "after": "78c93732d3b11782cfc6b6e14a32bcd36b1f742344be964f94521055d5a92c71"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/selection-group/selection-group.md",
      "before": null,
      "after": "45e6cffc84f75cdfe4e986bd335388d46ff9fa01a1d43161e256baf153d8139b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/shortcut/shortcut.md",
      "before": null,
      "after": "932a00417d0dc5d954cadaf18a5260192e9d79c87db06714a2005a9c03458a32"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/skeleton/skeleton.md",
      "before": null,
      "after": "d1ff76ffae94a920b87ad9a28f1ff221fa12469626a66b1f57ce6d00038829be"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/slider/slider.md",
      "before": null,
      "after": "ae1d69ffefdff79a4c2f871001bae320cd3094d76fed4c60f8faa67c379ac779"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/spinner/spinner.md",
      "before": null,
      "after": "a20304df59d2bbd2871bb20df90d17ac88a1cba3e20fa3f586bf5cfac9aff0f5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/stepper/stepper.md",
      "before": null,
      "after": "cb87e19f7b3ccaadda464d4daaa20a076e4a3639a3c99f72c227074656ab2189"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/tab/tab.md",
      "before": null,
      "after": "b1c18d6ab12448208131f30d90876cb479ff9b575fe5cc5d7053692709b010b4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/table/table.md",
      "before": null,
      "after": "a11f7131804484aacec8952ffc72e45bb8ff494a545d9aa1bfbec7f813abcdb9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/tag/tag.md",
      "before": null,
      "after": "180ce33708018dbb9f9752da1a51ed79f1c8bab7f10f515e84a7ff6780e2fe81"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/text-input/text-input.md",
      "before": null,
      "after": "568690bba31abf2ffcecce739529098ecfda4d7d1a78c7577614e1d63f5c32ef"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/textarea/textarea.md",
      "before": null,
      "after": "ca2e5cdad3f7cd165412dfeb29d8b388b127ac3d9669a0c4927ccbe8efe5f57d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/toggle/toggle.md",
      "before": null,
      "after": "0e95a68a75f942488e3faa5e3eee7f145ef31ae2c0367910e3180d955f13b2b2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/tooltip/tooltip.md",
      "before": null,
      "after": "25427e0339da8f76e0a6e949cc0945682a280cfd596d12db8e61cd4b2be37758"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/core/typography/typography.md",
      "before": null,
      "after": "eb8a235ebc66ea46247f9554123a89d58dff34cd26b12e44bb76f9067d298f72"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/inventory/inventory.md",
      "before": null,
      "after": "9bcede62580fd1ee85de2cc3395df35731a545a4f83654d27a55778d915bc144"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/accordion-stateful/accordion-stateful.md",
      "before": null,
      "after": "77e21e944f1c93b41e36999bf9c3a682ba589a8b9d9ba52f77e39c5301d71896"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/ai-disclaimer/ai-disclaimer.md",
      "before": null,
      "after": "62b2266847940522e8e121695b2760f384eb2d9bcdbfc6b58a293a575a9f85cf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/badge-container/badge-container.md",
      "before": null,
      "after": "51293627378662b2aa758ad00f95a794f4a16d5c5c4ce1b480475d55e5d4b0a0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/card/card.md",
      "before": null,
      "after": "ee1ae8e8964a7d4a74cab3a76f270dfd210474f2c080d51d463f04ae5e89bd67"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/copy-to-clipboard/copy-to-clipboard.md",
      "before": null,
      "after": "48ef39c3d36f8faf8cd83ca3dd7c7d687a2a6443311025fef12940492c8195d0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/datepicker/datepicker.md",
      "before": null,
      "after": "d60a8f2afed2bf0faef6bdb60c21a66e2a7b26e400fc359d945b27f5e80342ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/daterangepicker/daterangepicker.md",
      "before": null,
      "after": "d21c43a164d242388cf4c387c68affd0ca2d900e87f38e390b1bd248186e643d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/dismissible-modal/dismissible-modal.md",
      "before": null,
      "after": "6d4e1762959993ae11280f517272d951f022df16d699208874b3fbdde35852cd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/dismissible-tag/dismissible-tag.md",
      "before": null,
      "after": "1bb819251cf4db8ef2b637d6099f89bfaadacbea2aa7a6ce1b65a78eccd97a4b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/drag-and-drop/drag-and-drop.md",
      "before": null,
      "after": "e805de3d49442de73fd9a4621edda37873a7e5ca207f30bd031028c18ab9d1ff"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/dropdown/dropdown.md",
      "before": null,
      "after": "89890f72b75258e604ddced87c940c3d353452f2c34d3ae1fd6f4d9bbd575193"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/empty-widget/empty-widget.md",
      "before": null,
      "after": "2562cc138468a2fce36178d3e9245015600544b596d78852c9d18fdb58c4e01c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/expandable-table/expandable-table.md",
      "before": null,
      "after": "191528365671b7db0ab32efc18ef159090b7ff3872994e89195492cd8b230090"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/footnote/footnote.md",
      "before": null,
      "after": "fd31ab268c502fb4ef335541c3e4bd4ff8f2c7894030efea93f9ee7fa06e7436"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/form-check/form-check.md",
      "before": null,
      "after": "b1503379d83bcd2234acf4f34cae166d196693a51eb25e7cce4dffd8891ccfe6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/form-control/form-control.md",
      "before": null,
      "after": "74501e20e235888bdb4f47a49f4f80b3a49b1b1db78bc92cdc08abda8158e41a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/header/header.md",
      "before": null,
      "after": "4ca93f32cc6e92371b98e3812dcee2d06abfe26d3d188f9a33518f685459c3fd"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/header/icon-values.txt",
      "before": null,
      "after": "91aef64c1675322bb8681f87a128c8e07d781e428802074668b3417d5d471b7c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/labeled-icon/iconname-values.txt",
      "before": null,
      "after": "91aef64c1675322bb8681f87a128c8e07d781e428802074668b3417d5d471b7c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/labeled-icon/labeled-icon.md",
      "before": null,
      "after": "4f531ef2424751c372dc6402f5c8166c7a7224d0cce148669c9f4b1626a040c3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/list/iconname-values.txt",
      "before": null,
      "after": "91aef64c1675322bb8681f87a128c8e07d781e428802074668b3417d5d471b7c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/list/list.md",
      "before": null,
      "after": "0953b3a3c00cdd68aefb643d47bab1f6359fc6dc8bf453f050626c6a630b255b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/media/media.md",
      "before": null,
      "after": "f91bee1d27e4c9f3d4e7dead46abb84fe7ac042c6735e16042f7af8343322661"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/message/message.md",
      "before": null,
      "after": "5c37b6e9fc5b4f56f2da31014633d14dec4d37db1715635bce842c433c1cf5ac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/multi-dropdown/multi-dropdown.md",
      "before": null,
      "after": "15fc96efae831b69afb394ed1c619c93ad97ca4ec5e61e536319b208a0e3cae2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/nav/nav.md",
      "before": null,
      "after": "824b01acea8d126b558a55960e646e5cb605f3c4f30b26f7bc0e78cbe4912c97"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/overflow-scroll/overflow-scroll.md",
      "before": null,
      "after": "966b061d716c9c948cf78fa4dec63da3018b798c594dbc24e0dbbd36fa0b5b89"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/pagination/pagination.md",
      "before": null,
      "after": "f2111940e3ee115dd87533f63659c9d2d6b1fb8147cc6297b7a22d6e61638e19"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/search-input/search-input.md",
      "before": null,
      "after": "714aacfb5a9222e56a04df6e3d12e65124f05871aacfddcb3d41057ea45e2798"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/stateful-button/stateful-button.md",
      "before": null,
      "after": "616adadcef65c69f8bf4d0f012d044b17d090f063a0287f2b6bbbfcb82b298d6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/stateful-popup/stateful-popup.md",
      "before": null,
      "after": "a99c59a7a8e2357a09eb285e421b06f78fbf9664096293b661d29a6c0435ba4f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/table/table.md",
      "before": null,
      "after": "0da76eb4da0a3fb859478701c7fa9072c41c0fb8d3f1824ddd1da1a378336f26"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/timeline/timeline.md",
      "before": null,
      "after": "7fc218d3848c53c354c0dc0b98309d40b88dc7ab9ed64d36540a827ea76890ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/timepicker/timepicker.md",
      "before": null,
      "after": "24e680d0abe4dabfe3b25a3359d3238e027b36ee14cc7d8c7d951d7a1667925a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/toaster/toaster.md",
      "before": null,
      "after": "9d8bea7f3b182ffdb1e3fa93150d6e989a6d9d9269aad8dada020745e30ab048"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/toolbar/iconname-values.txt",
      "before": null,
      "after": "91aef64c1675322bb8681f87a128c8e07d781e428802074668b3417d5d471b7c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/toolbar/toolbar.md",
      "before": null,
      "after": "6293083983f3e6044d31adcf7da6b8e59b3af20cdea6007e4a696bf483e14cf1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/tooltip/tooltip.md",
      "before": null,
      "after": "a05f0e3494da41b6aef1dfb2595fb4ac75bd2066a305dad8843d8dedd97b3c34"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/components/marketplace/transcription-bubble/transcription-bubble.md",
      "before": null,
      "after": "31a1bbdee3e734437a10e3fd50cfdee0daddd77550f8e89b64026d09400df6a8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/accessibility/audit/audit.md",
      "before": null,
      "after": "73fd80c81b12235520214408aee5adbcd82523255820aa78c017c0623deea211"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/accessibility/overview/overview.md",
      "before": null,
      "after": "ab3a8f28ccc53a5c7aaef39786570991b7aa18e752dfb4adabe6893ba473de59"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/accessibility/report/report.md",
      "before": null,
      "after": "1845183c50cbfd9e8ee86059409377a184d9b03b1ec5844f5bcb7c22703752cb"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/accessibility/resources/resources.md",
      "before": null,
      "after": "ab9e41360e88d9427b94d1ea7ee7986df95eff07357d4e04d6efad56372dcf05"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/accessibility/training/training.md",
      "before": null,
      "after": "3d5d96441ed59cfde659b65e466d71f7a0ba24a1613eb7a9050b2548fc02d10d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/accessibility/web-accessibility/web-accessibility.md",
      "before": null,
      "after": "4bc3a750d67816c38b8ea1f61a1dc43de61f9ec92beb476af09edbdf8965d0bf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-grammar-and-mechanics/content-grammar-and-mechanics.md",
      "before": null,
      "after": "bace9a4feeebff4288b6c44d3e6f653db19eb2bf793762ea591326867e75bea5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-localization-portuguese/content-localization-portuguese.md",
      "before": null,
      "after": "9313b735572e43c3dd239f3ca9089c3a9fbd2ac67a0cb715975e092a64c657ea"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-principles/content-principles.md",
      "before": null,
      "after": "adcdcece5fb23e8ac918505599555ab04f4bf1bb3b115043d064e057a7806e9b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-voice-and-tone/content-voice-and-tone.md",
      "before": null,
      "after": "464d7f9eb92be95256f304818d766ca0282611c78bf92398b67bda80b0a960fe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-word-choice-consistent-words/content-word-choice-consistent-words.md",
      "before": null,
      "after": "c76f77d0640f5bfec890aecba6188ee39732dd1f766673cbb06e6976b56d73a1"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-word-choice-inclusive-language/content-word-choice-inclusive-language.md",
      "before": null,
      "after": "7916a5accfbfb1cf9912c85fee07ceba1f766b3b6c2c10368722ed81a46540da"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content-word-choice-vocabulary/content-word-choice-vocabulary.md",
      "before": null,
      "after": "f97f43fe43143ea25970ecce9a17971044f39768258b4cc1640f779199a8b7e6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/content/content/content.md",
      "before": null,
      "after": "b60f54dc027318b2df29734d44fdda838d34e1f036358231da98918045509dd7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/layout/layout.md",
      "before": null,
      "after": "a6f6d4c614d0c717233734d2c42860e03d269c4b4645b635b7facd6fa04fc7c9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/rtl/rtl.md",
      "before": null,
      "after": "c8bcdbb5e1129dabbb3c3a659485e254623127abd370b01a060135914ea567ca"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/border/border.md",
      "before": null,
      "after": "b4c97ab5fccd834b3adc96240e1910e44134242ccbf14b4200b46eea64387825"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/color/color.md",
      "before": null,
      "after": "f34845504288aaa8d878f411c41bb5e261b9f4894ed645516cc9bbcdd1866952"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/flags/flags.md",
      "before": null,
      "after": "a67d50926eccc0ab6f5e94390b56e2cc2f3906a147ebcb372dac17d79ce2657a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/grid/grid.md",
      "before": null,
      "after": "cbf5a3f0a1c3b1f4113cf2ab931c90539e3d087a1f2c16c19e71f4e70997aa7f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/iconography/iconography.md",
      "before": null,
      "after": "7429f3f650af7ad86b2ad5ff3b0ff01c12dcc7e7d08c77cf1077176276ca923d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/illustrations/illustrations.md",
      "before": null,
      "after": "dcdcc150900c8b1df0878ad6dc97986e5b87e23223cf1e7f9c385f5b069528b7"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/logos/logos.md",
      "before": null,
      "after": "48fa508b942b6a9afd6e6b97ae16871b1575ace726c6687e082c426b3ff3d349"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/opacity/opacity.md",
      "before": null,
      "after": "36092eb4b911996c75c9d83c2c870f0ba3990b092f5007fa9607ba76960b1bd4"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/overview/overview.md",
      "before": null,
      "after": "18a3eb35d5dbc15748f4839439d8708e0e796ef0899b83bdacd7aff92acc2b29"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/shadow/shadow.md",
      "before": null,
      "after": "a0cd368e980e9ac2171e87aef356a5bbeee065ddafb04353d45096f6ca9ac83c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/spacing/spacing.md",
      "before": null,
      "after": "d9b3c57f4d162bfca635df49d1d29cbcc912714bba911fb6940dc1ceda47a3d5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/tokens/typography/typography.md",
      "before": null,
      "after": "d1c92717c2bf196f311929ea152ece02d9c8f8c9ec469996a15b481a5228f20a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/units/units.md",
      "before": null,
      "after": "b42f57ceb1c56464ba1b4d680174e0f91a053519d8142dc8c96ba54f6bc59f1a"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/foundations/viewports/viewports.md",
      "before": null,
      "after": "9d107f1ad95f7574028873bee3d631b63bea8c429a274617e09c8583f29ce7a6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/get-help/support/support.md",
      "before": null,
      "after": "3c9104e756ca50e35cea153b680e9468aa9c3f0057ed62bdd3c66f146b095a1f"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/get-started/build-with-ai/build-with-ai.md",
      "before": null,
      "after": "7fd6434b33f7e1b2001e1e0e72634fc8eacdd5806fe4550393676fc8d84c8005"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/get-started/develop/develop.md",
      "before": null,
      "after": "7f9eef4420bbb0ab3607678fdb3e41a5310eef261c11e353c96c33cefb0bdace"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/get-started/intro/intro.md",
      "before": null,
      "after": "1d6352e64e0eefeb607ba37d68dea4f8d71cb54925a4169ad9e309296586570c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/hooks/core/outside-click-hook/outside-click-hook.md",
      "before": null,
      "after": "19487c4130d63e28beafb04961f199157f49d19640531cd92d504773b44770bc"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/hooks/core/position-hook/position-hook.md",
      "before": null,
      "after": "12b76d9e8f85e29ba2ebda7825f53782bdab7c70e15a2bc261f2cd90e7539a65"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/hooks/core/resize-hook/resize-hook.md",
      "before": null,
      "after": "bfec1ea9f9a082afca51c3c392309daa955bcd9df3882736b8ab0bfb6a87592c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/hooks/core/responsive-value-hook/responsive-value-hook.md",
      "before": null,
      "after": "5481f0dadb785d2e754d0597638b19f9b24920f4ded83d0fff3be3722656e904"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/layout-templates/detail-page/detail-page.md",
      "before": null,
      "after": "968d95789d72f18752d1be1b03f7231dec4ca7e4c2facff8faf33a3f023cb592"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/layout-templates/form-page/form-page.md",
      "before": null,
      "after": "d4bd912b192a55b7b2eeb0cead351211033060a5e78211716820f4a6594daab8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/layout-templates/list-view/list-view.md",
      "before": null,
      "after": "457492bb6be4e182a852d174e28698ed43a2416dd3174f075be8d781a1cea0fe"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/layout-templates/most-used-templates/most-used-templates.md",
      "before": null,
      "after": "7b21eab88acbca611c76206a1d562e8f83d0464b056e569c0f133de85b9ecde0"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/actions/actions.md",
      "before": null,
      "after": "fc878584e69a7a4633f3c15e85843bb689dda76b40879cc2a00c14adc81c3807"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/bulk-actions/bulk-actions.md",
      "before": null,
      "after": "fcf63332ff8b46c448bd96d36754d7a8ebf96491a6e323c16b5bbaf035735f2b"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/empty-states-and-loading/empty-states-and-loading.md",
      "before": null,
      "after": "f48e2acd907880a20ff513e9c8f54a0e0b1c7b5ed309cc33ba7cefeaea8d83cf"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/forms-and-validation/forms-and-validation.md",
      "before": null,
      "after": "7abc88e0021482dcca78c23df23ae1608626ddc42575506a841a6d3c48c11361"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/onboarding-and-wizards/onboarding-and-wizards.md",
      "before": null,
      "after": "caa31098e965d02dabf26345ade421c75da69fb5e75f708a45d8e3d7fdbe65e5"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/search-filtering-and-sorting/search-filtering-and-sorting.md",
      "before": null,
      "after": "0685372b54d9c47a6b1fe5bfb29c16378a9afc3ffc846c032f79cc7d9e0eb8c8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/patterns/timezone-selector/timezone-selector.md",
      "before": null,
      "after": "349e1b4894bdd6cda0ca8717fa2ac677f9ed535e9da016f92500975a4e85e7af"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/providers/core/portal-provider/portal-provider.md",
      "before": null,
      "after": "c86ea9e996cfbe460148dc26c373832b52a78ed92f0b008f3bc9ecfd8b0cc8f2"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/providers/core/surface-provider/surface-provider.md",
      "before": null,
      "after": "ac874b3e213d306463925a8bc889c792c37de53651c454ff5e4f6ddb7c1e6909"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/providers/core/theme-provider/theme-provider.md",
      "before": null,
      "after": "6a266c2e43d2474de37eae3be9bb728ec62676d8aa18d6e2a1e19b5aa0bb6771"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/providers/core/viewport-provider/viewport-provider.md",
      "before": null,
      "after": "0068d35901a14934f9b71f0e147a17d35cd1817559be33034103927d96243de6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/registry.json",
      "before": null,
      "after": "312b33f7744a631d2c818773627af7df84adf9722d21039ea11a2c7e67b8b8ce"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/utils/marketplace/datepicker-utils/datepicker-utils.md",
      "before": null,
      "after": "e88e4728ab7a8a51bb0437585bf61cabb16083ac2a821e2fb89d1119590533b3"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/utils/marketplace/dropdown-utils/dropdown-utils.md",
      "before": null,
      "after": "8e7fb8dc2415f1f19a621167cc31c23afcf41d93d0fa3bca98246ffac1cef591"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/app-loading/app-loading.md",
      "before": null,
      "after": "f570a80981a1aaa3af95340e29fe2b3415e3aaffb6c943e55adc44ef889ad3e9"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/app-requests/app-requests.md",
      "before": null,
      "after": "ff65cee495a573d8b246e1a258cf011b8e51faaf6ae9b67ebba6980feefe4787"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/contributions/contributions.md",
      "before": null,
      "after": "192f1ce21f140eb257186d881e700e5a1ba975a541227ddad713e5eddc031a3c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/desktop-app/desktop-app.md",
      "before": null,
      "after": "197c2b0a1afa17712d590ef3b049a62b5efcd3597b753042b8663d1594a6108d"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/dock-and-drawer/dock-and-drawer.md",
      "before": null,
      "after": "9bd40148398d9675eeb940bd8fd3aaca044dd0893168ecc44489ada80f4bf5f6"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/messages/messages.md",
      "before": null,
      "after": "3f9663ef5736734a20eb6b54065d532a0a897a0c7716fe87520de8e0af4dc4c8"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/overview/overview.md",
      "before": null,
      "after": "33df52045fc1992e14a060ff977cfa97efd9d9da6d5f3e09479200e3c7405a15"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/secondary-area/secondary-area.md",
      "before": null,
      "after": "abb70139e386107ec19f6778a3b55e3d0dec924be733a2c8e8d60bb10988c934"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/space-and-viewports/space-and-viewports.md",
      "before": null,
      "after": "68e5b3b3f2133b8aed9f02887c75e7c8e265f5046be8fd1c8f811d1e337a548c"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/content/workspace/title-bar/title-bar.md",
      "before": null,
      "after": "9564bd24350cd330fe43324ff876a0a31b706956ed55f92ab4ec776eba7bab84"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-reference/source.json",
      "before": null,
      "after": "83fab14e9d8a63b3cc8b143d9a84ef2581b19b54148f2bef42d32217fbaa1ce7"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "c8a96b8f8ee6cf879c046f663925d36c5c0e9ad90dc9d5d2a2134e24fbe96fbb",
      "after": "7b58bc3492c0112948cf040995682be116ff9d96dcf064149ff5968de44944fd"
    },
    {
      "path": "scripts/stage-dsh-runtime.mjs",
      "before": "0920c3a65f0926e554b1d4f80426e667edef70a0e872c74a6370bf9ae9f40dc5",
      "after": "aac1607f516bc03c935ffdfe20c7117fa6c74a5fc6b5a7abf93c52fbb6229076"
    }
  ]
}
```

Completed-At: 2026-11-14T09:48:15.142802+00:00

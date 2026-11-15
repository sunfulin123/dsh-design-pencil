# Separate development and final POC review, support frame-aware native browser actions and capture reuse, preserve evidence history, sync Skills, templates and SS.

Record-Version: 2
Task-ID: 5a57ac5e-6a4d-47b7-ad9a-7102de78a7cc
Base-Ref: cfe576f5609071072aab0464cc95ce94a3693374
Started-At: 2026-11-15T15:19:21.489718+00:00
Type: feature
Status: complete

## Context

Separate development and final POC review, support frame-aware native browser actions and capture reuse, preserve evidence history, sync Skills, templates and SS.

## Changes

- Added one runtime-owned POC entry point with separate development and final output. Development reads an existing managed server, selects representative sessions and never builds or overwrites official evidence. Final builds static delivery once and reuses one browser capture for interactions, images and DOM findings.
- Added explicit same-origin iframe paths, Chromium-native pointer/keyboard input, focus/value assertions and cropped screenshots. Full viewport evidence remains mandatory; font/mask readiness prevents capturing incomplete chrome. Selection-field geometry checks no longer mistake compact menu buttons or hidden glyphs for malformed field chevrons.
- Frozen evidence verifies complete source/artifact inventory and PNG bytes/dimensions/hashes. Prior ledgers and images are archived; new final runs mark current evidence pending until recapture succeeds. Development/history/pending reports cannot satisfy handoff, including through the packaged runtime validator.
- Authored-source lint excludes compiled delivery and checksum-verified shell copies while full artifact fingerprints retain them. Editable Extensions are still inspected.
- Generated Cobalt projects use the pinned official React Vite plugin for Fast Refresh, stable lazy business routes and deferred chart chunks. Copied Dialog takes initial focus and handles immediate Escape before the native transition finishes, preserving child popup dismissal.
- Updated Skills, AI references, owner architecture/commands, Cobalt documentation and SS packaging regression contracts. Refreshed the existing ordinary HTML example and upgraded the maintainer-owned Workspace preview to Vite on the same port.

## Validation

- Passed: `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-review-workflow.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs` (20 tests). Initial failures reproduced lost frame/crop metadata, delivery being linted and missing dev/final entry point; the corrected implementation passed. The delayed-icon readiness regression and the ordinary-wrapper/business-entry final capture regression passed.
- Passed: Cobalt `docs:build` (type checks, demos, 279 Astro pages) and `test:unit` (11). Browser suite: 40 passed, 8 opt-in skipped, 3 page-load timeouts; each timed-out case passed when rerun individually without source edits. Dedicated popup/calendar/Dialog and narrow/dark regressions passed.
- Passed: generated SS project browser checks for shell geometry/navigation, controls, lazy list/chart/call routes and Fast Refresh; two URL-driven titlebar/notification checks and the packaged ordinary HTML browser check passed separately. No model provider or live user browser was used.
- Measured on disposable before/after copies: unique Users initial JS payload 2,350,941 to 1,539,168 bytes; chart code loaded on Insights only. One Fast Refresh sample was 187ms with component state preserved and delivery untouched. Build samples were cache-sensitive and do not establish a speed ratio.
- Passed: real dev review performed 3 cases, 0 builds and 1 browser. Packaged SS final review performed 1 build and 1 browser, with 5 images and captured DOM; pending manual review remained a deliberate gate, not a reported visual pass. Source/image mutation, missing full viewports, non-final reuse and interrupted-final invalidation are covered by regression tests.
- Passed: SS packaged resource/compiled-prompt tests (3), handoff compatibility tests (2), plugin typecheck/build, focused ESLint with ignored files explicitly included, and documentation checks. Runtime staging validates copied resource hashes; generated runtime output stays ignored in SS.
- Passed: read-only vet found no issues after the main units; direct API mode lacked credentials, so the available authenticated agentic runner was used. Source line-cap check passed with unchanged 231-entry legacy baseline.
- Passed: `bash tools/check-maintenance.sh --base cfe576f5609071072aab0464cc95ce94a3693374 --task 5a57ac5e-6a4d-47b7-ad9a-7102de78a7cc --lint-js`; warnings remain visible and non-blocking. Read-only review applied the source review rules and SS baseline/security/architecture/contract perspectives to the explicit outgoing docs/tests/resources scope, with no blocking findings. Electron/UI-race reviewers were not applicable because no SS Client, preload or process implementation changed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Architecture and Commands now route the dev/final workflow; existing maintenance, source-cap and honest evidence rules remain applicable.",
      "sha256": "b0e26a36eb6006764ae1ef41b3c78a23d229d528234218f5aa27823d71582cde"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "Rechecked the completed 20-test workflow suite, including wrapper provenance and delayed resources; documented iteration and final review behavior remains accurate.",
      "sha256": "43e99d4bdf1e55d29025c3fbda5b91702a52f90925ff18fadae0240af3834c97"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Final ordinary-wrapper regression verifies business captures and full wrapper source provenance; no contract change after the reviewed implementation.",
      "sha256": "e6c15b9136ebef742301becd95559bfd7d71172506edc36800bb9158d02b5411"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Static handoff and the existing tool/transport schema remain unchanged. This updates locally staged runtime resources; a future versioned release is still required for distribution through SS’s published runtime pin.
- The prototype toolchain is validated with deterministic local data, not a live model-authored SS session. Formal trial ledgers intentionally keep manual classifications pending; passing tooling tests does not fabricate business acceptance or accessibility certification.
- Chromium frame actions are same-origin only. Official fonts/SVGs still use the upstream CDN; missing visible resources fail capture. Source changes require a new final checkpoint, never automatic promotion of historical manual passes.
- Keep the Workspace and ordinary HTML preview servers available for user inspection; dispose only the extra owned test servers. Signed Design publication and an SS PR are explicitly authorized by the latest user instruction.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "47e1e3bdf352e9577ed54a9b1c3f573ea49f1c68992d819d573549ace2383bed",
      "after": "7c8acd29156336718e52be26518648b444b641f0ad113f7df1487557e958bf8c"
    },
    {
      "path": "COMMANDS.md",
      "before": "f30f51e300674d7aa5f62af5210442135d0dbb29215d7ca75f4c6c06902e6f34",
      "after": "fc439fbaddb4d86839d98b4d531b7bd35ad6b20744db148d4fa96f46fbe8da08"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "30c2f054ae484ae07a97a4e29d1dac027d9d11060897681bab259367048d23ab",
      "after": "f9d5e0c58ff49c9c5032dad4e367e364059ab02b2966f86b446b49362042171c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review.md",
      "before": "9ac0daf119efc4dedd55f38e89dff10205e773dca7c196ceb2376a3ab584a031",
      "after": "e15f080c88d4e06d174ce217cc70e2b32d661e79750c437ac23818a6f3124e6d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": null,
      "after": "aaeaeb0e90b86aa2058ab74c0afed35f8bcc5480e8fafb4f5526e858a3d8161e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-actions.mjs",
      "before": null,
      "after": "1433ae1a1abd96041355621e4a77754008e130c11ff21afc4b12c5536378e66f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-runner.mjs",
      "before": "af2780eea3fdd25bd48ffb6238f093a2856c7b1a73fc8415f9e44d4c37f00ed3",
      "after": "39d4b17d1409f272de9f62d287230d22477ce8ed7acf8fe7d05bafb65148dc0f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-capture-plan.mjs",
      "before": null,
      "after": "f0e9d3ac9d4f6a7936f9875e6f30e7c7e0e5b91f268d899960d63f9ba6898d0a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-preview-server.mjs",
      "before": null,
      "after": "079733e53a3c0a89f17e074970fd9a634b3de62754efe246192f5313d6372ac3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-review-evidence.mjs",
      "before": null,
      "after": "bcceaa942ff1ebdba2dffe7a8d57a1312794fd9b0a2ee260b9826a7cedf051b3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-source-inventory.mjs",
      "before": null,
      "after": "51cae6bd081f6ff4f17b4311c4127c8a7686470cfb40f697e625949ccd35bb2e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-surface-inspection.mjs",
      "before": null,
      "after": "7d47e1cf7316f79397aa200ebfc00c9575b76adf54a75ad8395680b7f9b85139"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/review-poc.mjs",
      "before": null,
      "after": "d3c9fab6aba15891356744eee98e59fe321436b35db846b0d18bb08c7d9800fc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-browser.mjs",
      "before": "02dc9d0784f145d4b6e6c1a833c9745f034428662dc2b485d7eba2df1e5c981f",
      "after": "7ad4273f8db26145c518c3c98574c960f24e0152a804036e6d18ddd4c9cf8a1e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs",
      "before": "3354d25276378bc2890227e286fc8deb734b61b7b00117ae35e992f4aa421180",
      "after": "e3158b307af38cf7198bb93668de601d05032159d09416c1ab6e436510f6c225"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-source.mjs",
      "before": "6adefb68938454b4bab1fef58b4bdd766d49c52adba0292ff1e7f3b4027f3453",
      "after": "2d31423511580fee7599fa49bf6d87ec321c4dc4557001aba3eb339c50cd4f94"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": "f0f07ac2735bdf4c54f5f9e038f6a51fb12dce0cd406f4b63f528cca6a7f1f1c",
      "after": "79874bdb037c93fff38238df4fa6c51e72941e1753943cee7807717c3779cbdd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "40b120742f7dab06f5d236c8e9e89410025941af68c73055b04784a3cf6a1427",
      "after": "f0d75e139d52389406f8c056a0eb991f4b12d1ea55bb87f0a86a045ff8e4d2c4"
    },
    {
      "path": "docs/kb/product.md",
      "before": "38d476629d7cea169659b70277b3d7bdddaa12abc87dafc8f2fc59fe53fd685b",
      "after": "43e99d4bdf1e55d29025c3fbda5b91702a52f90925ff18fadae0240af3834c97"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "da6f5e5d3f6cb22fe5ef1574920ab33f1bed4e125a08e46a8b883bd8e1a48789",
      "after": "e6c15b9136ebef742301becd95559bfd7d71172506edc36800bb9158d02b5411"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "aad6813429f9e7c63fad9ff072c84682bb00fa9a780f91a5de3c804920265730",
      "after": "b0e26a36eb6006764ae1ef41b3c78a23d229d528234218f5aa27823d71582cde"
    },
    {
      "path": "packages/bun.lock",
      "before": "afb1aa67c917a6424ec7dbc7b7ec392ce7fd14ed72c83c89655ac4382020acbf",
      "after": "33cc3aaae3b8df0a7e42e3fce072992de210f683fca8cf3291adcceaa2ad37f0"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "23e8c724e200349ee0972260ce8a3088f723f86d39fab802333c699ee61b8fbd",
      "after": "39a4f467d102ae68dcc9b200812bcfbc66e543a5421444e9f40d9ab1255b01b0"
    },
    {
      "path": "packages/dsh-node-runtime/poc-evidence-validator.mjs",
      "before": "9c33e8cfe2c6ee68098e2251af4945f3faa015d5aa978a397d076a816bde8d81",
      "after": "670ef4888077dca2a8e56c8bfc41ddde0b8ed619e0dc787286e2f48132670f4a"
    },
    {
      "path": "packages/dsh-node-runtime/poc-review-workflow.test.mjs",
      "before": null,
      "after": "6888a4d7073d871e052f9b562898adb01db421de908d6e1e3af4e7fee128a8bb"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "30c2f054ae484ae07a97a4e29d1dac027d9d11060897681bab259367048d23ab",
      "after": "f9d5e0c58ff49c9c5032dad4e367e364059ab02b2966f86b446b49362042171c"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "4ce2203cbc5aa93cdbdbd3cb2ee2eb9767ab80c4ee6487f087c3ecd0269e6d77",
      "after": "2e2695a720ce3106b2881514f139ca743cf6df13505c27d4ffb256aba0a39526"
    },
    {
      "path": "packages/talkdesk-cobalt/components/extensions/src/dialog/dialog.tsx",
      "before": "25aa3f8551f7ff2b823b3536fc1124a28ac8948250f95dadf845f44b9b49f3e1",
      "after": "853ef3df233c1c0144b56ad7b4f778c3bd552b289366e7ddaf693acf9d5731c1"
    },
    {
      "path": "packages/talkdesk-cobalt/content/components/extensions/dialog.mdx",
      "before": "7e2c6f2f4c3bdac367ae890f5bcc9485c8b3322f64fdf7d6f66a038c40588e5a",
      "after": "c22a41fe5c70ef0eaca71ea9e5ee61dd1b7d36d929e62f04d1df4d1e7113f31b"
    },
    {
      "path": "packages/talkdesk-cobalt/package.json",
      "before": "f091a62a77209c9862ddb30efcb7be55428adcb159f1c32a7893fe964fcd025b",
      "after": "912c058164e11a6e82988c40939f5f9604f31a24f9ab32e849fb2ca0a5b6d125"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "0b7047dd2e1084d4ecf3bd738478d7bb0a895cfa2f1f8aed74b65a1687b3985d",
      "after": "016cab09a784c3173c2af0634d0350fb70fe0a6efe89300e8ba1ecd697d12513"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/app.tsx",
      "before": "8ae97889b315f22b02adb47254c9b06dac7e6d9111e4db416424c1f8e684990c",
      "after": "e5371b421e92d3427170b7bed6ffdb9d63a133bdbdbb43cd1e179a49e0b297ac"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/vite.config.ts",
      "before": "6a52d75f727cf04fa2c55e7c2196abab033c73ecc288937ebc3e1ce82778331f",
      "after": "a4dddc7a78b286f3b1a11e4aed72164015a549c3967b3e782264d0ae2972283c"
    },
    {
      "path": "packages/talkdesk-cobalt/test/list-dialogs-browser.test.mjs",
      "before": "34d3d4d3d1534fd7d4cc0b3d725cb9c8f11a8a4722ce7c960a0427fa2f86b342",
      "after": "7ca21cf570b0aee36f9242cc04d273364505fd8a85d5091271daada9fb70a8d6"
    },
    {
      "path": "packages/talkdesk-cobalt/test/prototype-loading-browser.test.mjs",
      "before": null,
      "after": "234c1800df96a2b604d4e2c23aca3b9f278692fa1b1e93a7a155317535174c68"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "d7bb68fe180efa5500a7e2f3c3c0a954a1f9840c8066be48fb48254853e3e5a3",
      "after": "239e1d5bda494fea70ec312c91b852fce4079430f0d849d47404ff326dc36d0c"
    }
  ]
}
```

Completed-At: 2026-11-15T16:32:10.120344+00:00

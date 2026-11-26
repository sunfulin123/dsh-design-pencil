# R3: split the HTML POC Skill's mandatory references into section files with stage summaries, slim SKILL.md, and enforce a forced-read budget of 24 KB (ordinary HTML) and 32 KB (Cobalt)

Record-Version: 2
Task-ID: 81eb519c-78b1-4711-a0cf-8aaeed6b9508
Base-Ref: 8a02e4e43ea1db98a2a9e06b35aa13e84a94ea36
Started-At: 2026-11-26T09:30:51.392805+00:00
Type: feature
Status: complete

## Context

On the normal path the HTML POC Skill made the model read SKILL.md (about 19 KB) plus the full judgement, surface-mode, POC review and HTML review or Cobalt Workspace guides: roughly 60 KB for ordinary HTML and 70 KB for Cobalt, before any task content.

## Changes

- `poc-review.md`, `html-review.md` and `packages/talkdesk-cobalt/skill/references/cobalt-workspace.md` become index files; each `## ` section moves unchanged into a numbered file in a folder of the same name, with relative links adjusted. Each folder gains `summary.md`, a stage summary that links the section holding each detail.
- New `references/judgement-summary.md` and `references/direction/surface-modes-summary.md`; the full guides are unchanged (`judgement.md` is still embedded by the Rust crate).
- `SKILL.md` (18,971 to 13,471 bytes): the loading table points its unconditional and style rows at the summaries and adds a `detail` row for linked sections and the full `judgement.md`; Stages C–E are condensed without dropping a rule (Stage D refers to the POC review summary for commands).
- `packages/talkdesk-cobalt/tools/export.mjs`: clears and copies the `references/cobalt-workspace/` folder.
- `guide-text.test-helper.mjs` (excluded from staging by its suffix) reads a guide with its sections; tests that pinned phrases in the split guides use it.
- `html-skill-loading.test.mjs`: forced-read budget (SKILL.md plus `always` rows plus the style row) at most 24 KiB for ordinary HTML and 32 KiB for Cobalt, all forced files are summaries, and every summary's links resolve.
- KB `product.md` and `runtime-mcp.md` updated.

## Validation

- Passed: `node --test packages/dsh-node-runtime/html-skill-loading.test.mjs` (6). Measured forced read: 24,038 bytes ordinary HTML, 24,743 bytes Cobalt.
- Passed: `node --test` on html-skill-loading, poc-review-workflow, html-review, html-skill-migration, poc-browser-guidance, poc-startup-guidance, document-file, poc-review-temp, poc-stability (36 pass, 6 skipped without `DSH_E2E_CHROME`).
- Passed: `node --test packages/talkdesk-cobalt/test/export.test.mjs packages/talkdesk-cobalt/test/preview-contracts.test.mjs` (6).
- Passed: the two guide assertions of `cobalt-docs.test.mjs`, run directly with `readGuide`; the file itself fails before its tests because `wasm/op_dsh_engine.js` is not built, as on the base commit.
- Passed: a link check over the 31 split, index and summary files (0 broken).
- Not comparable: `node --test packages/dsh-node-runtime/*.test.mjs` fails on the same set as the base commit (no new failure); those failures are missing dependencies and the unbuilt WASM engine.
- Not run: `cargo test -p op-ai-skills` (no Rust toolchain on this machine). `synapse_op_design.rs` asserts the HTML Skill contains `version: synapse-design-html/3`, `Stage A` and `judgement.md`; all three remain in SKILL.md.
- Passed: `.venv-lint/bin/python tools/knowledge.py check`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Mandatory HTML POC reading is now SKILL.md plus stage summaries under a byte budget.",
      "sha256": "c17fc68815212fa3dcafd256b6b04843707416296fc7f2d1d5873d050ee83b6b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Cobalt export now clears and copies the cobalt-workspace section folder.",
      "sha256": "d1f81d4e9cd9d32b993fa78ee7f01a4914fe2467507e731ebcb3bae5b708beac"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The ordinary-HTML forced read has about 540 bytes of headroom; new mandatory text must replace existing text or move into a section file. Summaries restate rules from their sections, so a later section change must update its summary; the budget test does not detect drift between them. Whether a model reads only the selected rows is not covered by automated tests.
## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "634207068fb5ec8691c0ebdbd7e9d63841f7b0cbcc6af538a34e17a6675e251f",
      "after": "96ac2d3f7c58d5def44622e2f6d9478ff7a9bdb6fec180e0b8dff863f6e9b0ee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/surface-modes-summary.md",
      "before": null,
      "after": "3f30c1f3ed7a9cd03d40da0c80e370cb40a8db426a0c45f05a63aded818d3d97"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review.md",
      "before": "e15f080c88d4e06d174ce217cc70e2b32d661e79750c437ac23818a6f3124e6d",
      "after": "1199b61b423c71b57b2ec94d0037e262bd195eec2c821071b11c5ffd1691fa92"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/01-author-the-business-entry.md",
      "before": null,
      "after": "4cac57465f1a344a16119dbf2f47d605b1c539b0c050ec01f57dfb0957e5bfbd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/02-prepare-the-review-entry.md",
      "before": null,
      "after": "db02496499cbd257210903cf7aa7e1cf213af44a06ef347c0475b3984bbb47cc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/03-behavior-and-locators.md",
      "before": null,
      "after": "a0c66b97a9877a7a07a569b8b9299e014656f5ce60013df774d44810a2ddc8e4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/04-capture-and-handoff.md",
      "before": null,
      "after": "49592d6be519c93acd3425ba5f34d19c37fe4cf00fdf636ee283a2c36c2e69ba"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/05-poc-to-high-fidelity-boundary.md",
      "before": null,
      "after": "08eb162609a60695707a58d1b7c61fa3e80e932d19a15e539cb5a80c8b91abe4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/06-development-and-final-checks.md",
      "before": null,
      "after": "38cec85ac6fb35ef897737595b546c30ba5de2c536365d805d98f702e5e52c50"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/html-review/summary.md",
      "before": null,
      "after": "2e3dabadc5474097ab19755996da8eb94fcf265628a6a163162a5c49986f9e0f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/judgement-summary.md",
      "before": null,
      "after": "778a9ea738db9f1d754ac146a689ba43e2d09005c5034a5a1c52449c78278b1f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "572fcfd57257f60acb095f7a699b8293114912f151786279fc337788de852177",
      "after": "abf345ec00696423aca3beba921c33bffee4ac005c856bad945169e0a1e1bc7b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/01-before-implementation.md",
      "before": null,
      "after": "7fc4fc1d8efeef635f482267e8060f123a4d2a406ed9506c4db3951496c84987"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/02-local-revisions.md",
      "before": null,
      "after": "bdb0f89738e4668068dceb29f570fe933dc6ca1dcdbb928f362eb8b603d9e13b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/03-start-and-reuse-a-local-development-server.md",
      "before": null,
      "after": "fb8f094d04b37d554e0b098d2d403697f226bbf0b195c4bb8413a6ad84e355d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/04-review-the-visible-page-with-browser-use.md",
      "before": null,
      "after": "d273dd8250d933c6aeb80de5c2b8bccfca4ab527da7e13b11ff9510109ad8f72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/05-review-long-content-without-claiming-unseen-cove.md",
      "before": null,
      "after": "d75a389d8c8f01f9dd17ad7bf7cd2eb93992f67802ee7f299a08e70d65e95406"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/06-headless-development-fallback.md",
      "before": null,
      "after": "ea76956d125fc6e39f9284a42656a38fdcfe588ece75aefa35f3fa913b054a1f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/07-frame-aware-actions-and-detail-images.md",
      "before": null,
      "after": "f74cf8fbd9d860266bd12769f112ff2710cdfa453e1e767f7284dfe4f594c50d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/08-final-review-after-related-changes-are-complete.md",
      "before": null,
      "after": "d5cf3e769e9ff9c337a274ee482831843b0acf01cb6805ec7439c61c643546d2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review/summary.md",
      "before": null,
      "after": "d22405fcca0bd8029696fc0cd89f931d7c54f777b4d9f784445efd2ebb9ed7f6"
    },
    {
      "path": "docs/kb/product.md",
      "before": "b8fd28538c2c82bedf78db0db74994b740ee89e8da6adea60bb58d49ff9c00c6",
      "after": "c17fc68815212fa3dcafd256b6b04843707416296fc7f2d1d5873d050ee83b6b"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "c87bae95a9e80301ae7df676b8cba5e11c25da94869f99fa3ac0d0bb3157dc6a",
      "after": "d1f81d4e9cd9d32b993fa78ee7f01a4914fe2467507e731ebcb3bae5b708beac"
    },
    {
      "path": "packages/dsh-node-runtime/cobalt-docs.test.mjs",
      "before": "ec5cbddc3e45816c8ff0768061032d62116ecf4bcc33a058798961e632c47266",
      "after": "f73a2998420cb8810e5fec7022c672e146caf71c0b9dd309b0a5d602b419790e"
    },
    {
      "path": "packages/dsh-node-runtime/guide-text.test-helper.mjs",
      "before": null,
      "after": "9eca498df189c86bd52a2d2b194c08bbd7f38310e16c4fdee8fa2afd574aa779"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-loading.test.mjs",
      "before": "02f54e2b1a633946fb98bec9313cb2e192ee0ba4e51518edba00b3ca9fb7f80a",
      "after": "6aa917a043b7ba94e47de1e369742938a53d1fd6732cdb23cb31afe639ee4164"
    },
    {
      "path": "packages/dsh-node-runtime/poc-browser-guidance.test.mjs",
      "before": "16f7b00f41a3a2f83a6e70c8315acf123de6555e70f8f3f41c623a6a069ada74",
      "after": "136f2cdf3c3e3da5ac427db851c77c265409e7c23551471f86494699380193fa"
    },
    {
      "path": "packages/dsh-node-runtime/poc-startup-guidance.test.mjs",
      "before": "b06d7ed0bdd60436bb10fcde6855e9d34bfe6d21ac0b8f453d3f9a7cd70ff1b8",
      "after": "a8566147ac73bff754f772534585b5601a2b90ca49768b64c7ce11088863d842"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "fb644a58d926c25e676e5463df62b0a3bdcd45f1da31e1926655f5c54f9d71c5",
      "after": "804b04cdbe0ae4cddf143152a7a4203cc342b43feea29db1b156be1ce5d0abea"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/01-source-template-reuse-is-required.md",
      "before": null,
      "after": "80915da008fc194f801612c94db35bc5cf14f99d1340483b86c4b6c945493734"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/02-choose-the-build-mode.md",
      "before": null,
      "after": "75c832161761da2433dc3ada25883f3bdcd2e629b840d1e462ed82dd02014708"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/03-read-the-bundled-cobalt-reference.md",
      "before": null,
      "after": "7c8c52cc63610da73b0799fedc9cb2b65622e048302bde80a53376a46a633237"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/04-create-and-extend-the-project.md",
      "before": null,
      "after": "d7f37d16488b65d6ed29a2103d606022d9476e36a14bb7a1e27e70603601617e"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/05-run-review-and-deliver.md",
      "before": null,
      "after": "a009541c9cd15f45a2959419c2ac64ad4309bf0039dadf8366c474cb54165933"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/06-local-cobalt-extensions-and-executable-recipes.md",
      "before": null,
      "after": "d2048a36892537e6f95658e3d9d17a38983e78605e225c4c3c5eff47ccd45534"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/07-prototype-toolbar-locators.md",
      "before": null,
      "after": "6bc0a9ee53838a506bd2910bc4d0965cf7e92ced853a73af7f74750f5b8b7a16"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/08-workspace-chrome-baseline.md",
      "before": null,
      "after": "9d61f5507a26fd07e09eabf4825089d124df21e6cb00d77a200b476331c8b7db"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/09-bounded-lists-and-insights.md",
      "before": null,
      "after": "6e73b6f60ddf8482a6763857f0ae174cf678bb1ee586c53224b2261828e78500"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/10-recipe-component-reuse-audit.md",
      "before": null,
      "after": "769517dbe614262652147f964a4cc6ba38c76d6c30b3f82453420a44b3ae65d0"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/11-protected-shell-and-popup-behavior.md",
      "before": null,
      "after": "d83f31dc76732aff2615d1f6819509b3b7478fc68ab6e8d30f7bef65647fa395"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace/summary.md",
      "before": null,
      "after": "90117ef8ef79d98957cceea7ab834aa82f32fde386be607d8f0be1e4585d5a52"
    },
    {
      "path": "packages/talkdesk-cobalt/test/export.test.mjs",
      "before": "466f57bb27141539fa5c31076f99fbdad1f169c2e6ef9f400d4ee672546fb731",
      "after": "81978c97193f3e1657f0c91d65251160554a90802338a373138b6fa64f6ec699"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/export.mjs",
      "before": "9f2c0390df7fa16443eb24182fd90b7cc2f9390d05d6d020d52452fa5eaf3e57",
      "after": "9cf0350c644af65733dcbbf29aa4cd63ce691054f382f9af39c03402ed54497b"
    }
  ]
}
```

Completed-At: 2026-11-26T09:52:08.971188+00:00

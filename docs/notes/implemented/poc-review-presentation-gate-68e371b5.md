# Enforce mandatory POC review flow: proactively open HTML prototype via deliverables, echo rendered screenshot inline before ask_user_question, and block premature POC option prompts

Record-Version: 2
Task-ID: 68e371b5-4845-4d97-826c-dd22b787ed7d
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-12T15:48:21.325250+00:00
Type: feature
Status: complete

## Context

Address two live Synapse Studio feedback rounds:
1. Enforce a mandatory HTML POC review presentation flow so `synapse_design_poc_handoff(action="record")` proactively opens the HTML prototype in the right-hand Preview panel, signs screenshot frames for the tool card, and blocks `ask_user_question` (`synapse-design-poc:<taskId>`) until `record` succeeds and a subsequent assistant message echoes at least one recorded screenshot inline (`![...](<path>)`).
2. Implement all 17 live-session design workflow, review-gate, batch-DSL, renderer, font-resolution, and HTML-verifier fixes (Scope Fidelity + Design Upgrade, `upgrade` vs `substantive` scope deviation, Stage C replica-vs-upgrade choice, honest publication reporting, `nodeIds: string[]` multi-state board mapping + duplicate screen name rejection, receipt precheck checklist, 2-strike identical diagnostic stop-and-ask, non-destructive `finish` without `review` + `inspect(kind="status")`, omitting `path` from unpublished `finish` responses, 7 batch-DSL/layout pitfalls, DESIGN font authoring + `fontResolution.designSpec`, macOS `capture-poc.mjs` / `chrome-cdp.mjs` timeout + `<500px` viewport clip fix, `900 -> 902` artboard height consistency, up-front `rendererReadiness` + exact CanvasKit headless render path, POC handoff path/`style-context.json` docs, `verify-surface.mjs` `review/`/`shots/` exclusion + `app` scope, and unified `390×844` mobile width).

## Changes

- **POC presentation & screenshot echo gate:** Added `pocDeliverableFiles` and `checkPocQuestionReadiness` in `packages/dsh-node-runtime/design-discovery-gate.mjs` and wired deliverable auto-open + `OpDesignTaskPolicy` enforcement + `DesignRenderView` frames in `ss-dsh-design`.
- **Scope fidelity + design upgrade & review gate (`packages/dsh-node-runtime/draft-review-gate.mjs`, `draft-review-checks.mjs`, `design-workflow-text.mjs`):** Added `deviation: "upgrade"` + `designUpgrades` (`[{ screen?, what, why }]`), `nodeIds: string[]` multi-board screen mapping with explicit duplicate screen name diagnostics, non-destructive `finish` when `review` is omitted (`statusOnly: true`, zero strike increment) plus `inspect(kind="status")`, 2-strike `repeatedDiagnostics` stop-and-ask guidance, omission of `path` on all `published: false` responses, and `draftStatus` + `fileExists` publication reporting.
- **Rust batch DSL & layout engine (`crates/op-editor-core/src/command_node/patch_merge.rs`, `crates/op-mcp/src/batch_design_normalize.rs`, `crates/op-mcp/src/batch_program_placement.rs`, `crates/op-mcp/src/batch_program_exec_ops.rs`, `crates/op-pen-loader/src/layout_repair.rs`, `vendor/jian/crates/jian-core/src/layout/resolve.rs`):** Deep-merged `Ref.descendants` on `U()`, supported `U("inst__child", patch)` and `U("inst/child", patch)`, preserved `"stroke": null` clears and normalized per-side strokes, exposed `C()` and `R()` in QuickJS (`script-prelude.mjs` / `script-expansion.mjs`), auto-placed root `I(null, ...)` and `C(src, null)` frames (preserving empty sibling shells in `execute_copy`), excluded `visible: false` nodes from flex layout space and gaps, clamped `SpaceBetween`/`SpaceAround` effective gaps when `clipContent: true` prevents expansion, and preserved declared numeric root artboard heights (`900 == 900`).
- **Fonts, capture, renderer readiness & HTML verifier (`font-resolution.mjs`, `engine-session.mjs`, `chrome-cdp.mjs`, `capture-poc.mjs`, `verify-surface.mjs`, `verify-source.mjs`, `SKILL.md`, `build.md`, `craft.md`, `review.md`, `judgement.md`):** Applied bound `DESIGN` heading/body fonts recursively to newly authored text nodes in QuickJS, added `fontResolution.designSpec` comparison against `DESIGN`, disabled SwiftShader on macOS in `chrome-cdp.mjs` while using unclamped backing windows + `clip` + PNG IHDR dimension verification in `capture-poc.mjs`, surfaced `rendererReadiness` and exact headless CanvasKit rendering in `ss-dsh-design`, excluded `review/` and `shots/` in `verify-source.mjs` with operational `app` scope inference, clarified POC handoff paths, and unified default mobile viewport width to `390×844`.

## Validation

- `PATH="$HOME/.cargo/bin:$PATH" cargo fmt --all -- --check` — passed.
- `PATH="$HOME/.cargo/bin:$PATH" cargo clippy --workspace --all-targets` — passed (0 errors; pre-existing warnings only).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test --manifest-path crates/op-editor-core/Cargo.toml -p op-editor-core --lib` — passed (1280 passed, 0 failed, 1 ignored).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test --manifest-path crates/op-pen-loader/Cargo.toml -p op-pen-loader --lib --release` — passed (0 failed) + `layout_repair_tests` (18 passed, 0 failed).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test --manifest-path crates/op-mcp/Cargo.toml -p op-mcp --lib` — passed (545 passed, 0 failed).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test --manifest-path crates/op-ai-skills/Cargo.toml -p op-ai-skills --lib` — passed (220 passed, 0 failed).
- `PATH="$HOME/.cargo/bin:$PATH" cargo test -p op-host-web --lib --features canvaskit` — passed (788 passed, 0 failed, 29 ignored).
- `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh && PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-web.sh` — passed.
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` — passed (261 passed, 0 failed; re-verified `design-workflow-text.test.mjs` 4/4 after restoring exact `pocResolved` phrase).
- Live macOS `capture-poc.mjs` smoke at `375×812` and `390×844` — passed (`375x812` and `390x844` exact PNG IHDR dimensions verified).
- Host plugin (`synapse-studio-dsh`): staged local runtime, `npx eslint plugins/ss-dsh-design/src` (0 errors), `npx tsc --noEmit -p plugins/ss-dsh-design/tsconfig.json` (0 errors), `npm --prefix plugins/ss-dsh-design run build` (passed), `node --test --test-concurrency=1 plugins/ss-dsh-design/tests/*.test.mjs` (499 passed, 0 failed, 21 skipped).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Updated chrome-cdp.mjs macOS Metal ANGLE + unclamped backing window + clip viewport capture rules.",
      "sha256": "738dd6646ce36f041bd8891c0c2e22d9cf59e149acde8bc36a34a59c1c60e42b"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented POC review presentation gate, 3-tier scope fidelity + design upgrade, nodeIds multi-state boards, non-destructive finish/inspect(status), unpublished path omission, 2-strike diagnostic stop-and-ask, DESIGN fontResolution, and 390x844 mobile viewport unification.",
      "sha256": "46cac4b686c5fe0efccf2c3b12b20154a381710fb7f3762245ab0f98f02507f8"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Documented QuickJS C()/R(), auto-placed root screens and reusable masters, deep-merged Ref.descendants, inst__child updates, stroke:null + per-side stroke normalization, visible:false flex exclusion, fixed-height root artboards, and DESIGN font defaults.",
      "sha256": "c39469ad9c3ca61cede73a4234e1934396ee9b7edbb3dfe962e1f255f42ce1be"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Multi-state boards mapped via `nodeIds: [...]` under one screen share that screen's identity for review checks and prototype action containment; authors who want distinct screen-level routing entries should declare distinct planned screen names in Stage A.
- `fontResolution.designSpec` verifies that `DESIGN`-specified font families are authored on active-page text nodes and registered with the headless renderer; glyph-level CJK fallback inside mixed-script runs still requires visual screenshot inspection.
- Interactive live-model conversation runs inside Synapse Studio UI were not executed in this CLI turn; all runtime, headless Chromium, CanvasKit WASM, and plugin gate paths were verified end-to-end via automated tests.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "85ddd2e604b55a8c25f9aa62e75e73a462bdcb3d5654da9ab8dfd4808c067f07",
      "after": "a5ab14b684bf7628cc6bff88ae3b563d042e9042f71fa9fd36811b150d7f6bbf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/judgement.md",
      "before": "7c4acf2aa91872490e2ba2a2f2ffde4620f325613b172e7567a365dcb1b2a395",
      "after": "98e0168b0722c9db4583a050bee298e8956012c0fedd4b7ff1a736dfb175078c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "fb3c90b015cc9ed3e1626cec2816a73e8f5677782e1ff300f83c677fbb58bda8",
      "after": "1bff306e45669d3c2ab13fee3d613a5000941a6642a4ef72214a54c68008227f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-source.mjs",
      "before": "761daf235295a9406c6a0a00a36acadd7728fc34ba1a73cc35fb9e23c915543c",
      "after": "bdf20839e4112614d62f2a776c18443f21ef7cf02e4e9ac91ac2567d01bdfec5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": "ff6ff786dc838f1679b7d6a00fda4946b19211b615eb0ea1bba5dbd2cb03e2e7",
      "after": "33474b802009e78a4772a533d8b39d1b7d20eaee09b9caa90b6b01896600792c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "6a28ad615f3c4f34af22ee543f9166ea3f340b50cbbd830b5b6a64880ee8ac9f",
      "after": "dc7e2687ed30aa47c7ec170c3ca62b7711eb353c3eb585f4897d6c990f269877"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/build.md",
      "before": "47fbbd780ec857a3cd65df70df49551f3e6460df7a838c44a272e406b8969d29",
      "after": "b769509295150eb6aa36318928cbca41a8ec68460be99a9b73ba165d69f8e182"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/craft.md",
      "before": "84fd9719341b3418b25ae5615a238b16b77f3169b3297e8c9635b6fe3c47f846",
      "after": "9066e09b98412078798a02f3862cdcfe538aeb42699ff9113994c4b8f3da4ae6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "93b06d5a752268e3c53807a0c5b7ef5ce205b944187cf3c3b33e8679ae97e2e2",
      "after": "7df8ab9ec8512ca7ee19672e18b9fc4423a97ab978926a0e7c1f083a68a5d10c"
    },
    {
      "path": "crates/op-editor-core/src/command_node.rs",
      "before": "4d184089ce8e46921f61dba62f799c7a5362a9cfd86ca48999074a0675980dd4",
      "after": "c7ba709994d97355fc89c9384961215fe77d61cf2c0bd47fe3b035f3467d91f3"
    },
    {
      "path": "crates/op-editor-core/src/command_node/patch_merge.rs",
      "before": null,
      "after": "086c7facac1c59af31d62aa5e5b74a35a86c73db6d068b87f37627d6be1658e9"
    },
    {
      "path": "crates/op-editor-core/src/command_node/state_ops.rs",
      "before": "65cfb76c712e34bdc188b9a66353cf725c3b3061518545305424c986271d0ed7",
      "after": "cc979b5596227933a3f1ea22150c4754d492636e74905280e7d200f46bbf59ac"
    },
    {
      "path": "crates/op-editor-core/src/ref_resolve.rs",
      "before": "de213e50fbc82a38b18d745e8f1ea2e10d3a7dcdd903bb514dabf8f296b6804c",
      "after": "117c7ae7b59ef280015bb7707e38ecb403511c312c3fd80817821b189bc94485"
    },
    {
      "path": "crates/op-editor-core/src/ref_resolve/typed_expand.rs",
      "before": "2b02d9005192b4b71032498a6144d42ab77488299f8ea9f91ce759c012b550e6",
      "after": "e9130cea9c12696e6d43ec8a9bedfd8fa41aa6ae459a95802cb32b4f979dfeeb"
    },
    {
      "path": "crates/op-mcp/src/batch_design.rs",
      "before": "dec04c3a39db844599d5b13fc0352814662dbaff97323152fc0b59220a417199",
      "after": "76fcf2e9dd71d83265b71be440df951228b94e43a719c9b74feda3661883e8a4"
    },
    {
      "path": "crates/op-mcp/src/batch_design_normalize.rs",
      "before": "c9be607d981eacbd1eca98f7fe3266a390478a8ae795f33e4bf0a483098e8a03",
      "after": "b1bc0fe0675e4f2c4283ee2d9959b52cfa509a1ee2216bf94ac8d49b3312ac8e"
    },
    {
      "path": "crates/op-mcp/src/batch_direct_ops.rs",
      "before": "a28bc0d6778cc5ffd1ca2f3df25c5b258d8d071708b6a1a77cbc620f4424bf90",
      "after": "fef8f501883b2c1a1a348a42c2a711657a4eccb4ee1f4055dac996ed4dea1ae5"
    },
    {
      "path": "crates/op-mcp/src/batch_program.rs",
      "before": "08940ef0be5db21b40d65a4224ff34d804ff6aad48186d4c894478955e3ffdd3",
      "after": "aa65753bec675437aef3d9945515fe861c4d8e325a18bfa963d00474deb7aa54"
    },
    {
      "path": "crates/op-mcp/src/batch_program_exec_ops.rs",
      "before": "cbdb56de9cc89a05c2eba24374cd357a313bf7821b360da6c39078033c3fd4f8",
      "after": "0a9fd770c670f697983f5f04557c0ebf97a2a68baf2e14aaf37660d20b1532b4"
    },
    {
      "path": "crates/op-mcp/src/batch_program_placement.rs",
      "before": null,
      "after": "9615c01160587b1e32ab31c5b303f7f4d7fcf61eb22f4dbed2accc381cb17056"
    },
    {
      "path": "crates/op-mcp/src/batch_program_update_tests.rs",
      "before": "eefc80e3530161c555f04c9e5474f0c76afe9656bba4fcb66f574f2783ca459c",
      "after": "b386a6db6f56bf32b18056f1c85c2a865a349828bf673a97f28742855fca7b4d"
    },
    {
      "path": "crates/op-mcp/src/lib.rs",
      "before": "7d07302a1cb0b938ac602dd44d29bc87238f191d04cf781bc350dd680ecc0c69",
      "after": "029e486b8b007414c3bd6d0e4b72a3e0eafc99e578efd74a30ed6da202e1b3fd"
    },
    {
      "path": "crates/op-mcp/src/update_node_data.rs",
      "before": "86708c4552146669a7e988bf4074749b0a8bbf2efa92f31b182d4fa3eb4caf23",
      "after": "d6e40761d3f346929121f431f63d3b071246ba006e4e32c09a04ad5eb6bb1245"
    },
    {
      "path": "crates/op-pen-loader/src/layout_repair.rs",
      "before": "bb33a8b68b779687545fa831424a07b6d0dec9ff1b30fee7c6c9c8ebc1bf68c7",
      "after": "c1a1fae40f114a4d3349498fda2cdb2dee53d9584a236774a1a7189a26896274"
    },
    {
      "path": "crates/op-pen-loader/src/layout_repair_tests.rs",
      "before": "c76d79726d04c99fadf5250391558adbdb3112580f0c8a5aef7fb0d8e23b5408",
      "after": "e7efc098672e717738445a1bd727d307f088dcd08087aac9f8d32bf8f4d107a0"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "1b504433430fc63bd7e0d2084225fc881aba090f01657055073f33eb57a08c5a",
      "after": "738dd6646ce36f041bd8891c0c2e22d9cf59e149acde8bc36a34a59c1c60e42b"
    },
    {
      "path": "docs/kb/product.md",
      "before": "5bf67c6b59d60b2608daa8ff7631e4c507224ac81efc760e194de763c80537eb",
      "after": "46cac4b686c5fe0efccf2c3b12b20154a381710fb7f3762245ab0f98f02507f8"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "e90b7ab1cb2f78ee7449f926a75a4df23f51559211dcfc8d7cdce8fda2b9b4d5",
      "after": "c39469ad9c3ca61cede73a4234e1934396ee9b7edbb3dfe962e1f255f42ce1be"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": "bce158c09d04abd90007dc7ff65091b896b56c340206a2b97de5c2df380f05c8",
      "after": "5c8110795c0fac8fc8a8a63c8dbcc4f0877467f660f65f7dd8a0ffe0ac11083e"
    },
    {
      "path": "packages/dsh-node-runtime/design-discovery-gate.mjs",
      "before": "0b0827744266e4627462a3678a54cd2dd63e56055503b8402d5d94c600b03bd8",
      "after": "b01a2ea1ba6d7a5179b2eacea9aeb8f718e0571342910f169931778caebf50c3"
    },
    {
      "path": "packages/dsh-node-runtime/design-discovery-gate.test.mjs",
      "before": "544aa648da4debddf01196eaa10ee70c519bce513e62fe5a5547b9e3b5ccf9f3",
      "after": "193f241859a2a37a3111920982054dc4a07e8a8ea945fa478593baef1ca66f7a"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": "dacb8567e3e522a646986d74fde7f99333bc09dff80a81f14d107a6d298377e6",
      "after": "fd0376338ecd5a3b04106126910675a992fd1ba75a507eb68030c6d45ee8f462"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-checks.mjs",
      "before": "a0e95f171174650f37f09f854f029bb8cc18b562b703abcca0041e05858d77cf",
      "after": "56fdf0db600f48b98fe5806ced4d46c5c64fef16965ac1a29c62e043d2d797e2"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.mjs",
      "before": "7d978a0fc8c4be4e14b77e5e3866f084a9e38a2e7a7158efebeea2982e5fecd5",
      "after": "894faf8d14728c87f62f09dedd101f7783ab12361bdabbb6400c099d0b3cfa30"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.test.mjs",
      "before": "a3458e1d1cc218c7e49e810c6a76e7cdaa62a0159d6ee50442c32e62f6476a15",
      "after": "539790d45398aacdc6dd3ffc6f201173b48b1cebf1703cd8a62fa0777e858d25"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.mjs",
      "before": "aba6edd0d9a44f8a642fe7eae2ed08f4e070df1b7a56c976ea7154380387c213",
      "after": "769400e8332e1e4b268858402a2e709de111aca84636ab689e3f4bcbc1fe7086"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.test.mjs",
      "before": "1230331c3780636f06fc9546a66f2b2c3865526983fe6a631e9c48500bbda046",
      "after": "78a23feacc751325c40cbb1a683aaf0045a8c652fd83d101498404362641563d"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.mjs",
      "before": "e8f0500894f6ac79a3146ae6a0e6b63488fdd4e04ffcc3973f4970d37a52026e",
      "after": "df5908624efcdf25560741be6044c648d107c4e9516e84a78e7186bb7fb65786"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.test.mjs",
      "before": "a7a0b9e915af08da975056dced9a94d1314aee40e6a91fbe6b9ae3683fac60ef",
      "after": "524d1c3c3ad295c1feb2fc2cc246ff64faf6e4c4ba54cf9c9584e5701fa01b6f"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": "cd2eab98a370df3b4888c9763beb0df46d770b62dcead1dae0f9ec7fc6b6953a",
      "after": "553c256bd2468114d8ec6fbb4ee5ac746c6eb0ec711f0d75e279fb1e22e960aa"
    },
    {
      "path": "packages/dsh-node-runtime/quickjs-script-sandbox.mjs",
      "before": "2af27e544f9042e11b2bd6ac1f17a498ac4fb98252db40cb77d98602d375853d",
      "after": "1012ea01eb238e74858f867ecdca50e1ff75299a1f6d03d80c1c3df4508cdd96"
    },
    {
      "path": "packages/dsh-node-runtime/script-expansion.mjs",
      "before": "7543df99a007a5f036aa5f86009b0b96aca0b59a5b91a317eb91aa470bfe2dd3",
      "after": "38b6c412741da72b277cd8a0193cfba70f248430ff62b87d1e313e759a479d23"
    },
    {
      "path": "packages/dsh-node-runtime/script-prelude.mjs",
      "before": "b0ed377de4e8192325aeac120e5f75d918cec4198e305e0900a7eb4817c0ead2",
      "after": "17a6d731f948c5139633fbd92e29a14771beae349d516b8905b74b744b168398"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "85ddd2e604b55a8c25f9aa62e75e73a462bdcb3d5654da9ab8dfd4808c067f07",
      "after": "a5ab14b684bf7628cc6bff88ae3b563d042e9042f71fa9fd36811b150d7f6bbf"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "fb3c90b015cc9ed3e1626cec2816a73e8f5677782e1ff300f83c677fbb58bda8",
      "after": "1bff306e45669d3c2ab13fee3d613a5000941a6642a4ef72214a54c68008227f"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "81ca1fb4863c2b439625019d3979d0156baf4c7b86fde7b9fddec871b791ea4e",
      "after": "9b7583f3caa5b1ddc0d07b242bfc5b3a878f503a819bb457fb0b7528ab800b80"
    }
  ]
}
```

Completed-At: 2026-11-12T17:42:35.371920+00:00

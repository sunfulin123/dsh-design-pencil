# Unify HTML POC and Synapse design workflow, fix device frame, preview eligibility and style-picker folding

Record-Version: 2
Task-ID: 5dcaea20-8276-42e7-919d-e4bc2255561f
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T10:13:06.499096+00:00
Type: feature
Status: complete

## Context

Unify HTML POC and Synapse design workflow, fix device frame, preview eligibility and style-picker folding

## Changes

- Unified the bundled `synapse-design` guidance and the adapted HTML POC skill around the product style catalog. The DSH plugin collects task context, asks for a route when it is not explicit, and retains session-bound POC source/screenshot/style fingerprints across the handoff.
- Added the preview-page document flag, prototype/deck filtering, inspector control with undo, and legacy device-frame exclusion. Device shell labels target the actual screen; the plugin produces borderless shells with shadows and upgrades exact, locked legacy shells as an unsaved editor change.
- Added in-place style-choice folding with per-session/gallery state and updated plugin routing, runtime installation checks and skill resource staging. Kept preexisting workspace changes and staged the built runtime into `ss-dsh-design` with a backup of the previous runtime.

## Validation

- `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh`: passed with existing compiler warnings; local runtime staging and `node scripts/build.mjs` in `ss-dsh-design`: passed.
- `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets`: passed; clippy emitted existing warnings.
- `cargo test -p op-host-web --lib --features canvaskit`: 780 passed, 29 ignored. Targeted preview-toggle/undo test passed after addition; the device title hit test passed at three zoom levels. `cargo test --manifest-path crates/op-figma/Cargo.toml --lib`: 297 passed, 4 ignored.
- `node --test packages/dsh-node-runtime/*.test.mjs --test-concurrency=1`: 185 passed, 8 skipped. An earlier parallel run had one performance-budget failure under concurrent builds and a staging fixture failure; the staging fixture was fixed and the serial rerun passed.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/ai-design-loop.test.mjs`: 3 passed, including the real CanvasKit browser. The canvas theme and property-panel browser tests passed 2/2 with Chrome enabled.
- In `ss-dsh-design`, 45 focused routing, style-picker, device-upgrade and registry tests passed; the isolated real-runtime generation/screenshot/publish tests passed 5/5. A separate isolated test captured an actual HTML POC in Chromium and handed the confirmed catalog style and screenshot to an editable Synapse draft; it passed and rejected a different chat.
- `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=... node --test --test-concurrency=1 tests/*.test.mjs` in the plugin: 433 passed, 23 failed. The failures are 22 previously recorded legacy design-pipeline expectations plus one test importing the removed `design-quality.js`; their quality, repair and retired agent expectations are not established as passing.
- `node scripts/test-node-runtime.mjs` in the plugin: passed. `tools/check_code_line_cap.py --baseline-ref 6644990089bc122113f967a3dbabf5cf6d41665d`: passed after shrinking the affected legacy ceiling.
- `bash tools/check-maintenance.sh --base 6644990089bc122113f967a3dbabf5cf6d41665d --task 5dcaea20-8276-42e7-919d-e4bc2255561f`: passed, including knowledge and source-cap checks.
- `vet --model gpt-4.1-mini --max-spend 0.01 ...`: did not complete; its estimated cost exceeded the configured limit for this dirty worktree. No paid budget was increased.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/figma-import.md",
      "action": "unchanged",
      "reason": "Reviewed the only initializer change: the new preview flag defaults to None; Figma instance sizing and import behavior remain unchanged.",
      "sha256": "bdf06ad502d230a51120ba36115ddd08ddee3750d9dc91f84c620264420b7d96"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Reviewed the bundled HTML skill, shared style guidance and limits of POC screenshot fingerprints.",
      "sha256": "0cdec1ef63b164d2d2aa522723db98823bf4018ae8a29328f2345cf374a25219"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Unified the two design paths around one style catalog and documented preview-screen eligibility.",
      "sha256": "e6e22ff890f3b301900d23e3eebd5f5cfb901b68a5d80e3321cb5d5f59899ac4"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- No autonomous real-model design session or user's desktop host was run. The real-runtime design-loop and POC handoff use scripted tool calls, and visual model assessment is explicitly not proven.
- The HTML handoff fingerprints files when recorded and again on continuation; fingerprints cannot prove that a supplied screenshot actually represents the captured source or that the UI meets visual quality criteria.
- The 23 plugin-suite failures include quality and repair assertions, so the full plugin suite must not be reported as passing. Existing host/service data and user-owned design files were not used as fixtures.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": null,
      "after": "77a05ff6541b63ac376fd2cabb8f5c2073888d2b4299ea231fb28f532a64acc8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/harden-and-edge-cases.md",
      "before": null,
      "after": "0fda308108396d028af96c30d46d924b72f66db2c4015cf9e927b9272aa907b6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/layout-sections-and-cards.md",
      "before": null,
      "after": "85394d4346ec9d7afade7382ba86e791c9ea0256135406fb2d6f448c870db8b2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": null,
      "after": "0dd3339c3337eee1129cdd24611cab6dcc8a4919cbe8dc06ac351b3275daa41b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "2740131f30a838a61b8b33942d80549dfde4a002e06970039fadd35217276c8e",
      "after": "5111cb87e2fd2bbc5af66f1782e1dfff5b297706914a45429751c1866f8fe2e4"
    },
    {
      "path": "crates/op-ai-skills/src/synapse_op_design.rs",
      "before": "b5acb076ec30d575699ee6668ebd385201d79aa248a2eaff880fc48287773fe0",
      "after": "6fd510e2e2d48640c3e8a06db4c8fe88fa9cf75e339bdee1b90d7f5eb1e89a1d"
    },
    {
      "path": "crates/op-dsh-engine/src/prototype_tests.rs",
      "before": "44f243708d70aa67affc04b78eec87d29c83f870fd668241e9c8a1238ad52f77",
      "after": "519aee30aaae8a3d7d98354db539b188b34d9da84f77f05bc5dceda2974c8e7e"
    },
    {
      "path": "crates/op-editor-core/src/preview_slideshow.rs",
      "before": "f7cd2ee57a0b657010fc59dc4f640b252280e82df1b38fb873e5557c5f97eff9",
      "after": "28bedbd4987cbc563acec7dd6b6c1de7fb47bc77539485838481854ea5a99421"
    },
    {
      "path": "crates/op-editor-core/src/prototype/graph.rs",
      "before": "f42eaf5b271bec5475cdcfc0772024a886b9ce4cf7e7c4f0bee37463e11647b4",
      "after": "106592f85da5899e504f0c47e568279dec8be2e461160befd6e40e977fd28d21"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_frame_labels.rs",
      "before": "aec94dd96fca98c836b5a27c9ba3d4e504105ce24e9f6a94e7be5e69d8790280",
      "after": "157944447a76c47eb3582cfa8236926e38355f0e1436c11f57ca8817c8e7876b"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport.rs",
      "before": "00c5ceeeb524c31d4c6160344d615f4b782d7b995b82ceb4990e08dad537e3b8",
      "after": "8efdc10b55aa4ae29becdd2f13c78d8d2321e4be42f2b79e9c3ff07c92758092"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport/builders.rs",
      "before": "78d74d82e87d398d322667d80eecca4a4c919d117f0674bb47e3890a3b775e84",
      "after": "5c554e240f69d1da8bdcafd9a2bed543e0348307b7c98ae93a964e76203fb992"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport/root_boundaries.rs",
      "before": "374fff8dfefa02124a11d409cbef005c3e99efb60971eb5ab3dcfaad5bbfca1e",
      "after": "0cb7e9008fba94dfd463bd516e4222acaad40fd6cb60f6135e1211d997f957b2"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_tests/frame_labels.rs",
      "before": "603116b3c4f979c78fe46ee79ae81550224aba0e36bfa4f0ea7cc234e5d65925",
      "after": "81105e247d6ea0830968bf7e44869036648652b230706ead2d293aa1774ee4bf"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/mod.rs",
      "before": "41a942e1bedd4f1164096ead07667f9a6624e85bae649a3fe96638cf1a8b4697",
      "after": "c6d4aa1f7f457d5dad9687dd23ea2debf1d923473f27fa4e8631ef687f7f5e24"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel.rs",
      "before": "e59730467393d25a1ca442b2de4ce9ecd067bbf424f1f8ad7eb63809bc2d7ebc",
      "after": "9b39aee91924b18080495975d2eec11e80382e6dfcfe3a504972c679c5be59e9"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel/build.rs",
      "before": "55132eafdee2b12d451788e1a0877bbb390ec1eb40c39927028df0b96a71c2e6",
      "after": "fd4179be1abc5da12aedc914022690fed9540882cde4374184b86e7456018fcb"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_action.rs",
      "before": "67946940b39af1b9b0bf53325f081aba299a39a8e8bb1bc9161b84516e3da4ef",
      "after": "6569084976b2bc1d3a9195c844c286ecc7b2c71b7454f4f2dd8b603c54f04978"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_collab.rs",
      "before": "96341136ada92aeff2304954188e733f26ea0bcf2831b29f95b38a57d75c431c",
      "after": "4023047885e95caad42a2a7014877fa3c128b6899fae4257afd39f91961ab18c"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_dispatch.rs",
      "before": "e884f79f67190b76d3ee289626862e307b30a2fb97bb4268364a819b7e2f697d",
      "after": "2b15aab9048b035ded3606a8a4ab6f65cd8dd451cf408c2f3c4f10416950e618"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_dispatch_support.rs",
      "before": "c46fe29ada2c000cafebc34723a031041398c960f6e976dcf26358fbc5ac0bd5",
      "after": "c07233e7929db1669e3f396a82211af233aab6a8132948ebca03e60213efd6a4"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_effect_dispatch.rs",
      "before": null,
      "after": "a8f1540e079384cfe53c9daa41f4e9e042ad11b097e3226cfd80697c1f7ec9bf"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_header.rs",
      "before": "6404dc9432c7648f9e226422fbfd3495f07240fa9569af85001dd626bfc414d4",
      "after": "633308974c4646888c978d11c7d137100164151c54d4c3178f8985b5da41f44f"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_snapshot.rs",
      "before": "9d41df08bbeef05f58ff65f9f2f81280fb20d2e76bd5341f106cae7219c4f76f",
      "after": "d545cc8132b28a1e8e3011132f54086c94d54444275c184c78a2ea6444c2a35a"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_snapshot/build.rs",
      "before": "7bdd09cd455c6a4df308f673c3189c1364ed565507400e28271343f0cb64952e",
      "after": "a92ee08b32d5567840b6eb622abd94aa0f38b9653f15a59d90c842e93ed2a697"
    },
    {
      "path": "crates/op-figma/src/common.rs",
      "before": "f1eef5632dd0218229465b9a23257c6e98506f95c953a3f4acfd299470105c13",
      "after": "d2c228b5c2817982399b5809e7a6efdf83b015c7e1758c1c140d2bc885742b2f"
    },
    {
      "path": "crates/op-host-web/src/widget_host/property_panel_press_tests.rs",
      "before": "2c5a06391392cc11f70fde9d5b3aaf4aaf6add6cb7e52a95daf3409be8a98a36",
      "after": "1af66291ff4a2e636fea335160b4a6e13439768cc70aebfef080fe83a0e23431"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "8b37fb1670261587e12fed406589395fd61c13acdf7c620d1f7f67dece165d0e",
      "after": "60094aabe11571dd663e9e0cf41e155903a355da20a88f38822c4edc88f79f6e"
    },
    {
      "path": "docs/kb/figma-import.md",
      "before": "b61ff186e8285d12a85e40426563428712d085ceba79587a2cf2e04a30a3e625",
      "after": "bdf06ad502d230a51120ba36115ddd08ddee3750d9dc91f84c620264420b7d96"
    },
    {
      "path": "docs/kb/product.md",
      "before": "345e71ff40b531dc6669dffe5d7ed16ffc6e37805c880c83d21dba87918fbfef",
      "after": "e6e22ff890f3b301900d23e3eebd5f5cfb901b68a5d80e3321cb5d5f59899ac4"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "31e07d92dc5938260d05883186968c22475d3c6840f93fab996ec304be5065e2",
      "after": "0cdec1ef63b164d2d2aa522723db98823bf4018ae8a29328f2345cf374a25219"
    },
    {
      "path": "packages/dsh-node-runtime/build-engine.sh",
      "before": "146e985413bc80be2c6fe368f8c39953c108047f4367d469e22ba4f5fe7d5290",
      "after": "1a5b26fb2c4c95851fb9e5a745450503a9590abc42c49e3e0624c7d29d172b93"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "5b999364b2eb2ba8388fa1951884fcd8aa3d29566500afbf6d2d30b652089a1b",
      "after": "c47b4c6aeb68e7982c2d1aea18a7dc0d49ff6386c3a3216c705593f7db8b5a1c"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": null,
      "after": "77a05ff6541b63ac376fd2cabb8f5c2073888d2b4299ea231fb28f532a64acc8"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/references/harden-and-edge-cases.md",
      "before": null,
      "after": "0fda308108396d028af96c30d46d924b72f66db2c4015cf9e927b9272aa907b6"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/references/layout-sections-and-cards.md",
      "before": null,
      "after": "85394d4346ec9d7afade7382ba86e791c9ea0256135406fb2d6f448c870db8b2"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": null,
      "after": "0dd3339c3337eee1129cdd24611cab6dcc8a4919cbe8dc06ac351b3275daa41b"
    },
    {
      "path": "scripts/stage-dsh-runtime.mjs",
      "before": "4f0411d45978fc33d59ce88fa3bd740c7e4417403af992735694b47c8345b6a1",
      "after": "8917deeb0f8b8b22136f98a83503bcc7116e1cdd6165fa3089eb82f27028180a"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "9619106862e79e415887a4b4a9c6dfd09079f14275b7720d26ada564a7f193b0",
      "after": "7b7bd27b16ac9f7c6db03145a6002844e0df3385cc9cfde9eb7864fffa178b2c"
    }
  ]
}
```

Completed-At: 2026-11-10T11:19:16.137394+00:00

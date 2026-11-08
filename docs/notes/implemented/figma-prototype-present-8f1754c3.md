# Replace jian runtime preview with Figma-compatible prototype Present viewer, .fig/REST prototype import, and AI prototype MCP tools

Record-Version: 2
Task-ID: 8f1754c3-0ef9-4895-a261-f6c3b8c70674
Base-Ref: 1854f5727614e9efac05c0e6b69d72a2e7bef77e
Started-At: 2026-11-08T07:35:23.696142+00:00
Type: feature
Status: complete

## Context

Entering Preview mode on large `.fig` imports (such as `Live - Widgets.fig`, 39 pages / 20,674 nodes) froze the browser because:
1. `op_preview_core::PreviewSession::enter` cloned the page, expanded all components, round-tripped through `serde_json`, built a full `jian_core::Runtime` state/action graph, and ran Taffy layout synchronously on the WASM main thread.
2. `initialize_preview_browser` called `editor_state_to_layout_scene`, rebuilding all 39 pages of the document on the main thread.
3. `paint_preview_canvas` painted the entire page (`page.children`) live every frame instead of framing the active screen, and Figma `SECTION` containers (`1817:36379` with 19 screens, `318:92961` with 56 screens) were not expanded into individual screens, so switching screens did not work like Figma Present.

## Changes

- **Schema (`vendor/jian/crates/jian-ops-schema/src/prototype.rs`, `node/base.rs`, `document.rs`)**: Added Figma-compatible `Reaction`, `Trigger`, `PrototypeAction`, `PrototypeTransition`, `PrototypeEasing`, `OverflowDirection`, `PrototypeScrollBehavior`, `OverlaySettings`, `FlowStartingPoint`, `PrototypeDeviceSpec`, and `PagePrototype`.
- **Figma `.fig` (Kiwi) & REST Prototype Import (`crates/op-figma/src/fig_prototype.rs`, `fig_prototype/kiwi_actions.rs`, `rest_adapter.rs`, `instance.rs`)**: Mapped `prototypeInteractions` (including instance `symbolOverrides`), `scrollDirection`/`overflowDirection`, `scrollBehavior`, `overlayPositionType`, `prototypeStartingPoint`/`flowStartingPoints`, `prototypeDevice`, and `SECTION` markers; resolved target GUIDs to `PenNode` IDs and pruned unset (`4294967295:4294967295`) or internal-only symbol targets.
- **Prototype Player Core (`crates/op-editor-core/src/prototype.rs` and `prototype/{graph,player,actions,behaviour,transition,smart_animate,device}.rs`)**: Built O(screens) `PrototypeGraph` (expanding Figma `SECTION` child screens and filtering stray `<100x100` icon frames) and `PrototypePlayer` supporting `Navigate`, `Overlay`, `Swap`, `ChangeTo`, `ScrollTo`, `Back`, `Close`, `SetVariable`, `SetVariableMode`, `Conditional`, `AfterTimeout`, Smart Animate layer matching, `ComponentBehaviour` state-to-variant/property derivation, and legacy `onTap`/`screen` compatibility.
- **Web Present Host & UI (`crates/op-host-web/src/preview_host.rs`, `preview_host/{device_frame,paint}.rs`, `widget_host/preview_browser*.rs`, `crates/op-editor-ui/src/widgets/preview_toolbar.rs`, `crates/op-pen-loader/src/editor_scene.rs`)**: Removed `op-preview-core` from `op-host-web` and `op-dsh-engine`; added `editor_state_roots_to_scene_nodes` for on-demand single-screen scene construction plus DPR-aware CanvasKit offscreen snapshot caching (`ScreenSnapshotCache`); added Flows/Screens sidebar grouping, title, `Restart`, and `ScaleMode` (`Fit` / `Fit width` / `Fill` / `100%`) controls to `PreviewToolbar`.
- **AI Prototype MCP Tools (`crates/op-dsh-engine/src/prototype_tools.rs`, `crates/op-mcp/src/design_prompt.rs`)**: Added `get_prototype`, `set_prototype`, `set_reactions`, `set_scroll_behavior`, and `simulate_prototype` with single-step undo and target validation.

## Validation

- `cargo fmt --all -- --check`: passed.
- `bash tools/check-file-line-cap.sh --baseline-ref 1854f5727614e9efac05c0e6b69d72a2e7bef77e`: passed (`2535 source files, cap 500, 245 non-growing legacy entries`).
- `cargo clippy --workspace --all-targets`: passed (0 errors).
- `cargo test --manifest-path crates/op-editor-core/Cargo.toml --lib prototype`: passed (`6 passed; 0 failed`).
- `cargo test --manifest-path crates/op-figma/Cargo.toml --lib fig_prototype`: passed (`2 passed; 0 failed`).
- `DSH_REAL_FIG="/Users/franklin/Downloads/Live - Widgets.fig" cargo test --manifest-path crates/op-figma/Cargo.toml --release --lib fig_prototype_schema_probe -- --ignored --nocapture`: passed (`sections=19 flows=3 reactionNodes=13 navActions=13 swapActions=0 dangling=0`).
- `cargo test -p op-dsh-engine`: passed (`70 passed` unit + `10 passed` `component_behaviour` integration, including `prototype_tools_set_flows_reactions_scroll_and_simulate_with_single_step_undo`).
- `cargo test -p op-host-web --lib --features canvaskit`: passed (`777 passed; 0 failed; 29 ignored`, including 32 preview tests).
- `bash packages/dsh-node-runtime/build-engine.sh` & `bash packages/dsh-node-runtime/build-web.sh`: passed.
- `node --test packages/dsh-node-runtime/*.test.mjs`: passed (`164 passed; 0 failed`).
- Real Chrome browser verification on imported `Live - Widgets.fig` (`http://127.0.0.1:63804/?perf=1`): verified `get_prototype` (`2 flows`, `150 screens`), Present mode entry (`42.1ms` on active page), `Flows` (`Play`, `Flow 1`) and `SECTION` screen switching (`switchFlow1Ms: 198.7ms` on 5,122-node page 5, `nextScreenMs: 47.3ms`), and Retina screen rendering via Playwright screenshots.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented Figma-compatible prototype Present viewer, .fig/REST prototype import, removal of op-preview-core dependency, and the 5 prototype MCP tools",
      "sha256": "d875d12cfedbdbf111c283ed2348737f11455b71e5fdcd59c58aa743861fec74"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Removed op-preview-core from op-host-web/Cargo.toml and registered prototype tools via library_tools; workspace members, feature boundaries (web vs canvaskit), and MCP dispatch invariants remain unchanged",
      "sha256": "18b85fa87b66ab930bb43adc960df5b44e7f58e26ef1588c76d788abe4bffe01"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "COMMANDS.md only gained the prototype test command block; coding standards and task/knowledge workflow rules are unchanged",
      "sha256": "d8026b5df631f1b5c5b8968a405e93a1f16d02d732b37e87d0cecd2e32c9ff7b"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Removing `jian_core::Runtime` from web Preview means native text-input typing and arbitrary `$state` expression evaluation are no longer executed in Present mode; interactive components and screen flows instead follow Figma's variant (`CHANGE_TO`) and prototype reaction model.
- `op-preview-core` remains in the repository for historical reference/native crates outside the active workspace (`op-dsh-engine`, `op-host-web`), but is no longer depended on by any workspace member.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "36122e7a44224c8acbc464b5b577c65530b8583c6f58425da69041590a62e6f7",
      "after": "1982f8cd63fd97c20100ac5a94d35ef0f65f5e219f371cf5ed8b8886936e8aad"
    },
    {
      "path": "COMMANDS.md",
      "before": "3503a18236b710c825c57dc56285547f5844770012592c9756496f78829d5b61",
      "after": "c3909ba235c3538cb1f36ca7993b8f3eece4f8a69dd32adcddedcda7ed6dd939"
    },
    {
      "path": "Cargo.lock",
      "before": "e25b4128eb5d3ae7cd9d5c0a9aac5f06fc9d47c074e24db198e6bed8a828ea22",
      "after": "e08a43ae639feafabb9f20440e23ce5f6a14e46126f3fb76923babe3bb0376cf"
    },
    {
      "path": "crates/op-dsh-engine/Cargo.toml",
      "before": "8b788e902125086168aaa596d84b4e33250004c442c53e9038e710048613a810",
      "after": "c44b119f5b0d5db8b517d82ab86e7e677df22908e98c636cb02230b06b71cf56"
    },
    {
      "path": "crates/op-dsh-engine/src/component_behaviour_tests.rs",
      "before": "90f60446808374e81b37dbbb9cf8013b704d04e241713188ff27d952e35cec1b",
      "after": "40ecc6bd356b7e90da71821f9df312b57bf850c259c23006fd17f50c0bfbdb99"
    },
    {
      "path": "crates/op-dsh-engine/src/library_tools.rs",
      "before": "d2ddfc1ba5ea6439d34f2c3690a56b798afd5e896892c6e80440a68bcf7b7b72",
      "after": "85e1f75265745bb8650939d5c21bfd67a39763dcbfead7bcf92c716279123e51"
    },
    {
      "path": "crates/op-dsh-engine/src/prototype_tests.rs",
      "before": null,
      "after": "44f243708d70aa67affc04b78eec87d29c83f870fd668241e9c8a1238ad52f77"
    },
    {
      "path": "crates/op-dsh-engine/src/prototype_tools.rs",
      "before": null,
      "after": "a29e9a4ced2dbdb447faa286f30b142b6d675304e08f0982bdfc6dde24e640b1"
    },
    {
      "path": "crates/op-dsh-engine/tests/component_behaviour.rs",
      "before": "2f18982c6ffc602a6b3022a5feed6177c075358ee5ef506267df5b52ec839076",
      "after": "e0485283eb9461529b1f12969137ce65132c72b19d25b366c510e9598fb8f073"
    },
    {
      "path": "crates/op-editor-core/src/components.rs",
      "before": "92737e456b346b648218e1915904ef519de68fa8e32f0f74c69d50eefe3fa364",
      "after": "d2295f3a5b895cbdcf88b0d8a2e989a0ddaffd99ceb2ac0754fcf41d9c83955d"
    },
    {
      "path": "crates/op-editor-core/src/history_bench_tests.rs",
      "before": "c4b930c9d41b2d6a72ce87262eb139b54f3817168533eedaa638e80cd77f1e8e",
      "after": "834c4d3f61b88a33894174eb6f01002e9931a7bc51fd24aacb7cd3347d65242a"
    },
    {
      "path": "crates/op-editor-core/src/history_snapshot.rs",
      "before": "074e3f23c9dcd061a11c73ddbbb1fd18100fe71cf6351daee1e332980cc2f588",
      "after": "6b15ac959c74d85d7b31ac0e54bb65c69ba339918fdd2525b50c0fb3f7ff8d6f"
    },
    {
      "path": "crates/op-editor-core/src/history_snapshot_tests.rs",
      "before": "4ce624a1c7e3b8b3ccdcca06065943c2081b83b3a58bda14e7738d86d091cd1d",
      "after": "23f9a534b361161e46c88c9654268910657abf2551804d7bafc6ce56d11b6bd2"
    },
    {
      "path": "crates/op-editor-core/src/lib.rs",
      "before": "09b8831b98065583be7ab6c7014e919ce3b3e431daf247a3271d9edfda1c4cff",
      "after": "c8003f382505ba37b358dfce7c1965dd373fb56acc57f05b93c19ecdd764cfc7"
    },
    {
      "path": "crates/op-editor-core/src/prototype.rs",
      "before": null,
      "after": "e676e1e88ed685229fc3054552883411f4a3bc2d55ed092a74f2f47ec2a30561"
    },
    {
      "path": "crates/op-editor-core/src/prototype/actions.rs",
      "before": null,
      "after": "36f7b3aa060f4535298d036f667183870a403a6563b2655c6113bb7048d7e978"
    },
    {
      "path": "crates/op-editor-core/src/prototype/behaviour.rs",
      "before": null,
      "after": "fb96c5e669c74fbb710c57044327bb576a8b99c5917096989f6c02156f5ee13a"
    },
    {
      "path": "crates/op-editor-core/src/prototype/device.rs",
      "before": null,
      "after": "6a7a39626d44ef1f43c0001e5d7039c768f58cfda99186fa4d392ce2d5af1990"
    },
    {
      "path": "crates/op-editor-core/src/prototype/graph.rs",
      "before": null,
      "after": "f42eaf5b271bec5475cdcfc0772024a886b9ce4cf7e7c4f0bee37463e11647b4"
    },
    {
      "path": "crates/op-editor-core/src/prototype/player.rs",
      "before": null,
      "after": "0d3bdcf50317a65636c7942ec5b040d55402e51af322d039a600defef0eee62f"
    },
    {
      "path": "crates/op-editor-core/src/prototype/smart_animate.rs",
      "before": null,
      "after": "20d89774bd3c11ffbd8c500dfcf5593c6899bfc02db3c32f2676a4e5e996efab"
    },
    {
      "path": "crates/op-editor-core/src/prototype/tests.rs",
      "before": null,
      "after": "6b9449c513636c0254b3a7da555185f15204f3047ba826a68d07a37452f430b0"
    },
    {
      "path": "crates/op-editor-core/src/prototype/transition.rs",
      "before": null,
      "after": "d05024ac43531dbd6537adb771c9cd7f4cb93385fcf62fb09a0b0f37a49f025d"
    },
    {
      "path": "crates/op-editor-core/src/state.rs",
      "before": "733c8b3c05df91113c69ef1a536250e5397101753fc0b3841d9ebc0376f0411e",
      "after": "90b8a2da5a16b5cf25567fef8d52066c8e4ffe06b20d0f51b007bbabdc9497ea"
    },
    {
      "path": "crates/op-editor-core/src/uikit_io.rs",
      "before": "951ca43f6944c6f684de18fed14a87fc72ce3e436788a051a0cca59ff34e40c8",
      "after": "2942c6f4044e6ed26ef0fe5bbab9a1193b3e320b8f045c9b3727c736337c3221"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/preview_toolbar.rs",
      "before": "b4728389b4918e2d551702f4e8681486456e369b10bd65c9410a4ad29415e054",
      "after": "50cc89be222d524f0b8a752eb75fb53209280259cee0f736e4a4e8bc9d68ca20"
    },
    {
      "path": "crates/op-figma/src/common.rs",
      "before": "c09097471b7fe162b145b589d20df75581ae118257c8873a5d78cc1809ceaf5f",
      "after": "a1f6cabc07085eb4d388e4d0371b41dc9f12d7ea6999f60bb9a18bdd7a8d0466"
    },
    {
      "path": "crates/op-figma/src/converters.rs",
      "before": "baa0405813389ec0580f30be348e2e5f2b88ce2fc1db08cbbcc41002561b48e9",
      "after": "4a986ec732aaaabcdcea7445e53ee9eb0cc02d05bccd3a4efbf3e5db4b608dfb"
    },
    {
      "path": "crates/op-figma/src/fig_prototype.rs",
      "before": null,
      "after": "4845014d9c08361f7c2ffb0d76ba2903811c1cbded4abc96e0af1ce8294c76ce"
    },
    {
      "path": "crates/op-figma/src/fig_prototype/kiwi_actions.rs",
      "before": null,
      "after": "041ae735831fe08b6d88da4019d5ddac3a405cdf2d28d2f951e664afda212a72"
    },
    {
      "path": "crates/op-figma/src/fig_prototype_tests.rs",
      "before": null,
      "after": "d9992b692cdfe46df8749fba55d427366788021e0aed00c95eee6d042969ea0e"
    },
    {
      "path": "crates/op-figma/src/fig_variables_probe_tests.rs",
      "before": "19d9471a5bc29f65716e1e89d280a2d51c18e5213fb443273877dff323a700d6",
      "after": "2711560fd26f6ae1a33703f1b8da657fd919fd74326cb83849f5bc502554b4be"
    },
    {
      "path": "crates/op-figma/src/instance.rs",
      "before": "82e581ec016a37e1666756316944c7d2dc89c732fd006a2c9f6e3af165821915",
      "after": "25709645f31b106b8bf393e7ea3d5ed69b381d36a1a1f4c7f0eab89de6c859bf"
    },
    {
      "path": "crates/op-figma/src/lib.rs",
      "before": "260c370933b8669b92ea0077941ae0f5d7464bc7056c2cae2795a74904f1846d",
      "after": "50713b6e206d5c90f02cb9fc74a16b3cbced5bc600dd0d5d67523079b32abf72"
    },
    {
      "path": "crates/op-figma/src/node_mapper.rs",
      "before": "ef5318ae6139e9bcd810bf383674d0713f2daa870eee8402b9b10f04d04e8b6e",
      "after": "25348e7002cf69a6167f2d1d4f6677e0df2eff13d0bb104315aaad52d8fa3815"
    },
    {
      "path": "crates/op-figma/src/rest_adapter.rs",
      "before": "9d0e43732087de89fbf1f270eb8abf74b7cc421a357a80685ee061e23c56e3f4",
      "after": "2391fd59a028629436e4c61c8f275f5874e4f2073126cc58f7cb940be2cd3e2a"
    },
    {
      "path": "crates/op-figma/src/rest_adapter/fields.rs",
      "before": "4f8e0c3be2289e8256db453ebafa9a959a210b8e0fb882d386bc35469947d0e7",
      "after": "60e6653343b6e91f1748c4a0ee820551654dfbd0f5cea46bc8797019671e946a"
    },
    {
      "path": "crates/op-host-web/Cargo.toml",
      "before": "96ee73db5c988ad3ed2d302377e359ba1ae418ea50391ea02481c118bdfd3ef1",
      "after": "5cd71a376c7fe79f0336458740d40829dbe87f81705b2ee19d920e7896f72d05"
    },
    {
      "path": "crates/op-host-web/src/preview_host.rs",
      "before": "3fa22275816f71058c153c626e1a7a773d842fb68e11b482ec8c19e19a85fbff",
      "after": "579964c58b26f3e3bbbf133d65c0f3dd1c15008eb12bca8eeb1b8b315ebeca1b"
    },
    {
      "path": "crates/op-host-web/src/preview_host/device_frame.rs",
      "before": null,
      "after": "02a76435122b925f96a10efda598db4c22590f12250a2bb70700e3bd55b7490a"
    },
    {
      "path": "crates/op-host-web/src/preview_host/paint.rs",
      "before": null,
      "after": "ac19a822580b013c85e2810e9e1f5f7a0864c4b67fb2c27875240da7f4593225"
    },
    {
      "path": "crates/op-host-web/src/video_overlay.rs",
      "before": "480392eabcdc5cdbc4455063b9f738fdaed8b57b2d1e03c5bd2676aabcdcbda2",
      "after": "ddebf120b3ba321a7fcb8c4ee353da83362a84d088d4cb75260ccd454a18aacf"
    },
    {
      "path": "crates/op-host-web/src/widget_host.rs",
      "before": "a3ea8cc283b7d2f2ec4b3abf2bd8d652852ae3dddf15010e62e6c36e0de9775b",
      "after": "613ade197a85023626aa8833e278a1f73e7e88dd9ecce2e6cf23351e80e6dee0"
    },
    {
      "path": "crates/op-host-web/src/widget_host/paint.rs",
      "before": "d23e124133614f43a0306c245779b9cb77633aee4a61155590c6f738d1fd5367",
      "after": "b488aa772a9257b1c0b47df2cdab778b43d11bc5ce7e9b38feeac0587ce26b32"
    },
    {
      "path": "crates/op-host-web/src/widget_host/press.rs",
      "before": "fb29d63d397d2205a0d30e5ce9ebf2ea8a1a960b80ef4e1b8c4f633bd3080fb8",
      "after": "db384324c076791bfd4083404b1ad5b7818be4d2b08faf7c2e31763663ca4664"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_browser.rs",
      "before": "8b48bdaf402467082c995227e3cd3360428d698cb7c1811a9e6263c8f2e9d246",
      "after": "1f610c8012b40d3c0c222df004067fb02b2ce4d1f88bd88a93801e6517de7352"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_browser_controls.rs",
      "before": "ee36beef8f4361a5c92fbd23618066cb93292e3ed5ff2c403b2b609ace5111c9",
      "after": "a999fad675ff2f7b047e9edf460a818a8870b619d59478f82a5448e2463ac100"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_frame.rs",
      "before": "11dd52d3045a50e750f027b0ed5ba4af0c918612d8428d1f4379451f277edde5",
      "after": "588b4a9448cef817fe52d973e94f8fd48aea7c6900f879dee4cb23016992c556"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_frame_teardown.rs",
      "before": "47742da795687daf081f89dd0a3dfae4214742860b842f8f97c8044ed999339a",
      "after": "71800fe3b7b49467146e6c63e4890db72c5d6b523804de8563416d82e1ba8a02"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_hover_tests.rs",
      "before": "37fcebe04d41d458da261c7046e7994b59f7ec731a1d0bca8290176006c94483",
      "after": "9b6b2628d3fc9baf7c4657eb5d2a9e500447244b8d64d2e553577f57b5259cc3"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_slideshow.rs",
      "before": "4b4233b86f6e8b461dec5a1a54ce3c3c3f08736e82e407c658ec115df2d76997",
      "after": "89afb01d7f925b87adfba8dca8e6412eaadcbb101c293f8e165322f4949e71af"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_video.rs",
      "before": "273b2c2af75864b16eff806d7ae3afab6df631972e0328f1ae00e9969d81d0a4",
      "after": "67e7d32e3225718d053d97ec9ba403c0709de4e5c629fa22dc801625dec49679"
    },
    {
      "path": "crates/op-html/src/lib.rs",
      "before": "1daf8b9df1a5e042413cc7174aa56f7b787339fece03db91a594a990506beb2e",
      "after": "dbcd6966c86db450113e2232224e3e8444330552a1ce524e9c09d2dc1e2c9fac"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "cac43632a5e2cab37ff0e67555654cd97d80249aceb8b70f238be061901d7e90",
      "after": "72706c7c0719c0fcec46af6cb226267ef7cac6efb9af0e533c89386704b72aca"
    },
    {
      "path": "crates/op-pen-loader/src/editor_scene.rs",
      "before": "c75a75eb20de77ea4f09fd3752d1d4fe99044424972d0ffc32dd83f28d7d7909",
      "after": "962403098f7439d9316f1f921663cf353fa24b963e326a540cff0177180c33d4"
    },
    {
      "path": "crates/op-pen-loader/src/lib.rs",
      "before": "ad2ded92fb25ec8133053234091282a7ef6ab0b6a5232e55994bded146be1ed8",
      "after": "2ca3db61c71d47b4d0a1b199cecc052a61f31952e4da4bd7f40ef4b552d38549"
    },
    {
      "path": "docs/kb/product.md",
      "before": "0eddfa8d1924445799553e4651c67ee4fbbbb78bd0511b09012a23a95d17d68a",
      "after": "d875d12cfedbdbf111c283ed2348737f11455b71e5fdcd59c58aa743861fec74"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "2def97d285328a565721b52c89e7af05e2f4d81d14a9f5252cd5b3d7ce17daf4",
      "after": "18b85fa87b66ab930bb43adc960df5b44e7f58e26ef1588c76d788abe4bffe01"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "f0a7391375a306e64f63985bf20b9033cc0466a4040249be412b1a5514a14a3f",
      "after": "d8026b5df631f1b5c5b8968a405e93a1f16d02d732b37e87d0cecd2e32c9ff7b"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "681bfaf2f82dcf4d8133fe185cc65a3be89d01a7312912371556cbbbaafce7fe",
      "after": "02e94d055d0f4bf70090f929812bdf77b2d35e30656dd5b9bc591c3d50a63a82"
    }
  ]
}
```

Completed-At: 2026-11-08T10:18:02.011026+00:00

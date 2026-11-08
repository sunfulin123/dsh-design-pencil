# Figma-style Present viewport: edge-to-edge fit width, min zoom = fit, no drag pan, bounded scroll, fixed bottom bar

Record-Version: 2
Task-ID: cfcc85cf-8533-48bd-b08e-4095ff4b8772
Base-Ref: 1854f5727614e9efac05c0e6b69d72a2e7bef77e
Started-At: 2026-11-08T10:33:20.734940+00:00
Type: feature
Status: complete

## Context

The browser Preview left 24/20/84px margins around the screen, allowed free drag
panning, let zoom shrink below the fitted size (0.05x) and persisted the zoom, and
floated navigation/zoom pills over the design. Figma Preview/Present (help.figma.com)
fills the stage, has no free panning, uses scale presets (Z cycles) and scrolls only
when the frame overflows. Decisions confirmed with the user: default Fit width,
continuous zoom with floor = fit, fixed top/bottom bars, bounded wheel scroll.

## Changes

- New pure module `crates/op-editor-core/src/prototype/viewport.rs`: `base_fit_scale`,
  `PresentViewport::resolve` (zoom factor clamped to [1, 4], scroll clamped per axis,
  fitting axes centred), `zoom_about` (cursor-anchored zoom).
- `op-host-web` preview browser: state is `zoom_factor` + `scroll` (no absolute zoom,
  no `pan_capture`); stage = full width between header and fixed bottom bar with zero
  margins; prototype background colour (page override, document, then #1E1E1E) fills
  the stage; default scale mode Fit width, only the scale mode is persisted.
- Input: drag/space-drag/middle-drag no longer pan; wheel/trackpad scroll is bounded;
  Ctrl/Cmd+wheel and pinch zoom at the cursor; Cmd/Ctrl +/-/0; Space/N next, R restart,
  Z cycle scale mode (`preview_present_shortcut`).
- `compute_presentation_geometry` now takes the already-placed frame rect.
- `op-editor-ui`: `PreviewToolbar::bottom_bar_rect/height` fixed bar; zoom pill
  disables "-" at fit and "+" at max via new `StatusBar::disabled`.
- Tests: viewport unit tests; preview_hover_tests rewritten for edge-to-edge fit,
  no drag movement, bounded scroll restored after Present, zoom floor; toolbar tests.
- Docs: ARCHITECTURE.md Present section, docs/kb/product.md.

## Validation

- `cargo fmt --all` — clean.
- `cargo test -p op-editor-core --lib prototype::viewport` — 5 passed.
- `cargo test -p op-editor-ui --lib -- preview_toolbar status_bar` — 11 passed.
- `cargo test -p op-host-web --lib --features canvaskit` — 776 passed, 0 failed, 29 ignored.
- `cargo clippy -p op-host-web --features canvaskit --all-targets` and
  `cargo clippy -p op-editor-core -p op-editor-ui --all-targets` — no errors.
- `cargo check --workspace` — ok.
- `bash packages/dsh-node-runtime/build-engine.sh`; `bash packages/dsh-node-runtime/build-web.sh` — ok.
- Headless Chrome 1280x800 on the managed host (Live - Widgets import): Cover fills
  width edge-to-edge at 67%, wheel scroll stops at bottom edge, mouse drag does not
  move the screen, Ctrl+- stays at fit with "-" disabled, Ctrl+wheel zooms at cursor
  up to 267% (4x) with "+" disabled, horizontal scroll stops at the left edge, search
  button resets to fit, Z switches to Fill; 1440-wide dashboard frame fills width and
  scrolls to its bottom; fullscreen Present still auto-hides controls.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Present viewport now Figma-style: edge-to-edge stage between fixed bars, default Fit width, zoom floor = fit (max 4x), no drag pan, bounded scroll",
      "sha256": "f10c79131ee0573bc7d2f75eece281ccaede207001d938878e907ba7fe4dfd40"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Old `dsh-pencil.preview.preferences.v1` entries with `zoom` are ignored (serde drops
  unknown fields); only `scale_mode` is stored now.
- Fullscreen Present keeps overlay auto-hiding controls (Figma "hide UI" behaviour);
  the fixed bars apply to the inline Preview.
- Figma device-frame presets (phone bezel scaling) are not part of this change.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "1982f8cd63fd97c20100ac5a94d35ef0f65f5e219f371cf5ed8b8886936e8aad",
      "after": "57001b15b218a2b4f4a8e79e1dd878658d5c2b7646a15eb90eaee1b60d5b77fd"
    },
    {
      "path": "crates/op-editor-core/src/prototype.rs",
      "before": "e676e1e88ed685229fc3054552883411f4a3bc2d55ed092a74f2f47ec2a30561",
      "after": "7ce72a9a0897a581daa101eed9abc0d3d375a0ca4481dcc9dc658c3d504984c4"
    },
    {
      "path": "crates/op-editor-core/src/prototype/viewport.rs",
      "before": null,
      "after": "d35c0c9766bf2105861446052f4bda8eaaf25a11a730b2a91fd4878cb729fc45"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/preview_toolbar.rs",
      "before": "50cc89be222d524f0b8a752eb75fb53209280259cee0f736e4a4e8bc9d68ca20",
      "after": "97401e51ffc7736d2728781f926b201cac2c8e4eb59f463dac6fbfe8d96c4920"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/status_bar.rs",
      "before": "0c1d8d0fcd31cf22c19e88b0e62875bdada29ba7e75bbef8a2da5eecb060c259",
      "after": "28d542d41c0a87933df14963ad8bb6deee3e9d849ef4e98bb3852dc4eba0dd47"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/mount.rs",
      "before": "100a33911b510b572e948c9da5a3c6c8e3b72b1e25990d9992b9d23a1550b975",
      "after": "1ef7e2e2c08f70a8140364e11819a053c15d7f466e7e060fc73d849cf90433c6"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/mount_keyboard.rs",
      "before": "e794a118f02326be192933644dd193904723d3003dd8ac8198c2b650e0d2cbcb",
      "after": "66c006da2abdbc748d3c426b11de05c6d911381fd1d967c075fb439ef63f43a3"
    },
    {
      "path": "crates/op-host-web/src/preview_host/device_frame.rs",
      "before": "02a76435122b925f96a10efda598db4c22590f12250a2bb70700e3bd55b7490a",
      "after": "140316f239ad0cc9d31d6d59e2964927bb241f0b72ecfe701e32ce40d778c6ae"
    },
    {
      "path": "crates/op-host-web/src/preview_host/paint.rs",
      "before": "ac19a822580b013c85e2810e9e1f5f7a0864c4b67fb2c27875240da7f4593225",
      "after": "bb3fba9540b61b17397ed996157d48a9b45a54f5d559427cb5e1ee4b2d86f8dd"
    },
    {
      "path": "crates/op-host-web/src/widget_host/paint.rs",
      "before": "b488aa772a9257b1c0b47df2cdab778b43d11bc5ce7e9b38feeac0587ce26b32",
      "after": "5e3495f69e07f7fefb49a9c42482277a9e78a524d45107050121e2c3b9ebc916"
    },
    {
      "path": "crates/op-host-web/src/widget_host/press.rs",
      "before": "db384324c076791bfd4083404b1ad5b7818be4d2b08faf7c2e31763663ca4664",
      "after": "7c3277ff4ceddb84f263f77e6f9e34b50eae7b218df7c8d565d150d9630ffa61"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_browser.rs",
      "before": "1f610c8012b40d3c0c222df004067fb02b2ce4d1f88bd88a93801e6517de7352",
      "after": "dd973e4ad8e0efe4cd9005ce40109801d26f7473cddcb58ad10d5216ee09659b"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_browser_controls.rs",
      "before": "a999fad675ff2f7b047e9edf460a818a8870b619d59478f82a5448e2463ac100",
      "after": "0fab30d60416dc46b3e10c44a3b43eee6cb5cd9828d2111923f45236ec0ae8a3"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_frame_teardown.rs",
      "before": "71800fe3b7b49467146e6c63e4890db72c5d6b523804de8563416d82e1ba8a02",
      "after": "451259954c57984d72ade4e9210f662b34c799ee8f1e4ea14f34b3760e50ee40"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_hover_tests.rs",
      "before": "9b6b2628d3fc9baf7c4657eb5d2a9e500447244b8d64d2e553577f57b5259cc3",
      "after": "73c0e277680fde4b8bc565526250ce9a520d3234da675239667e01ffde29c914"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_slideshow.rs",
      "before": "89afb01d7f925b87adfba8dca8e6412eaadcbb101c293f8e165322f4949e71af",
      "after": "b5b2a1280ad9bc906c7a1b0e5914e7d58e4061fe1f72566e72b7b76f557e43b8"
    },
    {
      "path": "crates/op-host-web/src/widget_host/wheel_pan.rs",
      "before": "b65a393e1aa330898deec4cc8e0157ec7d29f416143fb75bf3e473da9144a06c",
      "after": "28d83e310904f87186294fa9e37968bffeba4519f2e2202b8fe14f0ef25b1834"
    },
    {
      "path": "docs/kb/product.md",
      "before": "d875d12cfedbdbf111c283ed2348737f11455b71e5fdcd59c58aa743861fec74",
      "after": "f10c79131ee0573bc7d2f75eece281ccaede207001d938878e907ba7fe4dfd40"
    }
  ]
}
```

Completed-At: 2026-11-08T11:01:55.108951+00:00

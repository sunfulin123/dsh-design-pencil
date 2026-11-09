# Fix right property panel textarea/input caret visibility, vertical baseline alignment, and text overflow truncation

Record-Version: 2
Task-ID: c671e310-6234-4cd9-bf1d-fc96dc998509
Base-Ref: 239a40266c6fcb350701a59d8e23f605a432a05f
Started-At: 2026-11-09T08:09:13.053021+00:00
Type: fix-bug
Status: complete

## Context

In the right-hand Design property panel (`PropertyPanel`), form controls exhibited three UI defects:
1. Focused `Textarea` controls (`paint_textarea_with_label`, used by Component Description, Markdown, DTCG Design Tokens, Interaction Action, Accessibility Label, and Design Note) rendered through single-line `paint_text_input_view_value` with `pad_x = 0.0` and `tokens.foreground = theme.foreground` (`theme.muted_foreground` in `Theme::managed`). Long content failed to wrap (scrolling horizontally and cutting off leading text), and when the caret reached the right edge of the content area it was clipped out by `clip_rect`, appearing faint or invisible.
2. Unfocused / variable-bound single-line inputs and dropdown triggers across the panel (`paint_fill_solid_body` with bound `$variable`, `paint_stroke_hex_text`, `paint_fill_gradient_body`, `paint_one_fill`, `paint_input_with_suffix_focused_state`, `paint_input_with_icon_focused_state`, `paint_labeled_input`, `paint_background_input`, `paint_icon_name_row`, `paint_text_section` font/weight triggers, `paint_effect_row`, and `property_panel_components`) painted raw text without `fit_chrome` (`…` truncation) or box clipping, causing long values such as `$asset_knowledge-carousel--c-accent` to overflow out of the input pill and overlap adjacent buttons.
3. Focused `Textarea` and custom-height inputs passed tall content rects (`content_h = 34px` or `54px`) to `TextInputView` while anchoring glyph drawing at the top line (`content_y + 13.0`) via `BaselineAdjustingBackend`; because `TextInputView` centers its caret vertically in `rect.size.y`, the caret rendered 7–17px below the text line. In addition, `property_panel_components::paint` passed `Some(edit.caret)` unconditionally to unfocused `ComponentDesign` inputs.

## Changes

- `crates/op-editor-ui/src/widgets/property_panel_text_input.rs`:
  - Updated `paint_textarea_with_label` to render focused multiline state through `jian_widgets::components::text_area::TextArea` with `BaselineAdjustingBackend { baseline_delta_y: 11.0 }`, matching the unfocused line wrap width (`avail_w`) and first-line baseline (`content_y + 12.0`), keeping the caret aligned on every wrapped line and unclipped at the right edge.
  - Updated `paint_text_input_view` to center `view_rect` vertically on the glyph run (`text_baseline_y - 4.0`) and reserve right-side clip room when `pad_x < 2.0`, preventing right-edge caret clipping and vertical drift on non-standard input heights.
  - Set `tokens_from_theme` foreground to `theme.secondary_foreground` so focused inputs and textareas render high-contrast text and carets in `Theme::managed` while remaining identical to `theme.foreground` in `Theme::dark()` / `Theme::light()`.
  - Added shared `paint_single_line_input_value` and `paint_text_dropdown_trigger` helpers that unify focused `TextInputView` rendering, unfocused `fit_chrome` (`…`) truncation, and box clipping.
- `crates/op-editor-ui/src/widgets/property_panel_inputs.rs`, `property_panel_fill_body.rs`, `property_panel_fill.rs`, `property_panel_stroke.rs`, `property_panel_layer.rs`, `property_panel_page.rs`, `property_panel_text.rs`, `property_panel_icon.rs`, `property_panel_effects.rs`, `property_panel_components.rs`:
  - Routed single-line input value painting and dropdown triggers through the shared truncation-and-clip helpers and fixed `property_panel_components::paint` to pass `edit.caret_at(focus)` / `edit.input_at(focus)` instead of unconditional `Some(edit.caret)`.
- `crates/op-editor-ui/src/widgets/property_panel_text_tests.rs`:
  - Added regression tests covering focused textarea caret-to-text vertical alignment (58px and 78px heights), multiline wrapping and unclipped caret on long text, fill/stroke bound variable ellipsis truncation, and single-line suffix/icon input truncation and caret alignment.
- `tools/code-line-baseline.json`:
  - Ratcheted down legacy line-cap entries for `property_panel_components.rs`, `property_panel_fill.rs`, `property_panel_inputs.rs`, and `property_panel_text.rs`.

## Validation

- `cargo fmt --all -- --check`: passed.
- `cargo test -p op-editor-ui --lib`: passed (1929 passed, 0 failed).
- `cargo test -p op-host-web --lib --features canvaskit`: passed (778 passed, 0 failed, 29 ignored).
- `cargo clippy -p op-dsh-engine -p op-host-web -p op-editor-ui --all-targets`: passed (0 errors; pre-existing warnings only).
- `cargo clippy -p op-host-web --lib --features canvaskit`: passed (0 errors; pre-existing warnings only).
- `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-web.sh`: passed (rebuilt release WASM bundle).
- `node --test packages/dsh-node-runtime/*.test.mjs`: passed (171 passed, 0 failed, 6 skipped).
- `PYTHON=.venv-lint/bin/python bash tools/check-file-line-cap.sh`: passed (2550 source files, cap 500, 245 non-growing legacy entries).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [],
  "none_reason": "Reviewed docs/kb/product.md, docs/kb/standards.md, and docs/kb/canvas-resources.md; this change fixes widget-level text truncation and caret layout in op-editor-ui property panel inputs without altering product boundaries, MCP tool contracts, or CanvasKit resource lifecycle invariants."
}
```

## Risks and follow-up

- `jian_widgets::TextInputView` and `TextArea` remain vendored under `vendor/jian`; the baseline and clip adjustments are applied in `op-editor-ui`'s `property_panel_text_input` wrapper so vendored crates stay untouched.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_components.rs",
      "before": "dbe933d683f92a1f4a37b64fd0afdd4c452165742ed44897604577e337e59c3d",
      "after": "fbed79fc234782230d1bd82f1166d98d84571cce4574d6efa2b836d2fc009870"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_effects.rs",
      "before": "8d2ef2896499e0432c2387cd8fd1ffcf00c6207ac65b8cdd7ba0edf51994dfbf",
      "after": "eb1858a9c92bb4d62492cedcac3eb02b780225e89d1844cf1a035907f66eddde"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_fill.rs",
      "before": "b488d9dd711bfc9c32f4359a8a24c9ea8856a6fe0c48c8c531544bcfcc7af7dc",
      "after": "10baa000c33cf77c654b3010d8fbe77506b9a15a0f26303b20d9351e91e21507"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_fill_body.rs",
      "before": "312d26211c38665cb90b3fb761d0beaca3ab005efae5e1e621f406a1c81422e1",
      "after": "3acaf046a7aa0c5c1020eea52dd8bae39ac0c43c6be1b87ca42b0184fa7c78ae"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_icon.rs",
      "before": "f250dc3b65e13901ddcb3934f25bdabe327eac926c8f3c712ea087b9a8d09af4",
      "after": "b74a3401ae12c249575fa620061987139328d8d7d80b62c26d82fffd2dd3bfe2"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_inputs.rs",
      "before": "48e0ef1e396397e5e5490f70f089e93fd302ced24652ad4c623ccf9d3f79ea1d",
      "after": "68940c064019c9b6c0f34a6761a1e2c2c5a18eacb6fa384772728c74bbf94e66"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_layer.rs",
      "before": "3189be8ecaf0f02de450cd42e6c9d7899243c91963ed2077d2e595fc1a22281b",
      "after": "ab80b136e82cf90cfa1b9cf91253daf8b986761658a41b6fab410242b6cf9749"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_page.rs",
      "before": "46054d3b890dc9dde854e82df373b84c83e2693b5658c91f841d0894c6faaee4",
      "after": "512ece5787674d510a3faed1fec56d80435983b37a685ed9cfa1dab463dc777b"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_stroke.rs",
      "before": "9c502bdf7bfb39f77a15e5d60045528ec8f4489b58ffbf5b5c8e30e2443251f8",
      "after": "5433c25ef99fad60ee6d020d8082b3e361b0bf1920e746be24fe2c967eb23e31"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_text.rs",
      "before": "88ae55fad7f5ef0435b188bd4030268a748941d88c05606e126afcd7a35a6e1a",
      "after": "4af17e599acd2ff03dd988525bcf7cb9c28dea2d848e014a1a4957602db948f5"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_text_input.rs",
      "before": "fc92091bb7931a248d1466adda8ceda0156100851cdb03a0048bc3d66c4f8a70",
      "after": "f28d9086374f2b2aca950082f78645bcdf4f3bf57defb5fda827eaf8869ce639"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/property_panel_text_tests.rs",
      "before": "f2764d2127d55c056a599d8a862f624b82a54475f96ee4e9f7114afb3fc4bb2a",
      "after": "8d49706e96db102312530a9489a3eee3ef809de74478923cc39ccd162c8ea56a"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "bba13ddecff70e668edce6cf3a2e0a672d207e84a6882a4128bb1adfa4d9a869",
      "after": "9e3fec52567ff0bd604cb6b3e7ca3993cf4b6b3ac31b89437ce22e0e4c8b9717"
    }
  ]
}
```

Completed-At: 2026-11-09T08:57:03.474833+00:00

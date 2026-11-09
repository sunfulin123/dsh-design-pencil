# Fix authored text geometry tile clipping and Preview tall-screen aspect ratio stretching

Record-Version: 2
Task-ID: 2a0711ee-2f38-4187-a3f3-cb34abd32285
Base-Ref: d97f946d778acef1f98ff2e148d394af66110596
Started-At: 2026-11-09T06:44:40.126625+00:00
Type: fix-bug
Status: complete

## Context

After importing `/Users/franklin/Desktop/aether-store/index.html` into the live web editor and repeatedly dragging/resizing the browser container width:
1. In Design mode, text across the canvas was clipped/covered at 128px boundaries (disappearing during click-hold when `node_drag` forced live rendering, and reappearing when moving the mouse out to retained `CanvasTiles`), and repeated window width resizing left a blurry strip at the top/left edges.
   - Root cause A: `op-html` snapshot text emits single-line runs with `width: None, limits.min_width: Some(rect.w)` and multi-line runs with `height: None, limits.min_height: Some(rect.h)`, while `crates/op-pen-loader/src/authored_geometry.rs` ignored `limits.min_width`/`min_height` and produced `0.0` width or height in `preserve_authored_geometry` mode. During 256×256 tile rasterization, `subtree_intersects_cull` culled those text nodes in every tile beyond their origin tile, leaving only the parent background fill.
   - Root cause B: `CkInner::resize_to_window` called `backend.resize_for_display` (which drops all JS tiles via `dropAllTiles()`) without clearing `self.host.canvas_tiles`. On the next rAF, `raster_canvas_tiles` rasterized queued tiles before `paint_dyn`, and then `composite` failed to draw a batch mixing pre-resize dead IDs and newly rasterized IDs and wiped `self.entries.clear()`. In addition, `composite` queued `overview_cells()` (1/8-scale full-document overview taking ~1,000ms on tall multi-board docs) before `plan.missing`, causing `fill_from_fallback` to satisfy outer viewport tiles with the blurry 1/8-scale overview texture.
2. In Preview mode, tall screens (e.g. `1440 × 3370` at `dpr = 2` in `Fit width`) appeared horizontally squished / vertically stretched (~1.42×) with the bottom truncated.
   - Root cause: `paint_single_screen` in `crates/op-host-web/src/preview_host/paint.rs` clamped `px_w` and `px_h` independently to `MAX_SNAPSHOT_DIMENSION` (`4096`), rasterized only the top `4096` device pixels at `raster_fit = fit * dpr`, and then `backend.draw_tiles` stretched that `src = (0, 0, px_w, 4096)` texture over the full `clip_rect` (`5842` device pixels tall).

## Changes

- `crates/op-pen-loader/src/authored_geometry.rs`: Updated `size_of` and `numeric_size` across all `PenNode` variants to fall back to `limits.min_width` and `limits.min_height` when explicit numeric `width`/`height` are absent, plus `text_size` estimation fallback for `PenNode::Text`.
- `crates/op-pen-loader/src/snapshot_scene_tests.rs`: Added `snapshot_text_nodes_preserve_min_width_and_min_height_in_authored_geometry` unit test.
- `crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs`: Added `node_own_visual_rect` so non-truncated `NodeKind::Text` nodes include conservative horizontal and vertical glyph/wrap slack in `subtree_visual_bounds` / `subtree_intersects_cull`, plus `text_node_intersects_adjacent_horizontal_and_vertical_tiles` unit test.
- `crates/op-host-web/src/preview_host/paint.rs`: Updated `paint_single_screen` to only use the single-tile `SNAPSHOT_CACHE` when both `clip_rect.size.x * dpr <= 4096.0` and `clip_rect.size.y * dpr <= 4096.0`, falling back to direct `paint_tile_content` rendering for taller/wider screens so aspect ratio and full page height are preserved at native `dpr`. Added `tall_screen_exceeding_4096_device_px_paints_directly_without_stretching_snapshot_tile` unit test.
- `crates/op-host-web/src/widget_host/canvas_tiles.rs`: Added `clear_retained(&mut self)`, reordered `composite` queue priority (`plan.missing` and `plan.stale` before `overview_cells()` and `plan.prefetch`), and queued surviving tile IDs in `self.drops` if `draw_tiles` fails on a partial batch.
- `crates/op-host-web/src/canvaskit/inner.rs`: Updated `resize_to_window` to call `self.host.canvas_tiles.clear_retained()` and `crate::preview_host::invalidate_preview_snapshots()` after `resize_for_display`.
- `docs/kb/canvas-resources.md` and `docs/kb/html-import.md`: Updated and reviewed KB invariants for resize context lifecycle, Preview 4096px snapshot threshold, and snapshot text authored geometry / tile culling bounds.

## Validation

- `cargo fmt --all -- --check` — passed (0 diffs).
- `cargo clippy -p op-dsh-engine -p op-host-web --all-targets` — passed (0 errors).
- `cargo clippy -p op-host-web --all-targets --features canvaskit` — passed (0 errors).
- `cargo clippy -p op-pen-loader -p op-editor-ui --all-targets` — passed (0 errors).
- `cargo test -p op-pen-loader --lib snapshot_scene_tests` — passed (`2 passed; 0 failed`).
- `cargo test -p op-pen-loader --release --lib load_canonical_accepts_5000_deep_visible_frame_tree` — passed (`1 passed; 0 failed`).
- `cargo test -p op-editor-ui --lib` — passed (`1925 passed; 0 failed`).
- `cargo test -p op-host-web --lib --features canvaskit` — passed (`778 passed; 0 failed; 29 ignored`).
- `cargo test -p op-dsh-engine --lib` — passed (`72 passed; 0 failed`).
- `bash packages/dsh-node-runtime/build-engine.sh && bash packages/dsh-node-runtime/build-web.sh` — passed.
- Playwright browser verification against `/Users/franklin/Desktop/aether-store/index.html` imported with `viewports: [1440, 390]` across repeated viewport width resizes (`1785 → 1400 → 1100 → 920 → 1250 → 1006`): verified Design mode tiles render all text without 128px seam clipping or top/left overview blur, and Preview mode renders the full `1440 × 3370` screen without vertical stretching or 4096px truncation.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "updated",
      "reason": "Updated resize context lifecycle and Preview 4096px snapshot invariants after fixing CanvasTiles clear_retained on resize_to_window, prioritizing missing/stale viewport tiles over overview_cells, and bypassing single-tile snapshot cache when Preview screen exceeds 4096 device px.",
      "sha256": "746e237bf8517369b2bd38377a2860b12b0cccdf607a93724e4ce13611d3b89c"
    },
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "Documented authored_geometry fallback to limits.min_width/min_height for browser snapshot text nodes and conservative text visual bounds for 256x256 tile culling.",
      "sha256": "47bebe41593b0fc46a7ca5fd57eeeabc35a3afba7b24838fe44851e2a5a3e0f0"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Preview screens whose device-pixel height or width exceeds `4096` bypass the single-tile `SNAPSHOT_CACHE` and render directly via `paint_tile_content` clipped to `clip_rect`. If future profiling shows scrolling very tall screens in Preview needs offscreen caching, `SNAPSHOT_CACHE` can be extended to a multi-strip vertical tile cache.
- Pre-existing unrelated test issues outside the modified paths (`crates/op-codegen/src/tests.rs` missing `prototype` field in `PenDocument` literal, and `crates/op-host-web/tests/font_stack_resolution.rs` string match on `bundledTypefaces.set`) were left untouched per task scope rules.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs",
      "before": "f9416e77fde1e7cb5b78561d863dc1169e80859cc9e4685c79fe4afb71ef945c",
      "after": "57cd63c964627896ded9c66cb5a8dd2a22918cd7086a6b2c13225c0721a1c408"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/inner.rs",
      "before": "5c070d983a132f16111446f41f3ea68eb26baebb9e49578970c4a44d55a333f7",
      "after": "4360f05d5668d16c9fc7c0c495266e270fa5d743c63946e67cf419f0155072eb"
    },
    {
      "path": "crates/op-host-web/src/preview_host/paint.rs",
      "before": "bb3fba9540b61b17397ed996157d48a9b45a54f5d559427cb5e1ee4b2d86f8dd",
      "after": "95c04f36d6c121bf586f8989ce5fe2fc36bf32193d8d0c6c03eb05ff9afd3e96"
    },
    {
      "path": "crates/op-host-web/src/widget_host/canvas_tiles.rs",
      "before": "7d8713b9df109fc2d0f9b91489b46a9057336d7de0bd9cae82963ee7d33faafb",
      "after": "d07d96e7f153efa7b0c072d9a0755fbf31df9d83f52fae8b424f509ed9e24ee6"
    },
    {
      "path": "crates/op-pen-loader/src/authored_geometry.rs",
      "before": "77ffc6c5f3596cad51254f1d53d9b1254ea7e7b4575540f7f72495ec3c6cf2a5",
      "after": "64d1cb457ef5c4aab8d386811ebad6b7eb070d70f9df85571be1c40cb88b9a8d"
    },
    {
      "path": "crates/op-pen-loader/src/snapshot_scene_tests.rs",
      "before": "672765132ae761b15bcd43b6eda7ab29067b0e968b120b0798d4ae2efa34a04c",
      "after": "366c8fd393d1813d6175dd7de8e2889e125cbd6b2d4b34c746baa1ccc907fee0"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "97c733e3edde15fda40700fec11fe2a59a196ab12de340c176c2c5f33fc2812b",
      "after": "746e237bf8517369b2bd38377a2860b12b0cccdf607a93724e4ce13611d3b89c"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "aad0621b4e399f455d050a96bd2de974225fed20dcccfafdfe76e4a15263a00f",
      "after": "47bebe41593b0fc46a7ca5fd57eeeabc35a3afba7b24838fe44851e2a5a3e0f0"
    }
  ]
}
```

Completed-At: 2026-11-09T07:38:40.411400+00:00

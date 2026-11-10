# CanvasKit 资源与瓦片生命周期

范围：浏览器 CanvasKit tile renderer，不泛化为所有 GPU API 的保证。

## snapshot 必须保留所属 surface

[bridge 的 endTile](../../crates/op-host-web/src/op_ck_bridge.js) 保存
`{ image, surface: target }`，而不是 snapshot 后立即删除 target。
image 可能共享 surface 纹理；过早删除会出现缓存中有 ID 但绘制为空白的情况。
dropTile/dispose 应释放配套 image 和 surface。只测“创建成功”捕捉不到问题。

## resize 是 context 生命周期边界

同一 bridge 的 resize 重新创建 WebGL surface，旧 context 的 tile 不能继续使用。
[resize_to_window](../../crates/op-host-web/src/canvaskit/inner.rs) 在调用
`resize_for_display` 后必须同步清空 [host cache](../../crates/op-host-web/src/widget_host/canvas_tiles.rs)
（`clear_retained`）与 [preview snapshot cache](../../crates/op-host-web/src/preview_host/paint.rs)
（`invalidate_preview_snapshots`），避免下一帧 `raster_canvas_tiles` 先在 `paint_dyn`
之前把新瓦片写入新 context、随后 `composite` 因混杂旧 ID 绘制失败而把刚光栅化的新瓦片一并清空。
`composite` 入队顺序必须优先当前视口的 `plan.missing` 与 `plan.stale`，再排 `overview_cells`
与 `plan.prefetch`，防止多画板长文档的 1/8 概览瓦片抢占视口主瓦片造成缩窄窗口后顶部/左侧边缘模糊。
[host glue](../../crates/op-host-web/src/widget_host/canvas_tiles_host.rs)
必须处理 missing tile、重新计划和完整内容兜底；不能把旧 ID 当成有效纹理。
Preview 模式的单瓦片快照上限为 4096×4096 设备像素；当画板 `clip_rect.size * dpr` 任一维超过
4096（例如长网页在 `Fit width` 下）时，[paint_single_screen](../../crates/op-host-web/src/preview_host/paint.rs)
必须跳过单瓦片缓存直接绘制，不能独立截断 `px_h = 4096` 再把截断纹理拉伸到完整画板高度。

复验：先跑 `cargo test -p op-host-web --lib --features canvaskit canvas_tiles` 和
`cargo test -p op-editor-ui canvas_tile` 的 geometry/cache 回归；
这些单元测试不能证明 GPU 纹理可见，仍需在隔离浏览器中做 populate → resize →
快速 pan/zoom → 停止的截图差异与空白检测。
同一文档以 `?tiles=0` 的 live render 为视觉对照，`?perf=1` 开启帧计时。
灰色区域可能是真实设计内容，不能仅按“灰像素多”判定空白。

改图片/字体失效或渲染路径时，同时验证视觉一致性、无空白/闪烁和交互分位耗时，
而非仅看平均 FPS。

## 顶层设计边界

[编辑器边界](../../crates/op-editor-ui/src/widgets/canvas_viewport/root_boundaries.rs) 在场景绘制后以屏幕像素描画未选中的顶层画板和分组，并复用节点翻转及旋转；选中对象使用原有高亮。
该提示属于编辑器覆盖层，不进入文档、场景预览或文档截图。显式页面背景优先于编辑器的默认画布底色。

## 文本度量与基线（Figma 一致性）

画布文本必须按绘制所用字体测量，并与 Figma 的未 hinting 布局一致：

- [bridge](../../crates/op-host-web/src/op_ck_bridge.js) 的 `textFont` 统一开启 linear metrics、
  subpixel 并关闭 hinting。默认 CK.Font 把每个字形 advance 取整，Roboto 14px 文本比 Figma
  宽 1–3px，造成字距不均并触发 auto-width 缩字。
- [text_edit_layout](../../crates/op-editor-ui/src/widgets/canvas_text_edit.rs) 的换行、
  auto-width 缩放、对齐和光标都必须用节点字体族测量（`measure_text_family_styled`）；
  family-blind 测量在浏览器里用系统字体（SF Pro），会让标签缩小、居中偏移、换行错误。
- [文本绘制](../../crates/op-editor-ui/src/widgets/canvas_viewport_text.rs) 把每行基线取整到
  文本框内的整像素（Figma 规则）；拉丁文 `middle` 用字体 ascent/descent 居中（Figma/CSS），
  仅 CJK 行用墨迹居中。小数基线会被光栅化吸附，产生 ±0.5px 偏移。
- 混合字体的文字绘制与鼠标命中使用相同的字体度量；编辑器按 grapheme 边界移动或删除，
  而对外文字工具的范围使用 Unicode scalar 偏移。点击属性面板时选区保留，
  文本源改变后不得继续使用旧选区。

复验：`node --test crates/op-host-web/tests/op_ck_bridge_text_metrics.test.mjs`；
`cargo test -p op-editor-ui --lib canvas_text_edit canvas_viewport_text`。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "59e60cab-d63f-490b-8fbc-144f1b7867c8",
  "verified_at": "2026-11-10T04:43:24.408226+00:00",
  "sources": {
    "crates/op-host-web/src/op_ck_bridge.js": "0d64f916a1c08d196ac558b290ee92ff753e0989e1030e288bcaeacdfc3452ab",
    "crates/op-host-web/src/canvaskit/inner.rs": "c3605933aeedc32e5acd0db1c7f6ff98002e7f87cdc16398692f67502e86252b",
    "crates/op-host-web/src/preview_host/paint.rs": "95c04f36d6c121bf586f8989ce5fe2fc36bf32193d8d0c6c03eb05ff9afd3e96",
    "crates/op-host-web/src/widget_host/canvas_tiles.rs": "d07d96e7f153efa7b0c072d9a0755fbf31df9d83f52fae8b424f509ed9e24ee6",
    "crates/op-host-web/src/widget_host/canvas_tiles_host.rs": "4cd5f6eac913da31300cad53dcde7eebc7b0a91cf8ab652fa0021e95d612acc9",
    "crates/op-editor-ui/src/widgets/canvas_tiles.rs": "6b90bbe62de6a5ec8068658beb912f1e19ec737a39dfb9c1f5c944e6287f3616",
    "crates/op-editor-ui/src/widgets/canvas_text_edit.rs": "3efc6a59d28417535aa191f0b5695c8240396837dfcaba8dcd1b0b58181dc743",
    "crates/op-editor-core/src/text_edit_rich.rs": "839dc71de88719eb7a34ee607532b5d7c7df2907e90121ae13c8b848daf6bc76",
    "crates/op-host-web/src/widget_host/text_edit_pointer.rs": "e7cd2499632ae81ef735c79631a25ddeeef1e6eba0ff5d7e61da48f5eccead1c",
    "crates/op-editor-ui/src/widgets/canvas_viewport_text.rs": "25df6837e4b19062c3cd976bd8894d5ab125821a4159a9a1f8e2b402ec97231b"
  },
  "reason": "Review editor-only root outlines and authored page background precedence.",
  "evidence": "CanvasViewport editor versus scene preview regression and host screenshot paint inspection."
}
```

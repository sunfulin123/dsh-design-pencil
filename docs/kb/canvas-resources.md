# CanvasKit 资源与瓦片生命周期

范围：浏览器 CanvasKit tile renderer，不泛化为所有 GPU API 的保证。

## snapshot 必须保留所属 surface

[bridge 的 endTile](../../crates/op-host-web/src/op_ck_bridge.js) 保存
`{ image, surface: target }`，而不是 snapshot 后立即删除 target。
image 可能共享 surface 纹理；过早删除会出现缓存中有 ID 但绘制为空白的情况。
dropTile/dispose 应释放配套 image 和 surface。只测“创建成功”捕捉不到问题。

## resize 是 context 生命周期边界

同一 bridge 的 resize 重新创建 WebGL surface，旧 context 的 tile 不能继续使用。
[host cache](../../crates/op-host-web/src/widget_host/canvas_tiles.rs) 与
[host glue](../../crates/op-host-web/src/widget_host/canvas_tiles_host.rs)
必须处理 missing tile、重新计划和完整内容兜底；不能把旧 ID 当成有效纹理。

复验：先跑 `cargo test -p op-host-web --lib --features canvaskit canvas_tiles` 和
`cargo test -p op-editor-ui canvas_tile` 的 geometry/cache 回归；
这些单元测试不能证明 GPU 纹理可见，仍需在隔离浏览器中做 populate → resize →
快速 pan/zoom → 停止的截图差异与空白检测。
同一文档以 `?tiles=0` 的 live render 为视觉对照，`?perf=1` 开启帧计时。
灰色区域可能是真实设计内容，不能仅按“灰像素多”判定空白。

改图片/字体失效或渲染路径时，同时验证视觉一致性、无空白/闪烁和交互分位耗时，
而非仅看平均 FPS。

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

复验：`node --test crates/op-host-web/tests/op_ck_bridge_text_metrics.test.mjs`；
`cargo test -p op-editor-ui --lib canvas_text_edit canvas_viewport_text`。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "b3f56376-1e0c-4097-b48b-ce0eadca2f5f",
  "verified_at": "2026-11-08T17:09:44.043651+00:00",
  "sources": {
    "crates/op-host-web/src/op_ck_bridge.js": "0d64f916a1c08d196ac558b290ee92ff753e0989e1030e288bcaeacdfc3452ab",
    "crates/op-host-web/src/widget_host/canvas_tiles.rs": "7d8713b9df109fc2d0f9b91489b46a9057336d7de0bd9cae82963ee7d33faafb",
    "crates/op-host-web/src/widget_host/canvas_tiles_host.rs": "4cd5f6eac913da31300cad53dcde7eebc7b0a91cf8ab652fa0021e95d612acc9",
    "crates/op-editor-ui/src/widgets/canvas_tiles.rs": "6b90bbe62de6a5ec8068658beb912f1e19ec737a39dfb9c1f5c944e6287f3616",
    "crates/op-editor-ui/src/widgets/canvas_text_edit.rs": "54132a7a2322ddfdc1efc29c0383fe13429f7de45a110718cea6d792f68d603f",
    "crates/op-editor-ui/src/widgets/canvas_viewport_text.rs": "0b0b3e7c8494cd1d5644945c0335652290afbb7d281f316ce141fb888e6c7c71"
  },
  "reason": "Refreshed op_ck_bridge.js provenance after adding pushDropShadowLayer (MakeDropShadow); text-metric and tile lifecycle invariants remain verified.",
  "evidence": "node --test crates/op-host-web/tests/*.test.mjs — 14 passed; cargo test -p op-host-web --lib --features canvaskit — 777 passed"
}
```

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

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "c431c060-64bc-4c0a-b495-5b0f7ef35dba",
  "verified_at": "2026-11-07T14:24:12.487366+00:00",
  "sources": {
    "crates/op-host-web/src/op_ck_bridge.js": "292b4bd05bf1917bba8fba9477ab0131db505bccc196c6723ea7b76eb3e2789a",
    "crates/op-host-web/src/widget_host/canvas_tiles.rs": "7d8713b9df109fc2d0f9b91489b46a9057336d7de0bd9cae82963ee7d33faafb",
    "crates/op-host-web/src/widget_host/canvas_tiles_host.rs": "4cd5f6eac913da31300cad53dcde7eebc7b0a91cf8ab652fa0021e95d612acc9",
    "crates/op-editor-ui/src/widgets/canvas_tiles.rs": "6b90bbe62de6a5ec8068658beb912f1e19ec737a39dfb9c1f5c944e6287f3616"
  },
  "reason": "Retained bounded lifecycle claims after inspecting endTile, dropTile and resize; no new GPU visibility guarantee was added.",
  "evidence": "cargo test -p op-host-web --lib --features canvaskit canvas_tiles — 5 passed; bridge lifecycle source inspected. Not run: fresh real-GPU/browser acceptance; existing text explicitly requires it."
}
```

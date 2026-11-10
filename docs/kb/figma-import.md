# Figma 导入还原不变量

范围：`.fig`（op-figma kiwi + instance 展开）与 REST 链接导入，以及 `compare_figma_fidelity` 验收。

## 实例尺寸变化遵循 Figma 约束

实例与组件尺寸不同时，[common.rs](../../crates/op-figma/src/common.rs) 的 `InstanceResize`
按 Figma 规则处理子节点：自由 frame 中按 `horizontal/verticalConstraint`（缺省 = MIN，
`.fig` 从不显式写 MIN），auto-layout 中流式子节点保持尺寸、仅 grow/stretch 吸收差值，
`uniformScaleFactor`（Scale 工具）才整体等比缩放。统一比例缩放曾把 Dock 应用格从 40px 拉到 48px。

## derived 数据优先

[apply.rs](../../crates/op-figma/src/instance/apply.rs)：derived 的 `size/transform/fillGeometry/
strokeGeometry` 是 Figma 解算结果，覆盖 override 中的组件默认值；`derivedTextData.layoutSize`
与统一的字形 `fontSize` 决定文本框（[text_cache.rs](../../crates/op-figma/src/text_cache.rs)
压缩时必须保留）。变体共享 `overrideKey`，[swap_filter.rs](../../crates/op-figma/src/instance/swap_filter.rs)
不得把新组件仍寻址的 key 当作过期数据丢弃。

## 透明图层与重复几何

opacity 0 的图层要保留（参与 auto-layout、可编辑）；只跳过 `visible:false`。
[vector_decoder.rs](../../crates/op-figma/src/vector_decoder.rs) 对 fill-override 区域的重复轮廓去重，
否则 even-odd 相互抵消导致图标消失。

## Group、样式版本与变量不透明度

- `.fig` Kiwi 将 `GROUP` 编码为 `type="FRAME"` + `resizeToFit=true`，[converters.rs](../../crates/op-figma/src/converters.rs)
  需转入 `convert_group`（不裁剪、保留 `effects`）；REST [rest_adapter.rs](../../crates/op-figma/src/rest_adapter.rs)
  中 `GROUP` 子节点的 `relativeTransform` 已相对父节点，不得重复叠加父级镜像。
- [style_references.rs](../../crates/op-figma/src/node_mapper/style_references.rs)：`styleIdForEffect`
  必须像 fill/stroke 一样覆盖节点上的占位 `effects`，且库样式按 `key:<key>@<version>` 精确索引版本。
- [paint_vars.rs](../../crates/op-figma/src/paint_vars.rs)：绑定颜色变量（`colorVar`）时，变量自身的
  `colorValue.a` 取代画笔上残留的绑定前 `opacity`；绑定到文档变量 `$var` 时不再重复携带 `opacity`。
- 非矩形轮廓节点（`Group`、无背景 `Frame`、`Path` 等）的外阴影通过 CanvasKit `MakeDropShadow`
  图层按内容 alpha 轮廓投射（[shapes.rs](../../crates/op-editor-ui/src/widgets/canvas_viewport_paint/shapes.rs)），
  仅 `Frame`/`Rect` 矩形背景才使用矩形阴影，避免在手势图标背后画出灰方块。

## 验收口径

[figma-fidelity.mjs](../../packages/dsh-node-runtime/figma-fidelity.mjs) 用 `isolate:true` 截图（同 Figma
节点导出，不画祖先/兄弟），结构比较使用旋转与祖先镜像后的包围盒（同 `absoluteBoundingBox`）。
像素比 ≤1% 目前做不到：剩余差异主要是字形光栅化/字体版本（Google Roboto v3 vs Figma 内置）的抗锯齿，
1px 容差下 >32 色阶差异约 0.2–0.3%。

复验：`cargo test -p op-figma`；`node --test packages/dsh-node-runtime/figma-fidelity.test.mjs`；
真实验收用隔离 host 导入同一画板，对 REST 与 `.fig` 各跑 scale 1/2 的 `compare_figma_fidelity`。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "5dcaea20-8276-42e7-919d-e4bc2255561f",
  "verified_at": "2026-11-10T11:13:34.196841+00:00",
  "sources": {
    "crates/op-figma/src/common.rs": "d2c228b5c2817982399b5809e7a6efdf83b015c7e1758c1c140d2bc885742b2f",
    "crates/op-figma/src/instance/apply.rs": "5abb04389085ec6edb402a7611d12e76928ba55954468c6019db0152b2a0e023",
    "crates/op-figma/src/text_cache.rs": "5a2fd670c31cb9d119753e67769609cc130ccb0fe7d6baf08a550baf303f0fd8",
    "crates/op-figma/src/instance/swap_filter.rs": "83b6a2eb97b5f05dd339fe17990ab59f99bd13ce02ac5cc6c2a2ab2e771a1f32",
    "crates/op-figma/src/vector_decoder.rs": "2dad929e805a0ba0269217ad3bb652dba2f30b6ea616cd68d1607dea82ca2d4e",
    "crates/op-figma/src/converters.rs": "bf8f7f514e9c0e8686e5017d563a58ee7b3d523525904df4e5e1382bb568a3e6",
    "crates/op-figma/src/rest_adapter.rs": "f098907b687f6e9e549f7dfac01e21b7c3232918c15480752be6fa077cc6c985",
    "packages/dsh-node-runtime/figma-fidelity.mjs": "7617f6c7f74d15abfc355da1118ee0894bfa2967f1cf62d41b6171d4bc582ffb",
    "crates/op-figma/src/node_mapper/style_references.rs": "17bddcf8e2ffe191b901f75a48b8b94defaf3cfe344be178363286d60bba8af6",
    "crates/op-figma/src/paint_vars.rs": "e922588c31a6b33995b2678f0e289a4aeed8d2e4309a98394f146aede88bf78f",
    "crates/op-editor-ui/src/widgets/canvas_viewport_paint/shapes.rs": "f418e3e3358a01bb25048fefbd594457e4027dd3b61cdf9584d917c2e3cd29b9"
  },
  "reason": "Reviewed the only initializer change: the new preview flag defaults to None; Figma instance sizing and import behavior remain unchanged.",
  "evidence": "cargo test --manifest-path crates/op-figma/Cargo.toml --lib: 297 passed, 4 ignored."
}
```

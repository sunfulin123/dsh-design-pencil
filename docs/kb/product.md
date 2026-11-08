# 当前产品知识入口

范围：当前 DSH Rust/WASM 引擎、Node MCP host 和浏览器设计页面，不泛化为保留的上游产品。

## 产品边界与能力

[架构](../../ARCHITECTURE.md) 是当前实现的权威数据流与所有权说明。
AI 通过 Node host 调用 WASM 引擎；浏览器 CanvasKit 展示设计并提供真实截图。
只读 SDK 不是第二套编辑器；保留 crate 或旧文档不能证明能力已经接入当前产品。

工具能力以 [catalog](../../crates/op-dsh-engine/src/tool_catalog.rs) 和实际执行入口为准。
开发新能力需同时核对发现、调用、参数错误、事务/版本、页面同步及真实输出。
不要把“schema 存在”当成“AI 已可正确设计”的证据。

[开发验收](../../DEVELOPMENT.md) 的 AI 链路：
建页 → 设计 → 截图 → lint → 修复/调整 UI → 截图；暂不要求导出代码。
部分完成、近似 renderer 或 skipped 浏览器测试不能当成真实产品验收。

复核：对照架构、tool catalog 和对应实际 MCP 测试；更改产品范围或工具能力时更新本条。
具体 runtime/脚本/截图边界见 [runtime-mcp](runtime-mcp.md)，渲染约束见
[canvas-resources](canvas-resources.md)。过期 provenance 不可当成当前产品事实。

## AI 可复用设计资产

managed host 已接模板配置/实例化/保存、风格库与 DESIGN.md 导入、文档主题预设
导入/导出/应用，以及独立的编辑器亮暗主题确认工具，具体名称见
[命令入口](../../COMMANDS.md#mcp-设计资产)。
默认按绑定文档目录隔离持久化，显式资产目录可跨文档共享；UI 与 MCP 查询同一来源。
模板包含 reusable component 依赖；主题预设应用和模板插入均可一次 undo。
删除库资产不删除已插入节点，不把资产 revision 当作文档版本。
库模板更新只影响后续插入；已有实例保留原变量值。变量及主题轴按插入隔离，
源主题默认选择和节点覆盖仍有效，不重新染色目标文档已有设计。

DESIGN.md 可导入共享风格库或当前文档规范。绑定共享风格会将规范/变量应用到设计，
供后续 AI 使用；单独保存或改名库资产不会隐式修改当前设计。
编辑器主题是外观偏好，不是设计变量主题；默认临时应用，持久化必须 opt-in，
宿主强制主题、离线 editor 或未确认时不能宣称成功。
直接 WASM 缺持久化宿主时会明确拒绝宿主工具；内置查询及文档规范工具仍可用。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "6feafc4e-5363-47a4-9db0-483ee4b6380b",
  "verified_at": "2026-11-08T01:45:26.462253+00:00",
  "sources": {
    "ARCHITECTURE.md": "9fbf2c089843aded398af71fc09d858562055744fde9b1bc29dbf4a83bb290c0",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "COMMANDS.md": "493f8561b7258f7c5c2f8e1ea9967a19d7b3daf1b3dc6bf82cb5eef571ee5dc8",
    "crates/op-dsh-engine/src/tool_catalog.rs": "e048f175e7c07438b78764318b8429bfc114a3a155abef75ec5c7dca6cb3103b"
  },
  "reason": "Rechecked persistent asset ownership, complete tool discovery, shared UI application and template update isolation against the architecture and final runtime acceptance.",
  "evidence": "Final DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs: 162 passed, zero skipped; Rust engine 60 unit and 10 integration passed; rebuilt engine and real CanvasKit bundle."
}
```

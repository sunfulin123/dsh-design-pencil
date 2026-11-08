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
CLI 默认持久化到用户级资产目录（`DSH_ASSET_DIR` / `--asset-dir` 可覆盖），因此 DSH
每次用临时草稿启动也能保留自定义风格和预设；旧文档旁资产库启动时一次性合并。
UI 与 MCP 查询同一来源。
模板包含 reusable component 依赖；主题预设应用和模板插入均可一次 undo。
删除库资产不删除已插入节点，不把资产 revision 当作文档版本。
库模板更新只影响后续插入；已有实例保留原变量值。变量及主题轴按插入隔离，
源主题默认选择和节点覆盖仍有效，不重新染色目标文档已有设计。

DESIGN.md 可导入共享风格库或当前文档规范。绑定共享风格会将规范/变量应用到设计，
供后续 AI 使用；单独保存或改名库资产不会隐式修改当前设计。
编辑器主题是外观偏好，不是设计变量主题；默认临时应用，持久化必须 opt-in，
宿主强制主题、离线 editor 或未确认时不能宣称成功。
直接 WASM 缺持久化宿主时会明确拒绝宿主工具；内置查询及文档规范工具仍可用。

## 默认风格与变量库

Talkdesk Cobalt 是源码内置、排第一的默认风格（`talkdesk-cobalt` 风格指南、
`style-defaults` 技能和设计 agent 协议均以它为默认）与变量库。AI 直接引用
`$--primary-9` 等库变量，首次使用即随别名导入文档；库更新需人工接受。
`.fig` 导入保留变量集合、模式与绑定，Cobalt 集合按 key 关联。原因：Figma 的库/集合
语义让导入文件、AI 生成和变量面板一致。复验见
[命令入口](../../COMMANDS.md#变量库talkdesk-cobalt)。

## Figma 式原型与 Present

全屏 Present 预览由 `op-editor-core::prototype` 与 `op-host-web::preview_host` 驱动，
已移除 `op-preview-core`（`jian_core::Runtime`）依赖：进入成本 O(画板数)，按需单画板构建场景并带
CanvasKit 快照缓存，支持 Figma `SECTION` 子画板展开、Flows/画板侧栏切换、Navigate/Overlay/Swap/ChangeTo/Back
交互、Smart Animate 与转场动画，以及组件 `Behaviour` 变体/属性覆盖派生。Present 视口与 Figma 一致：
零边距、默认 Fit width、缩放不低于适配尺寸、无拖动平移、滚动受边界约束、控件在固定顶栏/底栏不遮挡设计。`.fig` 与 REST 导入自动保留
flows、reactions、overflow/scrollBehavior；AI 通过 `get_prototype`、`set_prototype`、`set_reactions`、
`set_scroll_behavior`、`simulate_prototype` 编写并自检原型。复验见 [命令入口](../../COMMANDS.md#原型与-present)。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "cfcc85cf-8533-48bd-b08e-4095ff4b8772",
  "verified_at": "2026-11-08T11:00:30.606374+00:00",
  "sources": {
    "ARCHITECTURE.md": "57001b15b218a2b4f4a8e79e1dd878658d5c2b7646a15eb90eaee1b60d5b77fd",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "COMMANDS.md": "c3909ba235c3538cb1f36ca7993b8f3eece4f8a69dd32adcddedcda7ed6dd939",
    "crates/op-dsh-engine/src/tool_catalog.rs": "32f1d1c04d0d1d0f3d91106cadd68ad3ac00c8a9bc6ab231a7bf92814bd8048c"
  },
  "reason": "Present viewport now Figma-style: edge-to-edge stage between fixed bars, default Fit width, zoom floor = fit (max 4x), no drag pan, bounded scroll",
  "evidence": "cargo test -p op-editor-core --lib prototype::viewport (5 passed); cargo test -p op-host-web --lib --features canvaskit (776 passed); cargo test -p op-editor-ui --lib preview_toolbar status_bar (11 passed); Chrome 1280x800 screenshots on Live-Widgets"
}
```

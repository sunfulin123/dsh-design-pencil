# 当前产品知识入口

范围：当前 DSH Rust/WASM 引擎、Node MCP host 和浏览器设计页面，不泛化为保留的上游产品。

## AI 设计风格

OP 设计指导采用对话、现有文档和风格目录三层上下文。新设计未指定风格时由宿主呈现
实际风格目录并推荐 Talkdesk Cobalt，预选本身不代表用户确认；已有设计默认沿用其设计规范。
核心运行时提供 `synapse-design` Skill，DSH 宿主在创建新草稿前收集已有对话和所选 Project 的相关资料，
只就影响设计的未知业务事实补问；模型仍需如实说明读取了哪些资料及哪些资料不可用。
未完成的设计草稿按聊天隔离保存在工作区 `.synapse/op-design`，模型切换后可恢复。
统一 `synapse-design` 在需求上下文充分后允许用户选择 HTML POC 或直接制作可编辑设计；
已明确指定的流程不重复询问。内置 `synapse-design-html` 负责 HTML POC，使用
`.synapse/html-design`，与可编辑设计读取同一产品风格目录。POC 交接绑定会话、任务、
风格与文件指纹；缺失或变更的资料需要重新核实。插件的工具路由和记录行为需要宿主测试，
不能以提示词代替独立模型验收。
提问或比较某种风格并不等于选择；只让 AI 决定布局或颜色，也不等于委托其选择主题。
AI 按需检查布局和真实截图、修复并复测；不可用的检查必须如实说明。

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

## 人工微调与 AI 目标

右侧属性面板将设计系统和文字专业设置默认折叠；展开状态只属于当前编辑器会话。
画布中选中文字后，常用文字控件只改变所选范围；光标处的待输入样式只作用于后续输入，
删除全部富文本后仍可设置后续输入样式。
选中对象及可选文字范围由 DSH 宿主显示在聊天输入区；提交消息时固定目标供后续 AI 使用。
实时生成草稿允许人工微调：宿主串行化人工和 AI 写入并检查版本，确认检查点后才应答；
发布前需同步并暂时锁定已连接的画布。选区无法确定时报告不可用，而不切换到后来的选择。
是否可由模型完整执行仍需核对宿主工具接入和实际模型验收，不能由面板入口推断。

浅色外观的编辑器画布默认使用 `#F4F4F4`，深色外观默认使用白色；页面显式背景优先。
未选中的顶层画板和分组有编辑器边界提示，提示不进入文档或文档截图。
系统设备外框只作画布装饰，预览页面来自实际设计；`previewAsScreen` 可控制一个画板
是否作为独立预览页，而不会隐藏页面内部的背景，也不改变普通导出页列表。

## AI 可复用设计资产

managed host 已接风格库与 DESIGN.md 导入、文档主题预设导入/导出/应用，
以及独立的编辑器亮暗主题确认工具，具体名称见 [命令入口](../../COMMANDS.md#mcp-设计资产)。
内置风格为 Talkdesk Cobalt 加 84 份社区 DESIGN.md（原文随 Rust/WASM 打包），
空目录跳过，旧的其他内置风格已删除。模板功能及模板工具、文档、预览和生成器已删除。
CLI 默认持久化用户风格和预设到用户级资产目录，UI 与 MCP 查询同一来源。打开已有文档时，
旧文档目录中的风格与主题预设会一次性合并到用户目录；已移除的模板不会导入或重新启用。
内置清单按应用场景记录分类，未指定分类的用户风格显示为未分类；目录提供内容指纹以验证风格选择。
预设应用可一次 undo；删除库资产不删除已有文档内容，资产 revision 与文档版本独立。

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

## 网页导入

`import_html` / `import_html_url` 默认在 headless Chrome 中渲染页面再导入计算布局（脚本内容、
媒体查询、Web 字体、canvas 像素、原生控件），`viewports` 一次生成多个断点画板；无 Chrome 时
回退静态 CSS 引擎并在结果中标明 `renderMode:"static-css"`。`compare_html_fidelity` 是导入验收入口。
不变量与口径见 [html-import](html-import.md)，复验见 [命令入口](../../COMMANDS.md#html-导入与保真验收)。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "b6721655-aac8-44fd-9c80-b538ced3ac29",
  "verified_at": "2026-11-10T13:58:43.940693+00:00",
  "sources": {
    "ARCHITECTURE.md": "7e48dda7beb4d4a85a2d2d129d72f965011aabba5069567cbd896198db06114f",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "COMMANDS.md": "b61536e66d1ce87d818a48e69e104329603101e3f70ec481cbb28c034fae11f4",
    "crates/op-dsh-engine/src/tool_catalog.rs": "328a762641bfc6e199e2c95b0ebafe5fddb34387393118ea94cdda1098e83001",
    "crates/op-editor-core/src/text_selection.rs": "270195a858b26d0a27ece525db94258ecc543877cd7b60b913499ae34a9a7956",
    "crates/op-editor-core/src/text_selection_summary.rs": "adb1df6ef6b63d135351fbfc3ce91f26e16e58b35ff57547f2d9bae2280f6609",
    "crates/op-editor-core/src/text_insertion.rs": "666f8cd67867e665045a403d65d7fc0353b42f62e4b733c2aa084d4c5d39ec2d",
    "crates/op-host-web/src/web_clipboard.rs": "99a5719ff1cda613df019fe36ddbb6268f6c2400ec91da6ac5923c2f140b166b",
    "crates/op-ai-skills/skills/synapse-design/SKILL.md": "5111cb87e2fd2bbc5af66f1782e1dfff5b297706914a45429751c1866f8fe2e4",
    "packages/dsh-node-runtime/design-style-plan.mjs": "d9c39a8bb75a580697619b1ae9b462760d6bf88f631505d0d8df141cb5014725",
    "packages/dsh-node-runtime/asset-tools.mjs": "5aef23a27f2165cda16647908a140e24c84f3653f03ec1601655fb1bc2fcbc80",
    "packages/dsh-node-runtime/asset-directory.mjs": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7",
    "crates/op-host-web/src/selection_push_queue.rs": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca",
    "crates/op-host-web/src/vscode_bridge/selection_history.rs": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6"
  },
  "reason": "Interactive private drafts and message-bound selection change the product editing behavior.",
  "evidence": "Isolated real runtime and Chrome checks exercised selected-node capture and human draft writes; plugin lifecycle tests checked version conflicts and publication barriers."
}
```

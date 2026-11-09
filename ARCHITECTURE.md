# 当前 DSH 架构

本页定义当前产品边界；[crates/CLAUDE.md](crates/CLAUDE.md) 保留更细的上游模块说明，
其中 native/desktop/旧 shell 命令不一定属于当前 workspace。

## 运行时与所有权

```text
AI / DSH 宿主
    │ JSON-RPC MCP / managed lifecycle
    ▼
Node host（packages/dsh-node-runtime）
    ├── EngineSession → op-dsh-engine WASM
    │                      └── op-mcp → EditorCommand → EditorState / PenDocument
    ├── 文档版本、存储、冲突与增量同步
    └── 截图请求 → 活跃浏览器 / 独立 headless Chrome
                           │
                           ▼
                 op-host-web WASM → op-editor-ui → CanvasKit bridge
```

- [Cargo.toml](Cargo.toml) workspace members 只有 `op-dsh-engine`、`op-host-web`。
  `op-editor-core/ui`、`op-mcp`、`op-figma`、`op-pen-loader` 等是共享 path dependency。
- [DesignEngine](crates/op-dsh-engine/src/lib.rs) 持有 Rust editor state。
  设计语义与 undo/redo 使用已有 command；Node 不复制 Rust 编辑规则。
- [tool_catalog](crates/op-dsh-engine/src/tool_catalog.rs) 是 AI-facing tool 的发现/schema 入口，
  `DesignEngine::call_tool` 分发调用；Node 增强导入、截图等宿主能力。
- [EngineSession](packages/dsh-node-runtime/engine-session.mjs) 管理文档缓存及变更；
  [node-host](packages/dsh-node-runtime/node-host.mjs) 管请求队列、同步、生命周期与资源释放。
  Node 的文档 content version 不等于浏览器临时选择/相机状态。
- [op-host-web](crates/op-host-web/src/lib.rs) 负责事件和浏览器 widget host；
  平台无关 widget 留在 `op-editor-ui`，不能引入原生窗口/网络/GPU依赖。
- SDK 是只读 viewer adapter，不是另一套可编辑文档或 MCP 实现。

## 同步与错误

文档 fingerprint 覆盖 content generation/revision 和 editor metadata。
页面 patch 只用于能准确描述的变更；full reset 必须保留完整重同步路径。
浏览器写入使用 baseVersion 防止覆盖并发编辑；content、selection、metadata 的
版本/历史语义分别测试，不能把“HTTP 成功”视为“设计事务成功”。

截图等待不能持有 renderer bootstrap 所需的 mutation queue。
真实/近似 renderer 必须在结果中区分；颜色或 UI 验收不能接受不明来源的截图。
输入失败、回滚和宿主拒绝必须成为明确 tool error，不能吞掉后返回成功。

## 共享设计资产

[AssetStore](packages/dsh-node-runtime/asset-store.mjs) 用 Node 标准库 SQLite 持久化
用户模板、风格原始 Markdown 和 `.optheme` JSON；同目录的多个 host 共用事务与
`assetsRevision`，不同目录相互隔离。CLI 默认使用用户级目录
（[asset-directory](packages/dsh-node-runtime/asset-directory.mjs)：`DSH_ASSET_DIR`，否则
macOS `~/Library/Application Support/dsh-design-pencil/assets`、Linux XDG data、Windows
`LOCALAPPDATA`），因此每次用临时草稿文件启动的 DSH 会话共享同一资产库，重启不丢失。
显式 `--asset-dir` 优先。旧的文档旁 `.dsh-design/assets` 在启动时一次性、非破坏性合并，
旁边写 `migrated.json` 防止删除的资产复活；合并失败只写 stderr，不阻止启动。
直接调用 `startNodeHost` 的库调用方未传目录时仍使用文档旁目录。

[资产工具](packages/dsh-node-runtime/asset-tools.mjs) 同时服务 MCP 与 `/api/assets`。
目录只返回元数据，正文按稳定 id 获取；目录读取期间 revision 改变会明确拒绝，
不会发布混合快照。用户资产更新/改名/删除要求 `expectedRevision`；内置资产只读。
模板限 50 个，单个 payload 和目录响应限 32 MiB；list 工具提供分页。
Rust [资产语义](crates/op-dsh-engine/src/asset_semantics.rs) 复用已有解析、模板引用改写、
变量/图片合并及命令；实例化和主题加载各占一个 undo，Node 保留未知节点扩展。
保存模板包含选中节点引用的跨页 reusable master；删除资产不删除已插入的设计。
MCP 和共享 HTTP API 的设计变更均经过原有 draft autosave。
每次托管模板插入使用不冲突且兼容公式语法的命名空间；更新库模板不会重写旧实例。
变量定义中的别名/公式与节点引用一起改写，完整别名可包含 slash；
公式标识符遵循变量解析器的共享语法，slash 在公式中仍是除法。
模板主题轴、默认选择和节点主题覆盖一起隔离，不改变目标文档原有主题。

浏览器 [ManagedAssets](crates/op-editor-core/src/managed_assets.rs) 是每个 EditorState
独立的目录视图，不写进进程全局用户 registry，也不进入文档历史。
[同步桥](crates/op-host-web/src/managed_assets_sync.rs) 复用轻量版本 probe，仅 revision
变化时拉目录；主题预设正文全部验证后按目录顺序一次发布。UI 导入/保存/删除在
持久化确认后更新，未同步的设计不能直接保存或加载资产。绑定风格会将规范及变量
同步到当前文档；不会只改一个不可供 AI 使用的装饰性 pin。

[EditorControl](packages/dsh-node-runtime/editor-control.mjs) 等待真实编辑器确认主题，
不持有其 poll/ack 或文档写入所需的队列。有效主题优先级：
embedding host override > 临时 MCP override > 设备偏好。
`persist` 默认 false；true 必须确认 effective 和 preference，保存失败/宿主强制主题/
无编辑器/超时均明确报错。render-only Chrome 不冒充交互编辑器。

## 变量集合与内置库

变量模型对齐 Figma：`PenDocument.variableCollections` 记录集合（集合名即 `themes` 中的
主题轴，模式即轴值，首个为默认；单模式集合不建轴）、来源库 id/key/version 和成员。
[variable_library](crates/op-editor-core/src/variable_library.rs) 从源码内逐字保存的
`libraries/talkdesk-cobalt/` 解析内置 Talkdesk Cobalt 库（排第一、为默认），集合 key 与
Figma 团队库一致。库变量在文档中用 CSS 名（`--primary-9`），别名写成 `$--purple-9`。

文档只保存用到的库变量：[library_tools](crates/op-dsh-engine/src/library_tools.rs) 在
`call_tool` 前扫描参数中的库变量名，在 state 副本上按别名闭包导入后执行工具，与工具
产生的修改合成一个 undo；只读或失败的调用不留下导入。库更新只提示不自动应用
（`get_library_updates` / `accept_library_updates`，变量面板底部同样提供接受入口）。
重命名库变量即与库解除关联。`cornerRadius`、`fontSize` 等纯数值字段不接受 `$` 引用，
AI 指南只把库变量用于颜色、gap、padding、opacity。

`.fig` 导入经 [fig_document_variables](crates/op-figma/src/fig_document_variables.rs) 保留集合、
模式、别名和文件保存时的值；key 匹配内置库的集合关联到该库并使用 CSS 名。
[paint_vars](crates/op-figma/src/paint_vars.rs) 仅在文档按节点主题解析出的颜色与 Figma
渲染值一致时把 SOLID paint 绑定为 `$name`（引用旧库版本或半透明缓存的保持烘焙值），
并把显式模式写成节点 `theme` 覆盖。DESIGN.md frontmatter 的 `colors`（`dark-*` 合并为
`Mode` 轴的同名变量）、`rounded`、`spacing` 同步为变量。

## 原型与全屏 Present

原型 schema（[prototype.rs](vendor/jian/crates/jian-ops-schema/src/prototype.rs)）镜像 Figma Plugin API
与 Kiwi 结构：节点携带 `reactions`、`overflowDirection`、`scrollBehavior`、`overlay`、`section`、
`flowStartingPoint`；文档携带 `prototype`（`flows`、`device`、`backgroundColor`）。
[fig_prototype](crates/op-figma/src/fig_prototype.rs) 与 [rest_adapter](crates/op-figma/src/rest_adapter.rs)
在 `.fig` 与 REST 两条导入路径提取原型数据，并将 Figma GUID 目标改写为 `PenNode` ID，剔除悬空或内部缓存符号目标。
[op-editor-core::prototype](crates/op-editor-core/src/prototype.rs) 提供纯数据、O(画板数) 进入的
`PrototypeGraph` 与 `PrototypePlayer`（展开 Figma `SECTION` 子画板、支持 Navigate/Overlay/Swap/ChangeTo/ScrollTo/Back/SetVariable 等动作、Smart Animate 图层匹配与转场插值，以及将 `ComponentBehaviour` 与旧 `onTap` 派生为交互），不再依赖 `op-preview-core` 或 `jian_core::Runtime`。
Web 宿主（[preview_host](crates/op-host-web/src/preview_host.rs)、[preview_browser](crates/op-host-web/src/widget_host/preview_browser.rs)）
按需单画板构建场景并结合 CanvasKit 离屏纹理快照缓存渲染全屏 Present（含顶栏、Flows/画板侧栏、缩放模式切换与底部翻页）。
Present 视口规则由纯函数 [viewport](crates/op-editor-core/src/prototype/viewport.rs) 决定，与 Figma 一致：
舞台夹在固定顶栏与固定底栏之间、零边距，默认“Fit width”铺满宽度；缩放下限为适配尺寸、上限 4 倍，
以光标为锚点；不支持拖动平移，滚轮仅在画板超出舞台时做受边界约束的滚动；快捷键 ←/→/Space/N、R、Z、Cmd/Ctrl ±/0。
AI 通过 [prototype_tools](crates/op-dsh-engine/src/prototype_tools.rs)（`get_prototype`、`set_prototype`、
`set_reactions`、`set_scroll_behavior`、`simulate_prototype`）读写并无头验证原型流程。

## HTML 导入

`import_html` / `import_html_url` 由 Node 编排：[html-import-tool](packages/dsh-node-runtime/html-import-tool.mjs)
用 [headless Chromium](packages/dsh-node-runtime/chrome-cdp.mjs) 渲染页面（每个视口一次，等待网络空闲、
字体与可选 `readyExpression`），以 Rust 的 `snapshot-extractor.js` 采集计算样式，并附加 canvas 像素与原生控件状态，
再逐个画板交给 `import_web_snapshot`；Rust（op-html `snapshot*`）只负责映射为节点。
页面用到的字体经共享 FontFetcher 注册给 CanvasKit。没有 Chrome 时回退纯 Rust 静态 CSS 引擎并标记
`renderMode:"static-css"`。`compare_html_fidelity` 在 host 渲染源页并与真实 CanvasKit 截图比对。
不变量见 [KB](docs/kb/html-import.md)。

## 画布渲染

- 纯 tile geometry/planning 在 [canvas_tiles](crates/op-editor-ui/src/widgets/canvas_tiles.rs)。
- host 缓存在 [canvas_tiles](crates/op-host-web/src/widget_host/canvas_tiles.rs)，
  预算及失效接线在 [canvas_tiles_host](crates/op-host-web/src/widget_host/canvas_tiles_host.rs)。
- [CanvasKit bridge](crates/op-host-web/src/op_ck_bridge.js) 持有 GPU image/surface；
  相机交互复用瓦片，动态覆盖层实时绘制，缺瓦片时仍需完整内容兜底。
- 文档、图片、字体、context resize 的失效生命周期必须一致。
  详细已验证陷阱见 [KB](docs/kb/canvas-resources.md)。

## 维护 harness

[行数检查器](tools/check_code_line_cap.py) 用语法 token 统计实际代码行，
[baseline](tools/code-line-baseline.json) 仅记录旧债。
[任务工具](tools/task_notes.py) 生成独立记录、快照自有文件并校验/完成或归档任务；
[共享状态](tools/task_state.py) 使用 Git 解析当前 worktree 私有目录，支持 `.git` 为文件的 linked worktree。
快照保存内容指纹，不保存源码正文。一个 worktree 只登记一个活动任务，不能自动归因外部并发编辑。
初始快照逐项校验自有路径和 SHA-256；缺失或损坏的指纹不能解释为新增文件。
JSON 保存任务登记；标准库 SQLite 事务锁协调任务/知识写操作，进程退出自动释放操作锁。
归档保留未完成状态和变更证据，释放活动登记，不冒充完成。
[知识工具](tools/knowledge.py) 对 KB provenance 的来源指纹和复核证据进行检查，
来源变化或删除必须重新复核；文字语义与实际验证真实性仍由 review 核对。
[harness 检查器](tools/check_harness.py) 校验 notes：本地使用显式 Task-ID，
CI 排除 base 中已闭合的 Task-ID，按最近完成的新 v2 记录核对当前文件和知识指纹；
较早记录保留当时指纹，旧格式仅保留为历史。
两者由 [maintenance wrapper](tools/check-maintenance.sh) 和
[CI](.github/workflows/maintenance.yml) 调用，无需启动产品或接触用户文档。

## 架构修改要求

变更所有权、同步协议、公开接口、队列、缓存失效或 crate 依赖时：
在本页更新真实数据流/边界，并在任务 notes 中写决策、备选、兼容/迁移和回滚方式。
只有跨任务可复用且经验证的结论进入 KB；不要把设想当成既定架构。

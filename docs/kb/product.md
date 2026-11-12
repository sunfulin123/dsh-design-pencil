# 当前产品知识入口

范围：当前 DSH Rust/WASM 引擎、Node MCP host 和浏览器设计页面，不泛化为保留的上游产品。

## AI 设计风格

OP 设计指导采用对话、现有文档和风格目录三层上下文。新设计未指定风格时由宿主呈现
实际风格目录并推荐 Talkdesk Cobalt，预选本身不代表用户确认；已有设计默认沿用其设计规范。
核心运行时提供 `synapse-design` Skill，DSH 宿主在创建新草稿前收集已有对话和所选 Project 的相关资料，
只就影响设计的未知业务事实补问；模型仍需如实说明读取了哪些资料及哪些资料不可用。
未完成的设计草稿按聊天隔离保存在工作区 `.synapse/op-design`，模型切换后可恢复。
统一 `synapse-design` 默认跟随用户当前会话语言提问与生成界面文案（目标脚本为中日韩时启用 CJK 排版规则），
在需求上下文充分后通过固定选项顺序（`options[0]` 先做 HTML POC、`options[1]` 直接制作高保真设计）或显式结构化
`route` 参数确认路线，并通过结构化 `styleMode`、`styleId`、`platform`、`newTask` 与 `autoContinue` 参数驱动
风格与画布规划，不在宿主或运行时中硬编码特定自然语言词表。内置 `synapse-design-html` 作为 `synapse-design` 的内部子 Skill
（`user-invocable: false`，仅模型可加载而不暴露为独立斜杠命令）负责 HTML POC，使用
`.synapse/html-design`，与可编辑设计读取同一产品风格目录。POC 交接绑定会话、任务、
风格与文件指纹；录制完成后既支持下一轮直接用户消息确认，也支持同一轮内通过 `ask_user_question`
（含规范问题 ID `synapse-design-poc:<taskId>` 的固定选项顺序或会话内后续问答确认）立即衔接
`resolve` 进入高保真设计，无需用户额外补发单独聊天消息；缺失或变更的资料需要重新核实。插件的工具路由和记录行为需要宿主测试，
不能以提示词代替独立模型验收。
HTML POC 资源包含按需加载的旧检查方法、可选脚本和资源清单；旧主题库与备用配色不是
风格来源。`synapse-design/2` 与 `synapse-design-html/2` 按编号阶段组织执行，共享引擎中立的
[判断与底线规范](../../crates/op-ai-skills/skills/synapse-design-html/references/judgement.md)
（界面类型取舍、六类内容状态、表单与下拉右侧箭头 12–16px 留白、文案、12 项质量底线及五维评审），新设计完整提示同时内联
[引擎构建指南](../../crates/op-ai-skills/skills/synapse-design/build.md)（骨架到填充、Hug/Fill 契约、
横向行宽与下拉箭头间距、中文字体与标点行距、关联组件与变量绑定），局部编辑提示不内联整套新设计底线。
DSH 上下文阶段要求实质性需求摘要与显式页面清单；POC 交接拒绝任务目录内的符号链接，校验任务目录中的
`DESIGN.md` 指纹、`evidence-report.json` 台账（含 `renderedEvidence` 截图哈希与源文件指纹）
以及带页面与视口宽度的真实 PNG 截图；高保真发布前翻完交互目标分页并核对绑定当前截图哈希的结构化
评审回执（每个计划页面映射独立的非空容器节点或省略原因、五维视觉观察、六类状态、组件复用说明，
同一轮连续三次未通过则终止），视觉回执仍只证明绑定记录而非独立模型推理质量。上述无宿主依赖的选区
CanvasKit 精确渲染与墨迹测量、PNG 编解码、系统设备外框、代码上下文净化、草稿画布/质量/评审门禁、POC
台账 schema 校验及受管 MCP/守护进程客户端协议统一由 `packages/dsh-node-runtime` 实现并随运行时分发，
DSH 插件仅保留宿主会话、沙箱文件边界与前端交互适配。
大画布分区创建和按需浅层读取，避免将完整图层树反复加载到模型上下文；具体执行结果仍需实测。
截图已采集不等于模型已经查看；改变原型或截图会使旧的评审证据失效。
HTML POC 的 [capture-poc](../../crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs)
可从核心 Skill 源码或已打包运行时调用，并使用真实 Chromium 生成截图。
提问或比较某种风格并不等于选择；只让 AI 决定布局或颜色，也不等于委托其选择主题。
AI 按需检查布局和真实截图、修复并复测；不可用的检查必须如实说明。
Skill 要求 AI 分页读取目标画板的 lint，结合角色、布局和截图区分确认的问题与建议，
只修改已确认的问题；同级差异和嵌套深度不是批量改写或删除节点的授权。
DSH 私有草稿通过 `synapse_design_pipeline_context` 转发 `lint_document` 及其分页游标；
质量面板的单页结果不代表已读完全部 lint。
对于结构和语义相同的重复设计，Skill 提示 AI 发现或创建真正关联的组件实例，保留文本、
样式和交互差异；独立复制不等同于关联复用。检查结果只是候选，是否抽取仍由设计上下文决定。
交互区域检查按实际布局给出分级建议，AI 需要结合设备、相邻控件和裁剪情况修复并重新检查。

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
是否作为独立预览页，而不会隐藏页面内部的背景，也不改变普通导出页列表。可复用组件
主定义默认不作为预览页面；显式启用 `previewAsScreen` 或设置该画板的 flow 起点可将其纳入，
显式禁用 `previewAsScreen` 时仍排除。

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
  "task_id": "3be8f564-270a-4d24-81d1-e1d18920c6d2",
  "verified_at": "2026-11-12T09:57:29.136055+00:00",
  "sources": {
    "ARCHITECTURE.md": "4b7ac79add132b8160cd941228eeb6c41a6307c8a5a36cb582ee57f6268f4d7c",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "COMMANDS.md": "b61536e66d1ce87d818a48e69e104329603101e3f70ec481cbb28c034fae11f4",
    "crates/op-dsh-engine/src/tool_catalog.rs": "2453cce3b0c9f8c336fd92bc6397f2653272e2ae21c76b528063ab4a6e033785",
    "crates/op-editor-core/src/text_selection.rs": "270195a858b26d0a27ece525db94258ecc543877cd7b60b913499ae34a9a7956",
    "crates/op-editor-core/src/text_selection_summary.rs": "adb1df6ef6b63d135351fbfc3ce91f26e16e58b35ff57547f2d9bae2280f6609",
    "crates/op-editor-core/src/text_insertion.rs": "666f8cd67867e665045a403d65d7fc0353b42f62e4b733c2aa084d4c5d39ec2d",
    "crates/op-host-web/src/web_clipboard.rs": "99a5719ff1cda613df019fe36ddbb6268f6c2400ec91da6ac5923c2f140b166b",
    "crates/op-ai-skills/skills/synapse-design/SKILL.md": "aee9478d50cc63ee3ae77782e518e507960b748060bffb29f8e2aa79ecdc59fb",
    "crates/op-editor-core/src/prototype/graph.rs": "7351bbf8dceb35feda8f323d97e274f6ff5c7539e12774f8df0002a4b9f900e5",
    "packages/dsh-node-runtime/design-style-plan.mjs": "0cce1c3a4cb801a5a369cc5843bf6b7449b22313e6aed4bc96d60d3a1c841255",
    "packages/dsh-node-runtime/asset-tools.mjs": "5aef23a27f2165cda16647908a140e24c84f3653f03ec1601655fb1bc2fcbc80",
    "packages/dsh-node-runtime/asset-directory.mjs": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7",
    "crates/op-host-web/src/selection_push_queue.rs": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca",
    "crates/op-host-web/src/vscode_bridge/selection_history.rs": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6",
    "crates/op-ai-skills/skills/synapse-design-html/SKILL.md": "541b5eb094c56dff52baf3b3147662e6337f4146fca4c020c1f8fce73b6f1acd",
    "crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json": "6eb8c4570fbf4a69c22b596a0560ccc2ce01aa7cbf733111bdd9f1895534ad8a",
    "crates/op-ai-skills/skills/synapse-design/review.md": "ea499d466143fd6a27b9647aaaae5f902806e7db98111270c9844960cc3f6046",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs": "fb3c90b015cc9ed3e1626cec2816a73e8f5677782e1ff300f83c677fbb58bda8",
    "packages/dsh-node-runtime/selection-visual-evidence.mjs": "edc871f259adb1b329a91b3b373ecffe1c4d2f4ed3d1fc1e2bf459510773b57e",
    "packages/dsh-node-runtime/device-frame.mjs": "dd38bfa8577554ad9be31ff6a4e29110d992603214be70be4b50890c64ed11ea",
    "packages/dsh-node-runtime/draft-review-gate.mjs": "ec234eeeebdc5391b96cc3518916f523c17e403b5bdafad2419a9c860d0889bd",
    "packages/dsh-node-runtime/poc-evidence-validator.mjs": "4a3b31ca6fee925c79a68f5584baca7b3a429c99f2614a6ccc90174ee5f2f9ae"
  },
  "reason": "Normalized 4 preserved CSV LF hashes in migration-manifest.json; product design invariants unchanged",
  "evidence": "node --test packages/dsh-node-runtime/html-skill-migration.test.mjs"
}
```

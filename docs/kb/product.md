# 当前产品知识入口

范围：当前 DSH Rust/WASM 引擎、Node MCP host 和浏览器设计页面，不泛化为保留的上游产品。

## AI 设计风格

OP 设计指导采用对话、现有文档和风格目录三层上下文。新设计未指定风格时由宿主呈现
实际风格目录并推荐 Talkdesk Cobalt，预选本身不代表用户确认；已有设计默认沿用其设计规范。
核心运行时提供 `synapse-design` Skill，DSH 宿主在创建新草稿前收集已有对话和所选 Project 的相关资料，
只就影响设计的未知业务事实补问；模型仍需如实说明读取了哪些资料及哪些资料不可用。
未完成的设计草稿按聊天隔离保存在工作区 `.synapse/op-design`，模型切换后可恢复。
统一 `synapse-design` 默认跟随用户当前会话语言提问与汇报，但设计产物内的全部界面文案（含 HTML POC 原型与 `.op` 画布节点）始终默认使用英文，仅当用户明确要求使用其他语言设计（或局部编辑既有非英文设计）时才切换至该语言并启用单语种一致性与 CJK 排版规则；
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
风格来源。`synapse-design/3` 与 `synapse-design-html/3` 按编号阶段组织执行，共享引擎中立的
[判断与底线规范](../../crates/op-ai-skills/skills/synapse-design-html/references/judgement.md)
（界面类型取舍、六类内容状态、表单与下拉右侧箭头 12–16px 留白、文案；设计判断含意图回溯、组间/组内/组件内
三级空间、同级分组标题缩进与间距一致、角标与容器边缘留白、几何与视觉对齐、风格转译；阻断性质量底线；
证据与交付规则；五维评审）。指导按阶段下发：规划取判断规范，构建取
[引擎构建指南](../../crates/op-ai-skills/skills/synapse-design/build.md)（骨架到填充、Hug/Fill 契约、
横向行宽与下拉箭头间距、中文字体与标点行距、关联组件与变量绑定），审阅取
[评审方法](../../crates/op-ai-skills/skills/synapse-design/review.md)（先确认内容可见再评价间距，整体/分组/细节三个尺度），
修改取[反馈处理](../../crates/op-ai-skills/skills/synapse-design/feedback.md)，专项问题按需读取
[专项参考](../../crates/op-ai-skills/skills/synapse-design/craft.md)；`full` 仅供未加载 Skill 的宿主一次性取得全文，
局部编辑提示不内联整套新设计底线。
DSH 上下文阶段要求实质性需求摘要与显式页面清单（默认桌面 `1440×900`、移动端统一 `390×844`）；POC 交接拒绝任务目录内的符号链接，校验任务目录中的
`DESIGN.md` 指纹、`evidence-report.json` 台账（含 `renderedEvidence` 截图哈希与源文件指纹；验证脚本仅排除任务输出目录下的 `review/`、`shots/` 而不跳过项目内嵌套同名目录，并按操作型界面启用 `app` 作用域过滤统计条等营销文案噪声）
以及带页面与视口宽度的真实 PNG 截图（`capture-poc` 支持 `--steps` 在单个有界 Chromium 会话内完成多视口、交互步骤断言与多状态截图并输出分阶段耗时与 Chrome `stderr` 诊断，保持 `mobile:false` 并核对 `innerWidth === width`，避免缺少 viewport meta 时按 980px 缩放排版；若浏览器重试后仍超时失败，`verify-surface` 与台账校验支持将 `renderedEvidence` 及视觉/响应式检查如实记为 `unverified` 并附带诊断原因继续交接，而不伪造通过或阻塞卡死）；录制成功后宿主主动在右侧预览打开 HTML 原型并签发截图预览，模型须先向对话回显至少一张录制截图（`![...](<path>)`，或在无截图降级时链接原型并声明未验证状态），随后才允许弹出 `synapse-design-poc:<taskId>` 选项卡片（未录制或未回显会被策略门禁拦截）。台账的无障碍、响应式、视觉审阅与各内容状态可如实记为未验证并说明未覆盖范围，
主要操作须标为可验证交互、视觉示意或未实现。`discovery` 各阶段与 `begin` 均返回 `rendererReadiness` 前置提示；`synapse_design_render` 仅在核实 `canvaskit-headless`/`canvaskit-editor` 真实渲染元数据后标记 `fidelity:"exact"` 并逐画板输出 `frames`。从 POC 进入高保真前须在 Stage C 确认“在已确认范围内升级”或“保真复刻”，遵循“范围保真 + 设计升级”三层规则：屏幕清单、状态范围、核心文案流程与可验证操作须保留，视觉层级、字体、间距与组件细节允许升级并记入 `designUpgrades`（`deviation:"upgrade"`，无需用户审批）。高保真发布前翻完交互目标分页并核对绑定当前截图哈希的
评审回执：每个计划页面映射 `nodeId` 或多状态独立画板数组 `nodeIds`（禁止在 `review.screens` 重复同名页面）或省略原因；五个维度各一项检查，状态为通过、失败、未验证或不适用，
通过须引用已评审页面内的真实节点（多屏设计须覆盖全部非省略页面，修改共享主组件后须覆盖受影响实例）和当前版本实际执行过的方法，失败阻断发布，未验证可发布但在结果中单独列出；
主要操作分为可验证交互（须有当前版本离开起始页面、打开弹层或切换变体的原型模拟记录）、视觉示意、未实现；仅相对已确认 POC 的实质范围偏离（`substantive`）或页面省略
须引用规范问题 ID `synapse-design-deviation:<draftId>:<screen>` 且用户选中同意项（`options[0]`）；`fontResolution` 通过解析 YAML `typography:` 与 Markdown `## Typography` 段落对照全部内置风格规范字体核查画布文本节点；六类状态与组件复用说明。调用 `finish` 不传 `review` 保留已完成定稿检查点与既有回执而不累加失败次数（纯只读状态探测走 `inspect(kind="status")`），且未发布前不返回输出 `path`，仅当 `published: true` 且落盘后实际核实文件存在（`fileExists: true`）时才允许报告已生成/已保存。同类回执诊断连续出现两次即标记 `repeatedDiagnostics` 提示停下询问用户，格式无效的回执同一轮连续三次即终止；如实报告失败的回执不计入该次数。可见的空文本（无组件属性默认值与变量绑定）、指向缺失组件的实例、未命中组件直接子树节点的实例覆盖或无效组件属性属于
内容缺失，由 lint 以错误级别阻断。宿主只能核对节点、方法记录与版本绑定，无法判断文字结论是否属实；
渲染后文字被遮挡或裁切目前不做确定性检测。上述无宿主依赖的选区
CanvasKit 精确渲染与墨迹测量、PNG 编解码、系统设备外框、代码上下文净化、发现漏斗与问答选项门禁、草稿画布/质量/评审门禁、POC
台账 schema 校验及受管 MCP/守护进程客户端协议统一由 `packages/dsh-node-runtime` 实现并随运行时分发，
DSH 插件仅保留宿主会话、沙箱文件边界与前端交互适配；面向模型的工具说明、参数说明、各步骤 `next` 指令、路由策略拦截文案、
可按需读取的指导分区清单与发布报告措辞均由运行时的
[design-workflow-text](../../packages/dsh-node-runtime/design-workflow-text.mjs) 与
[design-tool-text](../../packages/dsh-node-runtime/design-tool-text.mjs) 提供，插件不再保留副本。
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
  "task_id": "4f365fe7-8e49-46d9-81a3-f364f731eaa0",
  "verified_at": "2026-11-13T03:47:49.222880+00:00",
  "sources": {
    "ARCHITECTURE.md": "3dfc0e80c5769e4ab9d64cffbbbead2c4e88b8288112613df3e48693319c0893",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "COMMANDS.md": "b61536e66d1ce87d818a48e69e104329603101e3f70ec481cbb28c034fae11f4",
    "crates/op-dsh-engine/src/tool_catalog.rs": "2453cce3b0c9f8c336fd92bc6397f2653272e2ae21c76b528063ab4a6e033785",
    "crates/op-editor-core/src/text_selection.rs": "270195a858b26d0a27ece525db94258ecc543877cd7b60b913499ae34a9a7956",
    "crates/op-editor-core/src/text_selection_summary.rs": "adb1df6ef6b63d135351fbfc3ce91f26e16e58b35ff57547f2d9bae2280f6609",
    "crates/op-editor-core/src/text_insertion.rs": "666f8cd67867e665045a403d65d7fc0353b42f62e4b733c2aa084d4c5d39ec2d",
    "crates/op-host-web/src/web_clipboard.rs": "99a5719ff1cda613df019fe36ddbb6268f6c2400ec91da6ac5923c2f140b166b",
    "crates/op-ai-skills/skills/synapse-design/SKILL.md": "531d51a07f79ba87e0a6a9cf3dadfeab2c4a69b7e3c502f00b1b92dfd08475f3",
    "crates/op-editor-core/src/prototype/graph.rs": "7351bbf8dceb35feda8f323d97e274f6ff5c7539e12774f8df0002a4b9f900e5",
    "packages/dsh-node-runtime/design-style-plan.mjs": "0cce1c3a4cb801a5a369cc5843bf6b7449b22313e6aed4bc96d60d3a1c841255",
    "packages/dsh-node-runtime/asset-tools.mjs": "0fd1fcabdc68a4f1fb628816f5a38c93f5a2052d6347b59987d0048605b1cd9b",
    "packages/dsh-node-runtime/asset-directory.mjs": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7",
    "crates/op-host-web/src/selection_push_queue.rs": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca",
    "crates/op-host-web/src/vscode_bridge/selection_history.rs": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6",
    "crates/op-ai-skills/skills/synapse-design-html/SKILL.md": "47dea1bd0fae16c6da9c01f758e822eb7fb44b85f76102c25cdc4f7bb239c2c0",
    "crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json": "6eb8c4570fbf4a69c22b596a0560ccc2ce01aa7cbf733111bdd9f1895534ad8a",
    "crates/op-ai-skills/skills/synapse-design/review.md": "b5fb28762adab2638ca3ba9a85eb4dbea80924fba439538453e1a370c0569872",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs": "32f914b3104e84b4f5ef7d867ba08d6bb61fd2bba683faff1877906e78be3426",
    "packages/dsh-node-runtime/selection-visual-evidence.mjs": "25f99b077d23174e6390fe61378ae02a384d737548739b8177cab6c0103a7f2d",
    "packages/dsh-node-runtime/device-frame.mjs": "dd38bfa8577554ad9be31ff6a4e29110d992603214be70be4b50890c64ed11ea",
    "packages/dsh-node-runtime/draft-review-gate.mjs": "e73282d119171b72a771c9c3e4507d324bf25623ea1474fec7869bcc6a9e0128",
    "packages/dsh-node-runtime/poc-evidence-validator.mjs": "9c33e8cfe2c6ee68098e2251af4945f3faa015d5aa978a397d076a816bde8d81"
  },
  "reason": "Documented capture-poc --steps single-browser multi-viewport/interactive verification, stage diagnostics, and honest unverified POC degradation when Chromium fails after retry.",
  "evidence": "DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs (269 passed) && cargo test -p op-dsh-engine --lib prompt (7 passed)"
}
```

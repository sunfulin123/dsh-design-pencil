# 当前产品知识入口

HTML and Workspace preview controls share fixed visual source: a 44px bar, 32px desktop buttons, 36px narrow buttons, identical arrows/Reset and light/dark colors. Only Workspace exposes Feature flags. Built-in Dock icons and shell metadata are preserved by canonical merging and checked before builds; business pages and copied Extensions remain editable. Popup wrappers close on innermost Escape, outside interaction, focus leaving their region or business-frame blur while retaining internal search, selection and parent modals.

Cobalt recipe 目录提供 Card widgets（指标/圆环、模板、空图、用例、情绪、关键词和班次分布）、ECharts gallery（预测/历史、双图预测与情景比较）和 Team Schedule（24 小时时间轴、六行 staffing 指标、代理行、事件与固定分页；331px 业务 iframe 下分页换行保持可见，手机指标行随表格滚动以露出代理行）。精简 Users list 示例由 Card widgets 取代；完整 List page 保留。图表使用真实 Apache ECharts，控件、图标及主题来自 Cobalt/复制的 Extensions；排班网格为自有组合布局。WFM 源文件 revision/哈希记录在 recipe 的 support/recipe-sources.json，不引入其服务、鉴权或 store。数据与保存均为本地演示，日期/时区不代表真实查询或转换；Card 编辑角标不提供拖拽缩放。Add callback 的 Note 使用三行 Cobalt Textarea 并保留换行。

范围：当前 DSH Rust/WASM 引擎、Node MCP host 和浏览器设计页面，不泛化为保留的上游产品。

HTML POC 开发检查优先通过 Browser Use 操作已有本地服务的可见页面，确认实际提交地址及业务内容。长页面按约 80% 视口高度重叠滚动并重新读取和截图，每个目标最多 20 张；其余范围明确标记未验证。fullPage 原图只补充根文档概览，不能展开 iframe、内部表格或虚拟列表；正式验收才构建静态交付，并复用同一次浏览器采集的交互、截图和 DOM 结果。开发报告与旧历史不能作为正式交接证据，变更后人工评审保持待确认。Cobalt 新项目支持 React Fast Refresh 和按页面延迟加载，图表依赖不进入 Users 首屏。

## AI 设计风格

Form page 的 Scheduling and preferences 组合本地 Extensions DatePicker、TimeSelectInput、DateRangePicker、Choice（checkbox/radio）和 MultiDropdown。受控值随 onSave 的 profile.controlExamples 返回，日期为本地日历值，时间为午夜起分钟数。Add callback 的 Time 复用 TimeSelectInput，默认 09:00，提交时转为 HH:mm；日期仍必填。AI 文档使用实际导出名，不提供虚构的 TimePicker 包或导出。

Active call recipe 以本地源码模板提供通话中的 Conversations 页面：会话队列、通话质量/录音、Snapshot/Notes/Callbacks、回拨空状态与两条历史、固定底部完整通话操作。控件、图标和主题均复用 Cobalt；Hold/Mute/Recording、拨号盘、回拨和结束确认是内存中的样例交互，未接入真实通话。Tab 下使用 Cobalt Divider；Notes 的表单与操作保持独立间距，Snapshot 的标题与元数据分组。通话头像仅在通话中显示由内向外扩散的双波纹，并尊重系统减少动态效果设置。AI lookup 和 SS 打包内容包含全部支持源码及交互限制。

普通 HTML POC 的顶部 Size、Page state、Reset 来自独立 `packages/html-prototype-review/` 固定源码库，工具按原样复制并写入 SHA-256；没有 Feature flags、Cobalt/React 或私有 registry 依赖。业务页通过适配器实现声明的状态，尺寸调整使用真实 iframe 视口。Design/HTML Skill 提醒必须使用代码库；POC 转高保真时排除预览控件和外框，仅保留业务内容、实际导航及已确认的 Workspace 外壳。


通知历史使用紧凑样例列表；顶部 Phone 预设固定为 390 × 844。ListPage 使用 AppPageHeader 和扩展 Typography page-title/body 对齐标题组和操作区，Filters 通过扩展 SidePanel 编辑草稿；BasicTable 的 minTableWidth 仅影响可滚动表格，分页始终留在受限高度和宽度内。Echart insights recipe 用 Apache echarts 6.0.0、Cobalt 控件和本地扩展源码组合日期范围、Agent 多选筛选、双轴预测线、图例与缩放；指标和筛选数据为本地示例，真实服务需要接入。AI recipe 索引包含支持源码的依赖和 CSS。Insights 使用原生 SelectionGroup 单选 Day/Week/Month，日期区域保持 8px 间距，Agent 筛选复用可搜索 MultiDropdown；普通和计数筛选 Tag 同为 small。SidePanel 使用局部 Cobalt portal，避免旧 marketplace 弹层被模态面板遮住。 Insights 标题右侧提供原生 SplitButton/Popover 导出样例摘要，以及 Ask Copilot 聊天侧栏；聊天复用 ModalPanel、ChatBubble 与固定 Textarea 输入区，Enter 发送、Shift+Enter 换行，回复仅为本地示例；Ask Copilot 以原生透明按钮置于 Export 左侧，用户消息在右侧按内容收缩并带尾随头像。

风格源集中在 `packages/design-data/styles/`，新目录中的 `DESIGN.md` 在构建时自动发现，现有 id 保持兼容。`packages/talkdesk-cobalt/` 集中维护 Cobalt 本地规范、Workspace shell、升级后的 Cobalt Extensions 组件、MDX、可运行示例和 recipe。Astro 与 AI 内容包使用同一份来源；新建原型将完整组件实现、类型、样式复制到 `src/components/cobalt-extensions/`，通过相对路径导入并按需求修改源码，状态切换仍在顶部工具栏；尺寸、状态和 Feature flags 使用响应式下拉控件，提供稳定的无障碍名称与 prototype-* 定位。组件源码目录有从 MDX 和源码导出生成的 README；AI-INDEX 和只读 lookup 通过统一 registry 将需求连接到准确的 API、源码、recipe 集成说明、依赖和状态限制。完整 ListPage 使用扩展 BasicTable、SidePanel 与 marketplace Toolbar，并提供 Extensions Dialog 创建表单及 UploadFile 导入弹窗；本地创建仅内存生效，实际持久化和文件导入由宿主回调负责；脚手架项目保留检索工具、完整本地资料及调整后的路径。独立页面使用 copy-source 复制源码；禁止安装或通过包名引用 `@openpencil/cobalt-extensions`，不生成 file 依赖或别名，也不提供旧项目适配。Astro 使用左侧目录、右侧正文和顶部主题/强调色控件。安装后的 SS 使用打包快照，尚不支持远程文档实时更新。

确认 Talkdesk Cobalt 的 Workspace HTML 原型通过内置 `cobalt-project.mjs` 工具复制固定版本官方 shell，注册自定义 Dock app 与页面；模板使用 React 18/Vite 和 pnpm，支持多个真实业务应用和顶部状态控件；顶栏控件复制固定版本 Atlas Button/frame/Tooltip 源码，由 Cobalt 管理透明色阶、字号和各交互状态，不另写控件配色覆盖；项目副本通过自有 Atlas 改版模板提供 44px 顶栏、48px Dock、主题色外壳及匹配的边框和宽度计算，居中 Dock 图标，BasicTable 与列表 recipe 使用无装饰外框、无圆角和左右贴边的表格区域。组件规范读取随工具发布的本地 `cobalt-reference`，设计契约包含在 `talkdesk-cobalt` 风格提示词中，shell 快照保持只读，适配只作用于项目副本。AI 自行安装依赖并启动、复用本任务的本地 Vite 服务，不依赖 Fill with AI、preview.json 或已配置的服务列表，编译到 `delivery/index.html` 后沿用 POC 证据与交接；独立页面和生产应用按 companion 的场景规则分流。

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
用户明确要求导入已有 HTML 文件/网页或 Figma 文件/链接时，使用宿主的专用来源导入入口创建独立可编辑文档，不要求经过从零设计的风格选择和 POC 阶段；来源访问权限和认证错误仍须如实报告。禁止用 AI 自行生成的中间 HTML 绕过已约定的设计路线。
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

维护的八个 recipe 复用原生 TagGroup、Avatar、BadgeContainerWrapper、EmptyWidget 与复制的 ChipGroup；可见控件不使用原生 HTML 仿制。排班网格、ECharts 绘图、通话波纹和带电话头像的回调连接线属于专用组合，AI 指南记录其边界；ChipGroup 的溢出入口使用原生 Button 并支持键盘操作。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "383bf9ac-1a52-42e7-b4ae-b30823d0dce1",
  "verified_at": "2026-11-17T12:46:21.825672+00:00",
  "sources": {
    "ARCHITECTURE.md": "1d44414fabc3d7c3cc0c1938f43862b8bbe9f820db65f029fbd215e783b73c7e",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "COMMANDS.md": "69c13b7656a540249a0beb84c3b468564842d11cd1ca78682d1de2e0881f09a0",
    "crates/op-dsh-engine/src/tool_catalog.rs": "2453cce3b0c9f8c336fd92bc6397f2653272e2ae21c76b528063ab4a6e033785",
    "crates/op-editor-core/src/text_selection.rs": "270195a858b26d0a27ece525db94258ecc543877cd7b60b913499ae34a9a7956",
    "crates/op-editor-core/src/text_selection_summary.rs": "adb1df6ef6b63d135351fbfc3ce91f26e16e58b35ff57547f2d9bae2280f6609",
    "crates/op-editor-core/src/text_insertion.rs": "666f8cd67867e665045a403d65d7fc0353b42f62e4b733c2aa084d4c5d39ec2d",
    "crates/op-host-web/src/web_clipboard.rs": "99a5719ff1cda613df019fe36ddbb6268f6c2400ec91da6ac5923c2f140b166b",
    "crates/op-ai-skills/skills/synapse-design/SKILL.md": "30661ddf0c8e972b05afd8eb435dce5f0a7f4a6a401ea2931ca02f9d1832748e",
    "crates/op-editor-core/src/prototype/graph.rs": "7351bbf8dceb35feda8f323d97e274f6ff5c7539e12774f8df0002a4b9f900e5",
    "packages/dsh-node-runtime/design-style-plan.mjs": "0cce1c3a4cb801a5a369cc5843bf6b7449b22313e6aed4bc96d60d3a1c841255",
    "packages/dsh-node-runtime/asset-tools.mjs": "0fd1fcabdc68a4f1fb628816f5a38c93f5a2052d6347b59987d0048605b1cd9b",
    "packages/dsh-node-runtime/asset-directory.mjs": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7",
    "crates/op-host-web/src/selection_push_queue.rs": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca",
    "crates/op-host-web/src/vscode_bridge/selection_history.rs": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6",
    "crates/op-ai-skills/skills/synapse-design-html/SKILL.md": "be6adcccb12adae363d6ea87b4a5324ad7ad6304e4151474ca9c2ede1154979e",
    "crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json": "6eb8c4570fbf4a69c22b596a0560ccc2ce01aa7cbf733111bdd9f1895534ad8a",
    "crates/op-ai-skills/skills/synapse-design/review.md": "b5fb28762adab2638ca3ba9a85eb4dbea80924fba439538453e1a370c0569872",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs": "32f914b3104e84b4f5ef7d867ba08d6bb61fd2bba683faff1877906e78be3426",
    "packages/dsh-node-runtime/selection-visual-evidence.mjs": "25f99b077d23174e6390fe61378ae02a384d737548739b8177cab6c0103a7f2d",
    "packages/dsh-node-runtime/device-frame.mjs": "dd38bfa8577554ad9be31ff6a4e29110d992603214be70be4b50890c64ed11ea",
    "packages/dsh-node-runtime/draft-review-gate.mjs": "e73282d119171b72a771c9c3e4507d324bf25623ea1474fec7869bcc6a9e0128",
    "packages/dsh-node-runtime/poc-evidence-validator.mjs": "670ef4888077dca2a8e56c8bfc41ddde0b8ed619e0dc787286e2f48132670f4a",
    "scripts/stage-dsh-runtime.mjs": "bba05df06c22238965d555277ac5d5058315dac905a709a1c8ffc2bd20661cdb",
    "packages/design-data/tools/catalog.mjs": "f425a059eb255b857eb94ac0dd3cf0b55b207d436367abd6938add949485b9b3",
    "packages/design-data/styles/talkdesk-cobalt/DESIGN.md": "c50257bfebfa010868ddb0cff1c4f62146b4421f65aacf4f94567a0ebea2dd32",
    "packages/talkdesk-cobalt/reference/source.json": "ea71c4addd8d64bbb1eee1b6cbea3afd290c7ed90e65e5ae56ecb6564d7ae508",
    "packages/talkdesk-cobalt/tools/export.mjs": "a7b0475adf1146f0764e3b3786b6bc42aa7e06d82fb437ba1cc2a85850bd0cbd",
    "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md": "1facdf27ff36e482ffd57524f3baf653b4997c22ad26a6772a7e316a8b6da5f6",
    "packages/talkdesk-cobalt/components/extensions/src/basic-table/table-layout-measure.ts": "f068186339c999ee80f4a435fea70a13bb1c9de539e5f43037c4942cc3ae6c8c",
    "packages/talkdesk-cobalt/components/extensions/src/basic-table/basic-table.module.css": "548c6bb1153e4d666fa3d83ae65faae86aee858de3f3c4c68668e146accee983",
    "packages/talkdesk-cobalt/tools/content.mjs": "d7b9c84eb1a57fdeac983af4ae1156ea5062d5c11a1eec133672458ba397aaef",
    "packages/talkdesk-cobalt/tools/component-index.mjs": "1ee6e21def1544c27d0eb73cff59d71c43f06c9c7a1913206e6b0ffcd164d44b",
    "packages/talkdesk-cobalt/tools/cobalt-project.mjs": "89c25cebde5deb29acd02b618d1dd82bec892d624d67f6b18d4770d977f99813",
    "packages/talkdesk-cobalt/site/src/layouts/Page.astro": "39dbea09c84b7c947d837072632f8fcee3f3b38dcb1aae05ab3fe09db5064988",
    "packages/talkdesk-cobalt/site/src/scripts/docs-shell.ts": "699079dd1436cb79f32895a5da0b0ad28d4da17add6e762b01b820e7c57917bc",
    "packages/talkdesk-cobalt/test/export.test.mjs": "cef4f733f95154705795ff754e0ed1cdba3bb55cba51e21e0d025fd25295394b",
    "packages/talkdesk-cobalt/test/site-browser.test.mjs": "784d406aa82e61d8f78c307df3d1800747a1f2e12fef73e062ea2bd82d3c475c",
    "packages/talkdesk-cobalt/tools/authoring-index.mjs": "46c9f9b6817d89e1c05040705533b033b0c3fb81d979be794a9a90b7b98dbee2",
    "packages/talkdesk-cobalt/tools/cobalt-lookup.mjs": "e0851b36e8c8b10a1bbe6e1548c4aaeecdac9535e054869262b05eeadde407ee",
    "packages/talkdesk-cobalt/recipes/catalog.json": "18943147dbea06dfad0f4310f750e85f003078a8212d2462fbbfb93b86c3dd73",
    "packages/talkdesk-cobalt/recipes/list-page.tsx": "6b20341a78b8371b500d486bd738fe654f3d73727fca488230b7937cea473586",
    "packages/talkdesk-cobalt/recipes/list-page-data.ts": "f5c55bdece74fb250ae7d29f120d0b0e5c147ac0f0b54ccd3593c337b2b75343",
    "packages/talkdesk-cobalt/skill/references/cobalt/INDEX.md": "53267d06781ed6cc5a699f057b4614c0fedd59207846557c479345e27198f6c9",
    "packages/talkdesk-cobalt/tools/cobalt-source-templates.mjs": "5df71ea6d76e40cc59a51ba2baaddab43efcb035342fc9b5e1644212760b513f",
    "packages/talkdesk-cobalt/recipes/support/list-page-dialogs.tsx": "05fad0774d1ef661b216bf83536cc58217bd8f2beefb782874c54ff877f230a0",
    "packages/talkdesk-cobalt/recipes/support/list-user-fields.tsx": "21838a42f97e6582831103d8edcbf57c649b1ca6827c648181b51eb8c79b69b6",
    "packages/talkdesk-cobalt/components/extensions/src/dialog/dialog.tsx": "853ef3df233c1c0144b56ad7b4f778c3bd552b289366e7ddaf693acf9d5731c1",
    "packages/talkdesk-cobalt/components/extensions/src/dropdown/dropdown.tsx": "82538bc740c9e856bdb684f5e7f17832ee6b0d0ff5005b0621ca579157a78bce",
    "packages/talkdesk-cobalt/components/extensions/src/upload-file/upload-file.tsx": "fa941f2220bd5234f6b93fb5cbc49eb9964b8a0700ec83f904b48f2472b53432",
    "packages/talkdesk-cobalt/test/list-dialogs-browser.test.mjs": "7ca21cf570b0aee36f9242cc04d273364505fd8a85d5091271daada9fb70a8d6",
    "packages/html-prototype-review/README.md": "a0fb4dae3fd8365ee693cc54c8934825040825f5000ae0a0000bb59354fed548",
    "packages/html-prototype-review/scripts/prepare-html-review.mjs": "09efdc25d3a7f44d74e32b1aab9651f1b21cbeadf5975e67974af6a00a5610ae",
    "packages/html-prototype-review/scripts/html-review/review.js": "14f546e4facb31f548bf526bb80850a860171e45b63f22706ea7a17e6caf9fff",
    "packages/html-prototype-review/scripts/html-review/page.js": "280733ad82cd7e1381afcc5a236096900c555e7578b4035f010ced14c33dfaf9",
    "packages/html-prototype-review/tools/export.mjs": "2f31aac86a2e429212ce43045ffb670b1db71b0e7325587f537dcc120efab75e",
    "crates/op-ai-skills/skills/synapse-design-html/references/html-review.md": "e15f080c88d4e06d174ce217cc70e2b32d661e79750c437ac23818a6f3124e6d",
    "packages/talkdesk-cobalt/recipes/active-call.tsx": "38aff19bfabff66a07e5556bf6e66ef19e71cddfd37e84b4d9e1527f762112ad",
    "packages/talkdesk-cobalt/recipes/support/conversation-queue.tsx": "f21f968f745400393cb180fa06bf756260d7311d44f9e499508d18601c9be9c4",
    "packages/talkdesk-cobalt/recipes/support/call-dialogs.tsx": "ef9256ce86a4f279df0241a30c5133c8b18c64852d99af3b3a85b8c43b511b92",
    "packages/talkdesk-cobalt/recipes/support/active-call.css": "3d5fa64c209c6d673073a08176ece6eda7d96d239c21f3436fec1db04174ade7",
    "packages/talkdesk-cobalt/test/active-call-browser.test.mjs": "198992129f1a924338e864729f3eb11d9c244b8efae3aebefcb8012884d73024",
    "packages/talkdesk-cobalt/recipes/form-page.tsx": "b7921e5487319fef291637f9e09403b2e5b9d5d246b12160c1ecf59806e62a91",
    "packages/talkdesk-cobalt/recipes/support/form-control-examples.tsx": "8a126f157517bb8abcc8da036aa2e479dbe064750781e8f789ccc355114e1abb",
    "packages/talkdesk-cobalt/content/components/extensions/timeselectinput.mdx": "732a01fa3a1df688c495e0c10eb8a10264c175cda487748fe6f72c391b0faf72",
    "packages/talkdesk-cobalt/test/form-controls-browser.test.mjs": "eceed8316d99e4c64235fb99fd0371c216a7175e71863c940cfbc582a0dbf45b",
    "packages/talkdesk-cobalt/recipes/card-widgets.tsx": "59efa6de48c184edca0be1a80013662b99a58e9e77047a5201c4d06974522783",
    "packages/talkdesk-cobalt/recipes/echarts-gallery.tsx": "e646abb507aa5087f38745c974501e68d0831893cbe5d0c78c6435e50eb5af8d",
    "packages/talkdesk-cobalt/recipes/team-schedule.tsx": "416fd94b7b677a0958c31eca6460990aeea89a840301fc0777151d734dfc0966",
    "packages/talkdesk-cobalt/recipes/support/reference-charts.tsx": "0fc6686944d0824dc6f526c0cb8c1a1558a6747c6c83066bb759292c73199050",
    "packages/talkdesk-cobalt/recipes/support/schedule-timeline.tsx": "a9154cf1b53c92a968f8c57501dfd3a1cc32bc4721f43813fa935dd70cc2d001",
    "packages/talkdesk-cobalt/recipes/support/schedule-header.tsx": "1a354fb3dd88a40eb98e231f11115c74e8c71ed8a369afc4799e669d3e010914",
    "packages/talkdesk-cobalt/recipes/support/schedule-data.ts": "e6f14ae1e965f7eedcba571d1182585ae897b9e6c8541faf8663f9e6f12dea2b",
    "packages/talkdesk-cobalt/recipes/support/widget-patterns.tsx": "a5acb61620bd41ccb562cc63f0246351fddb0207a6090eaf3769ce1c1549c2aa",
    "packages/talkdesk-cobalt/recipes/support/team-schedule.css": "f9b9130e2fc5c84cc07ae5ac0272acf6887874dabba11741300dc90bd00cc2a2",
    "packages/talkdesk-cobalt/recipes/support/widget-gallery.css": "9b3f65b5a9ec7e54268375ae015bdcb3ed1abaa46b8c745d2a7bcaf3b82c1f87",
    "packages/talkdesk-cobalt/recipes/support/recipe-sources.json": "6fcb0a5ab65c02d3c8def00d1612380b40cc65380be78d4fc94bd348c0a92e44",
    "packages/talkdesk-cobalt/test/reference-recipes-browser.test.mjs": "b029cebfd5043859484da3d01344775c77e33e273be9ddee0daa9235d490cf78",
    "packages/talkdesk-cobalt/components/extensions/src/timezone-dropdown/timezone-dropdown.tsx": "e1133785f2188c8b25843f9df6b73fa8576d521d893c038ef57130ec1eb72783",
    "packages/talkdesk-cobalt/content/components/extensions/timezonedropdown.mdx": "f316d12e54dfe896e2170471734b951902b4ea3188a12ef49e7a4145ca5c0a96",
    "packages/talkdesk-cobalt/recipes/support/filter-button.tsx": "c62bb83168efb253664d55e044479df56daaeeff4db0ff2926f460d0c0e4af42",
    "packages/talkdesk-cobalt/recipes/support/insights-chart.tsx": "26856c854ea12d13609c432a7996cb94e6cde63aa13ab509e46571ac42bc1ff0",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/review-poc.mjs": "2e4b3db7273f39d264fc89b8da3626c1e4632c838788bfc492cf5145812f606a",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-browser-actions.mjs": "1433ae1a1abd96041355621e4a77754008e130c11ff21afc4b12c5536378e66f",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-capture-plan.mjs": "b1a211b156d570fbfc7826b047fa49be67744ab65cac6bb2adc8de1fb4150f0c",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-review-evidence.mjs": "bcceaa942ff1ebdba2dffe7a8d57a1312794fd9b0a2ee260b9826a7cedf051b3",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-source-inventory.mjs": "51cae6bd081f6ff4f17b4311c4127c8a7686470cfb40f697e625949ccd35bb2e",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-surface-inspection.mjs": "f29c2dd4d11a880ce2aaa97260d3aa1b9197a943765feb0713dd723fe222f5d7",
    "packages/dsh-node-runtime/poc-review-workflow.test.mjs": "6888a4d7073d871e052f9b562898adb01db421de908d6e1e3af4e7fee128a8bb",
    "packages/talkdesk-cobalt/templates/project/app.tsx": "e5371b421e92d3427170b7bed6ffdb9d63a133bdbdbb43cd1e179a49e0b297ac",
    "packages/talkdesk-cobalt/templates/project/vite.config.ts": "a4dddc7a78b286f3b1a11e4aed72164015a549c3967b3e782264d0ae2972283c",
    "packages/dsh-node-runtime/poc-startup-guidance.test.mjs": "fe9619fe496d6e265a7e7ea5836f7fdfc8950b87950ceb2af9411d0c57f5022d"
  },
  "reason": "Document explicit supplied-source import as independent of new-design stages without allowing AI-authored intermediate shortcuts.",
  "evidence": "Reviewed synapse-design standalone import guidance and design-tool-text dedicated import description; SS importer policy and mock Figma tests passed."
}
```

Users 列表标题使用 Cobalt 原生 medium 档位（24px/32px），与 body 描述以 gap 0 成组并保留 h1 语义；筛选按钮使用 40px，已应用条件使用 24px Tag；FormField 在标签下留 8px，直接控件容器恢复 20px 行高，防止 Checkbox 从 Box 继承 0 行高后布局高度归零。标题/描述采用扩展 Typography，避免以自行覆盖字号代替已有语义组件。

Cobalt recipes 是供 AI 选取、组合和调整的视觉/交互参考，示例数据和操作不构成完整业务规格。Team Schedule 以原生 Toolbar/StartContent/EndContent 显示日期/周期/搜索与已应用筛选；空间不足时组内与组间换行，自适应高度，控件不超出业务视口；agent 搜索框固定 160px，不随剩余空间拉伸，移除 Select 与 intraday adherence。请求和 Filters 角标由 BadgeContainerWrapper 的 NE/NW、gapX=0、gapY=8 贴住按钮右上角；tiny 角标向内展开并重叠顶部。时区入口保持地球/城市/箭头胶囊按钮，通过本地 TimezoneDropdown 的 customInput 复用分组搜索弹层、IANA 值与 300px 弹层宽度。卡片/图表内容滚动区使用局部定位，避免原生隐藏表单节点撑出外层空白；ECharts dataZoom 底部预留 16px 以完整显示手柄。

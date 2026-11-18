# Runtime 与 MCP 验收边界

## 默认测试不等于浏览器实现覆盖

范围：当前 Rust workspace 和 Node/WASM 产品。
[Cargo.toml](../../Cargo.toml) members 仅 `op-dsh-engine`、`op-host-web`；
[op-host-web feature](../../crates/op-host-web/Cargo.toml) 默认 `web` 是 stub，
[生产构建](../../packages/dsh-node-runtime/build-web.sh) 使用 `canvaskit`。
因此不能只用默认 workspace 测试验收 widget_host 改动。

复验：`cargo test -p op-host-web --lib --features canvaskit`。
记录实际测试数与启用 feature，不把历史测试数量当成当前保证。

## tool 发现、执行与 WASM 能力必须一致

范围：AI 自主设计工具。
[catalog](../../crates/op-dsh-engine/src/tool_catalog.rs) 定义可发现的 schema，
[DesignEngine::call_tool](../../crates/op-dsh-engine/src/lib.rs) 负责执行入口。
改工具必须同时验证 tools/list、tools/call、错误、undo/版本和页面显示。

[script feature](../../crates/op-mcp/Cargo.toml) 的 QuickJS 仅用于可支持它的宿主，
[batch_design](../../crates/op-mcp/src/batch_design.rs) 在非 script 构建明确拒绝 script。
WASM 用 operations DSL，例如 `b=I(parent, json)`；原生 feature unification
可能开启 script，不能用原生成功证明生产 WASM 支持。

Node [EngineSession](../../packages/dsh-node-runtime/engine-session.mjs) 还有宿主侧
`expandScriptWithVariables`：由[独立 QuickJS/WASM 解释器](../../packages/dsh-node-runtime/quickjs-script-sandbox.mjs)在时间、内存和输出预算内将
script 展开为 operations，再交给设计引擎 WASM。解释器仅通过原始值回调记录操作，
不使用 Node `vm` 隔离不可信脚本；运行时打包须包含锁定版本的解释器及其依赖。
因此“设计引擎 WASM 无 QuickJS”不等于“Node MCP 不支持 script”；必须核对实际调用入口。
`batch_design.nodes_json` 是 `kind` 等字段组成的平铺叶节点描述，不能传入带 `type` 和
`children` 的完整节点树；完整子树应使用 `insert_node.data`。工具 schema 和错误会提示区别。
Node 展开的脚本对父容器启用严格校验：引用不存在的父节点会拒绝整个批次；
包含变量或主题前置操作的脚本先在隔离引擎中预检，失败不能留下变量或文档改动。
对已有节点的 [update_node](../../packages/dsh-node-runtime/engine-session.mjs) 与
[脚本 U](../../packages/dsh-node-runtime/script-prelude.mjs) 写入必须保留传入的精确数值；
只对新节点沿用现有审美尺度归一化（并在绑定 `DESIGN.md` 时为 `I()`/`R()` 未显式指定 `fontFamily` 的新文本节点含嵌套 `children` 自动写入规范标题/正文字体），不能把精确修复再次吸附到相邻间距。QuickJS 脚本支持 `I()`、`K()`、`C()`、`R()`、`M()`、`D()` 与 `U()`：顶层画板未传 `x`/`y` 时自动向右排布（`reusable:true` 主组件排在画板上方独立行），`U(ref, {descendants})` 按子节点字段深度合并覆盖而非整表替换，`U("inst__child", patch)` 可直接寻址展开实例子节点，`stroke: null` 清除描边并支持单边描边归一化，`visible: false` 子节点不占 flex 布局空间与间距；显式固定视口（`fixedViewport` 带 `clipContent:true`）根画板保持声明高度而不随字形微差膨胀，未开启 `clipContent` 的根画板仍随溢出内容自动增高以避免裁切。
传统 operations DSL 不启用严格选项时仍保留原有的根节点回退兼容行为。
`batch_design` 向已存在的非容器节点插入时会拒绝并指出父节点 ID；失败不会提交部分结果。
[控件 lint](../../crates/op-design-lint/src/detectors/widget_a11y.rs) 将声明密码/密钥 `role`、掩码字符占位或
密码显隐图标但未开启安全输入的文本框报告为 error，并对右侧内边距不足（`< 8px`、导致下拉箭头贴边）的横向边框/填充下拉容器报告
warning；图表透明容器与缺失圆环检测同样依据显式 `role` 与几何特征而非自然语言节点名；宿主发布前须检查全部 error 与阻塞项，不能只看普通 lint 首页。
[`get_design_quality`](../../crates/op-dsh-engine/src/quality_tools.rs) 的
[交互目标检查](../../crates/op-dsh-engine/src/touch_target_quality.rs)读取画布实际布局尺寸，而不是仅判断原始宽高；
覆盖标注交互角色的容器、含点击或按压原型行为的容器，以及继承主定义交互的关联实例；其他类型和未标注的行为不保证覆盖。
结果按最小边排序，`touchTargetOffset` 和 `touchTargetsNextOffset` 可翻页，修改后应从头复查；
44px 是需结合设备与实际可用空间判断的建议，最小边不足 24px 标记为较高优先级。对 `fit_content`
可建议调整内边距，但关联实例不直接建议修改共享主定义；修复后需检查裁剪和重新计算布局。
`componentReuseCandidates` 按同级小型结构和布局发现重复候选，并报告样式差异数量；它不能判断
语义、交互或全部复用机会，不自动替换。候选截断时使用 `rootId` 缩小范围；修改共享组件前保留
实例差异和局部修改。`instantiate_component` 创建独立副本，关联实例需要 `ref` 节点。
该工具保留原问题数组，同时通过 `findings` 提供节点定位和修复建议，通过 `coverage` 区分
已检查、无法判断及未支持。变量检查覆盖当前继承模式下已知类型的 `variableBindings`；
`tokenObservations` 对文字字号、间距和纯色填充按当前模式下的文档变量做有限的字面值匹配，
区分未绑定但相等、组件后代的局部覆盖和无法判断；数值相等不能证明语义相同。
`tokenObservationsTruncated` 单独标记观察列表截断，`truncated` 则标记诊断问题或 findings 截断，
正常样式观察过多不会使宿主误报诊断问题被截断。
内联引用、其他模式和全部 Token 一致性尚未覆盖。对比度启发式、截图、
键盘操作和原型行为不能因此当成完整无障碍认证或真实用户测试。
[`lint_document`](../../crates/op-mcp/src/lint_tools.rs) 按需分页并返回 `autoFixEligible`：
该字段表示可以交给机械修复尝试，不保证建议符合设计意图。未标注角色的同级节点按类型、
布局和子节点结构作保守比较；无视觉内容且尺寸不超过一个像素的留白不参与比较，
包括零尺寸；隐藏祖先的子树也不参与同级比较。
同级高度、圆角、内边距差异以及嵌套深度必须结合上下文判断，不因多数值自动改写；
深度提示的 `__none` 不授权删除最深节点。[机械修复策略](../../crates/op-design-lint/src/issue.rs)
同时用于文档直接修复和命令规划；缺少有效目标值的建议不可自动修复，锁定的只读建议
不会阻止其他可修复节点。同一节点属性上的独立诊断按类别和依据保留，包括可能使用不同
比较群体的同级圆角规则；机械修复对同一属性最多选一个目标。只读诊断的 issue ID 包含依据，避免
同节点同类别的多个 shader 错误共享 ID。
修复后重新读取文档、从首页复查 lint，并按需检查真实 CanvasKit 截图。
[编辑器当前布局适配器](../../crates/op-pen-loader/src/adapter/pages.rs)未应用 `minWidth` / `minHeight`，包括响应式标记的文档，
不能将写入这些字段视为画布上的修复成功。布局检查不替代 CanvasKit 截图。

复验：`node --test packages/dsh-node-runtime/engine.test.mjs packages/dsh-node-runtime/design-tools.test.mjs`，
前提是生产 engine bundle 已构建。新增能力还需对应实际 tool 的回归测试。

HTML 评审证据记录 sourceTarget 和文件清单；复验同时检查文件内容及新增/删除文件，
缺少清单范围的旧证据不能当作通过。默认本地 HTML 检查覆盖其所在目录。

## 文字选区是临时上下文

画布的文字选区不写入设计文档。Node host 仅在选中节点、页面和原文仍匹配时，
才通过 `get_selection` 返回 Unicode scalar 起止位置与选中文字；原文变化会使旧选区失效。
`get_text_style` / `set_text_style` 可显式传 `pageId`，避免随后切页而修改同名节点；
单页无 `pages` 的文档使用默认页，不应将合成的页标识当作真实 pageId。
`set_text_style.expectedText` 可在同一次引擎调用中比较完整原文；不匹配时不产生命令。
CanvasKit 在选择发生时记录有界历史；宿主可使用提交时间请求该时间之前的选区。
同毫秒歧义、历史已淘汰或画布状态无法核实时返回不可用，不能猜测较新的选区。
选择推送按顺序发送，仅保留最新待发送值；失败后可重试，避免延迟的旧请求覆盖当前选区。
复验：`node --test packages/dsh-node-runtime/selection-text-context.test.mjs`；
`cargo test -p op-host-web --lib --features canvaskit selection_`；
`DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/property-panel-browser.test.mjs`。

## Cobalt prototype authoring boundary

Confirmed Cobalt HTML applications prepare a task-owned canonical Workspace before business authoring. The host validates native user intent, task ownership and standalone exceptions, while `prototype-authoring.mjs` owns canonical files, bounded pnpm installation and source inspection. The install action reports the actual redacted pnpm error and keeps the task project available for retry. Preparation does not mean completed UI. Existing authored pages are retained, local pinned component documentation is the default MCP fallback, and source guard results do not replace build or browser evidence. The source/runtime owner contract is in [the runtime README](../../packages/dsh-node-runtime/README.md).

## 截图等待不能锁住 renderer bootstrap

范围：Node host 请求调度。
[host-http](../../packages/dsh-node-runtime/host-http.mjs) 将 get_screenshot、
sample_color、compare_figma_fidelity、compare_html_fidelity 归为 render-wait（由
[host-render-tools](../../packages/dsh-node-runtime/host-render-tools.mjs) 应答）；它们不能持有 mutation queue，
否则 headless renderer 的 sync-reset/document pull 排在截图后面，会互相等待。

临时 macOS CanvasKit renderer profile 使用 basic password store 和 mock keychain，私有 HOME 下无需用户 login keychain 即可加载 loopback 编辑器并返回真实截图。该配置和 HTML 源捕获 profile 分别验证，不改变 Preview、Browser Use 或 Electron 生产启动。

默认 CanvasKit 截图优先选择活动页首个允许作为预览页的可见画板，跳过设备装饰和普通组件主定义；
无此类画板时回退到首个可见根节点。显式 `nodeId` 可截图组件主定义，`page` 可截图整页。
是否是真实渲染由结果的 `renderer` 标记判断，近似预览不等同于 CanvasKit。
浏览器同步规范格式时使用快速反序列化；初始或替换文档含引擎兼容的旧写法（例如颜色字符串）
时，宿主按需调用与引擎相同的兼容加载器，成功应用后才确认版本。加载失败不能标记为已同步。
原型模拟的点击节点接受 `nodeId` 和 `node_id`；未给节点或完整坐标的点击会报错。调用成功仍需比较
`currentScreenId` 或 `visitedScreens` 与预期目标，才能确认跳转实际发生。
新增需等待客户端的只读工具必须审查此边界，真正的文档 mutation 仍须有序。

[AI loop](../../packages/dsh-node-runtime/ai-design-loop.test.mjs) 包含近似层和真实 Chrome 层。
真实层必须显式启用，renderer metadata 必须验证，skip 不算通过。
复验：`DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/ai-design-loop.test.mjs`，
需要已构建 engine/web bundle 和可用 Chrome；不得用用户 host 做测试。

## 资产持久化与 UI 确认

范围：managed Node host，不泛化到无文件系统的直接 WASM 调用。
CLI 默认目录由 [asset-directory](../../packages/dsh-node-runtime/asset-directory.mjs) 决定，
是用户级而非文档旁目录：DSH 每个草稿都在临时目录启动，文档旁目录会随草稿丢失。
发布 staging 必须包含运行时全部非测试 `.mjs`，`package.test.mjs` 会启动 staged CLI 验证。
[资产目录](../../packages/dsh-node-runtime/asset-store.mjs) 使用 SQLite 事务；
user id 不由名称推导，同名导入不会覆盖旧资产。更新/删除必须携带 revision，
跨 host 写入失败或目录读取期间改变均明确返回错误，不接受混合版本的元数据。
内置只读；style-guide 保留原始 Markdown，主题导入保留未知 JSON 字段。
内置风格由 `packages/design-data/styles/` 构建时自动发现，当前包含 Cobalt 和 84 份原始 DESIGN.md，可选元数据保留稳定 id；目录只发元数据，
正文按 id 读取。内置风格的预览色块和摘要取自相同的 DESIGN，导入风格色块由其原文提取；
缺失时不生成占位色。模板类型、工具、资源及生产资料不再支持；旧库中的模板记录保留在
原数据库但不暴露。打开已有文档时，仅将旧文档目录中的用户风格和主题预设原子地合并一次，
不覆盖相同 ID，记录导入来源以避免已删除的资产在重启后重新出现。
目录的 `contentHash` 基于完整 Markdown，用于确认选择后检测正文变化；内置应用场景分类来自同一风格清单。
OP 设计 skill 与按需资料位于 `op-ai-skills`；`plan_design_style`（消费结构化 `styleMode` / `styleId`）与资产 UI 共享目录和
revision，`plan_design_canvas` 消费结构化 `platform` 与宽高参数，主机可通过 `get_design_agent_prompt` 按 id 注入完整原文（`full` 模式同时内联
`op-design-build` 与 `op-design-judgement`；`plan`、`build`、`review`、`revise`、`deliver` 只返回该阶段的指导且不重复 Skill 正文，
`includeStyle:false` 只校验风格 revision 而不再拼入风格正文；`op-design-craft`、`op-design-feedback` 等分区可由
`get_design_prompt` 单独读取；`web-app` 指南不再拼入带营销页字号与色值的 `design-principles`）。
受管宿主的 `get_design_quality` 追加 `fontResolution`：在当前活动页或 `rootId` 作用域内（展开 `ref` 实例引用的主组件字体）逐个文字字面比较指定字族字重与渲染器已注册的字面
（随包字体与宿主字体缓存），未注册的字族只有在截图机器装有该字体时才会被画出；直接 MCP 下显式传布尔 `fetchFonts:true` 才会联网下载（受超时约束，隔离草稿上下文禁止传 `fetchFonts`）。
引擎的质量结果含 `contentIssues`（阻断）与 `spacingLeads`（纵向容器下同级分组标题缩进/间距、小尺寸角标贴边，仅作线索）。过期 revision 拒绝
组装，不能仅用目录摘要替代风格正文。无文档时可在隔离 host 查询，但用户资产目录必须
与真实宿主一致。`get_design_capabilities` 使用实际 schema，未知或外部操作默认 sensitive。
统一 Skill 将用户提供来源的独立导入与从零设计阶段区分：宿主专用导入创建新文档，不借用通用敏感工具分发，也不改变已有 POC/草稿状态；这不放宽来源、写入和认证检查。
Figma REST 部分结果返回进度及未导入项目；可编辑文件的保存由宿主负责。Skill 用本次保存回执定位产物，调用中断时核查明确请求的目标和来源证明。
HTML 多状态导入工具按会话保存检查点；运行中查询可读取当前阶段，先保存已捕获画板，再继续同一分析与输出。取消或失败后，可独立请求保存已有画板。framePath 路径用于定位可访问的同源 iframe 中的操作和预期节点。
统一设计 Skill 和 HTML POC Skill 均随运行时分发；后者的截图脚本、共享 `judgement.md` 及引用资料也是必需文件。Cobalt companion 与 `cobalt-project.mjs` 属于同一 Skill 资源，完整组件/设计参考内容由 Skill 资源目录内的 `cobalt-reference` 提供；其固定 shell 快照与自有模板随 runtime 文件哈希清单分发，不新增 MCP 引擎工具。生成的 React 原型先编译到静态 delivery 再交接，业务 iframe 与完整 shell 的浏览器验收分别记录。
运行时同时分发无宿主耦合的设计领域模块（`selection-visual-evidence.mjs`、`png-rgba-codec.mjs`、
`device-frame.mjs`、`design-code-context.mjs`、`design-discovery-gate.mjs`、`draft-canvas-contract.mjs`、`draft-quality-gate.mjs`、
`draft-review-gate.mjs`、`draft-review-checks.mjs`、`poc-evidence-validator.mjs`、`font-resolution.mjs`、
`design-workflow-text.mjs`、`design-tool-text.mjs`、`managed-mcp-client.mjs`、`managed-daemon-client.mjs`）；
后两个文本模块是面向模型措辞的唯一来源，宿主按版本号校验后读取，版本不符即拒绝加载；
这些模块保持无顶层 `await`（按需动态加载 `engine-session.mjs`），以支持 Node >= 24 宿主通过 `createRequire` 同步桥接，
且 `canvaskit-scene-env.mjs` 同时兼容源码目录 `./web-bundle` 与发布目录 `./bin/web-bundle`。
离线评分脚本 [eval-synapse-design](../../scripts/eval-synapse-design.mjs) 可对企业列表、聊天界面、
POC 转高保真三类样例的调用轨迹和生成文档统计步骤完成度、关联 `ref`、变量绑定占比、阻断 lint、
临界点击目标及 POC 页面映射。
[eval-synapse-acceptance](../../scripts/eval-synapse-acceptance.mjs) 定义新设计、含已知缺陷、模糊修改意见三类验收场景，
并离线检查生产引擎能否指出含缺陷样例中每个缺陷所在的节点；实际模型输出仍需人工阅读。
字形墨迹诊断是测量结果而非指令：与同级上下堆叠的文字以自身文本框为参照，不以父容器中心为参照。
最终用户确认的风格正文以目录读取结果为准；POC 交接记录并再次校验文件和风格指纹，
文件指纹本身不能证明截图内容或实际视觉质量。
HTML Skill 的迁移清单记录源文件、摘要和风格排除项；`resolve-theme.mjs` 校验任务目录中
完整 DESIGN 的内容指纹，不加载另一套主题。HTML 浏览器检查、原型源文件和截图证据各自记录；
脚本不可用、视觉评审未执行或证据过期时不得报告质量通过。第三方素材条款见打包的来源说明。
空白画布初始化可使用 `set_design_md(onlyIfBlank:true)`，在一次已串行的 Node/WASM
引擎调用中拒绝带有节点、设计规范或已有设计变量的文档；失败不产生命令。
Node 仅为 `batch_design` 提取变量/主题前置参数；普通 `set_variables`、`set_themes`
必须保留其 object 参数，否则可发现的工具会在实际调用时报告参数缺失。

UI 与 MCP 共用 [AssetTools](../../packages/dsh-node-runtime/asset-tools.mjs)，
但浏览器目录属于各自 EditorState；不能把用户资产灌入共享 WASM 全局 registry。
UI 持久化动作未确认不能提前发布；预设异步读取必须保持顺序、整体发布。
文档未同步时资产保存/应用明确拒绝，避免保存旧版本或覆盖正在编辑的设计。
主题预设加载走 Node 设计事务与 draft autosave，再由常规同步拉回浏览器。
嵌入式编辑器遇到同步冲突时将决定权交给宿主，不自动接受远端覆盖本地画布。宿主可请求 `op-bridge/snapshot` 的 `recovery` 用途，读取浏览器当前画布及版本，即使处于冲突状态。回执沿用 `snapshot-result`；读取不推送守护进程、不解除冲突，也不写入源文件。独立浏览器的服务器权威同步仍使用既有恢复逻辑。

The runtime [task path helpers](../../packages/dsh-node-runtime/document-file.mjs) derive new artifact paths from the business name and the task identity. The workspace-relative task directory has a safe business slug and twelve hexadecimal digits of the SHA-256 task hash. OP publication uses the slug as its basename. Existing-file operations use the saved path.

A managed `.op` editor opts in to the refresh bridge through `managedRefresh` on initialization. The accessible refresh button sits left of Palette on the CanvasKit top bar. It sends `op-shell/refresh-canvas`; the host supplies busy and result feedback through `op-bridge/refresh-state`. `op-bridge/refresh-canvas` pulls once over the existing daemon channel. The browser rechecks the document revision and local dirty state before applying, and returns the status and applied canvas identity to the requesting host. The host may send `savedVersion` only for a confirmed disk-and-daemon update; the browser acknowledges the exact matching synced revision as saved. Managed pulls retain viewport, page identity, and valid selection, and page or camera changes alone do not write back to the daemon. A managed save snapshot returns `daemonVersion` for its exact synchronized revision, allowing the host to reject a stale file write. The `recovery` snapshot reports whether its captured revision was dirty. See [the refresh implementation](../../crates/op-host-web/src/live_sync_apply.rs).

主题控制不同于文档主题变量。[broker](../../packages/dsh-node-runtime/editor-control.mjs)
只在 editor ack 后报告 effective/preference/hostOverride；
`persist:true` 还要求 preference 符合请求。等待不能占 mutation queue，
MCP 和 `/api/assets/tools` 两条入口都要验证。超时不算 applied success，
render-only browser 不注册交互 editor。
reload 验收必须等待新 client 的成功 heartbeat 和真实 editor ready，再调用主题工具；
旧 client 在有效窗口内仍可被查询，固定 sleep 不能证明新页面已接管控制。

复验：资产/storage/editor-control HTTP 测试、draft API 回归、feature-enabled
managed_assets_tests，以及构建后的隔离 Chrome 资产和 AI 截图闭环。
真实命令：`DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`。

recipe 审计覆盖全部 TSX 支持文件和 CSS，而不只检查页面入口。删除筛选条件使用原生 TagGroup，不能以带 onClick 的 Icon 拼出删除按钮；只读队列使用 ChipGroup 的共享溢出实现。通话空状态/计数/头像分别由 EmptyWidget、BadgeContainerWrapper、Avatar 提供；Callback thread 的外表面复用 Card，连接线保留为截图布局，因为 marketplace Timeline API 没有自定义 marker 插槽。ModalPanel 入场动画归位后再比较聊天气泡和头像边界，避免跨两帧测量造成伪失败。

原生 TagGroup 是默认满宽的字段，嵌入已应用条件栏时必须显式 width auto、flex none，并验证标签与计数的中心线；仅检查页面没有横向溢出会遗漏多行回归。Insights 条件栏保持 48px 单行，窄屏只在该栏内滚动；Team Schedule 工具栏按业务视口换行，不能用固定 min-width 与横向滚动藏住操作。

POC 开发检查优先使用 SS Browser Use 打开实际本地 URL、读取 framePath 和新鲜引用并操作可见页面。验收截图显式请求 `quality: "original"`，保留完整视口的原始 PNG 文件和像素尺寸、CSS 视口、字节数及哈希；供模型显示的图片仍可能被附件服务缩小。原图模式不改变页面视口，不能冒充指定宽度检查。fullPage 与显式 viewport/annotated 互斥，仅捕获当前根文档；物理像素上限为 3200 万、最长边 32768px、PNG 20 MiB，超限分屏查看。browser_open 成功回执区分实际 url 和 requestedUrl，不能把地址栏文字当成成功；恢复时检查服务是否仍存活并复用已返回的 surfaceId；严格多视口、DOM 采集或静态证据要求仍由现有 headless fallback 满足。Browser Use 不可用或能力不足时保留旧 runner，已执行或结果不明的业务操作不自动重放。

POC review 的开发和正式模式共用有界 Chromium runner：开发模式使用已启动的本地 URL 并只写独立报告；正式模式校验 DESIGN 与外壳完整性后构建一次，再一次采集交互、完整视口/裁剪截图和 live DOM。`verify-surface --capture` 检查来源、静态入口、PNG 字节/尺寸/哈希及所需完整视口后复用采集，不再次启动浏览器。手动质量判定仍需确认；开发、历史和中断模式不可交接，先前正式账本及图片保存到 history。显式同源 frame 路径支持真实鼠标、键盘、Tab 和焦点断言，跨源 frame 拒绝检查。源码 lint 排除编译 delivery 和哈希匹配的受保护外壳，完整产物指纹仍覆盖它们；可编辑 Extensions 不豁免。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "4c1def60-9ee2-4252-88e5-691ff369c53d",
  "verified_at": "2026-11-18T12:17:41.368453+00:00",
  "sources": {
    "packages/dsh-node-runtime/prototype-authoring.mjs": "72d050a9d2f9ef52b754ee77f6d2c5683bb14bb4189ad3a3372827c05803ada1",
    "packages/dsh-node-runtime/prototype-process.mjs": "380d7565451642de4e413eb7e0045714869e0c1caeff4558ce4e2ff62995824d",
    "packages/dsh-node-runtime/prototype-standalone.mjs": "de0e9b8aae0d38c64bab1a05873b10a37cd176a7f280b353fcd521ec396ef2fe",
    "packages/dsh-node-runtime/prototype-authoring.test.mjs": "192b248a11005da2dfaae17accd8fce07f62b8c65da48a79e1cc840873c6d6da",
    "packages/talkdesk-cobalt/tools/inspect-business-source.mjs": "62cbf360cbd4efff14340fa431763218a66ac89d058f97a54ee777eb06d937f4",
    "packages/dsh-node-runtime/headless-renderer.mjs": "60750070ecd164d232417acc47c9d6ef5cbef16e022547aadf762fb59956fd76",
    "packages/dsh-node-runtime/headless-renderer.test.mjs": "a15a19e97cf7afa781615a4869a2d482af8e4caf893422cb86604ac3e7eabeaa",
    "Cargo.toml": "8c00d949437236a529939a00b979ff2a55a2ee30af0e8f47835420b1681673d1",
    "crates/op-host-web/Cargo.toml": "5cd71a376c7fe79f0336458740d40829dbe87f81705b2ee19d920e7896f72d05",
    "packages/dsh-node-runtime/build-web.sh": "596d045386c43ec612f77c97ba2d2a752f3614b24cbbff301df75f950a76684f",
    "crates/op-dsh-engine/src/tool_catalog.rs": "2453cce3b0c9f8c336fd92bc6397f2653272e2ae21c76b528063ab4a6e033785",
    "crates/op-dsh-engine/src/lib.rs": "3610d050386b7a649db82f2a0701c3e10077b51f488e1f92c6bb07f9de487ddf",
    "crates/op-mcp/Cargo.toml": "1d260158e5a08f8287175910ab205e2a7fd9abc3a15a780abbcd20e6b635e2bd",
    "crates/op-mcp/src/batch_design.rs": "76fcf2e9dd71d83265b71be440df951228b94e43a719c9b74feda3661883e8a4",
    "crates/op-mcp/src/batch_design_wire.rs": "c8d207b5b12df9dd4265d86d27eaff5f84e678fd8be8b61e52ba158321139bf6",
    "crates/op-mcp/src/batch_design_wire_error.rs": "5d6cd20c06623d5df2d9af63e950a0b9620be66360a12e5f14a6cafe9eeda565",
    "packages/dsh-node-runtime/engine-session.mjs": "769400e8332e1e4b268858402a2e709de111aca84636ab689e3f4bcbc1fe7086",
    "packages/dsh-node-runtime/script-expansion.mjs": "38b6c412741da72b277cd8a0193cfba70f248430ff62b87d1e313e759a479d23",
    "packages/dsh-node-runtime/quickjs-script-sandbox.mjs": "1012ea01eb238e74858f867ecdca50e1ff75299a1f6d03d80c1c3df4508cdd96",
    "packages/dsh-node-runtime/script-expansion.test.mjs": "54ffbc142a37c8631733cd847b182130452a78001ee678be5c0ce9ff0fcb3685",
    "crates/op-design-lint/src/detectors/widget_a11y.rs": "2adc20f6bc58b4420b303241e297b4af21162ad9ccec7b7c7487a7223844cca0",
    "packages/bun.lock": "b6d549b7f67552d3688e9987e31ae87a9ddee5c1ecb5951bae174a0e4cfa35b5",
    "packages/dsh-node-runtime/selection-text-context.mjs": "d25443a5ba4ddc044de587272ed7f8e348f02d1f81ad9d5cd09c399f0fa13314",
    "packages/dsh-node-runtime/selection-text-context.test.mjs": "fadf9278e702f359bd366e9ae17f8f776a3f25ff0bd135e2f3fd8a4232915862",
    "crates/op-mcp/src/text_design_tools.rs": "39a5c1850bf046f9b43ca8824e8f0e9db7abe711735ecdce49fc9531e6ae4b40",
    "packages/dsh-node-runtime/host-http.mjs": "43d6a480c630a30e78205e489058c02c8081ee1e6f8c835f7940cf3d65d3eca9",
    "packages/dsh-node-runtime/host-render-tools.mjs": "a7ccb2d2689e4920c8a76d9e044399b5a2dd5337181322c98945bc088f1d14b7",
    "packages/dsh-node-runtime/node-host.mjs": "e6f04fb8b2db3bbd61ff6f69bb67bfe4b7fc8db140b88c8bd6bbe1b16dd3243a",
    "packages/dsh-node-runtime/asset-store.mjs": "b6c5a3a2d9b284e6399cc0cb8942d3973982c45c300d2f92092c35385114ef68",
    "packages/dsh-node-runtime/asset-directory.mjs": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7",
    "packages/dsh-node-runtime/asset-directory.test.mjs": "db59adb6bc09e94d512c86d91bb78ad58a0ec7a176cddffd0eb18917c2f515a0",
    "packages/dsh-node-runtime/asset-tools.mjs": "0fd1fcabdc68a4f1fb628816f5a38c93f5a2052d6347b59987d0048605b1cd9b",
    "packages/dsh-node-runtime/editor-control.mjs": "8fb0da89f7e860384a4e3ff4f935446295dc0877ddbe93c403834d3cd50b0d09",
    "packages/dsh-node-runtime/asset-browser.test.mjs": "8f6db793c69a259589e49618c3125902f7fc911bd945110a99ab14594952138d",
    "crates/op-host-web/src/managed_assets_sync.rs": "a4e4b0beeadd128ca933ccaa37b3d53984ce7a5311ad85664e43e99d6be316ec",
    "crates/op-host-web/src/live_sync_conflict.rs": "3ac9cb92125e3f7bfa0520060fd61ace2120af3b6bb0196192fe6b4e1224897f",
    "crates/op-host-web/src/canvaskit/refresh_toolbar.rs": "d3cd89630e845ad92d07f14edf69c735442a2c4e826df0135d2604c47ce1f002",
    "crates/op-host-web/src/live_sync_apply.rs": "e030c986ef59fb038f894503d7b4317ae4419c35ffd8c4286ed31af5b974f566",
    "crates/op-host-web/src/live_sync_glue.rs": "4c0e9e6f39a63cc9eee8a9a0f9d08484004431b9502a78a8415560de3dd8233c",
    "crates/op-editor-core/src/variables_resolve/evaluation.rs": "63949c106e12b274f5f7a095f30a58e531ca4d520a4dc077dc0708313edd89ac",
    "crates/op-dsh-engine/src/asset_semantics.rs": "e824cc1cae2126e23c8c556a521a01a70a5858d4ce8739df4086ca1dda6ffdae",
    "packages/dsh-node-runtime/ai-design-loop.test.mjs": "036abb2cb44f0734fd800c67a76e06350bc903366ead9cacc1e254b375f96233",
    "crates/op-ai-skills/src/synapse_op_design.rs": "aa71e21aa11fe61021cf114de84833a9076225ba501d082224edbe02dffc1529",
    "crates/op-ai-skills/skills/synapse-design/SKILL.md": "3cca33419ca621571d6f22dc2e5b7489d6908ba575f1178ce25e84fec886011f",
    "crates/op-dsh-engine/src/tool_catalog/ai_prompt_catalog.rs": "001400e5d2ba40d26fbcca1c4f402f5f73378ac807d80fab18b0d7d0456a8d73",
    "crates/op-dsh-engine/src/asset_catalog.rs": "0ccc4df25086e05e929cc9e2f359a95f8eadc611cd4053043bb0f4f8651e365d",
    "crates/op-mcp/src/design_agent_prompt_tool.rs": "2fccbe503a95c1d44a47fab5b37180daee3807930d41095000a7ed4e0fa9dd8b",
    "packages/dsh-node-runtime/design-style-plan.mjs": "0cce1c3a4cb801a5a369cc5843bf6b7449b22313e6aed4bc96d60d3a1c841255",
    "packages/dsh-node-runtime/design-canvas-plan.mjs": "677299d1011b953f99363c542981d7dfc98a7a6feb3d890e48e479bfa550a41e",
    "packages/dsh-node-runtime/design-tool-capabilities.mjs": "9670bbe2356f9b4d0b5d091b97cd1dbaad2650b8ba477b18e5c9c73d829d7e3a",
    "scripts/stage-dsh-runtime.mjs": "bba05df06c22238965d555277ac5d5058315dac905a709a1c8ffc2bd20661cdb",
    "crates/op-mcp/src/design_md_tools.rs": "3c64ae93c0342d6e553390057b876b8f1359e1651edd7930330342c131ee4fca",
    "crates/op-dsh-engine/src/library_tools.rs": "51d6b1361b6cffe37480b339dff1d7548f73c7e0ad31558479504cc47d67be37",
    "crates/op-dsh-engine/src/quality_tools.rs": "3cae4bf76ec15f74b8e7748d556d7588fbc464445bb3fea53caaff33b35549d5",
    "crates/op-dsh-engine/src/touch_target_quality.rs": "39e1373caecefb8aef60ae8f2853da860227aa864c73cd10bab4e265d42e0a79",
    "crates/op-dsh-engine/src/quality_reuse.rs": "660a9ac3c3668ac7974e39af915c920e7f95641b5b175f40b18a3f5babc464e4",
    "crates/op-dsh-engine/src/tool_catalog/quality_catalog.rs": "5062a8e9929c434621d7bae4a3d7d9917f333641968dd57162fefcce086ce15b",
    "crates/op-dsh-engine/src/prototype_simulation.rs": "6cc243135be5857eadfd0a34e2b501ef1f6963e9d8c7fbf05c9fc0457480814e",
    "crates/op-editor-core/src/prototype/simulate_types.rs": "5021fd46904cd494d8b845e224ee91dd45e79bfe75724f25884007bfa658dc9c",
    "crates/op-mcp/src/batch_design_result.rs": "3d0b2def64a696774d7cb55d79560eef0e48536d409d0e3561d1e0aa2df80898",
    "crates/op-mcp/src/design_prompt.rs": "a79eb0efa6ced607a2f1792016d32017606951b9baca2c359f0fc84ab7766b6d",
    "crates/op-editor-core/src/prototype/graph.rs": "7351bbf8dceb35feda8f323d97e274f6ff5c7539e12774f8df0002a4b9f900e5",
    "crates/op-host-web/src/widget_host/screenshot.rs": "7f6a4dd70f24900fac96149e837fa93643991e08f85dbc688c534fcd2012550a",
    "crates/op-editor-core/src/web_sync.rs": "1254e5f3362166ae586a41d6b6fccaedc3d1c215e21fc9306a080bf258fd6b37",
    "crates/op-editor-core/src/web_sync_document.rs": "e8ca2070aa8b4249c6ce2e68c7693e9f86ce380b13e2b203ae6c698752da696c",
    "crates/op-host-web/src/live_sync_document.rs": "fc5605742a47aeef1628bcd2b05e376281b9c8f8e72412b4f13216fd0871a25f",
    "crates/op-host-web/src/live_sync_selection.rs": "168e1bded56d037a6f8f4d883b9e9626024cf44aef63c8ff763eea2b7e9ccec6",
    "crates/op-pen-loader/src/adapter/pages.rs": "f3f9e6778af3881674efa26a2264fdd289e8df6e00bca3605be522f099aa9371",
    "packages/dsh-node-runtime/script-prelude.mjs": "f93cf95742f25d7bc18fd039404cfd626b146e41b61d7b7b0a21e37126bfa057",
    "crates/op-host-web/src/selection_push_queue.rs": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca",
    "crates/op-host-web/src/vscode_bridge/selection_history.rs": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6",
    "crates/op-host-web/src/vscode_bridge_snapshot.rs": "255a9ee42bb21a47786d261db9782d5ae04a1566eaa27435022beedbe0d5f9b8",
    "crates/op-host-web/src/vscode_bridge.rs": "6c597a1d77b380ec41e974db99c237a18b510797ba748fc932441eb810f6a36c",
    "crates/op-host-web/src/canvaskit/mount_keyboard.rs": "14733985448414a0eeaa03eecc167cf2b364b658b2c36f15f2c730fcf63b98ad",
    "crates/op-editor-core/src/bridge_protocol.rs": "5fd7696ddc93d57db1a187faf765617604708d81804d9660a7458286f7278ab9",
    "crates/op-dsh-engine/src/quality_variables.rs": "a609755711312f70becd1602b5ab1af179962eb2b0b69366a45fd889de501209",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs": "e3158b307af38cf7198bb93668de601d05032159d09416c1ab6e436510f6c225",
    "crates/op-ai-skills/skills/synapse-design-html/scripts/resolve-theme.mjs": "45978c4de0de9de54e12a77ccd1f67df649ed94c48feee68719634423c012206",
    "packages/dsh-node-runtime/html-skill-migration.test.mjs": "8cf16b450633883576e9466c3ef5820d9ad78b04aecd45cb6a39a0d8bf61bd1c",
    "packages/dsh-node-runtime/html-skill-browser.test.mjs": "215b53b2725e63e8f3757cd49914b2306a0485493b3e14967ccbf6a7ea9f268b",
    "crates/op-dsh-engine/src/quality_tokens.rs": "7bd6c5cc1830589f880b68ccc3d7b88df6f0a15c328ffb166f92a03a19680756",
    "packages/dsh-node-runtime/design-tools.test.mjs": "0d94b121da0c600ab01a83d18e74e076fe37e1a3ef795140eec8378f8aa65a3c",
    "crates/op-design-lint/src/detectors/sibling_peers.rs": "d02106737287006a49229fb702b2f4301304bf63368bc0bc88dd14e239089253",
    "crates/op-design-lint/src/detectors/siblings.rs": "c7574aebeee045e55f29db8abdab8e33e3d1f69e6d8cb446178b61deab349262",
    "crates/op-design-lint/src/detectors/siblings_tests.rs": "a3b733a883eab7b17414b25043c5d2243a9b96968196a2ee5b0d929d2f131ff3",
    "crates/op-design-lint/src/detectors/structural_quality.rs": "a97d94a9d3c21b020cddb5c8787d5c88b29df798987b469e2e9370ac0811fc32",
    "crates/op-design-lint/src/detectors/mod.rs": "5d25e0ada54ca082aee3260961e1c530fb0367ee47473456866e2688448bed83",
    "crates/op-design-lint/src/issue.rs": "88e7b7fe4bcbf319f7d41281ed14e90b3b84a25178c8991152240b2e258e1ed6",
    "crates/op-design-lint/src/fixes.rs": "8b5c907f30334a2e08bc14c32e078d01152068029923f78c7f4e331c7cb0649e",
    "crates/op-design-lint/src/plan.rs": "20e08721244d61653739e53524067585d1624b1fb808c81b0057c7c78e8816ba",
    "crates/op-editor-core/src/design_lint.rs": "73e85617429abc1abc5750a5ab11e31f5cbcdca3a2a569a169c41457eb3e2bb0",
    "crates/op-editor-core/src/design_lint_tests.rs": "0e3c7a2b4d50a1e954610d89aa5e1a59a200726633a57f68aff092542de0f8f2",
    "crates/op-mcp/src/lint_tools.rs": "64021f8f9e51105e71f76b4f1ed68973673c493af9681e25ff6f96d21ce05a55",
    "packages/dsh-node-runtime/canvaskit-scene-env.mjs": "6d8ce6115d9d6ca0605289f8b672bc39cb4229d9e6d00616a5f128c5294e9131",
    "packages/dsh-node-runtime/device-frame.mjs": "dd38bfa8577554ad9be31ff6a4e29110d992603214be70be4b50890c64ed11ea",
    "packages/dsh-node-runtime/draft-quality-gate.mjs": "0a1bf50c9e769c11802e6a6f345ac69a3ed7ee325e78b9b2616103da3e10ce2a",
    "packages/dsh-node-runtime/document-file.mjs": "ffc461fcf75719d5530643cc82398bae9b65e08aca20c7d0d33ac0f5f0419465",
    "packages/dsh-node-runtime/managed-mcp-client.mjs": "786ecf166cd5f6d31a02f313f20d5215c76e68fb05263c70430fb2a2474779b6",
    "packages/dsh-node-runtime/managed-daemon-client.mjs": "4477fa8eb6cce9aa5148b19e80cb446e0787cd336db476f87efee784ac1b2ca4",
    "packages/dsh-node-runtime/plugin-domain-migration.test.mjs": "593b5f2dfb9c085a8ebdb88f925efb399a1d73bfe89be0188150d07e3ab9a444",
    "packages/design-data/tools/catalog.mjs": "f425a059eb255b857eb94ac0dd3cf0b55b207d436367abd6938add949485b9b3",
    "packages/design-data/styles/talkdesk-cobalt/DESIGN.md": "c50257bfebfa010868ddb0cff1c4f62146b4421f65aacf4f94567a0ebea2dd32",
    "packages/talkdesk-cobalt/reference/source.json": "ea71c4addd8d64bbb1eee1b6cbea3afd290c7ed90e65e5ae56ecb6564d7ae508",
    "packages/talkdesk-cobalt/tools/export.mjs": "9f2c0390df7fa16443eb24182fd90b7cc2f9390d05d6d020d52452fa5eaf3e57",
    "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md": "ea4affed93e8392179240b2434754d75009173064c686d7fbea60cad8ef4b618",
    "packages/talkdesk-cobalt/components/extensions/src/basic-table/table-layout-measure.ts": "f068186339c999ee80f4a435fea70a13bb1c9de539e5f43037c4942cc3ae6c8c",
    "packages/talkdesk-cobalt/components/extensions/src/basic-table/basic-table.module.css": "548c6bb1153e4d666fa3d83ae65faae86aee858de3f3c4c68668e146accee983",
    "packages/talkdesk-cobalt/tools/content.mjs": "d7b9c84eb1a57fdeac983af4ae1156ea5062d5c11a1eec133672458ba397aaef",
    "packages/talkdesk-cobalt/tools/component-index.mjs": "1ee6e21def1544c27d0eb73cff59d71c43f06c9c7a1913206e6b0ffcd164d44b",
    "packages/talkdesk-cobalt/tools/cobalt-project.mjs": "5b7cf09f6587b82b01dd9bfd6c7b31bd725f7d53df6bb65db86e493892dac903",
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
    "packages/dsh-node-runtime/poc-startup-guidance.test.mjs": "b06d7ed0bdd60436bb10fcde6855e9d34bfe6d21ac0b8f453d3f9a7cd70ff1b8"
  },
  "reason": "Record current workspace artifact naming, managed canvas, and source import behavior.",
  "evidence": "Runtime task path and import tests, managed bridge tests, and local Electron acceptance."
}
```

Cobalt 运行时资源由 `packages/talkdesk-cobalt/tools/export.mjs` 输出到原 HTML Skill 路径；`cobalt-reference/registry/authoring.json` 索引 Cobalt Extensions 组件、示例与 recipe，`bundle.json` 记录内容 revision 和哈希。Astro 站点只负责展示同一份来源，不参与 MCP 路由。项目脚手架将完整 Cobalt 扩展源码复制到 `src/components/cobalt-extensions/` 并重写 recipe/示例为本地相对导入；不生成扩展 package.json、npm/file 依赖或包名别名，普通设计会话不访问外部文档 checkout。组件 INDEX、目录 README、recipe 说明和 AI-INDEX 由同一作者源生成；cobalt-lookup.mjs 提供有界搜索及按 ID 解析实际 API/源码路径，--read-source 读取完整实现、类型、CSS 和递归本地依赖。copy-source 支持独立页面，不安装依赖或修改已有 package.json。禁止安装 `@openpencil/cobalt-extensions`。recipe 记录默认导出、支持源码、依赖、覆盖状态和接入限制，项目副本保留完整文档与调整后的路径。完整 ListPage 组合扩展 BasicTable、SidePanel 和 marketplace Toolbar，选择提示通过 BasicTable 的 messageComponent 放在列头下方、数据行上方；不提供旧包名、资源路径或项目的兼容适配。

Workspace 脚手架固定 pnpm 11.7.0，并生成独立的 pnpm-workspace.yaml 以保留 React 18、显示旧 Cobalt peer 警告并允许 esbuild。shell/shell.css 的居中适配只写入项目副本；BasicTable 源码、完整 List page recipe、组件 API、集成说明与 Cobalt 提示词共同约束表格无外框、无圆角和无左右包裹留白。

Both preview adapters copy the canonical HTML review chrome.css: 44px including border, 32px desktop buttons and 36px narrow buttons. Workspace retains review-toolbar/review-dropdown/scenario state wiring and Feature flags; ordinary HTML has Size, Page state and Reset only. Shared SVG masks and theme colors preserve stable accessible names and prototype-* locators.

ListPage 的创建和导入通过复制的 Extensions Dialog/FormField/Input/Dropdown/UploadFile 实现，支持 TSX 工作流辅助源码随 recipe 一起索引和复制。Dialog 内的 PortalProvider 将嵌套菜单留在模态焦点边界内；无后端时只演示内存创建或文件选择，异步宿主失败保持弹窗以便重试。

Workspace 的手机预设和通知列表由自有模板控制。列表必须验证真实 shell iframe 中分页可见、行与列滚动和标题组中心偏差；仅孤立页面或无溢出不能证明完整布局。Echart insights 的 ECharts 渲染器随 recipe 支持源码复制，registry 同时列出 support CSS 和 echarts 依赖；仍无新增引擎工具或生产 Atlas/WFM 服务。

Cobalt SidePanel 为 body 内旧 marketplace 控件提供局部 PortalProvider，使 MultiDropdown 等弹层处于模态的焦点与层级边界内；不要靠增大全局 z-index 或强制点击绕过遮挡。Insights 按原生 SelectionGroup 的 radiogroup/radio 语义操作，Agent 筛选使用有名字的 MultiDropdown 入口与搜索框。

Cobalt FormField 的直接控件必须具有正常文本行高：Box 的 0 行高可令原生 Checkbox 标签布局高度为零，使 20px 伪元素向上覆盖字段标签。维护版 FormField 为直接控件提供 20px 行高，并保留 8px 标签间距；验收同时测 checkbox 布局高度和可见间距，不只检查表单外边距。

标题组审查必须同时检查字体/行高和文本框间隔：gap 较小仍可能被 40px 标题行高造成的留白放大。紧凑 Users 头部通过扩展 Typography 透传原生 Cobalt medium scale（24px/32px），使用 gap 0，不以负 margin 裁切行框或改变 h1 语义。

Insights 的复制闭包包含 header-actions/Copilot 源码与官方 Popover、ChatBubble 依赖。Cobalt 组件会动态插入 CSS，页面布局覆写需用组件作用域的足够选择器优先级，并实测原生 Flex 的整行默认宽度；不能用只通过交互的测试证明标题右侧对齐。Copilot Textarea 的 React Aria onKeyDown 只处理发送键，其余键调用 continuePropagation，才能让原生 ModalPanel 接收 Escape；完整 Workspace iframe 测试覆盖这一点。ECharts 还需监听主题 stylesheet load，因为原型首次挂载可能早于 CDN 变量就绪；卸载时移除监听。

Copilot 消息的内容列使用 width auto 与非增长 flex，发送气泡靠右并附尾随 tiny Avatar；不要用 grow/stretch 将短文本气泡撑成整行。ChatBubble 的最大宽度和长词换行保持在聊天记录宽度内。Ask Copilot 沿用原生透明样式，不另设静止背景；浏览器断言覆盖它相对 Export 的顺序与短消息几何。

普通 HTML review 库由独立模块导出到 HTML Skill 资源，不在提示词中重建 HTML/CSS/JS。项目副本校验静态文件哈希；新增控制库不引入 Host/Client 或 MCP 协议。状态通过业务页 URL/适配器切换，HTTP 本地多页导航保留当前业务入口；Reset 不清理业务存储。截图与 DOM 检查进入 businessEntry，完整来源指纹包含 preview 与 prototype-review 资源，避免 iframe 外层空 DOM 误判为通过。主 Skill、构建指南和 pocResolved 指令明确排除高保真中的预览专用控件，严格复刻也适用。

Card widgets、ECharts gallery 与 Team Schedule 通过同一 recipe/source-copy 导出链分发，支持文件包含共享 ECharts 渲染器、样例指标/事件和局部 CSS。主题和视口观察器在卸载时释放。静态原型的菜单注册由宿主项目配置控制；recipe 的可发现性不自动修改已有项目的 Dock 或页面路由。

TimezoneDropdown 的可选 customInput 由原生 marketplace Dropdown 连接点击/ref；本地触发器桥同步 disabled 与 aria-expanded。默认字段模式保留。该适配、角标、工具栏和图表布局均属于复制到项目的源码，不更改 upstream、MCP 或 SS Host/Client 合约。

Workspace adapter 7 merges built-in Dock entries by canonical ID, preserving official SVG URLs, titles and drawer shape. Built-in iconName is optional and cannot override the official icon; custom apps retain their icon contract. Registry schemaVersion remains 1. cobalt-source.json protectedFiles inventories and hashes shell, prototype-runtime, main and the verifier; builds run verify-workspace-shell before Vite. Business pages and Extensions stay editable, and existing projects are not automatically upgraded.

Copied Extensions use a private popup-dismiss-boundary with native close callbacks for innermost Escape, outside pointer/focus and business-frame blur. React portal ownership is checked after propagation; native exit animations require aria-expanded reactivation. Legacy MultiDropdown close renders can remove tabindex, so the labelled trigger preserves keyboard focus. Non-search dropdowns also accept Escape when focus remains on body. StatefulPopup keeps a normal target: changing it to a function switches to its controlled visible mode.

Component copy filters operate relative to the component source root, including installed runtime ancestors named node_modules/test/dist. Staging verifies registry-declared files and copied bytes before promotion. POC waitFor stable waits for finite target/ancestor motion and stable bounds without changing CSS; Browser Use settle supplies the visible-page equivalent. DOM inspection excludes ancestor-hidden/clipped controls and deduplicates identical observations. Local revisions use selected development sessions; whole-source/PNG fingerprints still gate final evidence, so cross-revision dependency-based reuse is not claimed. Fixed-version bundled Cobalt documentation is the default when MCP is unavailable unless the user explicitly requires MCP.

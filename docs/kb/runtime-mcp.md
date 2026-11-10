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
Node 展开的脚本对父容器启用严格校验：引用不存在的父节点会拒绝整个批次；
包含变量或主题前置操作的脚本先在隔离引擎中预检，失败不能留下变量或文档改动。
对已有节点的 [update_node](../../packages/dsh-node-runtime/engine-session.mjs) 与
[脚本 U](../../packages/dsh-node-runtime/script-prelude.mjs) 写入必须保留传入的精确数值；
只对新节点沿用现有审美尺度归一化，不能把精确修复再次吸附到相邻间距。
传统 operations DSL 不启用严格选项时仍保留原有的根节点回退兼容行为。
[控件 lint](../../crates/op-design-lint/src/detectors/widget_a11y.rs) 将明确命名为密码但未开启
安全输入的文本框报告为 error；宿主发布前须检查全部 error，不能只看普通 lint 首页。
[`get_design_quality`](../../crates/op-dsh-engine/src/quality_tools.rs) 的
[交互目标检查](../../crates/op-dsh-engine/src/touch_target_quality.rs)读取画布实际布局尺寸，而不是仅判断原始宽高；
对 `fit_content` 的小目标建议调整内边距，并在修复后重新计算布局。
[编辑器当前布局适配器](../../crates/op-pen-loader/src/adapter/pages.rs)未应用 `minWidth` / `minHeight`，包括响应式标记的文档，
不能将写入这些字段视为画布上的修复成功。布局检查不替代 CanvasKit 截图。

复验：`node --test packages/dsh-node-runtime/engine.test.mjs packages/dsh-node-runtime/design-tools.test.mjs`，
前提是生产 engine bundle 已构建。新增能力还需对应实际 tool 的回归测试。

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

## 截图等待不能锁住 renderer bootstrap

范围：Node host 请求调度。
[host-http](../../packages/dsh-node-runtime/host-http.mjs) 将 get_screenshot、
sample_color、compare_figma_fidelity、compare_html_fidelity 归为 render-wait（由
[host-render-tools](../../packages/dsh-node-runtime/host-render-tools.mjs) 应答）；它们不能持有 mutation queue，
否则 headless renderer 的 sync-reset/document pull 排在截图后面，会互相等待。
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
内置风格只有 Cobalt 和 84 份原始 DESIGN.md，稳定 id 来自目录名；目录只发元数据，
正文按 id 读取。内置风格的预览色块和摘要取自相同的 DESIGN，导入风格色块由其原文提取；
缺失时不生成占位色。模板类型、工具、资源及生产资料不再支持；旧库中的模板记录保留在
原数据库但不暴露。打开已有文档时，仅将旧文档目录中的用户风格和主题预设原子地合并一次，
不覆盖相同 ID，记录导入来源以避免已删除的资产在重启后重新出现。
目录的 `contentHash` 基于完整 Markdown，用于确认选择后检测正文变化；内置应用场景分类来自同一风格清单。
OP 设计 skill 与按需资料位于 `op-ai-skills`；`plan_design_style` 与资产 UI 共享目录和
revision，主机可通过 `get_design_agent_prompt` 按 id 注入完整原文。过期 revision 拒绝
组装，不能仅用目录摘要替代风格正文。无文档时可在隔离 host 查询，但用户资产目录必须
与真实宿主一致。`get_design_capabilities` 使用实际 schema，未知或外部操作默认 sensitive。
统一设计 Skill 和 HTML POC Skill 均随运行时分发；后者的截图脚本及引用资料也是必需文件。
最终用户确认的风格正文以目录读取结果为准；POC 交接记录并再次校验文件和风格指纹，
文件指纹本身不能证明截图内容或实际视觉质量。
空白画布初始化可使用 `set_design_md(onlyIfBlank:true)`，在一次已串行的 Node/WASM
引擎调用中拒绝带有节点、设计规范或已有设计变量的文档；失败不产生命令。
Node 仅为 `batch_design` 提取变量/主题前置参数；普通 `set_variables`、`set_themes`
必须保留其 object 参数，否则可发现的工具会在实际调用时报告参数缺失。

UI 与 MCP 共用 [AssetTools](../../packages/dsh-node-runtime/asset-tools.mjs)，
但浏览器目录属于各自 EditorState；不能把用户资产灌入共享 WASM 全局 registry。
UI 持久化动作未确认不能提前发布；预设异步读取必须保持顺序、整体发布。
文档未同步时资产保存/应用明确拒绝，避免保存旧版本或覆盖正在编辑的设计。
主题预设加载走 Node 设计事务与 draft autosave，再由常规同步拉回浏览器。
嵌入式编辑器遇到同步冲突时将决定权交给宿主，不自动接受远端覆盖本地画布；
独立浏览器的服务器权威同步仍使用既有恢复逻辑。

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

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "b6721655-aac8-44fd-9c80-b538ced3ac29",
  "verified_at": "2026-11-10T13:58:43.563259+00:00",
  "sources": {
    "Cargo.toml": "8c00d949437236a529939a00b979ff2a55a2ee30af0e8f47835420b1681673d1",
    "crates/op-host-web/Cargo.toml": "5cd71a376c7fe79f0336458740d40829dbe87f81705b2ee19d920e7896f72d05",
    "packages/dsh-node-runtime/build-web.sh": "596d045386c43ec612f77c97ba2d2a752f3614b24cbbff301df75f950a76684f",
    "crates/op-dsh-engine/src/tool_catalog.rs": "328a762641bfc6e199e2c95b0ebafe5fddb34387393118ea94cdda1098e83001",
    "crates/op-dsh-engine/src/lib.rs": "514f850d4811514dcc6ffa09fc9990d4f2b30e8345ee2f3fce9a338f4f277591",
    "crates/op-mcp/Cargo.toml": "1d260158e5a08f8287175910ab205e2a7fd9abc3a15a780abbcd20e6b635e2bd",
    "crates/op-mcp/src/batch_design.rs": "dec04c3a39db844599d5b13fc0352814662dbaff97323152fc0b59220a417199",
    "packages/dsh-node-runtime/engine-session.mjs": "aba6edd0d9a44f8a642fe7eae2ed08f4e070df1b7a56c976ea7154380387c213",
    "packages/dsh-node-runtime/script-expansion.mjs": "7543df99a007a5f036aa5f86009b0b96aca0b59a5b91a317eb91aa470bfe2dd3",
    "packages/dsh-node-runtime/quickjs-script-sandbox.mjs": "2af27e544f9042e11b2bd6ac1f17a498ac4fb98252db40cb77d98602d375853d",
    "packages/dsh-node-runtime/script-expansion.test.mjs": "54ffbc142a37c8631733cd847b182130452a78001ee678be5c0ce9ff0fcb3685",
    "crates/op-design-lint/src/detectors/widget_a11y.rs": "2b922d0e31e423b35909413cc45601574d0b6b73203bcaf4ffbeb06035587423",
    "packages/bun.lock": "904f7d67cda57d5767df5e9c3ec6dc221da1559810db4a3bfdbde6e4c7ffab60",
    "packages/dsh-node-runtime/selection-text-context.mjs": "d25443a5ba4ddc044de587272ed7f8e348f02d1f81ad9d5cd09c399f0fa13314",
    "packages/dsh-node-runtime/selection-text-context.test.mjs": "fadf9278e702f359bd366e9ae17f8f776a3f25ff0bd135e2f3fd8a4232915862",
    "crates/op-mcp/src/text_design_tools.rs": "39a5c1850bf046f9b43ca8824e8f0e9db7abe711735ecdce49fc9531e6ae4b40",
    "packages/dsh-node-runtime/host-http.mjs": "43d6a480c630a30e78205e489058c02c8081ee1e6f8c835f7940cf3d65d3eca9",
    "packages/dsh-node-runtime/host-render-tools.mjs": "5b2c35117471753aff5c55a8121c227a8e573c90b5137e19f53d1496b2614b63",
    "packages/dsh-node-runtime/node-host.mjs": "e6f04fb8b2db3bbd61ff6f69bb67bfe4b7fc8db140b88c8bd6bbe1b16dd3243a",
    "packages/dsh-node-runtime/asset-store.mjs": "b6c5a3a2d9b284e6399cc0cb8942d3973982c45c300d2f92092c35385114ef68",
    "packages/dsh-node-runtime/asset-directory.mjs": "17d2e60ce7cbdf3f262a0c4009b9acf619add933e7fb47db2a0edaa37eec79e7",
    "packages/dsh-node-runtime/asset-directory.test.mjs": "db59adb6bc09e94d512c86d91bb78ad58a0ec7a176cddffd0eb18917c2f515a0",
    "packages/dsh-node-runtime/asset-tools.mjs": "5aef23a27f2165cda16647908a140e24c84f3653f03ec1601655fb1bc2fcbc80",
    "packages/dsh-node-runtime/editor-control.mjs": "8fb0da89f7e860384a4e3ff4f935446295dc0877ddbe93c403834d3cd50b0d09",
    "packages/dsh-node-runtime/asset-browser.test.mjs": "c44b799b5a9d4c99d15bde7366f05e5849adb43ed9f305e32d8ddf14715bd7d1",
    "crates/op-host-web/src/managed_assets_sync.rs": "a4e4b0beeadd128ca933ccaa37b3d53984ce7a5311ad85664e43e99d6be316ec",
    "crates/op-host-web/src/live_sync_conflict.rs": "3ac9cb92125e3f7bfa0520060fd61ace2120af3b6bb0196192fe6b4e1224897f",
    "crates/op-host-web/src/live_sync_glue.rs": "05029e909c98e92fa9c463eacf5d16bfe92e91c12b623366f1662cea5ac27477",
    "crates/op-editor-core/src/variables_resolve/evaluation.rs": "63949c106e12b274f5f7a095f30a58e531ca4d520a4dc077dc0708313edd89ac",
    "crates/op-dsh-engine/src/asset_semantics.rs": "e824cc1cae2126e23c8c556a521a01a70a5858d4ce8739df4086ca1dda6ffdae",
    "packages/dsh-node-runtime/ai-design-loop.test.mjs": "f640a2169d729b6a65702ac5e55dc4793485afca0ccef7a0861835e8f7ebeb85",
    "crates/op-ai-skills/src/synapse_op_design.rs": "6fd510e2e2d48640c3e8a06db4c8fe88fa9cf75e339bdee1b90d7f5eb1e89a1d",
    "crates/op-ai-skills/skills/synapse-design/SKILL.md": "5111cb87e2fd2bbc5af66f1782e1dfff5b297706914a45429751c1866f8fe2e4",
    "crates/op-dsh-engine/src/tool_catalog/ai_prompt_catalog.rs": "2a307331d4d48508b488e35c9c7bdf4b8501e7842b223674112e2318f4a8c972",
    "crates/op-dsh-engine/src/asset_catalog.rs": "3257cc1974621905047204b462986ae6d25f27cbff57f2f205be902a766b29e5",
    "crates/op-mcp/src/design_agent_prompt_tool.rs": "e422401006fd07231140bc5ae8558759600bd5524cd85879e0a624812c6b5156",
    "packages/dsh-node-runtime/design-style-plan.mjs": "d9c39a8bb75a580697619b1ae9b462760d6bf88f631505d0d8df141cb5014725",
    "packages/dsh-node-runtime/design-canvas-plan.mjs": "f3c780f638f328741849f4f14e8bfd43b7be1f9f00a3f27bf9b7793477ba5e9e",
    "packages/dsh-node-runtime/design-tool-capabilities.mjs": "9670bbe2356f9b4d0b5d091b97cd1dbaad2650b8ba477b18e5c9c73d829d7e3a",
    "scripts/stage-dsh-runtime.mjs": "8917deeb0f8b8b22136f98a83503bcc7116e1cdd6165fa3089eb82f27028180a",
    "crates/op-mcp/src/design_md_tools.rs": "3c64ae93c0342d6e553390057b876b8f1359e1651edd7930330342c131ee4fca",
    "crates/op-dsh-engine/src/library_tools.rs": "4788aebfd89c86fa91fc3968aa01a78f467b01634e5c9dd66f955866e0e0a755",
    "crates/op-dsh-engine/src/quality_tools.rs": "1eaaad9b07a60390100747ea5bf626af61191b5ab63e4de2bb85c191d04fafce",
    "crates/op-dsh-engine/src/touch_target_quality.rs": "0056a49ff93de654c5848f5448b78109bda2b9be485176ace9e3adeaad440cbd",
    "crates/op-pen-loader/src/adapter/pages.rs": "f3f9e6778af3881674efa26a2264fdd289e8df6e00bca3605be522f099aa9371",
    "packages/dsh-node-runtime/script-prelude.mjs": "b0ed377de4e8192325aeac120e5f75d918cec4198e305e0900a7eb4817c0ead2",
    "crates/op-host-web/src/selection_push_queue.rs": "ba3cfdb9f516b8b72aa6da19a2ddedc098946ca1cc4c736d2fe2ef413bc290ca",
    "crates/op-host-web/src/vscode_bridge/selection_history.rs": "b01c377d4f0190dfed5bf430df2a6bd97d360565d20dcb3bc9f096e49047c6c6",
    "crates/op-host-web/src/vscode_bridge.rs": "c946a25829b0fee6890c63ef47b820c2e5cb3c0bca351560dc4dfde72604669b",
    "crates/op-host-web/src/canvaskit/mount_keyboard.rs": "14733985448414a0eeaa03eecc167cf2b364b658b2c36f15f2c730fcf63b98ad",
    "crates/op-editor-core/src/bridge_protocol.rs": "7797cc7ac863d799a8358049a334dfbfea052fbd78e56eb4aa2bad55aec409be"
  },
  "reason": "Selection history and ordered retries change the editor-to-host selection boundary.",
  "evidence": "cargo test -p op-host-web --lib --features canvaskit passed 786 cases; isolated live-draft Chrome test exercised canvas selection and versioned edits."
}
```

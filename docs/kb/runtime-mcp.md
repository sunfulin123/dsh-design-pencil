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
`expandScriptWithVariables`：先用受限 vm 把 script 展开为 operations 再交给 WASM。
因此“WASM 无 QuickJS”不等于“Node MCP 不支持 script”；必须核对实际调用入口。

复验：`node --test packages/dsh-node-runtime/engine.test.mjs packages/dsh-node-runtime/design-tools.test.mjs`，
前提是生产 engine bundle 已构建。新增能力还需对应实际 tool 的回归测试。

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
正文按 id 读取。模板类型、工具、资源、生产资料和历史资产合并均不再支持。
Node 仅为 `batch_design` 提取变量/主题前置参数；普通 `set_variables`、`set_themes`
必须保留其 object 参数，否则可发现的工具会在实际调用时报告参数缺失。

UI 与 MCP 共用 [AssetTools](../../packages/dsh-node-runtime/asset-tools.mjs)，
但浏览器目录属于各自 EditorState；不能把用户资产灌入共享 WASM 全局 registry。
UI 持久化动作未确认不能提前发布；预设异步读取必须保持顺序、整体发布。
文档未同步时资产保存/应用明确拒绝，避免保存旧版本或覆盖正在编辑的设计。
主题预设加载走 Node 设计事务与 draft autosave，再由常规同步拉回浏览器。

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
  "task_id": "d7c48a9d-87cc-4072-bf2b-1bee9de13b7c",
  "verified_at": "2026-11-09T10:04:22.809153+00:00",
  "sources": {
    "Cargo.toml": "8c00d949437236a529939a00b979ff2a55a2ee30af0e8f47835420b1681673d1",
    "crates/op-host-web/Cargo.toml": "5cd71a376c7fe79f0336458740d40829dbe87f81705b2ee19d920e7896f72d05",
    "packages/dsh-node-runtime/build-web.sh": "596d045386c43ec612f77c97ba2d2a752f3614b24cbbff301df75f950a76684f",
    "crates/op-dsh-engine/src/tool_catalog.rs": "fee753c0cc498cee0b8b504862b6347c9cf6e6cb95a2af444d79af493c38e53a",
    "crates/op-dsh-engine/src/lib.rs": "24ae65072f011f377b955ca8bfa7ce5b86de25dcfafde4a5f0a8ce4cd950a4dd",
    "crates/op-mcp/Cargo.toml": "1d260158e5a08f8287175910ab205e2a7fd9abc3a15a780abbcd20e6b635e2bd",
    "crates/op-mcp/src/batch_design.rs": "dec04c3a39db844599d5b13fc0352814662dbaff97323152fc0b59220a417199",
    "packages/dsh-node-runtime/engine-session.mjs": "761a7a05786c19475454eb3cdff10667bb5da0c12273d002a847ca63f39ec4d4",
    "packages/dsh-node-runtime/host-http.mjs": "43d6a480c630a30e78205e489058c02c8081ee1e6f8c835f7940cf3d65d3eca9",
    "packages/dsh-node-runtime/host-render-tools.mjs": "5b2c35117471753aff5c55a8121c227a8e573c90b5137e19f53d1496b2614b63",
    "packages/dsh-node-runtime/node-host.mjs": "e6f04fb8b2db3bbd61ff6f69bb67bfe4b7fc8db140b88c8bd6bbe1b16dd3243a",
    "packages/dsh-node-runtime/asset-store.mjs": "1ac2e71d2e47465db223a87b316d584d845f54d52a7534208546ab1e1029e511",
    "packages/dsh-node-runtime/asset-tools.mjs": "ff6de9e61061aa7ea2de837c0db6c897bb97665fabed267391b9620cc0befed1",
    "packages/dsh-node-runtime/editor-control.mjs": "8fb0da89f7e860384a4e3ff4f935446295dc0877ddbe93c403834d3cd50b0d09",
    "packages/dsh-node-runtime/asset-browser.test.mjs": "c44b799b5a9d4c99d15bde7366f05e5849adb43ed9f305e32d8ddf14715bd7d1",
    "crates/op-host-web/src/managed_assets_sync.rs": "a4e4b0beeadd128ca933ccaa37b3d53984ce7a5311ad85664e43e99d6be316ec",
    "crates/op-editor-core/src/variables_resolve/evaluation.rs": "63949c106e12b274f5f7a095f30a58e531ca4d520a4dc077dc0708313edd89ac",
    "crates/op-dsh-engine/src/asset_semantics.rs": "6294aa071f9b45bd999e812f0a7c8ab996bf255ac34c6020f7fd13dddf8fcf60",
    "packages/dsh-node-runtime/ai-design-loop.test.mjs": "f640a2169d729b6a65702ac5e55dc4793485afca0ccef7a0861835e8f7ebeb85"
  },
  "reason": "Removed retired template transaction invariants and migration; retained scoped style/preset storage, confirmation and autosave boundaries.",
  "evidence": "asset-store tests: 13 passed; asset-tools and directory tests passed; DSH_E2E_CHROME=1 asset-browser and ai-design-loop: 4 passed, no skips."
}
```

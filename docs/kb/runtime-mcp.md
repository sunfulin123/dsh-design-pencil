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
模板必须保留变量、图片、扩展字段及 reusable master 依赖，实例化单次 undo。
每次托管插入单独命名空间化变量和主题轴；别名、公式、默认主题及节点覆盖均需改写。
完整别名允许 slash，但公式中的 slash 是除法；必须共用解析器的标识符语法。
模板库更新不能改变旧实例的变量值；复验要包含 save→insert→update→insert→undo，
以及多个主题轴同名来源在一个目标文档内的隔离。
Node 仅为 `batch_design` 提取变量/主题前置参数；普通 `set_variables`、`set_themes`
必须保留其 object 参数，否则可发现的工具会在实际调用时报告参数缺失。

UI 与 MCP 共用 [AssetTools](../../packages/dsh-node-runtime/asset-tools.mjs)，
但浏览器目录属于各自 EditorState；不能把用户资产灌入共享 WASM 全局 registry。
UI 持久化动作未确认不能提前发布；预设异步读取必须保持顺序、整体发布。
文档未同步时资产保存/应用明确拒绝，避免保存旧版本或覆盖正在编辑的设计。
加载或实例化走 Node 设计事务与 draft autosave，再由常规同步拉回浏览器。

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
  "task_id": "74996489-c9be-4d1b-a26b-a81deaeef88f",
  "verified_at": "2026-11-09T03:58:23.609214+00:00",
  "sources": {
    "Cargo.toml": "8c00d949437236a529939a00b979ff2a55a2ee30af0e8f47835420b1681673d1",
    "crates/op-host-web/Cargo.toml": "5cd71a376c7fe79f0336458740d40829dbe87f81705b2ee19d920e7896f72d05",
    "packages/dsh-node-runtime/build-web.sh": "596d045386c43ec612f77c97ba2d2a752f3614b24cbbff301df75f950a76684f",
    "crates/op-dsh-engine/src/tool_catalog.rs": "fee753c0cc498cee0b8b504862b6347c9cf6e6cb95a2af444d79af493c38e53a",
    "crates/op-dsh-engine/src/lib.rs": "24ae65072f011f377b955ca8bfa7ce5b86de25dcfafde4a5f0a8ce4cd950a4dd",
    "crates/op-mcp/Cargo.toml": "1d260158e5a08f8287175910ab205e2a7fd9abc3a15a780abbcd20e6b635e2bd",
    "crates/op-mcp/src/batch_design.rs": "dec04c3a39db844599d5b13fc0352814662dbaff97323152fc0b59220a417199",
    "packages/dsh-node-runtime/engine-session.mjs": "c2d7d8028a13da2ed0842e977496436d2161662be89d2d5a09078ec82adb73ce",
    "packages/dsh-node-runtime/host-http.mjs": "43d6a480c630a30e78205e489058c02c8081ee1e6f8c835f7940cf3d65d3eca9",
    "packages/dsh-node-runtime/host-render-tools.mjs": "5b2c35117471753aff5c55a8121c227a8e573c90b5137e19f53d1496b2614b63",
    "packages/dsh-node-runtime/node-host.mjs": "ef1541d00731f3e5c78551f3487614cff8fce2a04fac5da0a93862418e15891d",
    "packages/dsh-node-runtime/asset-store.mjs": "66df967d9c4e7be10e36f1f8348d377ca90dad87f3d32291296c177ebcd6d483",
    "packages/dsh-node-runtime/asset-tools.mjs": "fdf48f0240503792ceab96cc435ca018b9941be3adad8fce3220b3324ccc7c46",
    "packages/dsh-node-runtime/editor-control.mjs": "8fb0da89f7e860384a4e3ff4f935446295dc0877ddbe93c403834d3cd50b0d09",
    "packages/dsh-node-runtime/asset-browser.test.mjs": "7ec18bb7069fbc40edee28fbab0316904064a4a1424cf272d26999c993313e7b",
    "crates/op-host-web/src/managed_assets_sync.rs": "be75c4ef515e50a1b182bc71d0c1b7d221689a6cb9ad5c518c8c6d16409cabb2",
    "crates/op-editor-core/src/scene_template_append.rs": "4a7eb51a15c1942f30e07b3b2ada2386b7bebe101b1adf6deaa5b06ddf3699d6",
    "crates/op-editor-core/src/variables_resolve/evaluation.rs": "63949c106e12b274f5f7a095f30a58e531ca4d520a4dc077dc0708313edd89ac",
    "crates/op-dsh-engine/src/asset_semantics.rs": "1b91e8c8205116614e9c948e83f27256b42341e28e1fe6f8ba4221debd94341f",
    "packages/dsh-node-runtime/ai-design-loop.test.mjs": "f640a2169d729b6a65702ac5e55dc4793485afca0ccef7a0861835e8f7ebeb85"
  },
  "reason": "Render-wait host tools moved from node-host into host-render-tools and now include compare_html_fidelity; catalog/dispatch rule unchanged (new schemas live in tool_catalog's html_import_catalog submodule).",
  "evidence": "host-http RENDER_WAIT_TOOLS includes compare_html_fidelity; DSH_E2E_CHROME=1 full node suite 177 passed incl. ai-design-loop and html-fidelity host tests"
}
```

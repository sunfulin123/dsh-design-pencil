# 开发与验收命令

本页是当前 DSH 项目的命令入口。根目录没有 package.json；Cargo workspace
只有 `op-dsh-engine`、`op-host-web`，不要把保留的上游 crate 当成 workspace member。

## 一次性安装 lint 依赖

Python 3.11+，Node 24+；Bun 版本与 `packages/package.json` 一致。

```sh
python3 -m venv .venv-lint
.venv-lint/bin/python -m pip install -r tools/requirements-lint.txt
cd packages
bun install --frozen-lockfile
cd ..
```

wrapper 自动使用根目录 `.venv-lint`，也可通过 `PYTHON` 指定解释器。
没有该环境时使用 python3，缺依赖会给出明确安装提示：

```sh
PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base <task-base-ref> --task <Task-ID>
PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base <task-base-ref> --task <Task-ID> --lint-js
```

`task-base-ref` 是本任务开始时的提交，或目标分支的 merge-base。
带 `--base` 才会检查本次改动是否包含 notes、基线是否新增/增大；
本地带 `--base` 必须同时指定当前 `--task`，不自动猜测或复用旧记录；
CI 使用提交 diff 与新完成的 v2 notes，不依赖本地私有状态。
修改或改名 base 中已闭合的 Task-ID 不算新证据；同一文件按最近完成记录核对当前指纹，
知识回执也核对当前文档指纹，较早任务保留当时的历史指纹。
不带它只验证现有源码、notes 和知识来源，不能代表本次开发已留证据。当前任务记录位于 `docs/notes/proposed/`
或 `docs/notes/implemented/`；归档记录、AGENTS、README 和模板不能替代任务证据。
`--lint-js` 对本次 JS/TS（含测试）执行 oxlint。

```sh
PYTHON=.venv-lint/bin/python bash tools/check-file-line-cap.sh
PYTHON=.venv-lint/bin/python bash tools/check-file-line-cap.sh --ratchet
.venv-lint/bin/python -m unittest discover -s tools -p test_code_line_cap.py
.venv-lint/bin/python -m unittest discover -s tools -p test_harness.py
```

`--ratchet` 只减少或删除旧基线；新增超限、增长都会失败，失败不写基线。
`--bootstrap` 仅用于首次引入，拒绝覆盖现有文件；日常开发不能重建基线。

## 每次开发的 notes 与知识

```sh
.venv-lint/bin/python tools/task_notes.py start <slug> --type <type> --summary "<任务范围>"
.venv-lint/bin/python tools/knowledge.py check
.venv-lint/bin/python tools/knowledge.py review docs/kb/<entry>.md --task <Task-ID> --action updated --reason "<复核原因>" --evidence "<确切来源/命令与结果>"
.venv-lint/bin/python tools/task_notes.py check <Task-ID>
.venv-lint/bin/python tools/task_notes.py finish <Task-ID>
.venv-lint/bin/python tools/task_notes.py archive <Task-ID> --reason "<放弃或停止的具体原因>"
```

start 输出 Task-ID、note 路径；开始前的脏改动不算本任务新增变更。
先修改失效正文，再 review；正文语义未改变时用 `--action unchanged` 并说明原因。
review 登记当前来源指纹，并自动写入本任务的知识复核记录，不执行字符串形式的验证命令。
无知识影响时在 note 的 Knowledge refresh JSON 写
`{"status":"reviewed","entries":[],"none_reason":"具体复核理由"}`，不能保留 pending。
finish 前填实际 Changes/Validation/Risks，运行相应测试和维护门禁；
工具迁移到 implemented 并保存变更指纹。已完成 Task-ID 不能被用来掩盖后续改动。
同一 worktree 只允许一个活动任务；继续已有任务应使用原 Task-ID，不能覆盖创建。
放弃任务用 archive，保留原状态/证据、归档时的变更指纹和原因，释放活动登记；
不要伪造 complete 或手动删除私有状态。受阻但打算继续的任务保留在 proposed。
start/review/finish/archive 写操作串行执行；另一条命令正在运行时明确失败，结束后重试。

## Rust

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets
cargo check --workspace
cargo test --workspace
cargo test -p op-host-web --lib --features canvaskit
cargo test -p op-host-web --test shader_fill_bridge --features canvaskit
cargo check --target wasm32-unknown-unknown -p op-host-web --no-default-features --features web
cargo check --target wasm32-unknown-unknown -p op-host-web --no-default-features --features canvaskit
```

默认 `web` 是 stub；默认 workspace 测试不等于 CanvasKit widget_host 覆盖。
修改具体依赖 crate 时还需运行其相应测试，先确认 `cargo metadata` 中的实际包与 feature。
`cargo fmt --all` 用于主动格式化；不要对脏工作树无差别格式化后顺手提交。
CanvasKit 专项 Clippy：`cargo clippy -p op-host-web --all-targets --features canvaskit`。
shader integration test 使用真实 CanvasKit 验证编译、uniform、非透明/非平坦光栅
和平移稳定性；当前是 Web 专用验收，不依赖退役 native 宿主，不保证 native/Web 统计一致。
Rust/JS lint 只因 error 失败，warning 保留但不阻塞；不使用
`-D warnings`、`--deny-warnings` 或等价的 warning 数量门限。

## Node、SDK 与 AI 设计闭环

```sh
node --test packages/dsh-node-runtime/*.test.mjs
DSH_VERIFY_FINGERPRINT=1 node --test packages/dsh-node-runtime/*.test.mjs
node --test scripts/check-dsh-runtime.test.mjs
node scripts/check-dsh-runtime-dependencies.mjs
```

真实浏览器闭环需先有 engine/web 构建产物及可用 Chrome：

```sh
DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/ai-design-loop.test.mjs
```

必须检查 Chrome 用例确实执行，不能把 skipped 当成真实截图验收成功。
闭环：建页 → 设计 → 截图 → lint → 修复/调整 UI → 截图；不要求导出代码。

在 `packages/` 中执行：

```sh
bun run lint
bun run lint:maintenance
bun run format:check
```

全量 `bun run lint` 保留上游扩展一致性检查；它与“仅检查本次 JS”是不同门禁。
失败需记录具体错误，不得通过关闭全局规则掩盖旧问题。

## MCP 设计资产

```sh
node --test packages/dsh-node-runtime/asset-store.test.mjs packages/dsh-node-runtime/asset-tools.test.mjs packages/dsh-node-runtime/asset-directory.test.mjs packages/dsh-node-runtime/editor-control.test.mjs
cargo test -p op-dsh-engine asset_tests
cargo test -p op-host-web --lib --features canvaskit managed_assets_tests
DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/asset-browser.test.mjs
DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs
```

CLI 默认把资产存到用户级目录（macOS `~/Library/Application Support/dsh-design-pencil/assets`），
跨草稿和重启保留；`DSH_ASSET_DIR=/absolute/path` 或 `--asset-dir /absolute/path` 覆盖它。
测试一律传临时目录，不要操作用户资产。需 Node 24+ 的内置 SQLite；没有额外 npm 数据库依赖。

可发现工具：
- 模板：`list_scene_templates`、`get_scene_template`、`save_scene_template`、
  `instantiate_scene_template`、`rename_scene_template`、`delete_scene_template`。
- 风格：`list_style_guides`、`get_style_guide`（支持稳定 id）、`import_design_md`、
  `rename_style_guide`、`delete_style_guide`。
- 预设：`list_theme_presets`、`get_theme_preset`、`save_theme_preset`、
  `import_theme_preset`、`export_theme_preset`、`load_theme_preset`、
  `rename_theme_preset`、`delete_theme_preset`。
- 编辑器外观：`get_editor_theme`、`set_editor_theme`；`persist` 默认 false，
  需要真实交互编辑器在线，headless 截图页不提供外观确认。

`import_design_md` 默认导入共享风格库；`target:"document"` 更新当前文档规范。

## HTML 导入与保真验收

```sh
cargo test -p op-html
cargo test -p op-dsh-engine --lib empty_document
node --test packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/html-fidelity.test.mjs
DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/html-fidelity.test.mjs
```

真实浏览器用例需要 Chrome（`CHROME_PATH` 可覆盖）与已构建的 engine/web；skip 不算验收。
MCP 用法：`import_html({htmlPath, viewports:[1440,390], readyExpression?, waitMs?})` 返回
`renderMode`、`boards`、`rootIds`、`fonts` 与 `warnings`；随后
`compare_html_fidelity({nodeId: rootIds[0], htmlPath})` 给出像素差、200px 分段、热点图层与可见文本覆盖率，
`verified:true` 为通过。`renderMode:"static-css"` 说明未找到 Chrome，保真度较低。

## 变量库（Talkdesk Cobalt）

```sh
cargo test -p op-editor-core --lib variable_library
cargo test -p op-dsh-engine library_tests
cargo test -p op-figma --lib fig_document_variables paint_vars
cargo test -p op-editor-ui --lib variables_panel
# 可选：只读核对真实 .fig 的变量绑定保真度（不输出文档文本）
DSH_REAL_FIG=/path/file.fig cargo test -p op-figma --release --lib fig_binding_fidelity_probe -- --ignored --nocapture
```

库工具：`list_libraries`、`list_library_variables`、`import_library_variables`、
`get_library_updates`、`accept_library_updates`；`apply_design_system({"name":"cobalt"})`
一次导入整库。设计时直接引用 `$--primary-9` 等名称即自动导入。

## 原型与 Present

```sh
cargo test -p op-editor-core --lib prototype
cargo test -p op-figma --lib fig_prototype
cargo test -p op-dsh-engine prototype_tools
cargo test -p op-host-web --lib --features canvaskit preview
```

原型 MCP 工具：`get_prototype`、`set_prototype`、`set_reactions`、`set_scroll_behavior`、`simulate_prototype`。
本机 `target` 若是失效符号链接，cargo 命令前设置
`CARGO_TARGET_DIR=$HOME/.cache/dsh-design-pencil/target`；WASM 构建脚本需要 PATH 中有
`wasm-bindgen`（通常在 `~/.cargo/bin`）。
`.optheme` 导入传 JSON 对象，Markdown 导入传正文，均不接受任意宿主文件路径。
更新/改名/删除用户资产需查询最新 `revision` 并传 `expectedRevision`。
`/api/assets` 只给目录，`/api/assets/<kind>/<encoded-id>` 读取完整配置，
`POST /api/assets/tools` 与 MCP 共用服务；检查 tool 的 `isError`，不能仅看 HTTP 200。
冲突返回 `asset-conflict`，busy 返回 `asset-busy`；应刷新或重试，不能宣称已保存。
模板实例的变量及主题轴按插入隔离；更新库模板不会重新染色旧实例。
插入后用 `get_variables` 查询目标文档的实际变量与主题轴名称，不假设源名称未改写。
真实浏览器验收需先重建 engine/web；资产用例确认临时/持久外观、reload 和 UI 目录刷新，
AI 用例确认真实 CanvasKit 截图、lint、修复/调整与第二次截图。Chrome skip 不算验收。

## 构建与隔离启动

```sh
bash packages/dsh-node-runtime/build-engine.sh
bash packages/dsh-node-runtime/build-web.sh
node packages/dsh-node-runtime/cli.mjs --serve-web --managed --port 0 --file /absolute/path/to/test.op
```

构建脚本使用 Rust 1.96.0、wasm32 target 和与 Cargo.lock 匹配的 wasm-bindgen。
用独立测试文档和随机端口，读取启动握手验证服务响应；不要打印生命周期 token。
CLI 由宿主保持 stdin，stdin EOF 会退出。不得把用户正在使用的 host 当作性能测试环境。

CI 的 [maintenance workflow](.github/workflows/maintenance.yml) 执行行数、
基线收紧、v2 notes、知识来源与复核证据、改动 JS、默认 workspace rustfmt/Clippy。
远端分支需将检查配置为 required 才能阻止绕过合入；本地配置不自动修改 GitHub 保护规则。
运行时构建与 Node 全套测试由 [runtime workflow](.github/workflows/dsh-runtime-release.yml) 执行。

首次落地时全量 JS lint 存在未修改的 error，详见
[首次落地 notes](docs/notes/implemented/maintenance-harness.md)。这些 error 和随后发现的 CanvasKit
测试编译 error 已修复，全量 packages lint、默认/CanvasKit Clippy 已通过，
详见 [lint 修复 notes](docs/notes/implemented/lint-errors.md)。Rust 1.96.0 Clippy 仍存在 warning；
日常维护门禁通过不代表未执行的全量检查也通过。
只有 error 阻塞 CI；warning 不算失败。不使用 continue-on-error 吞掉真实 error。

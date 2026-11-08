# 500 实际代码行门禁与开发 harness

Type: tooling
Status: complete

## Context

建立长期可维护的 Rust/JS 开发门禁；旧脚本仅统计 Rust 的 800 物理行，
既没有测试豁免也没有当前 CI 接线。用户选择旧代码基线逐步收紧，不做全量拆分。
Task base ref: `aa8c6eaaace191668168065ac485a191ae7fc705`。
本任务在已有脏工作树集成，不回退其他任务改动，不操作用户验证 host，不提交。

## Changes

采用固定 Tree-sitter grammar 统计自有源码，明确注释/字符串/测试/生成边界。
最终覆盖：2,495 个源码文件，245 个超限旧文件（Rust/资源脚本所在 crates 241、packages 4）。
不允许旧债增加、改名继承或基线增大；减少/删除要求显式 ratchet。
添加 notes 结构/任务变更检查、改动 JS lint、本地 wrapper 与独立 CI；
更新 agent 入口、命令、架构、开发规范、review 和已验证 KB。
Ruling: 用全仓库递归发现而非固定根目录白名单，独立 review 发现新增 deploy
目录会绕过门禁；添加复现测试并改为显式排除第三方/输出/临时资源。新目录现在自动受限。
Ruling: 仅对固定 Rust grammar 的两类有效语法节点做精确恢复并完整计数，
不改业务源码；外部类型的恢复必须包含真实分号，其他解析错误显式失败。
根目录 `.venv-lint` 是可复用的、Git 忽略的本地工具环境；wrapper 自动发现它。

## Validation

- `bash tools/check-maintenance.sh --base HEAD` — passed;
  scanner 21 tests、notes 7 tests；2495 源码、245 精确旧债，本次 note 检查通过。
- `.venv-lint/bin/python -m unittest discover -s tools -p test_maintenance_entrypoints.py` —
  passed 4 tests；包括 macOS Bash 空可选参数与 notes/KB 可进入 Git 的集成测试。
- Review finding: `test_new_owned_directory_cannot_bypass_the_cap` 已先失败后通过；
  repository-wide discovery 的第三方/输出排除测试通过，合计 32 个维护测试通过。
- `bash -n tools/check-maintenance.sh tools/check-file-line-cap.sh` — passed.
- `PYTHON=<isolated-lint-python> bash tools/check-file-line-cap.sh --bootstrap` —
  passed, initial baseline created without modifying business source.
- `bun run --cwd packages lint:maintenance` 和
  `bun run --cwd packages/dsh-node-runtime lint` — passed。
- `node --test scripts/check-dsh-runtime.test.mjs packages/dsh-node-runtime/package.test.mjs` —
  passed 16 tests。
- `node --test packages/dsh-node-runtime/*.test.mjs` —
  passed 126，skipped 1（未显式启用真实 Chrome 用例），failed 0。
- `cargo fmt --all -- --check`、`git diff --check` — passed。
- Ruby YAML safe_load 验证 maintenance workflow 和 3 个 instruction/prompt frontmatter —
  passed；16 个新增/更新入口文档的相对链接检查通过。
- `bun run --cwd packages lint` — failed before wiring new gates: 10 existing errors
  in figma-fidelity, figma-import-jobs, engine-session and offline-cli tests; not changed by this task.
- `RUSTUP_TOOLCHAIN=1.96.0 cargo clippy --workspace --all-targets -- -D warnings`
  （隔离 target dir）— failed at `crates/op-codegen/src/html_css.rs:200`，
  existing `clippy::collapsible_match` warning；本任务未修改该业务文件。
- Not run: GitHub CI 实际执行、CanvasKit 专项编译/Clippy和真实 Chrome UI 验收；
  本次不改变产品业务代码，已进行本地配置/脚本/Node 验证，不宣称这些未运行项目通过。

## Risks and follow-up

500 行旧债仍有 245 个文件，后续按职责拆分，而非重建/扩大基线。
既有全量 JS lint 问题保留并显式报告；新 CI 以本次 JS 改动执行 lint。
上述 Clippy 失败是首次落地时 `-D warnings` 将 warning 升级成 error 的历史结果。
用户随后明确只有 error 算失败，现行门禁已调整，见
[warning-policy.md](warning-policy.md)；warning 保留，不使用 continue-on-error 吞掉 error。
规则不能证明 notes 内容真实，也不能判断测试目录中是否藏了业务实现，需要 review。
不把默认 workspace 检查当作 CanvasKit 全覆盖；本任务不改变产品业务行为。

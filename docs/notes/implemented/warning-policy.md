# Lint 仅因 error 失败

Type: tooling
Status: complete

## Context

用户明确 warning 不算失败，只有 error 才算。原 Clippy CI 使用
`-D warnings`，将非阻塞建议升级成失败，需同步调整项目指导和门禁。
Task base ref: `aa8c6eaaace191668168065ac485a191ae7fc705`。

## Changes

移除维护 CI、PR checklist、Rust/CanvasKit 命令中的 warning 升级参数；
更新 agent、编码、开发和 review 规范。JS oxlint 原来未启用 deny-warnings，
保持其 error/warning 级别及非零退出码语义。
500 行、基线增长、notes 违规仍然是阻塞 error。
添加 CI regression，禁止将所有 warning 升级成 error，且不允许 continue-on-error 吞掉 error。

## Validation

- `.venv-lint/bin/python -m unittest discover -s tools -p test_maintenance_entrypoints.py` —
  new warning-policy regression failed before changing CI as expected。
- `RUSTUP_TOOLCHAIN=1.96.0 cargo clippy --workspace --all-targets`
  （隔离 target dir）— passed，exit 0；既有 collapsible_match warning 仍可见，
  不再升级为 error（lib/test 输出有重复提示）。
- `bash tools/check-maintenance.sh --base HEAD` — passed，
  scanner 21 tests、notes 7 tests，2495 源码和 245 旧债检查通过。
- `.venv-lint/bin/python -m unittest discover -s tools -p test_maintenance_entrypoints.py` —
  passed 5 tests；warning-policy regression 已由 red 转 green，合计 33 个维护测试通过。
- `git diff --check` — passed。
- Not run: GitHub CI 实际执行及产品浏览器验收；本次只调整 lint 严重程度及相关文档。

## Risks and follow-up

保留全部 warning 输出，真实 error 仍导致失败。
既有 JS error 不会因这次严重程度调整消失；未修改业务逻辑或自动提交。

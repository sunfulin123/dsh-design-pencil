# Notes 生命周期目录整理

Type: tooling
Status: complete

## Context

按用户截图将 notes 根目录整理为 archived、implemented、proposed、AGENTS.md 和 README.md。
保留已有任务历史，目录迁移不能使 harness 失效。
Task base ref: `aa8c6eaaace191668168065ac485a191ae7fc705`。

## Changes

三个已完成任务移入 implemented；模板移入 proposed；添加 notes 专用 agent 指引，
通过 .gitkeep 保留尚无记录的 archived 目录。更新根 agent、开发流程和命令文档的引用。
harness 排除支持文档，校验记录所在目录与 Status，归档记录不能充当当前任务证据。
不更改产品代码、用户 host 或历史验证结果，不自动提交。

## Validation

- `.venv-lint/bin/python -m unittest discover -s tools -p test_harness.py` —
  failed before implementation；复现支持文件被误认作 note、归档可充当任务证据、
  目录和状态未检查的问题。
- `.venv-lint/bin/python -m unittest discover -s tools -p test_maintenance_entrypoints.py` —
  failed before migration；notes 根目录与截图不一致。
- `.venv-lint/bin/python -m unittest discover -s tools -p 'test_*.py'` —
  passed，49 tests；覆盖目录布局、状态匹配、支持文件排除、归档证据和 Git 可见性。
- `bash tools/check-maintenance.sh --base HEAD` —
  passed；2495 源码文件、245 个旧超限基线不增长，4 篇任务记录通过检查。
- Python pathlib/regex 相对链接检查 — passed，10 篇相关文档的 33 个链接均可解析。
- 旧 notes 路径全仓库搜索 — no matches；仓库引用已同步。
- `git diff --check` — passed。
- Not run: Rust/JS/browser acceptance; this task changes only maintenance Python and documentation.

## Risks and follow-up

已完成记录仅迁移，不改历史状态和证据；外部保存的旧路径需更新。
仓库内引用和 notes/KB 的 Git 可见性已验证。未涉及产品运行时，不需要浏览器验收。

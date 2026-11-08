# 开发 harness

本页用于人和 AI 的每次开发。入口见 [AGENTS.md](AGENTS.md)，
验收命令见 [COMMANDS.md](COMMANDS.md)，审查标准见 [REVIEW.md](REVIEW.md)。

## 开始

1. 明确 feature/fix-bug/architecture 等任务边界和可测验收条件；
   多步任务先规划，普通小改动不制造多余文档。
2. 记录 task base ref；查看脏工作树，保留他人和先前任务改动。
   读取 [产品](docs/kb/product.md)、[规范索引](docs/kb/standards.md)、当前架构、
   相关子目录指导和有效的少量 KB，不把整个知识库注入上下文。
3. 运行 `.venv-lint/bin/python tools/task_notes.py start <slug> --type <type> --summary "<范围>"`。
   工具从模板生成独立 UUID、base ref、开始时间和 proposed note，并保存本地初始文件指纹。
   保留输出的 Task-ID 与路径，不手动复制旧记录；Status 为 in-progress。
   目录规则见 [notes 指引](docs/notes/AGENTS.md)。
   一个独立任务一篇；同任务后续可更新，不能反复覆盖旧任务记录。
4. bug 先复现用户原始问题，建立可自动运行、能失败的信号；
   feature 在正确 seam 加验收/回归测试，然后实现。

## 实现

- 遵循 [编码规范](CODING_STANDARDS.md)，500 行 checker 而非目测。
  旧超限文件只能变短；新增逻辑优先抽入 cohesive sibling。
- 搜索已有公共 helper 和调用者；修改所有相关表面，不只修一个 adapter。
- 机械拆分保持 import/公开接口、行为和测试名称；不要与需求无关地修旧问题。
- 不虚构成功，不吞错误，不通过删测试或降低阈值掩盖问题。
- 依赖仅在必要且声明后安装；维护锁文件。不要复制生成代码回源码。
- 实现中同步更新产品、规范、架构和 KB 的真实正文；只维护受影响知识。
  关联来源变更会触发失效检查。知识未改变时复核并说明 unchanged，
  不靠改日期或无意义改正文制造新鲜度。详见 [知识流程](docs/kb/README.md)。
- 同一 worktree 只登记一个活动任务。快照不含源码正文，不能自动区分别人并发写入；
  并行开发应使用独立 worktree，不把未经确认的他人改动算成本任务。

## MCP 和 AI 设计

任何可由 AI 设计/辅助设计的业务能力，评估并接入 tool：
catalog/schema → 参数验证 → command → undo/redo → 版本/页面同步 →
工具结果/错误 → 页面真实显示。
不能只写 schema，不实现 dispatch；也不能实现 UI 而遗漏 AI 能力。

验收必需链路：**建页 → 设计 → 截图 → lint → 修复/调整 UI → 截图**。
通过实际生产 WASM/Node MCP 执行；验证节点、页归属、视觉变化、lint 改善、
事务回滚和 renderer metadata。暂不要求代码导出。
原生 feature-unified 测试不能证明 WASM 支持脚本。

## 测试环境和资源

- 用户当前 host、文档、Figma 下载文件和共享端口不是可修改的测试 fixture。
  建立独立 host、复制或合成文档、随机端口，禁止测完切换用户页面。
- 对启动的进程验证存活及 HTTP readiness；外部 I/O 设置超时和输入大小限制。
  只停止自己启动的具体 PID；清理本任务临时资源，不清理共享目录。
- 浏览器截图需要真实布局/字体/图片完成，并标明 renderer；近似预览不能冒充真实验收。
- 性能改变测大文档、快速平移/缩放及停止后的清晰化；同时比较输出，避免更快但空白/闪烁。

## 完成

1. 运行覆盖本次改变的最小测试组合，确认 feature 实际启用；
   CanvasKit host 改动必须显式用 `--features canvaskit`。
2. 复核知识后运行维护门禁，指定本任务 base ref 和 `--task <Task-ID>`；
   减少旧债后先 `--ratchet`。
   Rust/JS formatter、Clippy/oxlint、type check 和真实浏览器验收按改动面选择。
   Lint 只有 error 算失败，warning 保留提示但不阻塞；门禁违规不能降级或忽略。
3. 做 [review](REVIEW.md)，处理高置信度问题；不能让测试替代设计/错误路径审查。
4. 更新 note：确切命令、passed/failed/skipped/not run、结果和剩余风险。
   未验证的工作不能写 complete。部分完成写 in-progress，受阻写 blocked，并解释原因，
   留在 `proposed/`。填写知识复核记录后运行 `tools/task_notes.py check <Task-ID>`，
   再执行 `tools/task_notes.py finish <Task-ID>`，由工具校验并迁移到 implemented，
   保存本次变更路径、内容指纹和完成时间；不要手工改状态绕过校验。
   放弃活动任务使用 `tools/task_notes.py archive <Task-ID> --reason "<具体原因>"`，
   保留真实状态、证据和归档变更快照，释放活动登记；不能假完成或删私有状态解锁。
   被替代的已闭合历史记录可放入 `archived/`，不能替代当前任务的开发 note。
5. 架构变更更新 [ARCHITECTURE.md](ARCHITECTURE.md)；命令变化更新
   [COMMANDS.md](COMMANDS.md)；稳定新经验更新 [KB](docs/kb/README.md)。
   规范变化更新单一规范文档，agent 文件仅链接，不复制大段重复规则。
   无知识影响也必须在本任务 Knowledge refresh 中说明具体原因。
6. 完成后可再次用同一 Task-ID 检查；后续改动需要新任务，不能复用已完成记录。
   清理测试资源；最终说明改动、验证、未完成项并链接本次 note。不自动 commit/push。

CI 检查大小、基线、记录结构，以及新完成记录中最新适用的文件/知识指纹；
修改或改名 base 中已闭合的 Task-ID 不算本次证据。**不能证明 note 中的结果真实**。
review 仍需核对命令输出、跳过用例和实际功能。CI 按提交范围检查，不能推断所有会话的任务边界。
本地显式 Task-ID 与初始快照负责区分先前脏改动；不能用环境变量伪装 CI 绕过。
所有凭据、私有设计内容、长日志留在 KB/notes 之外。

# 开发 notes

## 目录

```text
notes/
├── archived/
├── implemented/
├── proposed/
│   └── _template.md
├── AGENTS.md
└── README.md
```

- `proposed/`：待实施、进行中或受阻的任务；Status 为 `in-progress` 或 `blocked`。
- `implemented/`：已实施并完成验证的任务；Status 为 `complete`。
- `archived/`：已被替代、放弃或不再活跃的历史记录；保留原状态与证据，
  归档不代表完成。空目录由 `.gitkeep` 保留。
- [AGENTS.md](AGENTS.md)：此目录下 AI agent 的写作、迁移和验收要求。

每个独立开发任务使用 [任务工具](../../tools/task_notes.py) 的 start 命令，
从 [模板](proposed/_template.md) 自动生成 `proposed/<slug>-<id-prefix>.md`，
记录独立 Task-ID、base ref、开始时间和初始工作树指纹；同一任务持续更新同一篇记录。
完成验证和知识复核后用 check/finish 校验，再迁移到 implemented，并更新所有引用。
放弃活动任务用 archive 命令加具体 reason，保留原状态/内容/证据和归档变更快照，
释放活动登记后才能开始下一任务。不要手动移动活动 note 或删私有状态解锁。
任务记录直接放在对应目录，不再嵌套子目录；不要覆盖通用日志或把旧记录改成另一项任务。

## 内容与检查


Type 支持 `feature`、`fix-bug`、`architecture`、`refactor`、`perf`、`docs`、`tooling`、`test`。
Status 支持 `in-progress`、`complete`、`blocked`。
固定英文元数据和标题供机器检查，正文可用中文。
新生成记录为 Record-Version 2，增加 Task-ID、Base-Ref、Started-At、Knowledge refresh，
完成时保存 Completed-At 和 Changed files。旧格式不批量刷新，不再充当新任务证据。

必须包含原因/范围、行为变化、确切验证命令和结果、风险/剩余项。
没有适用测试时写 `Not run:` 并解释；失败、skipped 和未执行不能写成 passed。
架构任务增加决策/备选及兼容/回滚说明，并更新根架构文档。

`bash tools/check-maintenance.sh --base <task-base-ref> --task <Task-ID>` 核对指定的本地任务，
区分任务开始前后的文件内容；CI 要求提交范围有新完成的 v2 note，
修改或改名 base 中已闭合的 Task-ID 不算新任务证据。
重叠变更按最近完成记录核对当前文件/知识指纹，较早任务的当时指纹保持历史意义。
删除 note、仅修改 README/AGENTS/模板或归档记录不能满足。
门禁检查记录位置及其 Status 是否匹配；归档记录仍检查内容，但不能充当当前任务的开发证据。
CI 执行同一检查，结果真实性由 review 核对。
每个任务还需记录相关知识的 updated/unchanged 及原因；无知识影响也必须具体说明，
不能保留 pending。知识来源指纹须与当前实现一致；历史任务的当时指纹不强制追随后续实现。
完整命令见 [COMMANDS](../../COMMANDS.md) 和 [知识维护](../kb/README.md)。
不记录秘密、用户私有设计内容或原始长日志。可复用经验另入 [KB](../kb/README.md)。

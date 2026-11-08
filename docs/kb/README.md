# 已验证知识库

保存当前产品/规范入口和可复用、非显然、已验证的约束；先用测试或门禁防止回归。
agent 按任务查阅相关条目，不要默认加载全部 KB。

- [当前产品](product.md)：实际产品边界、AI 能力和验收入口。
- [规范索引](standards.md)：链接单一权威文档，避免规则副本失效。
- [Runtime 与 MCP 验收边界](runtime-mcp.md)：workspace、feature、真实截图、队列与 WASM script。
- [CanvasKit 资源与瓦片生命周期](canvas-resources.md)：snapshot surface、context resize、视觉差异验证。

每条知识必须注明：适用范围、结论和原因、源码/测试证据、复验方式。
变更相关实现时复核条目，失效内容修改或移除；未复验不要继续宣称有效。
临时进展进入 [notes](../notes/README.md)，架构现状进入 [ARCHITECTURE.md](../../ARCHITECTURE.md)。
review 规则入口：[REVIEW.md](../../REVIEW.md)。不要存 token、用户文档或原始长日志。

## 每次开发的知识新鲜度

开发开始先读产品/规范索引和相关条目；检查 provenance，不依据过期内容开发。
变更发生时同步修改相关正文；规范和架构仍维护在根权威文档，KB 仅维护入口/边界。

每篇条目使用 `## Provenance` JSON：version、status、task_id、verified_at、
sources（仓库内自有来源的 SHA-256）、reason 和 evidence。
初始化为 needs-review，不能作为已核实的事实；有效条目须 verified 并有可追溯任务。
来源变化、删除、非法路径或无证据会使门禁失败，不能靠刷新 verified_at 解决。

先核对并修正文，再运行 `tools/knowledge.py review <entry> --task <Task-ID>`
并传入具体 reason/evidence；语义没变用 action unchanged。
工具更新来源指纹，并自动写本次 notes 的 Knowledge refresh 记录；
声明正文指纹过期同样报错。历史 notes 保留当时指纹，不自动追随新版本。

所有来源检查由 `tools/knowledge.py check` 和 maintenance gate 执行。
工具不执行 evidence 字符串，也不能核实语言语义或替代真实验收；review 必须检查
新的知识影响、复核理由和真实命令输出。agent 要求见 [AGENTS](AGENTS.md)。

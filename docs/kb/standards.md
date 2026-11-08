# 开发规范知识入口

范围：本仓库人类和 AI 的开发、验收与知识维护；规范正文不在 KB 重复维护。

## 单一权威来源

- [编码规范](../../CODING_STANDARDS.md)：500 实际代码行、旧债收紧、Rust/JS 推荐规则。
- [开发流程](../../DEVELOPMENT.md)：任务记录、隔离测试、知识复核及完成要求。
- [Review](../../REVIEW.md)：语义、错误、兼容和真实验收。
- [命令](../../COMMANDS.md)：可执行入口与正确 feature。

有冲突时先核对当前实现和权威规范，不从旧 notes 或历史上游文档推导现行规则。
规范更改更新权威文档，本条更新来源与适用边界；不复制一份会逐渐过期的规则清单。

## 开发知识闭环

先生成独立任务 note，记录实际变更与验证；复核相关产品/规范/经验条目，
更新正文或说明语义未改变的理由；再校验并完成该任务。
放弃活动任务使用 archive 保留真实状态和变更证据，释放登记，不能假完成受阻任务。
来源指纹变化表示需要重新核实，复核时间本身不是知识有效性的保证。
工具可拒绝遗漏和来源失效，但不能证明编写者实际测试过或文字语义正确。

复核：运行 maintenance tests 和本地/CI 门禁，检查任务/知识命令及 agent 指引一致。
每个任务只有自己的记录；历史记录、模板、README 或归档编辑不能替代当前证据。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "6feafc4e-5363-47a4-9db0-483ee4b6380b",
  "verified_at": "2026-11-08T01:45:27.275872+00:00",
  "sources": {
    "AGENTS.md": "7da0c473de69169cfb78912511768de09471c37b27dda73ffa5a7c86ba8694ce",
    "CLAUDE.md": "bc7d7d08404221dac202b49a8ae99a6d27852c065739aa56962d38354392b235",
    "COMMANDS.md": "493f8561b7258f7c5c2f8e1ea9967a19d7b3daf1b3dc6bf82cb5eef571ee5dc8",
    "CODING_STANDARDS.md": "ffcd96889725001358ffcddc9dd58ace062c20b286823677b25a3c28bbb5f78d",
    "DEVELOPMENT.md": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e",
    "REVIEW.md": "27935d6e64cb4ed95272e396530c1aed3d1ea16f156e78b8ca8d31fc404488b4",
    "tools/check_harness.py": "2398ea6558ddb3203aa841c73a0ec484107f45085ed480f897249203d6d648f1",
    "tools/check-maintenance.sh": "da654754a4094a5f071483ea9eaf9985d4d5572f40ccb9d4e363f5f31f2ad06e",
    "tools/task_notes.py": "c1f04e736fcd39f1129482edccf98410738220e11d47528be150541390fc6d40",
    "tools/task_state.py": "df8b8d5431a7c52f1501d8205885c68fb3f0f18298d71a1a1e42aa8c17b04e8f",
    "tools/knowledge.py": "1c5c6ac72b2c3293b41fee762e67284e3c33b76e231f1ff7a7006cb7e5a27ca2",
    "docs/notes/AGENTS.md": "c11627c67deedf19997cf9a410f2d3ed99582b6839b2b6a73830176352d178e0",
    "docs/notes/README.md": "4bf1dcfe8e97d610f6c936525b43e07bb50096f17ad5df7722ed2325ea3c7ebb",
    "docs/notes/proposed/_template.md": "785194ea2b7907507c29662772f89ad2bee0a6c8e00c4d78416974d8beb9f459",
    "docs/kb/AGENTS.md": "4afa897d8c621a2cef31c72ae84c964b36df6aff752082663a5009d4d7970353",
    "docs/kb/README.md": "df094443c5068f5f61b0e826ed5d008d243a327f5d2f7a13cbf22558bf040cf8",
    ".github/prompts/verify-task.prompt.md": "22d283dd060634e6cae7c2f69af29ad6150990097eab69ea5ca78985fea8b5f2",
    ".github/instructions/rust.instructions.md": "249ba9f96f46a7f774388ee789b78fa18ee4c73c305334b63e42f72c80f44291",
    ".github/instructions/javascript.instructions.md": "258739dfde0348a64036ab71cd3a6c956cc4e641e931df8b322304ee3a160c09",
    ".github/workflows/maintenance.yml": "a766085afc8367de20e2b85778d4f1401b072a2ec09516fe317f3e9bd4bb3f0d"
  },
  "reason": "COMMANDS gained asset tools and acceptance commands; authoritative 500 effective-line cap, errors-only lint policy and independent task/knowledge lifecycle remain unchanged. Rechecked wrapper and task/knowledge command behavior.",
  "evidence": "cargo fmt --all -- --check passed; scoped oxfmt check passed 18 modules/tests; effective-line gate passed 2509 source files with 245 non-growing legacy entries; wrapper tests initially rejected deliberately stale KB sources before this review."
}
```

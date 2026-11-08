# 开发记录与知识新鲜度闭环

Record-Version: 2
Task-ID: c431c060-64bc-4c0a-b495-5b0f7ef35dba
Type: tooling
Status: complete
Base-Ref: aa8c6eaaace191668168065ac485a191ae7fc705
Started-At: 2026-11-07T14:04:41.108193+00:00

## Context

每次独立开发需生成可追溯记录，并复核产品、规范和相关知识，供后续 AI 使用。
用户确认任务生成工具、知识来源指纹和本地/CI 门禁的闭环方案。
保留现有脏工作树，不提交，不操作用户 host。

## Changes

新增任务 start/check/finish/archive 命令与独立 UUID、本地 worktree 快照和终态记录指纹，
避免把开始前的脏改动或旧 notes 当作当前任务证据。
新增知识来源检查与显式 review，产品/规范入口和现有经验条目具备来源、任务、时间与证据。
本地带 base 的验收必须指定 Task-ID；CI 要求已完成 v2 记录和当前知识来源。
更新 agent、notes/KB、架构、命令、review、workflow 和 PR checklist；不修改产品运行时。
Ruling: 本任务先用同样的状态格式 bootstrap 记录和快照，因为生成工具尚未实现；
后续任务必须使用 start 命令。快照记录内容指纹而不是私有源码正文。
Ruling: 首批 provenance 在所有规范/工具接线完成后登记，避免实现继续修改来源造成虚假新鲜度。
历史 notes 的当时指纹不追随以后实现；最新知识和指定当前任务必须检查当前指纹。
只读审查发现三项 Important、无 Critical，已修复：CI 排除 base 中已闭合 Task-ID，
按最近完成记录核对当前文件/知识指纹；放弃任务通过 archive 保留真实状态、内容、
证据和归档变更快照并释放活动登记；初始快照逐项检查自有路径及 SHA-256，拒绝 null。
Ruling: 新增 archive 是活动任务锁引入后必需的生命周期闭合，不用假 complete 或删私有状态解锁。
任务/知识写操作使用标准库 SQLite 事务锁串行协调，防止 finish/archive/review 竞争造成回滚覆盖。
既有历史记录不补造 v2 证据；CI 无法自动推断每个会话的任务边界。

## Validation

- `.venv-lint/bin/python -m unittest discover -s tools -p test_knowledge.py` —
  tests failed before implementation; source-change, today-with-stale-hash and malformed provenance regressions added.
- `.venv-lint/bin/python -m unittest discover -s tools -p test_task_notes.py` —
  passed 9 tests；真实 Git/worktree、旧脏改动、新增/删除、提交中途移动、知识失效和完成迁移。
- `.venv-lint/bin/python -m unittest discover -s tools -p test_harness.py` —
  passed 12 tests；旧记录不能冒充新记录，v2 完成需知识和变更回执。
- `.venv-lint/bin/python -m unittest discover -s tools -p 'test_*.py'` —
  passed 81 tests；审查回归在修复前复现了错误指纹、初始 null、缺少 archive/操作锁等失败。
- `cd tools && ../.venv-lint/bin/python -m unittest test_task_state test_task_notes test_knowledge test_harness` —
  passed 40 tests；包括 13 个 lifecycle、17 个 harness、6 个 provenance、4 个 state 用例。
  归档覆盖保护、释放登记失败回滚、并发写阻止、旧 Task-ID 改名复用和知识指纹失效均验证。
- `bash tools/check-maintenance.sh --base HEAD --task c431c060-64bc-4c0a-b495-5b0f7ef35dba` —
  passed；2495 个源码文件，245 项旧超限基线未增长。
- `node --test packages/dsh-node-runtime/engine-session.test.mjs packages/dsh-node-runtime/design-tools.test.mjs` —
  passed 22 tests，0 skipped；真实 Node/WASM 设计工具与 runtime 行为验证，不冒充浏览器验收。
- `CARGO_TARGET_DIR=/tmp/dsh-pencil-target CARGO_BUILD_JOBS=8 CARGO_INCREMENTAL=0 RUSTUP_TOOLCHAIN=1.96.0 cargo test -p op-host-web --lib --features canvaskit canvas_tiles` —
  passed 5 tests，795 filtered；33 warnings 非阻塞。只验证 tile lifecycle，不宣称真实 GPU 像素验收。
- `CI=true .venv-lint/bin/python tools/check_harness.py --base HEAD` —
  before finish rejected the unfinished task as expected；post-seal integrity/CI verification
  is performed after finish and is not predeclared as passed in this frozen record.
- `git diff --check`、`bash -n tools/check-maintenance.sh`、Ruby workflow YAML parse —
  passed。20 篇本次 Markdown 文档的 116 个相对链接通过；
  任务快照确认全部 30 个变更文件属于本次维护范围，无产品/runtime/用户设计改动。
  私有任务状态与源码正文不进入知识记录。
- Not run: remote GitHub Actions, new browser/GPU acceptance and branch-protection changes;
  outside this tooling-only task. No commit/push, global hooks or user-host/document operations.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Rechecked runtime boundaries and documented Node vm expansion separately from WASM QuickJS availability.",
      "sha256": "840b598f943a793b535c55004d94bf0882e39d87672feb5029557c052965f663"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "unchanged",
      "reason": "Retained bounded lifecycle claims after inspecting endTile, dropTile and resize; no new GPU visibility guarantee was added.",
      "sha256": "bd38482be0ebcedb4f934ce998cd4a39258787fae43c2dc3579e731c106ad3eb"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Added current product knowledge and rechecked it after maintenance architecture changes; product runtime behavior remains unchanged.",
      "sha256": "ea56dec2b44ccf2b8725644477424de267541d2dd10985339e00d388da9f538e"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "updated",
      "reason": "Checked archive lifecycle and strict current CI evidence against authoritative implementation and guidance.",
      "sha256": "cd23c7cf5ebb1c06add333c482688da31364c690df224d964d8b86b6d146948c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

工具只能核对记录、来源和证据结构，不能自动保证语义真实；仍需测试与 review。
来源变动后不能只更新日期，未验证内容不能标为有效。
CI 已本地接线与验证；真正禁止绕过合入仍需仓库 required checks，本任务未改变远端保护。

## Changed files

```json
{
  "files": [
    {
      "path": ".github/instructions/javascript.instructions.md",
      "before": "8909f47851869783c0e2bbb4b9a61b0b87144e13038eaeeab979119a5651008c",
      "after": "258739dfde0348a64036ab71cd3a6c956cc4e641e931df8b322304ee3a160c09"
    },
    {
      "path": ".github/instructions/rust.instructions.md",
      "before": "65cc0550e8a9f9f29040151c32e0da00fff1c464ba565e643b63b5a28af2e762",
      "after": "249ba9f96f46a7f774388ee789b78fa18ee4c73c305334b63e42f72c80f44291"
    },
    {
      "path": ".github/prompts/verify-task.prompt.md",
      "before": "b7fa2db87c805531ea6c25c7747ea9c2bb69abb8baebc36b807d9f02f7e461a6",
      "after": "22d283dd060634e6cae7c2f69af29ad6150990097eab69ea5ca78985fea8b5f2"
    },
    {
      "path": ".github/pull_request_template.md",
      "before": "ebff8994f761382f63836cb630085d82dbc6621ce63f2a6311c570a05c8185d2",
      "after": "91fbd5c6992675f5c2e789a0d771da9ad921b4e86a95a46912a8f43919529a41"
    },
    {
      "path": ".github/workflows/maintenance.yml",
      "before": "f67bd59aa9f18d50f7d95f837508ba000f9ecfbd67ab8dfff76dd6081ad5025b",
      "after": "a766085afc8367de20e2b85778d4f1401b072a2ec09516fe317f3e9bd4bb3f0d"
    },
    {
      "path": "AGENTS.md",
      "before": "05091137a386684da7e5c279f39abd03bace60b427f33440cfbc22dfff6236b4",
      "after": "7da0c473de69169cfb78912511768de09471c37b27dda73ffa5a7c86ba8694ce"
    },
    {
      "path": "ARCHITECTURE.md",
      "before": "1ad3ec6ec989eac3970d9e7c7c3e62a5f1527d188aba90257dcbf98741b9ddf6",
      "after": "10f8e388696d2bafccfff00525527bc06cb0f2df3dbdd56d6de01674e8ceecd2"
    },
    {
      "path": "CLAUDE.md",
      "before": "dda64ce441c2e90c36980823c4c36db8ab3f634ee457a39cddaedc733ef6132d",
      "after": "bc7d7d08404221dac202b49a8ae99a6d27852c065739aa56962d38354392b235"
    },
    {
      "path": "COMMANDS.md",
      "before": "d21e6fbc11803e7e201bb07eaedac74bf969782201084827c793601f98f45f53",
      "after": "56f6e63eee794983cc31652152513eb11deb0a431606add75f95e7ea09cc5bc0"
    },
    {
      "path": "DEVELOPMENT.md",
      "before": "0f5e3a7256093925fced61d6b4fd1a562b0fcded178320e37ebd508aab354785",
      "after": "6d171c6a706eb67581bb03b8f1d19f07ee8a639fd166c9e06e76c93280ccfb0e"
    },
    {
      "path": "REVIEW.md",
      "before": "e6c3c2717d933d62ecb3c643ac406f69f31d47e8c26c821127b14c9c851b725e",
      "after": "27935d6e64cb4ed95272e396530c1aed3d1ea16f156e78b8ca8d31fc404488b4"
    },
    {
      "path": "docs/kb/AGENTS.md",
      "before": null,
      "after": "4afa897d8c621a2cef31c72ae84c964b36df6aff752082663a5009d4d7970353"
    },
    {
      "path": "docs/kb/README.md",
      "before": "58356bfb05db88c2ad0857b6991b4ad27dec5a9d30919ef2d87b6f5f3b64abd6",
      "after": "df094443c5068f5f61b0e826ed5d008d243a327f5d2f7a13cbf22558bf040cf8"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "975314c39bc0ce01a22b4040c55337eff273ee47bb1d6c1ddf666f83e373d5a6",
      "after": "bd38482be0ebcedb4f934ce998cd4a39258787fae43c2dc3579e731c106ad3eb"
    },
    {
      "path": "docs/kb/product.md",
      "before": null,
      "after": "ea56dec2b44ccf2b8725644477424de267541d2dd10985339e00d388da9f538e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "121bcaf4a11194c9dc4f9a8fd67c93f5955387d77a49b615ee1b814372baa3b8",
      "after": "840b598f943a793b535c55004d94bf0882e39d87672feb5029557c052965f663"
    },
    {
      "path": "docs/kb/standards.md",
      "before": null,
      "after": "cd23c7cf5ebb1c06add333c482688da31364c690df224d964d8b86b6d146948c"
    },
    {
      "path": "docs/notes/AGENTS.md",
      "before": "76732b4719dd3b7930ebc10adf09f00ca61c1d97360e855ac84567dc0108027c",
      "after": "c11627c67deedf19997cf9a410f2d3ed99582b6839b2b6a73830176352d178e0"
    },
    {
      "path": "docs/notes/README.md",
      "before": "43a2508f6a58fe0a38c88584723e21eb26e41dd58b14b8dc276cc4c790ea046f",
      "after": "4bf1dcfe8e97d610f6c936525b43e07bb50096f17ad5df7722ed2325ea3c7ebb"
    },
    {
      "path": "docs/notes/proposed/_template.md",
      "before": "975c6dbee88f50753ff1b46329b187fc0c95d17ce1fe529f1478279bb743962b",
      "after": "785194ea2b7907507c29662772f89ad2bee0a6c8e00c4d78416974d8beb9f459"
    },
    {
      "path": "tools/check-maintenance.sh",
      "before": "0a341baf5a281ab238313f7e083a461e66a9f1040140e829dd48d33c922d1946",
      "after": "da654754a4094a5f071483ea9eaf9985d4d5572f40ccb9d4e363f5f31f2ad06e"
    },
    {
      "path": "tools/check_harness.py",
      "before": "f83565ca6fca6c402b83133beec3b3939509514b16b1ea75d0fdb36b9d378c67",
      "after": "2398ea6558ddb3203aa841c73a0ec484107f45085ed480f897249203d6d648f1"
    },
    {
      "path": "tools/knowledge.py",
      "before": null,
      "after": "1c5c6ac72b2c3293b41fee762e67284e3c33b76e231f1ff7a7006cb7e5a27ca2"
    },
    {
      "path": "tools/task_notes.py",
      "before": null,
      "after": "c1f04e736fcd39f1129482edccf98410738220e11d47528be150541390fc6d40"
    },
    {
      "path": "tools/task_state.py",
      "before": null,
      "after": "df8b8d5431a7c52f1501d8205885c68fb3f0f18298d71a1a1e42aa8c17b04e8f"
    },
    {
      "path": "tools/test_harness.py",
      "before": "c87f51b14f4979ca3a90125523ea87e4ad95fb374bb7dcf63468c2ec30c8682f",
      "after": "af69ef4f561f05943a53ac05d3130b9a33c938b0ae6e9db27bfcb6c4c1eabbb5"
    },
    {
      "path": "tools/test_knowledge.py",
      "before": null,
      "after": "53c8b463c74e6f6d2a2d805674788b25c1bc9b9699cedbb9c622f71ec31afe9e"
    },
    {
      "path": "tools/test_maintenance_entrypoints.py",
      "before": "1a664990f2778d9cfcfc9792bb2adafd979ee4154c0b9be855a5667c81292a5f",
      "after": "9e5dcc3b66382d1aa243b15df827cd22e7551a94e369e3e454b5c16c65b330b2"
    },
    {
      "path": "tools/test_task_notes.py",
      "before": null,
      "after": "b118a8713fddfff8ec08eb98bbea989a002ff43191e90118837d13dd6f47f972"
    },
    {
      "path": "tools/test_task_state.py",
      "before": null,
      "after": "4a1fc8c4a13a3cfe8a59211b3e6db072bb6fb827a24e14e8182e5985c3ff6d91"
    }
  ]
}
```

Completed-At: 2026-11-07T14:57:54.735636+00:00

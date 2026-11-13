# Fix code review findings: POC deviation approval gate, prototype simulation verification, content-visibility false positives/negatives, executed check method ledger, font resolution ref/page scope and fetchFonts boundary, eval scorer contract, spacing lead heuristics, hydration validation, and runtime discovery gate consolidation

Record-Version: 2
Task-ID: c178767c-2634-45d2-8ffe-24ffe3df1139
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-12T14:30:59.841898+00:00
Type: fix-bug
Status: complete

## Context

代码审查发现上一轮设计验收改造（`6eade7eb`）存在 8 项具体缺陷与收拢遗漏：
1. POC 实质偏离门禁可被旧阶段问题 ID 或用户选择“拒绝”（`options[1]`）的答案绕过。
2. 原型模拟校验在目标填当前起始页时放行无交互死按钮，同时误拒 `OPEN_OVERLAY` 抽屉/弹窗与变体切换。
3. `content-not-visible` 错误级检测器放行了渲染器实际会静默忽略的嵌套组件平铺覆盖键，且会对隐藏图层及属性/变量绑定文本误报阻断。
4. `review.checks` 未核验 `layout` / `lint` / `quality` / `node-read` 是否在当前版本真实执行，也未强制多屏节点覆盖与共享主组件修改后的实例回归。
5. `get_design_quality({ fetchFonts: true })` 在只读/隔离草稿上下文中允许外网下载且无超时约束；`fontResolution` 按 `rootId` 检查时不展开 `ref` 主组件字体，默认又误扫非活动页。
6. `scripts/eval-synapse-design.mjs` 仍按旧版回执字段判分。
7. `sibling-group-rhythm` 把横向分栏误判为同级分组并漏检带前置图标的标题行；`badge-edge-inset` 把含子串或 `fit_content` 普通节点误判为角标。
8. 插件侧会话回放解析未校验新增字段 `unverifiedChecks` 与 `actions`，且发现漏斗校验与路由策略文案仍留在 `ss-dsh-design` 中。

## Changes

- **POC 偏离确认门禁（#1）**：`draft-review-checks.mjs` 与新增的 `design-discovery-gate.mjs` 要求实质偏离或省略 POC 页面必须引用规范 ID `synapse-design-deviation:<draftId>:<screen>`（每屏唯一），且按位置核对用户选中同意项（`options[0]`）；复用旧问题 ID 或用户选中拒绝项（`options[1]`）均拒绝发布。
- **原型交互真实性（#2）**：`recordPrototypeRun` 记录 `startScreenId`、`overlays`、`variantOverrides`；跨屏导航必须离开起始页（或产生多步跳转记录），同时支持 `OPEN_OVERLAY` 抽屉/弹窗与 `CHANGE_TO` 变体切换，并校验控件节点位于所声明页面子树内。
- **内容可见性检测（#3）**：`content_visibility.rs` 移除 `ComponentIndex::collect` 中与 `op_editor_core::ref_resolve::remap_ids` 冲突的嵌套 `Ref` 递归；跳过不可见节点（`!is_node_visible`）；豁免由 `component_design.properties` 非空默认值或 `content` 绑定提供文本的节点，并新增 `componentValues` 空字符串与未知属性名检查。
- **方法执行台账、多屏覆盖与共享主组件回归（#4）**：在 `pending` 记录当前版本实际执行的 `layout` / `lint` / `quality` / `node-read` / `prototype` 检查并在文档变更时清空；多屏设计的必检维度必须覆盖每个已建页面子树；`recordModifiedMasters` 追踪实例已存在后被修改的共享主组件，要求回执覆盖受影响实例。
- **字体解析作用域与边界（#5）**：`font-resolution.mjs` 默认仅扫描当前活动页并在 `rootId` 作用域内递归展开 `ref` 实例引用的主组件字体；`draft-quality-gate.mjs` 在隔离草稿/外部参数守卫中禁止 `fetchFonts`，`host-render-tools.mjs` 校验布尔类型并施加 15s 超时上限；同步更新 `craft.md`。
- **评测脚本与启发式降噪（#6、#7）**：`scripts/eval-synapse-design.mjs` 对齐 `deviation` 新契约；`group_rhythm.rs` 仅在纵向容器的同角色子级间比较标题节奏、支持带前置图标的横向标题行，并对角标关键词施加词边界与显式小尺寸约束；重新编译了 `op-dsh-engine` 与 `op-host-web`（`build-web.sh`）。
- **单仓收拢与插件回放校验（#8 + 遗漏项）**：新增 `packages/dsh-node-runtime/design-discovery-gate.mjs` 收拢发现漏斗与问答选项校验，`design-workflow-text.mjs` 新增 `POLICY_REASON` 收拢路由拦截文案；插件 `design-funnel.ts`、`design-task-policy.ts` 改为薄桥接，`presentation-hydration-pipeline.ts` 补齐 `isValidUnverifiedChecks` 与 `isValidReviewedActions`，守卫测试扩展覆盖策略返回文案，并清理了 `runtime-local` 备份目录。

## Validation

- `cargo fmt --all -- --check`：通过。
- `cargo clippy --workspace --all-targets`：通过（`op-design-lint` 新增代码 0 警告）。
- `cargo test -p op-design-lint -p op-ai-skills -p op-dsh-engine -p op-mcp --lib`：全部通过（op-ai-skills 220，op-design-lint 280，op-dsh-engine 92，op-mcp 544）。
- `cargo test -p op-host-web --lib --features canvaskit`：788 通过，0 失败，29 忽略。
- `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh` 与 `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-web.sh`：均通过，引擎与浏览器端 WASM 已同步更新。
- `DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`：256 项，256 通过，0 失败，0 跳过（含真实无头 Chrome 端到端链路）。
- `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6 --task c178767c-2634-45d2-8ffe-24ffe3df1139`：通过。
- `.venv-lint/bin/python tools/knowledge.py check`：通过。
- 插件仓库（重新 stage 最新运行时并清理 `runtime-local`）：`npx tsc -p tsconfig.json --noEmit` 与 `npx tsc -p tsconfig.client.json --noEmit` 通过；`npx eslint plugins/ss-dsh-design/src --no-error-on-unmatched-pattern` 0 错误 42 警告；`node scripts/build.mjs` 通过；`DSH_E2E_CHROME=1 node --test --test-concurrency=1 tests/*.test.mjs` 518 项，497 通过，0 失败，21 跳过；`node scripts/docs/doc-check.mjs` 通过。
- Not run: 真实大模型在三类验收场景上的在线对话验收（需模型凭据与人工审阅输出）。

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Documented canonical POC deviation question approval (options[0]), overlay/variant prototype verification, multi-screen and modified-master instance coverage, content-visibility property/binding rules, and runtime discovery gate + policy text ownership",
      "sha256": "5bf67c6b59d60b2608daa8ff7631e4c507224ac81efc760e194de763c80537eb"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Documented active-page and ref-instance fontResolution traversal, fetchFonts isolated-draft restriction and timeout bound, and design-discovery-gate.mjs runtime distribution",
      "sha256": "e90b7ab1cb2f78ee7449f926a75a4df23f51559211dcfc8d7cdce8fda2b9b4d5"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- 宿主门禁可验证节点存在性、多屏/受影响实例引用、当前版本已执行方法、原型模拟转移及用户对 `options[0]` 的点击确认，但仍无法语义验证 `finding` 或 `deviation: "minor"` 的自然语言描述是否与画面完全吻合。
- 渲染画面级文字遮挡/同色/裁切仍依赖截图视觉审阅，尚未对整页所有文本框跑像素墨迹扫描门禁。
- 新版回执契约需本仓库新运行时与 `ss-dsh-design` 插件同步发布，发布后需更新插件 `runtime-release.json`。

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "47e123cf2ace6909435d597d2c67a4a41a0e31f029e1815768074fc0da1976ff",
      "after": "3dfc0e80c5769e4ab9d64cffbbbead2c4e88b8288112613df3e48693319c0893"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "22edf25b3c9b39549adb92d207dc20d4ff877b34fe281b7eb716e7dcb45b7ac5",
      "after": "6a28ad615f3c4f34af22ee543f9166ea3f340b50cbbd830b5b6a64880ee8ac9f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/craft.md",
      "before": "ed043b9cfdf72d77ecb3203579304fcf876e004056fe3c66487751d231a47e6c",
      "after": "84fd9719341b3418b25ae5615a238b16b77f3169b3297e8c9635b6fe3c47f846"
    },
    {
      "path": "crates/op-design-lint/src/detectors/content_visibility.rs",
      "before": "bb10a7e3cd1d3c431bbb8591f19925f0ba484907598d7241bf821da0ce4bb833",
      "after": "0b58ca0101d45bc6a67ab5d437deefebb4400638c3c7f4a034e3fe97a3f0c186"
    },
    {
      "path": "crates/op-design-lint/src/detectors/group_rhythm.rs",
      "before": "9fdf57a41df0c27abd070d0cae958008c59c8b5e6461a31eba454bd95f0d797a",
      "after": "d0cc283f836634b180e435acd3ebcb015434b79c40c94c74e1eae11e96488cb3"
    },
    {
      "path": "docs/kb/product.md",
      "before": "948e5278e9ba4091dd5a8806749b307500dde7fc155b27c106fef51ff3ee4264",
      "after": "5bf67c6b59d60b2608daa8ff7631e4c507224ac81efc760e194de763c80537eb"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "560d4d29cb05eb9bee979cc4950d50368cdf06f7709329defbeee35645cf19a4",
      "after": "e90b7ab1cb2f78ee7449f926a75a4df23f51559211dcfc8d7cdce8fda2b9b4d5"
    },
    {
      "path": "packages/dsh-node-runtime/design-discovery-gate.mjs",
      "before": null,
      "after": "0b0827744266e4627462a3678a54cd2dd63e56055503b8402d5d94c600b03bd8"
    },
    {
      "path": "packages/dsh-node-runtime/design-discovery-gate.test.mjs",
      "before": null,
      "after": "544aa648da4debddf01196eaa10ee70c519bce513e62fe5a5547b9e3b5ccf9f3"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": "4065d134697ac824366caeff5d6e15f9a74dd053cff21410cfeadebdc2302c6e",
      "after": "dacb8567e3e522a646986d74fde7f99333bc09dff80a81f14d107a6d298377e6"
    },
    {
      "path": "packages/dsh-node-runtime/draft-quality-gate.mjs",
      "before": "21403031e223cb1aff24f4500b1e842d1c8eaee650025d54528e78c801a3a491",
      "after": "0a1bf50c9e769c11802e6a6f345ac69a3ed7ee325e78b9b2616103da3e10ce2a"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-checks.mjs",
      "before": "bc89ce7580a6dd05fa0429fc5a4e97cfac9290fbd45b32e4aeb270bb0803420b",
      "after": "a0e95f171174650f37f09f854f029bb8cc18b562b703abcca0041e05858d77cf"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.mjs",
      "before": "38289fb90a6033aa1a4c39189f32c2d79a73e4bcd2988c8ebe2a82878560d2e5",
      "after": "7d978a0fc8c4be4e14b77e5e3866f084a9e38a2e7a7158efebeea2982e5fecd5"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.test.mjs",
      "before": "434a220eddccc6405e8b9516c79b2ae9b7c4bbde37cb9867a68b98ee1ae286b0",
      "after": "a3458e1d1cc218c7e49e810c6a76e7cdaa62a0159d6ee50442c32e62f6476a15"
    },
    {
      "path": "packages/dsh-node-runtime/eval-synapse-design.test.mjs",
      "before": "c7ad8ede29dbc5703c756c3067931a85d7571b39792f54ebf834b3c5e00164c7",
      "after": "bc70ab07fe8a71ee5bfcd6b23735f0b6a5e83b27089b0d58f2e1b46e148389f0"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.mjs",
      "before": "522d606c55227be07bc60aba91402bc2d33ef65afb9e9e520d6de44520d04768",
      "after": "e8f0500894f6ac79a3146ae6a0e6b63488fdd4e04ffcc3973f4970d37a52026e"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.test.mjs",
      "before": "db6f011af61b4f3953a6af196cc5da018699780f9a51a2e7cc14fd8031139ea4",
      "after": "a7a0b9e915af08da975056dced9a94d1314aee40e6a91fbe6b9ae3683fac60ef"
    },
    {
      "path": "packages/dsh-node-runtime/host-render-tools.mjs",
      "before": "d7a6d12040e5c538100e412847af9250c2c9f19d7c3b38ad0ffe41911b54d929",
      "after": "03356da0bc79c0abb6ecac56ede2e5753e18458f62ea913c532f323c48a04362"
    },
    {
      "path": "scripts/eval-synapse-design.mjs",
      "before": "d115a24ef8f273ba2eae97c427e5ee8b604daa030ed4559e8cbe5d77554845e7",
      "after": "d793f5109944191288ee9e4234c65e52fdfa5bf1f9b0826fec77a6c66fb08165"
    }
  ]
}
```

Completed-At: 2026-11-12T15:06:38.912394+00:00

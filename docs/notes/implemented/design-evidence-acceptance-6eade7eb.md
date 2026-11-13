# Evidence-based design acceptance: content-visibility blockers, four-status review gate, action truth, POC deviation confirmation, restructured stage-scoped skill text, font resolution, lint signals, and runtime-owned workflow text

Record-Version: 2
Task-ID: 6eade7eb-2758-4df9-bfc9-c0abb5afd0b1
Base-Ref: c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6
Started-At: 2026-11-12T13:12:44.552648+00:00
Type: feature
Status: complete

## Context

设计时调用 `synapse-design` 后，产出存在同级分组标题缩进/间距不一致、角标贴边、部分文字未显示、异常状态丢失外壳等问题，
而自检与交付门槛仍然通过。原因有三类：指导强调怎样画和调用什么检查，没有约束证据是否足够；交付门槛只校验字段格式
（每个维度一条不少于 8 字符的描述即通过，POC 台账强制 `accessibility.status="pass"`）；同一份完整指导在
resolve、begin、resume 重复下发，且面向模型的措辞有一份留在 `ss-dsh-design` 插件里。

范围：以本仓库为唯一来源，补上有证据的设计验收，并把插件中的重复内容删除。涉及 `synapse-studio-dsh/plugins/ss-dsh-design`
的改动在该仓库工作树中，未提交。

## Changes

- **内容可见性（阻断）**：`op-design-lint` 新增 `content-not-visible`（错误级）：空文本、指向缺失组件的实例、
  未命中组件任何节点的实例覆盖、把文字覆盖为空。`get_design_quality` 新增 `contentIssues`，草稿门禁将其视为阻断项。
- **证据门槛**：`draft-review-gate.mjs` 改为每个维度一项检查，状态为 pass / fail / unverified / not-applicable。
  pass 须引用已评审页面内的真实节点和实际执行过的方法；截图方法要求确有精确截图送达（近似预览不算）；
  fail 返回 `needs_correction` 且不计入无效回执次数；unverified 可发布并在结果中单独列出。删除了长度代理校验。
  新增 `draft-review-checks.mjs`。
- **操作真实性**：回执须列出主要操作并标为 verifiable / visual-only / not-implemented；verifiable 须对应一次
  在当前文档版本上到达目标页面的 `simulate_prototype` 记录，文档变化后记录失效。
- **参考保真**：POC 页面须声明 `deviation`；实质偏离或页面省略须引用用户已回答的问题，说明文字不再放行。
- **POC 台账**：`poc-evidence-validator.mjs` 与技能脚本 `verify-evidence.mjs` 接受 `unverified` + `uncovered`，
  并要求 `actions`；不再强制把无障碍等写成 pass。
- **技能文本**：`judgement.md` 重组为设计判断（意图、结构、三级空间、层级、一致、几何与视觉对齐、风格转译、可读可用）、
  阻断性质量底线、证据与交付、五维评审；新增按需加载的 `craft.md` 与 `feedback.md`；`review.md` 改为先完整后美观、
  三个尺度、诊断是线索；`SKILL.md` 升为 `synapse-design/3`，各阶段补意图、逐区域内容核对、任务流程与新回执；
  HTML 技能升为 `synapse-design-html/3`。旧规则集 `design_prompt.rs` 对齐三级空间与角标内边距。
- **按阶段下发**：`get_design_agent_prompt` 新增 `plan` / `build` / `review` / `revise` / `deliver`，
  以及只校验风格而不重复正文的 `includeStyle:false`。
- **lint 线索（不阻断）**：`sibling-group-rhythm`（同级分组标题缩进、标题到内容的距离不一致）与
  `badge-edge-inset`（角标贴边或越界），输出到 `spacingLeads`。
- **字体解析**：受管宿主的 `get_design_quality` 追加 `fontResolution`（指定字面与渲染器已注册字面的比较），
  `fetchFonts:true` 时才联网下载缺失字面。
- **墨迹诊断**：`glyph-ink-measurement.mjs` 的诊断改为测量陈述而非“上移/下移 N px”的指令；与同级上下堆叠的文字
  以自身文本框为参照。
- **措辞归属**：新增 `design-workflow-text.mjs`、`design-tool-text.mjs`，承载工具说明、参数说明、各步骤 `next`、
  发布报告、可读取的指导分区清单。插件侧删除对应字面量、重复常量（内容状态、评审维度、诊断上限、指导分区清单）
  和技能描述的后备文案，改为通过一个桥接文件读取并校验措辞版本；新增守卫测试，宿主源码出现自带的说明或指令即失败。
- **评测**：新增 `scripts/eval-synapse-acceptance.mjs`（新设计、含已知缺陷、模糊修改意见三类场景，
  以及含缺陷样例的离线定位检查）。

指导体量（字符数，未计风格正文）：改前为激活 15,296 + resolve 31,424 + begin 31,424 = 78,144，恢复草稿再加 31,424，
且风格正文在两次完整指导和 `design` 字段中共出现三次；改后为激活 19,336 + 规划 11,986 + 构建 8,677 = 39,999，
风格正文一次。核心 Skill 与判断规范本身变长（15,296 → 19,336，7,451 → 11,986）。

## Validation

- `cargo fmt --all -- --check`：通过。
- `cargo clippy --workspace --all-targets`：通过，仅有既有的非阻断警告。
- `cargo test -p op-design-lint -p op-editor-core -p op-dsh-engine -p op-mcp -p op-ai-skills --lib`：全部通过
  （op-ai-skills 220，op-design-lint 278，op-dsh-engine 92，op-editor-core 1280 通过 / 1 忽略，op-mcp 600）。
- `cargo test -p op-host-web --lib --features canvaskit`：788 通过，0 失败，29 忽略。
- `PATH="$HOME/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh`：通过。
- `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`：252 项，241 通过，0 失败，11 跳过
  （跳过项为需要 Chrome 或发布指纹的环境门控用例）。不加 `--test-concurrency=1` 并行运行时，
  `ai-design-loop`、`figma-rest-client`、`headless-renderer` 中有 4 个按耗时或重试次数断言的用例失败，串行运行通过。
- `bash tools/check-file-line-cap.sh`：通过。
- `bash tools/check-maintenance.sh --base c52591a4a34c9cd9a398dc4be4b8d9bd7bc1d4e6 --task 6eade7eb-2758-4df9-bfc9-c0abb5afd0b1`：通过。
- `.venv-lint/bin/python tools/knowledge.py check`：通过。
- 生产 WASM 引擎上的含缺陷样例（`eval-synapse-acceptance.test.mjs`）：四个预置缺陷的节点全部被指出，修复后的文档无发现。
- 插件仓库（以本仓库工作树 stage 的运行时）：`tsc -p tsconfig.json --noEmit` 与 `tsc -p tsconfig.client.json --noEmit` 通过；
  `eslint plugins/ss-dsh-design/src` 0 错误 42 警告（改前 40 警告）；`node scripts/build.mjs` 通过；
  `node --test --test-concurrency=1 tests/*.test.mjs` 518 项，497 通过，0 失败，21 跳过；`node scripts/docs/doc-check.mjs` 通过。
- Not run: `bash packages/dsh-node-runtime/build-web.sh`。Web 包未重新构建，stage 到插件的运行时使用的是先前构建的
  Web 包，其中内嵌的 lint 不含本次新增的检测项；引擎 WASM 已重建。
- Not run: 实际模型在三类验收场景上的运行，以及 DSH 桌面端验收。需要模型凭据和人工阅读输出。
- Not run: 带 Chrome 的精确截图链路（`DSH_E2E_CHROME=1`）。`fetchFonts` 下载后渲染器实际取用新字面未做端到端验证。

## Risks and follow-up

- 宿主只能核对被引用的节点是否存在、所称方法是否执行过、证据是否对应当前版本；无法判断文字结论是否属实。
- 渲染后文字是否可见（被遮挡、同色、被裁切）没有确定性检测，仍依赖模型查看截图；本次只覆盖结构性的内容缺失。
- `deviation` 的 none / minor / substantive 由模型自报，宿主只对 substantive 和省略强制要求用户确认。
- 共享组件修改后的实例回归只写进了指导文本，未做门禁；局部编辑不经过 finish 门槛。
- `fontResolution` 比较的是注册表而非实际字形；未注册的字族在装有该字体的机器上仍可能被正确画出。
- 两条 lint 线索依赖命名或角色识别角标、依赖“纵向容器以文字开头”识别带标题的分组，会有漏报和误报，因此为信息级。
- 回执结构不兼容旧版：旧的 `visual.observations` 回执会被拒绝。插件须与本运行时一起发布；
  已固定的发布版运行时仍是 `synapse-design/2`，需发布新运行时并更新插件的 `runtime-release.json`。
- 插件仓库中 `runtime-local/` 下留有两次 stage 时保留的旧运行时目录。

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Skills are now synapse-design/3 with stage-scoped guidance, an evidence-bearing review receipt (four statuses, action kinds, POC deviation confirmation), blocking content-visibility lint, and runtime-owned model-facing wording",
      "sha256": "948e5278e9ba4091dd5a8806749b307500dde7fc155b27c106fef51ff3ee4264"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Added stage prompt modes and includeStyle, fontResolution on managed get_design_quality, contentIssues and spacingLeads, new runtime modules for review checks, font resolution and model-facing text, the acceptance eval, and the ink-diagnosis wording",
      "sha256": "560d4d29cb05eb9bee979cc4950d50368cdf06f7709329defbeee35645cf19a4"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Record compatibility, known limits and remaining unverified scope before completion.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "4b7ac79add132b8160cd941228eeb6c41a6307c8a5a36cb582ee57f6268f4d7c",
      "after": "47e123cf2ace6909435d597d2c67a4a41a0e31f029e1815768074fc0da1976ff"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "541b5eb094c56dff52baf3b3147662e6337f4146fca4c020c1f8fce73b6f1acd",
      "after": "85ddd2e604b55a8c25f9aa62e75e73a462bdcb3d5654da9ab8dfd4808c067f07"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/judgement.md",
      "before": "939e401cffb76071c10f8a5bc007f62d9130bfd825a8865f37be45f35f242cbd",
      "after": "7c4acf2aa91872490e2ba2a2f2ffde4620f325613b172e7567a365dcb1b2a395"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs",
      "before": "09ceee198400ae958c061d10c8433f2198219c38a4dddf093ce87806ec4854b8",
      "after": "dfb227bc69ab4988f26979ec8b062ae83efa3d3ac4b657432f82248ba289fca8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": "c6f5f603968057f936fe6ba8ad649afcda2af3135cda44fc135384bc77f6d3a8",
      "after": "ff6ff786dc838f1679b7d6a00fda4946b19211b615eb0ea1bba5dbd2cb03e2e7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "aee9478d50cc63ee3ae77782e518e507960b748060bffb29f8e2aa79ecdc59fb",
      "after": "22edf25b3c9b39549adb92d207dc20d4ff877b34fe281b7eb716e7dcb45b7ac5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/craft.md",
      "before": null,
      "after": "ed043b9cfdf72d77ecb3203579304fcf876e004056fe3c66487751d231a47e6c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/feedback.md",
      "before": null,
      "after": "c9c30a902874d5904a7135e04f4e9e8ac7ae2015f199f6d86cdcfec5d19dc7ed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "ea499d466143fd6a27b9647aaaae5f902806e7db98111270c9844960cc3f6046",
      "after": "93b06d5a752268e3c53807a0c5b7ef5ce205b944187cf3c3b33e8679ae97e2e2"
    },
    {
      "path": "crates/op-ai-skills/src/synapse_op_design.rs",
      "before": "e9a955465bfc006e5c258aec6b356f672815b683f29db771c960e98c637892b1",
      "after": "c6f40d523106243157a239b37fccc7bfbd46af71f2c3b2c66f5f96205339c16e"
    },
    {
      "path": "crates/op-design-lint/src/detectors/content_visibility.rs",
      "before": null,
      "after": "bb10a7e3cd1d3c431bbb8591f19925f0ba484907598d7241bf821da0ce4bb833"
    },
    {
      "path": "crates/op-design-lint/src/detectors/group_rhythm.rs",
      "before": null,
      "after": "9fdf57a41df0c27abd070d0cae958008c59c8b5e6461a31eba454bd95f0d797a"
    },
    {
      "path": "crates/op-design-lint/src/detectors/mod.rs",
      "before": "50d062427839dbd1c35d42d46b28d3d9798645781e26fd908cb816d66be0ab6b",
      "after": "5d25e0ada54ca082aee3260961e1c530fb0367ee47473456866e2688448bed83"
    },
    {
      "path": "crates/op-design-lint/src/issue.rs",
      "before": "000c50ec5f47d1bb2ebf46d155cc0189b9f106c9f3da959be551cdb36d5f0873",
      "after": "88e7b7fe4bcbf319f7d41281ed14e90b3b84a25178c8991152240b2e258e1ed6"
    },
    {
      "path": "crates/op-design-lint/src/node_util.rs",
      "before": "839f120e0fc0a8e48e71eb8d2ab08f137865476d730d1e8b9086c64ce72408ab",
      "after": "1bf760206953690d47d413a13f46b6de68dcdbaa519d28fe327c0dbfde3d2b4b"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_tools.rs",
      "before": "1095a19f8c89efef6e8ee0bb0f6951b7c68d08992e90572db801bc0e186390de",
      "after": "3cae4bf76ec15f74b8e7748d556d7588fbc464445bb3fea53caaff33b35549d5"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog/ai_prompt_catalog.rs",
      "before": "2a307331d4d48508b488e35c9c7bdf4b8501e7842b223674112e2318f4a8c972",
      "after": "001400e5d2ba40d26fbcca1c4f402f5f73378ac807d80fab18b0d7d0456a8d73"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog/quality_catalog.rs",
      "before": "da2f71381fabd64fd75d819c5b40ecfb7e003523452e66b5a5f31be32ab3d566",
      "after": "5062a8e9929c434621d7bae4a3d7d9917f333641968dd57162fefcce086ce15b"
    },
    {
      "path": "crates/op-mcp/src/design_agent_prompt_tool.rs",
      "before": "67966b9a8b3c7bea78d29b653f8036471d931d6d2cc4a43068b9f54e990db564",
      "after": "2fccbe503a95c1d44a47fab5b37180daee3807930d41095000a7ed4e0fa9dd8b"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "b3125032adb70746becde64c24e7ec2695f69b602c77361d62a3c1c7f39dd3a8",
      "after": "a79eb0efa6ced607a2f1792016d32017606951b9baca2c359f0fc84ab7766b6d"
    },
    {
      "path": "crates/op-mcp/src/design_prompt_tests.rs",
      "before": "0f3404e3f63a6a7dc4eb7890a9809f22e71c7c79b5ae029008a4108e0b0cfa36",
      "after": "7f35229a966c8266db4868389785f713755b647b1bddf7f2f4042ec5e893cb9c"
    },
    {
      "path": "docs/kb/product.md",
      "before": "4505fba34f29e2f67f4c09dbe2a53428b8bbf91a25fc2b5b89627a1e965201e9",
      "after": "948e5278e9ba4091dd5a8806749b307500dde7fc155b27c106fef51ff3ee4264"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "3790475e9a36bd672b650b69812b543ad45764ed1cf9d6da808d0f57303b6c02",
      "after": "560d4d29cb05eb9bee979cc4950d50368cdf06f7709329defbeee35645cf19a4"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.mjs",
      "before": "5aef23a27f2165cda16647908a140e24c84f3653f03ec1601655fb1bc2fcbc80",
      "after": "0fd1fcabdc68a4f1fb628816f5a38c93f5a2052d6347b59987d0048605b1cd9b"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.test.mjs",
      "before": "7c0299be539cc37df19a971e3da02d47b4d0fefcbfdaffc2bb2ab9f00dd5eb7d",
      "after": "ae9268e08e2887885bb3829d359886e844d08960b3dcc8cbda74d906f3e47be0"
    },
    {
      "path": "packages/dsh-node-runtime/design-tool-text.mjs",
      "before": null,
      "after": "e8c897a47d44cafb115c9822934328cb9a66ba964dd9b9f35055c33dc0217c0b"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.mjs",
      "before": null,
      "after": "4065d134697ac824366caeff5d6e15f9a74dd053cff21410cfeadebdc2302c6e"
    },
    {
      "path": "packages/dsh-node-runtime/design-workflow-text.test.mjs",
      "before": null,
      "after": "949bd12174bce315aa14ec1af5072889e06798bbb4ad718ef32e118bb89404f4"
    },
    {
      "path": "packages/dsh-node-runtime/draft-quality-gate.mjs",
      "before": "89382aaa79a14a7dfd29c9141b3c9538804c81a1c208540f2b83be2dec9c2f62",
      "after": "21403031e223cb1aff24f4500b1e842d1c8eaee650025d54528e78c801a3a491"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-checks.mjs",
      "before": null,
      "after": "bc89ce7580a6dd05fa0429fc5a4e97cfac9290fbd45b32e4aeb270bb0803420b"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.mjs",
      "before": "ec234eeeebdc5391b96cc3518916f523c17e403b5bdafad2419a9c860d0889bd",
      "after": "38289fb90a6033aa1a4c39189f32c2d79a73e4bcd2988c8ebe2a82878560d2e5"
    },
    {
      "path": "packages/dsh-node-runtime/draft-review-gate.test.mjs",
      "before": null,
      "after": "434a220eddccc6405e8b9516c79b2ae9b7c4bbde37cb9867a68b98ee1ae286b0"
    },
    {
      "path": "packages/dsh-node-runtime/eval-synapse-acceptance.test.mjs",
      "before": null,
      "after": "0ca887e85cb83a4ac59673738744fae18aee850f9fe3e2f2b4a0188c2dc24fc3"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.mjs",
      "before": null,
      "after": "522d606c55227be07bc60aba91402bc2d33ef65afb9e9e520d6de44520d04768"
    },
    {
      "path": "packages/dsh-node-runtime/font-resolution.test.mjs",
      "before": null,
      "after": "db6f011af61b4f3953a6af196cc5da018699780f9a51a2e7cc14fd8031139ea4"
    },
    {
      "path": "packages/dsh-node-runtime/glyph-ink-measurement.mjs",
      "before": "c26d485d811121b511968f8e752908a74572d3610421ebf381bc2ea615db5ea3",
      "after": "c9adfc683bc4dd1679dd94dd9177c92f4f0d9a802eb20805dbe1ab85fbba706f"
    },
    {
      "path": "packages/dsh-node-runtime/glyph-ink-measurement.test.mjs",
      "before": null,
      "after": "c2bc4df38ddfffebbfa818e4e1a306e363d18e9fbbf51ed38946e3684b3e1ec8"
    },
    {
      "path": "packages/dsh-node-runtime/host-render-tools.mjs",
      "before": "5b2c35117471753aff5c55a8121c227a8e573c90b5137e19f53d1496b2614b63",
      "after": "d7a6d12040e5c538100e412847af9250c2c9f19d7c3b38ad0ffe41911b54d929"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": "4cd7b683911c62f3b070db2d7e9437898f0d62795da251d6e49f6b9faafde087",
      "after": "cd2eab98a370df3b4888c9763beb0df46d770b62dcead1dae0f9ec7fc6b6953a"
    },
    {
      "path": "packages/dsh-node-runtime/plugin-domain-migration.test.mjs",
      "before": "7e5dae8d115c7729623e45789d773580b825ba6bbf897fd4b266c1b51d38d675",
      "after": "61e5fc074542a6018d50231250ca66479bb234c6e6c212e12aca3e32692f2031"
    },
    {
      "path": "packages/dsh-node-runtime/poc-evidence-validator.mjs",
      "before": "4a3b31ca6fee925c79a68f5584baca7b3a429c99f2614a6ccc90174ee5f2f9ae",
      "after": "e4a6b754956601eea91fd3a5ae04e994c69d8db00abaccbbcaa203aa54682ec8"
    },
    {
      "path": "packages/dsh-node-runtime/selection-visual-evidence.mjs",
      "before": "edc871f259adb1b329a91b3b373ecffe1c4d2f4ed3d1fc1e2bf459510773b57e",
      "after": "25f99b077d23174e6390fe61378ae02a384d737548739b8177cab6c0103a7f2d"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "541b5eb094c56dff52baf3b3147662e6337f4146fca4c020c1f8fce73b6f1acd",
      "after": "85ddd2e604b55a8c25f9aa62e75e73a462bdcb3d5654da9ab8dfd4808c067f07"
    },
    {
      "path": "scripts/eval-synapse-acceptance.mjs",
      "before": null,
      "after": "2fe3c2c8824523f587d5a7fa71e48479ded5bdd14db092658d05634e55eeaef9"
    }
  ]
}
```

Completed-At: 2026-11-12T14:07:47.383699+00:00

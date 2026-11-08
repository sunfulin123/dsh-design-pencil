# 修复所有已发现的 lint error

Type: fix-bug
Status: complete

## Context

用户要求修复所有 error，warning 不算失败。复跑 packages lint 发现 9 个 error；
额外检查自有 CanvasKit bridge、图片缓存和 HTML extractor 发现 25 个 error。
Task base ref: `aa8c6eaaace191668168065ac485a191ae7fc705`。
保留原有脏工作树，只修改错误所在行，不操作用户 host，不自动提交。

## Changes

移除对象 spread 的空 fallback；保留 publicJob 排除内部字段的语义，使用明确的排除字段绑定；
测试直接使用已解构的 variables。未使用 catch 参数改为可选绑定，保持原有恢复/清理逻辑；
删除未读的 paragraph hasNewline 状态。

脚本模板中的 `\$` 会被 template literal 消耗，使生成的 regex 无法匹配前导 dollar，
造成 `V("$--accent")` 保留错误 key 并生成双 dollar 引用。改为无转义的字符类，
覆盖真实 expandScriptWithVariables seam，保留变量名中间的 dollar。
HTML extractor 镜像需由既有 sync 命令更新；旧超限文件缩短后收紧精确基线。

CanvasKit 全 target 检查还发现 shader integration test 引用未声明的
`op-host-native` 和 `skia_safe`，产生两个 E0433 编译 error。用户确认采用 Web 专用验收：
去掉退役 native oracle 和 native/Web 统计对比，不新增原生依赖。
保留真实 CanvasKit SkSL 编译、uniform 绑定、光栅方差大于 100 和逐字节平移一致性；
增加光栅 alpha 必须为 255 的断言，避免透明输出被当成成功。

## Validation

- `bun run --cwd packages lint` — reproduced 9 source errors before editing。
- `oxlint --quiet --config packages/.oxlintrc.json` 对自有 bridge/image-cache/extractor/scripts/tools —
  reproduced 25 additional errors。
- `node --test --test-name-pattern='script variable helpers normalize' packages/dsh-node-runtime/engine-session.test.mjs` —
  failed before fixing, actual key `$--accent` instead of `--accent`。
- `bun run --cwd packages lint` — passed；9 个源码 error 已清除，
  extractor-sync、sw-imports、locales、design-evidence 检查通过。
- `bash tools/check-maintenance.sh --base HEAD --lint-js` — passed；
  2495 个源码文件、245 个旧超限基线不增长，notes 和本次 JS/TS lint 通过。
- `node --test packages/dsh-node-runtime/*.test.mjs crates/op-host-web/tests/*.test.mjs` —
  139 passed、1 skipped、0 failed。Chrome E2E 未启用，不能算真实浏览器闭环验收。
- `.venv-lint/bin/python -m unittest discover -s tools -p 'test_*.py'` —
  45 passed。
- `cargo clippy --workspace --all-targets` — passed；保留 warning。
- `cargo clippy -p op-host-web --all-targets --features canvaskit` —
  最初两个 E0433，调整 Web 专用测试后 passed；保留 warning。
- `cargo test -p op-host-web --test shader_fill_bridge --features canvaskit` —
  4 passed、0 ignored；真实 CanvasKit 编译和光栅测试实际执行。
- `cargo check --target wasm32-unknown-unknown -p op-host-web --no-default-features --features canvaskit` —
  passed；未引入原生宿主或 Skia 依赖。
- `RUSTUP_TOOLCHAIN=1.96.0 rustfmt --check --edition 2024 crates/op-host-web/tests/shader_fill_bridge.rs` —
  passed。
- `git diff --check` — passed。

上述 Cargo 验证使用 `RUSTUP_TOOLCHAIN=1.96.0`、
`CARGO_TARGET_DIR=/tmp/dsh-pencil-target`、`CARGO_BUILD_JOBS=8`、`CARGO_INCREMENTAL=0`。

## Risks and follow-up

不关闭 lint 规则，不把 error 降级；warning 继续保留。catch 仅去掉未使用绑定，
不改已有兜底/资源释放行为。生产源码及镜像一致性已复验。
Web 测试不再声明 native/Web 渲染统计一致性，符合用户确认的测试范围；
若未来恢复 native 产品，需在独立 native 环境重新建立跨后端验收。

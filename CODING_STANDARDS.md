# 编码规范

目标是可读、可测、可定位且适合长期维护，不以“lint 绿了”代替行为正确。
命令见 [COMMANDS.md](COMMANDS.md)，工作流程见 [DEVELOPMENT.md](DEVELOPMENT.md)。

## Lint 严重程度

**只有 error 导致 lint/CI 失败；warning 保留提示，不计为失败。**
Rust Clippy 不使用 `-D warnings`；JS oxlint 不使用 `--deny-warnings`
或 warning 数量门限。不得通过 continue-on-error 或关闭 error 规则来伪装通过。
500 行上限、基线增长、缺失/无效 notes 等门禁违规仍是 error，不降级为 warning。

## 文件规模：500 个实际代码行

- 新 Rust/JS/MJS/CJS/TS/TSX/JSX 业务文件最多 **500 行**。
- 递归统计仓库内全部自有源码，不限于当前的 crates/packages/scripts/tools；
  新增目录（如 deploy）也自动受限，不靠根目录白名单。
  空行、纯注释不计；含 token 的行计入；多行字符串的非空内容也计入。
  格式化后的物理源码行是统计单位，不是语句数。
- Tree-sitter 按语言语法识别注释和字符串，而不是用 `wc` 或删除 `//` 的正则。
  固定 grammar 对 Rust 外部类型声明及 slice 的 `raw @ ..` 使用已测试的精确恢复；
  其他解析错误直接失败。这不是 Rust 编译器或 TS 类型检查的替代品。
- 专用测试目录 `tests/test/__tests__`、fixture 目录、`test_*`、`*_test(s)`、
  `*.test.*`、`*.spec.*` 以及明确 `*.test-helper.*` 文件豁免。
  Rust `#[cfg(test)]` item（含附属属性）和 `#![cfg(test)]` 范围豁免。
  `cfg(any(test, feature=...))` 可用于业务构建，不豁免。
  测试豁免不是放置业务实现的借口；review 必须检查实际调用者。
- 第三方、依赖、输出目录 `vendor/target/node_modules/dist/out/wasm/web-bundle`、
  Git、lint venv、worktree/agent/browser 临时缓存、
  明确的 `op-host-web/pkg*`、`op-web-sdk/pkg`、`op-host-web/assets/canvaskit`
  第三方资源以及扩展 vendor 镜像不计入。
  源码中的手写 CanvasKit bridge、HTML extractor **计入**。
  新生成路径需明确其生成命令和来源，审查后才扩展排除规则。
- [基线](tools/code-line-baseline.json) 是逐文件精确旧债，不是“允许所有旧文件超限”。
  新文件超限、旧文件增长、新增/扩大基线都失败；减少或删除后用 `--ratchet` 收紧。
  文件改名不转移豁免；必须拆分达标。CI 比较目标分支基线，首次引入需审查所有旧债。
- 不准 minify、合并语句、改名为测试或生成文件来规避限制。
  测试虽然不限行，也应按业务场景组织，避免巨型重复 fixture。

## 模块与接口

- 一个文件一个主要职责；优先按 cohesive feature 拆分，而非按行数随机切割。
- Rust 保留 `mod`/公开入口 spine，通过必要的 re-export 保持使用者路径稳定。
  JS 模块使用明确导出，避免循环依赖和 import 时启动服务器/全局可变状态。
- 机械拆分和行为修改分开验证。新抽象应消除真实重复或隔离复杂边界，不为未来假设搭框架。
- 标识符体现领域概念。Rust 文件 snake_case；JS/TS 文件 kebab-case；
  Rust/JS/TOML 源码注释使用英文，只解释不明显的原因。

## Rust

- 运行 rustfmt、Clippy；保持 wasm32 边界，不把 tokio、原生网络/窗口/GPU依赖带入平台无关层。
- 用具体类型、enum、newtype 表达状态和错误；公共边界返回 `Result`，保留错误来源和上下文。
  不在业务路径新增 `unwrap/expect/panic!`；确有不变量需局部说明并有测试。
  不用空字符串、默认值或吞错误伪装成功。
- 优先借用和切片；避免无依据的 clone、整棵文档序列化、每帧分配。
  性能改变必须测原始场景、分位耗时及正确性，不只测平均值或小文档。
- 缩小锁/可变借用范围，不能持锁或队列 ownership 等待依赖同一队列的工作。
  用 RAII 管资源；unsafe 必须有局部 safety contract 和覆盖边界的测试。
- serde/FFI/MCP 输入属于不可信边界：校验类型、大小、范围、页/节点归属；
  执行前验证，失败不改变文档/历史，成功才能更新版本。

## JavaScript / TypeScript

- 使用项目已有 Node/Bun 和 ES module 模式；新依赖须说明必要性并更新锁文件。
  TS 保持类型安全，不用 `any` 或双重断言代替验证。
- Promise 必须被 await、返回或明确管理；并发/队列的顺序和取消语义写清楚。
  对网络、浏览器启动和外部进程设超时、大小上限、清理路径。
  并行只用于独立操作，不能盲目消除有序 `await`。
- 用 `try/finally` 释放资源；catch 只能处理预期失败，保留 cause 并向调用者显式报告。
  不添加空 catch、成功形状的兜底或浮空 Promise。
- 传递 argv，避免拼接 shell 命令；校验 URL/path/Origin，不暴露凭据或用户文档。
  使用明确 `===`、const/let、已有 formatter；维护 source 和构建产物的单向关系。
- 浏览器与 Node/WASM adapter 保持轻薄；设计语义只在 Rust command/tool 层维护一次。

## 测试与兼容

测试真正的业务 seam，不只测试 mock；覆盖失败、回滚、undo/redo、元数据及版本变化。
不得跳过失败用例或降低阈值来制造成功。UI 改动验收截图、交互和布局，
性能改动同时验收无空白/闪烁与输出一致性。具体清单见 [REVIEW.md](REVIEW.md)。

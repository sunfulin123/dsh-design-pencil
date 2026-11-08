# Review 知识与检查清单

先读需求、实际 diff、相关调用链和测试。优先报告可证明的 bug、回归和维护边界，
不把格式偏好、猜测或“可能有问题”当成阻塞发现。

## 发现格式

每项写：严重程度、文件/行、触发条件、实际影响、证据和最小修复方向。
性能问题要有场景和测量；有意行为变化要对照需求。
区分当前新增问题与已有问题，已有问题不能被本次“全绿”掩盖，也不自动扩大修复范围。
Lint warning 仅作非阻塞提示，只有 error 算失败；检查 CI 没有将所有 warning
升级成 error，也没有通过 continue-on-error 忽略真实 error。

## 通用正确性

- 公开接口与调用者是否全部接线？错误是否传递到用户/tool？
- 状态、缓存和持久化是否一致？失败/取消/超时/重试是否可回滚、幂等？
- 新文件是否 ≤500 实际代码行？旧基线是否只能收紧？
  有没有改名转移豁免、把业务实现放进测试或生成目录、minify 规避？
- 拆分是否产生循环依赖、路径/导出变化或意外行为？
- 注释是否解释真实原因？新抽象是否解决已存在的重复，而非增加转发层？

## Rust

- `Result`、类型/生命周期、FFI ownership、unsafe contract 是否正确？
  是否新增不必要 clone、unwrap、default fallback 或整文档扫描？
- wasm/native feature 边界是否正确？是否只跑 stub 得到假的覆盖？
- 锁/可变 borrow 和异步队列是否跨 await，是否存在嵌套 runtime、死锁或重入？
- 序列化、属性更新、undo/redo、selection/meta/content revision 是否按预期变化？

## JS/TS 与宿主

- Promise 是否完整 await/管理？有序工作有没有被错误并行？
- 网络/浏览器/进程是否超时、取消和释放？错误的 cause 是否保留？
- path/URL/Origin/Host、请求上限和版本冲突是否验证？
  日志/notes/截图 metadata 是否泄露 token 或私有设计信息？
- 源码、WASM bundle、打包 whitelist 是否一致？import 是否触发副作用？

## MCP 与视觉

- tool 在 catalog 可发现，schema/实际参数匹配，权限和页/节点范围正确。
- 无效参数、宿主拒绝和回滚返回明确 error，文档/历史保持不变。
- 页面增量 patch 失败或不可描述时是否正确 full sync？
- 截图等待是否挡住 renderer 自己的 bootstrap queue？
- 同一测试通过 AI 闭环建页、设计、截图、lint、修复/调整、再截图。
  判断真实 renderer、像素/文字/结构变化，不只判断收到 PNG。
- tile/image/font/context resize 是否正确失效与释放？
  快速平移/缩放不出现空白或闪烁，动态覆盖层、zoom/grid 控件仍在。

## 测试、证据与 notes

- 回归测试在真实问题 seam 失败过，再因修复转绿；不是断言 mock 本身。
- 边界、空输入、部分失败、跨页、异步顺序、失败不修改状态得到覆盖。
- 命令、feature、阈值、输出 shape 与需求一致；没跑和 skipped 有明确标注。
- 每个独立任务的 notes 记录原因、变化、验证和剩余项，不用旧 note 伪装本次记录。
- 是否开发前生成独立 Task-ID？本地校验是否指定这个 ID、区分开始前的脏改动？
- 产品、规范、架构与 KB 受影响内容是否同步？Knowledge refresh 的 updated/unchanged/none
  是否有具体依据，而非为了过门禁写泛泛理由？
- 来源指纹、正文引用和 provenance 是否当前且可追溯？新能力未进入来源映射时，
  reviewer 仍需判断知识影响，不能接受“未命中映射就一定无影响”。
- 历史记录是当时证据，不要求其指纹永远等于当前实现；最新知识来源必须与现在一致。
- 架构变化更新架构文档；KB 结论有源码/测试证据和复验命令，不只刷新日期。
- 没有改动用户验证 host、无关源码、秘密或未经请求的 commit。

## 什么进入 KB

重复出现、容易误判、已验证但代码本身不明显的约束才值得保存。
优先用回归测试/静态门禁预防；KB 记录测试解释不了的原因和复验方式，
不是测试日志、任务完成清单或 speculative workaround。
相关知识入口：[docs/kb/README.md](docs/kb/README.md)。

# HTML 导入还原不变量

范围：MCP `import_html` / `import_html_url`（Node managed host 与 `EngineSession.callToolAsync`）、
浏览器快照映射（op-html `snapshot*`）、静态 CSS 回退，以及 `compare_html_fidelity` 验收。

## 浏览器是布局权威，静态引擎只是回退

[html-import-tool.mjs](../../packages/dsh-node-runtime/html-import-tool.mjs) 默认用 headless
Chromium 渲染页面（脚本生成的 DOM、媒体查询、Web 字体都生效），再把
`snapshot-extractor.js` 的计算样式快照交给 `import_web_snapshot`。没有 Chrome 时回退静态
CSS 引擎，结果 `renderMode:"static-css"` 并带警告；`renderMode:"browser"` 则直接报错。
静态引擎不能运行脚本、无法测量 `ch`/字体相关宽度，同一页面的保真度明显低于浏览器路径，
不要把 static 结果当作验收依据。同步 `callTool('import_html')`（离线 CLI）仍是静态路径。

## 只有几何完整的插入才能开启 authored-geometry

空文档插入子树时，[lib.rs](../../crates/op-dsh-engine/src/lib.rs) 才可能把
`editorMeta.preserveAuthoredGeometry` 置 true；该模式跳过 flex/文本布局。
[import_common.rs](../../crates/op-mcp/src/import_common.rs) 的 `inserts_authored_geometry`
要求子树没有 Hug/Fill 关键字尺寸、auto-layout 子节点都有数值 x/y、文本都有数值高度。
浏览器快照与 Figma preserve 导入满足；静态 HTML 和语义化导入不满足。
曾经任何导入都开启该模式，静态 HTML 的 flex 子项因此全部叠在 x=0 且高度为 0。
浏览器快照文本把单行宽度存为 `limits.min_width`（`width: None`）、把多行高度存为
`limits.min_height`（`height: None`）；[authored_geometry.rs](../../crates/op-pen-loader/src/authored_geometry.rs)
必须回退读取 `limits.min_width`/`min_height` 并在 [canvas_viewport_layer_bounds.rs](../../crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs)
中为非截断文本扩展瓦片裁剪包围盒，否则 256×256 瓦片光栅化会把跨瓦片文本在 128px 边界处裁断。

## 页面根画板随内容增高

当前布局引擎不对 hug 帧应用 `minHeight`，导入器的旧逻辑把 `min-height:100vh` 烘焙成固定高度；
配合常见的 `overflow-x:hidden` 裁剪，长页面只剩第一屏。[lib.rs](../../crates/op-html/src/lib.rs)
让 body 根节点在没有显式 height 时保持 `fit_content`。

## 浏览器绘制但 DOM 不含的部分要额外采集

- canvas/WebGL/video：非 macOS 环境（或显式开启 `OPENPENCIL_FORCE_SWIFTSHADER=1`）下 Chrome 以
  `--use-angle=swiftshader --enable-unsafe-swiftshader` 启动，macOS 直接走原生 Metal ANGLE 以避免
  SwiftShader 阻塞 `Page.enable`，默认保持系统沙箱开启（`OPENPENCIL_CHROME_NO_SANDBOX=1` 显式关闭，或检测到外层系统沙箱如 macOS Seatbelt
  导致 Chromium 子进程报告 `Failed to initialize sandbox` / `sandbox initialization failed` 时自动回退 `--no-sandbox` 重启并通过
  `Runtime.evaluate` 探针确认渲染进程就绪），
  并以不小于 `800×600` 的底层窗口配合 CDP 视口覆盖与 `clip` 规避
  macOS 500px 最小窗口宽度限制（[chrome-cdp.mjs](../../packages/dsh-node-runtime/chrome-cdp.mjs)，启动等待按 `timeoutMs`
  分配并在首次启动失败时换新临时 profile 重试一次，错误附带 Chrome `stderr` 尾部，且关闭与 `SIGTERM`/`SIGINT`/进程退出均按进程组清理全部 Chrome helper 子进程与临时目录）；
  像素用 CDP 截图按元素隔离截取并替换占位图（数量/尺寸/字节有上限）。
  `toDataURL` 在没有 `preserveDrawingBuffer` 时只会拿到空白。
- 原生控件：Node 侧附加 `control` 记录，按 tag + rect 匹配回快照节点
  （[html-snapshot-augment.mjs](../../packages/dsh-node-runtime/html-snapshot-augment.mjs)），
  [snapshot_controls.rs](../../crates/op-html/src/snapshot_controls.rs) 按 Chromium 浅色主题度量
  重建 range/checkbox/radio/progress/select 箭头；作者用 `appearance:none` 自绘的控件保留原样。
- 颜色：Chromium 序列化 `color-mix()` 时会输出 CSS Color 4 的 `none` 分量
  （如 `oklch(0.19 0.006 none / 0.14)`），[color.rs](../../crates/op-html/src/color.rs) 按 0 处理，
  否则边框退化为不透明黑色。
- macOS 隔离捕获 profile 使用 basic password store 和 mock keychain，不读取或等待用户的 login keychain；私有 HOME 的本地 HTTP 导航仍可运行。该设置仅属于临时 headless 浏览器，不改变用户 Browser Use、Preview 或 Electron 启动。
- 字体：浏览器记录实际加载/失败的字体面，从 stylesheet、内联 CSS 和 `@import` 的 `@font-face` 读取来源；跨域 CSSOM 不可读时由 Node 限额读取样式表，识别不依赖 Google 域名或扩展名。优先下载源 TTF/OTF 并按 family/weight/style 注册，再按需走已有字体提供方；仅 WOFF/WOFF2、权限或网络失败仍报告警告。独立 `convertHtmlToDocument` 与插入工具都执行字体流程，缓存不只留在临时 Chrome；运行中的编辑器刷新清单，逐字体原子记录避免并发覆盖。普通文本保留源字体优先，缺少 CSS 回退时补 Inter/sans-serif；图标/连字/私用区字体不改成正文默认字体。缓存留在本机，不嵌入 `.op`；仅浏览器加载不等于画布字体注册。

## 多界面导入是同一文档的累积快照

`HtmlImportSession` 以结构化真实输入探索候选界面，把快照直接追加进同一 EngineSession，不拼接多份 outerHTML，不修改源页面显隐或布局。源码正文、脚本片段和浏览器 DOM 是候选证据，隐藏元素不自动等于独立屏幕；未解释的隐藏容器、未知操作和内部滚动保持缺口。检查点绑定源文件及静态引用资源；失败导入恢复到上一累计文档。同一状态重试成功后替换旧画板，未改变的状态计划保持幂等；已替代画板的资源警告不会永久阻塞后续验收。已知未解决的字体或媒体资源错误仍阻止完成，空文档不能因排除所有候选而判为完整。覆盖状态、结构检查和实际 CanvasKit 图像检查分开报告，`saved` 不证明完整。截图按原快照根区域捕获并限额缩放，不通过加高视口改变源布局。同一页面内按业务界面分行、状态分列，使用实际转换根节点的宽高避免重叠；Page/Tab 建立分组，其他状态按已捕获操作路径的最长前缀、明确的目标容器关联或基础界面继承分组。同状态重试保留分组，已有 editorMeta 扩展保存来源关系且不写入输入值；引擎重新载入和后续批次保留最终位置。探索默认 40 画板、120 操作和 600 秒，批次默认四次捕获尝试；预算用尽保持部分结果。

多画板快照保留原转换器提取的颜色变量。后续画板遇到同名异值时保留已有定义，并为新值分配稳定的后缀；颜色变量合并不改写原生导入的节点、ID 或几何。

## 多断点与验收口径

窄画板只开触摸模拟、不开 `mobile`：无 viewport meta 时 mobile 模拟按 980px 布局，
画板宽度会与媒体查询不一致。`compare_html_fidelity` 用同一流程渲染源页并与 `isolate:true`
截图比较；画板超过 4096px 时双方按同一比例缩放，源页高度取 `<body>` 底边（短页面不按视口高度）。
宽段落按行拆成多个文本节点、绝对定位帧按前到后存储，文本覆盖率需按阅读顺序重组并忽略空白。
剩余像素差主要来自字形光栅化（Chrome 与 CanvasKit）和动画内容；通过标准为
像素差 ≤5%（容差 24）、高度一致、可见文本 ≥98%。

复验：`cargo test -p op-html`；`cargo test -p op-dsh-engine --lib empty_document`；
`DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-import.test.mjs packages/dsh-node-runtime/html-fidelity.test.mjs`；
真实验收用隔离 host 导入同一页面，再运行 `compare_html_fidelity`。

## Provenance

```json
{
  "version": 1,
  "status": "verified",
  "task_id": "d670e193-44fa-4fc9-a519-1455aafd004d",
  "verified_at": "2026-11-18T01:36:30.972580+00:00",
  "sources": {
    "packages/dsh-node-runtime/html-import-tool.mjs": "c83c4b54ad208661e1bf55be66dc6ba329d12d03876939a2d8712a5aacad9089",
    "packages/dsh-node-runtime/html-browser-capture.mjs": "fa7baf1c2fd0550410f4e5fa9a3094aa543ce9f6f38d5018e329e30bd6229739",
    "packages/dsh-node-runtime/chrome-cdp.mjs": "ea055a90273ae6d7b14b3fed11f688f75d7a3e87ea77d88885eefe8869b5b229",
    "packages/dsh-node-runtime/html-snapshot-augment.mjs": "50012369534a256d887cd006487e3072100c9f86f785000919527b9d7dd176f0",
    "packages/dsh-node-runtime/html-fidelity.mjs": "55c6c80512f3258d5ec0d81168dc6bd3b548145b325fb632254cdbc0f0c8b097",
    "packages/dsh-node-runtime/html-fonts.mjs": "07353531c9cef3cda0f56d5fe777245712fd1ca75b689874fdb687f63cc33603",
    "crates/op-dsh-engine/src/lib.rs": "3610d050386b7a649db82f2a0701c3e10077b51f488e1f92c6bb07f9de487ddf",
    "crates/op-mcp/src/import_common.rs": "b739cbb501f4371d2273a20936a2159fd551d2659aae745d5767b41a9ae9ebc2",
    "crates/op-html/src/lib.rs": "aa9f80ddff873a62334d845dbcac283037740466981bbbde5047f4c285a7e6ad",
    "crates/op-html/src/snapshot_controls.rs": "cb8a1ebdde5eb5eac79d748d6f5922c2d2154b3cb8731332d992a32d91a34980",
    "crates/op-html/src/color.rs": "0edd593d19a9606b3c99f9b09c3b3691c4eac534f0cc3e7b01f0f4f0eab8c7b5",
    "crates/op-pen-loader/src/authored_geometry.rs": "64d1cb457ef5c4aab8d386811ebad6b7eb070d70f9df85571be1c40cb88b9a8d",
    "crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs": "57cd63c964627896ded9c66cb5a8dd2a22918cd7086a6b2c13225c0721a1c408",
    "packages/dsh-node-runtime/html-capture-page.mjs": "e6a42fb86c4214b17934ca9f83151c2b14ae015cebe27fc98db9404321f6ac69",
    "packages/dsh-node-runtime/html-font-defaults.mjs": "c7b21f10a58bb74c9131ec620ad171a938b4f167f2f11170b3ab7c78176f8671",
    "packages/dsh-node-runtime/html-font-stylesheets.mjs": "d9a6afb775c8cff92e0a13b97cc7ac194e13b98a648a0d0e7365ab5cb58494a1",
    "packages/dsh-node-runtime/html-import.mjs": "5a7ca4ef1f8758134d75d1a642cfbdf4a1e6739c3e2a7d28bd03720446d5e790",
    "packages/dsh-node-runtime/font-fetcher.mjs": "838ddc98cccc8554390fb6394fd32e2766c3250680f17348ae1dd891b5154fba",
    "packages/dsh-node-runtime/html-fonts.test.mjs": "253e52003e303bfa39e34bf13e867b4476697917929a161c3301419360ab3fb8",
    "packages/dsh-node-runtime/html-state-input.mjs": "5d81a1a101b181f25a4c9e4253234a63651d2910a785a69db4435211975096ba",
    "packages/dsh-node-runtime/html-state-checkpoint.mjs": "b3a6d1311324c1719733c5657982cd04d4f23e758abd793ed083f08cb7d78b49",
    "packages/dsh-node-runtime/html-state-report.mjs": "ddc82acebce2ebe8015242d9f2d8cb419f7af89485d8367c3b70eb3c779eb64e",
    "packages/dsh-node-runtime/html-state-discovery.mjs": "7c7dbb7ee22dcbf2f5b31968884f13e83ba01ea2adf3f7ff04014d6ad4b28a99",
    "packages/dsh-node-runtime/html-state-actions.mjs": "1adbae6a3ba7fe5cb321f83b8a52337f168bc2b29cf8093fbcf8243ac8523bbb",
    "packages/dsh-node-runtime/html-state-import.mjs": "92cfdaaa59dd29e8c5a4e28ef954d80dc0f8fb365d375093bf79286bfe37f814",
    "packages/dsh-node-runtime/html-state-groups.test.mjs": "6d8d26ad5f35080f187fb5170f04a29097506a886d0d549f14c1e0e389ee5af1",
    "packages/dsh-node-runtime/html-state-import.test.mjs": "ba9abeadab138492dd8384533fd6b3c85329965be98005acf1486820e63028ec",
    "packages/dsh-node-runtime/html-state-visual.mjs": "2a56091139db33c016c2765cf3640ad72bcbe0e245e66ced4614466e6f9f07a4",
    "packages/dsh-node-runtime/html-state-visual.test.mjs": "923a6b775faf10a3d9bede18b9bdd96ab97e8f45ca913761f3767e6b003bb075"
  },
  "reason": "Retain the prior snapshot palette using the shared converter and wait for the real headless restart completion in its regression.",
  "evidence": "Rich HTML conversion and multi-state variable, grouping, CanvasKit and isolated headless grace checks passed."
}
```

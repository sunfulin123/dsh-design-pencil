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
- 字体：浏览器记录实际加载/失败的字体面，从 stylesheet、内联 CSS 和 `@import` 的 `@font-face` 读取来源；跨域 CSSOM 不可读时由 Node 限额读取样式表，识别不依赖 Google 域名或扩展名。优先下载源 TTF/OTF 并按 family/weight/style 注册，再按需走已有字体提供方；仅 WOFF/WOFF2、权限或网络失败仍报告警告。独立 `convertHtmlToDocument` 与插入工具都执行字体流程，缓存不只留在临时 Chrome；运行中的编辑器刷新清单，逐字体原子记录避免并发覆盖。普通文本保留源字体优先，缺少 CSS 回退时补 Inter/sans-serif；图标/连字/私用区字体不改成正文默认字体。缓存留在本机，不嵌入 `.op`；仅浏览器加载不等于画布字体注册。

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
  "task_id": "bbadd090-99e6-4a40-8f8f-8b5afecb2aa5",
  "verified_at": "2026-11-17T13:15:12.220401+00:00",
  "sources": {
    "packages/dsh-node-runtime/html-import-tool.mjs": "c83c4b54ad208661e1bf55be66dc6ba329d12d03876939a2d8712a5aacad9089",
    "packages/dsh-node-runtime/html-browser-capture.mjs": "cc7a7134a3e34a14ea7df301a2f408e327cc7f4fd8a1154e7ecb99b527478d2d",
    "packages/dsh-node-runtime/chrome-cdp.mjs": "848fd7514fe6ec07f8440e9606b7b1194c17dfff1cefcddbba9922157b6fd233",
    "packages/dsh-node-runtime/html-snapshot-augment.mjs": "50012369534a256d887cd006487e3072100c9f86f785000919527b9d7dd176f0",
    "packages/dsh-node-runtime/html-fidelity.mjs": "55c6c80512f3258d5ec0d81168dc6bd3b548145b325fb632254cdbc0f0c8b097",
    "packages/dsh-node-runtime/html-fonts.mjs": "9969a15d196e1bd19aae25fa85f582a0c8af1cc0f19df9e49d0ddaf6b1ce8c3c",
    "crates/op-dsh-engine/src/lib.rs": "3610d050386b7a649db82f2a0701c3e10077b51f488e1f92c6bb07f9de487ddf",
    "crates/op-mcp/src/import_common.rs": "b739cbb501f4371d2273a20936a2159fd551d2659aae745d5767b41a9ae9ebc2",
    "crates/op-html/src/lib.rs": "aa9f80ddff873a62334d845dbcac283037740466981bbbde5047f4c285a7e6ad",
    "crates/op-html/src/snapshot_controls.rs": "cb8a1ebdde5eb5eac79d748d6f5922c2d2154b3cb8731332d992a32d91a34980",
    "crates/op-html/src/color.rs": "0edd593d19a9606b3c99f9b09c3b3691c4eac534f0cc3e7b01f0f4f0eab8c7b5",
    "crates/op-pen-loader/src/authored_geometry.rs": "64d1cb457ef5c4aab8d386811ebad6b7eb070d70f9df85571be1c40cb88b9a8d",
    "crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs": "57cd63c964627896ded9c66cb5a8dd2a22918cd7086a6b2c13225c0721a1c408",
    "packages/dsh-node-runtime/html-capture-page.mjs": "647002c03182773771978e078e62c6ed8e40fc83cfa6c237610801b85af142fb",
    "packages/dsh-node-runtime/html-font-defaults.mjs": "c7b21f10a58bb74c9131ec620ad171a938b4f167f2f11170b3ab7c78176f8671",
    "packages/dsh-node-runtime/html-font-stylesheets.mjs": "ebb58989cdcdc87096ded6a9aadd789c8a7b1c414543729449362416365bb903",
    "packages/dsh-node-runtime/html-import.mjs": "80ad3183c686aab78dea2442f4e644fd2e7d49606fbb3d3ee15e8c8b93f93143",
    "packages/dsh-node-runtime/font-fetcher.mjs": "838ddc98cccc8554390fb6394fd32e2766c3250680f17348ae1dd891b5154fba",
    "packages/dsh-node-runtime/html-fonts.test.mjs": "253e52003e303bfa39e34bf13e867b4476697917929a161c3301419360ab3fb8"
  },
  "reason": "Standalone and live HTML imports collect original stylesheet fonts, preserve concurrent font registrations and keep icon faces while adding text fallbacks.",
  "evidence": "65 focused runtime tests passed with real Chrome; live Google CSS probe downloaded Roboto 400/500/700 and Material Icons 400 with no warnings; generic CSS @import and extensionless-source tests passed."
}
```

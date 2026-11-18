# HTML 导入还原不变量

范围：MCP `import_html` / `import_html_url`（Node managed host 与 `EngineSession.callToolAsync`）、
浏览器快照映射（op-html `snapshot*`）、静态 CSS 回退，以及 `compare_html_fidelity` 验收。

## 浏览器是布局权威，静态引擎只是回退

[html-import-tool.mjs](../../packages/dsh-node-runtime/html-import-tool.mjs) 默认用 headless
Chromium 渲染页面（脚本生成的 DOM、媒体查询、Web 字体都生效），再把
将由 `snapshot-extractor.js` 和 `snapshot-extractor-decorations.js` 依序组成的脚本产出的快照交给 `import_web_snapshot`。Chrome 扩展使用相同顺序生成单文件脚本。没有 Chrome 时回退静态
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
- 外链 SVG 图片：从已经在 Chromium 中成功下载的图片响应读取有界 SVG 字节，转成保留透明度的 PNG 后写进快照。无法读取响应或解码时，使用已显示且能唯一定位的合成像素。不可用资源记为覆盖缺口；编辑器重开不依赖已内嵌资源的站点。
- SVG 蒙版：CSS URL 蒙版和内联 SVG 蒙版以 Chromium 实际绘制的局部像素保存；浏览器快照只替换蒙版元素，外层按钮、标签和其他页面内容保持可编辑。像素保留当前页面合成后的背景。长文档按原像素比例分段，iframe 只使用可见区域内的内容，未捕获及无法唯一匹配的蒙版计入覆盖缺口。
- 原生控件：Node 侧附加 `control` 记录，按 tag + rect 匹配回快照节点
  （[html-snapshot-augment.mjs](../../packages/dsh-node-runtime/html-snapshot-augment.mjs)），
  [snapshot_controls.rs](../../crates/op-html/src/snapshot_controls.rs) 按 Chromium 浅色主题度量
  重建 range/checkbox/radio/progress/select 箭头；作者用 `appearance:none` 自绘的控件保留原样。
- 颜色：Chromium 序列化 `color-mix()` 时会输出 CSS Color 4 的 `none` 分量
  （如 `oklch(0.19 0.006 none / 0.14)`），[color.rs](../../crates/op-html/src/color.rs) 按 0 处理，
  否则边框退化为不透明黑色。
- macOS 隔离捕获 profile 使用 basic password store 和 mock keychain，不读取或等待用户的 login keychain；私有 HOME 的本地 HTTP 导航仍可运行。该设置仅属于临时 headless 浏览器，不改变用户 Browser Use、Preview 或 Electron 启动。
- 字体：浏览器记录实际加载/失败的字体面，从 stylesheet、内联 CSS 和 `@import` 的 `@font-face` 读取来源；跨域 CSSOM 不可读时由 Node 限额读取样式表，识别不依赖 Google 域名或扩展名。在每个可访问文档的脚本执行前记录 `new FontFace()` 的 URL 源，只有实际加入该文档字体集的已加载或失败字体面才进入收集；同样优先下载源 TTF/OTF 并按 family/weight/style 注册，再按需走已有字体提供方；仅 WOFF/WOFF2、权限或网络失败仍报告警告。独立 `convertHtmlToDocument` 与插入工具都执行字体流程，缓存不只留在临时 Chrome；运行中的编辑器刷新清单，逐字体原子记录避免并发覆盖。普通文本保留源字体优先，缺少 CSS 回退时补 Inter/sans-serif；图标/连字/私用区字体不改成正文默认字体。缓存留在本机，不嵌入 `.op`；仅浏览器加载不等于画布字体注册。

## 多界面导入是同一文档的累积快照

`HtmlImportSession` 以结构化真实输入探索候选界面，把快照直接追加进同一 EngineSession，不拼接多份 outerHTML，不修改源页面显隐或布局。源码正文、脚本片段和浏览器 DOM 是候选证据，隐藏元素不自动等于独立屏幕；未解释的隐藏容器、未知操作和内部滚动保持缺口。检查点绑定源文件及静态引用资源；失败导入恢复到上一累计文档。同一状态重试成功后替换旧画板，未改变的状态计划保持幂等；已替代画板的资源警告不会永久阻塞后续验收。已知未解决的字体或媒体资源错误仍阻止完成，空文档不能因排除所有候选而判为完整。覆盖状态、结构检查和实际 CanvasKit 图像检查分开报告，`saved` 不证明完整。截图按原快照根区域捕获并限额缩放，不通过加高视口改变源布局。同一页面内按业务界面分行、状态分列，使用实际转换根节点的宽高避免重叠；Page/Tab 建立分组，其他状态按已捕获操作路径的最长前缀、明确的目标容器关联或基础界面继承分组。同状态重试保留分组，已有 editorMeta 扩展保存来源关系且不写入输入值；引擎重新载入和后续批次保留最终位置。探索默认 40 画板、120 操作和 600 秒，批次默认四次捕获尝试；预算用尽保持部分结果。

比对复合页面时，外层页面尺寸使用 CSS viewport 像素，业务区按浏览器为 iframe 实际分配的宽高布局。版式证据须对齐相同视口与交互状态。原生单行输入的占位文字使用 `::placeholder` 的字体和颜色，超出内容宽度时保留浏览器裁剪。无模糊且无扩展的偏移内阴影转成可编辑的边缘色条，画布把不等宽内边框裁剪在真实圆角内。整图通过仍应检查这些小面积区域。

状态导入在可访问的同源 iframe 文档内发现候选、执行真实浏览器操作和验证预期节点。选择器按 frame 路径查找，优先使用稳定标记或唯一角色与无障碍名称；动态生成的 ID 不作为首选。捕获以当前滚动位置映射每个 iframe 的可编辑子树，保留外层页面并按 iframe 可视区裁剪。跨域、不可访问、裁剪范围及预算限制进入覆盖报告。每张已合并的画板产生检查点，运行进度分别报告当前阶段及已捕获数量。

图标字体优先使用源页面已声明的字形。已加载的连字图标使用唯一匹配的 Chromium 图标像素内嵌，即使对应 TTF/OTF 已注册。无法注册的单字符或私用区字形复用同一像素回退。没有实际可见字形时保持资源缺口。像素保留原位置，外层控件、可访问名称和其他文字仍可编辑。

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
  "task_id": "9b287c5c-ae9d-4d37-94e6-c7defdb0d8ed",
  "verified_at": "2026-11-18T15:02:49.379977+00:00",
  "sources": {
    "packages/dsh-node-runtime/html-import-tool.mjs": "e29f82f5bf2ba6b90001b1e78cd92ab1ea14d7481ceb740fc4b676dfb046085a",
    "packages/dsh-node-runtime/html-browser-capture.mjs": "c33d16405bee279cd0b7a30a3da78a4bd2401fba41eb146508568dc0397a0fc6",
    "packages/dsh-node-runtime/chrome-cdp.mjs": "ea055a90273ae6d7b14b3fed11f688f75d7a3e87ea77d88885eefe8869b5b229",
    "packages/dsh-node-runtime/html-snapshot-augment.mjs": "9a96a2a4ff1febf0e03c381f12ab9c67ac4ada067511a85d6a625cb21053ec41",
    "packages/dsh-node-runtime/html-fidelity.mjs": "55c6c80512f3258d5ec0d81168dc6bd3b548145b325fb632254cdbc0f0c8b097",
    "packages/dsh-node-runtime/html-fonts.mjs": "749aec8750a2a048abc25867d58fdbbb1b96d3e3c5a7f6c7c2bb80f0419e72dc",
    "crates/op-dsh-engine/src/lib.rs": "3610d050386b7a649db82f2a0701c3e10077b51f488e1f92c6bb07f9de487ddf",
    "crates/op-mcp/src/import_common.rs": "b739cbb501f4371d2273a20936a2159fd551d2659aae745d5767b41a9ae9ebc2",
    "crates/op-html/src/lib.rs": "92ee7b634f6040768c4a8da30f4d425fa45396f68aa9092599498d793801ff52",
    "crates/op-html/src/snapshot_controls.rs": "cb8a1ebdde5eb5eac79d748d6f5922c2d2154b3cb8731332d992a32d91a34980",
    "crates/op-html/src/color.rs": "0edd593d19a9606b3c99f9b09c3b3691c4eac534f0cc3e7b01f0f4f0eab8c7b5",
    "crates/op-pen-loader/src/authored_geometry.rs": "64d1cb457ef5c4aab8d386811ebad6b7eb070d70f9df85571be1c40cb88b9a8d",
    "crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs": "57cd63c964627896ded9c66cb5a8dd2a22918cd7086a6b2c13225c0721a1c408",
    "packages/dsh-node-runtime/html-capture-page.mjs": "668a18d29b1ed30db659f891784e60dde91cab313ac99f0a17b3fe32d451ab3e",
    "packages/dsh-node-runtime/html-font-defaults.mjs": "b8449adf30f0257f864d1b6b5ceb42e0b77c49786389a008cb182229f26cde8a",
    "packages/dsh-node-runtime/html-font-stylesheets.mjs": "b0f449b2d03f1b085031f2e1839a3de72a40d158acb0be71b56e76ccc03836b2",
    "packages/dsh-node-runtime/html-import.mjs": "90f3741f7f4b2122a7a960fe03def2ddd1e961184b994e32fb2f17261b5f87d8",
    "packages/dsh-node-runtime/font-fetcher.mjs": "838ddc98cccc8554390fb6394fd32e2766c3250680f17348ae1dd891b5154fba",
    "packages/dsh-node-runtime/html-fonts.test.mjs": "049d124e0b54770d5d557096a7c4e2d9751a6b54368b1c316cb46132cccd2711",
    "packages/dsh-node-runtime/html-state-input.mjs": "857caf9117b36435116513c7ab2ab44308fe06b7aaeff3a163079feaea58406b",
    "packages/dsh-node-runtime/html-state-checkpoint.mjs": "9ec218611e9c0c5c784229124c905518ea303d66150de19a25adbe998d73293d",
    "packages/dsh-node-runtime/html-state-report.mjs": "6b7994cee132e675eb62e002e8b17efaf25f403f016dac6c460e959c6389f576",
    "packages/dsh-node-runtime/html-frame-context.mjs": "6c2bc5f4516b10b0ecbd0eeea93d9dc59bfab516d2b7b0f0b5c9e88e6efa7779",
    "packages/dsh-node-runtime/html-frame-snapshot.mjs": "f24e356fb4e56e271262abc2bc97323e5a331d02381c47def56bb58698e1849e",
    "packages/dsh-node-runtime/html-state-resources.mjs": "be78ab22b8a0b510f8716c7a507e17252b40db3389a8a2425ee82c90a3a5b05d",
    "packages/dsh-node-runtime/html-frame-snapshot.test.mjs": "ba17a4b7a8a6c27c83298a7a731d8a94a1bd815497b014eff810445e7c951a6a",
    "packages/dsh-node-runtime/html-state-discovery.mjs": "e95f6403c81d0c6fb30dcfa4e26c5c9d2d8cb9e9dfcd9c07f3f72247c5a7629b",
    "packages/dsh-node-runtime/html-state-actions.mjs": "69cebeddcbccb6e1f99e3121efdb40c2663e59ee47708a295364121cbdcb3eab",
    "packages/dsh-node-runtime/html-state-import.mjs": "17c0a1508d7139fbe5155fcbb25cd2759c39757c170aadf50ebc04e3b235fb23",
    "packages/dsh-node-runtime/html-state-groups.test.mjs": "6d8d26ad5f35080f187fb5170f04a29097506a886d0d549f14c1e0e389ee5af1",
    "packages/dsh-node-runtime/html-state-import.test.mjs": "7865a2d0626aed66a7b8c80d914d0ec761e087eba8d7c3a5e83f1f04d53c1d2a",
    "packages/dsh-node-runtime/html-state-visual.mjs": "2a56091139db33c016c2765cf3640ad72bcbe0e245e66ced4614466e6f9f07a4",
    "packages/dsh-node-runtime/html-state-visual.test.mjs": "0fe365420c1b90ada2d086aea9bc1c90bbd752e137d8954f779be1db8531138f",
    "crates/op-html/assets/snapshot-extractor.js": "48c054876effae68a17932a93f5337cb26ffdd7bc40c373365705c44abbbf654",
    "crates/op-editor-ui/src/widgets/canvas_viewport_overlay.rs": "0c25a23fc53fae892d00e2b81fc6231b349b173012867abca98b0dfc659b6bcc",
    "packages/dsh-node-runtime/html-svg-assets.mjs": "2f77f4f48443f9238ae4479d8569c9f0fbfa9af6a05c9cd94b22806f7171a5c9",
    "crates/op-html/assets/snapshot-extractor-decorations.js": "1b1cee593ed3c50f90aef273ead334fe8140a5510081e72a40547ec6e3eaea94",
    "crates/op-html/src/snapshot.rs": "649c3dea42282adf4358fe8b8a595674179783bb8e4b0b363f71ed3910d4b95e",
    "packages/op-chrome-extension/scripts/check-extractor-sync.sh": "e50387f28da4a55d52248ea825cecd34994633ea92805c93a393ec4a2f90346a",
    "crates/op-html/src/snapshot_bundle.rs": "f1cab112c71590c65af50f4671f0f7b5e8918de361e4204924c8440189386154"
  },
  "reason": "Document the shared browser bundle assembly and dedicated decoration source.",
  "evidence": "The previous and new bundle produce identical full-page and subtree DOM snapshots. The extension copy matches the assembled Rust sources and both fragments pass lint."
}
```

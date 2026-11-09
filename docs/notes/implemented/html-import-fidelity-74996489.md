# Route import_html through real-browser snapshot; capture canvas pixels, web fonts, form controls; add compare_html_fidelity; fix static importer flex collapse; multi-viewport import

Record-Version: 2
Task-ID: 74996489-c9be-4d1b-a26b-a81deaeef88f
Base-Ref: d97f946d778acef1f98ff2e148d394af66110596
Started-At: 2026-11-09T02:50:41.479588+00:00
Type: feature
Status: complete

## Context

MCP `import_html(htmlPath)` of a real landing page (a Tailwind-free store page with a WebGL hero,
Google Fonts, JS-built product grid) rendered as overlapping text at the top-left: it bypassed the
existing browser-snapshot path and used the static CSS importer, whose output the engine then laid
out in authored-geometry mode. Goal: browser-accurate HTML import plus a reproducible fidelity gate.

## Changes

- Route: `import_html` / `import_html_url` render in headless Chromium by default
  (`html-import-tool.mjs`), one `import_web_snapshot` per viewport, side by side; result reports
  `renderMode`, `boards`, `rootIds`, `fonts`. Static fallback adds a warning; `renderMode:"browser"`
  fails instead. New args (`viewports`, `viewportWidth`, `renderMode`, `readyExpression`, `waitMs`,
  `timeoutMs`, `fetchFonts`) declared in new `html_import_catalog.rs`.
- Capture split out of `engine-session.mjs` (mechanical, baseline 1959 → 1353): `chrome-cdp.mjs`,
  `html-local-server.mjs`, `html-sources.mjs`, `html-import.mjs`, `html-browser-capture.mjs`
  (network idle, fonts, lazy-load scroll, ready probe, full-height viewport), `html-capture-page.mjs`.
- Canvas/WebGL/video pixels via SwiftShader + per-element CDP screenshots; native control state and
  media pixels merged by tag+rect (`html-snapshot-augment.mjs`); new `snapshot_controls.rs` rebuilds
  range/checkbox/radio/progress/select chevron with Chromium metrics.
- Fonts: `html-fonts.mjs` registers page TTF/OTF or Google faces through `FontFetcher.addFace/ensure`.
- `compare_html_fidelity` (`html-fidelity.mjs`, dispatched by new `host-render-tools.mjs`, render-wait).
- Static fallback: only geometry-complete inserts set `preserveAuthoredGeometry`
  (`op_mcp::import_common::inserts_authored_geometry`); page root hugs content despite
  `min-height:100vh`; CSS Color 4 `none` components parse as 0 (`color-mix` borders).
- Mechanical: `SnapshotError` moved to `snapshot_error.rs`; `parse_hsl` reuses `hsl_to_rgb`.
- Docs: ARCHITECTURE (HTML import), COMMANDS (HTML 导入与保真验收), runtime README, AI design prompt,
  KB `html-import.md` (new), `product.md`, `runtime-mcp.md`.

## Validation

- `cargo test -p op-dsh-engine -p op-html -p op-mcp` — passed (72 / 494 / 537 + integration).
- `cargo test -p op-host-web --lib --features canvaskit` — 777 passed, 29 ignored.
- Red/green: `static_html_import_into_an_empty_document_keeps_the_layout_pass`,
  `page_root_hugs_content_despite_a_viewport_min_height`, `missing_none_components_convert_as_zero`
  each failed with the fix reverted and passed with it.
- `bash packages/dsh-node-runtime/build-engine.sh`; `bash packages/dsh-node-runtime/build-web.sh` — passed.
- `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`
  — 177 passed, 0 failed, 0 skipped.
- `cargo fmt --all -- --check` — clean. `cargo clippy -p op-dsh-engine --all-targets` and
  `cargo clippy -p op-html -p op-mcp --all-targets` — no findings in changed files.
  `cargo clippy --workspace --all-targets` — failed on pre-existing `crates/op-codegen/src/tests.rs:21`
  (missing `PenDocument.prototype`, untouched by this task).
- `bunx oxlint` / `bunx oxfmt --check` on changed JS — no errors; new files formatted.
  `font-fetcher.mjs`, `png-diff.mjs`, `engine-session.test.mjs` already failed oxfmt at base; not restyled.
- `tools/check-file-line-cap.sh --ratchet` — OK (tool_catalog 502, color 594, snapshot 631, engine-session 1353).
- Manual acceptance on an isolated managed host (user page copied by path, not modified):
  browser mode 1440 → 3370px board, `compare_html_fidelity` verified, ratio 0.032, text 138/138,
  9/9 font faces registered; 390 board ratio 0.054 (shared 0.56 downscale), text 137/137;
  static fallback now lays out (2136px board, ratio 0.27) instead of collapsing.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "updated",
      "reason": "New entry: browser-render HTML import route, authored-geometry gate for empty-document inserts, page root hug, canvas/control/colour/font capture, multi-viewport and compare_html_fidelity criteria.",
      "sha256": "aad0621b4e399f455d050a96bd2de974225fed20dcccfafdfe76e4a15263a00f"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Product now imports web pages through a real browser render with multi-viewport boards and a compare_html_fidelity acceptance tool; architecture gained an HTML import section.",
      "sha256": "8a7c828e32f4d9b00cca83cdbf1363c5031c70c2811362e58edf81c05e419330"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Render-wait host tools moved from node-host into host-render-tools and now include compare_html_fidelity; catalog/dispatch rule unchanged (new schemas live in tool_catalog's html_import_catalog submodule).",
      "sha256": "78b45c39527d7be0f505c293abcb9cb7a8a767527ea053b8798fd2844670fcbc"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "COMMANDS.md only gained an HTML import validation section; the standards entry links authoritative docs and its rules are unaffected.",
      "sha256": "41499f785a1a6622c4bd66bb016d5cfe79c7c0c25bcd280d44b39fa306cf802a"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- `import_html` now needs Chrome for full fidelity and takes ~10–15 s on a script-heavy page; the
  synchronous `callTool('import_html')` (offline CLI) stays static.
- Static fallback still cannot run scripts or draw canvases; layout engine ignores `minHeight` on hug
  frames (only the page root is handled).
- Fidelity floor is limited by Chrome vs CanvasKit glyph rasterization and animated content; boards
  taller than 4096px are compared downscaled.
- Custom WOFF/WOFF2-only fonts cannot be registered (warning returned).
- Multi-viewport import creates one undo step per board.
- Not run: Windows/Linux Chrome, real mobile devices.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "57001b15b218a2b4f4a8e79e1dd878658d5c2b7646a15eb90eaee1b60d5b77fd",
      "after": "68cf6ca0c98a3c1c7b0cede4d6878490c4259adf5c15ae2d03aaecc735a3f0d6"
    },
    {
      "path": "COMMANDS.md",
      "before": "c3909ba235c3538cb1f36ca7993b8f3eece4f8a69dd32adcddedcda7ed6dd939",
      "after": "671f5ed61fb91516b89ec63042c2ac167d9cfadeff1c2da0e42fadf52061dae1"
    },
    {
      "path": "crates/op-dsh-engine/src/html_import_catalog.rs",
      "before": null,
      "after": "be243c73e8bb49ab3e3aa742617972487344a514bf27fa3ec3ed2902580f4183"
    },
    {
      "path": "crates/op-dsh-engine/src/lib.rs",
      "before": "be01a3ea56c8cfce44e7332739b6eee2d1718e8036aaa6452fd678e2bb114c91",
      "after": "24ae65072f011f377b955ca8bfa7ce5b86de25dcfafde4a5f0a8ce4cd950a4dd"
    },
    {
      "path": "crates/op-dsh-engine/src/lib_tests.rs",
      "before": "69734792aeef4daeceb585f0944ef14f0175bc50191ce81f98a08a08fd71773b",
      "after": "658462936e5264aaf744de50acc381266c0e1baf76d061c62492aa961562a592"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog.rs",
      "before": "32f1d1c04d0d1d0f3d91106cadd68ad3ac00c8a9bc6ab231a7bf92814bd8048c",
      "after": "fee753c0cc498cee0b8b504862b6347c9cf6e6cb95a2af444d79af493c38e53a"
    },
    {
      "path": "crates/op-html/src/color.rs",
      "before": "17f8c10a4da496a21950fd60470080ecbf2e03f2e4ddf6075b57d7fde31e124e",
      "after": "0edd593d19a9606b3c99f9b09c3b3691c4eac534f0cc3e7b01f0f4f0eab8c7b5"
    },
    {
      "path": "crates/op-html/src/lib.rs",
      "before": "dbcd6966c86db450113e2232224e3e8444330552a1ce524e9c09d2dc1e2c9fac",
      "after": "aa9f80ddff873a62334d845dbcac283037740466981bbbde5047f4c285a7e6ad"
    },
    {
      "path": "crates/op-html/src/lib_document_tests.rs",
      "before": "6a421e11206fa4de68d689829a9ef2a2f9fa274316e7f533a41de2f3242c822a",
      "after": "22696e3157adb7f650884a0620e52fce8386c13ee9d5a5316da5105fca14abe2"
    },
    {
      "path": "crates/op-html/src/snapshot.rs",
      "before": "66df875c08a9e20a3f2067b0efdb076cc463c1033a6685241adb12de199bae96",
      "after": "5cdd41b536a3943ed9a533cf64a4999588dc5b7f19d62d9a5e37f8aa7c3402ad"
    },
    {
      "path": "crates/op-html/src/snapshot_controls.rs",
      "before": null,
      "after": "cb8a1ebdde5eb5eac79d748d6f5922c2d2154b3cb8731332d992a32d91a34980"
    },
    {
      "path": "crates/op-html/src/snapshot_controls_tests.rs",
      "before": null,
      "after": "7cc09ea0a0dde782c1c2d048f159420cd2859942a5316c55e253cdbef5b3643f"
    },
    {
      "path": "crates/op-html/src/snapshot_error.rs",
      "before": null,
      "after": "ad456853dc153cd1f2a6fc3b7da0be3bfb4030380dbdb51f647284b6177c60af"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "72706c7c0719c0fcec46af6cb226267ef7cac6efb9af0e533c89386704b72aca",
      "after": "34d29f1a7c2574d78ce96852bee4e154670caa741a665edc991942ee4c7b8936"
    },
    {
      "path": "crates/op-mcp/src/import_common.rs",
      "before": "7e091a695555bc94ad5b0b5dad1d8ad3d0703c8e2bb556ab2218abc24196cbbd",
      "after": "b739cbb501f4371d2273a20936a2159fd551d2659aae745d5767b41a9ae9ebc2"
    },
    {
      "path": "docs/kb/README.md",
      "before": "71def4b7671ec3e554c5ab9c15def49d06d377859cfe8f4a56a87215a76f690f",
      "after": "ddafb0d3266b7d2c00a085bcccb8493ffe9ab0d96e2c21844c0609818009fe36"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": null,
      "after": "aad0621b4e399f455d050a96bd2de974225fed20dcccfafdfe76e4a15263a00f"
    },
    {
      "path": "docs/kb/product.md",
      "before": "f10c79131ee0573bc7d2f75eece281ccaede207001d938878e907ba7fe4dfd40",
      "after": "8a7c828e32f4d9b00cca83cdbf1363c5031c70c2811362e58edf81c05e419330"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "18b85fa87b66ab930bb43adc960df5b44e7f58e26ef1588c76d788abe4bffe01",
      "after": "78b45c39527d7be0f505c293abcb9cb7a8a767527ea053b8798fd2844670fcbc"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "b62a0b770034e1f83e01a473297c6e510429e558a3ed00e063dddaec2153d263",
      "after": "41499f785a1a6622c4bd66bb016d5cfe79c7c0c25bcd280d44b39fa306cf802a"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "0b0774ff7a1557048915f2f5b6724b3869cb5aea608ced3f725135187b2c3507",
      "after": "35d62a140460f726d940e9b3c32ddb56c8f9b0b7fa5dfa39c6bbad5d3aef9a48"
    },
    {
      "path": "packages/dsh-node-runtime/chrome-cdp.mjs",
      "before": null,
      "after": "bce158c09d04abd90007dc7ff65091b896b56c340206a2b97de5c2df380f05c8"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.mjs",
      "before": "37b6cd8fdde391b7b793377ee6ed6e25c29f26bcc94d00c9b0049f3e0d6d5f26",
      "after": "c2d7d8028a13da2ed0842e977496436d2161662be89d2d5a09078ec82adb73ce"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.test.mjs",
      "before": "aa756a106ebb442a90498944743287cf6f322cf1aea0a7f13c3b558b1d421bca",
      "after": "f8ba968756cc948929d1576845b66342c6397cde2020e220292bc823af6ba7b1"
    },
    {
      "path": "packages/dsh-node-runtime/font-fetcher.mjs",
      "before": "68b927001ba20e3ab52e8ce146dd5215ebb8414c64f51477462f571161b0583e",
      "after": "4b7da6d787592599cb89e82f90d1765f2416874c82a12bbd8ee14e09dab2b793"
    },
    {
      "path": "packages/dsh-node-runtime/host-http.mjs",
      "before": "13733007e50b0a0f6337ef5bcc6836a64f0c14347625415c36a94a4fa8f3c607",
      "after": "43d6a480c630a30e78205e489058c02c8081ee1e6f8c835f7940cf3d65d3eca9"
    },
    {
      "path": "packages/dsh-node-runtime/host-render-tools.mjs",
      "before": null,
      "after": "5b2c35117471753aff5c55a8121c227a8e573c90b5137e19f53d1496b2614b63"
    },
    {
      "path": "packages/dsh-node-runtime/html-browser-capture.mjs",
      "before": null,
      "after": "d794de1e13082e19e77c9f50970e1e06edc629815e167ceeaa4971868e787a81"
    },
    {
      "path": "packages/dsh-node-runtime/html-capture-page.mjs",
      "before": null,
      "after": "8a681b2cd9467eb53b51744cf3acfdc20096d489df414cce9ca070df5c269a23"
    },
    {
      "path": "packages/dsh-node-runtime/html-fidelity.mjs",
      "before": null,
      "after": "55c6c80512f3258d5ec0d81168dc6bd3b548145b325fb632254cdbc0f0c8b097"
    },
    {
      "path": "packages/dsh-node-runtime/html-fidelity.test.mjs",
      "before": null,
      "after": "69a7bb6a2e640225872079e117b6253acf64b90d85c7207525d141508c395580"
    },
    {
      "path": "packages/dsh-node-runtime/html-fonts.mjs",
      "before": null,
      "after": "b52f5b6b2b43c5fddb1b884429df3ae996f0d55df596370eeb824a25c3b0c679"
    },
    {
      "path": "packages/dsh-node-runtime/html-import-tool.mjs",
      "before": null,
      "after": "42ab3b44fcadc6669d64a4c2382218b3daa2f3a3cb3b617842fd36cb7e9feb69"
    },
    {
      "path": "packages/dsh-node-runtime/html-import.mjs",
      "before": null,
      "after": "117fc49e42cf4d9b888bd014ac521f96f72098cad69b624e30ae092bcd21ed51"
    },
    {
      "path": "packages/dsh-node-runtime/html-import.test.mjs",
      "before": null,
      "after": "738198c3dbda2a1d3ad4950a98de37690a971f47efcfc20644f91c8d10174384"
    },
    {
      "path": "packages/dsh-node-runtime/html-local-server.mjs",
      "before": null,
      "after": "98fa8cc1c4bd41a95ca8f0bfe086ef153ed726f9a12ce7eb40093282b0449bb1"
    },
    {
      "path": "packages/dsh-node-runtime/html-snapshot-augment.mjs",
      "before": null,
      "after": "50012369534a256d887cd006487e3072100c9f86f785000919527b9d7dd176f0"
    },
    {
      "path": "packages/dsh-node-runtime/html-sources.mjs",
      "before": null,
      "after": "a3f053ff0e03b84c56afd0e1fc64d679fd80e7b614e195be96e95d789cc50ed1"
    },
    {
      "path": "packages/dsh-node-runtime/node-host.mjs",
      "before": "850d1a625f14c5df26ed20f6c829b3bf5f1026ecb1fb6af9e4796e93c807e0e0",
      "after": "ef1541d00731f3e5c78551f3487614cff8fce2a04fac5da0a93862418e15891d"
    },
    {
      "path": "packages/dsh-node-runtime/png-diff.mjs",
      "before": "a6b30dfc8d55fc7b6daa9d50885dee478cd2795d52bc97a8d105485533265bc3",
      "after": "acaeae12d0bef2f77affadab0426082c5a8b59a413dddb2a8728d05d7b0b2c66"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "f1ba422afe036cd2103ed4064a5f220dd66967b0d6940fba6f3a0ebcdcae7268",
      "after": "bba13ddecff70e668edce6cf3a2e0a672d207e84a6882a4128bb1adfa4d9a869"
    }
  ]
}
```

Completed-At: 2026-11-09T04:00:09.180419+00:00

# Pixel-accurate, editable Figma import for REST and .fig paths

Record-Version: 2
Task-ID: b3f56376-1e0c-4097-b48b-ce0eadca2f5f
Base-Ref: c9d67dafdbe3675af5c7c1a9325221bb6519eeb9
Started-At: 2026-11-08T11:15:16.639726+00:00
Type: fix-bug
Status: complete

## Context

Figma imports looked squeezed (small labels such as "Fullscreen"), off-centre and
had blurry/missing icons. Goal: pixel-accurate, still-editable import for both the
REST link and `.fig` paths. Acceptance frames: Live - Widgets boards 1817:36832,
1817:36380 and 2000:17269 (inside canvas 1816:36375), compared with
`compare_figma_fidelity` at scale 1 and 2 in an isolated host.

## Changes

Renderer (both paths):
- CanvasKit text fonts use linear metrics, subpixel positioning and no hinting
  (`textFont` in `op_ck_bridge.js`); font registries share `registerFace`.
- `text_edit_layout` measures wrap, auto-width shrink, alignment and carets in the
  painted family (`wrap_text` now takes a measuring closure).
- Line baselines snap to whole pixels of the text box; Latin `middle` uses the
  font-metric baseline, CJK keeps ink centring (user decision).
- Non-box nodes (`Group`, unfilled `Frame`, `Path`, etc.) cast alpha-silhouette drop shadows via `pushDropShadowLayer` (`CK.ImageFilter.MakeDropShadow`); only `Frame`/`Rect` backgrounds cast box shadows.

Import:
- Opacity-0 layers are kept (`.fig` converter, REST adapter, job node count).
- Identical fill-override regions are decoded once (no even-odd cancellation).
- Instance resize follows Figma constraints / auto-layout fill rules; Scale-tool
  instances (`uniformScaleFactor`) stay uniform (`InstanceResize`, cache key).
- Derived size/transform/fill/stroke geometry wins over override props; derived
  `layoutSize` and uniform glyph `fontSize` resolve text boxes (kept by text-cache
  compaction); forwarded text boxes supersede stale authored sizes.
- Swap filter keeps derived entries addressed by override keys the new variant uses.
- `.fig` `resizeToFit` frames convert as unclipped `Group`s with `effects`; REST `GROUP` children keep parent-relative transforms without duplicate flips; `styleIdForEffect` replaces stale cached effects with version-accurate library lookup; variable-bound paints replace stale pre-binding `opacity` with `colorValue.a`.

Verification tooling:
- `get_screenshot` gains `isolate` (Figma-style node export); fidelity uses it and
  compares post-transform (rotation/ancestor mirror) boxes.

## Validation

- `cargo fmt --all -- --check` — OK.
- `cargo clippy -p op-figma -p op-editor-ui -p op-mcp --all-targets` and
  `cargo clippy -p op-host-web --all-targets --features canvaskit` — no errors.
- `cargo check --workspace` — OK.
- `cargo test -p op-figma` — 293 passed; `-p op-editor-ui` — 1934 passed;
  `-p op-mcp` — 555 passed; `-p op-dsh-engine` — 80 passed;
  `-p op-host-web --lib --features canvaskit` — 777 passed; `-p op-editor-core --lib` — 1306 passed.
- `node --test packages/dsh-node-runtime/*.test.mjs` — 165 passed, 2 skipped (Chrome-gated).
- `node --test crates/op-host-web/tests/*.test.mjs` — 14 passed.
- `tools/check_code_line_cap.py --baseline-ref c9d67daf` — OK (baselines tightened:
  op_ck_bridge.js 1911, vector_decoder.rs 669, converters.rs 731).
- `tools/knowledge.py check` — OK.
- Real acceptance (rebuilt engine + web bundle, isolated host; user .fig/REST data read-only):

| board | REST struct / text / px@1x / px@2x | .fig struct / text / px@1x / px@2x |
|---|---|---|
| 1817:36832 | 0 / exact / 2.71% / 1.79% | 0 / exact / 2.70% / 1.78% |
| 1817:36380 | 0 / exact / 2.62% / 1.70% | 0 / exact / 2.62% / 1.70% |
| 2000:17269 | 0 / exact / 2.93% / 1.89% | 0 / exact / 3.03% / 2.00% |

  Before: REST 3.4–11% px with 2–4 structural deltas; `.fig` 3.6–4.2% px with 124–151.
- `tools/check-text-measure.sh` fails on base and after (pre-existing canvas_rulers.rs).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "README index only gained the new figma-import entry and a canvas-resources summary phrase; standards links remain valid.",
      "sha256": "b62a0b770034e1f83e01a473297c6e510429e558a3ed00e063dddaec2153d263"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "updated",
      "reason": "Refreshed op_ck_bridge.js provenance after adding pushDropShadowLayer (MakeDropShadow); text-metric and tile lifecycle invariants remain verified.",
      "sha256": "97c733e3edde15fda40700fec11fe2a59a196ab12de340c176c2c5f33fc2812b"
    },
    {
      "path": "docs/kb/figma-import.md",
      "action": "updated",
      "reason": "Added verified Group/resizeToFit, versioned styleIdForEffect, variable-bound paint opacity, and alpha-silhouette drop-shadow invariants.",
      "sha256": "b61ff186e8285d12a85e40426563428712d085ceba79587a2cf2e04a30a3e625"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Pixel ratio stays above the 1% `verified` bar: remaining diff is glyph-edge
  antialiasing / font-version outlines (Google Roboto v3 vs Figma bundled Roboto);
  with 1 px tolerance only 0.2–0.3% of pixels differ by >32 levels, and REST vs
  `.fig` match to 99.98–100.00%.
- Middle-aligned Latin text in non-Roboto fonts may shift up to ~1 px versus the
  previous ink-centring.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_text_edit.rs",
      "before": "a51b4ec4431a71e8c8a6316db596476025ee5ccc37ac5e33620c6720028f477b",
      "after": "54132a7a2322ddfdc1efc29c0383fe13429f7de45a110718cea6d792f68d603f"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_layer_bounds.rs",
      "before": "6d0a85b451ad00cab4f4f1428080ebfbd0086ab17252d2618f824154b321872e",
      "after": "f9416e77fde1e7cb5b78561d863dc1169e80859cc9e4685c79fe4afb71ef945c"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_overlay.rs",
      "before": "245363576497fb0f0939b8eb61a104c0fa599ad9f21dd83d9e6c5508ef3cb3c7",
      "after": "bee0cd1e45ed9efb03fb1671704d356de2c18ed8d1ebe669bf47933d920a6c4e"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_paint.rs",
      "before": "c2aa25059e770219c986e76a450945276963a565d46df80ad80b901b091ec487",
      "after": "aea0a4274e18ed8f9da019bb40c5d620ebd2e89366f9ff786936804c5d898541"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_paint/shapes.rs",
      "before": "0ec0a7f0bc30d6f46a9415e8c8b5fcb30afec1cbc6585c4ae9b8509a64e241ea",
      "after": "f418e3e3358a01bb25048fefbd594457e4027dd3b61cdf9584d917c2e3cd29b9"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_paint_tests/effect_lod_tests.rs",
      "before": "9a56dfcb855d22fe5c70ada9d37ab52857f254537c888773cde2949c843783ce",
      "after": "ef3b738895312a6c9432747d783b9ef238a3e26e214de71346b0ef194b09a936"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_paint_tests/text_tests.rs",
      "before": "6768568aa1653483bdbedf0ad9d7997be48e639c4436e75391926a5139015095",
      "after": "916d90f9682562583250fd044b2b68f7b5b4cb205c96968fd6096f144e4a3210"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_text.rs",
      "before": "720e9c0e49b685791b9b1a8c5781e697c2b6197526c632891a3f8ded56754893",
      "after": "0b0b3e7c8494cd1d5644945c0335652290afbb7d281f316ce141fb888e6c7c71"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_text/layout.rs",
      "before": "269e2754f2a4197811065a53b96a1008f640aa7b10a26b82debd40dc72692e64",
      "after": "3a45aec45bd661544153b62ad767c486522d0588c1e325df321c216182e280d8"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/canvas_viewport_text/tests.rs",
      "before": "6dc324e0ac9109b91fc045f8405c9c79964e1618bb772162d69c102134c04d6c",
      "after": "4bc067a12a3e3be35cdd0dae24f7055a2cebd9bd0269b47f07fde4a125db7044"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_paint_options.rs",
      "before": "7b9ba24e13939f794610e121f3fcbe0a2a84a0f9d01a4b84b934ad23ca804989",
      "after": "d1dcaa5979df083fa022964e1672086d042c74bfa5c232fc31542d2ce0213df1"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/text_input_backend.rs",
      "before": "dc08b85b14e124d9b2e01ee1898f6c42d73fa41c713b9dd73ffc6376c0ecef99",
      "after": "be8ee9ebab7f7ae9ddc2f63bd12e2883dbc2c9f4700e24ae2d30551dc7391eae"
    },
    {
      "path": "crates/op-figma/src/common.rs",
      "before": "a1f6cabc07085eb4d388e4d0371b41dc9f12d7ea6999f60bb9a18bdd7a8d0466",
      "after": "f1eef5632dd0218229465b9a23257c6e98506f95c953a3f4acfd299470105c13"
    },
    {
      "path": "crates/op-figma/src/converters.rs",
      "before": "4a986ec732aaaabcdcea7445e53ee9eb0cc02d05bccd3a4efbf3e5db4b608dfb",
      "after": "bf8f7f514e9c0e8686e5017d563a58ee7b3d523525904df4e5e1382bb568a3e6"
    },
    {
      "path": "crates/op-figma/src/converters/tests.rs",
      "before": "c2327b996fc511313d7f97b745d5500381e4024d651d8cf9cafd4039e49193b0",
      "after": "8e98fe07cbc39481b3fdc6d9d15760ca8ce25a1e70126eca53ae0c36d7ec7f83"
    },
    {
      "path": "crates/op-figma/src/instance.rs",
      "before": "25709645f31b106b8bf393e7ea3d5ed69b381d36a1a1f4c7f0eab89de6c859bf",
      "after": "f2fc07acc9474434b494a6cdfb0cd56a8d2506c2370036a09156902c8182c979"
    },
    {
      "path": "crates/op-figma/src/instance/apply.rs",
      "before": "f85bef0754afc71ebaa2d1f121252b58c83cf8c47ab5d6a75b5d3c257ccfa506",
      "after": "5abb04389085ec6edb402a7611d12e76928ba55954468c6019db0152b2a0e023"
    },
    {
      "path": "crates/op-figma/src/instance/assignment.rs",
      "before": "87ffb6572ff91a8ef8dff439dbbe5c02049a4a5af3d7dc9e752da2643e287399",
      "after": "8d0ad140fa7dd423daa24fd36fc3ef936516abb487ddf614dd89908b5b9f39cf"
    },
    {
      "path": "crates/op-figma/src/instance/assignment_tests.rs",
      "before": "34f731c9adf7ea9c1994b926a29cbb04794db7dcc61454ba4135a3fc208af9c2",
      "after": "48bb40536f912d8b777f7c43c0db8573f14a3ea1f7beec52d86d64d66cbed46c"
    },
    {
      "path": "crates/op-figma/src/instance/cache.rs",
      "before": "3e95f86ba150eee1bb0cde333be4645b9ae9126afd8c4873fcb1345d336dc3e0",
      "after": "a2e8a50e46d448a05a324dd1a8b5ad40e73d4ec3cf45f6c6fa27794d512c71b5"
    },
    {
      "path": "crates/op-figma/src/instance/keyed.rs",
      "before": "e34bd1304069cd2b0fc179b631af02890092b1a9678f1ac9919388b054668f2d",
      "after": "eef3ee3d297ec180da7b16dd379f6b1deec8bf820d37679de7dab5ee314e176f"
    },
    {
      "path": "crates/op-figma/src/instance/swap_filter.rs",
      "before": "98a671a9914c65a8db2aaaad18d0f85af588a26e7faf403be328bc7b1e30ffd1",
      "after": "83b6a2eb97b5f05dd339fe17990ab59f99bd13ce02ac5cc6c2a2ab2e771a1f32"
    },
    {
      "path": "crates/op-figma/src/instance/swap_style_tests.rs",
      "before": "92b1159996657234254d165368038154d9b74d53f8c9a260f087ce61f7c0c755",
      "after": "0bcda9030117b68a2a6e337fd20ca0a22fd5121e42e882002879ca3d80d14038"
    },
    {
      "path": "crates/op-figma/src/instance/tests.rs",
      "before": "9af5132292faa7b9bf990aa54754573d81adc65f6f6142171afe8b87033cfd37",
      "after": "696a785e6819c35a5f8545a5bd1bd9a1101664448fdea9c023a4c7e101d614b1"
    },
    {
      "path": "crates/op-figma/src/node_mapper.rs",
      "before": "25348e7002cf69a6167f2d1d4f6677e0df2eff13d0bb104315aaad52d8fa3815",
      "after": "9577feec02e80339e2587780abd0ce8637f57094069a093ab5c09eb609cb0429"
    },
    {
      "path": "crates/op-figma/src/node_mapper/style_references.rs",
      "before": "4eebf8547d0b124d4fd90422e6afe8b9e14e47df20c04562b3d259341b8d80a9",
      "after": "17bddcf8e2ffe191b901f75a48b8b94defaf3cfe344be178363286d60bba8af6"
    },
    {
      "path": "crates/op-figma/src/paint_vars.rs",
      "before": "83f3ac065800a813b9cc66b91b974b838515004dcdd0b7f9dc250739df33e034",
      "after": "e922588c31a6b33995b2678f0e289a4aeed8d2e4309a98394f146aede88bf78f"
    },
    {
      "path": "crates/op-figma/src/rest_adapter.rs",
      "before": "2391fd59a028629436e4c61c8f275f5874e4f2073126cc58f7cb940be2cd3e2a",
      "after": "f098907b687f6e9e549f7dfac01e21b7c3232918c15480752be6fa077cc6c985"
    },
    {
      "path": "crates/op-figma/src/rest_adapter/tests.rs",
      "before": "481d471067bfb53b9d51c31165dc50fef5157d77d3b742f425290b585d945f7d",
      "after": "60ec0c04bd46e9a9c241dc7d7a8817bb960ca7348c2bfe8f0c937b3c4c1fef83"
    },
    {
      "path": "crates/op-figma/src/text_cache.rs",
      "before": "7d987d90e40a041cba40951454d7aede3ec55aa85a983ca69e071fed12c88417",
      "after": "5a2fd670c31cb9d119753e67769609cc130ccb0fe7d6baf08a550baf303f0fd8"
    },
    {
      "path": "crates/op-figma/src/vector_decoder.rs",
      "before": "5cde408cb61f8fe6bd62a2d89dc2919075c887987a0bc3262632dfaaf7069e48",
      "after": "2dad929e805a0ba0269217ad3bb652dba2f30b6ea616cd68d1607dea82ca2d4e"
    },
    {
      "path": "crates/op-figma/src/vector_decoder/tests.rs",
      "before": "42d5ea44929d9dd6e7490190984e990069d4727925759815cb1cc6aa65c2fe10",
      "after": "21883b111411da5b9f0ba97ccde8481fad641a32734d9d1601a2b8af6a751189"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/backend.rs",
      "before": "b8d3071deb41cd2467fb5339ec166cc7c4894f1ca889c8ad6923f5e63c5bf7e0",
      "after": "b0863ad4a85d46dfd57a8c372ce87fafb3a99d4cdc378b918e1898f353c20e21"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/bindings.rs",
      "before": "a4ff28f5dce8f245e8af11f23d24000f0fdc1060b07d1b2b6ef3372e0ffbb2c1",
      "after": "ce2f9a857e286a12afd6a3b9402130aad5c1c60b36799f89caa07f81ce58afc1"
    },
    {
      "path": "crates/op-host-web/src/canvaskit/render_screenshot.rs",
      "before": "288047cb5d58f13cccdeeb3438737378e73ada01b2764713d92ea3050cf2da41",
      "after": "510c67218efb153ab4b3c24764808f26c4318bf8caf6f6e0d5e9956e10de6dfa"
    },
    {
      "path": "crates/op-host-web/src/op_ck_bridge.js",
      "before": "292b4bd05bf1917bba8fba9477ab0131db505bccc196c6723ea7b76eb3e2789a",
      "after": "0d64f916a1c08d196ac558b290ee92ff753e0989e1030e288bcaeacdfc3452ab"
    },
    {
      "path": "crates/op-host-web/src/widget_host/screenshot.rs",
      "before": "1d6a4935c801fa91f58783a2841eabbd656907e62093a4be5050d3c0eccbbcd9",
      "after": "501416e820e6ce9d9c3c51f13e9f6982a648ba60b60c0a9f28b350a76885ec27"
    },
    {
      "path": "crates/op-host-web/tests/op_ck_bridge_effects.test.mjs",
      "before": "081eee3cc746fbe0aa0385c93bb75256323aef050b4add4ba6d8610966bf4516",
      "after": "8b3f94328c7a96f95f9c9b70f50075680614440394a96e5ad05a7dbef0a128f2"
    },
    {
      "path": "crates/op-host-web/tests/op_ck_bridge_text_metrics.test.mjs",
      "before": null,
      "after": "51fdf58981d44e5866a6b52e87463756c0ddc31f3196f646ef2a400f420de8f7"
    },
    {
      "path": "crates/op-mcp/src/render_screenshot_tool.rs",
      "before": "563ddbc2c084255164f8fe9b1449e99f844cf14145246b0d327fc0e6049c800f",
      "after": "ee968a604c5ab5265f9f008def27457fe7260e85ea8d543f871f73ba2e2a5ea8"
    },
    {
      "path": "docs/kb/README.md",
      "before": "df094443c5068f5f61b0e826ed5d008d243a327f5d2f7a13cbf22558bf040cf8",
      "after": "71def4b7671ec3e554c5ab9c15def49d06d377859cfe8f4a56a87215a76f690f"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "bd38482be0ebcedb4f934ce998cd4a39258787fae43c2dc3579e731c106ad3eb",
      "after": "97c733e3edde15fda40700fec11fe2a59a196ab12de340c176c2c5f33fc2812b"
    },
    {
      "path": "docs/kb/figma-import.md",
      "before": null,
      "after": "b61ff186e8285d12a85e40426563428712d085ceba79587a2cf2e04a30a3e625"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "d8026b5df631f1b5c5b8968a405e93a1f16d02d732b37e87d0cecd2e32c9ff7b",
      "after": "b62a0b770034e1f83e01a473297c6e510429e558a3ed00e063dddaec2153d263"
    },
    {
      "path": "packages/dsh-node-runtime/figma-fidelity.mjs",
      "before": "8b50af026e1f932c7b80cb9accccf8440f6867ea1c7fcfd48fc5e3b1a88ffa38",
      "after": "7617f6c7f74d15abfc355da1118ee0894bfa2967f1cf62d41b6171d4bc582ffb"
    },
    {
      "path": "packages/dsh-node-runtime/figma-fidelity.test.mjs",
      "before": "2d5e76d829133dd0a2b92be3553abaa0f2c63e68462503299a9ff00a2434629d",
      "after": "37b5c48de634145e2b66618b660fecbbb93147149f53817c90c3ab1d05bf14fe"
    },
    {
      "path": "packages/dsh-node-runtime/figma-import-jobs.mjs",
      "before": "11086a88f0be2f7ca28b39c6a03b231fb18e27b0fd0d020fc028d5f00069a36c",
      "after": "861f496adbb0ced42097bdad584586eb2a2d671789b657ac68bfb6902013e535"
    },
    {
      "path": "packages/dsh-node-runtime/screenshot-renderer.mjs",
      "before": "641092f28f5005adfba7632fb15f32ab764f3b999f552355d8f779f47b488b4e",
      "after": "791bec1d89a860d6d903023cec4058926c0bafb0bf93412188dddadf1326c2b7"
    },
    {
      "path": "packages/dsh-node-runtime/screenshot-renderer.test.mjs",
      "before": "72335614dae3c1969ac89d49521cfb7176d54c69474368c2a3773da4a319a06e",
      "after": "7df2f72c7549b77b929f3004232055b49cbb46acbbb0b77f9c605f9a9fe26541"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "02e94d055d0f4bf70090f929812bdf77b2d35e30656dd5b9bc591c3d50a63a82",
      "after": "f1ba422afe036cd2103ed4064a5f220dd66967b0d6940fba6f3a0ebcdcae7268"
    }
  ]
}
```

Completed-At: 2026-11-08T17:10:11.773572+00:00

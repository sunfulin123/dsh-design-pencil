# Remove scene template assets and replace old style guides with design-md builtins while preserving Talkdesk Cobalt

Record-Version: 2
Task-ID: d7c48a9d-87cc-4072-bf2b-1bee9de13b7c
Base-Ref: cadde9b38b585047cd9437b444dfe15b9450a0c6
Started-At: 2026-11-09T09:34:35.252624+00:00
Type: feature
Status: complete

## Context

Remove scene template assets and replace old style guides with design-md builtins while preserving Talkdesk Cobalt

## Changes

- Removed the scene-template asset kind, MCP/HTTP tools, Rust document commands, UI tab/cards/actions, saved-template storage, provenance repair exemption, document fetch/retry and bundle staging. Removed the shipped `.op` corpus, JPEG previews and `templates/step0` generators/previews. Cleaned corresponding legacy native/desktop/FFI/CLI/service wrappers and tool schemas rather than retaining renamed template aliases.
- Replaced 63 old style guides and the separate seven-entry AI style catalog with 84 verbatim community DESIGN.md files plus unchanged Talkdesk Cobalt. `manifest.json` records stable `design-md:<directory>` ids, source-relative paths and SHA-256. Preserved upstream MIT license. Empty directories, including talkdesk, are excluded. The external source directory is unchanged.
- Kept authored display names separate from stable ids, read frontmatter color/font roles, reused Markdown palette fallback, and cached immutable builtin cards/catalogs. All UI/MCP/AI lookups share the same corpus. Default Cobalt variables and independent document/editor theme features remain.
- Renamed shared gallery/input state to Asset Center; File menu opens assets, mobile Assets spans the former paired row. Homepage illustration no longer depends on deleted template images and uses procedural paper artwork.
- Removed old-library merge compatibility as requested. No default development assets.sqlite exists, so no live database or user design was modified. No commit or push.
- Updated architecture/product/runtime documentation and removed template-only translations (15 locale catalogs now contain exactly 1835 keys). Tightened effective-line baselines. Fixed a preexisting missing `prototype: None` field in the codegen test fixture, which blocked the required all-target Clippy compile.

Decisions: ship all 84 guides as embedded resources, not machine-local imports; preserve raw Markdown and source metadata; no old-data migration or fallback aliases. The source corpus is self-contained in the repository. Rollback is reverting this task's source/resource changes and rebuilding both WASM outputs; no user documents require rollback.

## Validation

- RED: `cargo test -p op-ai-skills builtin_design_corpus_replaces_retired_styles` failed with 64 instead of 85 before implementation. An initial `--exact` invocation matched zero tests and was corrected immediately.
- Passed: Python byte/hash inventory compared all 84 copied files against the external source and manifest SHA-256, and confirmed the complete source file set with empty directories excluded.
- Passed: `cargo test -p op-ai-skills` — 217 tests; `cargo test -p op-dsh-engine --lib` — 67 tests; `cargo test -p op-editor-ui --lib` — 1841 tests; `cargo test -p op-orchestrator --lib` — 1928 passed, 6 ignored; `cargo test -p op-i18n --lib` — 32 tests; `cargo test -p op-mcp --lib style_guide` — 7 tests. Updated deleted-corpus fixture expectations while retaining pin, token, palette, prompt-budget and selection coverage.
- Passed: `cargo test -p op-host-web --lib --features canvaskit` — 778 passed, 29 ignored. Ignores are not counted as passes.
- Passed: `node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` — 166 passed, 6 opt-in cases skipped. The first concurrent run exceeded the large-document timing budget during WASM compilation; serial rerun passed without changing thresholds. Packaging initially tried copying the deleted template directory; removed that staging dependency and verified both real staged-runtime tests.
- Passed: `DSH_E2E_CHROME=1 DSH_E2E_OUT=/tmp/dsh-builtins-acceptance node --test --test-concurrency=1 packages/dsh-node-runtime/asset-browser.test.mjs packages/dsh-node-runtime/ai-design-loop.test.mjs` — 4 passed, no skips. Covers editor theme ack/reload, scoped assets, all 85 builtin entries, and real CanvasKit design → screenshot → lint → fix → screenshot.
- Passed: isolated CDP browser opened the actual gallery, which showed only Styles with Cobalt first and new brand cards. Clicking Apple wrote `designMd.projectName=Apple-design-analysis` and primary `#0066CC`. Screenshot evidence: `/tmp/dsh-builtins-acceptance/gallery.png`; design-loop images: `1-designed.png`, `2-adjusted.png` in the same directory. Only task-owned temporary hosts/browser processes were used and closed.
- Passed: `PATH="/Users/franklin/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh`. Initial bare-PATH attempt compiled Rust but could not find wasm-bindgen; reran with documented Cargo binary path.
- Passed: `cargo fmt --all -- --check`; `git diff --check`; `packages/node_modules/.bin/oxlint packages/dsh-node-runtime scripts/stage-dsh-runtime.mjs` (warnings only).
- Passed: `.venv-lint/bin/python tools/check_code_line_cap.py --ratchet` — 2533 business source files, cap 500, 239 shrinking legacy entries.
- Passed: `bash tools/check-maintenance.sh --base cadde9b38b585047cd9437b444dfe15b9450a0c6 --task d7c48a9d-87cc-4072-bf2b-1bee9de13b7c` — checker unit tests, line cap and harness all passed. `.venv-lint/bin/python tools/knowledge.py check` passed.
- Browser build initially exposed the obsolete fixed translation count after deleting template strings; both Rust/exporter counts now match the verified 1835 keys across all 15 locales. Final source builds both passed: `PATH="/Users/franklin/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-web.sh` and `PATH="/Users/franklin/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh`. Browser staging now contains 11964 KiB of runtime assets and no template resource directories.
- Passed after final WASM builds: `DSH_E2E_CHROME=1 DSH_E2E_OUT=/tmp/dsh-builtins-acceptance node --test --test-concurrency=1 packages/dsh-node-runtime/asset-browser.test.mjs packages/dsh-node-runtime/ai-design-loop.test.mjs packages/dsh-node-runtime/package.test.mjs` — 6 passed, no skips. Repeated final maintenance gate, knowledge check and diff whitespace check also passed.
- Passed: `cargo clippy --workspace --all-targets`; warnings remain visible. `packages/node_modules/.bin/oxlint packages/dsh-node-runtime scripts/stage-dsh-runtime.mjs` has no errors after removing unused migration-test imports; warnings are retained.
- Unavailable: repeated `vet` runs exited because neither ANTHROPIC_API_KEY nor ANTHROPIC_AUTH_TOKEN is configured. No automated vet review is claimed; manual shared-dependency, tool discovery, data provenance, resource staging, undo and UI binding review was performed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Replaced shipped styles with 84 verbatim DESIGN.md guides plus Cobalt and removed template capabilities and legacy migration.",
      "sha256": "2765f2b24f2c7545bc5c4ec5df4336056a43b966e42538a91d8b39feb1cab45d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Removed retired template transaction invariants and migration; retained scoped style/preset storage, confirmation and autosave boundaries.",
      "sha256": "bfcaa7c81b1d0e9dd7975375168d055a7da3be37d66f9aef96cc39fcb59e1e34"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "COMMANDS.md removed retired template tools and documents the 85 builtin styles; lint and task lifecycle rules are unchanged.",
      "sha256": "62fd8199eb0303688c8f83c9c2e5fee7d0610a7d7e21c0844b52ce78f47ae1ca"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "action": "unchanged",
      "reason": "Removed the obsolete template frame-pump call and its comment; tile, image, font and CanvasKit lifecycle behavior is unchanged.",
      "sha256": "a389bdc6da325560fe53d56edabc094801f10da0fac7f9ee1add89d66c9a647e"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- Old asset databases are intentionally unsupported. This is a fresh-app change, not a migration release.
- Font declarations are preserved; this task does not install proprietary brand fonts. Existing font fallback behavior applies.
- Historical native/desktop/CLI/FFI shells outside the current workspace graph were cleaned but not built on their native platform. Current Rust/WASM/Node/UI graph and real browser are the acceptance scope.
- Large raw style documents increase embedded resource size; immutable card/catalog caching avoids parsing the full corpus on every frame. Original Markdown remains available to AI.
- No live app deployment/restart, commit, push, or user-document modification was performed.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "68cf6ca0c98a3c1c7b0cede4d6878490c4259adf5c15ae2d03aaecc735a3f0d6",
      "after": "4edf1855543cb6dc5960e6f9240a79e24d604e74c00715e82869920db72491a7"
    },
    {
      "path": "COMMANDS.md",
      "before": "671f5ed61fb91516b89ec63042c2ac167d9cfadeff1c2da0e42fadf52061dae1",
      "after": "b61536e66d1ce87d818a48e69e104329603101e3f70ec481cbb28c034fae11f4"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/1win/DESIGN.md",
      "before": null,
      "after": "64d02d344cb16d68b6882054f35e3bfb7241ad60dc8b7f84f6636a7d1379496a"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/DESIGN-MD-LICENSE",
      "before": null,
      "after": "6d4bdc9a9cf30e7beb593475fdcdbf29f981ea6bd7923f202866145409f87b44"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/agency-editorial-light.md",
      "before": "8a204ae861979f3e0f0c4ee40ad83be5530921921142d36c76b6365e71e3c025",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/ai-product-dark.md",
      "before": "be2327f6e7439cd560dc4a0231182bdd1c921fd82f1bb31a301bf0057d21875b",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/airbnb/DESIGN.md",
      "before": null,
      "after": "add34130d67209ad105346d60fe2b290728b9711683969db4b7760e29477a5fe"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/airtable/DESIGN.md",
      "before": null,
      "after": "1d225e511213044d3c705bde50265ad010932bfd8a15740a144dd4f480128889"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/aljazeera/DESIGN.md",
      "before": null,
      "after": "37614fc72658ffa30faca01049bd1efa8a9baafa4750501405eeea66f149466a"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/apple/DESIGN.md",
      "before": null,
      "after": "83fbc614443a9b3d7569e9956a43e7b8740f9d0f939f58b8154f7a7cec3002b2"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/arcade-neon-dark.md",
      "before": "c47ea945f418f013846124bb7bc6cab993e3f4f93620d815ed0afc978780afc5",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/banxin-rule.md",
      "before": "bca3a69d57fa674526a45a9bf9d553f32a86c1390715408b70b01710757f1635",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/bauhaus-geometric-light.md",
      "before": "0d879d2a6ca37f5276429f62bf9524fb74f4b4a0388d2f9ccd0377d8d0bf756d",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/binance/DESIGN.md",
      "before": null,
      "after": "378ff97d568ccbc316519b9d45a29d6649ed8961c9c486c3ed4cea7501d72371"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/bmw-m/DESIGN.md",
      "before": null,
      "after": "824a1707c0a8d1609d72477d0fa211b9ebe4bdeb3e1fd701790af7b7bb669a4a"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/bmw/DESIGN.md",
      "before": null,
      "after": "b7268279e7c98e85fb80890e06765f4ee8340ba1ea1ccb5a8a5b134de43dac3e"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/broadsheet-lime-light.md",
      "before": "6f497d5e0ef272a41868e684cbd3b63ab8196d59fca1be5a6bfaa8b17447b9a3",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/brutalist-luxury-dark.md",
      "before": "da0963d1f4924eaa982af75a776dc43b99d5a081e5c02632a18e4ea8afcf49da",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/bugatti/DESIGN.md",
      "before": null,
      "after": "375f0a20ada88cdee5e995ca7edcfbd584ddf5f887024deebd1bc75bfd55b1bc"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/butter-serif-light.md",
      "before": "22499789f121455e1fec638d3e7b66c04ea0cb5c7161002e4aa4831f65693c9f",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/cal/DESIGN.md",
      "before": null,
      "after": "8cd21b7d67e94c899843d517f4b426e4fee33d47354a433d6a63ebcf79d5a654"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/claude/DESIGN.md",
      "before": null,
      "after": "3d972f34f8d4f33b442fa28220cf3b7ca2f13c0a97c468e3988148f82521f9df"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/clay/DESIGN.md",
      "before": null,
      "after": "1abd803a207fbe950a06e155adcd6013c2e149b13e7b88844f5069f9d3d99eb3"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/clean-blue-mobile-light.md",
      "before": "e8f66c2c55f9e644fd2db13d9e9f2e1dce138d6ee2fddc46bcc5eb70c17e16ec",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/clickhouse/DESIGN.md",
      "before": null,
      "after": "50987e29b603cc7503ebe724af810fcf43845e96fdd4083e0fbe5fe00d2cdd2e"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/cohere/DESIGN.md",
      "before": null,
      "after": "1c49a5a5f88d43841d4f4afa33831328d47a5715048700a3b75086a822575883"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/coinbase/DESIGN.md",
      "before": null,
      "after": "c8c67800dd7f58fcc87ed7d267a3bba862e3419e499e8a66d67731a69d2de1d6"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/composio/DESIGN.md",
      "before": null,
      "after": "e7db886dabecca61f29b83e8f46d7a1e8a43889d30b81bc6e48162ccaafcbb2f"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/corporate-blue-light.md",
      "before": "ea0fd9f5642936fe5985e4e752b4fadbae06823e01f76caaf7f0858d871f7147",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/creative-bold-light.md",
      "before": "4f3f9f7589237ee1f965407191bb340d0b4bb5b0e0fa23e46145f506676c916d",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/crypto-dark-bold.md",
      "before": "0c4e4221e64a36a7d23852369371a7a457c20fc3362bab9dcd0b64efcc1e5412",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/cursor/DESIGN.md",
      "before": null,
      "after": "a3db9b3019dc2f514fdee7cd0ca0a5232c0bd0119e23178e8eebaf6916258d9d"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/cyber-gradient-dark.md",
      "before": "62f040e55da046596ae4d30911889a3822c4a0c7ca8d058e6a728520eb465037",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/dark-bold-mobile.md",
      "before": "9cba3adedf5bf3942a8d9eac2bc26faf5e0d608ff1e9774bb8101f82a6ac41c9",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/dashboard-analytics-dark.md",
      "before": "d24b5d39f814b2dc9051beefe218b2444df238b55c200800683dd0ba2dbf963b",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/dell-1996/DESIGN.md",
      "before": null,
      "after": "e186c614b1223fe7015670472ac6bc84b5b3fdd5de5325b3ce5bfb7fbe9c8d6e"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/developer-terminal-dark.md",
      "before": "d20395cbae800908aaba330036bd4c5b12238f79675b13bcebfa52a28a849da8",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/dji/DESIGN.md",
      "before": null,
      "after": "c8a57520b87286869a88cdd2c07f21080ebda9fb3eee315b11d95c752582c1a9"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/dossier-linen.md",
      "before": "20934c7d4c6e1418456393ba02934d27e6ebdcc28991332e7a04677a2eecce03",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/ecommerce-modern-light.md",
      "before": "71571896f8d5ea87f2c99294a22189284b1557a235af43912e72c4da097d5586",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/editorial-orange-light.md",
      "before": "e959d60f6aac46ca4135d586d7a3f5670720901c0b856c25c69be2bb2a6a7cb4",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/editorial-serif-light.md",
      "before": "83c88ae0407007f76bab59a001ce478feb5e7bb328a6a5931ddb41ba09bf9730",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/education-friendly-light.md",
      "before": "68499d35cd022d106ea5d6d47e6cec5b5292a29f8eb63a541bd5bbcd5af035df",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/elegant-luxury-dark.md",
      "before": "540d03d59cf20c60be1ff5802e979386d69951eaac1895828f63e85ad24f2bd1",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/elevenlabs/DESIGN.md",
      "before": null,
      "after": "3b359acfaafadbb499c7ed3eebe813a76e0be497a7157b77de207fe275068a66"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/enterprise-slate-dark.md",
      "before": "016f21913bc40c381fc7bb7de7bd518dd2676795a18d0c4724c80ed3e847a0c2",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/expo/DESIGN.md",
      "before": null,
      "after": "1be7e129b6f75afaa12318a7c51ab22f6f74a214dec22c4827cecc519f112363"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/ferrari/DESIGN.md",
      "before": null,
      "after": "1199e2832641cac7e384aaf3b1f3db87f992240cea5d3d1eee04d9dc00acb17c"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/figma/DESIGN.md",
      "before": null,
      "after": "716ce8431f47eb8b8135552710e3c4d538bccccf1202e4ceac5428c9aada9972"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/finance-clean-mobile-light.md",
      "before": "e8716d349661046990c8fc77d19a57459bef4189a7a6a8a40867621e21769b77",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/fintech-dark-blue-light.md",
      "before": "617fd8d69d0e6ed833227a6f2ae0489afd280154c9f70278f305ae96c6ba7646",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/framer/DESIGN.md",
      "before": null,
      "after": "a5d47dddacf5a04577cec0be6fe0fc53b7402254c7686874af3e59bcc7588cb4"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/gaming-electric-dark.md",
      "before": "f7b0a77b7d30cb5b2c05c9d388142371d67f50137a11dc0d3d5f4f9c63ada26b",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/gridpaper-graphite.md",
      "before": "bbc51bfa1ae8b593a7a556340cabde3f681f66b6fa6890c4d5f6a9b93b94146a",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/hashicorp/DESIGN.md",
      "before": null,
      "after": "d2df9be72d867e48d318fd18db04e60a78357c27e392ab921fc2ba7f46951442"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/health-minimal-mobile-dark.md",
      "before": "697dc364ef71977466e96a1bb5d754545f75b46c8576e334cb3b25d650ce383b",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/healthcare-trust-light.md",
      "before": "2c781cb2a078c86c8dce1e5e43357595ae9609adf6fe572b876bfccf46f4fdc5",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/highlighter-notebook-light.md",
      "before": "4bff658d6bd23f266ae5fb8b868459e1620300784b05a6c63df038e60629e009",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/hp/DESIGN.md",
      "before": null,
      "after": "4c9a248046684bdde5311a0c9881814f50e2381c2b0f3c75b02a35fc64bc8bb8"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/ibm/DESIGN.md",
      "before": null,
      "after": "46f6fd65b5e7524fed1133b9b3c0dd619f9a0f145fbb2b87f3675c701a88f3bd"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/industrial-mobile-dark.md",
      "before": "8d5a64364c08444432d1266edd11b681c9d3be2afd19925a69f4b4d7f3ab7a01",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/industrial-neon-dark.md",
      "before": "d0f7eb9703841368d77c8b61a01a137363ee12380b87ae22ed2ea021967d43c2",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/intercom/DESIGN.md",
      "before": null,
      "after": "962be23cd947e87a86b2ffbc0440e9d0808243a6ef3af2aa04e8e7cc04d48ba3"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/japanese-swiss-light.md",
      "before": "75cd8660c88877d283b638262494cf78375bf80f9bdec2c65d048727535952b0",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/jobright/DESIGN.md",
      "before": null,
      "after": "9e682194e3f846915164189538741133ab1e2779730677e92d28f873f782999b"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/kraken/DESIGN.md",
      "before": null,
      "after": "41bcbd5642c926a549f0d50f1151484c5776b4536233240c8415cfb79bcf1f38"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/lamborghini/DESIGN.md",
      "before": null,
      "after": "9aa68c53b481a0befdf72859db5625f85454122294509989aa58414aaee04b34"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/leadprint-vermilion-light.md",
      "before": "8b1c46349140a43fbcd2414248df4d34d6a63a75d7d56286ab3ce450532a1ad0",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/ledger-tick.md",
      "before": "c547015983d90ded362f417f095d2bcec4f1720cf910c8bbe3e27abf12440ab9",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/linear.app/DESIGN.md",
      "before": null,
      "after": "30bd30e72c48a16e4bdbd010f2d1c85fab657c6fae3cc85389399aab10f9cb5f"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/lovable/DESIGN.md",
      "before": null,
      "after": "92790895c833104072643929ba56ebbf42c8f88ffb7bff1926462545d0ace6c7"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/luxury-brand-dark.md",
      "before": "e7f967f71d020129da103d0e4c0cb0a58e9467970f3dec84ff68ce47110ab513",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/luxury-fashion-mobile-dark.md",
      "before": "81aaa1220ba34eaaa6b421948715b09daae7b012d58569847d8b0e92d2ba528c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/manifest.json",
      "before": null,
      "after": "da782227966914c2a1266e2bdfd6ccb2202c192dd8ba03579200c6e10b78c36d"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mastercard/DESIGN.md",
      "before": null,
      "after": "e76ceaa187f43bd24b8338d2b2314e71e9225b36492e40f32a55782281a10437"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mercury/DESIGN.md",
      "before": null,
      "after": "dabb3683422a9841369b0db53ff13ed375b0b6f019157a5c90e9fca165cc111f"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/meta/DESIGN.md",
      "before": null,
      "after": "306dfad97c006d47b134fb0dbd55ff68d3baa526844d6eb37346373c9ef35339"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/midnight-minimal-dark.md",
      "before": "c09bd96a52d09fb2033506fc687e992ab6dcbe2f74cf4f10e41e42eeadc1cd11",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mingsha-mineral-dark.md",
      "before": "983d838fbdb304e98e9ac589c6a0fc8720dcd460940b65c70b3ec2b9a8114835",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/minimal-playful-light.md",
      "before": "953a52956fa9ba1d08b14762c3d64848a61ec722b4999a1cad13a29e433d7294",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/minimax/DESIGN.md",
      "before": null,
      "after": "2658b96488bb629749259b152c5ba2912a0e8feb6a03477e265879abd9264c50"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mintlify/DESIGN.md",
      "before": null,
      "after": "754ffcf35dcd39ef8aef450085ce936aaca5b872ff92caa66be99e91a5c3d5ec"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/miro/DESIGN.md",
      "before": null,
      "after": "87c71f76297277d64f9679e015a50da88e72d86d7b41badf8733eae1e4cde335"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mistral.ai/DESIGN.md",
      "before": null,
      "after": "40e2c692d72c54bae1e43446e2d059b71d773668d39d71ccb7ededa9fa07d145"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mongodb/DESIGN.md",
      "before": null,
      "after": "4523f10efd5ccd46f9aeac3b98626e24bcf907bc0c1e46500cb0e3920f932e71"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/monochrome-expressive-light.md",
      "before": "98fbc938ac7f92e7a1d7ac42484beb44fb7436bc9251602c81f20442d6ce44ef",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/music-dark-mobile.md",
      "before": "dd8dbbcdc743b3c03ed399ebe9b25bf4d3806cf04fa0993367eed4cc07c909f0",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/mydealz/DESIGN.md",
      "before": null,
      "after": "598698a1bd0824260d57eb21f728b79cd702916f918de2b6f39b3720ba727872"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/neon-purple-mobile-dark.md",
      "before": "1f071b63b1d945bf94e5f42fde67eb380c2f8d66484406feed10406ee75ca8ac",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/nerdwallet/DESIGN.md",
      "before": null,
      "after": "478475273beb642f0661fb1aef7107bac5cde69250794bc148b28ee2c61960c7"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/nike/DESIGN.md",
      "before": null,
      "after": "d2a3d363665839e2ddc15c91b8a9f3e92b1962ff55a7ca5d964ab3bb88b8186c"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/nintendo-2001/DESIGN.md",
      "before": null,
      "after": "9630af17090d5c39ba9d8b5915a597a96c7552efe1422b3b8c3f31fb3e636716"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/noir-elegant-dark.md",
      "before": "a7664d54548e519633dac9d829057f9d0fe3ecfa323f2ed967ffda9cd32a7b34",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/nonprofit-warm-light.md",
      "before": "aa63e132cc1d900f3eb02b7980e33a7769533152af28a8859bb3cfdf976b1f4c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/nordic-frost-light.md",
      "before": "6af18d1d3ed7fc93dbe8543fd7f87ccc1bf9058a9410e5876f754d2dbea365be",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/notion/DESIGN.md",
      "before": null,
      "after": "fa9d6e78216d8f3e5d3990709ca2de6bc2e268e945bb94f255fd1bfb15455266"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/nvidia/DESIGN.md",
      "before": null,
      "after": "d649be85daf075c98a17071e707e3901c6e19150044a81716acd01ef1169cc83"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/ollama/DESIGN.md",
      "before": null,
      "after": "3f36f897e5aad870344dd97e282c8f125ad208dc99449bb08dd38b9259d2f451"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/opencode.ai/DESIGN.md",
      "before": null,
      "after": "d1a8893c4b8ac90b1e86230eee2effa8bd15add3582853477920e32432336dda"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/oracle/DESIGN.md",
      "before": null,
      "after": "23f03014c1654ff72e9a2185f1c3d1f3b51eabc8124c14f6ddd51b17a36a85a6"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/oura/DESIGN.md",
      "before": null,
      "after": "8674dbeb48bf7e3ff5271e79a6222084118ba1630db4a2199d1492568850fa08"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/pastel-soft-mobile-light.md",
      "before": "d289658abbf5a20d961c1a0fee00bad4b7a15c6162a576cb0eb8a80dafea8933",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/pinterest/DESIGN.md",
      "before": null,
      "after": "26a202fd244e9213d5e2475d81581828da1dd97e089e44639d9783d04f96e4a8"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/playstation/DESIGN.md",
      "before": null,
      "after": "2a56c109af6cb847fa091b768f719b498ac56b582d010860e73ea5fb72a1590d"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/portfolio-minimal-light.md",
      "before": "95a2453907b9db0478ed0b510597b424ee820410f379f17c2e6122b3f83aeb3a",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/posthog/DESIGN.md",
      "before": null,
      "after": "01f497f751d56296bfcd5eb8806325a4bb4786d364941ec6e65c65fa9ee6d362"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/raycast/DESIGN.md",
      "before": null,
      "after": "6e2c5137e4d914b70996d589688374a801b6f29a35c9c019c22abb5e0170bda3"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/renault/DESIGN.md",
      "before": null,
      "after": "b343df9a67e57f248e9eee704f52b17dff9cf6a46d1dc9f8d7ab36741940db59"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/replicate/DESIGN.md",
      "before": null,
      "after": "c22062d7b4174bf9ced7bc61c48389086cf6eed96a958e098ee70389893b0a15"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/resend/DESIGN.md",
      "before": null,
      "after": "99536f1b2380511a539f7f3466d46d351e4bf35a5af0c0df395bdc20af05c9be"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/retro-warm-light.md",
      "before": "e58595913e80b7a6ab923e8fe6cfbfc374f17ca256e682ed54ea7ad06afd3cca",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/revolut/DESIGN.md",
      "before": null,
      "after": "b7fa8473315541f5d7e7d76f68a77105d255e6dae00d31d5eb34621d1d52de59"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/runwayml/DESIGN.md",
      "before": null,
      "after": "b0e69bf643f89bb57ac0b82a3bf025e59ff1478c244cb0528ad1e38b3f80dac9"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/saas-clean-light.md",
      "before": "4bbf49084a4bbbc6980b6a17dfe7ee2c01086ab0552a1ffa988b5dc5e94d5199",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/saas-modern-light.md",
      "before": "8ce0da80c4d8aca0af8ca785fc63513e57d8c2184839bcc62b3fa3c35dbf59d2",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/sanity/DESIGN.md",
      "before": null,
      "after": "ea1c442de2b23443f79af46524a81f33951606c8ff043ea9c25ba886264fbdd8"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/sap/DESIGN.md",
      "before": null,
      "after": "f14c951d6112efce488f56d189b9bcdf58f5b9f87ae1e2ee68f062e6a6967d97"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/scandinavian-minimal-light.md",
      "before": "f178cf980c4e51b7e48b72f5a8ad9df2b319d9866fe7578ce2bf9a6036657e48",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/sentry/DESIGN.md",
      "before": null,
      "after": "655c91d7d23b5e869a966b7f1b63ae650567ad5d69003cfc64b0ee62c8e02c1f"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/shopify/DESIGN.md",
      "before": null,
      "after": "495e89b8d0a1848ded013c040f7a2ae62077e9d87fc4385350e25dee02ccdb38"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/slack/DESIGN.md",
      "before": null,
      "after": "03cb243015a2e11d0faf05caba7f3d0c7fda6839b1f5ce707a23e8d46d1a11bd"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/social-vibrant-mobile-light.md",
      "before": "bb14c6ca10ed9c24b5f421b89fe7441801be1709d48a0ca4d2e141ef8b902468",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/sounding-navy.md",
      "before": "4ccbd7499771a5656e7a9566fc91783350c4aba749f018ddd15a5f2a115d51c4",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/spacex/DESIGN.md",
      "before": null,
      "after": "495450c79faab54d12d677649ca0a2c30a60f64f536a802e945ad54185c5baad"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/spotify/DESIGN.md",
      "before": null,
      "after": "72e964a6cf551d0603f9854f2f42ee08e97ad4d9e17e037f50f6233508288295"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/starbucks/DESIGN.md",
      "before": null,
      "after": "e20338ee10226c63cf2588207288c08e12d60754a53f681657adaf364dfe8fa7"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/startup-gradient-dark.md",
      "before": "312cdb2b126b74af3c416d1ae770b798be90a21ad51f4f0d2b513e5aa88de422",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/stripe/DESIGN.md",
      "before": null,
      "after": "5c8806b7dd3e0c2554ccba9d1e2a7c78e7c6e50e44fcf6ff5daea6026f8a9ed9"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/supabase/DESIGN.md",
      "before": null,
      "after": "f57287d7f44d59e8169dc4b4304ff03c1a2efb37f5433b9c04460caae7710880"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/superhuman/DESIGN.md",
      "before": null,
      "after": "3640298bd2957aee80ce88eb465a7541ba835ec105cba364a6a621d885c7f34f"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/tech-developer-dark.md",
      "before": "409f9a3e8f1d09b06cb0fd81afb2c2710d524a1485dca33097a8faf642270db1",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/terminal-minimal-dark.md",
      "before": "ff9dc46eb42e0506a4e7b24bcd3c8735213c64a66ea924fd329abd4a6f33735f",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/tesla/DESIGN.md",
      "before": null,
      "after": "19f2f7e6073d708f46d2512e6bab3c7c417cf2b4d9f57ff6ec6f2e056ea942b0"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/theverge/DESIGN.md",
      "before": null,
      "after": "5da2c3116e6845826b043ac115a80896a399efda2cebc0188981fba2ef9bb526"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/tidemark-slate.md",
      "before": "fd955f1bb555762b5e6736a035ab83dd3d6155e30de13a6d8a2c5cbdd4921a5c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/together.ai/DESIGN.md",
      "before": null,
      "after": "aee472c583f55a2f2c7ee1c403a96dddadb3ff6dc518335451f431e313bf43cf"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/travel-warm-mobile-light.md",
      "before": "921a0aeec43201875ab1c458d6eff458662e5dd3a13364ef0d341d03a9b945ef",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/uber/DESIGN.md",
      "before": null,
      "after": "f30d2257d2d090790332d00ccb16cd2516c3c6008be61ad2ce83c4e991bcc803"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/vercel/DESIGN.md",
      "before": null,
      "after": "d0951b93c2b4ce9840c715c9f9b3e58a386c6c58ae5cc0f804dec3b116b95bd8"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/vodafone/DESIGN.md",
      "before": null,
      "after": "293a40951e654283978fa744b24177a159d8f2a60f402bc735bf081618af0ef6"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/voltagent/DESIGN.md",
      "before": null,
      "after": "4457887741ae5e965e205282b03c4bff83e47dd7a03cd7f38c64623a17569fcd"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/warm-food-mobile-light.md",
      "before": "d6894c5beb0194f765ea400178afb177ad964e866879ea970bc0387fb9d8e1e3",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/warp/DESIGN.md",
      "before": null,
      "after": "5b1201f7b1b4e72570d148d1f980fd1cb35e6e4122d48dd271787aa3538a25ad"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/webflow/DESIGN.md",
      "before": null,
      "after": "9230c7b3951371fc2edc04958962e32bb7ec9a9b703aa6b72eaf5c7991b7c984"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/wellness-green-mobile-light.md",
      "before": "4338dbdefb1d5fd7967b64caa537000bfeca8af6d0e71953c4317a7e297e7010",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/wellness-organic-light.md",
      "before": "202dc1c48b49ddad8e7c3444e3a555742317c6b5a315e1a3ee8f87628b0e2a3d",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/wired/DESIGN.md",
      "before": null,
      "after": "eb439dcc573401dc30583f40e7eef8a60b769232da59e524de6dce56d5c3593e"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/wise/DESIGN.md",
      "before": null,
      "after": "442df0ad7380efd8712f5574bdca34a73cfb41a2a43454ff459863a6258af547"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/x.ai/DESIGN.md",
      "before": null,
      "after": "9c9ef45d8c0c3b9a7622833cdff8bd125ed6bf296a82cc7274215276706e52eb"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/zapier/DESIGN.md",
      "before": null,
      "after": "9aee43ba8ece1b4fd0753b4cad0a29f3497331882fa376f0dd4fea8a018c32fc"
    },
    {
      "path": "crates/op-ai-skills/skills/style-guides/zen-paper-light.md",
      "before": "770b4a8742913ba81adffb04015a69d2e2e7fd9333861dbdfadb08d7b05118ea",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/src/lib.rs",
      "before": "7e29a43c0908b30bc69fdcf3862a2f4b231f9731c5bb9471ab7476bb49c69e00",
      "after": "d60f0f368ef5154938a3cb6014a87765b8bfb9f3a22e96df162239dc6b55197f"
    },
    {
      "path": "crates/op-ai-skills/src/resolve_style.rs",
      "before": "c2b8a025ce5f3bb8399ee940d7aeb29f3b02d2c71a253d2792604e9032d197ec",
      "after": "6d6280976a7368ff84fd94886974158e06f3a06c654b76adc11d12492a9eeb12"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/audit_tests.rs",
      "before": "ba6dd86dc263479d839dacc841d80d2a149da6f9999bd50fb59282bbf7634ae0",
      "after": "2fc4ccfb51d46364d23ded24b4805efad02b2716384bf3f1a2f672652b56277f"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/card.rs",
      "before": "254c6276fcc9c090a3dcc423b25e0d3e35ddfec38235c8bd78730844f7897dc0",
      "after": "846f1ad0935d5201119e8f0fb76b7af57e1240e6feae90a34795f146cc2359b9"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/design_tokens.rs",
      "before": null,
      "after": "9b01b384b8dc19c7dc978d4791cf2419749ea4d4ef8cf256f3011c86dda725c2"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/key_aesthetics.rs",
      "before": "259095dfaab0f8a0e1bae8cabf2febeb24f1209729629428426198bab781797e",
      "after": "659afb6448230d6598a93334701d0435452318c35a206e936d36f1932f88005f"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/loader.rs",
      "before": "7373a8b8f6c161f05dec48fffc811a088aa29e574fe14d1be4d34a3f0a6e2f4a",
      "after": "98892cbb602a3d00d7ec3f00da227d6187ec301167c236b0c0a89c226b59aec3"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/mod.rs",
      "before": "2a2e7dba457526a2568ec6111d6b978375ea704eca32c77ee99f6487d4a70f88",
      "after": "1e9b9b10ceb1d66559e2d7f253334b5a33f18755e1ae1c2c4d517d14534f4f52"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/parser.rs",
      "before": "001fd62d86e2d7e38d39893cfcc36491fa69f816b6b9a6e9e22da5903e6b30ca",
      "after": "ae5099cb4d674adb2b81051d7a884226e2a02d045c117c29626e09036c7554d6"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/summary.rs",
      "before": "aebf8e65f57bd69172abbd178ce8d0ab115c04ed20b734671bf527fba5155d38",
      "after": "dbbc6c5a72440e7ffb1a81bd7b8aa0173a941f6283a32187b00711e765f8e0f4"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/summary_tests.rs",
      "before": "d48663969796de4e3f0a179bb16bfb2fa92a7b842fffea66a79f8d388350fff2",
      "after": "f5b85fc6d33860441bef5c81353f52f9e14aa1b81998f901b74d405a74c8dd7e"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/token_table_tests.rs",
      "before": "178a5c770ff294d8037dbd44563c1024c8c445d315bdb84b68df2d120a29fb3d",
      "after": "c8b6162dc2a88c9e83f4e5380b3a519998d1511c43b6e1b325e75ac6ec6de4a9"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/types.rs",
      "before": "f4127de1fe334f43a0808f618b9ecd32ff470877bbcf5e0a7fe878dfb7ca5cde",
      "after": "51f9978b37ede08f6d46cde96edcabf77ca0c2298a9d3e7c71d4785dafc82490"
    },
    {
      "path": "crates/op-ai-skills/src/style_guide/user_registry_tests.rs",
      "before": "6195c0fffbdf041d921abbb64b81c5bd26e3625b46e6048d9cab3873147d242b",
      "after": "7d9a276496b0c386b8d1840b9b6d5e4fb13af89e05601b8c8a0a0851ce398af4"
    },
    {
      "path": "crates/op-ai-skills/style_catalog/atlas-grid.md",
      "before": "2017646e403342d4f2f47a4749e71f880c7d05d9f51b43047b5bf3f7464ea81c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/style_catalog/beacon-landing.md",
      "before": "8322a12d2dc86f890999563a15420b76982e608ff6803b407320eda66657dd8c",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/style_catalog/chronicle-page.md",
      "before": "ae65c314608c59b24dca51a10ad4c4d4e95d317508707a316efe6069fd76af18",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/style_catalog/console-board.md",
      "before": "9b1e6e59c8ac80dd5dd3404e5fe6cc9308871617d5c1b07160ebf0cad95f7b40",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/style_catalog/form-studio.md",
      "before": "18d1731cc5ee8f770bb7f5e4c9d0f335692d8066b790e99ce787382a064ed252",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/style_catalog/modular-cards.md",
      "before": "d76e5afd9e90c349999696eed8efda0bee01e4497f69314689ae7b69c230823e",
      "after": null
    },
    {
      "path": "crates/op-ai-skills/style_catalog/pocket-task.md",
      "before": "2ccd4402eca848e7ad32464ba0901bfa2e7f1b2e344439b085cb5cf7dc126712",
      "after": null
    },
    {
      "path": "crates/op-chat-agent/src/tool_schemas.rs",
      "before": "5cd9acc493a243de8e951fabdbe1e4505ceca060eba206729f341a34a39686d4",
      "after": "40e05fcb31fbc8f0e403a97e94891cfae198c6122b468af15660cd149a140b29"
    },
    {
      "path": "crates/op-cli/src/cli_export_tests.rs",
      "before": "22c8203337ac92e64a262395a29193ea30011b1756224abfedd22d0dd9d5b812",
      "after": "0ec615a5f0a6eee1926d998817875821ed262ff58fc47fdddd067c4804ab3afb"
    },
    {
      "path": "crates/op-cli/src/main.rs",
      "before": "53dca781ece3f78ce5c2d1cef9c428c7ba08be803ae82be862c0a245e3788429",
      "after": "0e62bb62ab09089c0178c8840dcd15c046e1678171a390c0ca26e79cbb3e27d0"
    },
    {
      "path": "crates/op-cli/src/style_cli.rs",
      "before": null,
      "after": "c52b5f68a9bd1d148e287e17ee0c84e1c181551d913ad95614a492d265bb7c5e"
    },
    {
      "path": "crates/op-cli/src/template_cli.rs",
      "before": "91e4673e17163e356f17357ceb511fe80961240ed2860783cb5cc33f78f9e227",
      "after": null
    },
    {
      "path": "crates/op-cli/src/usage.txt",
      "before": "13e79874782384c25fa9caa92d4b56a6c25002f01cb6ce2d14c875973d2372a9",
      "after": "97103317a551ae5a5b38fd3bf39d678ec8b2b6afb471d14da9dbb2786ab78062"
    },
    {
      "path": "crates/op-codegen/src/tests.rs",
      "before": "21beff8f05d80610eecf4f7cfbe6775f827bf96909a74b01d68bb8c54155b4c6",
      "after": "8b19f2daa57bf146e8cbb88864f46afc6a1f48c7a9724e8ccfc2c6992714925a"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_catalog.rs",
      "before": "babde6f36a712522d39e3a6af95e4a2bd547faf114ed6dabd2b191dd66fdd4dc",
      "after": "e01eea953fff0a28dc4517b185bb55e70449dd8c9eae8dcaa844824ca166e638"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_semantics.rs",
      "before": "1b91e8c8205116614e9c948e83f27256b42341e28e1fe6f8ba4221debd94341f",
      "after": "6294aa071f9b45bd999e812f0a7c8ab996bf255ac34c6020f7fd13dddf8fcf60"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_tests.rs",
      "before": "a170d6408b7843b8135f21acf87e74b4c6ec03f2e1c9a22861277eb41670fa88",
      "after": "9f49344446baa23813fb249a4df687a2fe89086e7e2a99aad79aaca73dac1df4"
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates.toml",
      "before": "c843f9261d383ab6cbc8bca390911bc2463844f2cdf2ac68223c74bd386c4c69",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/ai-support-pitch-deck.op",
      "before": "58669610e59b74a7b9087ea78f921003527d7a757224dcc14808ef829a60e0f8",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/analytics-metric-card.op",
      "before": "b6a63f8700bdbed5f76642c719f968e5200095e345d61d6270e76d2106ecb60c",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/annual-report-card.op",
      "before": "d08cff54751ab219f939b525e0dc8db28f92d7fef72f4d297e3a54566c025bf6",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/app-onboarding-triptych.op",
      "before": "58f962a4370ffb0b99c02191203287785d479a14ed271e4d2ecf412618b3bed5",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/banxin-rule-deck.op",
      "before": "ae40d7831e8b32e0fd6c084c8e704e4658d1864ca91cb4572825d8c83ef0cafd",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/before-after.op",
      "before": "9fb883b8004e1b16cdfbfdbd4ff0237469a88f267da9f1c9cae595c7d8457434",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/book-club-invite-card.op",
      "before": "f445746bb4d4dd0bafaf33b2ead6b4d050d560f20ff389d15acefca013d7a27a",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/bookreview-silk-carousel.op",
      "before": "0f30c001f129ec51fafb37853f9a7dc67fb061ab5b6bdd4bf0faae2150e87a4b",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/brand-concept-sheet.op",
      "before": "303a9acde63bc977edfce0a2cb38268cdbd6839b86fe82b82703e23de37f56bc",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/challenge-tracker-infographic.op",
      "before": "acf1f160077ffdb46d9e6d74d2a2b71a151bd9bd0401080e7f805e6ca2b26125",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/cityguide-film-carousel.op",
      "before": "4739ad79e6763af4ed66d0b049cc1a63866f96ffe33c9972824b5a152e4c26e4",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/compound-effect-card.op",
      "before": "558fd03af6025995a001d8d2e75ecbfae5d3b42d3458fe73b6c6b04d912d327c",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/concept-contrast-infographic.op",
      "before": "09c90def438f682af5c5b79b93ae5f29749187da28c931b90c8f9e9229eb7983",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/conference-agenda-card.op",
      "before": "48dcb5dc87a7af938d5f7fd706cacb99aa7f6364de3553418a3d7d134d03fb19",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/course-enroll-card.op",
      "before": "1fef8154e12a3ef2afa82dcba03b117360912e795d4b475fb26428760000b415",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/daily-sign-card.op",
      "before": "1205491d11f7a030613fdca93e20793299b460d265e66a838069cb952f3f5194",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/data-report-infographic.op",
      "before": "c76570a02581b399fbcf912fa8e08736a99369960b01e499ee0216da78dc18bd",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/data-story-infographic.op",
      "before": "2738f5aeabf858d34df5f69724b2d2b3eacdb9bb741e2d9d8b5b737180ce5c16",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/datareport-grid-carousel.op",
      "before": "ce213e514893722e0a584813fb5b1713ef70ed051ee30cbcff6a51e5e18bc903",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/diy-blueprint-guide.op",
      "before": "830bda459c00f9b94b7118c7881453fbdf208b222581392ba8d4af32320c520b",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/do-dont-comparison.op",
      "before": "49cc44058d4ea986bbc8b2a8e1dd18aa9f0703656694d0e5e673d27ef25106ed",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/dossier-linen-deck.op",
      "before": "d4d445dfc3e706915d445e789e682850a351fd9507fc0ad14ab1b23e51b53f14",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/ecosystem-map-infographic.op",
      "before": "83d94bd868328376348b3209279a57631df2c1d7e474d6d0577a6596f77502cd",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/event-invitation-card.op",
      "before": "06ed0685f778aff03f6bc1eb79b514837f419e11af7141d52ca907bd628dbb67",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/event-poster-deck.op",
      "before": "266698ff81dfd770fd6d3841554a32bcb562171d3b0e96a430a0437e38691f53",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/faq-thread-infographic.op",
      "before": "c0b9566a1003097b6505f112ed0ad199b07b9fc9accf312b9db80ced722a3b83",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/gradient-tech.op",
      "before": "4c8f0f5c989abb65badb79de8b4c8d75e5d4601276d04b349b535b9fef9b161e",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/gridpaper-graphite-deck.op",
      "before": "53fa86d19ea7733f85f44ef400f09242430479a03dfdf84814a1696444a17c7c",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/hiring-poster-card.op",
      "before": "833b6e98b0b6a485973a9ec578905d82e09857d661c6282c2e234647eb749b9a",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/journal-checklist-card.op",
      "before": "4ff7016d1d8fbb0a38c6c1ce1439807c5bb93d9cb5847ab972c8ff06b4123187",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/knowledge-card-square.op",
      "before": "d2b15eff53e52e92a971f52e2631afdc8f79e1f19213dd8e446ecd69a7a4db65",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/knowledge-card-vertical.op",
      "before": "62d90cc4b784f5d7b140b24d6ac2f068a7c7f5e0a72bc09c8cce6dbd9501907e",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/knowledge-carousel.op",
      "before": "1dffdec50d739e1441d6d32919c2281d2370aeeace57656445f4ce0c5bff465a",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/lecture-deck-light.op",
      "before": "796d15b809253d0e070e959a0aaf23505132040870b2f6b82a19bbb4fe91177f",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/ledger-tick-deck.op",
      "before": "46acb1de2507b448c528b9696c1e91d3a558910dbf318754f44c27b9fef19528",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/livestream-teaser-card.op",
      "before": "c564863f577a294450121dc9bc11a94e40be203d690b21c26a29312fb5bd210f",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/logo-qa-board.op",
      "before": "f7a255a68ad33930f2623abb1808c881fa81010ebe53fb5e28f9887c08b03755",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/metric-single-card.op",
      "before": "42a4e582fe6a30358a7534b7f02716045d5d405d0d69e046bcf3992e312d0cdd",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/milestone-timeline-infographic.op",
      "before": "3d85b670523dd099b46a95c4f523151ed0a4008d87ad9b8613d6b82ca14df5ab",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/minimal-keynote.op",
      "before": "3c08af19e56b319bf63da6cc94c0e8661b7b76da811eb0a33aeca64f6edd4b18",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/music-fest-poster-card.op",
      "before": "749261e089e160374c8e549b872c4ae319495035d16c8f0657c0108a0f5b8e67",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/myth-truth-comparison.op",
      "before": "439c503295892f532482cc508938df9ffa4e7b82db859314729e0f3bdb050d96",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/notice-board-card.op",
      "before": "1ff597d7ceaddc4e05fa2dde6b4ea6c4279dee89a4b6af9a785a0b919706558e",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/opinion-longform-carousel.op",
      "before": "fb4fb41186cb23e0fcd873318de978744e2324878322f1ef7ef075a202cb167e",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/photo-composition-tutorial.op",
      "before": "aee901b5f0e615d8bba5dac8329b546325a55e45a625bca0707dcaab0178f86c",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/pitch-deck-dark.op",
      "before": "59cb1861f3d8a4a57a7d7ac1882f98b92a04a57b6d525277061540f1290d0fdd",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/pitfall-list-infographic.op",
      "before": "f3c349b5ec34682753f60ad5a16ad029921d8d2f8d9c87fcd3255766c2fb2140",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/price-tier-card.op",
      "before": "d02b4342c58ec6f638b4216faae340b98084eb30e6a54066994c938aa5fe1410",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/pricing-tiers-comparison.op",
      "before": "745cb7f68b330b9162c0355e98c51d5429a84e192cef2dc901db1951275772ab",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/product-landing-light.op",
      "before": "ca8e768b3958aa4f21a570c14c0f10122f12affb7d265fbabfddd87938b67de2",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/product-launch-card.op",
      "before": "ea651641811de91b3b12c4426f1c4472d06a8cae3fd460a4cf6fc8636aeef3bb",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/punch-quote-card.op",
      "before": "998db513680a98aa53d4fedd2c93d372a066fa02383b2f0ec8ff47c5372f1ff5",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/qa-chalkboard-carousel.op",
      "before": "adc3a5e32f4e8285b2ad5939d10a355f77f35993d1ceab59f6d744e62c0c864c",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/quarterly-review-deck.op",
      "before": "d36e496823f982f4499cd7052e89d045d94d6fce5c61960317f1f1110df961db",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/quicksort-lecture-deck.op",
      "before": "b678d046a82542aafb4405c0f51faeb503f27ec55a6130c09a2f2f13cc6a3985",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/quote-frame-card.op",
      "before": "53d0f8d94547d9fd1b9a58d6603fd0cbb01afadfc35a3850c229f45222e3e0fd",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/ranking-board-infographic.op",
      "before": "13a4d46aa91092153cb0c84c7450807ff8afee8280a622c2eb976d794622d5df",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/recipe-four-step.op",
      "before": "f79a5cea407b588901bc137f1b44e262dd4e2fedb405cf9b4da0b388b1720cc2",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/saas-landing-orange.op",
      "before": "b9f58d74355de12c137bbd8c5bdd6f55168b320703493100dddaf4e1853ca730",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/scenario-guide-comparison.op",
      "before": "df24c0940b41c5aca007c60dc27c6fce5982d60194b67d968790ea467450bc7d",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/screenshot-tutorial.op",
      "before": "c6f0fb1920b64a1a4a8ccf70ec5fb586dbbe44fb1e3cbbd4212386c08ce891a6",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/skincare-routine-cards.op",
      "before": "ec4eb0416703ec9cb35246cec76a774cd02b808911c71a331018cb9581e89065",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/slide-deck.op",
      "before": "04a312cc1fae4499a47a63d548bd2a24da54db8f2ec04e10d3bf666359a26c0b",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/software-step-tutorial.op",
      "before": "67eb201c03d252dd8f8010cc4328252b33daa9435145942e9b0a3c75f7c63714",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/sounding-navy-deck.op",
      "before": "24c02351048a2e319cedfaca4a01d9fe0d3c0a5386116ea49057022a0aaca610",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/spec-table-comparison.op",
      "before": "7cfda088d0f138f41889194ec03a47fe9e58c0d0f6b78cef9fa791767dba4ad8",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/spine-culture-card.op",
      "before": "107f9e21f397f0fc98b60112f43126ed6d3ba58905aa781f4e366be0a292a0c9",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/steps-flow-infographic.op",
      "before": "ddf598c18f8564aada62588e4b5e493baf704708915f40f7f5c49f2a79803976",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/storage-makeover-steps.op",
      "before": "bd141b1f2dd6ebb1b6a68ccead93e6862c516d7d51acfa395a9b1d648c87dbc7",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/story-night-carousel.op",
      "before": "8c012d27d40ac3566320f90508558b7953e556cb14242c77aa3cb0bef13abf93",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/three-way-comparison.op",
      "before": "5cd76c156fd5c1dc0cce47850a608d04db05f7cf4faa4a96c967dc56edf8aba2",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/tidemark-slate-deck.op",
      "before": "1df6bcea501c87c4a729bbb25018aa4bb6b387b89e056829c2a093f1c80089ab",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/time-shift-comparison.op",
      "before": "426ed6bea8045fd8b4d0de60e919b51f57e5bec36d1a72f03b9f9d1b308293b7",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/toolkit-notebook-carousel.op",
      "before": "3a61cc69f4de4b2460f6e6adc3a777f9a5bc4a5be1544fb0aff62568ce4b4416",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/tradeoff-scale-comparison.op",
      "before": "773fbea995519698723fa22091c707861e67210f0acfc7ae93d1067c40e7d18e",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/tutorial-journal-carousel.op",
      "before": "438fbe0768d9d78d5e78653613bfae42b91603db0a4e0d45216a8cd1576eb82b",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/version-diff-comparison.op",
      "before": "6aa58e51c6262ceba46efc3102e74c67fb028838273fe8b7303901d1c5317e1d",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/weekly-report-lesson.op",
      "before": "6608c700a7a94dc89219716d580052f850d91f233bcc202eb844f4fcf51bda2a",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/workout-breakdown-guide.op",
      "before": "66362699b0de02d8e9df4b4dd19554fbdec4955e5dd2b596e784b38f641d27d1",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates/yearreview-mineral-carousel.op",
      "before": "99c7890554788a1885accb0cfee7c8f33bc4fefb9edbc6f0a5e5ac42ebe05215",
      "after": null
    },
    {
      "path": "crates/op-editor-core/assets/scene_templates_prefix.toml",
      "before": "f4ceecd0c12a081cc51d3790df177ae3da6e4ecccf9b58a9db76d02eb5b78a43",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/asset_center_keyboard.rs",
      "before": null,
      "after": "9d90ad77188f225bc1763d85ae674d1d62863a8eb0e471b0531ef28502016720"
    },
    {
      "path": "crates/op-editor-core/src/button_press_state.rs",
      "before": "f0bc0643ecf8e327298a16b83755d9af5df19b31d9ab3b245aab09340a69db56",
      "after": "b9556086a766bc2992235d806dd32de17be37143bdc4ee3b5966c0cc73adbc5d"
    },
    {
      "path": "crates/op-editor-core/src/catalog_toml.rs",
      "before": "de1b20a6493c3ce8b8c92a20e357ea2ce64afefcaa8a78413ddbfd7874ff9225",
      "after": "f8d1b2ebf010b2ecdd0ccfa6ad9a0547fe79eabed9a66ccd90e84f174c339c36"
    },
    {
      "path": "crates/op-editor-core/src/collab_gate.rs",
      "before": "1569a7c14ab987170646cff7aca73dd627b146ac8b13aa1d03d4e850ab3c279b",
      "after": "faa86fef93f7a9e124227253d4c7a15bc2dcbca2b47a7c74b6860df902ffb716"
    },
    {
      "path": "crates/op-editor-core/src/command.rs",
      "before": "fb7bda0df5bd1ec3df9d8048f5560b223dab9aa13829638ed73ebcc476f83bef",
      "after": "b186636af751163c982d153602cd1ef79ddad7f6eee23e8cf52fb59feeb1a4a4"
    },
    {
      "path": "crates/op-editor-core/src/command_apply.rs",
      "before": "27d24eeb7cff30d317a1e51d239f222a273cd80b6ceae0838042cb556cde4456",
      "after": "5d8825af9d11a3b97a10ff655d45beea3ef5f850a8aa735de48903ff7ebdf19b"
    },
    {
      "path": "crates/op-editor-core/src/command_batch.rs",
      "before": "4ffb318ab12275f7e05ae1ebf419a3e79bddc0ef079e50919f4eab2f52ace37e",
      "after": "e60b96907a663e2c0f70b7455404f817a6aca622f59eff4d2ec5d8dd0c53be2f"
    },
    {
      "path": "crates/op-editor-core/src/design_scene.rs",
      "before": null,
      "after": "46717244bb197206e2fb91ab2401ff866e5c23f5918ee4a41a5cc80cce5f316a"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state.rs",
      "before": "35430934c0b8c8de025dc94e27dee846ddb2e47f5ca201e0e1a2343252bd54e7",
      "after": "fc868dee5d493445060f4701fb0731401a4eff1443f3375eeb7ee80eeaa8d3f5"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/defaults.rs",
      "before": "17880f998b6c27aeba6190601101c44f7216099b10a452200c00c5f62dcf1b56",
      "after": "2a8e8bd259f7a4909ca247481ad886f5af12af78770f29cb1e522a7aa5fe5892"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/exports.rs",
      "before": "4eb21154098621975ba7439a3f161cceed3d9bf2cc689c71ef7d5140fc00b732",
      "after": "c9fe8bff92e8a020403e87f79c6bc7485ba43f20bf91169bad4f9e5e41f0cb37"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/groups.rs",
      "before": "652702ba171ee0e9f5d7efb14469955fc62e749a36f95583525593edaac21fbc",
      "after": "8f687aee4d501a1927340aa0d87500a6a5f0b3251f53039ebc0df89cce81d5fa"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/methods.rs",
      "before": "32cf70fecda69aa8c4e69d98628408340c98791d64e18c31b55bfa18b6a3d1be",
      "after": "7252577d33fe321db22bbedab8aa0991aa2521445e6ff9aee53cc366e531514b"
    },
    {
      "path": "crates/op-editor-core/src/host_escape_transitions.rs",
      "before": "1f4f62e716c3583d78fb9dadacf4cefd9fb67d098dbf44593d8f760490b047e7",
      "after": "3c07d50f713c156507f24131e77f3c03194808a7cec0c337aa8b3a51a987ec9e"
    },
    {
      "path": "crates/op-editor-core/src/host_keyboard_transitions.rs",
      "before": "1a34910678c10660b281ea2933fee990d0bc133856046b70a188e5da817c4953",
      "after": "68dc518d984ff8731311054a0d632f33ab07a5615853610f7d83f31dbf258273"
    },
    {
      "path": "crates/op-editor-core/src/host_ui_transitions.rs",
      "before": "101833dcdd4be37bb7a166f07ef4336ee1156fbec6555de6a9f5ea2de7794b96",
      "after": "090bfa62dffb74a247da40a7f58bdc86ac8d12649da84e221106ef2cee654f83"
    },
    {
      "path": "crates/op-editor-core/src/lib.rs",
      "before": "c8003f382505ba37b358dfce7c1965dd373fb56acc57f05b93c19ecdd764cfc7",
      "after": "04259d83e174b81988c4189593a7fb891f3fdc03076c0367d66a3cbe9b71cc0b"
    },
    {
      "path": "crates/op-editor-core/src/managed_assets.rs",
      "before": "6d69043e6aa87c19fc5935de2fb8f7a8fc39e5f7faeea80d354a9084c3b9ee8e",
      "after": "d8c7ff4e43ce770da54aa8d07f61b48c84039ed49de69f8055c5268740c5e5bd"
    },
    {
      "path": "crates/op-editor-core/src/preview_slideshow.rs",
      "before": "02524f18e145d9faddc5e84df2f72b80289a6db6cc749c3710d303d6530fb9fa",
      "after": "f7cd2ee57a0b657010fc59dc4f640b252280e82df1b38fb873e5557c5f97eff9"
    },
    {
      "path": "crates/op-editor-core/src/save_name_keyboard.rs",
      "before": "7b79bb6a4799d5bbab5ce4557757b5d419cb2b5def9a0ee4562379214008efa7",
      "after": "42ab7348ab660cdde1197c9093247c8d14d411fd0c6ae22bb704f4784e90f8fd"
    },
    {
      "path": "crates/op-editor-core/src/scene_template_append.rs",
      "before": "4a7eb51a15c1942f30e07b3b2ada2386b7bebe101b1adf6deaa5b06ddf3699d6",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_append_tests.rs",
      "before": "f043ed85e8eaa6b4e9f84653c7ab0b6ce3b15e11f0412e1e7689be9705296f00",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_catalog.rs",
      "before": "60d86117dcefc8dba184738bb39f808301d2f5582a2b3440fc0c19ac89b3ca75",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_catalog_tests.rs",
      "before": "496033f8921e830cbdc529329782cfead8e2917073e0f3c5c4ba6262c6dd064b",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_keyboard.rs",
      "before": "ce12ec9ecd6cad4a59f53fb7a6b394349116be095efd83e155dddb23755c207a",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_palette.rs",
      "before": "fb01826d8b80ab176f1aea70cd61991b18dc5cfdeec3186b8e1cb9b12b0303bb",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_palette_tests.rs",
      "before": "8c70b051745278b62acb9ce7ed6bdbef86911afe8b485500e3edffc717f12483",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/scene_template_prompt.rs",
      "before": "9d7e95f32c5a721f35a6407ec91cf541b6fa0d7a9c2ba9cc74c2cc15c4c03826",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/user_scene_templates.rs",
      "before": "6543b97a77e0f32629eed1b1fc5d32c11dee2756757509ed5ed059805c3c5a1b",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/user_scene_templates_tests.rs",
      "before": "c5be4c0df5a9490dddaa881d8750816ea266505bae96dde806e0c80ad756f7ab",
      "after": null
    },
    {
      "path": "crates/op-editor-core/src/web_sync.rs",
      "before": "6722bcceb68ee8ac725629422e3cb89a0379fc49fa057f45028cd853be5eac0e",
      "after": "ffa2dfc1cc0254d3fc1f86449caa8dcc1335f21b7dfcd3bb377cac14cfc17b42"
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/ai-support-pitch-deck.jpg",
      "before": "b011b53827070c8d160d6dc3eee7f553610560d6dd436d119d0ff1fc209a0818",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/analytics-metric-card.jpg",
      "before": "9f115867c9eb5178576936141d6c0b7a2106e6501adf43aa8708f76c0d173729",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/annual-report-card.jpg",
      "before": "46071187e9626c2939ebf5cf32e247d8a8ab34296b844c11d444d78dc22d1cd2",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/app-onboarding-triptych.jpg",
      "before": "345e8484f2273e9b8ce0203bf0dee3a463fb06d2df234afb5fab2cf390648752",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/banxin-rule-deck.jpg",
      "before": "616c85fb6e87a6186576c18393905086223f876e40e8edce6f5289f2a5766aec",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/before-after.jpg",
      "before": "26390d92addc76132243943595b90cf21467dcc93bc842af5c8e48aca7ee2cac",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/book-club-invite-card.jpg",
      "before": "36403eefb0fad54cb4922a8987d3daaf25122f0753e92241fc382f43f3afc911",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/bookreview-silk-carousel.jpg",
      "before": "3c781d2c692c55154f09df1941807904b91f7907afea0c4b894229873d86b30f",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/brand-concept-sheet.jpg",
      "before": "73431e7cf60ed32a9fb53d5365db4c671e5f06f5ca27388c8b05bbcab56e1234",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/challenge-tracker-infographic.jpg",
      "before": "2e62e97cae9f789023fab975ddeea9e3e931d3e8dee2db138f9e0b8df0ad3c21",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/cityguide-film-carousel.jpg",
      "before": "bed98d0c9d99a3d25a7ae68750bc73fa307371ac476239128a44866fa8cfdded",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/compound-effect-card.jpg",
      "before": "11d021e35169ad2bc54ee283e6b19b47998462a0a65e8363bb2991efb3df214e",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/concept-contrast-infographic.jpg",
      "before": "4992d6545f0a9286ddd6ce23e8400991b21c41cdcb66f6f6e0f6b103f593b26d",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/conference-agenda-card.jpg",
      "before": "8189bf34767de4d2a7ece1922e706a34834fd8613d0fef7d09d5838f7bd4a3f3",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/course-enroll-card.jpg",
      "before": "e412204f6a85011d7eff9f03487cbcbc165510ccada021a55791c3538d6a0ac3",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/daily-sign-card.jpg",
      "before": "293b91c091e81bd6649814e2c87e7271210075a1844f068effcb741381101b45",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/data-report-infographic.jpg",
      "before": "643cb7fd42b0a2c459a3c530a75dc7e7f12c2a58a91a2d0d0ea539e9f4058d71",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/data-story-infographic.jpg",
      "before": "a1ed9bf40a8bc24d7264ffaf238f32cce15b68a4c338c913d809500cf90b20d5",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/datareport-grid-carousel.jpg",
      "before": "ee90ff1f5cfaf9b25614bb27fd99e7a762042206040ac075fd49f7363cee5c71",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/diy-blueprint-guide.jpg",
      "before": "dee1713105d43a4301bb887911434b483c60b1015dc72b61b06a9091a4309d23",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/do-dont-comparison.jpg",
      "before": "a0d731ae5856146015a2ff35f8776b0cd0b62e52a88c70e8a1e0a2545bdb4971",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/dossier-linen-deck.jpg",
      "before": "3b31ff347c1f42a30899114541423781d0bf575d69055f10a34a3d5bf7598fd9",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/ecosystem-map-infographic.jpg",
      "before": "b46d1d485e3e881e376ea157daf5a15c9e9066fb50dcbe043aa5f43e63bc5fda",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/event-invitation-card.jpg",
      "before": "ef94929efbb83e87257917594b82c92266aa50b61c1e2ece191ad7465d5ae8a6",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/event-poster-deck.jpg",
      "before": "e8de9af20d8b14b462389b0fbc660a479a0364ddb7f6cde854affd166547a1c8",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/faq-thread-infographic.jpg",
      "before": "47022f509bdbc9fdbdee4e646d5bcf998fefa1c91d97d0c89f1bd36f26650476",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/gradient-tech.jpg",
      "before": "8aedcd1d98f149a97e08b7880037a945735ec388ee53354d58f3058cac798d9d",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/gridpaper-graphite-deck.jpg",
      "before": "b18de8312dc90fb018cf99e02b1262b552a1c1d20d311d650f469043a93776b1",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/hiring-poster-card.jpg",
      "before": "61da3f444db48f77dfb15187ad58268cb5ccc1727ae34b0509557d35f5cdcec3",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/journal-checklist-card.jpg",
      "before": "4583023cdb4d59045727636dcc5bf138c45591fdb9cc76eb0ac70dd759ef8ee4",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/knowledge-card-square.jpg",
      "before": "8a3bf717dcca9c75c19b9b609158fb8ee6fde76542309f4b66797b2ff898c35e",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/knowledge-card-vertical.jpg",
      "before": "7b89d08a6daab64ac888bf392c5de0ac8e05f7ae39c3515539d25526948b4f6e",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/knowledge-carousel.jpg",
      "before": "1d260f046640438810ba9072211fee7d3da7f230d8f969a78616dd4f410dbdff",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/lecture-deck-light.jpg",
      "before": "4c2ada5a508a44e35cdf5ab9c22c5cc19a668fc3f58bbfc24bc3a5682709c57c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/ledger-tick-deck.jpg",
      "before": "678b32ac4b3e71b6168e0593ca2ceb03b6b5104c4a471e2ea9e05c7b4d9cd1d9",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/livestream-teaser-card.jpg",
      "before": "adafb949b2542590be39197364d59d532fa43b5c960c634715ecc4cb2351fd1f",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/logo-qa-board.jpg",
      "before": "4b6b4f9526920191ad37187231ffd7385704e9d6154346f6fdb926bc0eb2f33d",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/metric-single-card.jpg",
      "before": "1f18c064a58dae4fb58f99e953b224fe98ceeab4f9761a849b2e7b26b027cecf",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/milestone-timeline-infographic.jpg",
      "before": "a47660f75cbdac28aa67730373890407e3be84c9d0111ed62f639031a33fb4c2",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/minimal-keynote.jpg",
      "before": "837ae112c67fdf8945c738aa5ae0fa0dba07b4f5ad21be12b6f6c95eb826780c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/music-fest-poster-card.jpg",
      "before": "809b29094f7787d1877072d092578885424c7ddaf6519589e03bc219bcf3c883",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/myth-truth-comparison.jpg",
      "before": "1cbd3aca4612041976cc546422f358f6210ed1d44632bdbbb9d8e88588f269e6",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/notice-board-card.jpg",
      "before": "944fc43f5b0288fdb06111d916c3f867853f4f92fc004f214efa6e72e96eb78f",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/opinion-longform-carousel.jpg",
      "before": "188ecc6a261931eb3e8248572a8fbc944f5a8f9c7f625ec651169d80df260632",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/photo-composition-tutorial.jpg",
      "before": "8a0bccf640ab6f602fe57e703e1ae07d7a1c1971e38840d56864fe3a8a71cb6c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/pitch-deck-dark.jpg",
      "before": "e2d310b61bf08f1631694d189c4588d4c799359ce0935e45df2e453de82cc6b5",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/pitfall-list-infographic.jpg",
      "before": "a575b590106508d1281f12358c053d8e61784644b541a84b1ea1353ff1228f71",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/price-tier-card.jpg",
      "before": "a44ab8df72a5dbd01d3c3a90e3b3b2fb7e28620ee4f8cc216d5615154aff0113",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/pricing-tiers-comparison.jpg",
      "before": "ef231c99265babd4d12fc3ee630dd976bb8d6646b7ae78e9d1c7fd79bb66fc6a",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/product-landing-light.jpg",
      "before": "33447676bc4ae15ba7c11ea17e1b73edd9e640a2a0df6a062d64584d77ebac4a",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/product-launch-card.jpg",
      "before": "df2feee77384e8b953600cf3bd06179d0eaa45a02157e58385f1080b14e87fae",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/punch-quote-card.jpg",
      "before": "a3cc9bb108af9b06567957f96eb182b75f60feb43842268d70b31e9d5a71168c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/qa-chalkboard-carousel.jpg",
      "before": "7e222ab9c5e3993f27f0ed1933518f303f930d271ad23cdab16536c9d061bf8f",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/quarterly-review-deck.jpg",
      "before": "23fe497415a23987e0cc6f89e24d26432f41775e8b20a2454b24a9d619f38353",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/quicksort-lecture-deck.jpg",
      "before": "4a5193b2b3cbe0cb51d96d908bdf0f79165a7d2cb6209fd9a31041e4483f6ab4",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/quote-frame-card.jpg",
      "before": "3499d8a76a8db696035a333a9e7598d2f4231f47df90856611dd82191a87ec7c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/ranking-board-infographic.jpg",
      "before": "c6eab3f6af535fd5854fd6a92daa6edc58520b9511d6b03b26720b40ac50c3f3",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/recipe-four-step.jpg",
      "before": "0aa1044a37d58d051c1f5815cda4aecee60875b12e1d28d12c00d8685613aad5",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/saas-landing-orange.jpg",
      "before": "fc6b610c7d2e817e6b4e4f8acae3f9aa0d8108b95b758dc5bd5f75388f6ee199",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/scenario-guide-comparison.jpg",
      "before": "d475e5a1de360020f63d1167a87e8f354010fa1a2dc16fc990d27c727f8fa712",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/screenshot-tutorial.jpg",
      "before": "b9c034b1608cd29571551bb2899ffdbfca21ab127fd4352fc385af3101ea54da",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/skincare-routine-cards.jpg",
      "before": "360024a6b88dc8bebc0723abec5c65a88fe9a603abb60283874483d5804247a9",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/slide-deck.jpg",
      "before": "932ce012fd16393e431da80cd12f578f63e74e52b65a2b43fe621aeb999669df",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/software-step-tutorial.jpg",
      "before": "9e2a7dde8da1c7a93d28d34dea8939b486b74d36148419b43e9049fa6db9b588",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/sounding-navy-deck.jpg",
      "before": "e30aad8e01bda2fa05eb7dd137c6af6543539e80b885fa0f62635789a2f24730",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/spec-table-comparison.jpg",
      "before": "6d479ce22715a6b2f9f956d171f048c1d8f2ca307b5f9672b2daa3f0a1708c36",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/spine-culture-card.jpg",
      "before": "1834e5bb8222b5b79e4a38a1a68b0ac5529477d86ce0a1c73cbbb0ff687b502c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/steps-flow-infographic.jpg",
      "before": "4184f7ec609c7beac8271dcd164c0e7406a54d9447435a1e95100b1a088dae61",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/storage-makeover-steps.jpg",
      "before": "2d040229e9509c874e04e22af028d2bab911cc9357437f13beea5f40d397ff54",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/story-night-carousel.jpg",
      "before": "6c2f14a790e2982fd354d2a169202f58c5ee5915d0537f9ab262f2a92b2130f0",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/three-way-comparison.jpg",
      "before": "829fc2dfd2bf52d5a263fba0a8b84e111d49b54f6b62cd48229d992963f89875",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/tidemark-slate-deck.jpg",
      "before": "2faca8d40db4750f8ef257c79128240b188ebe312b132083530337d189a35d95",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/time-shift-comparison.jpg",
      "before": "657c25151f254909dfcbbc4ae34ddf4c6b377465b3c33ddfb13fdf1f2cc5d20a",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/toolkit-notebook-carousel.jpg",
      "before": "a856cb83c73b7e0f9ce224b9555213e2a575de4d8cbf9591f3b957c90d228138",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/tradeoff-scale-comparison.jpg",
      "before": "60b49ecf41d4c349bd721c780dc18c35321ad8e91cb4fb641c52a7bcdc071c40",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/tutorial-journal-carousel.jpg",
      "before": "5c152295f794367863c5723235dbcf15c2a826257f4b525223f06d6ee293a028",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/version-diff-comparison.jpg",
      "before": "727a4c8a227597145e3c0c419c10941f2389b8619e7f80b62afaa50cad0df4e7",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/weekly-report-lesson.jpg",
      "before": "aafcf08a477df945404bc0cc128ac69a046e3a7aaca841489a2faf59905ca919",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/workout-breakdown-guide.jpg",
      "before": "0ff2ecec8271188eb6834462b95c768b0d2c40d20eaf1a08c05fc6a3c5e24714",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/assets/scene_template_previews/yearreview-mineral-carousel.jpg",
      "before": "a65ffef556a1976a4cc2983ff6a9f7b1886c2924c6d539c82e191fff6b447458",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_caret.rs",
      "before": null,
      "after": "c8ebdb999a192628565f471242c5ef550c833bfcbbbc29136a5e7a0caaf29e1f"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_hit.rs",
      "before": null,
      "after": "532d24aea073a1ff7abf4e5a7750989a599be504c6de842e39926dd5bf334a46"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_import_box_tests.rs",
      "before": null,
      "after": "fb87419cba6b1abacf7c5db22e40da130fe13e2653fec2cd8b2d0f2448c13a7c"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_panel.rs",
      "before": null,
      "after": "463a19cd4598fd4062471291805c9958f461a5fd8a05ac99a513c528956b667a"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_panel_paint.rs",
      "before": null,
      "after": "94b469bcebb07ae6bd69b24ce6333a4f04c7513ab2fbfbf0724bfbca3a89f96d"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_press_flow.rs",
      "before": null,
      "after": "9ca661df4e631da9ae1547fc27720be6313ab3607cf0fe2ef6dd2ee6e9937d4a"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_cards.rs",
      "before": "c39da53e9c2ae651f91cfcbd0c2525536e2ec9edc829761f23926bb95ef526bb",
      "after": "97740036dbeff8aa3383e806e5ff6f304d8c16b8c98437a3afb59928bcb3dab6"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_cards_tests.rs",
      "before": "2e46ab1ef03bc14c5b9985624d3c272854383c89e0b73349b66440cef088e734",
      "after": "e77de8b5f74ce80bfec29ecdff89986d1d50e83a542edc44f0226677d0f05f40"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_geometry.rs",
      "before": null,
      "after": "def020db60e0fb005d0f3624e8179821ae69dd4fafdd912f89a0fdece32518b1"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_import.rs",
      "before": null,
      "after": "0363a16719baa315a940983e7a2309b28d711872f4cea50cec5839e19cafca0c"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_import_tests.rs",
      "before": "9da798ecfe552b90b5f9582ec371624960bd0ab9d77f208e986c9d3c728c5041",
      "after": "7ca271da52dc4015e80a622a6da4e2323cf669ada8d78de9fe1c4e356a327d5a"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_layout.rs",
      "before": "35b9840f128c00f090b640a3e1fc2276dea685ef0d4031a3a647bee69ac17870",
      "after": "c790e9c3a2e7023c1df65e7299e33a6b45cc751b2544c670fe12fa6baf77398a"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_paint.rs",
      "before": null,
      "after": "ee67027a7708adb2ca0c77e0b5894380379755341eb77f410c6bd93982eb98dc"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_tab_tests.rs",
      "before": "d157d046c902f614098570113adf357c08ea67e75246714c7e7f5ef9aa0cbfa1",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_template_cards.rs",
      "before": "2a1180e60de193d11684c345ada6dca4aa2b0691e8255dcceb84bfad49e29613",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_template_cards_tests.rs",
      "before": "6dccf558aebd9bf7211e53ca204aa1045d1110050a46667ccdbbe4cf44a722e9",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_touch_density.rs",
      "before": null,
      "after": "03418c77f88cc13e0fc0023858238e556f1a7f1f5004d7218d0ecbf53f5e1860"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/deck_boards_tests.rs",
      "before": "3711da01a35dc30e7326b271f3c08cec3aa5524a3cd0ae37046e59e1bfd09b4a",
      "after": "e4773bde2749245e51afde1a9cb525366242c2ba1eaf78a96222cb3da392e361"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/export_menu_rows.rs",
      "before": "5d0b53eb443360b94b021f768c2f0a7e0bad2b0c2590cdb809df6f0d4869ac76",
      "after": "c9067df251b79528eb0f14e1672a5bee0ac1578748799d5bc43819cb7a13f9b1"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/export_quick_menu_tests.rs",
      "before": "ce7f6a8c230ea5055ba5345992488c85cfeb56b7b5f1aab25fbcc126ead700f4",
      "after": "01dd793d261578df40b54c5fea30c49429a9a93be62e180b38a9d6140388483a"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/file_menu.rs",
      "before": "d0b40f35fea18512d763fba7c60bcbeae449d352a8fe05be1e5d02ba008da2ed",
      "after": "3ea52be3e433ddd98a686dbc94aa86ffa679512a7f89e34ae8b901a8277b5254"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/file_menu_paint.rs",
      "before": "60ad80ddce64ccfd09f9bb74d06815ec26018f7edbd08c2ca99c349fa6b79cd8",
      "after": "e8dac7681da52e11f1762b5a1270a201363acf860b5c95cca5e941addc239845"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/file_menu_tests.rs",
      "before": "c8d4a701ca5635dd2a194b21e9d4886832aaf618b3fcb8dc6303f214b4ce856e",
      "after": "bc1cd0b65afad6a324206178ec4635413e28ec881914b6cf8df89ae2ef044f25"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/home_surface_paint_cards.rs",
      "before": "5980fe31909cdbb9574e031d53ef4a7d6cb08cc974ea8916f85929e259024851",
      "after": "ed90f5d2d3c9d364a51d795e96b344f841efcfa977307daae8a62e136a18d3d9"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/home_surface_paint_panels.rs",
      "before": "49b1ac3be7d2334db15a5d4acf3002ed00ba41ec967ad6361d425bc7824f4997",
      "after": "7adc102135a2249cc03010f1f3068da84b04152946c05014e6f858f849fcdfa7"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/host_overlay_geometry.rs",
      "before": "51288155a2579c7e1deb1650f20995d78233199ae5b9c8e7d5c08bf8b2e08511",
      "after": "9f6d0b1f671e4d4ae3690fd100d350e29f7124e0d67f33693ee13a1d03d1b68d"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/host_overlay_geometry_tests.rs",
      "before": "c8d3fd7267a85a3ec01a84f3e4a759e995a55d3e5db2ba38539ce3e71b479f93",
      "after": "410d75fdbe119b33c7dd395868e211c5726d0ac48334c03fa389ae9bc5baa913"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/mobile_more_panel.rs",
      "before": "c008d85ef6068cbf8011c7528ffb9889c2b2458dc180297aa5b76e55a861e3c6",
      "after": "7bf35088b0c86dbd381daf25fdcc94372e4f7dab43e49bb8a923139af3fb9d8b"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/mobile_more_panel_tests.rs",
      "before": "bfea604516f0eb867426683f7313ba6bb73822f6ae0c1042831d2ce02144ea73",
      "after": "424e29d19242d3def1286e5301885670d1b296b028182779ea71c19c0c3cb578"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/mod.rs",
      "before": "298b02ae91261553d56dd2c52a8aea75e9673e854b393bf0fade8d8b391587bb",
      "after": "41a942e1bedd4f1164096ead07667f9a6624e85bae649a3fe96638cf1a8b4697"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/press_flow.rs",
      "before": "6260b36cccddd4c59334ce309ee6c1d709d0dbf1764b63d944281a90a32d6a74",
      "after": "bde66f19fee1a8e43af0659ca5e4c861ab1e895c16d3fee21d8963e97dc18c4f"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/prompt_center_panel.rs",
      "before": "5fd8d616708dec0cd5244a18c87dd27d2e3df7af16bbd0feb48164eb7d1a7bf0",
      "after": "2988a4d4a2845c947a444d263b94e0236764778f624799e4649c3d07bd47a2a1"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/prompt_center_panel_tests.rs",
      "before": "2946b1719dd96498f070beee7ec8de38abf46a42032590b36111638194cc1499",
      "after": "191df4c9ee3b8a5106aa4eb6a6380d7a4bd0820df94ce40a485bd0b7a7dd1ab5"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_card_actions.rs",
      "before": "6c293a350c72f19e03684969c18748afa9712056d2ad82860d45108f1f78c6a3",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_card_actions_tests.rs",
      "before": "47348b26996dc053243a1d06021cfddd0e4f0f0efe2fcdbcb7d3c3a9ea0fd466",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_card_paint.rs",
      "before": "dd1594e7c2dcb95e5540c6884e3384356c830e18bab852d1ef20dbc76eac3824",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_card_paint_tests.rs",
      "before": "65e5a8e5076e767e659ddd49f066bb914f9ccd9c96fe93993961defcab6a4651",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_caret.rs",
      "before": "97dda2c740c56a9816fb7548bf8ce22b3950ca0b74107d827aede94eca923d56",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_generate_tests.rs",
      "before": "62e0fe736c6cfbaba406375a736c4be5e285da9b3ef3cfc1bc7bdc7052a6df87",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_hit.rs",
      "before": "a8f0a07189d0ae5e72484fc42b205072a0e23ec12941adb8431193edcc4c64b4",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_panel.rs",
      "before": "0830f8fde71955256f382c77deca859ab69df397632a5e0a05cf87dff728fc36",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_panel_paint.rs",
      "before": "8a2ff3fa596f645821e3a9aee3679b9d9243c890fdcefc4494b08887fce7b025",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_panel_tests.rs",
      "before": "6c01cabaf7eb8c32ace01dfef8eea14f9fc3f690d1381f28a30bafb902c2438c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_press_flow.rs",
      "before": "77f9004169ecf62a8ecb0b516c268b0ca0c7d9fd38c4886f01fe3df5e1fb0407",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_press_flow_tests.rs",
      "before": "06cc857adb8862cceb4b321b498d538024627bc7088c59b9a4dfc1e3db90da64",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_previews.rs",
      "before": "7e1100138eb3ce4a0716347697ae2cdc6ebc7fc3a85547e5efe9987e1bda0e92",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_style_geometry.rs",
      "before": "0b7fdab8d1c0ee996af0c74cb48166a614f418b04322127ebe23fca2db9f36bd",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_style_import.rs",
      "before": "8d6dd11fb23e09f8bbf5807dce45a757379625b43f18d6a7d7af797a7a69d618",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_style_import_tests.rs",
      "before": "7dc06d2c40fe94edd0081afa0d4c8a137526fe6bd43f3548abab6427bf609510",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_style_paint.rs",
      "before": "38364058b6443465db4435588eb0891a53326be354a9c3c2e1d9bcea0209d506",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_touch_density.rs",
      "before": "4cb5220d503d1aa557e98206f48206a181610c539340ec8118bc0ff33f5b1060",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_touch_tests.rs",
      "before": "64dca1c76401b43c3c645c51302efd93a86c3d8da1aaf099cd59745d9a76f94c",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_user_layout.rs",
      "before": "bf0c767f54200e974ee01fb1a8a8c104bb455c74e6a9fd19fbfad2a13a8f8000",
      "after": null
    },
    {
      "path": "crates/op-editor-ui/src/widgets/slides_panel_flow.rs",
      "before": "de02880fdc64eaf1ca5cf6e0a1e25ee59b3c1ec6efc727e345a820c48aac6369",
      "after": "33ccf443edade66490ad61096b51d52169b35d5214e7c9b4565e7dd8f3c45edc"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/slides_panel_flow_tests.rs",
      "before": "f084da8e032d84f6173309e7f7f49ede5ab1e5d6fc7e6076e3fd3475c12c2038",
      "after": "5a7556d9e855e26b64128574266d2c4cfe809cabb3fdcc16b7c52105274d09a3"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/top_bar_tooltip.rs",
      "before": "b58aae7bef59d1619cc22cb718370aa77a181399572a63756635e72056af4297",
      "after": "c141c4053fa248dff85b14d00bac79a3f4c391232ff08b324b242be8d336e4b6"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/top_bar_tooltip_tests.rs",
      "before": "dc75414c9dd8ce62186910dc28408681a0530143fc969c32963545c152d7a907",
      "after": "446968b7a922275775c9adafccd8e90d02af1de37728887acb150c80736d779c"
    },
    {
      "path": "crates/op-engine-ffi/src/background.rs",
      "before": "ec4bf2ad515a2496866546c76c5f7ec699929610fdb3ebcb994ffa07af74fc78",
      "after": "147a01c5b983e8feb2838264b99a8bf1b841d4b257eeea713d004b0cb86fc692"
    },
    {
      "path": "crates/op-engine-ffi/src/editor.rs",
      "before": "8e305f92001c274b0532b6d29281745aec353be186b233c28854d6e1b9ec6136",
      "after": "ca63191dbf9b8557bdb8c8accdd2f4332fc1e9c64657c9d57f6d4abf5da5e76f"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_auth.rs",
      "before": "c879739a469bc2c8f752e64999f279410690c915d93c560908e1c753fc4514b0",
      "after": "defa4fb9c775b1ee4d1b4ddd872338d1f2036c53284133e637e5895640f8c7e1"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_auth_window_tests.rs",
      "before": "0c026f035a2eb32f516280e993a497fb93ce3417ba003543022fa9963554f752",
      "after": "74fecc0369d7f66cd7b90d3ce698908305ccef351d72b2180139a0a80140b606"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_chat_scroll_tests.rs",
      "before": "9070f18c18deb5b9520f7bc2da32db5962b6889c4209695c2ee5a79566886037",
      "after": "3c574dbe44f00dcee6daa29f6ebed7602180ae4e6a7942ffb56d40b39fd016b6"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_collab.rs",
      "before": "c99691b682dc25de17dbff8207fa4c48c7b3ccac62392439e2509fe0aa2de662",
      "after": "fade61eab2770bf985ec000ade4a860ccb26455e1ac343f7a419d3827e4c63b6"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_document_save_tests.rs",
      "before": "3c0ccb24813970fde0a833019cbc00ed860bd95588dcd15c185eb4d2138aa665",
      "after": "59b852d006762c4565cc54305bcd355f2262c08751c6ab5ebaafe8bf5ac76354"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_document_shell_tests.rs",
      "before": "ad9d684cc0fd87c819814466a326f009713caa6ddee933c4cb6256c798408bbf",
      "after": "0f61be163eb55397872e597ee6b4671f80d49f3b4389a81683bb19f5f8c882b6"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_export.rs",
      "before": "2b5ae7386a9b4ff778cdc73fcba8999c8590c534eb63cc432b432be13c4f141f",
      "after": "39a3a032f04e90cda7a4d7416e7f74057402320dce1aa65d5893b4046353cac6"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_pointer.rs",
      "before": "e94c1394846c7981ac0557d99e745b75cce1d2ba79aed0f30f0cafe043eec0a3",
      "after": "b82151714f17817d2b75408e5176c1f96d3f91e33d31b16de855b283c1578e53"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_pointer_release_tests.rs",
      "before": "83f6d5b139358a8c75d82d6be26eea7fb85d8daf694591242bd6ef03e505bd8b",
      "after": "ab1611fca952117023a5280f8e0d814f34e0d1307e9867d761a5be48b5056ac4"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_presence_tests.rs",
      "before": "2864020f93ff7c7908a5bd37db733aeb40b01eeb2dc948854fc5c9a0e8b711e6",
      "after": "f101976e73d8c18cf2420dbdd14bdc3b123f59db7bb47d91a799a0fd70743bd1"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_settings_input_tests.rs",
      "before": "6674772f06c438edcbb0406381d4a595db9cf095b84aa17280cb0346de2345f3",
      "after": "c6f02870cff481a68bbcd2b7028b1eb688e3ae58335add14a5ce8d5764fd2ca9"
    },
    {
      "path": "crates/op-engine-ffi/src/editor_template.rs",
      "before": "89dd0b5acf05317ee806b838151e08063a12644180a613b40751d0d566aa2454",
      "after": null
    },
    {
      "path": "crates/op-engine-ffi/src/editor_template/tests.rs",
      "before": "b9f3de6c17a929b81e1d770579d5c0c87e999acda5a5e9192f79c85fd4d79d73",
      "after": null
    },
    {
      "path": "crates/op-engine-ffi/src/input_tests.rs",
      "before": "bc728350cf5c8ed30735351d564f6abef82e4eb159a3b9f7e92ff52c057570e6",
      "after": "49657f8022436f88d9714832d84ab921b91d9e50ffa4c8ed54964ba133ac6393"
    },
    {
      "path": "crates/op-engine-ffi/src/lib.rs",
      "before": "5e61108be06561dade19fc3e0ba0a3b9706d8e2f0726a165d221a4919931889a",
      "after": "f9f25d7e55eff127f91c6c53529172e148bab7ac09c80fce50367795cdcdf962"
    },
    {
      "path": "crates/op-engine-ffi/src/lifecycle.rs",
      "before": "87b61aa9d8aad3c03fa11b5a30900799f6aa086e79914b63a041320dba468da7",
      "after": "b913ff757e5ac288d4f79501da7401647e198890a59c1aecd72fb1d194cc3fc4"
    },
    {
      "path": "crates/op-engine-ffi/src/lifecycle_canvas_touch_tests.rs",
      "before": "a2398aea7dfeaf95fe33a463935ae292b3fa8a4b241cf8d08127755f5efc365f",
      "after": "993a267d3a4b5bfcd403786fd965aa2fc98a2ca069ec0631797e6acb8c97060a"
    },
    {
      "path": "crates/op-engine-ffi/src/lifecycle_editor_fit_tests.rs",
      "before": "95b6cf0c9ce1d6f01b317806c83e89cda4bddd59d1dc668533e35f97aa4536e1",
      "after": "abfde5ef4e0482e5e383c851ae2762ecb1f3562b0a4d9470e1ed1f86016a365e"
    },
    {
      "path": "crates/op-engine-ffi/src/lifecycle_mobile_focus_tests.rs",
      "before": "76a457ffed68bc358bcba5ae1cdafda2d9a9b7e33c9d1da69bab4d67d82264aa",
      "after": "b3b2db3fe58e498b6a45f737e39b059c80a8d53a5a04165a59f4b21152eac8a3"
    },
    {
      "path": "crates/op-engine-ffi/src/render.rs",
      "before": "db3bc79349e1d47adc2afa0ac5aaf26273cb67a5ff0de453bb1c4ce9d340ac85",
      "after": "43fe20ea2c98b2472e8d4e6c6d38e75bfb831d083fd2ffc667665d6162878b86"
    },
    {
      "path": "crates/op-engine-ffi/src/system_chrome.rs",
      "before": "b76087cd3109ab8cd380a0006c80486b02baa8a974112399a5c8d1d7ec50aec7",
      "after": "c0811d6d693d5c7712b2d12083a8525b6bf2540f09f1551169af69d4a1c6f569"
    },
    {
      "path": "crates/op-engine-ffi/src/viewport.rs",
      "before": "2244d7ad678cc40926b205638f56a16d19ce2a672dcc7539904e63628c2087a2",
      "after": "e4da36fde7c1b77e3b1985f19b26f5e6183d2d501435a2885ec584a4bbd61fdd"
    },
    {
      "path": "crates/op-engine-ffi/tests/abi.rs",
      "before": "7fdf05e97b1ae941504ee8be9302ede20e1ee01763e2a29cd162147e8e4fccb7",
      "after": "c3ec79beed4cd8260cdfcf9d5c6de1d05e528cfd9a736977d077ad6f173b8e2c"
    },
    {
      "path": "crates/op-engine-ffi/tests/editor.rs",
      "before": "96018b34e7083cc1a9ed498963876ce221d54a71ddf2440cd134f0368fc7aff3",
      "after": "9ec70640281b1a79e2a0112482d1f3f32bee5ec9eb8dc0d535e83803a085cfbd"
    },
    {
      "path": "crates/op-engine-ffi/tests/safe_area_profiles.rs",
      "before": "3e750b26fb4509b3459f3d3b8ed5830b0cad6d3c5bdd4723beb8237404b512e6",
      "after": "0d08cdf6314247f257a79c88ff72c25beb5d5fd00fd04d3807267b89d2105da7"
    },
    {
      "path": "crates/op-host-desktop/src/app_poll.rs",
      "before": "848c32eef14b4e094f301d81a8e0d91e6a000a12f1c721623edde7a8dab75fba",
      "after": "f53520f8d944a6d9df383cf610812dc321a123fa837902efbf68b3d2c6a39930"
    },
    {
      "path": "crates/op-host-desktop/src/app_state.rs",
      "before": "7e770d96f8b576179fea8779b333361295de4633924eb7d3f899b90db8d54b5b",
      "after": "0611660152f43862b31ba29a1520f07af65a415dfbad7e205d947eff134e5c34"
    },
    {
      "path": "crates/op-host-desktop/src/chat_session_launch_design.rs",
      "before": "1c9b7892909c4c43b514b03a3e9d6b3b6d88f33f03b18ebe1be0fe4230fdbeb6",
      "after": "0fe760bdbaa5b859d93995ecf4eb1a3d8c764b0ea0262a9204b8be06fcc68329"
    },
    {
      "path": "crates/op-host-desktop/src/keyboard_asset_center.rs",
      "before": null,
      "after": "b051459b45540ed21f6d717a262aba36ffea94f4351659cfe0ae94c53cf94697"
    },
    {
      "path": "crates/op-host-desktop/src/keyboard_input.rs",
      "before": "f3fff304ce2644bdab73a46224124198b6a11d4b0d2a5153535f4880157de80e",
      "after": "911710a3cd48c7a302ae7f45821df14d88700935efc07a587ede11d1783e2e53"
    },
    {
      "path": "crates/op-host-desktop/src/keyboard_input_tests.rs",
      "before": "ea5ea4d9c5751aca612a3e2eb965d13902e2b53a0a6686b2ac17606af4ea3574",
      "after": "23282351286831ab675a33ff1aa6dfe78144b763c887bacd8495bd10dc32d44c"
    },
    {
      "path": "crates/op-host-desktop/src/keyboard_scene_template.rs",
      "before": "209b7046d0b35fa7880f9a1203d87a06c9e494cf0fdb417ff65d7533ca40b1d0",
      "after": null
    },
    {
      "path": "crates/op-host-desktop/src/main.rs",
      "before": "e83c54b67dd15752562ea5cbbe790b10b90cb6f47d8f06094c955a489481bc06",
      "after": "9cd75dbc2c81c1ac95b4c6754c03249d1db15694c27dc15f4c0607c0b0d26d52"
    },
    {
      "path": "crates/op-host-desktop/src/menu.rs",
      "before": "51bdaa77cf8b77f4ecbf00944a4371865aa502c31903840104b92a0d4bd37f46",
      "after": "d69612d815e7fd6d5d52e9b3d97913db224087e2af546779dba69fb151eb7f29"
    },
    {
      "path": "crates/op-host-desktop/src/menu_action.rs",
      "before": "321922e4bac5c14065afef8a67f2d12800c4f55ab2428a40c1813621ba1c13e9",
      "after": "092483ea89933529d85a4584271ba1ca59b846f9443c0933bd0c9d42b7024f4f"
    },
    {
      "path": "crates/op-host-desktop/src/persistence.rs",
      "before": "3170c046a186bbb70e166f5802c12ddfb10dc27bbc46f9fe8412de09f38bc550",
      "after": "d50f9e4b4467fdc7da163ce4c578c460a23b650c9b14b5b04482b3d6c0e9a1ab"
    },
    {
      "path": "crates/op-host-desktop/src/scene_template_generate.rs",
      "before": "bb29006b6c54897e3c06f56f396e2be274b953f0188f5db4194ed7a659f326bd",
      "after": null
    },
    {
      "path": "crates/op-host-desktop/src/scene_template_open.rs",
      "before": "88a0f3b50e76c7a95073e8bfe753cd728cb3d3b1d4cd42dc0993a35eaefc9c8f",
      "after": null
    },
    {
      "path": "crates/op-host-desktop/src/style_import_host.rs",
      "before": "81c8bfce6d86eb9b56554dcb4cd3def2b2e9cb35bfd5ab9d77625b426801f280",
      "after": "e0391f339298e6e982e73f2e31c7bb90c2adcd6f557dad262d7012b6bfdd198b"
    },
    {
      "path": "crates/op-host-desktop/src/user_template_save.rs",
      "before": "2ea47bee884a5930b5211bac9fd9681f4bb0a425c402e79b7527a3e5abe724c7",
      "after": null
    },
    {
      "path": "crates/op-host-desktop/src/user_template_store.rs",
      "before": "577a6771c39b6cbc815bab97bbfda7fe81bab394aa9656e1232af38c3256b6f5",
      "after": null
    },
    {
      "path": "crates/op-host-desktop/src/user_template_store_tests.rs",
      "before": "55f926736ee48f6957af6c97040753ea003f2cefd1eb2345c1aec33ea46bc1e0",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host.rs",
      "before": "0c5e3baee8b03527f885a0ff6e3c18017721b6df93a78229415f27135d778fb5",
      "after": "2f7660483610eafbdd3b08d1f7506677f754f627918fb3cda8cda291c69ab4c1"
    },
    {
      "path": "crates/op-host-native/src/widget_host/asset_center_generate_tests.rs",
      "before": null,
      "after": "e5b32bf69b357b8ef73ae0543e910cec97058ea70373a1ca4fb65de9661424ce"
    },
    {
      "path": "crates/op-host-native/src/widget_host/asset_center_host_tests.rs",
      "before": null,
      "after": "112f2a569d2cf93f26ba0a54c32e290c97acb49d88eb29a778e674f29e43696d"
    },
    {
      "path": "crates/op-host-native/src/widget_host/asset_center_ime_tests.rs",
      "before": null,
      "after": "b8d6c3c17f2c3204814ca463dae8b6c2975f4a374a7f110c15b15254e6617f45"
    },
    {
      "path": "crates/op-host-native/src/widget_host/asset_center_press.rs",
      "before": null,
      "after": "f7b3e6c2ccd7aae9ee6f07db5b70e863404fadb90821d6516e1dbd41d21faed0"
    },
    {
      "path": "crates/op-host-native/src/widget_host/asset_center_touch_tests.rs",
      "before": null,
      "after": "68acd02d9590629dbc1c850027510fcee88261882dd77fb5a035df29197118f6"
    },
    {
      "path": "crates/op-host-native/src/widget_host/cursor_move_panels.rs",
      "before": "35194eca5b56bb735b3fd54dd27c4b4fb42bbe66bc5ff8dcb2e74d77ae646097",
      "after": "42d8d15789ce193967e78396422b7c345bc4e1c044cae6946b5fbb6a747808ac"
    },
    {
      "path": "crates/op-host-native/src/widget_host/export_quick_menu_tests.rs",
      "before": "7b3107e5b4514a06c1777e0ac073ec870ba6493c66f994ec0a52efb34c090c73",
      "after": "c91f0cb0c2f111faab501e24a72156cf46cdf070a166596bc20bc4f6e68513b6"
    },
    {
      "path": "crates/op-host-native/src/widget_host/file_menu_press_tests.rs",
      "before": "e5bd10624ba514ef019566eeece522243cd6004f51f0a27a428979e7b0e0da9b",
      "after": "01ba4719c80b6fe911b091a7c05124b64eeece964e09c058ef8f9805daca546b"
    },
    {
      "path": "crates/op-host-native/src/widget_host/ime.rs",
      "before": "bdfee8aab5f41abd502b081309ff6198abbc638c877e35c49d94dc48131fd79f",
      "after": "9ae44a8ff6e17f7a990d0ea5c484d64d95e5f89e3ecb898e60fd8885fa97acfe"
    },
    {
      "path": "crates/op-host-native/src/widget_host/input.rs",
      "before": "7018cc6c205ea10e4722f66915ca67eea5f430709908c18850d6e88dddf870f4",
      "after": "ffe2ef571bda17c88b195a3df80e375e8548eaaf6ff55ec5fe3d5de04a44cb81"
    },
    {
      "path": "crates/op-host-native/src/widget_host/keyboard.rs",
      "before": "3d0eb286a5d041dcc4e9df14381cb30988136e986f65a6a27606a0e547f85950",
      "after": "a6578242de85a640187baf812dc6f2c2d0f83cd43de89f37d320f2846f124741"
    },
    {
      "path": "crates/op-host-native/src/widget_host/keyboard_caret.rs",
      "before": "8adcda8666e59fbb0323eba7c2c153bc46b3228064cb667a00fd87746460cbe1",
      "after": "ff940136c76853d0e4e9b6f0e1b8b79d2e8f25762bb7d26096a5fe7dd0993990"
    },
    {
      "path": "crates/op-host-native/src/widget_host/keyboard_clipboard.rs",
      "before": "6955812dc6286df247797029e0d3786f553becc0536335dfb8989b0556d56a89",
      "after": "f3f140e2e039a1ae922e2ce2104146a5935562b4967f1d6f01ec32816212d0d0"
    },
    {
      "path": "crates/op-host-native/src/widget_host/keyboard_delete.rs",
      "before": "d1f622d65975b0e895361b32649a1fbe3e4eb3109fa9406143e921a9dbe5dbbe",
      "after": "e35ae0b6bf29ce13d715958295d07d32a3ee1a64670a8faca050f061af79c18b"
    },
    {
      "path": "crates/op-host-native/src/widget_host/keyboard_escape.rs",
      "before": "0490d991b16221c4f3db13d7cd390464d5a6cf9e8f0fc0adac746dc4e105e101",
      "after": "f63a9e026eb8c2d996843db390d36f1dfcd9dcaa62febdc8157499c95112947e"
    },
    {
      "path": "crates/op-host-native/src/widget_host/keyboard_send.rs",
      "before": "345047866ffc5d4ac5199fb75a3394a992310fd35fccbd8a2cff886b905f1341",
      "after": "f18327e818fa5e792f1e9090e36e59fcd2ad65e72fdac6d1f3e8e78a4b8539a9"
    },
    {
      "path": "crates/op-host-native/src/widget_host/mobile_touch_tests.rs",
      "before": "b5b24d2a647a96c6dafefa3653a131fb7ffeffc740be33296fdd76158504b756",
      "after": "f9c5e23aeeb9e72b9797bed125bed4096a1fc58a654a78b047bbaee8865fbb90"
    },
    {
      "path": "crates/op-host-native/src/widget_host/overlay_rects.rs",
      "before": "d01ea77d9be6b8abe634dc5fa5ae1148fb76e7668c80794c35f2969377ed5a3c",
      "after": "a0de1c39e672805ab9eab63e10efd7464c80757b9df664ae74e867c56f692efa"
    },
    {
      "path": "crates/op-host-native/src/widget_host/paint_floating_panels.rs",
      "before": "1e88694f8e8101ffaffd054fbc5ba61949f9bc0c8b55c21c3a9d6ba4ff874413",
      "after": "0ce27521661947fab7271cbf263e10c4b42ab761802b18655a7d14c9780a585d"
    },
    {
      "path": "crates/op-host-native/src/widget_host/press_chrome_tiers.rs",
      "before": "28a8108d00bba6a5b3f7b77cccd12cf12b44f261a57596a5024bde8b9203d186",
      "after": "0f11ec8da5e557f20b1633fb26cbe947de9d697036a6a9fe2a41aec92c630f5b"
    },
    {
      "path": "crates/op-host-native/src/widget_host/press_overlay_tiers.rs",
      "before": "4be804bc8c10c4467d853aeeb141667a9e010fc8ae220266ae58e41d4b5159d0",
      "after": "866cc2cdeffa3b2a2271a9653c8fbaabaa25c1a2d9c16a3c0c7fa964647efbdc"
    },
    {
      "path": "crates/op-host-native/src/widget_host/preview_slideshow_swipe_tests.rs",
      "before": "cd9524e883e56fc7596b5774d09b47bf5a3a52cacffdfadb7249ab53b8425bf2",
      "after": "f465d8bc00836c79effeee8a5d4ca07023386c063db663811d6d3354a61b58b7"
    },
    {
      "path": "crates/op-host-native/src/widget_host/preview_slideshow_tests.rs",
      "before": "02f38e3fbb3f9cf7c0a3ed3b18ad3105be8142d4c93813dc22a3ea130bd5ee62",
      "after": "543498f822d848642fd0314bd6fbbba66cf341f7e8af9b7897cf6565945e222d"
    },
    {
      "path": "crates/op-host-native/src/widget_host/preview_slideshow_touch_tests.rs",
      "before": "336d740bba29ee4abea1e3c8b07c90a8c7b75d9934d05f78e568aa569fc6da0a",
      "after": "105b2e0cf563540bb9886d5929ca6b6d6dc1bde7e8279560014deb83d659a18c"
    },
    {
      "path": "crates/op-host-native/src/widget_host/property_input_dispatch.rs",
      "before": "105fdc16bbefa603325cb8dc30a9a378364d111b4a6548d951df9ecde697da65",
      "after": "ccde3837fa7b9de876c856d58fce9f9a80bac4b5a07b917b7268025ee881ec50"
    },
    {
      "path": "crates/op-host-native/src/widget_host/scene_template_generate_tests.rs",
      "before": "79b8dfd05178bd567d1c5ad8004bec43beeb40167703771bb0f82ec0856bee4f",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host/scene_template_host_tests.rs",
      "before": "8f031fbe9967572d8925e24c11d1ee90f8bc5f5d69aa66c44ac8a95db0ab6d9b",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host/scene_template_ime_tests.rs",
      "before": "b7f190bd6bdc18f2308a4f7285820f17cb5bdf464d34bae499f3285d03fcac58",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host/scene_template_install.rs",
      "before": "3ec095a1db23838790f072c43ecc2737da9c1e3861f07c5b91eac05353efdf50",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host/scene_template_press.rs",
      "before": "a81614bcb0ee898550985bc06c031784ec092c7a8375688aa7485a0ea49e42a3",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host/scene_template_touch_tests.rs",
      "before": "0542219780cadfda30cd895ca5027fcdc2fa02df7729d5101a5f108f90691eeb",
      "after": null
    },
    {
      "path": "crates/op-host-native/src/widget_host/scroll.rs",
      "before": "7e92f576fb29fe245da15844a675b6e84dd94518b08dc5c3e33964e912b6fd0f",
      "after": "e5020b5ef6cb5b1f609a8e8dc7b8c29d0229624c78b2253055e403ef804f1612"
    },
    {
      "path": "crates/op-host-native/src/widget_host/scroll_pan.rs",
      "before": "8a735547e8ea91e78b854e7a25e9da029a877898b5e048fecbc2857a360cb416",
      "after": "a68b06d8d0a5eb642ae49d0898b501fdbcae3160ce0dacb48b1296447e0d7e43"
    },
    {
      "path": "crates/op-host-native/src/widget_host/shortcuts.rs",
      "before": "b43c4c94592d6c232ab2a91df2768e744610d71db03d5b70332e37cef8e7470b",
      "after": "61c5f4c07afe6f5d3008f28bbceac74b4e7550e847cfb42beccd0ac0dfa9c74b"
    },
    {
      "path": "crates/op-host-native/src/widget_host/slides_panel_tests.rs",
      "before": "61570844db90a86f5f20f5b0eacf6c64baa29580f4ee2f2ccc92a0ef2713cab8",
      "after": "3b8e16f45cbd7ed0a6b2c219ffc7e2453bbbfe2db9e5dbf72955addcdd6fd365"
    },
    {
      "path": "crates/op-host-native/src/widget_host/touch_panel_gesture.rs",
      "before": "cfaf76ffd7d24945ab1c60f0c9230fc248ee5f640cb30be770bf233e55a764f4",
      "after": "6dd33c74e2894a6ef96413b9ab641c5152b99beec1092879cd10cf6fd00e04ea"
    },
    {
      "path": "crates/op-host-native/tests/asset_center_touch_capture.rs",
      "before": "742bbe1411186db9bc9e533e645088565eb9e11617f90465fab5005489accbe7",
      "after": "5f26cdc351179972ffdb1c3426a8b83d79500d710bfcdea3cecc3f0909c1c3d0"
    },
    {
      "path": "crates/op-host-native/tests/slides_panel_capture.rs",
      "before": "0e3a672f8d0269588447bf94280ba1ea6f3024f1d03be1253e7e47e1e8596504",
      "after": "c82252ea22a49480853848e5ba0e356a5117b605af12e420f9cd51fe2bfb26be"
    },
    {
      "path": "crates/op-host-services/src/cli_modes.rs",
      "before": "d16d8054796214b83b400a74c6a3deb6d326f3eb29e285ded5ea8bc2c600bb8a",
      "after": "4cf4f2c5ec40249d717e6a2f6117bbceb34b4bf006df20136dcf7d1f16c80016"
    },
    {
      "path": "crates/op-host-services/src/doc_io.rs",
      "before": "ae0532970a388efaac8c29d704fd0e6c9cff48d0bb7bc6e4c6060f35126a2b1f",
      "after": "31d72e642d558cb19fc3e8610fc2706ecb72f75994253a34a44263432c3deeef"
    },
    {
      "path": "crates/op-host-services/src/doc_io/editor_meta_roundtrip_tests.rs",
      "before": "eaffab9f2d75f3586a595def26d2e0b7d3f3f0bb95ed8cf2e5cf0c325de8424d",
      "after": "488791de845f3e705238a6815d910e36ce6febb010bb69d277b89bcafadc3b9a"
    },
    {
      "path": "crates/op-host-services/src/export_html.rs",
      "before": "dcb6c08efa8747e33dd222282e841dba7ec0c936d4eb86811d5efe311b525cf4",
      "after": "747e7def7c835488e36040871f6574dccfec3d9ac60f4d6f986d9a1a3114fd5b"
    },
    {
      "path": "crates/op-host-services/src/export_hyperframes/tests.rs",
      "before": "c8005bdfb0a92fb80b10238f03262902983b2fd731144fd70b298c45a4624fa6",
      "after": "0ea4ef02bb527d5e1e7a11fb6fef303c0e52b6298438a0aa63a778cb43740958"
    },
    {
      "path": "crates/op-host-services/src/export_pptx/tests.rs",
      "before": "bf49a83a8a5ec0904287008499a1046e3a77bf09256b1e2794b56bf67b737bdc",
      "after": "e2233af7f6d8abadd41f1a096a5e7f6228b80a946c3e3623fc2fc6593b2c4559"
    },
    {
      "path": "crates/op-host-services/src/lib.rs",
      "before": "7fa4851dcc7381ff66cf5d25e944ae02d9449efe9187cb4d1795ae672fab8dd4",
      "after": "1f0b5d1b2176ce45c25ddc2683763a7f8d19fe0b51755a2a62ea76bc317e8768"
    },
    {
      "path": "crates/op-host-services/src/mcp_serve.rs",
      "before": "9843a97ec0d488ca0f361855e32698319c32a710edef2b0b5e2b7dac0b6a88a3",
      "after": "b6ed77c56ff75e517245d30ea788f429e030830a37065117fcdadc19249ac3aa"
    },
    {
      "path": "crates/op-host-services/src/mcp_serve/registry.rs",
      "before": "5265df9a427e37d5b53c94f50511608fbccb3380a930382c547832a2200fdb4c",
      "after": "42d9cfe7d5ebc0a024c7489c985ae38f9761840b975b67e3fb833f327b09eae6"
    },
    {
      "path": "crates/op-host-services/src/mcp_serve/scene_template_tools.rs",
      "before": "a216410df3ac99d2c00c57575c624142f98ba7bb9ea05a58b1ab0ba8cb09fcdf",
      "after": null
    },
    {
      "path": "crates/op-host-services/src/mcp_serve/tests.rs",
      "before": "d3e7193d8a3a04fc970bc581a02cdb8f5dc22d226edbda36ce101e7776f4a323",
      "after": "a9ac0917c626ae1e0071dba65726f7910e7c22260deb8aa6600965a70133e95b"
    },
    {
      "path": "crates/op-host-services/src/mcp_serve/tool_profile.rs",
      "before": "de0a0156d347d30f331de8c77fb2cf69c68a99b641ae5a6636fdd4eccf84b019",
      "after": "1da7ac2352bf6b3412eda95557ee6a8742b7526e42cc114e1a6ac8e81f675431"
    },
    {
      "path": "crates/op-host-services/src/mcp_serve/tool_profile_tests.rs",
      "before": "0def506a39e9c6da2f7364e66ada41ba2996d513a5c5573c99f235dd84326a5e",
      "after": "5351abba3b6e7ed6e3870c2df19f6de98a91e03db4ec8e5a94f5ac718cbe41af"
    },
    {
      "path": "crates/op-host-services/src/user_scene_template_store.rs",
      "before": "69e59e710994ef4fa8dc80cd948ba4def73541a4c818e33a622087bdf12a5120",
      "after": null
    },
    {
      "path": "crates/op-host-services/src/web_canvas_server/export_routes.rs",
      "before": "f54a1f8705e6bf6ecad6c5c4528ef188e165fc93a6ef3df37b6dc8114690911d",
      "after": "403f8ae10ce5076f57d14d21677c4693e7a456b129c3bfaff5fdd0ed6cd75ea5"
    },
    {
      "path": "crates/op-host-services/src/web_canvas_server/online_mcp_tests.rs",
      "before": "265b3ab482a989c4c2d8c0d284b717a4da037298493a490667f6be779674d05c",
      "after": "677652fd7c89e373bf7218f8cf71b0e26c06643725a7f615923efc04ebae9a6c"
    },
    {
      "path": "crates/op-host-web-server/tests/user_template_restart.rs",
      "before": "f51e1938ced69065402dc9810decef207e4249ea65dcab62b1f9425565f9f662",
      "after": null
    },
    {
      "path": "crates/op-host-web/src/canvaskit/inner.rs",
      "before": "4360f05d5668d16c9fc7c0c495266e270fa5d743c63946e67cf419f0155072eb",
      "after": "c3605933aeedc32e5acd0db1c7f6ff98002e7f87cdc16398692f67502e86252b"
    },
    {
      "path": "crates/op-host-web/src/file_actions.rs",
      "before": "d437853b05707b6da96d6cc84953fdb11245e6a3f1fde08e7602addda419461a",
      "after": "d2a9f03cb4c30fc8b04b3950c036e7c531660450121a501ea64c951e1c04e43f"
    },
    {
      "path": "crates/op-host-web/src/managed_assets_sync.rs",
      "before": "be75c4ef515e50a1b182bc71d0c1b7d221689a6cb9ad5c518c8c6d16409cabb2",
      "after": "a4e4b0beeadd128ca933ccaa37b3d53984ce7a5311ad85664e43e99d6be316ec"
    },
    {
      "path": "crates/op-host-web/src/managed_assets_tests.rs",
      "before": "6c4b117abd57d69b0c4f82f6ebd5a0072703c0f40cf140ed903049105d51795e",
      "after": "e25ecb47631b8f35c63b8003cef1cb5516c01bcf1b84a1b8479bfb5f9fcd6bcd"
    },
    {
      "path": "crates/op-host-web/src/web_style_import.rs",
      "before": "f96d393495811094598200104e721c234784bc879b46aaf4c29c1a5cf1c9e8c8",
      "after": "d6dd659221ba74651930b307e26879034bf91a0727024356d6d897b73bb10a76"
    },
    {
      "path": "crates/op-host-web/src/widget_host.rs",
      "before": "613ade197a85023626aa8833e278a1f73e7e88dd9ecce2e6cf23351e80e6dee0",
      "after": "5c13d61acb3531e0f7fc6a231171232fe654aa8f0c2c169dac5f9313ddc84600"
    },
    {
      "path": "crates/op-host-web/src/widget_host/asset_center_ime_tests.rs",
      "before": null,
      "after": "79afa075ec874032af5452dbff75ee3bc75da8b4275bea5c41aef2b30cebef27"
    },
    {
      "path": "crates/op-host-web/src/widget_host/asset_center_press.rs",
      "before": null,
      "after": "28957a707d00896f0a938d68dba873cfb3bb174242a5fd999b1afca3a6eab956"
    },
    {
      "path": "crates/op-host-web/src/widget_host/chrome_menu_press.rs",
      "before": "a8fd1f3b2b796090510ba7df5b1a3e9b08550ea1ae2cf02361e5bc1f9601e721",
      "after": "82a5ef6620868a5ee150733d9373e36bd39e9f8695b3df8699af34ed6ce33386"
    },
    {
      "path": "crates/op-host-web/src/widget_host/keyboard.rs",
      "before": "bf9d164e8ad6b1c810f3137f250131e9a81f9c66deee5344a8d1b96f86fd8ab2",
      "after": "560acaa26c92f09fc7f47d60e69ab89273c232cac4bb3f10d4b47939add57cc1"
    },
    {
      "path": "crates/op-host-web/src/widget_host/keyboard_escape.rs",
      "before": "00554a77ac3bdb1a723e8559cdfb281c02d5cdcb575af0ae8b993a922767a367",
      "after": "a7a703c53a2d04babfc9aeeb377530b2381f23ae787300b87932c546f9db0946"
    },
    {
      "path": "crates/op-host-web/src/widget_host/keyboard_ime.rs",
      "before": "64232c53e6021052c1474a83f42d895afbca64b369485a5d4adf19034ad0ef7b",
      "after": "6e0c4d8c6aebe5e55c9d7a014d25ce9ee3ae752005084444d72faa1dd69fd8ee"
    },
    {
      "path": "crates/op-host-web/src/widget_host/keyboard_text_inputs.rs",
      "before": "82fc157506ab265a72b44c10088f77edbff1a27dddb281247d8af09cf86cb9eb",
      "after": "172353c8964f44da67fea0acac984000417b2c1a754d8595a25e3e84aa431beb"
    },
    {
      "path": "crates/op-host-web/src/widget_host/overlay_cursor.rs",
      "before": "cedc7edc5fdbee1e73f76b73a572e0d547fc7c90a3ab2769210bb9fbe76c200a",
      "after": "84b6273280405c4de0fd13640d8260480d57cc591f5fdf98d5ec12f67820b415"
    },
    {
      "path": "crates/op-host-web/src/widget_host/overlay_press_tests.rs",
      "before": "74196e761cb4ef68fbc31fe0ca3d35904e4f69679dc396e2f877f1b291fb2bbb",
      "after": "914fde5eb8428aae34eed79c753303f2d84d4f6fa03c3ea2260b55562fb1c385"
    },
    {
      "path": "crates/op-host-web/src/widget_host/overlay_rects.rs",
      "before": "6b1e55968c58597215429c01854035f52d0465ca6c63156b77b40a3a34155d70",
      "after": "18ddfa70f82b492dd0072f6dafbfc38ecb46a77cf6a7a8bbb0eefb729fcc0694"
    },
    {
      "path": "crates/op-host-web/src/widget_host/paint_overlays.rs",
      "before": "d3a052bb3aa248c5aa0395775758adb3659d43cb97c70a82941b67b37376dca6",
      "after": "b1abcbfe1441a765aad15118a45fce3c89940b7fc843ffdc97b41f5f101569e0"
    },
    {
      "path": "crates/op-host-web/src/widget_host/press_overlay_tiers.rs",
      "before": "f39b4a381cfb0b4a5aca6f8153a68881343ec18a1dc08738306453be11e40b19",
      "after": "3da2f82121e96d56154beb4eed50c76483503021958441e7aca9ac145b0fb108"
    },
    {
      "path": "crates/op-host-web/src/widget_host/preview_slideshow.rs",
      "before": "b5b2a1280ad9bc906c7a1b0e5914e7d58e4061fe1f72566e72b7b76f557e43b8",
      "after": "f8f5bf6096b0ca7845a559875f3c16370edcea90f125106250f209d56a39d723"
    },
    {
      "path": "crates/op-host-web/src/widget_host/scene_template_ime_tests.rs",
      "before": "62b1426ca216c2b59ee1ca3e629e36a697724ea8d12c107c95b5e5737d1c016b",
      "after": null
    },
    {
      "path": "crates/op-host-web/src/widget_host/scene_template_press.rs",
      "before": "a2f986a93b4640447b6e490badcbe7e510ad8140cc3fbb4d6dcefb876d56d5b8",
      "after": null
    },
    {
      "path": "crates/op-host-web/src/widget_host/scroll.rs",
      "before": "947a872923d02d444517f8ff0ed0fa645810429f997068ba4fe57bd27b1a399f",
      "after": "3525cc10f468706e1a1a5ec1753d568cfc63b45d859374514c8b108d0edf3c1f"
    },
    {
      "path": "crates/op-host-web/src/widget_host/slides_panel_tests.rs",
      "before": "670c73ffcc45d035ba20908362e0a0657e79d5c1866fb76866b687dbba4bd9a8",
      "after": "6729dfb7f06f8ba0251653308856ef991700efe41acd3daa1ca5123c17836637"
    },
    {
      "path": "crates/op-host-web/src/widget_host/wheel_pan.rs",
      "before": "28d83e310904f87186294fa9e37968bffeba4519f2e2202b8fe14f0ef25b1834",
      "after": "0eaf7171b6b52baf3e3631e5f36f7862e2007ecad73ef10cb66ffd8c85552242"
    },
    {
      "path": "crates/op-i18n/src/i18n/catalog_integrity_tests.rs",
      "before": "2a57a67d53d22c53b08506f66f8cde4fbc5cfd6eea9e33da9e894d7094046ff5",
      "after": "7950a7705b6b9555036f0f0a889255ba81b9e3b1a92806c3757540528f9a892a"
    },
    {
      "path": "crates/op-i18n/src/i18n/de_collab.rs",
      "before": "bc1acf79f9eadda26d570820a9f60ecfe85231d450f614480ad1bf3d01f058af",
      "after": "532f7084b54f732bff8e07ac9c363def5af887b4d53162dbdf4b09f26565dcc9"
    },
    {
      "path": "crates/op-i18n/src/i18n/de_panel.rs",
      "before": "1feec7f3f4b36d861cbe1cb74312b3164fa3e88379432e8ae385c2bd67b1e5e5",
      "after": "a6733ecbf167048ddd96779eaa8896dd05e2534ead54eac6145fd854b26ac82b"
    },
    {
      "path": "crates/op-i18n/src/i18n/en_collab.rs",
      "before": "bd68486de26f384bf0f6ff96c1e44f90fe513e62d27f036eb6873741e2670cb3",
      "after": "bc288ece5d9da326d5dea89a4d18e85d306c8e2525a36fcacd5d30c29d489483"
    },
    {
      "path": "crates/op-i18n/src/i18n/en_panel.rs",
      "before": "fef6d31e87491f58e56499e3da25ed71d27f2bacaed96768fa25e53952031b78",
      "after": "d97fc5b14db2103c0500835a814a415b902a5d93ed6f7014d55eba7fc55025b4"
    },
    {
      "path": "crates/op-i18n/src/i18n/es_collab.rs",
      "before": "f79364196b92dab3c77e60e70219d77caa18803df77a78c95cb4adc657234f6d",
      "after": "fec3323da24cd42176bd9a1860cbf1f12afd602900ca83635b4798e7d1814ad8"
    },
    {
      "path": "crates/op-i18n/src/i18n/es_panel.rs",
      "before": "6b53902299f12a0610684b2cf5106885495f66361f07e4bd75f9fbd2044f4a37",
      "after": "9f9b14ad2ca8a95a06fad20e8a898b8a61557a4fc7115c6a9463a4009071e976"
    },
    {
      "path": "crates/op-i18n/src/i18n/fr_collab.rs",
      "before": "3b33319b54255419c1bd630c6f7e5fe1b53e94beb89d3e8ecaa8af30a07003fe",
      "after": "cfdce3327fa76ea0197c704bbe8e3f9f2fd5d3c58dfd6ee462c1908fbd9b0dcb"
    },
    {
      "path": "crates/op-i18n/src/i18n/fr_panel.rs",
      "before": "8e6bfe7918a16a7871583f84aa00cdb9b95ac40cf6a1083950f346c19460f297",
      "after": "02546ca8b4a7ffe622f9b2ac66873585068a8c163317ccf9e1b300a42984a404"
    },
    {
      "path": "crates/op-i18n/src/i18n/hi_collab.rs",
      "before": "28a3b6bace1fd45056cb44f27fcc1b51231bd40ea1444903e53bc5238ff92d56",
      "after": "86cebe7853b332e981edf14f16ef9bb693ecccdd4a7aa812c332f8dfba9450f9"
    },
    {
      "path": "crates/op-i18n/src/i18n/hi_panel.rs",
      "before": "b8e901c97d78ed2b67ac82c702757149552cba5867fe32e76bea4eb79bc2f758",
      "after": "45bb81be7a3612789b074593805f55e1d16016637443430b2912d50b3684646c"
    },
    {
      "path": "crates/op-i18n/src/i18n/id_collab.rs",
      "before": "3ee7e8540cb53ff546f292270c993f2565a584a1e57725cefabe89f1bdfa8ff6",
      "after": "3c69c4c82b2a77ea2446d9579604da7818e005272ddbd37afd5bdeac1fc23b9b"
    },
    {
      "path": "crates/op-i18n/src/i18n/id_panel.rs",
      "before": "75329aaba1cc045de50be0b4a57c6e269433796f42fe628617d79328cb021b7c",
      "after": "222f07baca6b23faa7fb2b8ddc6823fcc043b998f0c5ba7ed9ea8ede4f8a9745"
    },
    {
      "path": "crates/op-i18n/src/i18n/ja_collab.rs",
      "before": "6472089a3fc4b5348652df6e0a6a5b573d9cfbb5a23e205734bac67ac8a26aa9",
      "after": "b6acb654e5eb75f5f0969a26e6b13be70e3ceb4e1146a9afe2afa3e335bb2c2d"
    },
    {
      "path": "crates/op-i18n/src/i18n/ja_panel.rs",
      "before": "557b45e9a4cbbe3f5ecda7c95c0dcb118654cb5694c6c80c882db4ffd34fb34b",
      "after": "8629df5e2acc9e152b5be3cdfee3fdb7cbcc1a6352c207ca120778cfc6e3722e"
    },
    {
      "path": "crates/op-i18n/src/i18n/ko_collab.rs",
      "before": "b0513ac57f7db9b80427941875eb14e766a60097eaf8b69b8662051c0ad8f695",
      "after": "2803faa099f878c8c3cff035aacd8667441dd19a1b3b5ec84305d62c6482904e"
    },
    {
      "path": "crates/op-i18n/src/i18n/ko_panel.rs",
      "before": "893437f63fd494c89263298c69b235b431a056b6088472baf8b22b16b22f14b9",
      "after": "026bbf2c48c5653bf448df605d7c4463f54d148c3f91ba7c41ffd2c832bfd3a7"
    },
    {
      "path": "crates/op-i18n/src/i18n/pt_collab.rs",
      "before": "b50fa894fbce285171f71a834259dc07542004bf805225583429157e55bcd825",
      "after": "fff8055a90ad6368705235584de0d9b9640959fa271da902b49b51a8f088ff72"
    },
    {
      "path": "crates/op-i18n/src/i18n/pt_panel.rs",
      "before": "e9de494456fa2c57e7b2fe16c02f99eee4a0f12752f19b6b9e46914cca53000a",
      "after": "392978f3a39f608f640205977011d191b7e4a44ebdd42c1fadb56a878e382c66"
    },
    {
      "path": "crates/op-i18n/src/i18n/ru_collab.rs",
      "before": "7ed2edd9149e06bf88aae0a4e442beb1a866071fb578ed37be62153b79b8da7f",
      "after": "36afbea13416e387a3377baa03f5014c082b997e94ca9c56b794b745c3d45b3d"
    },
    {
      "path": "crates/op-i18n/src/i18n/ru_panel.rs",
      "before": "0924d789fafd51fcd342d15215012b327f006a9aa178ab7eb39f4370d2d3fe38",
      "after": "9ccb00e22745f2ff6f31bcddd1a6cfc5fac28b8a3b7912ae0d35f8a7e46b716c"
    },
    {
      "path": "crates/op-i18n/src/i18n/th_collab.rs",
      "before": "d13f9dcab4758df568c869dda1eac77bba674a55f5b290cfa67de309a3ca0a8f",
      "after": "7aad908c949249795f7caefa1978d4363119f60c6d0a08714fea0da2dc197b53"
    },
    {
      "path": "crates/op-i18n/src/i18n/th_panel.rs",
      "before": "aba1826cadd4ba78449eb182dba1773ba47d37902d773dadca8eddf9c838d7f5",
      "after": "dcc051099a85ec628bcce6534dd587b9d18ebf1e4102e9753bd1f0b7061c5bd1"
    },
    {
      "path": "crates/op-i18n/src/i18n/tr_collab.rs",
      "before": "a2e835921251c56dd39ff1b2f483026e5546831f4daf1a36db4ebd872e96bd31",
      "after": "e91f4c10539726f476587023464f17c6c99bc6156d34c54765249328c4a7f7ab"
    },
    {
      "path": "crates/op-i18n/src/i18n/tr_panel.rs",
      "before": "f5c40b0fe24d2edbd0c07612046a744543f1831956ee9d04c778b8f5f38e7ea3",
      "after": "c6e410991fd539a26893b930dfe2ca2ce65c12cd327db69c7eff8bb9f037fa4f"
    },
    {
      "path": "crates/op-i18n/src/i18n/vi_collab.rs",
      "before": "0192d6b1e64779753339ba8bb35c3bec1ef8a6292620b4d8873457f644da3dd7",
      "after": "ccd75c6679b12869cda4061a66cc750a43cb64402a1d0e2590f6673509a64a8e"
    },
    {
      "path": "crates/op-i18n/src/i18n/vi_panel.rs",
      "before": "d98921934ad6024dfca954b7ec36228f4243842054392cd963d3ec427f29eff6",
      "after": "1226f999b4d8cc313336d2b4f921a9601f401034ae8a59c100934e3f14e30a17"
    },
    {
      "path": "crates/op-i18n/src/i18n/zh_cn_collab.rs",
      "before": "08015058bc5d7f09a6f73280452eaac36ddbf3e74ecacba0e6a15c6309c02ed1",
      "after": "418981816b806f3742fbdc708648abc15756247594a3e7a0de1b409bded85960"
    },
    {
      "path": "crates/op-i18n/src/i18n/zh_cn_panel.rs",
      "before": "85b190c5c8e5fbcf4b49634a6d3fb7ad7c14114e4f77270a3792b85cd1204b71",
      "after": "7feeefaa2799020e834a71defc9a8e58ece4e5b669f1f8773d47ca7b3c94d508"
    },
    {
      "path": "crates/op-i18n/src/i18n/zh_tw_collab.rs",
      "before": "a5a24d39752f0ca04889b4f0ed1dfe9b66c140bf803660572de2788738ed31e7",
      "after": "553c058b41a2ffa089168312be856cc2b9a6aff1a725fa429b8e16986d55a47a"
    },
    {
      "path": "crates/op-i18n/src/i18n/zh_tw_panel.rs",
      "before": "6df3572e310e1a82e5a51f494a522f54a057d06be7b2d12fd403553c3da23d34",
      "after": "154a4584e8762b3d62d8fcd52ac20b14eb610c0b3970e3da71feed3a159b4208"
    },
    {
      "path": "crates/op-mcp/src/style_guide_tools.rs",
      "before": "046b6c7c0a3a95ce281b5b0ea716d7860ff538e0585ab6ac0aabef0f2ac1533d",
      "after": "b9d5f1ae162501b69a17741fda7f0e049e12db69fa0133c938a48fb3df96cf77"
    },
    {
      "path": "crates/op-mcp/src/style_guide_tools_tests.rs",
      "before": "052317eb86d200ff1b28fd00efba5e64eff638dee14677559ba68fc6de045bc6",
      "after": "089cf5b2abb95c8aea79203ffcf90d21729b9cc1328c491386dfe9289c62d74e"
    },
    {
      "path": "crates/op-orchestrator/src/card_routing_tests.rs",
      "before": "8d4e77765f4fb6aa97fa1b7aa447b2f8f3d20e01b1302413605ee48b30d6e681",
      "after": "8884b53e0ce42c7600e56da9274264c19a85c5b181c33d03969ff98985f43fe2"
    },
    {
      "path": "crates/op-orchestrator/src/cleanup_repair_tier_tests.rs",
      "before": "0cc1797362a02032cfef701d61c77bddeca19a5f8ca4faff34675aa9ac90509d",
      "after": null
    },
    {
      "path": "crates/op-orchestrator/src/cleanup_tests_mounts.rs",
      "before": "b0dbf4eddab9b5b66442f21feb5ded82a37bd38117b9a635cb6a06031d9fec59",
      "after": "4f33e4a45a5934d190c64862357e54aa4039bbb879761bcf06e524e713428896"
    },
    {
      "path": "crates/op-orchestrator/src/design_type.rs",
      "before": "26fb72aa44c26107340edd8b7f8d2c311895c09820945d633ae08cf645b5d21b",
      "after": "d8f5ace9c399fa714d817cc90aee2a123835695f0c2787a474796244190c40bb"
    },
    {
      "path": "crates/op-orchestrator/src/lib.rs",
      "before": "6adf10e1b8c209f685da97b7802a3ac88033ed35318265abff380efc2b56924b",
      "after": "e97ba04077274b22ce36aa41f640be2edacfc4291d44d079161ebc8fca2af494"
    },
    {
      "path": "crates/op-orchestrator/src/loop_finalize.rs",
      "before": "07da9ff7d064b25ae6b3bc5f17556b672a61d6c6cb6e422a20023a0945ad0b41",
      "after": "8c07b5a7ccc53df9cbf0a4050223c855e42d98ee2db96d14927ce8cb7748585b"
    },
    {
      "path": "crates/op-orchestrator/src/loop_finalize_tier_tests.rs",
      "before": "5593a5e9b84d01c109f33abcc3d80a88815a1ac0e0fca4e31a0ea21a681ce8ff",
      "after": null
    },
    {
      "path": "crates/op-orchestrator/src/prompt_planning_tests.rs",
      "before": "b71b9bb4a7b5c340ca8fc74bf482ace3abe8c0e8c6e76e41dff0868a7e1365d6",
      "after": "bea54a0cfacff38dd748612d81739bdc2be35a1f0049b70c9f914b341f79435c"
    },
    {
      "path": "crates/op-orchestrator/src/prompt_resolved_style_tests.rs",
      "before": "f69dab287ca57752c7441685cec5165e85bff19f65bd9aa8148843c249154440",
      "after": "d7c00483d925690f6080bd6480a15d9554e3681eb59664dc9fbbc82a597be88b"
    },
    {
      "path": "crates/op-orchestrator/src/prompt_subagent_content_tests.rs",
      "before": "4023b5042df8944ee47e808a78f008d9f70bb8b851684c0397ae4492ac0c32b2",
      "after": "de9e9b4f83a04849b4038175ebb6727a53e925cbeddd847c087bc003ab5a4252"
    },
    {
      "path": "crates/op-orchestrator/src/repair_tier.rs",
      "before": "08e29f3fa1eb55359098157b5ce0cee5e41eabfebb4132fd4a29e7414fccf6fe",
      "after": "d9ba815f2d354f1b43c3241ff0cfece354868f88477efa03846fd73bebdab5db"
    },
    {
      "path": "crates/op-orchestrator/src/repair_tier_tests.rs",
      "before": "ba253597ce68e1f1ac56f934dc6d12ca2e0ede57f273ff660960dba9e7efe95f",
      "after": "9c1e077c88e97fe0e7163e2054e9d3f45a1ea632dc716e61ff3743ae39947826"
    },
    {
      "path": "crates/op-orchestrator/src/run_tests_pinned_style.rs",
      "before": "9b2ba89d8a86b9ce153c2c96efad3f653937bf02d29b361cd2ced846ba82ca67",
      "after": "bccc8448734779a7dc89045271d72f2160fb4038dd3a4b18e044bab4361b78af"
    },
    {
      "path": "crates/op-orchestrator/src/style_guide_context_tests.rs",
      "before": "c8ba0154d39a07626939987496900a38bd1173c843869b05488f18443149c7d2",
      "after": "0e49457b620ad91b124d278e8c7210b0358074490ef35739ebcaa4503052f804"
    },
    {
      "path": "crates/op-orchestrator/src/template_provenance.rs",
      "before": "da6672b2c2a54180fc481a1232c7a458bf6a84bc918607bc8c41369731804c91",
      "after": null
    },
    {
      "path": "crates/op-orchestrator/src/template_provenance_tests.rs",
      "before": "c0b7d19e33210697353c4d186b5b5376030d3f12cbba6d2cd46d78873f8c2c17",
      "after": null
    },
    {
      "path": "crates/op-orchestrator/src/variables.rs",
      "before": "14f291a705cde3d6c5f4e074ab8053d528b9c125428f82cc2291de3909e4b88a",
      "after": "b8bb46b1cb9eb9beb787beaa8dfd1ad4b025ae458d3767aac2d2394337c37e1c"
    },
    {
      "path": "crates/op-pen-loader/src/editor_meta.rs",
      "before": "27258128fe7f0b83e35ff85c0efa6c7cf1c25ef461a8a37677abbba688aeea47",
      "after": "74b9cdf28cbd795fc3e164a9487505a5b99f07d1828bda4fa780a3470f31485a"
    },
    {
      "path": "crates/op-render-export/src/editor.rs",
      "before": "e72fb07c6ebf425735073618d36dda706eab9dfdc6fd1fb140dc3ba36c6c9fd3",
      "after": "8e4f95bd062470f7358efc684d8401f5de07195f7b0141e0311286c136ef8c58"
    },
    {
      "path": "crates/op-render-export/src/pdf.rs",
      "before": "6e18f007d36abde3c3f3a0ce5864f4e35949c8201b61e954bfe8b8f6788fc2a2",
      "after": "87351061d36dd67b282715cd5df7ce6be1adf8fccf9ea62fdaa89c49ab9f808b"
    },
    {
      "path": "docs/kb/canvas-resources.md",
      "before": "746e237bf8517369b2bd38377a2860b12b0cccdf607a93724e4ce13611d3b89c",
      "after": "a389bdc6da325560fe53d56edabc094801f10da0fac7f9ee1add89d66c9a647e"
    },
    {
      "path": "docs/kb/product.md",
      "before": "8a7c828e32f4d9b00cca83cdbf1363c5031c70c2811362e58edf81c05e419330",
      "after": "2765f2b24f2c7545bc5c4ec5df4336056a43b966e42538a91d8b39feb1cab45d"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "78b45c39527d7be0f505c293abcb9cb7a8a767527ea053b8798fd2844670fcbc",
      "after": "bfcaa7c81b1d0e9dd7975375168d055a7da3be37d66f9aef96cc39fcb59e1e34"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "41499f785a1a6622c4bd66bb016d5cfe79c7c0c25bcd280d44b39fa306cf802a",
      "after": "62fd8199eb0303688c8f83c9c2e5fee7d0610a7d7e21c0844b52ce78f47ae1ca"
    },
    {
      "path": "packages/dsh-node-runtime/asset-browser.test.mjs",
      "before": "7ec18bb7069fbc40edee28fbab0316904064a4a1424cf272d26999c993313e7b",
      "after": "c44b799b5a9d4c99d15bde7366f05e5849adb43ed9f305e32d8ddf14715bd7d1"
    },
    {
      "path": "packages/dsh-node-runtime/asset-directory.mjs",
      "before": "4beb4405f989e76779c3e3a02d69a1dc736d1fb493b893a97adad50e86300fd0",
      "after": "5af435ae85d2130c27b1b6b27e52f5a9b279109c0dd494a081243b54c8b042cb"
    },
    {
      "path": "packages/dsh-node-runtime/asset-directory.test.mjs",
      "before": "c05efcfcc160800e8bd8c74bfc235c71e618484fe4509dd73935e8ef249a47a6",
      "after": "3b030f798dd418b24d84b61eda2ce10de898b61711560883aa8d27f3f61ae43e"
    },
    {
      "path": "packages/dsh-node-runtime/asset-routes.mjs",
      "before": "a6c1341b93c5880675e9fdcc2880180270c4f6134f6ae23e9d3e6dcf161a7e96",
      "after": "799d45e6303c28b1e9827cb740d97b7ce4aeaa8d6665f4ecaf37fe5514037001"
    },
    {
      "path": "packages/dsh-node-runtime/asset-store.mjs",
      "before": "66df967d9c4e7be10e36f1f8348d377ca90dad87f3d32291296c177ebcd6d483",
      "after": "1ac2e71d2e47465db223a87b316d584d845f54d52a7534208546ab1e1029e511"
    },
    {
      "path": "packages/dsh-node-runtime/asset-store.test.mjs",
      "before": "bf776239aac3083d36a1defbd506b2931381b0f532219a2752ee529c5b9357fa",
      "after": "0d4fd5e18ea2611ebe5f3aa3387a1c5caab9e5edb7a10da006315f562bf5b8d4"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.mjs",
      "before": "fdf48f0240503792ceab96cc435ca018b9941be3adad8fce3220b3324ccc7c46",
      "after": "ff6de9e61061aa7ea2de837c0db6c897bb97665fabed267391b9620cc0befed1"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.test.mjs",
      "before": "b4cbf8f6d0237d92da6248a49e6aea4fc5e7343feda46ce934d665d95869a9bf",
      "after": "7a340be5b7f361b5ef1c7da32e49aa02fab1930b2f91095f603dd6e46046729c"
    },
    {
      "path": "packages/dsh-node-runtime/cli.mjs",
      "before": "6d4869cd1bc1ea2deb5117ea3c437b3bcb05972a6e3836dd61e477418446fc74",
      "after": "7885dc1d9483c4d1bdd4e9f5dce74a5b072eb53cb5459cb2697dcae73b82b043"
    },
    {
      "path": "packages/dsh-node-runtime/draft-recovery.test.mjs",
      "before": "889ca40df9375ed6da7790b2149728186bac1e5b292736309efab228ca32c222",
      "after": "cc1248858fd76a707c16a087dfb045c890ee4b3c4d3627846ce7827b7f6faff7"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.mjs",
      "before": "c2d7d8028a13da2ed0842e977496436d2161662be89d2d5a09078ec82adb73ce",
      "after": "761a7a05786c19475454eb3cdff10667bb5da0c12273d002a847ca63f39ec4d4"
    },
    {
      "path": "packages/dsh-node-runtime/node-host.mjs",
      "before": "ef1541d00731f3e5c78551f3487614cff8fce2a04fac5da0a93862418e15891d",
      "after": "e6f04fb8b2db3bbd61ff6f69bb67bfe4b7fc8db140b88c8bd6bbe1b16dd3243a"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "85195ee5e1d3817661a541efa63f3b8d30f9ac84cfbed3ed9d6ff3c3e9c27a9a",
      "after": "63e3f765373dca2a6a5002aa638e38a33a814dc1c3f66f977e5301a15a037efd"
    },
    {
      "path": "scripts/stage-dsh-runtime.mjs",
      "before": "b3618df6e6422114daa43a1297dadb4a5db09e6bd9bb305479a05682014b0667",
      "after": "32075bd8ee1303cc0ba194a5b77f43138a3ef60aa59b8041ede1fd9847b24319"
    },
    {
      "path": "templates/step0/_generators/assets/before-after-0.png",
      "before": "0b6ce958894c40cd0be82edda682281493bbd7fff897e03765618e3f12522d65",
      "after": null
    },
    {
      "path": "templates/step0/_generators/assets/before-after-1.png",
      "before": "009e63347b9a1e6e23b142ad46478ae5ea352d04e8252e8148d8c7edba80bcda",
      "after": null
    },
    {
      "path": "templates/step0/_generators/assets/screenshot-tutorial-0.png",
      "before": "e212a1d0c7c81c7b51a1e6c01ee0889748908fa1d2213654401110a6090c125f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/assets/screenshot-tutorial-1.png",
      "before": "81e963b879d92c910648a1d30e6f5151b5da8c2e81766e60e62b148e3abd3e1a",
      "after": null
    },
    {
      "path": "templates/step0/_generators/assets/screenshot-tutorial-2.png",
      "before": "e65b0829ab53d26b8e5b19b8c03f4b7933973ea0cfbd3c87670d96b6e672a5a2",
      "after": null
    },
    {
      "path": "templates/step0/_generators/bake_hints.py",
      "before": "2131dc9bdee643404f4eeb827a781e1071c0b9f2e747e3f3bc03921bb14f34dd",
      "after": null
    },
    {
      "path": "templates/step0/_generators/cardlib.py",
      "before": "c6365bab2238d83be93c61ec6b5b8b2fcd1b32a4f24855517134b671311f02fa",
      "after": null
    },
    {
      "path": "templates/step0/_generators/deck_sounding_navy.py",
      "before": "61f9c430cdc6ae4d36f4672cdfda09cf782a38d2f99c067bf2711ddfc27f2423",
      "after": null
    },
    {
      "path": "templates/step0/_generators/deck_tidemark_slate.py",
      "before": "63406cb605d7cc228b32e97d150ab0f46f559ba94d02092e0275f1f9d3d4ff84",
      "after": null
    },
    {
      "path": "templates/step0/_generators/deckkit.py",
      "before": "99cff84d5e86ec8e0aebe2f372d7f41fd8fbd4f1337e8b6397bff09492ba2f09",
      "after": null
    },
    {
      "path": "templates/step0/_generators/oplib.py",
      "before": "2962c57d10931554f298dceb1e6c0f13bb958ae9614a821f0ff0beec1329622a",
      "after": null
    },
    {
      "path": "templates/step0/_generators/previews.sh",
      "before": "d1357fa7eb58f72e2c5676b3434004c1513b81915312754a7765ec2c1b651b93",
      "after": null
    },
    {
      "path": "templates/step0/_generators/qa/cjkcheck.py",
      "before": "bcfff69f7d99380d0c0cca0c17b1ec2ec0c7ca976da95841d4be4620f69b56f4",
      "after": null
    },
    {
      "path": "templates/step0/_generators/qa/cjkreal.py",
      "before": "b20e16b957562b017e13e97354c7d8e3b4454b688dc2a6e08b250f60280b7f8c",
      "after": null
    },
    {
      "path": "templates/step0/_generators/qa/freshcheck.py",
      "before": "8e77382821d64dec0a745a647b9686a9d0e5c1cb7302733e2b8497823484fc3f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/qa/gate.sh",
      "before": "5d89363600390f62c70300250a31e31af6d605e9ad859535821bd000cf27aadf",
      "after": null
    },
    {
      "path": "templates/step0/_generators/qa/trackcheck.py",
      "before": "4d554627c72e0ea582383628678eb73c1859eb7e15f349a11e106c1391915bc2",
      "after": null
    },
    {
      "path": "templates/step0/_generators/scene_preview_cards.py",
      "before": "b0b6a80e19c3006c0ce1e75b4563f82c57eaab4437db9bf3e3acfe21bbff253b",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl1.py",
      "before": "53e322364bb2f289b32c825d0b412e2ed04b95d9abcfe4d69628f916eb6c0186",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl2.py",
      "before": "7f95c7651a9497a66856c622b42fd2b2cadc4812c0f64ec8f25d523803f5fa2f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl3.py",
      "before": "70802f174440569ad9a14b41e3c9b6c90199821824e8d7c4d188d6e13da35c6f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_bookreview_carousel.py",
      "before": "c96d30e369a241acd912bfd7b0f15c1c890919446fdef2c20c1171ca9934a8a4",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_brand_concept_sheet.py",
      "before": "5bea810fabf8c593510a93238f0619d468535817a2741c50cb943a4ef0dfee8d",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_card_daily.py",
      "before": "9a950e5b24a7996eaa1b8ff1839bbf0e48cc063dfea016cf84ba8c0c5ece1cf7",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_card_metric.py",
      "before": "bcb066ff748e0bc6788e86fa125059c539ad1dd35bc01ca20031d17e881e20ac",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_card_notice.py",
      "before": "4288f2cd7e490e1ed7b7cd243fa1073f1077aa7a219f4e0018817155646a2d30",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_card_price.py",
      "before": "90cf2fa31a3d0602c9b501437f4bc3b0248c00c44ed9a17cb4b8026e834c7af9",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_card_quote.py",
      "before": "ab6dc12c0ca66b7dcc4bc2ad935f952b714235d30a4a23123040ad9861eefba6",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_card_spine.py",
      "before": "69489227654295f8101c1500a58d905cca74e727777c9cbb53709290399c60c1",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_cards.py",
      "before": "771befad12a60ec2279e45b8f0b9de4d5eb83779d78e788a0b5b231910356a00",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_cityguide_carousel.py",
      "before": "5ad3768b5a3c070569679b0759a6dd5e0704594f806a9d2c0478bc35f797720c",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_do_dont.py",
      "before": "81bbed5ce39199bd2d2dce4701862d3c0d7c76be7426d5e6e53d3b67673c9bb9",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_myth_truth.py",
      "before": "e95be80edc47710ac9bf58b77bcc3de9a92bf91eed0618be988603310ae30dd7",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_pricing_tiers.py",
      "before": "7ddec8f9ac36bf69567b93597a0d9326f1def5e952e58227385b1b785779d743",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_scenario_guide.py",
      "before": "6a8e7c5b4b55c2326189fcd1ec9cda960469eae801a94044543e7a7d6f319572",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_spec_table.py",
      "before": "d2003854e0b6217aee1c98645f9e787c603a006ed0b59638119eebcc6948d73f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_three_way.py",
      "before": "db55232411998c9e2ff85569d8f09bb723620cfb98cc2d2f0d5cbf2f8b03f114",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_time_shift.py",
      "before": "e6e07d321a3fa241551ceccbba9df3763ef01ea636974a58bd8a201d0da7669d",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_tradeoff_scale.py",
      "before": "7c895c30cf7e612aa40e1b67def882afc683ed19e0198ab666f14ec9cc2cbc24",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_compare_version_diff.py",
      "before": "4f521df858db066a8d95bf1ac6070d1af68105ce356bbd3ccf6d7ea300047537",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_datareport_carousel.py",
      "before": "6ab4bdcda9c25ee34ab0ca71e630df1810295ec9ff059b50fad7befd59a42811",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_deck_banxin.py",
      "before": "c0e11bb47904d47e94b2fd4faf41a69186c252f5df5ee56cd3f46440d8ab6052",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_deck_dossier.py",
      "before": "682223b14412bb1fbde8bc2bfedf241795655eaa35126aa3cf54bd8e2dcdbb6a",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_deck_gridpaper.py",
      "before": "a83a522ccad67ff9f6b66663dc604e0618e5e78d86495171fca76adbed68b717",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_deck_ledger.py",
      "before": "d4d0783c2941a63001dc79b1ff1fe05a17405ffd61fbc3a09478b3304d9e4075",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_event_deck.py",
      "before": "2d62750436815389cf2aff20bf0febce8365559582bae734595da139625c8ff0",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_gradient_tech.py",
      "before": "f791224a2bf3aaf51bcea3c224a8629840cec9bdf53102f8efaee8fec4223362",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_challenge.py",
      "before": "2e76985837fed7662abaca76b55e0c4bde2698939a7343fed598d5ef97a6c3e4",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_concept.py",
      "before": "f0efd70f281f78abf8eaa88f4046e0b1d8c6cd0f3247ada53364ee7c803cc338",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_data.py",
      "before": "9c237fc0851d30f695d446c7def5ff2e35c56e3881786233867307d87e7347b2",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_faq.py",
      "before": "e3399aaee40429f6d3a82d1f745a183dcaf610c862e165208a70ff1feed3afc2",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_list.py",
      "before": "d8fc8ed2a86ffefde1b156b6416315b5f38020941623d8691db9c4940fe79b12",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_map.py",
      "before": "d4e1e907b84bbd81c568d470524e74e7ac70dc5b574bf9671f81347d5e2da0f6",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_ranking.py",
      "before": "7bcb7414d658f5e5c82bb6515d7a0440a3cb0b27808f021c4b43404576f9c129",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_steps.py",
      "before": "66fac74f4e64536003b6a3a6248194849d33cabc893ec04acbf920bcaad4aa1f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_story.py",
      "before": "ef7dfd8b3d7505baeaf209fe39c088faa2ed78efc011f157e2a53a4569a36023",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_infographic_timeline.py",
      "before": "78a217280318deb4a12e560e2c1ca31ba2d39d01c916d897aabb7927bf2d994f",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_journal_card.py",
      "before": "8892e34b237984de77960f8062a60c9a904420fe8a18e7a1ac22fec390088958",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_lecture_light.py",
      "before": "c0003ce0a381789e4cde3c64d2e95efe424504d8140303fa40a0f16d972a913a",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_logo_qa_board.py",
      "before": "da89c0a1d47a83ab6986730e644aa4c4620242b787294d445e70e0a33bf5dded",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_minimal_keynote.py",
      "before": "c0d85efa39a28345b88e1cf4dce4472ca8b488126005a5bd3ff011cf4fe36b55",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_opinion_carousel.py",
      "before": "d8a8bd98fc15c39cc28263f59e9cf08e9beb3f1fe555efe5bcd57f52688bd3bd",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_pitch_dark.py",
      "before": "96537302e87d02ba9248fd3b9340af5f074429256ebec5bf0517a62cc07b1935",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_qa_carousel.py",
      "before": "698adac7cccf5571f7c7c5745784eaeefce3c3634f7b044d55aa151d535e6bdc",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_quote_card.py",
      "before": "fab02ac063063f2e0c051c19fd70d3938e4575af85124f0f2e939979aa8485e2",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_slides.py",
      "before": "4c30d04eda3dd044d7430a97aab53dc266cbb5680952b6c169da44b00d395407",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_story_carousel.py",
      "before": "f06ddde364cd6d37857437a6c463d7d67b17ed3a2c26bcfe5af3a3274a6f190c",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_toolkit_carousel.py",
      "before": "41bde2f9cfac054d40aaf8556851e57b87cb0f77d0d2b8b71cf905fae2ce6f70",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_carousel.py",
      "before": "ced8c30096b95d3ec41a031427f7748c38a2960c19eea51d2ec2882fbf51ea87",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_diy.py",
      "before": "de6b4a594dd6c01c0673e3eb116b836a3f360be3663197e51860068de7b89eb3",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_onboarding.py",
      "before": "e46dcb256faf2271529718f49c907a7d854acce4bdafa69410e8a39e97fb1748",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_photo.py",
      "before": "9243bea3777e119b8d434e8c67a656a3d87b43aec0c74af8f836536e54ca48f3",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_recipe.py",
      "before": "764edef1128004bd76b961f425e169de2d5455d94d12a9829746d7f22a0fa6c1",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_report.py",
      "before": "01ec32f502713fb31b5d5c03513e79784b38a4b1eb92f406a6b78726ccc02276",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_skincare.py",
      "before": "c8fa5eff5b85b71e7a877925a1cc01ae74b3cc8f8d5272f48a6c9efbd9851574",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_software.py",
      "before": "0585567d4c534b6b26ef348b0bf20dd5de7e949bbc5eb78ea89a0711f2f1c331",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_storage.py",
      "before": "2045ef1c0c3ebcd0bb2f129e0bf7e311d3e5c83a2283d7fab789e73c93ec50a7",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_tutorial_workout.py",
      "before": "b27c3937ad19003f4147cdf717b77b91f4668925194028cc04d66ae09b05c0ec",
      "after": null
    },
    {
      "path": "templates/step0/_generators/tpl_yearreview_carousel.py",
      "before": "76d7cec3c562aec243daafc98824aade76316a6757702eba6cc03e112c41b9d3",
      "after": null
    },
    {
      "path": "templates/step0/previews/app-onboarding-triptych.png",
      "before": "132d5f544e7a21072db7d27d67e4477458f61bacd1d8935eeafab41bb6b4cf4c",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-01.png",
      "before": "d6cc5a519934666f03013c80927f7c40bfecaa5dc7b6c1831153f330f19c0f33",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-02.png",
      "before": "18365551e3c7dc7a0abfdf05b40161846007f90905a63883426d2542bc816406",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-03.png",
      "before": "f28a26c2d5252cf4ad7c426b602c76aaf2ccc5c499bee627882b08f749b900d1",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-04.png",
      "before": "4c2f6df932f30a92ebb614f94c40f7c5b5ea29a1d9f31540badfdcc1fb8a90bc",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-05.png",
      "before": "ae28dae31fc9ebba20d88005dc7d4906ff3bdf424d7c3f1cc8544bdca87a3798",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-06.png",
      "before": "46bb801ad4250c59c908dbe2bcead4b69cfb834e66ba19747991f692fb6047e4",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-07.png",
      "before": "96c49a9ae9fb0c1c2e096e069aabece5de2825c046b219a6c3f8fbc0bf463571",
      "after": null
    },
    {
      "path": "templates/step0/previews/banxin-rule-deck-overview.png",
      "before": "72d76a64306b1a89636faa469c69711e3596b971f0dcc74b0e754ac90b58697a",
      "after": null
    },
    {
      "path": "templates/step0/previews/before-after.png",
      "before": "ee1ff4cbd110c20221d4245463fe3cc6e7523e64fff94966f3aedfb2464e4618",
      "after": null
    },
    {
      "path": "templates/step0/previews/bookreview-silk-carousel-01.png",
      "before": "36a4ce4a025a3dc7f014cc98be8cc485beed0d8af9e3faedb0520e0b35106b81",
      "after": null
    },
    {
      "path": "templates/step0/previews/bookreview-silk-carousel-02.png",
      "before": "0a8928b774df01ff26d05aa036cd8bd7ee8c338d35d46f5ba478fc95c6f36fa7",
      "after": null
    },
    {
      "path": "templates/step0/previews/bookreview-silk-carousel-03.png",
      "before": "18ee4e5fae413bab3ce799aceff6174ba8b93a92c2bca58e8576ca44154b3564",
      "after": null
    },
    {
      "path": "templates/step0/previews/bookreview-silk-carousel-04.png",
      "before": "df5d36c260cf1baea3a99bc88e9b83c23e06e4278347c1c734e906d51c2c8187",
      "after": null
    },
    {
      "path": "templates/step0/previews/bookreview-silk-carousel-05.png",
      "before": "f834e2c6cc11dc0da3d5a31581c4f2d21b62e50c415b57f50067f72a5c116c4e",
      "after": null
    },
    {
      "path": "templates/step0/previews/brand-concept-sheet.png",
      "before": "ec7dba106ce9961b097643ba8b8de110be74a15bec32a7a116acc2e5fd125574",
      "after": null
    },
    {
      "path": "templates/step0/previews/challenge-tracker-infographic.png",
      "before": "dd424625cc3755de6a0ca1c9fbf1c4479aaf8d33f50405bbe5c5eb56936de64e",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-01.png",
      "before": "fca72adfb1a8d4a93ec3642974c70b4e5580f8b22e12ed0402a703fab3608922",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-02.png",
      "before": "cfaece03602e5cf581e51399013d1aa7ebd49275bd940fe94653a8002845c0c0",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-03.png",
      "before": "e7bd14110105de42892ad0267308f0448bbbe9510b48ca9e5f6cb0f4e84ecf40",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-04.png",
      "before": "3a1f329971719f297478790d7cb399a45221d3bada77d68de3bc32a58ee9055a",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-05.png",
      "before": "a19584eecbaa2dbd463cdf1f485428dc1473e2bd89324c680d4b9a424b1118f1",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-06.png",
      "before": "7241118bfbe7808cbc94238d2d0cc025f4fc32163ab8e9dac3747b2a289f59c1",
      "after": null
    },
    {
      "path": "templates/step0/previews/cityguide-film-carousel-07.png",
      "before": "6ca4f4984d917f92e928b7eddfbf69bebbe8b0b892776a7b31b8ec3fc95e7ad3",
      "after": null
    },
    {
      "path": "templates/step0/previews/concept-contrast-infographic.png",
      "before": "f48dbab09cf2509c95e2b7efe10c89bc4b05e4255029180ec8f22010d3793691",
      "after": null
    },
    {
      "path": "templates/step0/previews/daily-sign-card.png",
      "before": "9911ede2710427d8af3d361f7c640cf33b28c96c1fc2d2b0946e197984f6ab22",
      "after": null
    },
    {
      "path": "templates/step0/previews/data-report-infographic.png",
      "before": "3dd24979add66de5ddbc3cc3ca9acdbfeabf72bf57b22f04e15d34e452bfdc5c",
      "after": null
    },
    {
      "path": "templates/step0/previews/data-story-infographic.png",
      "before": "50965dad0b7b402335c15259fc4853a4253e64ae9d9452209958ab5574838c76",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-01.png",
      "before": "8d03cc213c5ecf8666d97bee92e2ed3cee5ff580d5f79211af936276f88fc8a0",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-02.png",
      "before": "3681e8b50c884b9d295aa5b132d0c15021e9a57d5ed7351dcc4991efc9c55102",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-03.png",
      "before": "3d51a357aaa502d7ce2fafc58221744d79b898802a7feb9f0ec2dbf4cdef6ac3",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-04.png",
      "before": "10c4f6d9f42dc1f92aa4825bda1ebd0db1d34bbbf7228027367181aa7466322d",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-05.png",
      "before": "a5d119f5051bbc97b0195d4dd296d64fda4c8c74ca0720ac882007885e4950c8",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-06.png",
      "before": "51236aa565358af97a42a688ba4b8069840065079ccfdedeb9260a700bf253d2",
      "after": null
    },
    {
      "path": "templates/step0/previews/datareport-grid-carousel-overview.png",
      "before": "83cc7846097cef3106d7af4f03cc9aa8dde77a92177a1e7ed47922abd296ef3a",
      "after": null
    },
    {
      "path": "templates/step0/previews/diy-blueprint-guide.png",
      "before": "29264d0520a1adaa8b34f78b6c1dddf0d7adbe1ea0f3ea7a8c2a0744fe4c81ee",
      "after": null
    },
    {
      "path": "templates/step0/previews/do-dont-comparison.png",
      "before": "c6e5f796f0fdb89a4a44feaa9c29453c79fa094bbc7dd56c87e9d32b0dc752da",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-01.png",
      "before": "4f27d89d7e6fb39c80f4ec8abc47031c340232a719f214eaeec695fccadde22c",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-02.png",
      "before": "6d1c49f35dbaa341d623f9de2bf6e59892e98384198087a164610a9b36eada6c",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-03.png",
      "before": "5c2d2d7f74b0634bb1273376b17c111b24e42a851f5f5fb25a1abfb92b739d8b",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-04.png",
      "before": "1195776d614965bb2a92de49e28c3783b559578c623c222912d3161905dad532",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-05.png",
      "before": "e842036c0b9c990ec8cf9e192d972dbaba6b0fdd843ae9846792d599cc3597c2",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-06.png",
      "before": "aa73b1d79577d3263cf33ddcaaa802e813adff3df089678aba118edad7a240ef",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-07.png",
      "before": "99bbfaff597880a06ed7a166591d6a871de84ca1821e9a74730747f518dca605",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-08.png",
      "before": "a40afba2feec53f57e691465d939f55763830f179a1098f7c1e6c4ea2528eca9",
      "after": null
    },
    {
      "path": "templates/step0/previews/dossier-linen-deck-overview.png",
      "before": "35f85ac6af5a4458060c5956ff450bc851300fef94d268e466137eeb23758879",
      "after": null
    },
    {
      "path": "templates/step0/previews/drop-demo/01-empty-state.png",
      "before": "340a41b6ee005d08662525959a83582d233eccf75559f0cecceaa4e2612f88f7",
      "after": null
    },
    {
      "path": "templates/step0/previews/drop-demo/02-after-drop.png",
      "before": "0161ef939033b8109d2fcac9c084f343a6d6b21b9eba12ed43b953a4660f5d0f",
      "after": null
    },
    {
      "path": "templates/step0/previews/ecosystem-map-infographic.png",
      "before": "853cef6006e0fcf5615aa4cce72efcd2f6e83b00f79c24855c6366ef2b8f2630",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-01.png",
      "before": "0291c951afce2daef71a26a198437ccf7ffd5d9b9365602375ae7c9bfad5e912",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-02.png",
      "before": "c8326ef7ae577e345f43ab3363a603c09e88d56e29e3cbf5051769a58f5f4dff",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-03.png",
      "before": "30046d3557d70b7124bc5613b9ab8e02119deb8ae5a8bee2defedc772488171d",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-04.png",
      "before": "b026c88708fb7aa7d7f6bd66c568eccf6ac0689b419e7c8940476ff0a6e1b2d4",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-05.png",
      "before": "947fd7a2e90965515f6adb9c9dfe2b163bbf2520ec116b57cdd194a393434991",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-06.png",
      "before": "b4136c424271999d1f1e2abe173b2e52e40ebdd4a7589f72eb9486bb9f7ba95a",
      "after": null
    },
    {
      "path": "templates/step0/previews/event-poster-deck-overview.png",
      "before": "0f91b3901fca6011850114c6c19d9edeb5b5c6833370e7d094feaf47647a889c",
      "after": null
    },
    {
      "path": "templates/step0/previews/faq-thread-infographic.png",
      "before": "f38c32f93ebeab0540acb7c2babc35b175569e6bcb30c0aa17b49be0ec6a3048",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-01.png",
      "before": "b73c896a6c8121bc0cdbadba512bc24a17c21d13356769e83949abf55be7e8f5",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-02.png",
      "before": "fac81b39ce18aa80c0710891f11aab77d104f8cbf97c729b38a4712b2ffa2f3a",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-03.png",
      "before": "6e0dbd14ab818878b41ca50865fe1b4578631c2a0d6a29f2fb4d96964ac84f8e",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-04.png",
      "before": "cb5d19e0485fd157b083fa775183d7544de500b1d9a819139d56c892ba1f06cc",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-05.png",
      "before": "326e6dfb2ce44a59943eaafb172607c2f01816a66918374f3bf29cefe09dab56",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-06.png",
      "before": "a789e4496bfc39eee75de1e6078e819a3ffbfb25e7812be9ea15e542d112d1c0",
      "after": null
    },
    {
      "path": "templates/step0/previews/gradient-tech-overview.png",
      "before": "0d2b14ff721aed8b86cf570c8c2c3dd865c726927d44aaf881051be27bc055a8",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-01.png",
      "before": "c2d1b11528ecf11a162383b3188907cbf3cf4b03eecee9f7cde59bc765b0fac3",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-02.png",
      "before": "7f65fa8724b687b9f845ddba274980d656d60e60001accdee386cacf2e24d7e7",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-03.png",
      "before": "6b8b76194c1ad1b482af313ec7b22f1adca1505643b7190a27815e94bf5c081d",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-04.png",
      "before": "4ad2f19ec5b47813f35c78785041ce2c6b1ccb72879e2d4baf18655b0df562d4",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-05.png",
      "before": "23b0100e7e69e75b98864659fb2069a15b29e16500fe3beefc6c553cc8a1c42e",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-06.png",
      "before": "52dbff589ea34be9e69ebf73a3d7e7fd5d39ecdbbca5430e4576d5db46343cfe",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-07.png",
      "before": "f930e843bf665e28ecd433235f69785e08ac185b12b2f49ffbf565da45e7c794",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-08.png",
      "before": "deea0043decd7589d9935c465894d473de208495216ad07392a51886d29e2b8d",
      "after": null
    },
    {
      "path": "templates/step0/previews/gridpaper-graphite-deck-overview.png",
      "before": "4576736d10497049c43390c31c695633127aeadb35eeccc618fdb1a3d97a02a6",
      "after": null
    },
    {
      "path": "templates/step0/previews/journal-checklist-card.png",
      "before": "d0b5d89b252600808e6ee1e6a5618f2d44b79e7524aeadf49ea78af834656f9e",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-card-square.png",
      "before": "ea573d61ee6c1d991eefb0f6d922cf404d6098366cd0f49be5af7281975a71df",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-card-vertical.png",
      "before": "257e77140750883eb2fb3e25fcf4a2dfbc44eaa92daec44f6eebdb1d2c428ab8",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-carousel-01.png",
      "before": "62f2452ae2f47b98983ce0bf7f369169ed4fcfc3971bf77a75c44d9cbf690c01",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-carousel-02.png",
      "before": "731904a86dece93084e015cb889e2a179d4ab058a42981c9b274259f493f58fc",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-carousel-03.png",
      "before": "40cd6fca5d10e0c16e0553d2f3ad3b3322980f2561139dd84e38f8d6dc6b76e7",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-carousel-04.png",
      "before": "60c5a3bd354eb6bb236b2b93829023613eaed66db74c67dc9c38f9412ba94b76",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-carousel-05.png",
      "before": "b365f500e1b40c5fc2ba6cca28ebf111dedd6eb91cc289dfe3b0e8efdd802ec8",
      "after": null
    },
    {
      "path": "templates/step0/previews/knowledge-carousel-overview.png",
      "before": "7eb1f9ee0e7f97efc3666a1ea866d1030c0a5659e2ac1c6f44254431fd307920",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-01.png",
      "before": "bfebaf339aa8234ffbf02f7e590a470565a181263421694f1b47b630dee119a7",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-02.png",
      "before": "6c9524c99b8de0894cb86dfd87226f0cab6bfad5bfd89ff5158035983761ccd3",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-03.png",
      "before": "f032e3ecef35e3526afbab7508f1c80f4214be55e076f11098b398752167fbae",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-04.png",
      "before": "8df6e48566fbbf9a27dba8a9bd3f0658aa96dfedc6b28790cbd28598e617fdda",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-05.png",
      "before": "e58ac2693a2fa43917c6c9c66e12d8bef8aabc8ea91316bb5577000d69461aa9",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-06.png",
      "before": "b63116310b8016c732505d7fca5244db904bf9b7670c30b791f66314300c2d41",
      "after": null
    },
    {
      "path": "templates/step0/previews/lecture-deck-light-overview.png",
      "before": "0b4e5ef438851846d8d5aa321107e2223ab62f153c549d1f547670a4453ccccb",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-01.png",
      "before": "285bdbfd1b5ce7831aea6940460c04d7bd25076d5ca5e2159d5c5983c96ebcf7",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-02.png",
      "before": "0af4d8a392ace0959476e9212a0e77daebb9a1861d5fb5917463c5f3dba2882c",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-03.png",
      "before": "d939e1a25245b967e6b224cfcbb0859517f4b54c7370e82dd4d317e8f5c257c4",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-04.png",
      "before": "8e4fbef207183fa4a74491118cadb7d039a0b696d2a9c60fd54b408ec7d11481",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-05.png",
      "before": "7f6e6b23ee84a86152432786fb6a58b56f3c65504caa29d202145fc23d75b471",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-06.png",
      "before": "a601a23274f424de482f5c704d0430a67566e4b4888268acd37db3d8135f5445",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-07.png",
      "before": "31b3983c4f4661099593391bde7f08b12b82dded00f489c87a715662cb2bd120",
      "after": null
    },
    {
      "path": "templates/step0/previews/ledger-tick-deck-overview.png",
      "before": "f99983cc2922eca9cf6a723b06c995a441dd9a5fe07a4adc923038d3731e1539",
      "after": null
    },
    {
      "path": "templates/step0/previews/logo-qa-board.png",
      "before": "fb119e7bd79eac09491169782f9186fcc3fc119b4031a67e4c18027ce05a86ed",
      "after": null
    },
    {
      "path": "templates/step0/previews/metric-single-card.png",
      "before": "698b6fe9dce871f0c5f77af73ff623095ccc5f2c7d4aa421038f0357c3d27662",
      "after": null
    },
    {
      "path": "templates/step0/previews/milestone-timeline-infographic.png",
      "before": "c24864f2b7abe07f655d8104a80016eaf343ff3a503524c8a8e0e0cd54699ad1",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-01.png",
      "before": "0cfec12fbcf1f737652743b4734ae5390c23601216b16885e1235d36019a3570",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-02.png",
      "before": "1b009f44a432c623c8d0defcb511f6d5a7dc862960e58107a7ea3d592350e66d",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-03.png",
      "before": "e1d4c22a644a358c8346591df9faebca41b20ca4cf9448960bd9fa913c7a2b96",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-04.png",
      "before": "7ef008b5020c2a78b8e925fc7cafd83d3574c3c74176ad71e1206e45296f79ee",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-05.png",
      "before": "93b80e55cb03a639be9e61fa16643cde98e6ae24502a6f167becbc600ea7de93",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-06.png",
      "before": "910f07cf6bea8ecdb74d2934ff0b08b95ae8a5181d3ca9298940d48a2563f76a",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-07.png",
      "before": "2ac2addaac9f628ddaf5b954fbec85d2eba56c1b8dde1d82108c701a4293b182",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-08.png",
      "before": "baf78c1eedf7a0f00b1570c59ca51d2e417a83f8b6a83a31a1925b15da828bcc",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-09.png",
      "before": "8d991d3f220a2eaa7ab942c93dabb604944041d1d9b627a513cdea540a3e1e6f",
      "after": null
    },
    {
      "path": "templates/step0/previews/minimal-keynote-overview.png",
      "before": "1a28535eb2e1b3ae6ecc6c539dbdd9828a12c41fba929396fae900326ce9abe2",
      "after": null
    },
    {
      "path": "templates/step0/previews/myth-truth-comparison.png",
      "before": "5ddbc0b468756d6d43fc65f48d895f6eb881fc73885fbb0b1645cebecc033ee0",
      "after": null
    },
    {
      "path": "templates/step0/previews/notice-board-card.png",
      "before": "daebe681c818a0f192abec6ad9814c909625745e5394e46363eb73c21db84489",
      "after": null
    },
    {
      "path": "templates/step0/previews/opinion-longform-carousel-01.png",
      "before": "783f7a1f55ca07f30fd532fad0bc030ab1e029152c0c0669a9df5605eda407d8",
      "after": null
    },
    {
      "path": "templates/step0/previews/opinion-longform-carousel-02.png",
      "before": "7f565f4037298594aea9fa1b126ed90493dc2f725dcfcad50ad87f9cea254cd7",
      "after": null
    },
    {
      "path": "templates/step0/previews/opinion-longform-carousel-03.png",
      "before": "9cb33830c503cbb82d47ab1c9f4b500c69f04e7719886b2c64f8b3a06c909c84",
      "after": null
    },
    {
      "path": "templates/step0/previews/opinion-longform-carousel-04.png",
      "before": "623d03d1b3cc37255195fae2b9a92ed99a91b08c16b1a55dd945219da01ca4bf",
      "after": null
    },
    {
      "path": "templates/step0/previews/opinion-longform-carousel-05.png",
      "before": "9dad1dfb16829823d2bd461a070bfd6cc85d45dc1b8cbfdb2caba4cf01f5474f",
      "after": null
    },
    {
      "path": "templates/step0/previews/opinion-longform-carousel-06.png",
      "before": "d805ce37fb25441c41eaee448e9e22c90a621225b9cbb135eb0e7d62f6968dcb",
      "after": null
    },
    {
      "path": "templates/step0/previews/photo-composition-tutorial-01.png",
      "before": "a1809240a6c033c9526a69e242f779d627b9a79418b5244df14554de56dfbb83",
      "after": null
    },
    {
      "path": "templates/step0/previews/photo-composition-tutorial-02.png",
      "before": "8bc5143d86e3847bf7e78411bda1b3630926bbf6e1872e1ee6655bbf30441868",
      "after": null
    },
    {
      "path": "templates/step0/previews/photo-composition-tutorial-03.png",
      "before": "fd5ed13915cb7b1b710a457bafa25b3380549bd828a2590ac2d98f309ae50c90",
      "after": null
    },
    {
      "path": "templates/step0/previews/photo-composition-tutorial-04.png",
      "before": "31e7edf3ccb1ae6f8cf0bc6151e7174922840a53f5fc83c219dcee352cd800c5",
      "after": null
    },
    {
      "path": "templates/step0/previews/photo-composition-tutorial-05.png",
      "before": "0e462a3b2e2eccf691966703d4ae70393451a582339249a6b5a146636852bc27",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-01.png",
      "before": "64cd1b4323eca088bb51ab9db6d61b9182d4ac3788d38f069cbf016d317b05c9",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-02.png",
      "before": "53fc421b704a3b0f45eea5c34695daedf942a958eaacf78e0ce2b72d356e8d62",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-03.png",
      "before": "11b98fad12ab3db05974a6e0910d8da1e0e67f2bec99654fdd7e415153990f83",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-04.png",
      "before": "b14042516812e942f71cc8bf7b3d26633c76ef99d9e6c7dc7d8beec2542dbf3d",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-05.png",
      "before": "7cf5adc7010f850a7d0d2a2b44de05c043d0075b1cf01511b7a14016fa3b52a0",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-06.png",
      "before": "189c0ec40514c8f6a2b672b52fdeecb588847146afc2dcb8e548652155e8ebc0",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitch-deck-dark-overview.png",
      "before": "88d07451fa3e312a71e36b96b409a5ef8d502a7a983337d934ca2f51e29426d1",
      "after": null
    },
    {
      "path": "templates/step0/previews/pitfall-list-infographic.png",
      "before": "a71cb3d6a06457295d84895fb18352ed4f1fabd1703546a232412c3125c5b404",
      "after": null
    },
    {
      "path": "templates/step0/previews/price-tier-card.png",
      "before": "55e02a4bbdbe692d2c4bb362104a789d131ff0f8254b1a115b972399df87614d",
      "after": null
    },
    {
      "path": "templates/step0/previews/pricing-tiers-comparison.png",
      "before": "8a05ebcacf43dfe7dff34ca93aeecad033ab19ab96101e05691695b052acf1f2",
      "after": null
    },
    {
      "path": "templates/step0/previews/product-landing-light.png",
      "before": "03b08235bd6c1ff869307ba712e32476169d86325e26f65e571b65afab18bb4e",
      "after": null
    },
    {
      "path": "templates/step0/previews/punch-quote-card.png",
      "before": "f998c7c6cf69d34b7b679214b77f830667bfc21829b11c33f6fb0afb58ecd63d",
      "after": null
    },
    {
      "path": "templates/step0/previews/qa-chalkboard-carousel-01.png",
      "before": "30ccef4c54ec9c2a0e9438ec685fbe19ab5f210060687009de34c4a0486651ed",
      "after": null
    },
    {
      "path": "templates/step0/previews/qa-chalkboard-carousel-02.png",
      "before": "46d82838a07cdb572035c087fc012b09c316bb08ba06f5775612c5e84931249d",
      "after": null
    },
    {
      "path": "templates/step0/previews/qa-chalkboard-carousel-03.png",
      "before": "8df9d5f8a61d788d587b53efda41104bf7de4149f23f9a524c2767ee2ff02fda",
      "after": null
    },
    {
      "path": "templates/step0/previews/qa-chalkboard-carousel-04.png",
      "before": "65a635bf504ed76aa4a5eb540d2cd84f54b6fc3bc30d81988970ede1266e7a28",
      "after": null
    },
    {
      "path": "templates/step0/previews/qa-chalkboard-carousel-05.png",
      "before": "24cd858bb3becbc5f15e4a0f6b0c4a81d8a1a338dbf75dd786e54c4ad25560b5",
      "after": null
    },
    {
      "path": "templates/step0/previews/qa-chalkboard-carousel-06.png",
      "before": "25654a00c41af3a6c288a12fb21712a41c7ea8b9e59c8ab43e98a9a33044e415",
      "after": null
    },
    {
      "path": "templates/step0/previews/quote-frame-card.png",
      "before": "e32dd35db0feb7db37ff638878b0b7b6d8ec8c9c9805c946db0144fda8e3cd50",
      "after": null
    },
    {
      "path": "templates/step0/previews/ranking-board-infographic.png",
      "before": "c928f17937dc1cc35ce3c2816f8f42b8dc22d52b8f8f48d87dd44a724a018d02",
      "after": null
    },
    {
      "path": "templates/step0/previews/recipe-four-step.png",
      "before": "1cb26ad23ce8b34265ff6ac664225b73c6de59880e58be354849e6bc92bd8127",
      "after": null
    },
    {
      "path": "templates/step0/previews/saas-landing-orange.png",
      "before": "9be84e58e495e3890424107b065624a41002bf1c3c20315a36c2c7df10a91772",
      "after": null
    },
    {
      "path": "templates/step0/previews/scenario-guide-comparison.png",
      "before": "32f3129ccd6c5a937c2ad235052b44b9ea83e88e85489c7be382adcb5dd3cecb",
      "after": null
    },
    {
      "path": "templates/step0/previews/screenshot-tutorial-01.png",
      "before": "8c50e80635f24bc4d537cef15dbad0b498371b0d2bcb4b6f141726dc80ee6a61",
      "after": null
    },
    {
      "path": "templates/step0/previews/screenshot-tutorial-02.png",
      "before": "0ef7e14a77a2eb1925f35d20d535a1a7ebcd2351bb18a1238bc84caa0272063f",
      "after": null
    },
    {
      "path": "templates/step0/previews/screenshot-tutorial-03.png",
      "before": "66fc10afac52d9754d17d8f8859fd62d2241a6e51d8e65bd3539ed3dd3cdeff3",
      "after": null
    },
    {
      "path": "templates/step0/previews/screenshot-tutorial-04.png",
      "before": "519c3defe689019e93fad0870cd534a90e0f040c82244526762183668f44352d",
      "after": null
    },
    {
      "path": "templates/step0/previews/screenshot-tutorial-05.png",
      "before": "8bf473047be33384e4091056ad63110a0f8cf9c2eabc8a73d9c0133cd00c9d3a",
      "after": null
    },
    {
      "path": "templates/step0/previews/screenshot-tutorial-overview.png",
      "before": "29930298077a20c89415f1838da31b68538c0d5f9afab2d4678e82fc7298b46f",
      "after": null
    },
    {
      "path": "templates/step0/previews/skincare-routine-cards-01.png",
      "before": "463429632e0e5821858a5ba796a40cfde3e177fc1152bd72b2a1d40db56aee0c",
      "after": null
    },
    {
      "path": "templates/step0/previews/skincare-routine-cards-02.png",
      "before": "9c9b2d600ef12b2a408547b6a8d07ecd12022ae4491c414ec8afb94070b930ef",
      "after": null
    },
    {
      "path": "templates/step0/previews/skincare-routine-cards-03.png",
      "before": "b38cd6a877d29cc55e5d7956628af23a2f8ccae5ef742de2bbc374812065bba1",
      "after": null
    },
    {
      "path": "templates/step0/previews/skincare-routine-cards-04.png",
      "before": "ea734ad9a9543fccce86fd5f9ce4697b78ab3647227bc1992347ce82ca47d37c",
      "after": null
    },
    {
      "path": "templates/step0/previews/skincare-routine-cards-05.png",
      "before": "93ccc59cb5f5d04bdb070605447583138131c9d4c32aa15a20f11b618134cbd5",
      "after": null
    },
    {
      "path": "templates/step0/previews/skincare-routine-cards-06.png",
      "before": "b2d3fe6402f042251f86b3e8961ec586270134567db26c8116015511f75939ae",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-01.png",
      "before": "301410dbe1e5b27f732bc697415cbdb35d0cd50a7b8e34217da0a3107fb80b43",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-02.png",
      "before": "b5bba44ea76e05bd86bb42cc13d267da80fed075db99792ab13b9dd5c7d51784",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-03.png",
      "before": "d2e1920b24cc95f9238105a31211185d5fcc7927c9cc1c4cc60f8eaa8263d210",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-04.png",
      "before": "8797358210d1acde974d12aee6e095dfea0f2b2d57a087a00515660f774338c0",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-05.png",
      "before": "27265f8982f77af966861c8c6207027377fdd890afe55d6a27ffb1437fb20fc5",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-06.png",
      "before": "cebad2dcbfedb06e437c8ae1480a506ff0991f681c9553dc6a96fa92f0fa94df",
      "after": null
    },
    {
      "path": "templates/step0/previews/slide-deck-overview.png",
      "before": "21a241f6cb5bf486947c1f3d2804d0f1dbc6b2f3dbeed16c175bf502ea4f545a",
      "after": null
    },
    {
      "path": "templates/step0/previews/software-step-tutorial.png",
      "before": "57a7d49019c9e0f6d24e9e9cca7d305788af6b2df6fcc9f0ba2319ce331fe8c1",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-01.png",
      "before": "405046cbf4e483681020aba353933977f81771fb2fc8fc527203f96ae10a9ff4",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-02.png",
      "before": "5411fd0ed440a6f4681811b95d88156a8c8cfa22ec5b5067caf4b87fae9e6b4d",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-03.png",
      "before": "4030b67e831077d4ceae226c526e803b175545b5e5b8edaaa08d84e330fb05de",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-04.png",
      "before": "8c45838b05df8cfe2135ea40485cd118d420866a888280b3b131feedadc48490",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-05.png",
      "before": "374f0c24f643f59e0d600897aef4fc5826fea84f1c7733b1d89ca32af50de7e9",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-06.png",
      "before": "05188dc6814586d0fb65bfe83a4a4122ecd91cd63f3d1633799ed8f8bb4fb66e",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-07.png",
      "before": "ace1b8d25a85d1f316c1264546312c48383d6757b10949743c387d5d2d1c092a",
      "after": null
    },
    {
      "path": "templates/step0/previews/sounding-navy-deck-overview.png",
      "before": "856fed283805e2c1fb29195cff4770799cfb4a0fae57d8b5bcf1ef305d1210a2",
      "after": null
    },
    {
      "path": "templates/step0/previews/spec-table-comparison.png",
      "before": "cefb21a18032046cd0e561f0ddbdc70202b1147fb21d1c8977650d4678b82ab2",
      "after": null
    },
    {
      "path": "templates/step0/previews/spine-culture-card.png",
      "before": "d5a094c3c901efc2492afe93fe2c574754e5b50c2788db189b5f2ec268902f7b",
      "after": null
    },
    {
      "path": "templates/step0/previews/steps-flow-infographic.png",
      "before": "3165dcf2dd3a3212b96118591fb949cd21abd4892279c70c74f2d1a97df2680d",
      "after": null
    },
    {
      "path": "templates/step0/previews/storage-makeover-steps-01.png",
      "before": "394ff548296a86622976e0a134f779d6f291d08a1606cf57c8696cfab38a22e1",
      "after": null
    },
    {
      "path": "templates/step0/previews/storage-makeover-steps-02.png",
      "before": "14e189e8d773090b143b240965ff37eedc2d1b5a55ef7446eef1b8da3c753003",
      "after": null
    },
    {
      "path": "templates/step0/previews/storage-makeover-steps-03.png",
      "before": "6d774a21fcfe0b00846949e86b9feaf1d4121d4b8f0b6d4b020ee2db9d40288b",
      "after": null
    },
    {
      "path": "templates/step0/previews/storage-makeover-steps-04.png",
      "before": "61065eea3fa34ac40c53181cba3c99e545084b4d46f5a3c1b497ec1a41247816",
      "after": null
    },
    {
      "path": "templates/step0/previews/storage-makeover-steps-05.png",
      "before": "a493a97207624ac059de9aa1fc6d00b454702ec7a98d2950f0fccc18d05da0ea",
      "after": null
    },
    {
      "path": "templates/step0/previews/storage-makeover-steps-06.png",
      "before": "aee70b04559f8f841385af017abf28dc0a63ffff2e91fff55e9c72761f0ffd51",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-01.png",
      "before": "9b5b676a5b89ceb814c1c075c41e009f87b484e0e1187b563ddeef3ac88d4b55",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-02.png",
      "before": "a2692c7a35b4fa02abe1a84d1538c9f79dd9e10f56402f2833c6299ee9236b44",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-03.png",
      "before": "b376fa2db3d94d923bada5a5165acd96573017ebb38ba0554167c9e14d2bb336",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-04.png",
      "before": "796824c78194e0264b36ebff84e9be62697e855423bdd8c85ff8092f34966ef1",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-05.png",
      "before": "bb9e35fc64bb529d53cc1ede85b1ea9caa2c2218eb8b9d6375b39d030d451faa",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-06.png",
      "before": "54c33c0d27eb676ef405c5cd8c6f8fb2423bbba2c823b6a572a848ed30dfc1f9",
      "after": null
    },
    {
      "path": "templates/step0/previews/story-night-carousel-07.png",
      "before": "7307a9c2b081a157acd67686d39d3993cb48ea835a668cc1e0b5dffd8497fad0",
      "after": null
    },
    {
      "path": "templates/step0/previews/three-way-comparison.png",
      "before": "2fe7364ab64a97b5c52b92895f55cb7a5dd5104de043cede6696c388ec9444db",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-01.png",
      "before": "46e30fb75abafe141b4ba3551bb60c63d51ebce43b8049fecb06696ea380311d",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-02.png",
      "before": "d68a97da771b439df2ca69b7e7b86405231cfc5f7140de59148bbccd6b260c3a",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-03.png",
      "before": "f9b6c14e409bb3bf53d8601050807aa796784a65c43faa7975258f7c50601537",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-04.png",
      "before": "a830d35b9ea6ed7505c86418306f8eaa2c23b85cde61fb6b19cea9da3375da17",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-05.png",
      "before": "1d40ba19a9d8bc91af65ba9816b05764df65e11f5c392d46d0935c7adb8de941",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-06.png",
      "before": "f59f500ca24fc98f0b53b9a07f02e226cebba26c647bed5121b6007e018a6c9d",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-07.png",
      "before": "a491327e0a1ee7fc1826b28470c24ea055cab4b25b53074ab7d08fa0a6f953fa",
      "after": null
    },
    {
      "path": "templates/step0/previews/tidemark-slate-deck-overview.png",
      "before": "c276c7f5b2f088e959ca977e1631ea6c5b566b1fb16f7c0412290bafa787820f",
      "after": null
    },
    {
      "path": "templates/step0/previews/time-shift-comparison.png",
      "before": "7cdd6b8d7803d68e9edd83689e97bd865322414e2b7ffc9e685a080aa9075c53",
      "after": null
    },
    {
      "path": "templates/step0/previews/toolkit-notebook-carousel-01.png",
      "before": "cde190d65a9f03645586e69bdd263182b1bc6ec546175bcf758ff6e9a78a876d",
      "after": null
    },
    {
      "path": "templates/step0/previews/toolkit-notebook-carousel-02.png",
      "before": "7c8634653753df4f556fd1e7701282eca2cc8c639a2d826ac4d17dcd3797452b",
      "after": null
    },
    {
      "path": "templates/step0/previews/toolkit-notebook-carousel-03.png",
      "before": "fe8756868f316d24d8e02661ea98fe902588f531928de8472bea351e021c3998",
      "after": null
    },
    {
      "path": "templates/step0/previews/toolkit-notebook-carousel-04.png",
      "before": "3515b50ae17fbd349988c113953b8a56dcc57ee2a78eb478865322645e6c32be",
      "after": null
    },
    {
      "path": "templates/step0/previews/toolkit-notebook-carousel-05.png",
      "before": "800cd01c27048a1c85ed22a7d9dd94d6470d4e166c2935cf8895cd85ef221cbd",
      "after": null
    },
    {
      "path": "templates/step0/previews/toolkit-notebook-carousel-06.png",
      "before": "fa1b54d077feb429df2f1a6c2e28659b1958a217b81ae18900d420bc7fa55921",
      "after": null
    },
    {
      "path": "templates/step0/previews/tradeoff-scale-comparison.png",
      "before": "c6a8f92d2d0d9f5887d39eb2a5d6b5e741fd12632cc5fc1ba6fc807552d4dc1a",
      "after": null
    },
    {
      "path": "templates/step0/previews/tutorial-journal-carousel-01.png",
      "before": "72ffe545892c74c4333230db073c6abdf9b44ca014a33a609cbe16727f0c4d38",
      "after": null
    },
    {
      "path": "templates/step0/previews/tutorial-journal-carousel-02.png",
      "before": "74af9e642d881ea20d8e21044d09fdf4388c3ddefb20e6d75b450bb2c92a6956",
      "after": null
    },
    {
      "path": "templates/step0/previews/tutorial-journal-carousel-03.png",
      "before": "4453100d145a31c5fd310b3ae1061377a67b62e8b92929a6c085d11c4c8da27f",
      "after": null
    },
    {
      "path": "templates/step0/previews/tutorial-journal-carousel-04.png",
      "before": "7e26884bf4c956d71aa6ca7e4c3da8f255fab2da8bb3f9d82c6adaf6159849a2",
      "after": null
    },
    {
      "path": "templates/step0/previews/tutorial-journal-carousel-05.png",
      "before": "2a2c8f53b17db9c5d1a52da3a5e9301b2360525e40d32742464edc046ac41f2b",
      "after": null
    },
    {
      "path": "templates/step0/previews/tutorial-journal-carousel-06.png",
      "before": "bb4dfd356d8a9557b558e882f2ddad6735c9ddb9fbb472b397a1f0b9882e8631",
      "after": null
    },
    {
      "path": "templates/step0/previews/version-diff-comparison.png",
      "before": "84f19935e2e41edb3ce6c9537d7dc0991f422644c3de479934cf4eb2cc4e0548",
      "after": null
    },
    {
      "path": "templates/step0/previews/weekly-report-lesson.png",
      "before": "0afd29c8799a885d4d509423bbd399c465c95bf802279bf1bfcc6e7c9715fbc1",
      "after": null
    },
    {
      "path": "templates/step0/previews/workout-breakdown-guide.png",
      "before": "28ae942953b201af9cfdf717c69b1b3f83cfcc1d5cc7351e4cc08ab6a7ddfd74",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-01.png",
      "before": "2ddcc40ada07a0f94ca01907ee56669e3f5434b3107fd03031800bfa8a8e9281",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-02.png",
      "before": "ad73b379c6385f2d0d754ca71547ed95a79b50c0ecbb7034833d1f852e6d87c7",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-03.png",
      "before": "74fedded73db01f55ab76bb809a15149a520b1cbb5c62b8af78b0aa0b4ae8058",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-04.png",
      "before": "17c21e599dc80540325206e177eda7d7df1fe71e08c9d2f0770d1e213a25f1e9",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-05.png",
      "before": "a9f7ac3a70840a249bf6212b4e9d332279363b0826598e4b756725ca53f5ceed",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-06.png",
      "before": "9840c3a9c13f1b72071c9aca59e45f8f27570b5c1e2c7b2d542cc73e03753a9a",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-07.png",
      "before": "beeb02ff3d320690fe5b0344d86b58450f2789e0a835252af4cd1376a52d84ff",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-08.png",
      "before": "e9f63c866305f01ae79f4cc8dd9ecc785193235a8133960ad46224a797d25413",
      "after": null
    },
    {
      "path": "templates/step0/previews/yearreview-mineral-carousel-overview.png",
      "before": "5ad27afbcb125c0498fbfec8cea85136940befad32961a985ead2dde564e4f8e",
      "after": null
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "9e3fec52567ff0bd604cb6b3e7ca3993cf4b6b3ac31b89437ce22e0e4c8b9717",
      "after": "2e35445f474cc08fea35108aeda9c4491b069bb954eba42548a3f11b067b7177"
    },
    {
      "path": "tools/export-i18n-catalogs.py",
      "before": "ee7978c167126282823c5f241696c724d0b275b2bcb5819f7870dcf5a0dc72c3",
      "after": "ed8f7a49fce26f4fdd34cd0f79a4111ed375e4b463b69d4872db0c340583878f"
    },
    {
      "path": "tools/stage-web-assets.sh",
      "before": "151faa46b7a0fcd9a9f15a491f967eb65183f3481a9bd017a79644516282dda3",
      "after": "8c55d32e82cc2133560dc3bd12ea14316b9faade1b978c30253b46d94c246d85"
    }
  ]
}
```

Completed-At: 2026-11-09T10:13:31.143015+00:00

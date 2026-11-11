# Improve AI component reuse and actionable interactive target quality diagnostics

Record-Version: 2
Task-ID: b04ae5d2-cd8b-40f0-9761-bd78abf26477
Base-Ref: ac066191a325d12ba59fa54e338e19a6d64885e1
Started-At: 2026-11-11T02:08:40.778152+00:00
Type: feature
Status: complete

## Context

Improve AI component reuse and actionable interactive target quality diagnostics

## Changes

The core Skill now teaches actual linked refs, reuse discovery, local override safety,
measured hit targets, paged rechecking, and reporting of unsuccessful repairs. The
quality tool exposes advisory repeated sibling structures and sorted, paged interactive
target findings. The DSH private-draft adapter forwards quality scope and pagination,
rejects mixed document versions, and does not turn every 24–43px recommendation into
a publication blocker. It keeps the existing stricter finding behavior for high-priority
and legacy findings. The plugin README, product spec, and existing architecture note
describe the adapter boundary.

Preview excludes ordinary reusable component masters; CanvasKit default screenshots
prefer an eligible screen while explicit master and page captures remain available.
Browser sync falls back to the host's engine-compatible document loader only when
canonical deserialization fails. A batch insertion aimed at a non-container parent now
reports the parent id and a corrective direction instead of a generic rejection.
Sync decoding, selection synchronization, and the quality schema were moved to
focused modules to keep source files within their shrinking line-count limits.
Prototype simulation now recognizes `nodeId` and `keyCode` as aliases, rejects a
click without an id or both coordinates, and publishes the supported step schema.
The Skill directs the model to compare actual visited/current screens with expected
destinations instead of treating a successful call as proof of navigation.

## Validation

- `cargo test -p op-mcp --lib`: 544 passed.
- `cargo test -p op-dsh-engine --lib`: 85 passed.
- `cargo test -p op-host-web --lib --features canvaskit`: 788 passed, 29 ignored.
- `cargo test -p op-editor-core --lib web_sync::tests`: 20 passed.
- `cargo test -p op-editor-core --lib preview_slideshow::tests`: 9 passed.
- `cargo test -p op-ai-skills`: 218 passed; `cargo clippy --workspace --all-targets`
  and `cargo fmt --all -- --check` passed with existing non-blocking warnings.
- `python3 /Users/franklin/.codex/skills/.system/skill-creator/scripts/quick_validate.py crates/op-ai-skills/skills/synapse-design`: passed.
- `node --test packages/dsh-node-runtime/design-tools.test.mjs`: 14 passed.
- `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 215 passed, no skips, after the final rebuild and without competing model jobs.
- `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/ai-design-loop.test.mjs packages/dsh-node-runtime/asset-browser.test.mjs`: 5 passed, including real CanvasKit initial sync, default and explicit target capture.
- In `ss-dsh-design`, `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=<staged-runtime> DSH_E2E_CHROME=1
  node --test --test-concurrency=1 tests/*.test.mjs` passed 497/497 after the final build,
  with no skips. Server/client TypeScript, `pnpm run doc-check`, and source ESLint
  passed (36 existing warnings). The final build used the staged local runtime, and
  `node scripts/test-node-runtime.mjs` passed.
- Built both `packages/dsh-node-runtime/build-engine.sh` and `build-web.sh`, staged with
  `node plugins/ss-dsh-design/scripts/stage-local-runtime.mjs <core-repository>`, and
  compared the staged Skill and both WASM binaries with the core outputs.
- `bash tools/check-maintenance.sh --base ac066191a325d12ba59fa54e338e19a6d64885e1
  --task b04ae5d2-cd8b-40f0-9761-bd78abf26477 --lint-js`: passed, with existing JS
  lint warnings; the effective-line baseline was only decreased or removed.
- Isolated `gpt-6.1-sol` customer-workbench runs used the same prompt and real CanvasKit.
  The baseline had zero masters and linked refs; the later run created one master and
  43 refs, with 350 auto-layout nodes. They had different design contents, so this is
  evidence of behavior, not a controlled quality score. The later run had 62 lint
  findings across 12 roots and four failed calls; one failed repair was not completed.
- A second isolated model audit started from the earlier generated main board with six
  21px-high targets planted in a temporary copy. The model found and enlarged all six;
  the quality tool went from six findings to zero, and the other eight boards remained
  byte-equivalent at the JSON structure level. The model left reuse as an advisory to
  preserve scope and honestly reported its screenshot timeout and unverified prototype.
  A separately collected CanvasKit screenshot is not evidence the model saw it.
- Model audit traces revealed that camelCase `nodeId` was silently ignored by the old
  prototype simulator. The regression reproduced `home` instead of `detail` before
  the fix; Rust and WASM tests now verify the actual transition and reject targetless
  clicks. With the final staged runtime, an independent replay of the six audited
  links reached their configured destinations (the first deliberately points to the
  current screen); this replay is separate from the model's unverified attempt.
- On a synthetic 4,001-node repeated-row document, three warm quality checks measured
  16–18 ms before and 32–109 ms after; this small sample is not a benchmark guarantee.
- An initial full Node run exposed a legitimate noncanonical-color sync timeout and an
  eager test error-message read; both were repaired and the five focused browser tests
  then passed. Two later full runs encountered four and three timing/browser failures
  respectively during high system load from model rendering and other workspace tests.
  A subsequent serial run of the affected `ai-design-loop.test.mjs`,
  `asset-browser.test.mjs`, and `canvas-theme-browser.test.mjs` passed 6/6.
- `vet` was attempted for both repositories with a $0.01 cap and returned
  DollarLimitExceeded before review; no paid review was run.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "unchanged",
      "reason": "The engine entry registers reuse quality analysis and tests; HTML import and authored geometry handling are unchanged.",
      "sha256": "1b504433430fc63bd7e0d2084225fc881aba090f01657055073f33eb57a08c5a"
    },
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The Skill now requires checking prototype destinations; product scope is unchanged.",
      "sha256": "631fd9f6f66c1781691c78af2d96d93f6be88fbb37873b7cac4b5f269837c18a"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document simulation aliases, required targets, and actual destination checks.",
      "sha256": "577e5b90e5b7078fa169e3d7b91a03dd705c8a2d7d7b5a882c2d2b017c0d30b6"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Reuse results are limited, advisory structural matches and can include style variants;
they do not infer shared behavior. Target checks cover only recognized roles and
click/press reactions, not every possible interactive layer; 44px is contextual
guidance, not an accessibility certification. Model behavior is nondeterministic and
the isolated samples do not prove all design, screenshot, or prototype paths.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/phases/agent/design-agent.md",
      "before": "e4920d7cf2f0b64ca8b1e7bdb6a027e1e2c6a06a41da01c18d56026714a8bd55",
      "after": "d655b8b442b0b2bad631ffba6a84bc4736a1b03f514faf45ff8f3eb1e91ac36e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "b6d9487d99c0f1c0133f1e2a5d7115a21727ad69c4e216422acd421e47aa7a40",
      "after": "c33b0f0b3c304725ca9cecc7f7a2b69b51d6095c9d34f0187a2df7f3fdaf9ac6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/composition.md",
      "before": "0641330452ce084e30c74e185e1107888549b082d0e2870c280d5065916af229",
      "after": "72a9dc09ae6469bc5d24cb973039fe78c35093ed4ba75fe76459b97b7e33f4b0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "6b6d2054a17545a206fb77e5269182cc22b691f0804b17d0c32533c5db6b8295",
      "after": "2012c993e71682c766e538ca7b97957f367e6a723593bc3a042824181f802997"
    },
    {
      "path": "crates/op-dsh-engine/src/lib.rs",
      "before": "03ec3ad623459dd738fdee0a284e1bd15516daa5e56503fae040f76d60736bdf",
      "after": "3610d050386b7a649db82f2a0701c3e10077b51f488e1f92c6bb07f9de487ddf"
    },
    {
      "path": "crates/op-dsh-engine/src/library_tools.rs",
      "before": "4788aebfd89c86fa91fc3968aa01a78f467b01634e5c9dd66f955866e0e0a755",
      "after": "51d6b1361b6cffe37480b339dff1d7548f73c7e0ad31558479504cc47d67be37"
    },
    {
      "path": "crates/op-dsh-engine/src/prototype_simulation.rs",
      "before": null,
      "after": "6cc243135be5857eadfd0a34e2b501ef1f6963e9d8c7fbf05c9fc0457480814e"
    },
    {
      "path": "crates/op-dsh-engine/src/prototype_tests.rs",
      "before": "519aee30aaae8a3d7d98354db539b188b34d9da84f77f05bc5dceda2974c8e7e",
      "after": "61b1f38574603546fcdb0529b7d9be4dd1ea2553ff3b4491931f80876da4b0d5"
    },
    {
      "path": "crates/op-dsh-engine/src/prototype_tools.rs",
      "before": "a29e9a4ced2dbdb447faa286f30b142b6d675304e08f0982bdfc6dde24e640b1",
      "after": "d906208d1c2bca63a328d34b8beb47cc28b9a44ac5ab5e4de4e3e380a0f4d82d"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_reuse.rs",
      "before": null,
      "after": "660a9ac3c3668ac7974e39af915c920e7f95641b5b175f40b18a3f5babc464e4"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_reuse_tests.rs",
      "before": null,
      "after": "400dca17e25930bcc8112198d03befefbad82a5bca19ba3a7edee975e9f62f56"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_tools.rs",
      "before": "77c31f768a521a8df59fb17175526bf39b2f9d06028bf0ff577e2fd45f98167a",
      "after": "1095a19f8c89efef6e8ee0bb0f6951b7c68d08992e90572db801bc0e186390de"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog.rs",
      "before": "30e3ea4b0c54d39a66ac1be8ac478b08c5d7a028c88a069b294890d2c2d0ad28",
      "after": "288c16701c55c0caca5778856069e5202917cb1193fec2e2638bbb03ff92b7e1"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog/quality_catalog.rs",
      "before": null,
      "after": "da2f71381fabd64fd75d819c5b40ecfb7e003523452e66b5a5f31be32ab3d566"
    },
    {
      "path": "crates/op-dsh-engine/src/touch_target_quality.rs",
      "before": "0056a49ff93de654c5848f5448b78109bda2b9be485176ace9e3adeaad440cbd",
      "after": "39e1373caecefb8aef60ae8f2853da860227aa864c73cd10bab4e265d42e0a79"
    },
    {
      "path": "crates/op-editor-core/src/preview_slideshow.rs",
      "before": "28bedbd4987cbc563acec7dd6b6c1de7fb47bc77539485838481854ea5a99421",
      "after": "33967d4a83a2d91ea35188a4845863818bdcbcf47a0c062ca39811433a380421"
    },
    {
      "path": "crates/op-editor-core/src/prototype.rs",
      "before": "7ce72a9a0897a581daa101eed9abc0d3d375a0ca4481dcc9dc658c3d504984c4",
      "after": "2f38e0d1f2f31d9fe7ca606b0b3d55bd25d3b976e1933f0cfaa8f7b243f14a2b"
    },
    {
      "path": "crates/op-editor-core/src/prototype/graph.rs",
      "before": "106592f85da5899e504f0c47e568279dec8be2e461160befd6e40e977fd28d21",
      "after": "7351bbf8dceb35feda8f323d97e274f6ff5c7539e12774f8df0002a4b9f900e5"
    },
    {
      "path": "crates/op-editor-core/src/prototype/player.rs",
      "before": "0d3bdcf50317a65636c7942ec5b040d55402e51af322d039a600defef0eee62f",
      "after": "e60f9bd9999bb9cad12ef345af04e611981ee2db122cf6256925918968c1edb9"
    },
    {
      "path": "crates/op-editor-core/src/prototype/simulate_types.rs",
      "before": null,
      "after": "5021fd46904cd494d8b845e224ee91dd45e79bfe75724f25884007bfa658dc9c"
    },
    {
      "path": "crates/op-editor-core/src/web_sync.rs",
      "before": "3bdc92ea5bfdd145b5809c0bf6758a775e954b4aae0e0e30e155c19580444116",
      "after": "1254e5f3362166ae586a41d6b6fccaedc3d1c215e21fc9306a080bf258fd6b37"
    },
    {
      "path": "crates/op-editor-core/src/web_sync_document.rs",
      "before": null,
      "after": "e8ca2070aa8b4249c6ce2e68c7693e9f86ce380b13e2b203ae6c698752da696c"
    },
    {
      "path": "crates/op-editor-core/src/web_sync_tests.rs",
      "before": "478ce422b83f4cbb5d202053be9526677d7956d82a9eb98eb96760eb3790abc7",
      "after": "866408b35ab24c9310d7c3ef43a309881a32313b873a37da6cc3e9bb160dbc89"
    },
    {
      "path": "crates/op-host-web/src/live_sync_document.rs",
      "before": null,
      "after": "fc5605742a47aeef1628bcd2b05e376281b9c8f8e72412b4f13216fd0871a25f"
    },
    {
      "path": "crates/op-host-web/src/live_sync_glue.rs",
      "before": "05029e909c98e92fa9c463eacf5d16bfe92e91c12b623366f1662cea5ac27477",
      "after": "b9f40e8fa63bd2a15a3da359444ccac9f919ee7b4e980dc72040a22689d7f0b0"
    },
    {
      "path": "crates/op-host-web/src/live_sync_selection.rs",
      "before": null,
      "after": "168e1bded56d037a6f8f4d883b9e9626024cf44aef63c8ff763eea2b7e9ccec6"
    },
    {
      "path": "crates/op-host-web/src/widget_host/screenshot.rs",
      "before": "501416e820e6ce9d9c3c51f13e9f6982a648ba60b60c0a9f28b350a76885ec27",
      "after": "7f6a4dd70f24900fac96149e837fa93643991e08f85dbc688c534fcd2012550a"
    },
    {
      "path": "crates/op-mcp/src/batch_design_result.rs",
      "before": "02570bf0bcdbdf3baa059b94ab10383c472c27d6caf05e413ba0f46138d9e32b",
      "after": "3d0b2def64a696774d7cb55d79560eef0e48536d409d0e3561d1e0aa2df80898"
    },
    {
      "path": "crates/op-mcp/src/batch_design_state_tests.rs",
      "before": "0bee01589a86d7390777bd12e139e9a6beaba68a8c2573dc339e6f31c824c6e0",
      "after": "7010c8289dbfe16a136cbf2ca77f7c64da94aa0a4518dc549909069206977abe"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "60094aabe11571dd663e9e0cf41e155903a355da20a88f38822c4edc88f79f6e",
      "after": "d47052bb76b201ec7b6485d63bc3fc6056e35e9c6fe692cd46eabed8cb81f833"
    },
    {
      "path": "crates/op-mcp/src/render_screenshot_tool.rs",
      "before": "ee968a604c5ab5265f9f008def27457fe7260e85ea8d543f871f73ba2e2a5ea8",
      "after": "f22e6fd15f3ebd97260382f18f1f6475455f74bed95a11efcc4c1bd9dd4a08a6"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "a7cc726babf372721ed08e138c475aba7ffd0604180eefe9f382498c2f38ec7f",
      "after": "1b504433430fc63bd7e0d2084225fc881aba090f01657055073f33eb57a08c5a"
    },
    {
      "path": "docs/kb/product.md",
      "before": "0c36bc985e469d80bbca43b0c0c0fd49e9b0891d4f361cff0a1238b72d57473e",
      "after": "631fd9f6f66c1781691c78af2d96d93f6be88fbb37873b7cac4b5f269837c18a"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "dd70bcca6160c11527f85f0ae2435a8f65f55eb5e99b983e5124f06e31cd90c1",
      "after": "577e5b90e5b7078fa169e3d7b91a03dd705c8a2d7d7b5a882c2d2b017c0d30b6"
    },
    {
      "path": "packages/dsh-node-runtime/ai-design-loop.test.mjs",
      "before": "f640a2169d729b6a65702ac5e55dc4793485afca0ccef7a0861835e8f7ebeb85",
      "after": "b9944ccecf2f390a273931a476bd6a32b36df3e25c8061038a09f7a31692cb1e"
    },
    {
      "path": "packages/dsh-node-runtime/asset-browser.test.mjs",
      "before": "c44b799b5a9d4c99d15bde7366f05e5849adb43ed9f305e32d8ddf14715bd7d1",
      "after": "8f6db793c69a259589e49618c3125902f7fc911bd945110a99ab14594952138d"
    },
    {
      "path": "packages/dsh-node-runtime/design-tools.test.mjs",
      "before": "2db8aa6d74d04c335e839880738dd3f961949efb361e2d5f4b78c7e7dabf6f67",
      "after": "e9e25d0d6b08b66006542a9d760b07526e9518076f577a29455f10a87acd3180"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "702c3f8a2ccc2f1728cfdf84c1ee9ddc8e94bef3a1f799c6031302ed3d9b9829",
      "after": "b5d80ed27548dd4052c0a599c923d18164bdf9d4075f49727c48c55e3b21c2e4"
    }
  ]
}
```

Completed-At: 2026-11-11T04:19:25.495428+00:00

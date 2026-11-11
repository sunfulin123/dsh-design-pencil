# Migrate the complete HTML design skill into the core runtime using the shared style catalog

Record-Version: 2
Task-ID: d42be662-cdbd-4c31-a79c-e892b6b51227
Base-Ref: ac066191a325d12ba59fa54e338e19a6d64885e1
Started-At: 2026-11-10T14:28:30.622444+00:00
Type: feature
Status: complete

## Context

Migrate the complete HTML design skill into the core runtime using the shared style catalog

## Changes

Migrated the original HTML Skill's non-style references, scripts, templates and
research data into the core runtime, with a source-hash inventory and upstream
notices. Removed the independent theme and fallback-palette paths. Split the
large inherited HTML checkers into bounded modules while preserving their
diagnostic entry points. The core Skill now shares context and style before
choosing HTML POC or editable Synapse; the host returns the confirmed full
DESIGN and its hash for either route.

Added evidence status, source/screenshot invalidation, real Chromium POC
capture, and a scoped native quality report with typed-variable diagnostics and
limited observations of unbound matching literals, local component overrides,
and uncertain values. The report keeps legacy fields while distinguishing
checked, unsupported and indeterminate coverage. Corrected an aesthetic warning
that prescribed against the selected brand's gradient.

Real-model evaluation exposed missing batch input descriptions, an optional topic
schema for a required runtime argument, and misleading truncation from informational
token observations. Fixed those contracts and added regression coverage. Follow-up
review fixed HTML evidence inventory invalidation and encoded installation paths.

## Validation

- `PATH=/Users/franklin/.cargo/bin:/opt/homebrew/bin:$PATH bash packages/dsh-node-runtime/build-engine.sh` and `build-web.sh`: passed. Initial attempts without the Cargo bin directory in PATH failed to find `wasm-bindgen`; the installed version matched the lockfile.
- `cargo test -p op-ai-skills`: 218 passed; `cargo test -p op-dsh-engine --lib`: 76 passed; `cargo test -p op-design-lint --lib`: 257 passed. `cargo test -p op-host-web --lib --features canvaskit`: 786 passed, 29 ignored.
- `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 208 passed, none skipped. This includes a real isolated Chromium POC capture and the actual WASM quality tool.
- `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets`, and `bash tools/check-maintenance.sh --base ac066191a325d12ba59fa54e338e19a6d64885e1 --task d42be662-cdbd-4c31-a79c-e892b6b51227 --lint-js`: passed, with warnings retained. Both Skill frontmatters passed `skill-creator/scripts/quick_validate.py`.
- Original and adapted HTML diagnostics produced identical results on app, page and component fixtures; the copy checker also matched on an isolated fixture. HTML migration inventory and evidence tests passed 9 cases.
- The DSH plugin staged the local worktree runtime and built without a source override. With `DSHPLUGIN_DESIGN_SOURCE_RUNTIME` pointing to that staged runtime and `DSH_E2E_CHROME=1`, `node --test --test-concurrency=1 tests/*.test.mjs` passed 494 cases. Plugin typecheck, source ESLint (0 errors, 36 warnings), `test:runtime`, and documentation check passed.
- The first plugin suite run without its source-runtime fixture failed to find `/nonexistent/wasm/design-skill.md`; rerunning with the documented source-runtime environment exposed one outdated test that omitted the new route choice. That fixture was corrected and the final full suite passed.

- Follow-up review: `node --test packages/dsh-node-runtime/html-skill-migration.test.mjs`: 10 passed; `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-skill-browser.test.mjs`: 2 passed. Tests include added source files and installation paths containing spaces.

- Final review validation: core Node suite with `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1` passed 210/210; plugin suite with the staged source-runtime fixture and Chrome passed 494/494. `cargo test -p op-dsh-engine --lib` passed 79; `cargo test -p op-mcp --lib` passed 543. `cargo clippy --workspace --all-targets`, format check, maintenance including JS lint, plugin build and runtime smoke passed with warnings retained.
- Rebuilt engine/web and staged the final local runtime into `ss-dsh-design`; a recursive comparison confirms bundled HTML Skill resources match core source. No user application was started and no code was committed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "unchanged",
      "reason": "The engine entry only registers separate token and variable quality modules.",
      "sha256": "a7cc726babf372721ed08e138c475aba7ffd0604180eefe9f382498c2f38ec7f"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "The unified skill now recommends bounded document reads and the core POC capture script resolves its runtime dependency from either source or package.",
      "sha256": "0c36bc985e469d80bbca43b0c0c0fd49e9b0891d4f361cff0a1238b72d57473e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Review added source-inventory invalidation and default local HTML scope.",
      "sha256": "dd70bcca6160c11527f85f0ae2435a8f65f55eb5e99b983e5124f06e31cd90c1"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Real autonomous-model comparison completed using gpt-6.1-sol, isolated Node MCP
hosts and actual CanvasKit screenshots. Evidence is retained locally under
`.synapse/op-design/evaluations/real-model-20261111/`. Each scenario uses the
same paired prompt and Talkdesk Cobalt. This is a single pair per scenario,
not statistical proof or DSH interactive-chat acceptance. Table diagnostics
fell from 23 to 15; chat from 94 to 45 (layout observations 17 to 0), but the
new chat has 128 advisory small-target observations and used English content.
POC retained all 57 text nodes in both outputs; RGB mean absolute image error
against the 1440x900 Chromium reference was 3.070 before and 2.830 after.
These pixel differences include font and renderer differences, not just defects.
No sample created reusable components. Quality is mixed rather than universally
improved. A first new-chat attempt timed out after a deep document read and a
stream disconnect; its evidence remains in the temporary evaluation directory.
POC attempts with an incorrect CLI image separator failed before model execution;
the harness was corrected and both cases completed. No scripted tool sequence
was substituted for autonomous generation. Optional inherited rendering checks report unavailable
dependencies rather than treating absence as success. The upstream composite
Skill lacks a single top-level license or complete provenance map; inherited
source notes and checked upstream licenses are retained, and external assets
retain their own terms. `vet` could not run within its configured spend/auth
environment; no paid vet model call was made.

## Changed files

```json
{
  "files": [
    {
      "path": ".gitignore",
      "before": "6e5e48032c3b711882992b79dc4e47f37467d63de72cd78105f2cd03b3f0532c",
      "after": "ffd4989f8a9d439316d58ea1f190117f7903b3e4003c1dcfbb7d991ac52f3b97"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "77a05ff6541b63ac376fd2cabb8f5c2073888d2b4299ea231fb28f532a64acc8",
      "after": "6b54338f0f12dbfb897ccd2a1558f36d2da383e10a1008a9c9f5b73b869756f2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/THIRD_PARTY_NOTICES.md",
      "before": null,
      "after": "934edbec42d5d7c328d26f0bdd7c40c91a0e8faf40d0a4a1eb28fa0f243b08b9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/assets/icons/index.json",
      "before": null,
      "after": "fd646a71d8c0c4ff611a9663cc9a13cb6b36312379ce7e48e247b031d74ed13a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/app-interface.csv",
      "before": null,
      "after": "2a17ef810dab715ce1f339861817a8fbe3ccc38142b70517301e874803e838ac"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/catalog-summary.json",
      "before": null,
      "after": "3df6accf58451602b09a2c14dce9ca4c34101a5e7179eccea2a62a914d0967f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/charts.csv",
      "before": null,
      "after": "ebb565308115f955791b0431797a89d9b3587c25d5babb9428d10712c4924817"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/directions.json",
      "before": null,
      "after": "7ac510d8481ee76e0c5a2e9303943f741d015f9a07ad530a98b77278777b4102"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/google-fonts.csv",
      "before": null,
      "after": "2c03a3cd134d126bd9d6a7dc2a6360dc5272219ad6df3eb9315b031f806e1487"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/icons.csv",
      "before": null,
      "after": "6a6accaef3ff598cfebacfe40fd1298bd2092fe2bb5939d7de9670c674c55331"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-barrel.json",
      "before": null,
      "after": "9b10fe7a5527fad8ef9ce51a90791afba0b3a8b72fc7c6f4acfea54e3cfb9855"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-biped-walker.json",
      "before": null,
      "after": "55dbefe5e49064e9765d035ddc62ac432fa71fb1aca0a0fc820f925be3c3c372"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-cart.json",
      "before": null,
      "after": "01fbfce65d7ac2a75cfc9b92176c703e19fd16187cbae331f93406c631c95ca7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-clothesline.json",
      "before": null,
      "after": "5641b42cf06aefe7d390c062d63c06bcd07c7b74a094aad7505ef88e12c620f1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-crate.json",
      "before": null,
      "after": "ea437ba9e134c9afbb0f085d1c8bd09baf81d9f3cd7e22d6151b6ae630f9faa9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-fence-run.json",
      "before": null,
      "after": "21a1aee553369087a71ee7302fb0e170597712b4ae0d5bb30ed3ab92dc2928af"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-iron-lantern.json",
      "before": null,
      "after": "eee6ae03e03c118216f6e3de57b871c5424502df4c8348baa249c4e26ab0cd14"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-lantern-post.json",
      "before": null,
      "after": "610b6a474a1a0b5d543a43cce752a331370a52cca7a1eeb59e2279848e60bfd9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-long-hall.json",
      "before": null,
      "after": "475f9693db047a1677ef922e095f5430d424fe8c4ef62b1e3602a10e21d1b597"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-market-stall.json",
      "before": null,
      "after": "346bc0f967c18dff56e7e6756862d6fe25db68d66a63b0028eb94399580bb2a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-quadruped-walker.json",
      "before": null,
      "after": "9e5d17794a3984a99f0d45dae96c61110482a9b59dbab4e07b7e629f9076bed2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-reeds.json",
      "before": null,
      "after": "6780b0ed7731da4af7c3ed9680773f87dd08f10a0551a5ce5cd58f0278e19069"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-rock-cluster.json",
      "before": null,
      "after": "7d9709d0c84aa18710dc131fa68d753ff571973f0446f93dd5adf55cf022efd9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-round-tower.json",
      "before": null,
      "after": "cc228876ae5e04ca3ef2d4c1933340211fd25e507edad104315b2caa5396b3fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-signboard.json",
      "before": null,
      "after": "43a9a9e4c0b8f4718f4131d1ed3daf7577318c54ebc13ea3f377cec65f14f690"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-stone-bridge.json",
      "before": null,
      "after": "6b90697912a5a3bf37be78ff3a517a6f553d112b9f2f2358bca4112b986b6fb0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-stone-guildhall.json",
      "before": null,
      "after": "050b1d549d71fc5ff2f724181b884cf978bd419b57cde1d25d7bd52fba672264"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-timber-cottage.json",
      "before": null,
      "after": "82ecf3c663e40fd0119e3f4de93d68757256353cd6fc389e63f0a23ffe0ffec5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-tree-conifer.json",
      "before": null,
      "after": "dfa68787a75e55c72e8194a0184701940aad6b873d8cf60cc723f8d6bb737140"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-tree-round.json",
      "before": null,
      "after": "835db0ad8847db40bae0de13fcac800731f3af1a92acb529f0d731fcd07f4ad8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-watermill.json",
      "before": null,
      "after": "1f75eb931730bc0733d0ab72d4e4248f077ff94602fcab519aa954c595754143"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/blueprint/blueprint-well.json",
      "before": null,
      "after": "d8707fd19a7cca8c9f634a11948a0db6416a85f184bdb2d4d81523d2bbb5306e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/camera-orbit-follow-rig.json",
      "before": null,
      "after": "99f4b504f438a5691e4a42985c0928da3102e0d7b64d0f2832dae3f4719a9438"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/comparison-stage.json",
      "before": null,
      "after": "63913f30cef8e064f657f10134c9de77397ceecba7317bde313c165c25c1f96c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/hero-and-context.json",
      "before": null,
      "after": "1a1ec7a60bac2cb3804d2c3665e101181d03b43b09b71ebc9f3e6fd28177e96a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/linked-spatial-small-multiples.json",
      "before": null,
      "after": "ff7b6b5fd0615ae9d026dc2aeb748060c7e27ccd9fe9b514db16d1ab732a42c1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/macro-to-micro-scale-transition.json",
      "before": null,
      "after": "517ca35b167b4102f914370a921b8e005632135fd98329fd9d255a7f2ca5b6ed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/navigable-density-rest-areas.json",
      "before": null,
      "after": "15aa9a206f47a739bc166b4e811a9f18f31b086e9dfee41c3d537b0e1daeb76a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/sectional-depth-composition.json",
      "before": null,
      "after": "ed16723686fbdcb48a0725fe89fda851a0371ae15b81ac3bf42fdb96bf0cc9db"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/composition-profile/terrain-landmark-rhythm.json",
      "before": null,
      "after": "f149af6887b15906f6dca8e5c368652ed989fd736883c05db97dd61b92f50dac"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/cf-packed-field-decoding-validation.json",
      "before": null,
      "after": "c7067cecf4d29438cb6ac69462353af3638f2a28d77ed2add532a453cab3d8fe"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/periodic-molecule-image-validation.json",
      "before": null,
      "after": "b6fbceaf2d03df9a2b37881b1a2c2e4024c358663b994b816afa88df1a598f2f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/segmentation-label-reference-grid-validation.json",
      "before": null,
      "after": "8e185ab334d32d64af9ae8f2752dcfcc4453251248e327138e4c8d21f8a4a35c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-analytic-decay-rate.json",
      "before": null,
      "after": "752eeaa6b116d9850fdc2018ad27530dc90b6a7bc94ebe26588165a47d4a5716"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-anatomical-orientation-frame.json",
      "before": null,
      "after": "925c72710ed6fa7ebc3120269034c96cdc205ffba6fc0c38bb7d80a0f7d41852"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-basis-column-correspondence.json",
      "before": null,
      "after": "17152ca7d72233060bcfdfdf81cfea85a3896f9a0b45941dae7d624f7373400a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-bfs-layer-invariant.json",
      "before": null,
      "after": "43228b1b2c2b3b3b176ef51b719ea9267e707bba298980cefefb7d699d7cca76"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-bond-angle-measurement.json",
      "before": null,
      "after": "c72c21ff6973190dd67ea4d4bcd504bbc9f3f2a9517aed5a289ffaa4440bbd15"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-bond-provenance-not-distance.json",
      "before": null,
      "after": "ca3525a1dd3fc1c292d7e2405367cb57f6df56c34f1aa088bd9de56fd4f59e37"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-clash-query-scope.json",
      "before": null,
      "after": "1007ad91630206192e3778ef9efa0f7ffab1ceff328cc4164ba56fc23bfb0d00"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-clock-commit-boundary.json",
      "before": null,
      "after": "21ea7b1bdec91a874f2c6c73b226410a37227cc7c35873e025e2b50c6dfdf1ee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-command-feedback-odometry.json",
      "before": null,
      "after": "9b6d889c2f0c28df8c1a05fec05562e9f55f8b63e7ad2c78fae786fb99680c2c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-constraint-ratio-kinematics.json",
      "before": null,
      "after": "32a523a484e0520b9cd05584a72d6b867c423f9d238aa537f6394f773991c13e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-contact-root-selection.json",
      "before": null,
      "after": "e16605c40117d34f0dfe402bd42770f705ece208faf98dfea1d5358bff734f03"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-contour-extraction-residual.json",
      "before": null,
      "after": "99687a081b4893fe8e2763f7ab9da0c9484d347ce0b969c92a06264fa93a096d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-density-versus-area.json",
      "before": null,
      "after": "3a5d69453b5575113f958c5c6d5b4bce77a8e463eecd57db60b5a8c156215b1c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-depth-pressure-shape-independence.json",
      "before": null,
      "after": "9a032f6f0aa550016e3bce28e795efb7c3ea98ffde357be6a2c003921f7bed3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-determinant-conditioning.json",
      "before": null,
      "after": "4a92a37c384a37f2b874ce94d0be2bb7c77516043621ab1b5308910650223245"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-discrete-event-ordering.json",
      "before": null,
      "after": "15afa59a040056d9d32120e65f2f49287962c8a2aae5d673525b023b5b102336"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-discrete-occupancy-exactness.json",
      "before": null,
      "after": "74921a8bd90b9278de0d1ce06ec67bfb20847389faf9ae21337733e9215139d3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-documented-versus-interpretive-layer.json",
      "before": null,
      "after": "22bc3a084735a1bde83ef531f33581c0d5580bc1c2531058014791889ab0e25c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-drag-to-cell-commit.json",
      "before": null,
      "after": "d868adf9d6b02bfa9ac1c41ebab8023208bd0cad176b5679282375e2d8d418e7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-estimator-scaling-and-seed.json",
      "before": null,
      "after": "e7ccaed55a7732080fae1f1364ef04ed0e0d5f1568333fe96400ba50e033b76e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-euler-characteristic-count.json",
      "before": null,
      "after": "a90745cf2642ef85a17d223bd3f9f3c7a489e1fb5e74b5f8149880b8426c8c50"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-evaluation-order-independence.json",
      "before": null,
      "after": "7379b2b12e0124595ece65badfed13001380588c02d7a3355525fd56f8fec2b2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-exhaustive-truth-table.json",
      "before": null,
      "after": "f99d803fce841d95f9f9c70715c6e6f1b2dbdc583d0328a35a9dc81e7bc8a06c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-explode-rest-restoration.json",
      "before": null,
      "after": "fe82f19a9ba539736e6da153c47b17900bbf2b38fd44bc18d468c8e3142a39f0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-filament-band-conservation.json",
      "before": null,
      "after": "5ec9f8426fa1c4ee796f52c4fac8918ba783be2b59c34fa546213efa3ecc2a82"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-flux-divergence-balance.json",
      "before": null,
      "after": "a1de89948aa20e629dadd5e13ae90d35189c5b6c53f3ebcd6b0d5944e3decea9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-footprint-sweep-clearance.json",
      "before": null,
      "after": "51096b07150fd2659fc3ea1daea72b0bb4c7c0e69b4623c3cea3a70f66318570"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-forward-kinematics-home-and-links.json",
      "before": null,
      "after": "765f981172e661e9aebf1d68eaf902e02e329daa40013d975cf5c2aa7cc01cb6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-frame-handedness-orientation.json",
      "before": null,
      "after": "6097f882a35b074d4cbf989efc0a8f8b965baf33ae48ea7c65572f2fff649273"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-frame-transport-nonorientable.json",
      "before": null,
      "after": "91402116393f582c0122db220f314ee5f26946fea4e94eb4e17edfd235006686"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-gesture-move-arbitration.json",
      "before": null,
      "after": "c829d4ff616ce3c3edde8458690b312f0c29736cf70c22df64e3b82384c7bf8c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-gradient-finite-difference.json",
      "before": null,
      "after": "6b0325e040e37d8d66882c4526b50914b63c09b9dfce5ae8503b9333d07d2802"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-graph-evidence-coverage.json",
      "before": null,
      "after": "c233bac84f4486609cacc5d9f37838471ea2e8ee0960efea329b5a2f480a5154"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-graph-move-and-hint.json",
      "before": null,
      "after": "7268da9284f571adf9119d3f0cec4b273079a7730c9b8ffe5145088d9abf27a4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-group-closure-table.json",
      "before": null,
      "after": "083579445dc5cd6de2d0d57121987b8e07da3a8b39c115bc5f46047f18287dd1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-ik-convergence-reporting.json",
      "before": null,
      "after": "22f740dec3286bccc870f9ce39aba820cc218fde7fb8c88db0e222b252a427e0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-illuminated-fraction-phase.json",
      "before": null,
      "after": "80a5be7056b2eafa9f9f6879e4b26d96908fa78705cceaf33c08bb449c415f98"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-illumination-geometry-tilt.json",
      "before": null,
      "after": "3f6186c163932848ba2e209f4a463a5fa2110f28f4ca6592984d0066b4ff7298"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-implicit-surface-residual.json",
      "before": null,
      "after": "6d98ca88584d85a512207403578213865507fa02d5dd20a2611acef594a99b45"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-integrator-energy-drift.json",
      "before": null,
      "after": "d90eaa555d65aec0dbe4e6931d4229ab1f5f096900d5b307f604864a691c13ad"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-item-conservation-ledger.json",
      "before": null,
      "after": "1b43bc5318690f87cec29ba6e562486d7b5d9b0ecb61c6caaa39a7a3e5be64cc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-joint-limit-rejection.json",
      "before": null,
      "after": "687824cfcf7b09d867fc979300b46b4405444c4af468ca52dcd7993cdb4627c1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-kepler-solver-residual.json",
      "before": null,
      "after": "cb6b6e7a9789e9522b5a15e00a88aba52f96196d0a34144a189e16493972011e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-lattice-site-accounting.json",
      "before": null,
      "after": "bc8bc74ca1755f3615e667f3c04044f7d23493dfa6d1822e31d7a39f1b24bc0a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-mode-sampling-and-nodes.json",
      "before": null,
      "after": "8be56a4c133bffc7b5f88f0f3b0ce9e4f10edbf8baf05b33a43ef192c8fa7aca"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-move-inverse-closure.json",
      "before": null,
      "after": "b5207457cf0a88ab7ce7b01b24eb8f862b0cca3e22dc0b7d27a03cd952e0ac60"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-partition-tiling-signed-sum.json",
      "before": null,
      "after": "8485474655ebb798add79f2901c0e32222d213cc5fdb56257a9fd213ee1e9544"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-permutation-bijection-cycles.json",
      "before": null,
      "after": "08efc8c5148f1b57d17ccdbf507e2a3d70b1e1bb241d8bfffdd7efd8f003de7e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-pose-silhouette-legibility.json",
      "before": null,
      "after": "b537fa1612007d02667bd4b2a541bb9ef68203ad269d4fa095953d944a991afd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-prescribed-rate-age-distance.json",
      "before": null,
      "after": "0e63c8119ddce4debeef5f2f216613239d4ecdc2a32e4a150f9fa67f5837c2b6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-pressure-flow-sign-consistency.json",
      "before": null,
      "after": "17789b96a2cfae2ad8d7673996cf3cf6cd0bef7cb4d18636820659273ceaca98"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-probability-mass-normalization.json",
      "before": null,
      "after": "054097ed506231c6e5957cde4d671af5f4d3ab1286304d435f7106dccf7ef2a1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-projection-overreading-guard.json",
      "before": null,
      "after": "2e219b1160e4f7b9e328928fd6ea4d637013895e6efb4f47f979c0391d79a3d4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-radius-power-law-scaling.json",
      "before": null,
      "after": "579350daafeff2edefecdf9d965499525559b7082bc80779270528c08be0febd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-refraction-branch-handling.json",
      "before": null,
      "after": "9098679fe90cc536bbf8fd7140eea72cd65bc080757e96408b2c857c11cd88cc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-relaxation-monotonicity.json",
      "before": null,
      "after": "22c05d726b4263c581cd73e235ca809d272b6cfcaedc569b0df2ceeb5cc57455"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-resource-exclusivity-blocking.json",
      "before": null,
      "after": "255532efcaf6e9c7b4df3c552ca7313f7e6572b6685b8a7c42574eba4f8a213d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-scene-scale-depth-budget.json",
      "before": null,
      "after": "39f943fcd28f6a6a6e1e1c59ea1d67e70e54b0a68aac5e7f195e2cc2a9ad254f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-scrub-pose-determinism.json",
      "before": null,
      "after": "c3ae12d2b410954efcfaa01780dedfb11e2c4b5d5c40505004fbe1b4f661f248"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-section-flux-conservation.json",
      "before": null,
      "after": "95467748c6d072ba6530cd76d787af778ca5b2db9b14ab78a4f5adec0dfdd55e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-section-plane-dimension-invariance.json",
      "before": null,
      "after": "f2a4a4c98fb8a6893de44130e0bc0eaf2b21f111eef4735d31161cfc643a6997"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-singularity-exclusion-superposition.json",
      "before": null,
      "after": "0c14f546af0ab5526b1033e5c13a48f52acb2cf323f87d1fcf61d014460bde7b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-slot-occupancy-integrity.json",
      "before": null,
      "after": "b7ccda8d66e23f59f95f7c90409ae23e0ca579b3c95a2471ebbc8de05f384425"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-small-angle-approximation-bound.json",
      "before": null,
      "after": "f370cb090e580b1c9b320a0cd19c80e86b0d9918aa7344222b4e8ffa702af708"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-sort-multiset-and-stability.json",
      "before": null,
      "after": "a5d85e55d5ed6549ca43f4bccda3051b8df1439cb756bb610d47d4a00eb1b20c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-stance-foot-slip.json",
      "before": null,
      "after": "34a6cf02b2228a393802792208edbb65063afc20a0e0619a0ad717d6cc59d463"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-structure-identity-persistence.json",
      "before": null,
      "after": "e212832c77d5f394e5b3f4124dd2687795241af44bdd8a7d94356233defe4a14"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-structure-naming-attribution.json",
      "before": null,
      "after": "3ac9b3dcb7477b75ed3231b2bfcf4ee586a7de72b5dfacdc39e4e2c7eee963dd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-trace-causal-ordering.json",
      "before": null,
      "after": "25bddba69bf78eb0026c86701687e798f333662114f9f0e52450619ffb41511e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-traversable-support-clearance.json",
      "before": null,
      "after": "9afed568a4eda7f39b109375eee53e407828911566523794546386b68712fc13"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-unfolding-hinge-isometry.json",
      "before": null,
      "after": "38bc11104e9d1dc87de956066201f4b475394acb0fa2aad06b207196a065fd97"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/domain-validation/validation-volume-quadrature-versus-mesh.json",
      "before": null,
      "after": "97d5849cd5eeb3dc0bcb733b16f38367edb9f83ede627134b380ecba11578f0c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/hard-surface-bevel-normal-contract.json",
      "before": null,
      "after": "e032d6f86fd97b557789f27cfb85c8c64f3d1f35e3567e79a6339fd0db2453e5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/lod-screen-error-continuity.json",
      "before": null,
      "after": "88b48427c726adbbb3095704aec19b42017bba30c7656e5d54899379fed3f8a3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/morph-target-topology-compatibility.json",
      "before": null,
      "after": "868d9c8b905e96168623694ba35970ff52ab4ce4aea1948cdf0125c51fe77ade"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-cad-tessellation-identity.json",
      "before": null,
      "after": "ab94cff8adfe19b3b0ce953ec52652b62c79a07b49a9b3b0a2b8f25cd60a5944"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-curve-tube-frames.json",
      "before": null,
      "after": "3f351eda93f252a7bc795e6410da2b897136def904c745d6adb3fc620edab889"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-indexed-manifold-mesh.json",
      "before": null,
      "after": "7c61d5c95f2895284405bcfc57bbdc00f84882fa3604760fd8f78eac3e246821"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-isosurface-threshold.json",
      "before": null,
      "after": "78e247df945bdf07ad4d6e293f092524eddc5de113b38bdb4c69a2b5ac8d3866"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-parametric-surface-domain.json",
      "before": null,
      "after": "04787379d123e14e990aa1ec210ef8ad7975aab75a3453b62a2c668429dd49d9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-point-cloud-sampling.json",
      "before": null,
      "after": "70b39dc4764b533e833cf6aa84f24ced8c3bffa730c270b89f4cf6b5a5b47942"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-skinned-articulated-rig.json",
      "before": null,
      "after": "a244c08ca5eb25e87f881ab7ccc8aab057df4127fe4f84adec61b8db77f2e298"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/shared-voxel-field-grid.json",
      "before": null,
      "after": "a9997bdf1f85186c23510fb4c3e0e110223fb850062242fc002c55f7471a0868"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/geometry-profile/uv-atlas-bake-correspondence.json",
      "before": null,
      "after": "e20b1fc5ba669c321c543b41af7b5aa489665dbba705896cd8df690a59ba4d28"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/controlled-experiment.json",
      "before": null,
      "after": "9373050c051133d66611ea37b2683b1b46815a5a6610155e897466b4f6419498"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/cutaway-explode.json",
      "before": null,
      "after": "f7b843ab30220634560c77eeb3079b84751f48a6bc4d72ed8abc3c4fecaf92aa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/detail-inset-context-anchor.json",
      "before": null,
      "after": "b18b9b30a730e90dbef4db02e02fabd7efa54ad98b586ede1cea2da26da07385"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/geometric-measurement-model-units.json",
      "before": null,
      "after": "712392e5ba29bc38e573eade5e70b354b8cc59bddac4a8e4ada25f32617441a2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/object-isolation.json",
      "before": null,
      "after": "4a92d7a1ff1a5ed961a154c677e49aaa4ce30efb8e6ecad673bd4c2e39018059"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/pbr-channel-isolation-inspection.json",
      "before": null,
      "after": "2bda1b6ca8dea56e8e40206e29572300c2a0da3b2c1438430c9c8afef1aa7dd3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/runtime-cost-and-source-node-inspection.json",
      "before": null,
      "after": "6156ec8e423c24ed5c830268d4af345fe0780ecaed79323d4608ed336e224313"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/skin-weight-and-deformation-inspection.json",
      "before": null,
      "after": "28e899f84020de705eb7d413ab83f827e26667b002052cd7338888c2b3047dd6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/synchronized-orthogonal-slices.json",
      "before": null,
      "after": "faa49090fa60280937c1eb554360db5ab9d0cd18f945522d4e148cf5638916b3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/topology-and-normal-diagnostic-view.json",
      "before": null,
      "after": "d91ab802c0ecc21fb95faa0e6b6f6084455e5cdaf34587667457d8908c3d02ac"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/inspection-pattern/uv-seam-and-density-inspection.json",
      "before": null,
      "after": "c84159168090d0fb508fc674bbe15a757ad9de331ba91a624503de67985b5017"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/accessible-spatial-controls.json",
      "before": null,
      "after": "a7df931816aa1e32380d8cb8e47554dd26955e181929872645feff6c40c893a9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/constraint-aware-object-manipulation.json",
      "before": null,
      "after": "62d4b44bc9a3ee7f3f082ec3dbdcca8c7703dfaaa4cc2643b41e94e46ecb9c34"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/guided-exploration-reversible-steps.json",
      "before": null,
      "after": "adb1588006de44275ed59920b821820fb1894941068093362fd85622fc263ae1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/inspectable-selection.json",
      "before": null,
      "after": "020ba178ce1e1f64cc92c2c38ca6261a319b3605fc8afdc51efb6c22a1f698aa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/linked-plot-spatial-selection.json",
      "before": null,
      "after": "243c735d98f59dfcf517160e0cf101df7367b81989109592f9cb6e5bdbbfbd24"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/modality-independent-action-map.json",
      "before": null,
      "after": "8c8c5f0d6077d637fc5357ced402a77d9471240eb73fef435f0b29cb5290c423"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/multi-selection-hierarchy.json",
      "before": null,
      "after": "5f129d4144b3caa21aba5b5d0a4d6feaa111f030b7241bea5891dfe838f48585"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/parameter-experiment.json",
      "before": null,
      "after": "ac3124a47b78303f32e651a5b9e53e80cd662e57e7d8c8aa401b20eac99fb699"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/snap-preview-and-commit.json",
      "before": null,
      "after": "fc1d6a4aca775f62c9326e776860e3ee336325ccc53e3f09054e5cf6db31722e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/spatial-annotation-authoring.json",
      "before": null,
      "after": "396c846472daa164e62af9bb40804434e1f2740235c395bf45c036e0fffaa56a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/interaction-profile/transactional-undo-redo.json",
      "before": null,
      "after": "7c56201ae3bce94fde7f5a26a9cb00ad8ed7a27b3fe92656714cc535222d2536"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/baked-runtime-lightmap-ownership.json",
      "before": null,
      "after": "2d7d5a96f66b3d2b5bf1023ebe0fb985b81b3a3c3e6c980d7b5b8cc758866186"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/blender-three-ibl-shadow-ownership.json",
      "before": null,
      "after": "af5094d8872bc8e20ae6331c40bc8e7bc1d6d0c8dc424e9c6c2f25b89ac0b993"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/emissive-practical-light-balance.json",
      "before": null,
      "after": "cd445033a72278e56c3d3974f81ce38f17474c5a381de289934aaee5fd578a25"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-dark-studio-product.json",
      "before": null,
      "after": "d626fe5419bd28631439027399551908d43c224d433ebaebed2af4f21ba4910e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-dawn-cool.json",
      "before": null,
      "after": "29c156aff9b7c3d141fd0da0be81f950cca3807edc7e6bbaa555576da2b2730f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-dusk-golden-hour.json",
      "before": null,
      "after": "da0900b574ed8d5b703cec3ff466fa6f9ce7524831fcc7ba776b1d37ccf4c9c0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-fog-shafts.json",
      "before": null,
      "after": "0747373f9b1ce796b1f8bcd92bf19e55a8a23d2dbabdb740b27660d319a2e0fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-night-lantern.json",
      "before": null,
      "after": "70055e187dc1f0dc769783a264eed2544dbd4d88dfe901d0efb94e126b9db850"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-noir-hard-key.json",
      "before": null,
      "after": "2f3c597227319b54d675440a99e2dc4218b69faffbaeb41f842c0aaa3ed5c008"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-overcast-soft.json",
      "before": null,
      "after": "d6917cd47d22909bd5ce06317a75ff08bdc73db8a2f008e2f91d64c0a63a7a9c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-mood-underwater.json",
      "before": null,
      "after": "efbd5ff4f1a9bbb258200da2ef9bb206e23e681b52e8f5548b495b31036dcc21"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/lighting-time-of-day-sun-arc.json",
      "before": null,
      "after": "5936c26d617749dfbde1291906b23542ca931d30e1d81d13bdbe91457393390f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/local-reflection-probe-scope.json",
      "before": null,
      "after": "43946140dbc27515f43a8b4cc568ceda0704274ae93675b494dbc98acaa5825a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-display-color-management.json",
      "before": null,
      "after": "d37109570334fc77673ad739cf10e4134835e52a1e0ee0a1f44af59c60ad445a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-light-comparison-rig.json",
      "before": null,
      "after": "05a331b80478a357931263b0f2b083d8fe362b833476dc2dfa5ad879c5e30f1a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-pbr-studio-environment.json",
      "before": null,
      "after": "4bcef09da01504d0488392b90142175502c43f8628e9a4347a13a2dbc44100d3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-shadow-volume-fit.json",
      "before": null,
      "after": "85728567ae2cb4f55eae1e33efa9cafb594b8ea542e2b55beceedf5b229df1ea"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-stylized-outdoor-daylight.json",
      "before": null,
      "after": "545d8e5d28c5973971872a11157dff73daf6230f1631c60961672a9cebfa2a40"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-surface-feature-inspection-light.json",
      "before": null,
      "after": "d9a413a976e0016d0108a7e36f217ffdce20bfbf3a97d2a8c25fac8a6a083cfd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-transmissive-enclosure-light.json",
      "before": null,
      "after": "3b9660602b32b7f2aab7cf16f727fb54d72140c02754e0130c314660f5a564d9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/shared-unlit-quantitative-encoding.json",
      "before": null,
      "after": "a7a9df5dedd26ead830bae74f5f4727a232bb98791fc9c0d201700a75ede0edc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/lighting-profile/temporal-shadow-exposure-stability.json",
      "before": null,
      "after": "8aaa22729f427b674c57ddfb0ebd561aab6c691843b9d2b0d0a77c6f653ad3c5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/blender-three-metalrough-orm-translation.json",
      "before": null,
      "after": "dc3318ff9c3825bd393f26cbff9808269ec9109e301b58bc60e72fd7989f20c6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/blender-three-thick-volume-handoff.json",
      "before": null,
      "after": "8eaae8b5d050c42fa1a5ac4972b4887c5988efc872d93affbc2cbb72f5c96064"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/blender-three-transparency-boundaries.json",
      "before": null,
      "after": "6e6396eb1fa793350ebc3fb28f7e018e44825b90dd9a926c7d39a0c481fe2d26"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/conductor-surface.json",
      "before": null,
      "after": "15acdc6e74349eac71738855431558bfd6b5af3c78cc61926b609f28a06ee345"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/dielectric-surface.json",
      "before": null,
      "after": "9bbf8fe7868dda9f2073f0d131aec0fdfc3415a1dc8b2baf31aa78b3c95cb421"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/height-detail-representation-boundary.json",
      "before": null,
      "after": "3c07307d4ebd6b2155df8d8ef13845046c559f4af4cee566357d4df7800e1d1b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/layered-decal-surface-handoff.json",
      "before": null,
      "after": "66bd4de55612153e980840c84827cbb5ad32299417a571d74ac218d98485b04b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-ceramic-body-glaze.json",
      "before": null,
      "after": "d17d66339f6a36401aeb1e1b6479ebad7e9fbcec616013edc2c2bd27b1943967"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-composite-reinforcement-surface.json",
      "before": null,
      "after": "ee3485370c06e05acd4038d7c00659c23d8e90ffab776113a39d5dda8b3c30af"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-corrugated-board-edge.json",
      "before": null,
      "after": "42dc399479c64ae7bb9ef3a39348609be3797dd6723a8185a355feb21aef7cb1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-fdm-layer-seam.json",
      "before": null,
      "after": "e109e055bff02df953e70323cdb96e347254808951b5113583d7aa548e0190d7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-ice-snow-structure.json",
      "before": null,
      "after": "ffef62485ae252d97d2142b8ea8bdd0bd244af733c2d15a91dce1c31f4c1cce5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-oxidized-metal-layers.json",
      "before": null,
      "after": "edf92c8b18344d78450d8a2cc47db47ec619130355eaa45dac819b952a5c0516"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-porous-weathered-stone.json",
      "before": null,
      "after": "ca6cffe96021c78da0fbe4ede9b732232afabcb9223421d1a06ff04f524ce43b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-skin-scattering-approximation.json",
      "before": null,
      "after": "6d8605f897b26fcd175a843b6d544846ad98b5e92e3f1304a01eee41a3e6eaf3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-water-surface-cues.json",
      "before": null,
      "after": "a161c4d3d324603c34b16fb261fbc8366e8fe3b6e8fe8223b4e00890e3af9688"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-wood-cut-grain.json",
      "before": null,
      "after": "547c3eb3aa0e78cdd2d71ac08341cb5e78e0a709f8670838ce9643bf574cf55d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/material-woven-cloth-direction.json",
      "before": null,
      "after": "843ef3a2e97367782635d53e75a10bbb9fab548237ac479dbb770c7200cac47d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/surface-tier-defaults.json",
      "before": null,
      "after": "64233dfa34a397aed99f43dbca15e604899784702693f3328e68a346f566f4d9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/material-profile/transmissive-medium.json",
      "before": null,
      "after": "117f4eeba7916c36b690b35e031ed3b9d88a7826a90a5295c41f02ebf652cca6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/animation-layer-track-mask.json",
      "before": null,
      "after": "746c5a710e02e232416d8a239ff4c91c327b574945aaf924eaf4783ee4638738"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/articulation-from-motion.json",
      "before": null,
      "after": "999170fb8b453234516d5e0e4da22ceb032125c37e6f846822c412ab1a63edf9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/blender-deformation-animation-handoff.json",
      "before": null,
      "after": "546fe8c2068b8a2da31ff3ab5fc86c45ff56257ae0c9edbcee443663b4fe628f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/clip-event-marker-contract.json",
      "before": null,
      "after": "d4651dabf097f85ec4264d6b37d1a583f95feb22236b446bc2474bba1cbdef4c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/interruptible-animation-transition.json",
      "before": null,
      "after": "1a9f811d8574da6826f66c9031523e5e97a2ef4edbd0c5e8714f5f0881efc996"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/interruptible-focus.json",
      "before": null,
      "after": "0bf5acf7eba85443b9b6c6aa624928dc739394f5861d8f8c095cf61fc2d52769"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/loop-seam-continuity.json",
      "before": null,
      "after": "0d3c56ad3ef12e91ffea74beba9c51166ffc3149ab034159aeed0d1110d75afc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/morph-expression-channel-ownership.json",
      "before": null,
      "after": "12a55cbc7f4f8a6aa0f184e05c4824dfe3a53272c4994dd897efafcee16a15c9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/physics-timeline-lifecycle.json",
      "before": null,
      "after": "9428bf47722ec9795da7a923fd50743878c08483a2af0191e7dd6f751fd83e7c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/root-motion-runtime-ownership.json",
      "before": null,
      "after": "2b89fae794a33bc8161a0dbe590b4098c118fa94a83815b6c93172103a4d2e3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/slider-crank-closure.json",
      "before": null,
      "after": "59c8964fe144a6a4c5f7cf433fe4e5f475a8917e847c1fbed5a66dbd4a133b11"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/motion-profile/state-playback.json",
      "before": null,
      "after": "1b4b32c427560a7f566e0e7c2f4c5030bd3a817b8ead6f4d50eea1eaffb24ef6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/articulated-limb.json",
      "before": null,
      "after": "550cf1bd911e50623fb135ab37f7efadab1db01b6b93057c16550dca59f69550"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/ball-bearing-race-cage-assembly.json",
      "before": null,
      "after": "8864d05f615248fb5edb7e81b6d86101b52c6edbfb94d6470804ce58f1b456aa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/bridge-bearing-support-system.json",
      "before": null,
      "after": "05264465c2bf5e62002baeabafd3aea7fff8347b0a0a0fd511824a7c26c70b99"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/deformable-prop-support-cage.json",
      "before": null,
      "after": "60d3d79a723b3a1e91faf4ddf6fb493a0b017d12d17e116e584a592984ce5d62"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/feathered-wing-assembly.json",
      "before": null,
      "after": "a71a8fa4b3cdf048238c14f1096f939c37a6b4b6903eec91c40cda3156a4f6b9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/framed-shelter.json",
      "before": null,
      "after": "7aa5b0fda47bc5fd50525e61a63854e86c4a2d5b66d77e5525598d546642c41a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/gear-mechanism.json",
      "before": null,
      "after": "fa6f9e23ae0a2e00b2fca89bd35b55fc13fc206252a32a7bc53a4f15aeeae586"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/hard-surface-functional-assembly.json",
      "before": null,
      "after": "f91ecf4f24faef1b00658e2bd4e10645f1c22fc43f9e26f6ef99d4444bafd59c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/hero-detail-ladder-defaults.json",
      "before": null,
      "after": "4d07b035a4dd2795644717548787be5dfcc735efdcdfe1e670992adbb2466f2e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/hero-prop-detail-hierarchy.json",
      "before": null,
      "after": "6f0b331e250c00dbdd5fee5e41b40011247c936d1e3430a4fc9364285a702bf8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/hollow-vessel-liquid-cavity.json",
      "before": null,
      "after": "368fec09959c1612fea556b0375bc83c22df4984140ddc91e5dd13aa08006922"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/layered-garment-support.json",
      "before": null,
      "after": "5ff32a8d857ee7c538406abfa058f41ef8cde22b9824a160fb1a40ff2836d160"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/masonry-arch-centering.json",
      "before": null,
      "after": "bf3dccfff54cc4074cd243f6a849ca5c574c98211a3a0db165f6d834129e5de8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/modular-environment-kit-sockets.json",
      "before": null,
      "after": "15229644807ea7e87bbc33dd2efd3a3b589a44ef390bd66ad380ba542b3968dd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/quadruped-body-support.json",
      "before": null,
      "after": "8812ddba8f126e67bf92f6f24044a4551476f4d17d0a344c078aaf47abfa2b06"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/quarter-turn-ball-valve-cutaway.json",
      "before": null,
      "after": "664ec2069505d0edde3ad9d88321bc87bdc12ae390762ea76235ad10e13e17ad"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/tree-crown-root-architecture.json",
      "before": null,
      "after": "96a01287e2c1c7fb09b8e8616d87b1608936f50d88942e1931cd31f2f9b76c7b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/watermill-drive-train.json",
      "before": null,
      "after": "ac4c32a72c5255c2d6ecf0553461749e7eff9222ac4da7f140c665235fba2d63"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/object-archetype/zipper-tape-slider-closure.json",
      "before": null,
      "after": "3678aec8ceacf74c86cca5db33f6546b84fcfb4f014d4ba879a1109b1be04a3a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/deterministic-review-capture-package.json",
      "before": null,
      "after": "3932fad243ee3f4e1c4d4b5933b33b15fa5508c8b2fba76800fb44bf9cbe8d49"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/embeddable-scene-contract.json",
      "before": null,
      "after": "94915d7fb6798c1d0e58a3e13e4bde87f96a4b4ec3946199c4a18f654b036ca3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/progressive-asset-streaming-output.json",
      "before": null,
      "after": "4548ff0c8747aa4fdbdff748622d6561680ee8bb0197c54f83196d5f3bbff4d6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-cad-exchange-boundary.json",
      "before": null,
      "after": "d50505a0296384e3f96e1706d34e4cb02a16d3878863b6f188ae272f07e3c46e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-field-data-playback-bridge.json",
      "before": null,
      "after": "a06be186ed00a51fbdae16130aa084230386c8e8655774cb4fa2665152c68499"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-gltf-asset-bridge.json",
      "before": null,
      "after": "3f0434f66c2003930f0ad8f061bc9d1ed0eab4124d0945280c087a011bb62bf3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-interactive-web-scene.json",
      "before": null,
      "after": "59c6a55b64d4809d8186b1a3963fc8678d56fac0a4bf4d9ba31e9f7230eb4575"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-offline-frame-render.json",
      "before": null,
      "after": "0b2a261575f6f0d6b2271f00ec259a089f1992d93bf116e59c4548fa75e6daa7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-reproducible-animation-export.json",
      "before": null,
      "after": "f9624dba717bcaedcd4a5238bdefb005dfbd1de2148ad2b83d87f17556857a3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-static-accessible-fallback.json",
      "before": null,
      "after": "e2b2506de1ad27b93672861d519f219d8cc5656b5dbc33ce044d95ea8a132a15"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/shared-volume-visualization-stack.json",
      "before": null,
      "after": "21a2f6bddac3c3d42dabf1af543e493a30c3b589dcba0f6fa87a9c2d6729972b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/output-profile/webxr-delivery-boundary.json",
      "before": null,
      "after": "e70266b68292bc47fcca1ccfb9dc9fd8eccc50cc894879f19c7bb0d2d4cce568"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/authored-locomotion.json",
      "before": null,
      "after": "b774c7811d6336a2f27e62fcb1c1a1182043a35d02bc37a8b186bc7c37c4de0f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/breakable-joint-threshold-contract.json",
      "before": null,
      "after": "4233c7e73aefa27dac73ef309c25d31c737bac6a228baa1504446bfbd53f2ce8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/buoyancy-displacement.json",
      "before": null,
      "after": "57549f99f3bcee4245e4d70e60c8948639f7cffe8c8648f6f8d6937c556dee51"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/cantilever-tip-bending.json",
      "before": null,
      "after": "293fb6103d4fa9502936d2b74a1fe8b0f852c160d547a2a57e6dbaa9bf23b75c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/circular-shaft-torsion.json",
      "before": null,
      "after": "8c0fbe9621ac759fe857ef5f1e6968c8501f6636e672c82a1c3ac624087907c2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/cloth-display-versus-simulation.json",
      "before": null,
      "after": "0aa3aa2f81a13db2385f4f32542bda62eab467bb2c7d289883c856a1276ac9c3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/compliant-spring-motion.json",
      "before": null,
      "after": "00ebbd576211ab32363575251798a1bbcf0c9bb6775ddf31399a732b261284db"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/compound-collider-mass-properties.json",
      "before": null,
      "after": "fc66554c8c244e491d694bd024135f831a79a9f5ca672f6a73574350734dba75"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/constrained-gear-motion.json",
      "before": null,
      "after": "0615acb6c0b1d46bda04f5fb28c2c1789b8279575787e3b0b326886b1a7fba8f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/damped-settling.json",
      "before": null,
      "after": "7760054119bb1e597efe10b3ff077b609ef46f93e3cab990d10625ef9899089a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/flat-belt-traction-bound.json",
      "before": null,
      "after": "f956af8b834d8d7c46b07c1faeba6a5b0f791529e751c9dd941fd7897ca824dc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/granular-aggregate-approximation.json",
      "before": null,
      "after": "0ffad6bd9e946687f64fc5d13ec445dbdae1a40fcae93ab4e303e43fb8aaee0c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/gravity-contact.json",
      "before": null,
      "after": "75806a6909214bb93ac70ead6e5a64052bcb75948ee56d65bef2bbcc8fdcb5a4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/hertz-sphere-contact.json",
      "before": null,
      "after": "72fbb90d993f0df2ae500acea007f9f72199a730d4d5767430dbda8ab80fe27d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/kinematic-dynamic-velocity-handoff.json",
      "before": null,
      "after": "582b41ee65860af814f8da44475d15b97678a9f65ca297eedb21f8aec052b904"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/liquid-coverage-versus-flow.json",
      "before": null,
      "after": "0fc22e7accb94e5c5026ad0ea8f2d688a9743a1a79838bb7b7d5f28c9ba8837d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/pendulum-hinge-constraint.json",
      "before": null,
      "after": "79713786c72722c8c84ebe5c66cfec950a5d1f715dff7d49bdfe7897f0f7d6e2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/rolling-versus-sliding.json",
      "before": null,
      "after": "81dd4962aaa909b47034192c0eacb252ff0427107d6bd49145d1fec3fad1f058"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/physical-behavior/slack-cable-tension.json",
      "before": null,
      "after": "3805f9839987035d215ee404f7c5bbd75187f49ffcfbd471f62551f5d048d3ed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/assembly-layer-reveal.json",
      "before": null,
      "after": "87aa1eaf5f7c45c31aa53b94a70a473b68084603e420f33f9aa817843c19b327"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/camera-authored-viewpoints-and-reset.json",
      "before": null,
      "after": "520a303bcf132d9d2ef44258930bc029e65dabd2cf65642181d7f2327629a039"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/graph-in-space.json",
      "before": null,
      "after": "5cca05e52d3b3fb26bceebafd6a5acc20dea0ffc7b7a68f67bcca731c737e59b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/progressive-control-disclosure.json",
      "before": null,
      "after": "6c09301fb3e17c0196ee3ea73b33152786109a6cb97a963315fc6f0801fb4645"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/responsive-spatial-label-hierarchy.json",
      "before": null,
      "after": "30d9c094ece20ae5758c59558db81c225ea948ddddfa69a9d7c4910b2578b1c3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/signed-field-section.json",
      "before": null,
      "after": "738bf5618d7a01ac7ccfcf0fd5e978a4ad299b099c449246977f7381cc049e3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/source-model-runtime-provenance-panel.json",
      "before": null,
      "after": "aa15f427c69ff87f64642c53b9925708ffa59c09741623b41a947d10f4089047"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/presentation-profile/uncertainty-interval-encoding.json",
      "before": null,
      "after": "e5df0af52c6810ba818bdcee5f9796a2f5d6bc474f5bd559293ee8a46bc6e2b5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/blender-three-procedural-shader-portability.json",
      "before": null,
      "after": "203f49f581e8e7131ce35ca17de2f5af5e881c374ecfb15753368f78305fbcc0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-algorithm-trace-as-data.json",
      "before": null,
      "after": "2f0534ae4bb559ee62c4b8c411e28b67a7e3ae577de385378933b9df1b93db26"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-anatomical-frame-and-planes.json",
      "before": null,
      "after": "c5eda0c21ee9084de427ed0f0ad084bfe0bccabe2ed3b946584326398e6171c4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-assembly-precedence-order.json",
      "before": null,
      "after": "c2c9e843370c64181ade4fd7f6efd8108892e6b5d0dbc35488fa1d77894d25b4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-basis-versus-coordinates.json",
      "before": null,
      "after": "b2d0dd1a2ad4354e78f4d0c0c6a5f203bd44890ea23ee985626a39aedd1ff456"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-bond-graph-authority.json",
      "before": null,
      "after": "079dbd069a6d709f1e2a6afa13a3593aa9cd9f3652efabbfa805b4d02793f351"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-bottleneck-legibility.json",
      "before": null,
      "after": "47f8230116354387af04fa8891c203824dbd7f9fc553158acdb546f7657f45ab"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-boundary-conditions-are-the-model.json",
      "before": null,
      "after": "67bad8aa09b4e36b423baabb32addba8cec764461e806704c63a7b3f106e2239"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-clearance-envelopes.json",
      "before": null,
      "after": "968cec51e7640f0cc61f3738008c34726b8e0f84320a2d12b96eaf19fe088bfd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-clocked-commit-separation.json",
      "before": null,
      "after": "441033d4bf18848eb10c8f4da91bce6adaf64e020659ff50c770511c1c7aca1a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-commanded-versus-estimated-pose.json",
      "before": null,
      "after": "de991cf9b49ab15c7fcc78bba7f9ccb89d7c2b67d260ba2a6800c230a70e9e8f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-conservation-check-for-flow.json",
      "before": null,
      "after": "68601c47a528442e135ece8cc117b507022722581b5885c89aebdb5bc9f6b098"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-creature-body-plan-coherence.json",
      "before": null,
      "after": "2ef3ee8e5017f18691e0eed23dc18c2921e2731595d2b3a1e70534d93183a0d7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-crs-before-measurement.json",
      "before": null,
      "after": "8b57be6fdd00ba6bfba4c27a9bf86cb12e9572dec37b64caa83b4966eb263999"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-cycle-phase-state-machine.json",
      "before": null,
      "after": "9b2a1673015ee7a98aac855e8e3ea786f83ab46fe1c777f23240f5ef005f803e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-deformation-claim-limits.json",
      "before": null,
      "after": "61074d2d5b902a84682ac178be0b5c3990bd7c6aded64c9aacc78d9dafe4f0ff"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-degenerate-section-cases.json",
      "before": null,
      "after": "e57776b4075d0488009acf8746df62ca99255e0076c1896c4502f47f63b3706d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-dem-resolution-limits.json",
      "before": null,
      "after": "6b4d2782996719a5f33133991e53bb99e7f672a39bddb8e46758d34cd04c3314"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-density-is-not-probability.json",
      "before": null,
      "after": "5f03167f890a23069824f4cbc4a49d74743c8b4c0ba4bb786b0f9243f7b6aefd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-determinant-sign-and-collapse.json",
      "before": null,
      "after": "bd93a54d23794df83ef99c2116350fd9a51d44f2a2b7102f7a7011bc0823eacc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-discrete-event-timeline.json",
      "before": null,
      "after": "67b4efea1e0c9ee2a046d6996e59382c9a5b7003a2d6f73448e5619ef6df381b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-dissection-layer-order.json",
      "before": null,
      "after": "ff0b481b7de651fcbe51feb11328f95faa7008fac584500090ef500cc5cedf0d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-distribution-encoding-choice.json",
      "before": null,
      "after": "a9634e04ce98e897ce09f388ba1b4ba69acc050b21b5a7c9450c2b333b6579cb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-domain-and-singularity-window.json",
      "before": null,
      "after": "f11e7b72b0d4050cd9cd0f4d646e506f0a76c048856975712b28f40c80c1d5c0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-dual-scale-disclosure.json",
      "before": null,
      "after": "6dbbfc96ac54fd870167e9bb773f474d1366f08ec9343c585550b0739483c635"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-eclipse-geometry-conditions.json",
      "before": null,
      "after": "48edc9db9567a279908ae24cf4df77ce3de0a648545ba6b889745914cfe290f9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-electron-geometry-versus-shape.json",
      "before": null,
      "after": "f348ec2a536ea5c8d4f0dd25548918374415d178b8470415465beab95cd104aa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-elevation-reference-and-units.json",
      "before": null,
      "after": "486fec0b06f540744a932f710295f76148c49e5857ec478bb9b4034d7e640210"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-embedding-distance-caveats.json",
      "before": null,
      "after": "462a2743d07b6a742142cb464b275adaa00678031bb875c82aeb2d6d3b95f0ef"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-energy-budget-check.json",
      "before": null,
      "after": "ff5848d921aa15649cf4ffcc29c1e91d0571e17d5fe54199bc735363499f168c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-evaluator-owns-logic-values.json",
      "before": null,
      "after": "1d9e7888c5999d220689b719d35b73f2c530ce76a1c6b0cdb938d227e8fde18d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-exhaustive-search-for-solvability.json",
      "before": null,
      "after": "1c2e47fb57dba6758852a7b0b453b822b2b0b3fa36b2170f516766ae5ca12a9f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-explicit-scheme-stability.json",
      "before": null,
      "after": "2728b2b9a081654ee9fde098c9eeb4999b2e7b1816eaf27bd09c3eeb7bebf39f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-exploded-offset-is-display.json",
      "before": null,
      "after": "98d3128ce74a7a17b6fd2b3f5b79cfcc752f2044e008d591a9ba7887e116b5fd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-field-line-conventions.json",
      "before": null,
      "after": "b57e0461d08b37878bea0eb813b06abfc58a5ce1c3ab4fa94912585ab5c24881"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-fixed-timestep-determinism.json",
      "before": null,
      "after": "fa38cebc655465c5db58a965da687239eb11580d0f74eb8d38485ade577fd715"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-frame-composition-order.json",
      "before": null,
      "after": "694b6f8d6fc8d68b20cdaf91192adb335e3f7fca77a276b108479a4ef4c543d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-gait-contact-consistency.json",
      "before": null,
      "after": "fb8f70f4c42ba2c8be948ec77198915b68101126dab615e9e7e6794e1e6a2425"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-gradient-geometry-invariant.json",
      "before": null,
      "after": "546c9defa86e6f8e4ba7250abfc3cad8777324f4520fd0da71843cf75a7430ee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-heritage-evidence-separation.json",
      "before": null,
      "after": "ed9ccd86ee7257215608f1a9d0dc22e89a04a542be5a0a551af4c45b8679f079"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-ideal-flow-regime-limits.json",
      "before": null,
      "after": "d2c0d58e5ad899298501dfbb4696c634e1de59f359f6e914ad7345b610fa5d92"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-ik-solution-multiplicity.json",
      "before": null,
      "after": "7c765d4aaee1b2d61a3ca5760d538e28bc8493bfcab00abc00e1787797adff3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-interior-visibility.json",
      "before": null,
      "after": "0eb1bcea58405ba7fb138f961ae52dc2d88aa5f56da98a157c08b6dbca9eb503"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-joint-limit-in-model.json",
      "before": null,
      "after": "5815ce60803bdccef189d4feab04178d77254fb1658af9a45397db24acc37c43"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-joint-space-versus-task-space.json",
      "before": null,
      "after": "475c33e4db151b2c2ef42f1a09a2488580338a2a225706393b7b3638f089ae7e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-kinematics-versus-dynamics.json",
      "before": null,
      "after": "68d20435ced3de2803fe91f3c6097bf861df4fb5e6e5f09e46ad8a62a2dee07f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-label-implies-relation.json",
      "before": null,
      "after": "6a8888d92f6b699b3592b8eb89311bcd5d2b91fca2ce1bb7875d47857c5606ef"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-lattice-state-not-floats.json",
      "before": null,
      "after": "f5b63143ccecd034c39cd5ecd6b43baddd99f48ee34ee969c12558dc02078dbc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-legal-move-before-animation.json",
      "before": null,
      "after": "09ccceb68793259564f912f46df7c67c3a9d8847b1e053d0f4eaa23c8e327934"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-mating-feature-detail.json",
      "before": null,
      "after": "900cef80ba79161062ce8baa77ac70beb7b3831efb0db88d1c022ea420ce84f0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-mesh-collider-functional-fidelity.json",
      "before": null,
      "after": "75163dec81ff83557b649e1598ddada46c3ff766c4f1e1b8cc705e4a60574c23"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-mesh-versus-combinatorial-model.json",
      "before": null,
      "after": "28d74cf5854d0861365dcf2d69a3cb9c7a896973fdb9a3b5d705e6fd45631342"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-mode-boundary-conditions.json",
      "before": null,
      "after": "5604d1078c5c7ede07fff49f3673e5166d9e4c7864b1f865830f48ae19e9e8e2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-model-provenance-not-clinical.json",
      "before": null,
      "after": "c6fc332c83cf0c8e4053523cfb62df55666fb8a0db42b3864b74e3b47f78266b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-molecular-representation-choice.json",
      "before": null,
      "after": "5d89acd736ff93c9adf27fbc212795e5f0011c8d39f530a30263cdb65ea86814"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-motion-source-selection.json",
      "before": null,
      "after": "c7c7e1d49a5225e09d22033e778dac671389d056575593796986a861889324e1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-notation-conventions.json",
      "before": null,
      "after": "afd67f22fd977cd90252e67a48c919f2f8e32b14dbbaf65da980add800585dea"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-observer-frame-and-viewpoint.json",
      "before": null,
      "after": "5be95ef5bf300638553ed4ab4815889e6ed89722a03e89ec119992c43fb3e848"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-one-matrix-two-views.json",
      "before": null,
      "after": "099c5820b53b02078443f894eb013c4bf061601c8da8d80684fdde65339e3648"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-orbital-speed-varies.json",
      "before": null,
      "after": "34b481ca9c7de73617d2ea731d27ad2bc83bd3e602fed5bb4a88beb0b53c4dd3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-overlap-drives-force.json",
      "before": null,
      "after": "b3422d44b1004082802fc6832a1ff6d506957ee55e827ff9305638cd352a225b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-parametric-construction-authority.json",
      "before": null,
      "after": "fc6aef4c8a512948737376c41d500ea1280b5618cfcc81cc64850323b069d9dc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-part-identity-and-variants.json",
      "before": null,
      "after": "0f06dbbefef48fd2e4711fcdbfa8d0b1652424db2c56d96e64763c15410ebac0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-permutation-state-authority.json",
      "before": null,
      "after": "139939908cbfc549fdface14af50029b4c4b90a5441d96579aa3206739206e23"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-propagation-timing-claim.json",
      "before": null,
      "after": "2e527b4243b9425b7536700de1af9d80cc1d4e6daea9331d5845b039b3be205f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-queue-capacity-and-flow-law.json",
      "before": null,
      "after": "7f8716b48b0b0995422ad40927d1e5c95977e3534efc77d4965a669712b18f2c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-ray-versus-wave-model.json",
      "before": null,
      "after": "ddac91142005da5f67440c78bba1470ff1200f98d241ab41f3cb605e809d7a2c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-real-unit-modelling.json",
      "before": null,
      "after": "aecb04c0d614cf7c0ab883459a757e342c4d83045b43859cf7837102cfaeb055"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-relaxation-preconditions.json",
      "before": null,
      "after": "2d6fa6189d6cdd9b32036af1993ce1342b5400ba93cacd036b5a61d7e2abaa4f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-revolution-axis-and-profile.json",
      "before": null,
      "after": "a6f871fc22e0dddb23844a52480050f2bb533e7f487832d82ea58dd3209e1eda"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-riemann-approximation-visible.json",
      "before": null,
      "after": "98dbbd7e78e8b6476af93e489fd1836c1bac7536fe1f481cfa5bb58a1c8297db"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-rig-hierarchy-before-shape.json",
      "before": null,
      "after": "d45e09d49346e35db319c4607397d2391b1fab68677b903ae11b18f9bce5ce0e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-rotation-interpolation-path.json",
      "before": null,
      "after": "54503f92154a622202c7d6ef08b4f38e57d377bfecc22aee470669e4766b1b2a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-route-optimality-claims.json",
      "before": null,
      "after": "62df80b279d9645397f94c7469a96f497dd386865e731a5297a2661977be40f0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-sample-versus-population.json",
      "before": null,
      "after": "8bad054a0848f840998db6191f4c3e1d2ea5b50e7a960f64755ff55716c6784f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-sampling-resolution-and-features.json",
      "before": null,
      "after": "574fd504658598646d703f4e809ac1f8d15ad823190c6e848ea5daab40c898aa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-scramble-reachability.json",
      "before": null,
      "after": "d3b5b7359209776c17632495db119b4615670658dfbce325c0238e21d87a70b3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-search-frontier-invariant.json",
      "before": null,
      "after": "e18d6615066a181cfd33054609aaa01c8c30627c7f826dcca3a45773faef8a72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-section-plane-versus-deletion.json",
      "before": null,
      "after": "1eea5b531b1ba799cf26f5bcf6cec402e22e3e6c432f3c6dd2d37bce1487cfdd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-service-layer-coordination.json",
      "before": null,
      "after": "cabb21492a7abcd29c68862651ab22c85099f7ce46fe993d6e9886e6549c9067"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-settlement-function-variation.json",
      "before": null,
      "after": "5ab3a327efb242f45bad6940f32e8f6bd524ef481e174a561117c3f1a8bf309e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-signal-flow-layout.json",
      "before": null,
      "after": "9b4aed624a2c82dea13bb23bb71b4236b8979d6175f77da673fbf6641d481b06"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-small-angle-validity.json",
      "before": null,
      "after": "da4b02a15e10419290162b1ee21d6d815f628a156ca457836aa156179f9ac1fe"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-solver-data-provenance.json",
      "before": null,
      "after": "2cfbdcd0b72b75c650f279466dec66e0be1355e1abc87c3ed798aaa2ba6ee90e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-span-causality-and-time.json",
      "before": null,
      "after": "146856f8830073ac9b98825f8a822e2a24fd47f7a8f5ff13ad3a05cab9c946b6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-stability-and-item-identity.json",
      "before": null,
      "after": "7fe49d4236b023f70622eb18f657ea73fb134f1bf7bb4be2724f36533769e334"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-standard-error-scaling.json",
      "before": null,
      "after": "a0d6b45783eeb28c443fa3ef2a17e40b4133a8725f4aed6d35cefb76442e46eb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-superposition-computed.json",
      "before": null,
      "after": "aba058a2efdb622ddeac1601912f5e39c7a42aeb6cd5888844a181770ce4e9bc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-symmetry-as-exact-permutation.json",
      "before": null,
      "after": "395129775450e1eb1fa8ef10f1b3d6fa272d71a6b4ff853d99e28db7d9569b72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-terrain-height-authority.json",
      "before": null,
      "after": "3da210307715ef7cb5fa3f878094d4a302283eed73c178e86f75c99a2efc2495"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-texture-screen-footprint.json",
      "before": null,
      "after": "201deb9e3801157d37a14d6d412cb0554042929a148b1681c5431f3d994582c5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-third-axis-must-carry-meaning.json",
      "before": null,
      "after": "9370cc34dd6d05fb07c709d06edb919e0334ab192346538fec1e647d47f1f3e2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-topology-from-computation.json",
      "before": null,
      "after": "da85bf08417707b7b613555fb0116b2057be2f25d2123b76ad81fe9557d9098f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-undo-is-the-inverse-move.json",
      "before": null,
      "after": "65ced66effb37c482247d9ba7022ca3f9cf78feb3f426b3f56922ed6d53fbecc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-unfolding-isometry.json",
      "before": null,
      "after": "ca9a1831036550cbf4c8428fe3f165275f697593312e225238dc49c08c2fc4e9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-unit-cell-fractional-accounting.json",
      "before": null,
      "after": "a8f58a74a14d5f1aba15b9366e6577d2afa49e7c01aa718bf47c27aa8f899cc0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-vertical-exaggeration-disclosure.json",
      "before": null,
      "after": "dc886770814f230cefb1e3ae97614a923165fe13576befa4df66791de4b7d926"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-visual-channel-legend.json",
      "before": null,
      "after": "1ca383eb206443914976e1683ad1c52983e5f4256f8e3018978d2bcb058acfbf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/reasoning-rule/reasoning-world-scale-and-traversal.json",
      "before": null,
      "after": "95da554dc848b135d42784111bfe7675bd6182ee99a1f6cbd40ae9de455219ac"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/accessible-high-contrast-stylization.json",
      "before": null,
      "after": "c77404d2bd7886ccdaa6f2cb746964fadddf5f19fa8dc604ed2bff8479c48675"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/graphic-shape-language-across-asset-types.json",
      "before": null,
      "after": "7233af364de99e7e66f0ee2d6d6c5c5afed160f6068bdc2a7648e32d0d00271b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/motion-style-with-state-legibility.json",
      "before": null,
      "after": "90ff5281a4780a0a0888446689e4b24495bf3ab06223d029675aad3d451069fa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-bioluminescent-deep-sea.json",
      "before": null,
      "after": "b44074867dde477465497c5258cbfd49dc3403f35a27b72cf8e60c07e2066c30"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-cartoon.json",
      "before": null,
      "after": "63fd76aa72963ca20f20a89dc9d4cdcf24b86b273b7ce968bd7bb67c5ad18b69"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-cel-shaded.json",
      "before": null,
      "after": "aef0150a87c2a17ebac3f1956cda60e2daaa08ec2fde5c6ee6f8f2af6af2fc3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-cinematic.json",
      "before": null,
      "after": "bacefeb9c4d01449b9f5c639272000628f8b852c487ed8a7fc0912c7bf64cdb6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-clay.json",
      "before": null,
      "after": "447aeedf9115a7c9b20b667d324d0e751301077fab46cbb48cbdf7197b07719d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-faceted.json",
      "before": null,
      "after": "d6533305e0c14862576ac452b1c0e497c831b123e48e0bd92ce125f627b7613f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-felt-wool.json",
      "before": null,
      "after": "561527752f437be18204fac8ac6f967a147b4a48e212c660d276942eb0605de0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-generative.json",
      "before": null,
      "after": "1b1d9f9b2037f5fe3a01176831b94d70145052a9719b9e940a43c258ab768f9c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-geometric-abstract.json",
      "before": null,
      "after": "ee2ad9eab662d832685ff7299ded179442c926e96a111a24f725aad2813f1945"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-ghibli-painterly-pastoral.json",
      "before": null,
      "after": "2bb258e429110678f803a3469cee5bc6e2bfdfd722d9822a27a8fec7214f6f11"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-glass-translucent.json",
      "before": null,
      "after": "fb4689a245273c3c14359cc7a15ead52b70e50e094e13cb7e1ca5b9045fbbe49"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-hand-painted.json",
      "before": null,
      "after": "657d59f0c46fb7781b9055da2c93bbe06cd8f2235dec3754ca46d57d47a5db65"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-holographic.json",
      "before": null,
      "after": "630cbfc677f490d7af4e88984030327f213dcf23f66069a74f2c0acc4e8524ad"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-lantern-festival-riverside.json",
      "before": null,
      "after": "54a931910306dfbee1bbb6efa518503356a4de25baf06f266d6e45bafb662e83"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-low-poly.json",
      "before": null,
      "after": "f66cd725a241e56d1180142208b7d155a38d8e1bc0caafb228e7c07ff878f5cb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-minimalist.json",
      "before": null,
      "after": "c46d2557230e14fb44305ea8e3a7da7d124f7c96a62e26f560b7e9029aea6771"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-monochrome-study.json",
      "before": null,
      "after": "40f2f7be7b8962ddc1b09ac8366870f6814c88b9a48221e632d8cb30b07d34fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-neon-noir-rain.json",
      "before": null,
      "after": "c73da4090c605b153683daccf67d0e0fb13d9bef7a1303285521366e9de365bb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-origami.json",
      "before": null,
      "after": "6c486b3e3f367996162e0bdff4501f53eb96009383fa6b1b6949dacf4afb1523"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-painterly.json",
      "before": null,
      "after": "f8e23ac34eeead2bce612c4bcb17bea2f460833bab269d920c66250e866be98a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-papercraft.json",
      "before": null,
      "after": "11050fec0992cf1e16f51e2fa4094178788902d634b9d26d899ff9f3dc44e50a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-photorealistic.json",
      "before": null,
      "after": "38a0a2d5214a63adefb58b04f31bda7e3c442fc44865e2113c58f7e7893cd30d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-retro-low-resolution.json",
      "before": null,
      "after": "7c4c97968a2bc0a0adeb49b68e88730a85348f9e324b416a26b87e1a647d0f8a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-scientific-encoding.json",
      "before": null,
      "after": "45a5229d89a36c78170221fb9caf99cdd2d24a68def0bdbec6ad5871f53c7f1c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-stop-motion-inspired.json",
      "before": null,
      "after": "d9410d97e66dfc06516cb86e7466045fbd1ee527d71b1bbe83aedc6d8198be6e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-stylized-realism.json",
      "before": null,
      "after": "d3c668d59e015acdefb48f404e336fb0d15cb39088d79981db89ead3cd67d6df"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-stylized.json",
      "before": null,
      "after": "ed09b8dece84814cd703ef1117433613ec53dd29ddcd80ce061a0d39a613320c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-surreal.json",
      "before": null,
      "after": "2f9178c0742fb3648add61559d517e7c75cabe8e00b246126c14a18c70fd68f2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-technical-illustration.json",
      "before": null,
      "after": "d2d420fc4b3951d0ac929aef1d278aba4133fcb12883815ad1168cd5d97fbf2a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-tilt-shift-diorama.json",
      "before": null,
      "after": "7480bd15eb2452101c517d38ba981b8cc3b721a8c5a6b747be9c4632e664e9a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-toy-miniature.json",
      "before": null,
      "after": "a015d4320d1b9d32e7a1535d7ab24ce80f9503e31ffbdf9391fa2cf399650763"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-voxel.json",
      "before": null,
      "after": "0b263527a46c8f16857da57bf327de423d5508afd1a213c4b16e6d865cd7f6df"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/style-wireframe.json",
      "before": null,
      "after": "b3be8bb3ef1bee3870c941021527d0e75d66488c6976a0568630c6d2681ea0f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/style-profile/stylized-pbr-material-response.json",
      "before": null,
      "after": "bde554152513013276a61ca93895aace877f4b643bc6857b06bf7a8f41f23bf1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/environmental-story-clue-layers.json",
      "before": null,
      "after": "8c1584984f109b0a1585b40647ce6b6404096bb3b9894b82cdd71176cbd014a8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/historical-reference-versus-fiction-boundary.json",
      "before": null,
      "after": "beb97deac71cc8e046a6c1fbd6091252b56279f9afd012f6c001f141b1389e89"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/modular-theme-variation-without-cloning.json",
      "before": null,
      "after": "67c977f0111c31d6961a7326dbdbc8e404248a86d3ce9651801797874a1793f9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-botanical-sanctuary.json",
      "before": null,
      "after": "c967a74cfb25a138f6b4a3c8aeaccf8acf68ae453f70ae5c28b2b666a8f1b355"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-celestial-observatory.json",
      "before": null,
      "after": "21568b88186a5a308b91fe2aa0f403ace14a12ccbf6a5ffa4bc557496d6ce44c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-ceremonial-stage.json",
      "before": null,
      "after": "cafba8ff36eb34eb8034ffc5fb22119a6fae91b89e9532116b0dd9c7dc0512e7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-coastal-exploration.json",
      "before": null,
      "after": "d98b203cd5e44d13712d3451533fec76b11635eb859bcea737e211f72118ca18"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-cyberpunk-city.json",
      "before": null,
      "after": "775b116f33dc2c1c1b44f1c905201326225be54f0e63166fa439fb637b25ad7b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-dreamlike-library.json",
      "before": null,
      "after": "670743ac512fb0f87531b03233fe12d1fd4318e438d39a23ebb37c385aefb06b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-fantasy-woodland.json",
      "before": null,
      "after": "cdda29275069d989dbe8b9820538681b009fa1345fab21c4725c2b2de8831fde"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-functional-prop-grammar.json",
      "before": null,
      "after": "dfeb3fb5cc59bf1d34f876645de108e7cafe9c436828c92898860aca8a8fe0fd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-heritage-fiction.json",
      "before": null,
      "after": "14768b76a6de17f301bbb23481e03d3003742098cb1caca4c7b06cb2f354f9f2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-industrial-workshop.json",
      "before": null,
      "after": "3db1c5738b8f2dd1a1d807c88395972df518f18495d76e220b36bfdb7a0f2ded"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-playful-learning-lab.json",
      "before": null,
      "after": "60c6107c40937bb7c6015e12fba2569fe1ffde554689414bb7bb59730a39c155"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-science-fiction-outpost.json",
      "before": null,
      "after": "aa64db5be1569e61e28fe28a7c44203da58d99d7338a1107edca5810984e9cec"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-solarpunk-community.json",
      "before": null,
      "after": "f5aab395bde9a9b5b1927c832b521ddcc2fa00a43b6e832e59a2b05e1a481d7c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-steampunk-workshop.json",
      "before": null,
      "after": "77b8aa598c6943aa1030f3e877b993521eca4c68e25b2678629473defe209928"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/theme-profile/theme-underwater-discovery.json",
      "before": null,
      "after": "9688c260c11b30dbf2f7dddb26bc0a90fcdee231fc012bc79fdb07837b4ad4ae"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/blender-baked-deformation-runtime-adapter.json",
      "before": null,
      "after": "603ba4de1f30d6e13867950d7c3158a59092695030f5bf418a7006af045beaa9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/blender-evaluated-mesh-handoff.json",
      "before": null,
      "after": "bfe8dde68d7c30a9c47de969a9ab89d617bd39fd5cec7dd08bee0f14158ec807"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/blender-headless-gltf-export-script.json",
      "before": null,
      "after": "a97396ea2ccc7dd78c7b0aa00b842eb92cfeff03ff6c756fe5a1fe940000cddf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/blender-three-linear-color-handoff.json",
      "before": null,
      "after": "292ea0265139821210af3efc62e22752943870395dd1757f53fd95c8df2cd5b2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/blender-three-tangent-normal-handoff.json",
      "before": null,
      "after": "4688b5f474850102e692bc1a2f2d85ca45815f3ef7a6d7fdb4850544b5275080"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/blender-view-transform-tone-mapping-table.json",
      "before": null,
      "after": "bc6ba02c3de0d018f11b126911566609e67a8c02b8c6eb69604645998098676d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/bvh-spatial-query-adapter.json",
      "before": null,
      "after": "dbb5b8401fc527594b906c09f14c2024aa26e4fd5c1e4e9521bf47c8d9e35500"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/demand-driven-render-adapter.json",
      "before": null,
      "after": "f9e0793d891b388b024b9685e2349f9223be08830df6a56bdbfb7880d92d8545"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/dicom-image-frame-value-bridge.json",
      "before": null,
      "after": "d4365151ce131d4cf888e63e241613ebae7c21c48d4b267015977938e6109f79"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/fixed-step-interpolation-adapter.json",
      "before": null,
      "after": "b5d530abc1b412d6635a3939f7861d050ddf8817e5812dbad0133c28c77f3de5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/geometry-nodes-instance-handoff.json",
      "before": null,
      "after": "e61a74935fc0a4d851f44283d314c107e9d0b2d32acaf8596e5679cabbc04831"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-animation-pointer-runtime-adapter.json",
      "before": null,
      "after": "c8970f62455f1f969ca4d60b18bcddd17c7351c81424c14323b30183c0528bed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-articulated-asset-adapter.json",
      "before": null,
      "after": "9bf4cc7571e42da84139d9bf2bde8d72618470b4c3adf4fdfcde7fa9f6c80fb8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-compression-decoder-lifecycle.json",
      "before": null,
      "after": "9611607192b94e9392cda6a2ad797dfda30878dba7da2fb9e9e404f245943774"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-material-extension-matrix.json",
      "before": null,
      "after": "745cf756afb10629ba10e8583bee2ab04c471105492b6793c7a07c774de44cd4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-punctual-light-units-handoff.json",
      "before": null,
      "after": "9535050831a3d4cebb6a964703f49dc039f661a24c3b53766e4c2dcc1b27f9ca"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-texture-transform-atlas-handoff.json",
      "before": null,
      "after": "a819cda825fa555a2663eb1161d28db055bb640ccdb5f2252c63ad1c7c7ea6c2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/gltf-transform-pivot-handoff.json",
      "before": null,
      "after": "f9e766b4f1345b546a390847dfb5d324f89c138c3b26796855ac4c354924020c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/molecular-topology-trajectory-identity-bridge.json",
      "before": null,
      "after": "a2a314a469d56aa1c06b047a79bdd5d571017ed245c7436a0c6c9491b8934d04"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/procedural-texture-colorspace-adapter.json",
      "before": null,
      "after": "0cfe454e86b9bfa0f31e206e91f748d0ca5504d95df05e945aa8218c0988e82a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/section-plane-clipping-adapter.json",
      "before": null,
      "after": "59a9ea828f79ff84be990fb72783260dcf874d4dd26fd2bcc8530e72b52d05b5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/three-animation-mixer-adapter.json",
      "before": null,
      "after": "4f95b586a5f7c23b63afb97f3c167d8b7c868edb5bbebf9eaa1221c353e58dd6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/three-instanced-scenery-adapter.json",
      "before": null,
      "after": "478dbf194d204edc632aa8a68fde0c3a76f2b733e6f9def55647343fca30f7b5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/three-light-units-and-exposure.json",
      "before": null,
      "after": "68d98661bd1587e15055e506b01a10fdfb7b67241d457e730bc72c128669575f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/three-pbr-adapter.json",
      "before": null,
      "after": "fe784069e71daefafe856be8a9146af8d34d972359184d377485248910f6757a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/three-rigid-body-adapter.json",
      "before": null,
      "after": "7752d6a109ca1a4b1a302b4d8772bda2525f529e4f673560fec91dfe515173aa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/three-scene-adapter.json",
      "before": null,
      "after": "48f24a66520838786e34d141e704126665b4bceda44eda95834f7bf4627eb280"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/tool-adapter/vtk-field-association-bridge.json",
      "before": null,
      "after": "2253eb084f45a2c7ff0e9ba17aa09c7357fdb1877885d4444a4bbda439c98ebe"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/color-normal-material-parity.json",
      "before": null,
      "after": "af6f693255213006e2ac9f25d8e31539a289894843bb8d7ad5e296fb90a0744e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/gltf-roundtrip-asset-validation.json",
      "before": null,
      "after": "e47397c80335d1e67ad2bfdad9c8b9c59cb87eedc8bd10012d81f03d5c9d6d9b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/interactive-scene-accessibility-validation.json",
      "before": null,
      "after": "d7bfb994cdd327e8cbfb5cb36a39df12a400b8eaf5dcb47cc596fffe0b75012e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/material-response-check.json",
      "before": null,
      "after": "5648760554bff495dd40566fa19e42f144d2f7ca6df9cec6051fcc8a9aef1264"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/physical-action-reset.json",
      "before": null,
      "after": "06582c3e775a096cd47bdc8009b40243e4ee7aab383f09212ee6f52901502a77"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/structural-coherence.json",
      "before": null,
      "after": "62b5830a2bdd03b3222db46f1ca38f05ab21714471746d7ddfd9fea3b79209e4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/knowledge/validation-profile/validation-default-tolerance-rule.json",
      "before": null,
      "after": "c90a2fe2d633a53172f7f3ff7842c301803ca7c59e9fd8b6668578515401222c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/landing.csv",
      "before": null,
      "after": "080cedbcd61ff8ec9520f33929baa76bee9589e783f83b2f8d824a466b6a46d7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/manifest.json",
      "before": null,
      "after": "885d2e84018a1ffbe00940af90f7a00d216e29a2224ce93e04783d44c0c324d5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/photos.json",
      "before": null,
      "after": "7bd47a8cb5a8e7ec76ec1013364a59991f8469f9eb1b74873dafd24a6d613312"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/products.csv",
      "before": null,
      "after": "51e88e892017e4ad5f309ea2ffa749dfd71d566173aebe512034c6bed899b8f6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/react-performance.csv",
      "before": null,
      "after": "904c8afcda229629545912dde0e8ac37503757131f0169f80b016f1f58c4fd3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/accessible-clearance-study.json",
      "before": null,
      "after": "706c604234bb3a54e4ad791a64d891a640c6367e361a3fa14e5f3f3625c597d2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/agent-harness.json",
      "before": null,
      "after": "2dc52f8887211aa91bea4fee07f5384e1f7ad3bf349917238f330ed8c068dce1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/agv-zone-reservation.json",
      "before": null,
      "after": "ca8edb969e0a428d450c43110803a5948709fb98ec8960fb97f3aea7d7970398"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/arm-workspace-singularity.json",
      "before": null,
      "after": "6b737842414782164a15a60d3a4e1ddaf4ac31b2770b02096617ee82c9aa6687"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/autonomous-planar-phase-portrait.json",
      "before": null,
      "after": "f6259dd950ca7ee7652d2b21be78e65b2a3f25059e5a9dd1f87ed9f5ba827df7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/bicycle-drivetrain-ratio.json",
      "before": null,
      "after": "9772db54b4ec966586efb13ab60c32098b4920238442612c98430d96a128ac11"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/big-cube-wide-turns.json",
      "before": null,
      "after": "8ec53f73d88ba179b9223a4137c63394938ee98d5de521fe75632cc0e50cb55b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/binary-heap-operations.json",
      "before": null,
      "after": "133b6b3ed82bb438519da1bf6ec3f216fe3cfb79bbbd4d8612ed05aacb0e75fd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/binomial-trial-lattice.json",
      "before": null,
      "after": "107ae7933c6af06931a1028f2e12a5433da48aa390779ae0baaf24f9b5e8a8f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/bit-vector-smt-model-proof.json",
      "before": null,
      "after": "20234b3bf9a54aab4382d339d35f763dcd9c1e3d8ce5a90ebbcc9114e3525bd6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/bounded-maintenance-procedure-state.json",
      "before": null,
      "after": "f9d2aa803fa3603dc19dc0ba4a69755f0c11159b34d1a43682bdf3ebd63a1664"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/brachial-plexus-routing.json",
      "before": null,
      "after": "f7ddd6c7b5a908b3e1dedf307aaa00e41f3931aca2b40d0772db870af15c5a5d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/breadth-first-frontier.json",
      "before": null,
      "after": "2c9a7ca3b220da5728ea8e919fe8a97f5405c6fedb8d3e46e2018bdf81c2545e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/bridge-load-path-beam-model.json",
      "before": null,
      "after": "b2210f636b423624c89894eddb32a85a00e857510d49cb0c06bc146d704a2ac1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/build-dependency-order.json",
      "before": null,
      "after": "fbfc2281cda3556ede6a64b424f1a9ab2ea19a2479c26370ee0c788f2be0f6e3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/building-service-layers.json",
      "before": null,
      "after": "5f639dc1b782f67b47ecc97423686d1b161abe6f6e9e0b3380bfadd36f58b1d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/buoyancy-floating-equilibrium.json",
      "before": null,
      "after": "d6f082cbcfbdb72bce5a4d54384a1bcf8460fcd8dc51beefd5fbf4d260a3aae7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/burr-disassembly-order.json",
      "before": null,
      "after": "a8600710da2650c8f23d41f64aeff2878e2e65bb6af0ab706dccc89c6e2fe9e9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/capillary-exchange-transport.json",
      "before": null,
      "after": "a61ddf35aeea4d3a1eddf217b60b060c222cd3cf161b7f13f21cc901b6152dee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cardiac-cycle-valves.json",
      "before": null,
      "after": "cfaf9e5bf931563035bae2b84167bde111aebc8cc5df9bbedce3043e0497dba0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cf-ocean-current-particle-playback.json",
      "before": null,
      "after": "eed3b6773d52a8f289f1437f0810c5a7ef1febc0ec65d13e6aea80ae7cfc90dd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cfd-field-playback.json",
      "before": null,
      "after": "25996c2e25b33ba3015072f4a726589d37698c2e54a2ad607e8b3bd2facf59b7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/chirality-stereocenter.json",
      "before": null,
      "after": "8e76ba3522165aebf780b3ee74439617793b174212ad404f0e7431b1f82b056c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/citygml-stable-id-scenario-diff.json",
      "before": null,
      "after": "e6d704cd58496fd3352df7c8358e067954ce13427f717bda45960e2010377f55"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/closed-lane-car-following.json",
      "before": null,
      "after": "b2db2f320b7d2608faf1fb7179e177c0e526f35897553d8a7064ae42ee438a97"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/collision-momentum-lab.json",
      "before": null,
      "after": "9b77de4a8ca49a7b845d35d7de1b4c768864399337e3daefaeebf6b26626eb2f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/commutator-conjugate-tools.json",
      "before": null,
      "after": "7e1332e347b6aaf769f9dccdafc5441f1802e535e9d14598348ada39bcf4103f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/conic-slicing.json",
      "before": null,
      "after": "09f6ff0d5317f1399cdf42d3e4df45070d396214bfcb99aa9b02dd16ecec1dd3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/construction-sequence-playback.json",
      "before": null,
      "after": "87efd7790d8d5baa69e2605bc623bb4ebcb0c5108d7cb01d2a6f07b1a441260f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/convex-hull-construction.json",
      "before": null,
      "after": "7be0db6258cdf38fd3417f3d99c96e2afbcd58aaf94af9eefaa3df81a02c1e7e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/coupled-gears.json",
      "before": null,
      "after": "33f55c4dc39cab352b6bf018677fab8af63035a15a29b2da7a1c966ca0157f46"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/courtyard-house-cutaway.json",
      "before": null,
      "after": "bdccbc940feda835f637fac2f4f6ba76bd0f6c7701e79b27e395bb2388880943"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/covariance-ellipsoid-axes.json",
      "before": null,
      "after": "81e1beb42df20f7556a2f68805c0bc360f982eaac663557edbd6158049c8f874"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cp-tucker-tensor-component-reconstruction.json",
      "before": null,
      "after": "6c4fa968d3087f3484d2ddad38a4cbc15e03f4f3b3495eea86aa757d4207281a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/critical-path-delay.json",
      "before": null,
      "after": "6f451277a4f48fdca8087d3509a6d81e193fa27fff7cd0596f76d6319502e99e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cross-product.json",
      "before": null,
      "after": "8d927d21fe3114c7a61d5a3c9527ca38b99bb05689c7b65ffd0f6dfc53b0ff93"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cryptographic-protocol-message-state.json",
      "before": null,
      "after": "4433e1a6937c3d68ddf2a51faac0ba1de82c4a21e3c974744d867101774372b1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cube-state-invariants.json",
      "before": null,
      "after": "1462807e4dd4f09079562779bae101a0e59f602cc537f44d6a3ac4a393a26f4d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/cubic-unit-cell-accounting.json",
      "before": null,
      "after": "90ba0e2755f75764c42c48298272ffe213012bca74d96ffa2180ce853b31aed1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/curl-circulation-loop.json",
      "before": null,
      "after": "d69037fe996f7d60d84c7d67f80cfc35ec95bd0b7d111108736385d9a2800384"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/current-loop-magnetic-field.json",
      "before": null,
      "after": "7e13e9a95d930afbf80826b7eb8dab0b36e1b4eb36b6ca67dbfc545310c7fea8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/daylight-shading-study.json",
      "before": null,
      "after": "0a0604f16dc1db431385c3dea465f0fefacf05862462671b92c56a4e6487fb86"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/delaunay-cell-partition.json",
      "before": null,
      "after": "7b3b860a91d9eb73cabdc506e1661baee08299b0f4b2fd7b5640ea5f5365094e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/dental-bite-moving-hinge-illustration.json",
      "before": null,
      "after": "0dba3a2a1be03599e41ca4cad08ee1a62943390ad116c9259d220effbceb628f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/deposited-protein-binding-site-inspection.json",
      "before": null,
      "after": "ec5414fc902a13d5c204be8036d5b8654e1a4d08e3ed045ddc5954f9620be09f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/determinant-volume.json",
      "before": null,
      "after": "7e23f1d7e26e466aab9c55ee37e6ef2a8380e968e09e14b789cd506fbe62129e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/dicom-spatial-registration-landmark-residuals.json",
      "before": null,
      "after": "1e0de3462d9ab6b3da4ddd8edd2a0786fe6dc9a8b509c1d2ea56029383a1f5bc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/differential-drive-odometry.json",
      "before": null,
      "after": "1d2e3d4b576e8832b94da4a4ceee992099bf91ad6d5233422f8f607da3863422"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/dijkstra-relaxation.json",
      "before": null,
      "after": "0ca55ccaef796f91494b83228035d423747d3fc438f75d180ace81d79e9a6a2b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/direct-turn-cube.json",
      "before": null,
      "after": "4afecf83cfae71575acc5230576c4c5162e0b00a5eb32081df3472839b8024b6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/directional-derivative-surface.json",
      "before": null,
      "after": "91e9a731aa92096eef4c9f87c654b2c83bf54e6dd2eaec14e5bbffb3194f6970"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/divergence-flux-box.json",
      "before": null,
      "after": "a5e3bd56ffb22beee2f967a4db812bfc752a895af1f3af7b390e52b84e4a29d3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/divergent-ridge-crust-age.json",
      "before": null,
      "after": "aa41a66f093bae266760f092c323406c55c6ccedfc415cf9f262d9fdbdbbec27"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/double-integral-columns.json",
      "before": null,
      "after": "ea409bed8022f8056c37cd1240a2ef9e8d1cce61d86feb91283aecc6b297a3b7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/earth-tilt-seasons.json",
      "before": null,
      "after": "a4d255c6274769a90f2d3d42b8da13a1def630d9d165c100414ff389d4446561"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/eclipse-shadow-cones.json",
      "before": null,
      "after": "14c3599df9bf2eb5c63bd9ae33850cb40be2f1bf16cabcceb99033a32846e7bc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/eigenvector-invariant-directions.json",
      "before": null,
      "after": "1c5ce3b4d9c8ecb0c4999a8d8e70c0e963306cd3cdda33e43d4e1a138d53bab5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/embedding-projection.json",
      "before": null,
      "after": "b93c66cecb7f4586d676f46a63ffeec7b181fa6cbd7001db63277f803762a20f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/enhanced-dicom-frame-dimension-inspector.json",
      "before": null,
      "after": "8200cd7622a3689836209825540530abea434063c4b3308577262b2a2611738e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/exact-cover-packing.json",
      "before": null,
      "after": "e0e5e7b2e6d3c2bf8cfc6b89996e8ff2909395c1ae03772c34482784c4e8ad29"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/expression-attention-rig.json",
      "before": null,
      "after": "fc973b6644e719d5d086d3451f116ab9417464931f51823c38951121a3ea0c0c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/fantasy-village-diorama.json",
      "before": null,
      "after": "2623aa6106ed2b25eca8c163b484b2991164d823e3a17b88d57845942adf8b49"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/fft-finite-window-spectrum-reconstruction.json",
      "before": null,
      "after": "fb1572bfc62b98a615b89fc75bf333ab4fab8d7655a724b7a57b09262279fc8b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/finite-egress-network-capacity-playback.json",
      "before": null,
      "after": "9d43c0194742831e08b024a848d8818374d0ae5eeeb675074b2cf4239bbac46f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/finite-state-machine.json",
      "before": null,
      "after": "1e3f72fb3800d4c107d18056379083fdd48fe7d7317379395885ee360ae93767"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/fisher-reaction-diffusion-front.json",
      "before": null,
      "after": "26ff2cad6dedbeb8fadfac10e083dc50e5c57ccffab158439ff7f077c0bb2af6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/flat-pack-assembly-sequence.json",
      "before": null,
      "after": "9831230bf49724199e488a5e6d7f9ea435593da1f5d7d314cdac02615063f8b3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/folding-desk-lamp.json",
      "before": null,
      "after": "7afb6ee19076f69380c394e0fe8426f9815d2388a809a9f15638f2ce418b9956"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/forced-damped-room-response.json",
      "before": null,
      "after": "5a271a05a1c3884e20bbb99e0a6d5164fba44581b99a7c8aa8529aa45d39fb5d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/fourier-harmonic-synthesis.json",
      "before": null,
      "after": "304a9cd4252ae7c64c5365ce8769edaecdb91ad86f8d3580d41e23e34c4f29c7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/full-adder.json",
      "before": null,
      "after": "39a91d99aeaca82455702fe3905d033267601ac71aa6e5ee49cb53523df3da5e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/garden-creature-patrol.json",
      "before": null,
      "after": "452bfc64d0e5c5d774838309210c251fe39c44b29319a01a8c8d5c3e8966ef52"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/general-soft-body-boundary-test.json",
      "before": null,
      "after": "fe20336c73c5b4d522a28251b5a6813e4d78787c2ae5171c1c60a81074e21000"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/guided-layer-method-tutorial.json",
      "before": null,
      "after": "dcf89b6fd2d10c8f656a24848d75e69787b5fa661e9d5ca55716177a14ad530f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/gyroscope-precession.json",
      "before": null,
      "after": "48862af71ae9277456f62f6067938bed0659635f2bb55c764007043963dc2dcc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/hanoi-optimal-bound.json",
      "before": null,
      "after": "34ca9964d1d92b32fc8e3a12e75264c3ab4f9a19c4f243330683b6d587d087bd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/heart-cutaway.json",
      "before": null,
      "after": "0107ed7ec619ab1dd5848d58f59e4b647b88c1161c5c243003c0ee996b56f158"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/heat-rod-decay.json",
      "before": null,
      "after": "562f497d2057f4949f9924238997e9c8cd4cc0a1ab18380a2e69684e269baa48"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/hepatic-portal-route.json",
      "before": null,
      "after": "a1193ae0bb9ef8b07561ca6a62f6b0ab7b8639423319bd37c61c47db2dfcf2eb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/hessian-critical-points.json",
      "before": null,
      "after": "aacb766481d2b7310b84d5aa0812f1aab08af22bf8d4921d130d8de36a8d6a81"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/historical-diorama.json",
      "before": null,
      "after": "ddb5565595e8634ff92745d61ddd880ae2f57dd083e9a8e4d16d458297b2c16c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/hydrostatic-depth-pressure.json",
      "before": null,
      "after": "71ffd5ede56670dd9ba9ae230067944d0b97688eed16f0115f6809ced997e8c2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/imported-cube-state-solver-verification.json",
      "before": null,
      "after": "357956e5a1ca7dcfcf0c7fd0773cdc998b4dc4dc4af0d37ab19a4773eccce448"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/interference-diffraction-pattern.json",
      "before": null,
      "after": "3ccdeafa8eb777e9f0cdde17fe45f28f73a81c387d2a12f361fbf70c245c4c1c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/inverse-kinematics-target.json",
      "before": null,
      "after": "bc134f77a1ea2cd74afebf41830a23caf11481b197d3d860bf0e359a1cf02401"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/irrigation-finite-scenario-envelope.json",
      "before": null,
      "after": "614152ae6f9442e499b325572e539eec5fdc15a206b0dfa8dd1d0a2a542dfd7a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/isotropic-seismic-plane-waves.json",
      "before": null,
      "after": "65c780ae5525275a3e1b4257ded03bced4d2746793c2fc3205b6348c7af1c17b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/job-shop-schedule-playback.json",
      "before": null,
      "after": "54d63f6daed2700d4050d586ffdc3f3513abf6ae56ef357a7bc29e9c91e6ca14"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/joint-pid-control.json",
      "before": null,
      "after": "e779d766e55523e0b46604ce3c9fc74958f1ebe2e5d97117df1073fd4b9749f2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/joint-trajectory-time-scaling.json",
      "before": null,
      "after": "8602515bf76c71882b8b238ebe41192559a3398797605c4c515a9b780163d9d3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/karst-cave-network.json",
      "before": null,
      "after": "7240769e9991442c1568ba0183894e72baf4e08c77b0d0c30bd93db3aa9cb347"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/kepler-equal-area-orbit.json",
      "before": null,
      "after": "805f8ca7c54718b3f7e3ee0560e15fd8ebd9f7a81acd8081449ec9487da22036"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/kinetic-typography-stage.json",
      "before": null,
      "after": "198a9f861be3b5a142ba9a2c07e1dd3ab192e7d82dee97a0720592de2e14b74f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/kmp-prefix-pattern-dfa.json",
      "before": null,
      "after": "f11d50468801bbb476c1749f58fe0581087df8401bf0bfe6b844f0adc4327d84"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/knee-layer-peel.json",
      "before": null,
      "after": "a3c94ac0c84f4aa0f3fbffaed3eb5987270f256c0213f120c890496dfc1fb097"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/lantern-keeper-puppet.json",
      "before": null,
      "after": "fc9a78af01b2c8ad5a2c9c83073a72077896d36bfe6c8791ee03e3011599cf78"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/layered-atmosphere-absorption-ray.json",
      "before": null,
      "after": "e6423ac86b5606c3e5b414521c8be8624738a43f6bdd668274064cdf17479339"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/layered-attenuating-seismic-rays.json",
      "before": null,
      "after": "0ec76cc2ecf9ae55a7743828650e60410e17b40434c88827a750e5544ced58b6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/layered-maze-navigation.json",
      "before": null,
      "after": "6c5069feb34acac9a61772631d38854729e7812c291921d53990b4d9b883f22b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/linear-transformation-3d.json",
      "before": null,
      "after": "44813bde9fecb56b2c39a3147c6259f87fd2db2e763364cb7203c7046bb658cf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/loading-dock-resource-board.json",
      "before": null,
      "after": "ca73703ec0515f07416716453b7e38105b89f4146d42e3a178815ecd578e7fe8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/logic-gates.json",
      "before": null,
      "after": "c2ba2c73bcd1b76caa2fae3931bf6d452e65837165406b3ba99ed632e2eb1c76"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/mandelbrot-escape-orbit.json",
      "before": null,
      "after": "3a2ec1aad36f8cac7a600f8ef4a30d5435e392c1e429f7a759e5d9147bebd460"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/map-projection-frames.json",
      "before": null,
      "after": "a99329ec2c9e561bf38eeb6ac10d86e08e178faf40da29e0ee77e7f45cc1870a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/markov-chain-convergence.json",
      "before": null,
      "after": "9e44e2251f04ac15a77e04c2fcbe1016fd08cc80ccd7f342ab6cfc2fc3a3e9d6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/mass-spring-cloth-contract.json",
      "before": null,
      "after": "a5d427658f01b25a0a78ca7aa8243eb1574490a9bb12f9ce49f70b9a4396ccd5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/memory-allocation-fragmentation-trace.json",
      "before": null,
      "after": "d53f5f79d3b2b76f2911558b084c37122c887d7849af129ad44e45ea89689694"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/mesh-orientability-check.json",
      "before": null,
      "after": "2a620a27c17918c04eee03fe084f22e1401feaf4d63fb4478d396e8de782be4e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/minkowski-clearance.json",
      "before": null,
      "after": "dda4cb51b1e649b5faa6b7430e4c3a927e9381ad02b624b4ecf5469744709420"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/mobius-orientation-trace.json",
      "before": null,
      "after": "f7da76ec03c78275b1eaf45215ffb2e2c35a5e9b881ffcaa5e05ffca3d67d24f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/modular-camera-rig.json",
      "before": null,
      "after": "6305287db4c6ad93a87e4e871293da9891b2123811bcf9b54d5995cfdca58bec"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/molecular-shape-comparison.json",
      "before": null,
      "after": "56aba87a550f8377263bf33a821d0aaeae4655ee9a8709dacef541b31416802c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/monte-carlo-volume.json",
      "before": null,
      "after": "8bca8b5f3ee7009b6ef714b827fed8e67ad772b0c6fa7033fbcf20978243a5db"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/moon-phase-observer.json",
      "before": null,
      "after": "5f4a35f6368e2998acfbcfedd99fdbce7b00b5c338e8578db2600880965a55b3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/moulded-enclosure-draft.json",
      "before": null,
      "after": "5824a368439158f25f9a1b0afc7b1f794ec2c5fe3015372a22710fd613fb5e4f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/multi-head-attention-comparison.json",
      "before": null,
      "after": "39fbd957bc7ac31a8e8f8847aa1764247e12e0f55fa9689fbe077b3a2b3036fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/musculoskeletal-lever.json",
      "before": null,
      "after": "8d0c21688293cfd00b56bc268df1ee0af1ef7920c1aa3552eb640f61760c9b8b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/museum-route-object-inspection.json",
      "before": null,
      "after": "70697eb6b1fe572ee22688742bb247e80ad7158f52d568b840fae33d91ce4787"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/museum-visitor-evaluation-playback.json",
      "before": null,
      "after": "129e7e01073c5c1e78b25fb5776a8b29b3446d5e5d2d8534c1ba14d04ff50ddd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/music-structure-spatial-mapping.json",
      "before": null,
      "after": "1b7271c0300802efb588613c9fa3a98f6c6541ff913b63171c7f0476680b9d90"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/natural-deduction-scope-tree.json",
      "before": null,
      "after": "5212eb83c921b63a8ccc57cf9ee9152f3244b4ad1b4170f9d600f988214d7d6f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/newton-cubic-root-basin-inspector.json",
      "before": null,
      "after": "5ece4ff8f6d5a584da9b24e008cfb069284c38a45c9abdc46c1009b987333768"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/night-market-street.json",
      "before": null,
      "after": "a2ce43d465faa0d11f26aa847c44b3e0de28ca3081a416ac907694318ddfddcc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/normal-density-window.json",
      "before": null,
      "after": "2325387b9a4a118461783d98cc83e45a0f2492fcf3cfdb00ff2a88e83509d4a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/nozzle-continuity.json",
      "before": null,
      "after": "8ec93f82e53be53040c2efea8557d055e6691b705a32d81d28d8fa3276e81858"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/observer-frame-constellation-playback.json",
      "before": null,
      "after": "f49e648aa64bc92d59da6513292f6f6d736c81c6615254de3a343e12ae29382a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/open-signal-queue-network.json",
      "before": null,
      "after": "603ea3d5911a40ebe5c30adc4a1eec90292ea9261d50d6be0bb936c35d3283bf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/orbital-elements-explorer.json",
      "before": null,
      "after": "0aca7693523fdb11620f7b7685f8ed9c691f6790deccec9966da252bf11d2fd9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/orbital-isosurface-phase-probability.json",
      "before": null,
      "after": "917087feadfc26cc895c55fc380d7e8788dfdd1a43d4539237e3f68f11614dca"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/orbital-reference-frames.json",
      "before": null,
      "after": "f428960402ca18953ddf0722d361f38a71ecd7d6e43f39da07b393bede1988ca"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/orthogonal-projection-residual.json",
      "before": null,
      "after": "3fca57ee8ee68d2f089c8bfe0072fb2d6697d2dee151d311fa6f1a051397e833"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/pallet-load-build.json",
      "before": null,
      "after": "50e3281cd0c347dcf98fe68c39e9aa49be11cbbb93482b58fabe8183b1d73ed6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/parcel-sorter-events.json",
      "before": null,
      "after": "1abe3689de604b12ad67305169cbf30c2189428e72d377e7647bd230c4857585"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/periodic-trajectory-temporal-unwrapping.json",
      "before": null,
      "after": "9f6c6d91621debf9a6e0ae0ba28780c0b93c98d9b78d8ed464bf04d42b711cf5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/permutation-cycles.json",
      "before": null,
      "after": "7d07eb0349368e8f844d3be72dd9190dc2ec4a3f085cf95820531271e611ae7c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/petri-net-weighted-firing.json",
      "before": null,
      "after": "90e36daae49346782f437d08731e95cea9a386bf19331884da9d80bfe51a2b8e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/pipeline-throughput.json",
      "before": null,
      "after": "ceb15eb5f45038b562c72ebcd001da392dbdee6c52614f113c0abf9f6e82e37f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/planar-refraction-ray.json",
      "before": null,
      "after": "3cefda1862384e965a34a5c0d186f3ed5b4be626af9d0d20957663884ae22ef2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/point-charge-field-superposition.json",
      "before": null,
      "after": "790f2d56a74e75f42e763c7b12362e909fed91718bd79a1ef5a67f27ce905dd7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/polarization-malus.json",
      "before": null,
      "after": "f754000eee2f996727c5d1ed254b0955e9f346b357deabc9ce95d489c713bfc1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/polycrystal-slip-planes.json",
      "before": null,
      "after": "4718cb197d2cee88c63dbf04ccea144319aa584001e2471b8ad596600683b36e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/polyhedron-net.json",
      "before": null,
      "after": "fd8a5cb8ea51fc4812135db6f0060b26c4c0ad420dcfb72acb59fc247cc2c859"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/portable-speaker-exploded.json",
      "before": null,
      "after": "6b6d4760a00e2dc6a46cb2080493f0f150e5662c53ab4c3c6570e9d16b3a1aca"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/predator-prey-phase-time.json",
      "before": null,
      "after": "5d8a04fdc3576e25aa047a65c04712d2de8df14b1c8dce7fc864e54fc7443c71"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/projectile-trajectory.json",
      "before": null,
      "after": "16145f16a58d275137215101cf0be2e99cb181756da2eb6060e803a210e886f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/protein-secondary-structure.json",
      "before": null,
      "after": "c340feaff375e020317a36bb7ead55df255e214fc8c4bd09308afe18e64e0877"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/pyraminx-legal-move-state.json",
      "before": null,
      "after": "f901a29983818d88830d7687ddcd40fab7e7af1fc26480c564747832db94e583"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/quadratic-julia-escape-inspector.json",
      "before": null,
      "after": "8c8744573cb8e6644b13d5602f05593954c2798b20cb29315eec068fc737483d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/rag-retrieval-provenance.json",
      "before": null,
      "after": "ef9c9b33ea632d3a7b3fab2be76ade0efb5c018ae04d6cd602c172f5de94fa70"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/reaction-coordinate-energy-profile.json",
      "before": null,
      "after": "4eb75c7247c73975cfaf17414a50ae7c25f5189bc98ddb00e1dcc9d74209e01d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/reactive-trajectory-topology-change.json",
      "before": null,
      "after": "54a6da08c546b0b8ef25c4d4dd4f29afdc91bc89c429cae1018a1789089c1a16"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/reconciliation-control-loop.json",
      "before": null,
      "after": "e1baa6f2dd0bdb116bf0949915bde238a97ba178d6ea56e691d052b73a2400bb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/rectangular-room-normal-modes.json",
      "before": null,
      "after": "5bed6d010451181ffae7408ff5bc275f2ca9d7ff33d8ebab586bc51df8c653a3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/recursion-call-stack.json",
      "before": null,
      "after": "c304ba318ad1826289b1309638462dd717e6b77b8b367a50ba82de603c130162"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/replicated-log-consensus.json",
      "before": null,
      "after": "21bfd1231edb7062a24ea6234e1e6475aeefbdb5976e231c842f894ee94e2cf6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/reversible-branching-storybook-scene.json",
      "before": null,
      "after": "59023a878419dee4d9eef26d64656952ca19fac3f14de9108c4a9f38eb67f8f2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/ribbon-motion-sculpture.json",
      "before": null,
      "after": "359d362e32601d668845496e0dceddc23f8546b77b085f2d70d78a86a00b0923"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/riemann-sphere-reciprocal-map.json",
      "before": null,
      "after": "5d88b0294f2b8c8bec5aa65f173df84d4c1a9633ca5c373c5355375262a0d3fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/robot-arm-forward-frames.json",
      "before": null,
      "after": "3c71c90727bbd0f749300df8bd545031a9a82941bfe5e396ac2c6ca8c118e0b7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/robot-contact-task-execution.json",
      "before": null,
      "after": "38105961d54e16899b39f4d53d7508a6b7d3c764b5ccf6716b6156e5a116bec5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/rolling-inertia-race.json",
      "before": null,
      "after": "774bc7079a3ec96f8f3e7187ba1f64f1e28809c5e641d47cbd015233c5684995"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/room-first-reflection-paths.json",
      "before": null,
      "after": "6b85d12a9292b4f721c4a1ad5f7abb98b6aed8708eb7e61056a9eb90a3711c08"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/root-zone-irrigation-budget.json",
      "before": null,
      "after": "f9d5ff2c5f25efb3145c110d70675274be8b9722617e11c7fc44398b230b77de"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/saddle-node-normal-form-branch-time.json",
      "before": null,
      "after": "4f63e980b24674aeaad302f4df30d99943e9879eced990bf39ebbe0ecd0f9c9c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/sampling-mean-distribution.json",
      "before": null,
      "after": "4fa5f96e931f2afeacbf57909a1c2598cb90e6e3c9edce9295cedba38e7ab273"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/sarcomere-sliding-filaments.json",
      "before": null,
      "after": "370e2486c129c764cc6d6e12077fd6b23dfa00c43d16a76f1901b56089c8b7d1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/sat-model-resolution-refutation.json",
      "before": null,
      "after": "2b9013e1a3039c5612ad4bd2b49e67221aad8f622d4a1229752f140a77c94254"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/secondary-motion-chain.json",
      "before": null,
      "after": "2ebc783044af18fc691be3f0630c7c42721f4f32ecb91e978aa19dcfd554d6ff"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/sensorthings-telemetry-freshness-sync.json",
      "before": null,
      "after": "a3b085d4f5cd83f42a6d7e8a26f73d74e414f063c857b3949a6ea78101805c0b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/service-graph.json",
      "before": null,
      "after": "e2a60547cd40f9cb220fae3bbecb4c78a2edaaa598bb6d8f4c5174340d2d1799"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/setup-hold-timing.json",
      "before": null,
      "after": "3ff8dbb25eebf5e0ca61f4e39c16584490e0426d39ccbf81d392d377d27223fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/simple-pendulum.json",
      "before": null,
      "after": "2a8def4c62ca090ffab5c72ee50d0fd8072bfa87312471b4871f52c59f658469"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/single-attention-head-aggregation.json",
      "before": null,
      "after": "50734e6640338172e48be94de46e09e3e903090a2924d2fa160e8dddb8b0da0b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/single-qubit-bloch-ball.json",
      "before": null,
      "after": "e25bf38134a15c400fb7707d05252472a1c5cea2752de736ddffcb3996b75eaf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/single-qubit-channel-map.json",
      "before": null,
      "after": "2842c8322f575b3d454da53104e005a9d2831d4eaf3796e54f115e62a56a7d14"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/skeletal-hierarchy.json",
      "before": null,
      "after": "ae2aeafab91e433ad09d80971925ddf9cc9b44b6c38a0c090949b49e2915fdf7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/skull-foramina-exploded-route-atlas.json",
      "before": null,
      "after": "cd7efb57853654fe26037bd9acc16ef6c39d1617a92e7d4474698e5a87703777"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/sky-archipelago-world.json",
      "before": null,
      "after": "6cf833a3b235fb2861e0b7edc7b741d90302660796dfb2017e4b8d62cbd1710d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/sliding-block-escape.json",
      "before": null,
      "after": "7636cdaaa213044cb196a67ea6f140664c9b1eb0fec1e5b7c823e5b169d8e785"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/small-neural-forward-activations.json",
      "before": null,
      "after": "37bf931ac6f34e4ebdfe191a9ba3b7009710e1d7dd7efc94947a9a40dd93912b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/smt-arithmetic-model-status.json",
      "before": null,
      "after": "a7eb1ba904cec71ce88a37c65763fdec3c40a58e04b463d2eb5066d875f21460"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/solid-of-revolution.json",
      "before": null,
      "after": "1b482d7d0d4b271773f37aad5c6894aad7425c1a14bb4185bfa923eb4f1737a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/spectral-transition-orbital-inspector.json",
      "before": null,
      "after": "3668f33103a751dc0be6a10e38b7a25aea3804a68a6472a9b1cda8fbfa45fd84"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/square-dihedral-actions.json",
      "before": null,
      "after": "c9fc9691eadb8c66ae28da7df4a52f0154425eeb164a1260efdb11d219b8a2a7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/stable-merge-sort-trace.json",
      "before": null,
      "after": "227b563a0c64d477e08d224d65b03663f787cb2975c934b1fd99097125ee9313"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/stage-previsualization-cue-stack.json",
      "before": null,
      "after": "ece0535fd7d162654b055b75c49ee501db491d97f6df044d1502899dc5871916"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/stair-flight-geometry.json",
      "before": null,
      "after": "9484a2c7f977d6a8cbd1c33d8766a1c9893f8328a97145faf320d7e68b01f405"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/standing-string-modes.json",
      "before": null,
      "after": "90d8edde6e85aa0f69d3b414491a0218280367d13cd65b47d4e28356070a53a1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/stellar-parallax-baseline.json",
      "before": null,
      "after": "8e1a8a81fb7727ce2e6bc241e5368638b7f4217ec77404ac2181f84c4900f269"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/streamflow-forecast-playback.json",
      "before": null,
      "after": "b8b6d9d5ba75ba707125c7a15ce70a51250f9d4bd5163145c6b7c8b1c9f305ec"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/studio-furniture-layout.json",
      "before": null,
      "after": "bf55e975d5a6f6ab8e0207e7d0438b40a7b82bf29d5c9cb6397721a9ce7ea39f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/supplied-brain-atlas-region-inspection.json",
      "before": null,
      "after": "6760bb12ac235dc1421d46aed5a34ed0ab46bfb311c5ad4043865058989e4e10"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/supplied-opensim-muscle-wrap-path-playback.json",
      "before": null,
      "after": "1951626f29cf175f42cae74a07b6022a1c08fd62b86de16f058ed4a7bff70d14"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/svd-sphere-to-ellipsoid.json",
      "before": null,
      "after": "03b1cfe5e33270b9c25823a6945e700c82191860a8161379111b687f4d572d03"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/symmetry-operations-tolerance.json",
      "before": null,
      "after": "14d9c2d3078006b86396572debbbf36cfc00aec95768ac6db7cc458add7a5382"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/terrain-contour-slices.json",
      "before": null,
      "after": "9aa60f1c7fa2f2b1b9afd70ef17774c35f962604eae3d454c38f604439ca1764"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/terrain-island.json",
      "before": null,
      "after": "67826d4c4ed3d5cb9969bb42b9d1b9cff55b888757c0e4fd1941f2133c9a2f4b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/three-qubit-ghz-correlations.json",
      "before": null,
      "after": "fc7f1063c9b5307eafba4881a6432290beb2c5d4b72861f33cb87b9a36db84f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/timed-colored-petri-net.json",
      "before": null,
      "after": "f91d5879775bec42e43288dd1030356e55a3e317de1c6df142f330a947e1ae8b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/torque-driven-four-bar-dynamics.json",
      "before": null,
      "after": "6b688c8a06fd5ba1456a1dccf1f4bdec792ce27dabc0ea64680e238d126fe5a1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/torus-euler-cells.json",
      "before": null,
      "after": "cf5929e24d8d3bd999a54a62fb0d68e7c74a3d9c6263a585be71f6501c771702"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/training-trajectory-checkpoint-inspector.json",
      "before": null,
      "after": "c8765ce12a7aeed811bf86cdd727f7b09b10f523eeb0c6893f9f2a5f42a4addc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/trefoil-knot-diagram.json",
      "before": null,
      "after": "f88c5da90cf5a89c262a927b629df2ff145a7f34be72e65103cf6fd4dfcb7d68"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/twisty-cube-3x3-face-turns.json",
      "before": null,
      "after": "fa9881f5760bb280c582bb5fda0464d2fb4291961bc926d00423e9b727ef8ca9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/twisty-mechanism-cutaway.json",
      "before": null,
      "after": "38694f61f5a351d79333aa104ffb5ebbbb1e38428d5649e94a88afb45055cbd3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/two-parameter-loss-slice-gradient.json",
      "before": null,
      "after": "4b5c7b6a9c5186027b0fa49e19a2b79d0585f5d9b374d9abcb06a7bb5ae6ecd9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/two-qubit-bell-correlations.json",
      "before": null,
      "after": "b0d0cdc4fb15cd624e1b9b9fc9574b57dcc3a8e327c547bc113cc41b78bf5339"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/two-qubit-mixed-state-entanglement.json",
      "before": null,
      "after": "fcf04588747f00935f9cfa39c088c5f04d45d5de24ad92c443dd3dcc1cf0e602"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/union-find-mst.json",
      "before": null,
      "after": "588aebb4a5405ba6b636a4a9b9f604a778d666295a8da47b284fac759f0fe86a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/vector-field-integration.json",
      "before": null,
      "after": "b34854a9377a8969d88e778ccd9ff63938f96efe0856bef8ff6f5ca202092bd1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/ventilation-pressure-phases.json",
      "before": null,
      "after": "a9f7cc7ff6d7c319a067eeabdc0dac624af7f3a360b98fdcc4ffcb618442d47f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/versioned-story-save-migration.json",
      "before": null,
      "after": "f8bec83471720e6f682e5788407863935adfa9d4aced41eed76cdd2158d04886"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/vertebral-column-mechanics.json",
      "before": null,
      "after": "8f1403cfcdf37e759880aefa3d19aba1e1b4bd8fe04ceff794c1c883d0647bff"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/vessel-radius-resistance.json",
      "before": null,
      "after": "d483aff0c39e97db3337d5aae03cf00a46b475c2c21f7b7063f92b8986af9920"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/voxel-packing-tray.json",
      "before": null,
      "after": "eade0033683c7b95f940bea08984cfffea7c7ad712c7cc9f69b4fcd02ea1ac52"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/wait-for-deadlock-cycle.json",
      "before": null,
      "after": "650e06a956ad396d3d73b1f98661d12bc91f1e534efe6517241821e7e4d4beac"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/warehouse-pick-tour.json",
      "before": null,
      "after": "61dae93c6ff0eb2aa614a7c32fdeac9e2bc8bc460667909a31b6cadbade81903"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/water-hydrogen-bond-network.json",
      "before": null,
      "after": "4d008a6409ca83843aa73845ba0e3a8f09af764e4e07626f1be3963ad95b9d7b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/watershed-flow-accumulation.json",
      "before": null,
      "after": "e3139a1d2c123e633d4d206b8b46511d1731ad2f7b2ff240999fcd79d7513ea3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/winged-flight-cycle.json",
      "before": null,
      "after": "2b5a8fb760dab7cee0ab602b64ad901e17ab3dc8d9bc00dbf18e65a40fcf063b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/xr-ar-museum-placement-uncertainty.json",
      "before": null,
      "after": "ee004bddbf7fe896d0f7ee4d3128e3304b3a706ca66442e31f09b6b3c189eb66"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/xr-museum-world-scale-teleport.json",
      "before": null,
      "after": "d7490e73b9f908093ef8017fdd307f4269f062d73c0ebcf161a628dff7931649"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/recipes/xr-two-hand-product-manipulation.json",
      "before": null,
      "after": "bb379340562cd22b61ff4614d040b9422391f5d4f6f6cfdc4eee61eb3639e73c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/sources.json",
      "before": null,
      "after": "89ba3d5ae2ac7ead787468efa2dcdf9ec53c897c586325da4f6268d7e64077a9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/angular.csv",
      "before": null,
      "after": "dd7cc2a2b34cd8f0508bd05b067545e7a44f7724440c432d491d92a61a8fb6c1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/astro.csv",
      "before": null,
      "after": "ad18dae3ab6d148d37d144592df80dc1825b6c9e86d9d2d68fdda77434206a37"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/flutter.csv",
      "before": null,
      "after": "fe36d404c799781e8ba6e9a8179b45799ed5126a545528550cd2eb0f2346e8c5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/html-tailwind.csv",
      "before": null,
      "after": "7aef38e75c53559470afcfa91580a9917ca8b7dbf8b92110389e23e93703ac52"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/jetpack-compose.csv",
      "before": null,
      "after": "6c8fd4b0391c342c12b0af15610cd5becbeccaef0bbe8dcfc01d928c3195d93e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/laravel.csv",
      "before": null,
      "after": "50e11e60a64b30f329af25ae71f4b8bbdb43bafc1865451b74f9f540a88964d5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/nextjs.csv",
      "before": null,
      "after": "e828ccc04843742f52f545a068e8a9ab0d2b97c0e771f7e93bf0cef74da05554"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/nuxt-ui.csv",
      "before": null,
      "after": "05d6e74501b2b6a636faed32450622759f49a5bcafad971f5f4e7eba0eb7be71"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/nuxtjs.csv",
      "before": null,
      "after": "f7a3f2d9542856d00199f85c6c023b7c284cc698e2e6e12d61afce2edacb24d6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/react-native.csv",
      "before": null,
      "after": "a08ca77fcf6b6d9531982dce465366296013bfcf12d2938ac72ad57cf0c4f085"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/react.csv",
      "before": null,
      "after": "e5624ab41d33427d88e41d07581ce4eca59b37b36ab72a6ad43a9c8e2d0a1c72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/shadcn.csv",
      "before": null,
      "after": "395c2e415ef6f48a474acccdc8eb2c7258a6ed751a5037ba171a2d8823e02ded"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/svelte.csv",
      "before": null,
      "after": "71af52d64f266c88070b91dbbaa900c2f8074b6baae9f35eaea6ba9cec6fd803"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/swiftui.csv",
      "before": null,
      "after": "c9c2d2510f8e66281a2514e8dd0125a6b653b9ef53a71281b5e7dfe003d5b569"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/threejs.csv",
      "before": null,
      "after": "f1c05f8f269fc4784170c837f4ff43b50042f00bbd6ba7dbef2896081a052544"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/stacks/vue.csv",
      "before": null,
      "after": "c2724915d3c11cd67263f25896cff721f787a0fdd8326002d31e9f5806dfd8f8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/type.json",
      "before": null,
      "after": "144be2adc366028ec2d380782e9150436f6bf5f1e4177159674c84435250d830"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/typography.csv",
      "before": null,
      "after": "dbea262a54e3bfa2e6c3b15989a365d5ef4c43349316aff46635e82ca825adce"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/ui-reasoning.csv",
      "before": null,
      "after": "82a4c7abe3c68d60f899d6283dc5f98b073b061339297dab9882435db62cde45"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/data/ux-guidelines.csv",
      "before": null,
      "after": "1870ee048f2a2bdd60709f8f7adf7f3b6dcad560bc005c8b2915a8ac8639820d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/migration-manifest.json",
      "before": null,
      "after": "a06e391268dd0e86825fc8cae03af218315b2d9f65bca59d09d78bacb003bda2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/_index.md",
      "before": null,
      "after": "37dd9829b02274b43b1b3fe429e9856804eb42f24d4091f687012ee506f287fa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/craft-floor.md",
      "before": null,
      "after": "3bebcdb2581f51d6c714103e485403f61ee2538e9d434e20a467dd37628e95de"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-anatomy.md",
      "before": null,
      "after": "b59a2d3b9408c8d06fcb67887589739c70d4864e74f8cf835568292c1d052221"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-comp.md",
      "before": null,
      "after": "a69061210b3f2af99a020e2b7c317b555c7194b33a459ab6e7e1f17e34058148"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-component-patterns.md",
      "before": null,
      "after": "3873215102d01503b3fa9703ee8d1a474c1df6ddd8fdf7a44a3821b3a9ae7893"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-craft.md",
      "before": null,
      "after": "8ec331ae8f58777daa2331f6ae504a51d63ec8f901dca4c3d5135b0dfe67f269"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-data-viz.md",
      "before": null,
      "after": "7e64f711d677baa10696e8053b7a87b0ec65f9cb6ebf5816c7dd22ec36bce6a6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-design-md.md",
      "before": null,
      "after": "345b3ec5760efef4d1c697c3c081a4d511cd638c38a0591515de3b2cdfbc4485"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-export-formats.md",
      "before": null,
      "after": "1ecbd05b15b29eac17ad64a6634a35d340bc075cbaabf536993368078366e2d4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-flow.md",
      "before": null,
      "after": "e6d6a7bd80da8f72aca88c07840ca33744606da473a8b7967b8f00a198cde3bb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-interaction-and-states.md",
      "before": null,
      "after": "f551f3b806cecc666fd2aecaad23c0350b97a1c92701aa78019d8fcae36d9744"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-macrostructures.md",
      "before": null,
      "after": "82591f468321db38005e267f26ea94792b5bf139411525e7916650d0eed837f8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-responsive.md",
      "before": null,
      "after": "6d027cc7f840f7590d12d98d264c2b55d9d4ae89b22bba5d80c349eec4e99092"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/hallmark-texture.md",
      "before": null,
      "after": "9df4885318387a9b6c7021fdc7a22f5343ba36b70b5f9cac5c8bc9bfcc472e1e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/harden-and-edge-cases.md",
      "before": null,
      "after": "ae1f2d65b31e20d6983b8475bced25ddd75c4921ffc7e4a8275336d91dcef15f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-adapt-responsive.md",
      "before": null,
      "after": "66cdab1bb2b3aa02339c1aa9f24e43afedfc47ecf4f0dc9c3e0f3bf1654c6c47"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-adapt.native.md",
      "before": null,
      "after": "41730d764e469378bd23bb1be211baff760ff5472a8813a0ab1118d9753e8208"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-android.md",
      "before": null,
      "after": "cfdca24ff327910f7be1da78dfe2a20a6723d06f29961592a38c3111798b2558"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-audit.native.md",
      "before": null,
      "after": "241f713592b71d807fdcfdc490d5d8ed4915aa7927ab313479ab7749ce6f58d5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-component-review.md",
      "before": null,
      "after": "aed8bd87c5147c24308883d1132ea1f581a77ede299ee4edc2ca067908c633fc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-craft-floor.md",
      "before": null,
      "after": "ed1a049eef3709df148573d08bbdab87e222211a82fe46ec5d113fe37f3b9672"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-extract-tokens.md",
      "before": null,
      "after": "f9120eb9e0203dafe91b1bfed86b88350c84ecdbf7205e3b3294be758546ed4b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-harden.md",
      "before": null,
      "after": "5e18f5afeeedeffe20f446ae11b36d856262c8ebf1f3703ea0b5213a09098e5e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-ios.md",
      "before": null,
      "after": "2ba9d1a3aa51e16ef184a40e5646e5f2a5d150797feefe95ec7f639f77588d0f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-layout.md",
      "before": null,
      "after": "0de59580a9462c5962e3a216040343e01a79beb0f87146ba7d45a4c2af4b2e8a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-live-setup.md",
      "before": null,
      "after": "3d201cc543f6a50813cc2f5805f35fdaa1abeb42c71413753973247fc8a33e87"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-live.md",
      "before": null,
      "after": "e97f1ea774521197964f15b94458fb2e82460d725204a98f1c3bb150b67c0425"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-onboard-empty-states.md",
      "before": null,
      "after": "ea1ec389a230c6723662bf3ee6fb5c325d579c265a33a12e95b2b83599202686"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-optimize-perf.md",
      "before": null,
      "after": "93c50c313176e9e83b0a30f54cfdd1b82137160e6815d510fb71bd4db964add3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-region-map.md",
      "before": null,
      "after": "f5eb1ce10a2c4869d7c2f1b9f723193f13b566bba81ca82d8ad8a6850f05bfa1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/impeccable-visualize.md",
      "before": null,
      "after": "a932125a7af2a26167fb8beca7fb3568eb480dc5f5221e78c78eff3b77106d4e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/layout-sections-and-cards.md",
      "before": null,
      "after": "0def43612a5de8196396b63a4a64d397f2c0708b11b351d1283f038073a5aebd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/01-bento-grid.md",
      "before": null,
      "after": "8649ea6eb58503ad2ba98a07ac4e25e675d7352e1f4754c5935442b5bf79a254"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/02-long-document.md",
      "before": null,
      "after": "85c1fb23a1079eeb855829edcfc954a368a4d4e3018d6ef6985aa676aac54b9d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/03-marquee-hero.md",
      "before": null,
      "after": "6b928c47df557b2042e4eab3ae406feaadc79ecf464112d0482a14a79c7a5f15"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/04-stat-led.md",
      "before": null,
      "after": "6d8409f6ac4c2cbf8eef68fe9c0989d636d66f77909c706da514add4881a6f11"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/05-workbench.md",
      "before": null,
      "after": "8c35107a3111f4c69ba884ce0e74bfef6495bf4fbad5de329a4c1b877b3e035f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/06-conversational-faq.md",
      "before": null,
      "after": "4697515ffd06d8d0487bc3aa611e86652c19db0e416b037594db66dd68c23c37"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/07-manifesto.md",
      "before": null,
      "after": "02f12505cf9d3da30935a9573ce94e161f4d10094fa516029e475f5426ab646a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/08-photographic.md",
      "before": null,
      "after": "8b7294c96ed6cbc12db3cdcc062ebc44a85a703bfe023ce4abed0cfa1f600628"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/09-quote-led.md",
      "before": null,
      "after": "e09bcb97805d7b19614cd15e0ac1b0601bd1f952829467013b727fcaed1b4ce0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/10-specimen.md",
      "before": null,
      "after": "1433fb31e14c3f9417a6f8e0db61313740d18a72995c4835b94c41d11dfea32c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/11-catalogue.md",
      "before": null,
      "after": "de681cf7d28305d72ded1d212a5c7f226de0e0d3828993ea07aefc100df7a89a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/12-letter.md",
      "before": null,
      "after": "cb60690bb9c664e240b0c2472d434e245fa3c6216297f3c0043fb485277f9ee0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/13-index-first.md",
      "before": null,
      "after": "734c2716d7bd637720fcc3e574f27423473cac7b0539159da3c0e7ab17f54860"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/14-narrative-workflow.md",
      "before": null,
      "after": "b6fedd1ab5ce782366a2701cb7aa71940d0f6086f3033c3312fdbd28cb3bc9a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/15-split-studio.md",
      "before": null,
      "after": "288afc8b20cda4edc446e6a3363dd27e050f89fac98f1f022c1e7ac654c5c4c3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/16-feature-stack.md",
      "before": null,
      "after": "306a99483bcfd842ab685292409cfce17743f0d71ea2f4e3633c07e845bfad7a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/17-type-specimen.md",
      "before": null,
      "after": "e0604df9f77f3c22335eb09c22006d0f68ac56be9528b3e9bcb579e24ac1c055"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/18-portfolio-grid.md",
      "before": null,
      "after": "ac175278f640ddfa691807fe76274a55b8776c69784f5250191c0204eb188e03"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/19-map-diagram.md",
      "before": null,
      "after": "911f1f3469ea64dcd0f83d40707a2498ad8876316bfbd3c517d5e376a444a274"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/20-ecosystem-index.md",
      "before": null,
      "after": "b40f8db49d585bbb5188df424a102c7518ee18acee5ae982b37df093ce9b5efa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/macrostructures/21-component-playground.md",
      "before": null,
      "after": "9aaa539ab2a261702efa0393bf64062084a3c461a7819f92da8011f0c1b9a69b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/prototypes-slides-and-tweaks.md",
      "before": null,
      "after": "afc69a9b9ecac67c1696303c9963eb88ae5eb2de519d57383511cf47ff90bf59"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-backgrounds.md",
      "before": null,
      "after": "14e04f4c06be58f286be2942ee4a935a5185c08a6bb1b985a116027ebb0f3ab2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-cards-and-ui-fragments.md",
      "before": null,
      "after": "c97261f594ffe61aae941969c92daf1848d01abfbc0e7a6efb0fab90fdb2da08"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-diagrams.md",
      "before": null,
      "after": "41f0e96f5c090d0d12a353b1b31e61214d17784cc79d3e78671c85e360b1c3be"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-layout-v4.md",
      "before": null,
      "after": "da5ec7d0c1297e289d24def120e9e7f6df2d7a1ad178f879a94ede079afcab70"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-sections-library.md",
      "before": null,
      "after": "34b64caf50642655247d199c68e3545152a49d464868abe70ad77f3d6b2d049e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-sections-plan.md",
      "before": null,
      "after": "d9a04cb6c3955a397e272ee6129cb0a3046385592f51a4c79fdea9d6220b151e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/taste-system-tokens.md",
      "before": null,
      "after": "d95660c4a19df7c283ded6aa841518a4c1905ee8a1aef2f2b5285a30541fc9a7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/craft/wde-advanced-patterns-tweaks-slides.md",
      "before": null,
      "after": "017a9969c717d38119419a20e0db00963b513b7b22836155da7e18076a0f0b38"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/_index.md",
      "before": null,
      "after": "4a96c7cdb3672d8277458db35652d9c3be490dc1ff230208286a3557d7ebb296"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/copywriting-and-voice.md",
      "before": null,
      "after": "ad6a859cb09edb089e83d8e08ab22ae6f4894cebb7137667656ee91e31e516d1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/ecc-direction-and-states.md",
      "before": null,
      "after": "fb2150937dd0d2fbd60ab179e43f896cab47750a5e3c7605edc597015fe1a2e1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/genres/atmospheric.md",
      "before": null,
      "after": "09111da65a4727926ef1e7ad5f8157357289d6bfa955b0caa7c76b959272b819"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/genres/editorial.md",
      "before": null,
      "after": "083000f92dd0c484f243da2bc6b272420890effdec1ce30b94c913f4f04f5e41"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/genres/modern-minimal.md",
      "before": null,
      "after": "a2889bcbf0b3dfe84d1ca67fbe963debd6ab7460a815e50484611d225ba491d4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/genres/playful.md",
      "before": null,
      "after": "49dad99b95e3817f1dc7ba9c2686a4f838835b9305289696ad4f309c00802cc8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/hallmark-brand-truth.md",
      "before": null,
      "after": "d173f49df85463d2ff0da3367274f530f6e677dbe3d058dc50b66dffc1e560bf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/hallmark-dark-mode.md",
      "before": null,
      "after": "837c47557767e0ab77faec9bb1ff1a675ae0830c53596f949fa2d0c4947acb18"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/hallmark-direction.md",
      "before": null,
      "after": "fb1b74b664386947f38b11c40048945447987dc2630d9181981225fd9410cf95"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/hallmark-fonts.md",
      "before": null,
      "after": "37f41c4b9213ed1eda7dc5733bf9617f8f1299a6e020416d8dd13ff48396dd75"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-clarify-copy.md",
      "before": null,
      "after": "c2e87a9ed754a15e61d26613109a75517510a2dec37114f92ea48fe6d9eea1db"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-colorize.md",
      "before": null,
      "after": "227bdacd982b3c40982cddad5f32f6f31997febaa377527eb56f296ad8cc615e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-mode-operate.md",
      "before": null,
      "after": "d2678e124366b097a3c6763ff060ba285292d2218cae3d4a983ae6bf4800db3f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-mode-persuade.md",
      "before": null,
      "after": "12d9ac9ce82356a0882f990ebd4e6fe134abfb8471c752cbe0af4c5098831670"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-mode-read.md",
      "before": null,
      "after": "5701f5d64e6420fe08ce375c16859f931c9e725b4ffb93eadc4919701a88f45a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-new-work.md",
      "before": null,
      "after": "ad0c160105a02f480e93e2efd25189702971d1939e058396fb9b3d64269842fc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-operate-depth.md",
      "before": null,
      "after": "a9afec8b6e67f2393528ec53ac8cd7a7c966c43722e1acfb31ab112be2679feb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-shape-discovery.md",
      "before": null,
      "after": "ba18fe688867211516ff5f2c711a0e9213bccbb82fe8d3b3c86c580b9ba0672d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/impeccable-typeset.md",
      "before": null,
      "after": "55668a6118304c9f4122433208bcdc1dc58242cf253cb387fcb3c7d986bb918f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/palettes-and-typography.md",
      "before": null,
      "after": "e570762700f7b40066a287c0864f34cf6d1f2f448ab0fd8879f38f191dde7b21"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/surface-modes.md",
      "before": null,
      "after": "6eddfefcd735bf452e5a7eccaf7367457374a07bb957ce3ea635ea2cbee61c0c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/taste-copy-moves.md",
      "before": null,
      "after": "23b22db59353da4623dcac1e04cddc56e433316655d3b340543d1db11660e970"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/taste-copy-registers.md",
      "before": null,
      "after": "3880ea3a79013d6ceac8280cece9d8bf0b1cfd958cbe12f9ce5614e25a983a57"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/taste-copy-rules.md",
      "before": null,
      "after": "1a1eca8f86478f513ddc2469732d450069519e6331e383f46249c5920c887b75"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/taste-copy-tells.md",
      "before": null,
      "after": "f0b2501708483277db11a4f58943c8939a3153e465fa5e14f687630c62584c3b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/taste-copy-voice.md",
      "before": null,
      "after": "e5096c3c8a6143965122ee3531c937228d8e6ba372ed954aae6a26539c4c6ec0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/direction/world-derivation-and-shape.md",
      "before": null,
      "after": "6149ce9da7ea4fb7d123917c981280c096ecad7dc1ab9229543b58d507c5d17e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/_index.md",
      "before": null,
      "after": "3ee66d211d5e4f54561e560fb4f392556ccca342dd9f70676336440012f7bf64"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/gpt-image-2-templates.md",
      "before": null,
      "after": "7da072595183dfaade863ee40458a59f6d5e72046905c0493cb82cdd8c24c0e3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/hallmark-imagery-rules.md",
      "before": null,
      "after": "31b01690ba72181af466a10ee221b9e6b41cf0daed0b8c74b0c76f68aa2b3dc5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/imagegen-api-reference.md",
      "before": null,
      "after": "c8a1775276dbefadbdf5435ff43a63de6ddb604290f714058162ad427b17dc5b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/imagegen-prompting-and-photos.md",
      "before": null,
      "after": "c605ec4adaa132b16030ffdccf5e061a91e404592b74bbe9ec0025aedf0552d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/imagegen-prompting-best-practices.md",
      "before": null,
      "after": "90313fa8495509145a97ad9692f0b2f80b6b2c1c967401122b1c935e0ced7c1f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/imagegen-sample-prompts.md",
      "before": null,
      "after": "7d9910e1accc42d174f0711cea0840dfdd9a80fbf41d0817a7e971ca1f999322"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/taste-icons-system.md",
      "before": null,
      "after": "1c335c0bb6637b6a3f694614df472afc777b172778fbc0a140c529298078e629"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/imagery/taste-licensed-photos.md",
      "before": null,
      "after": "82564149b847a28ebe75cf2c8a2b6dd489487a195fb65d8949e65540b5724252"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/_index.md",
      "before": null,
      "after": "f1012f1b4ac82c79de5d18f3113dce167a08514d1e1e0540800606960343e057"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/decision-framework-and-springs.md",
      "before": null,
      "after": "022c82faa769d4272f81824754c786c1b28617f64c03f0285a9d475902148d47"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/gestures-svg-and-performance.md",
      "before": null,
      "after": "1b4fad74fd588cbbbcfd227661358efe2c9cd98f19e0b99ea3c1209d34a55532"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/hallmark-microinteractions.md",
      "before": null,
      "after": "d77c962d24de135d9634c2cb55b85d15fbbceefee796bf585dc84b5b8a7d3bbf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/hallmark-scroll-choreography.md",
      "before": null,
      "after": "acfe84b87cb7ea954d63083b44f4f61a93dd9a9b156c56f375c82dff355e3a2b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/impeccable-animate.md",
      "before": null,
      "after": "a74a13471ef2a00837f581ee0d26ea47bd7606f53a1df8e1f582f500fc2b54eb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/impeccable-delight.md",
      "before": null,
      "after": "4ffdab89192f90369b9b0fd109c4cfc2733f12b741847225d44142e898b5f807"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/scroll-and-clip-path.md",
      "before": null,
      "after": "1b207c08ed8aaffd9ba478b6788b8b3181085cb96180f3cc306cd641899f74c3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/taste-moments.md",
      "before": null,
      "after": "c08a9285289fd724b9db0df230da1e48bbf8e48771bdb57b391469bfa437ceb9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/taste-motion-layer.md",
      "before": null,
      "after": "4264afd03eedab84b1a765f22edf0bf881ded49603a0592e8c733527425bfa75"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/transition-recipes.md",
      "before": null,
      "after": "b56316e73430458ba2eb60780427fdd47afc93cb5877ba2b01ab0e8dfd535364"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-choreography.md",
      "before": null,
      "after": "8ee29fd4ed9671006e6d2fe8f3b09a51624bb9293a51a533e57793ffc7e884a7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-clip-path-techniques.md",
      "before": null,
      "after": "9b8a419f6d0fad3b5fd4842a3d81cf0f4634aef0937a4fa84b0b9b261fbf35c8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-code-output.md",
      "before": null,
      "after": "dd20c2b87340d0901fbe24001b8e6b0747f9dfe8bbedd96168f3cd6d5b47a8a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-component-patterns.md",
      "before": null,
      "after": "72b97ec11c3182a84a65885b4f57888f1f581e6d4f0e1dbf94f6b8d2804c173a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-contextual-animations.md",
      "before": null,
      "after": "792f6613fe0f3765abcaf68633b756f25af0166bf1a377205518e40c7e848599"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-curve-fitting.md",
      "before": null,
      "after": "3e32a1f384972719745ef52c2c0e6cba315610e3dd225a78803f084d8de26571"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-debugging-symptoms.md",
      "before": null,
      "after": "18f06f858afc53157dfe4f4b49f5fec66da22cfaa1905aba099d062cfe23a545"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-decision-framework.md",
      "before": null,
      "after": "a67706b73a74ef26b5e48013d83ec1ed5494d387d1732cb8ff81dc5534d5ec93"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-gesture-drag.md",
      "before": null,
      "after": "5361ec8531cc1a6cb7e49e0733590ac2cf0d67def65ac35384996acac93cbd87"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-interface-sfx.md",
      "before": null,
      "after": "76e245a11e603e858049ab4fd149b9d2847b29dd3fa170a12130a0490a08dcf3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-measurement-guide.md",
      "before": null,
      "after": "ac7a33279c266fbdad040cf4e7740e725c7f9c85ee1fbd8b397658709f29ea5b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-performance-deep-dive.md",
      "before": null,
      "after": "667f3e69e61489c5b63063746a66cd2fd8161026e4117cd0754e3f57a8fa8a67"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-scroll-animations.md",
      "before": null,
      "after": "ebdd92217654d3b386e5e097251db9178e6e70092bc2b80e4ff2b04488a1920b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-spring-animations.md",
      "before": null,
      "after": "db08f34d723055be0cbc6bbf2d47a254b22d63db7227bc703118f7b759f15c9b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-svg-animation.md",
      "before": null,
      "after": "48c97a599970d4c51f50ac98b766a53a141fcc7d3e6f75c33997360cfc93bb15"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-transition-recipes.md",
      "before": null,
      "after": "b5211d830b9c715aed965d185370a5719f17d6ddce530aed6369a67356a64224"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/uianim-vocabulary.md",
      "before": null,
      "after": "3b1331ad9186965b5470acc3233fe639b9210369b36832e37b6182fa8df58a8d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/view-transitions.md",
      "before": null,
      "after": "f105937929aa233bb54f8566166fe5323e56f7dab6ddbe1d9a0b3a6d5c177bf5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/vt-css-recipes.md",
      "before": null,
      "after": "4d5c8b52174a9926a9789d0c353f46fc58b49fbcd6c6a84d946364a70a4fe5a3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/vt-implementation.md",
      "before": null,
      "after": "e5397922bf32eca44c16b363a621fcb0f5ba8d6b6a2a898a6f5dba1a1b120142"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/vt-nextjs.md",
      "before": null,
      "after": "b45a4450a0ed568e9cb384b243f24e4c29100a9b65e6ddc79cfbd4e225393ce8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/vt-patterns.md",
      "before": null,
      "after": "d14e302f509aa05a9c0118a81cadc1a876472dc0f1041576f405e24142121cf0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/vt-react-view-transitions.md",
      "before": null,
      "after": "11bb6a8edd88ed94375328114e3c339533061007ac726bba949b513552d11ec5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/motion/vt-troubleshooting.md",
      "before": null,
      "after": "45640d2f649edd73d81304b4eebf6dbb4612ed32c67f74fa6002bb3554847a0b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/_index.md",
      "before": null,
      "after": "e0943d609e71b46fd260f6391e4a5b2219417ccdb2d3a77c6432c8c58da5a65a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/animation-review-standards.md",
      "before": null,
      "after": "6191b2138d03e9251bd60547372e5ceaa2fc2a97f80db455d41e2881c8d702df"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/audit-and-critique.md",
      "before": null,
      "after": "12dfa28f2c3adfca4c029fc02b14f63160bb63e6726e43df7c28c3a8c9cecb95"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/hallmark-gates.md",
      "before": null,
      "after": "97e8857e24553e428c2744adad94eb202d885e113304794ed310a41028a6357e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/hallmark-redesign-kept.md",
      "before": null,
      "after": "801e1a9c88caa6f92164770a25cde620578609ab9707e80d399d1a91de69cbee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/hallmark-review-finish.md",
      "before": null,
      "after": "fe9231a918fbffc8a89b84dabd8ff89b699c6cbd965524706412d214cc245100"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/hallmark-review-hero.md",
      "before": null,
      "after": "f79a9a069738c79536d5814f9a5594a55bcc84390084c171782cc42b9aa4a1f9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-asset-producer.md",
      "before": null,
      "after": "e5f268a7f777bd376cb4b8cf69b9e9328b80a6548d96226de3fe39662963bcaa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-audit.md",
      "before": null,
      "after": "0a83a22d247df5b3300f1192c90e3bdb6e1c2f75eea41acc307200cbed96bf49"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-bolder.md",
      "before": null,
      "after": "e685779399ca342785ed1dc833fe9a6ed819c8eafea579a4bf056e83231b1a57"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-critique.md",
      "before": null,
      "after": "0627934c0aaa70fd0aa6e9ec287998d0bcd593176373647dfdeca0e5549ad908"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-distill.md",
      "before": null,
      "after": "f20609a1f235a29f65040b44a21a5d792cd8df713a7df6ea468a1be617bdd896"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-document-design-md.md",
      "before": null,
      "after": "ba80b8564d4069d344537d8ec766451fcf2ad16349ce0e23174df10f3a36234c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-documenter.md",
      "before": null,
      "after": "c99147b4f1578e2393ad6a7d62fe87e198e7470f60be122d287924bc0cc1fc9d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-finish-reviewer.md",
      "before": null,
      "after": "b9dbc2df0ed2f05eba3c821fd3c0a78cc1a8785a16fda993b64203e8b2307efe"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-manual-edit-applier.md",
      "before": null,
      "after": "bba67044fa4c7c36e5da096135284bad0c922f87bdbfcbfcd5edbafd7c58ad60"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-polish.md",
      "before": null,
      "after": "20efc88835380078abbc3b5bf10e2a1f9a4ba49fd928a282b9f9caaf956785a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/impeccable-quieter.md",
      "before": null,
      "after": "5b55fe1c8c005161db88a310ef4b95630e90e5c8f4815945578d53b8390d6be2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/polish-and-refinement.md",
      "before": null,
      "after": "250c47f97606fc142d97d8619d9cd0b0c29f2b076a1d3b2f011d96764905d20f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/review/uianim-review-format.md",
      "before": null,
      "after": "3e4216f8b367b35ba828a1d3b3983ced388ba3b1644b30b6a132da79a6f9f209"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-blender-threejs-handoff.md",
      "before": null,
      "after": "19e59a2186194da69021ac7175ea424baf071fa7732f54666e7281d0f984db00"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-catalog-index.md",
      "before": null,
      "after": "ed3ed20602564c18c466750833b67185991300cf869ed6e4894a1dc545de4e1c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-design-synthesis.md",
      "before": null,
      "after": "c0017ffbf0f5a092b54177f9027af5dd5d66a39bf4a4dd0d24d5a17c3b44ea38"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-lighting-direction-and-scale.md",
      "before": null,
      "after": "40c3e1322bd43c6db34f5f48c0b73dd48d92cec2157bc1b32b4f5c9a14296fcb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-motion-and-state.md",
      "before": null,
      "after": "f2a824166fc0411da741e6badb3095788d78519652eed439c3499c4ce3e027cf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-object-craft.md",
      "before": null,
      "after": "df0cb3031ba6c07afb8cc688a27b0dea5afa7c3d3bf1882fcc902c8d46b927fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-object-reasoning.md",
      "before": null,
      "after": "44450cd435a2c09e762cc0d48346753ff887517c00de90cd68809b4a14e460d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-physical-interaction.md",
      "before": null,
      "after": "2906d3fd7536dfa1d2f7113df5d3019fb8dd5f4b08d2da9419efdb213d431ee8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-pro-max-overview.md",
      "before": null,
      "after": "877a69ec6c79cda336d1a063bb871611ed00409717db111ddef29cad23ac556b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-reasoning-and-checks.md",
      "before": null,
      "after": "e9e005a98f12615f460870e00f3806990a1f33ef40d3bf71c201f13733a1d81e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-research-and-truth.md",
      "before": null,
      "after": "4b6800911e3e528768d022ef62f11ebc1f400e4eb799fcf5bc4c66859c3261c1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/3dviz-subject-clarity-and-motion.md",
      "before": null,
      "after": "9577f896cab348042cda8343a36ccc655a5ab9f363bebd4c60d4bdb6b9bc804d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/_index.md",
      "before": null,
      "after": "4c46644138121254ef19210671f84c9af08a77b70820242bb03d4454d305fb0a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-ambient-backgrounds.md",
      "before": null,
      "after": "466957509dadd2a385eab6a77a531c34320c97f4a1032262e11adadd264459bb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-assets.md",
      "before": null,
      "after": "0da38a501cafc60257e3c2a55f778401e24e72ae730c69635178222632384a69"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-build.md",
      "before": null,
      "after": "4d8a8a9c723d26985f5c441f6cfeea2ec1bee27f1f01ae0ee10002f42d62fbc6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-direct.md",
      "before": null,
      "after": "8fcbadce662ac340b1706bd75bde439046074a7774b403ef9efb9ad7055c0960"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-motion.md",
      "before": null,
      "after": "386bbe8c8bebc7f2db46fc342a855c657014025c4f803c61901796543ababf8b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-recon.md",
      "before": null,
      "after": "9a5824718f4223fe135361d523abcd8def7f1bb6a15ae54219bf3378b7eb78b1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-scroll-cinema.md",
      "before": null,
      "after": "bbed7e25bca61013857c0e0e6130fc3a66d13aa109941797c26b58dbb3cafd6c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-scroll-flight.md",
      "before": null,
      "after": "e8c45339e89db9072cbef2522d1d7d8857bf43b6efc69017931fa82cd5fea82b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-system.md",
      "before": null,
      "after": "0308d03b7003b414a9a5db4821b0579eecf4729981eef0c17f0f8f15f0a375bf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-taste.md",
      "before": null,
      "after": "e596b2279717116ec5125c2bc24c173b52075323de9b529a055837d07c310c56"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/auteur-verify.md",
      "before": null,
      "after": "df46bdcdf86c470b17b5dc39557613428059427294e5ee73a884421e3bf149ea"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/abstract-systems-data.md",
      "before": null,
      "after": "7828c768ce206a664e3e9e624e8d9a124aaa3553c6c83f9fc93fb35a0cd8fd52"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/algorithms-data-structures.md",
      "before": null,
      "after": "751d3fa89dda618e36435079712b692a929f76296b3017875a1c1c2eb0d92f43"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/anatomy-structures.md",
      "before": null,
      "after": "0ec2189a0193c8cc4331a03caf06df3b54b0bb7d226d902bf9f36c2e257b1f5d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/architecture-interiors.md",
      "before": null,
      "after": "a504a614418718545fdb833c76142b362ca6f83c402ff37a85d0b809d9b6d810"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/astronomy-space.md",
      "before": null,
      "after": "54ee4e53ffe46f85890797d1ff3c44bf8aca2b71f8f6c7c4628e61d26d635612"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/calculus-fields.md",
      "before": null,
      "after": "46145755ec1fe88866aa4b6d6af98f487c638b6b19963efeb592b2a1ef793fb4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/characters-motion-art.md",
      "before": null,
      "after": "045610fa49d58b5ffff9dbc062ef8d4d6d6a03f2aced60983025efa8f8a2400a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/earth-environment.md",
      "before": null,
      "after": "baa6626a4c064170a643ef3d4f158f587447156bbc9c704e785b6641ee0a4f6f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/environments-dioramas.md",
      "before": null,
      "after": "75b9ccdbccb1d63c2a7d58db5b4a0cc545a454aecb0ff00d5ac64d5f2101da75"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/linear-algebra.md",
      "before": null,
      "after": "156f02c6da477bc1615025b0a64eb0361ea036cdaaae13f4d6d8fee51cdd7296"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/logic-circuits.md",
      "before": null,
      "after": "d4ac26e3e5fe0ab3574c63b95ffc4e4ccb6aaa2a538aeb0b8b952687d912acf2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/molecules-materials.md",
      "before": null,
      "after": "922e16f7858886908d05be6fa0413f47924bf912ab8581778c8bf1f6868d4510"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/operations-logistics.md",
      "before": null,
      "after": "a40c14157dd8234d82c7b32f4c4eeccc55a56223e10ce1a077b5bc13a4afb426"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/physiology-biomechanics.md",
      "before": null,
      "after": "213bf7fd9021866a85f5713e69243fe9339dbcff4c4f29e03e606e1880fce74c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/probability-statistics.md",
      "before": null,
      "after": "ee6856501f0f7887be63952fc3d242359310fe430f26ec90fba38efc9bf2fb59"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/products-assemblies.md",
      "before": null,
      "after": "7fc4467227b08d5d5fe7371b088e5f7a6fc9a211414e85a92124a1ca32e81c45"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/rigid-mechanics.md",
      "before": null,
      "after": "e1de4602f3301e2afd4d3fa5aad4608789a29f43363537a2b03bbea621684c98"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/robotics-control.md",
      "before": null,
      "after": "e7ac3fc73282f343cce4d20bff661c935cbc1926ce0a4a41e2a60732c6da495c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/soft-fluid-thermal.md",
      "before": null,
      "after": "edf78d0c1e10d9bebc95a3dbcd684941e1b08d29f2255b6b04c6267c166add95"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/solid-geometry.md",
      "before": null,
      "after": "49500c348f06b6ad98940b0048301aba76183610625c059e7da4a8a5af9e70b3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/spatial-puzzles.md",
      "before": null,
      "after": "f504515efaabd00ed6b425c0d3d4a0940a1b6f4dfbf5a685ca4f6222433c2c60"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/topology-symmetry.md",
      "before": null,
      "after": "b2609419aaaa8bf81d8b4973f58d6be4b97255023f65ec7478cc070b21aeb646"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/twisty-puzzles.md",
      "before": null,
      "after": "1c1732bdaabbb850f189807388a17308ecae0a7182a20d0087bc8d048b2281f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-directions/waves-optics-fields.md",
      "before": null,
      "after": "ab7d79f6d3ddec8cd0cc6ba91166f0be37be32093908174ea7b73356cba488d9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/blueprint.md",
      "before": null,
      "after": "842ae6ee0ea91dd227399e8eff6c27b11940d96f131f37d5983ff5c145e5d5dd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/composition-profile.md",
      "before": null,
      "after": "dfd7ddf5b0a85f246e5ffc3b00f17b9e1d46c6bf302bb92fd726400f1cbbdfa9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/domain-validation.md",
      "before": null,
      "after": "944f5fb5012297e82ecf749986883000dcdebbb54a6d5c6d299aa87a9f4e78f5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/geometry-profile.md",
      "before": null,
      "after": "586f1da3b151340ab8a83e8d753a1aabf2485ec18085f8b554a80da565148227"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/inspection-pattern.md",
      "before": null,
      "after": "4c29e4c0e46bdec6e020f714020b6e4183820ae74ea59f163927a6a6ef978b7e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/interaction-profile.md",
      "before": null,
      "after": "284c859c30ae0a1f8e2c0c9dab8c9aad6c207063eb2d412b30e197e648e12679"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/lighting-profile.md",
      "before": null,
      "after": "7e7c794a4134c84f5ede247f595ed5a33f07a187484e374f66f89f48bfe9d1fd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/material-profile.md",
      "before": null,
      "after": "a0058fe1ede6dfb0e251d3ea90521c0a31a8a5bc66dadf42d10df7494aa67044"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/motion-profile.md",
      "before": null,
      "after": "9ce40644c21235de899f685a6ea343cb191b3de657087f402bd79dfa8b117bfb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/object-archetype.md",
      "before": null,
      "after": "a533bdb2e185eea98017b0a377b76ffb5166d08d5786e74cc082ed8f17108d72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/output-profile.md",
      "before": null,
      "after": "75e4bef8f1cf58bc13e7b2b410ebaf7385417ae7e429a3a6bbf255820095478f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/physical-behavior.md",
      "before": null,
      "after": "5286b3a025d60609b63d6cd8baf186ebd8a5f050cf8f7956ed84f512c6403a3a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/presentation-profile.md",
      "before": null,
      "after": "54d87bfeb457885c19c7a96c464a6644c867d9528ba75fddef8c6b2246097197"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/reasoning-rule.md",
      "before": null,
      "after": "ad07cca6cb0ba5ed58855d7ddbf06dd37f565d0ec4d39ca9a7175c20c543f796"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/style-profile.md",
      "before": null,
      "after": "acaf2459b841e00457d43bd625f45f59e374419ea19bd404f631a7ca1688b918"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/theme-profile.md",
      "before": null,
      "after": "925d10a6269e3b1b831445c48f469110d25fc067945279ad499e9724e00ea390"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/tool-adapter.md",
      "before": null,
      "after": "efc2519205459e99fa634a2d43e49fcc37f401e6b7014a1b6069e6a3a9998474"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/catalog-knowledge/validation-profile.md",
      "before": null,
      "after": "a9cc646c5e2ca07b7d0ff69d6f793e154da2d92ce53ed4dbd1e5677f18e8d076"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/effects-budget-and-overdrive.md",
      "before": null,
      "after": "2978454cbd7d0d6b809b9032ca27428010ed798c09a83af73f68306d2c943128"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/exploded-views-and-scroll-films.md",
      "before": null,
      "after": "6982a3e8947d6b585c3ea84af796d5b76974fecefb523032be8f82a66ad73a31"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/impeccable-overdrive.md",
      "before": null,
      "after": "6830ca8c7e9dc5c2e2975841a378fc581d5af4a686b9dae487eb11ae10ef782a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-alpha-cutout.md",
      "before": null,
      "after": "e75ae1b5629ddd5f36d85b5d505a464754b958ceebeadd87bd9a70788efd1453"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-cursor-rig.md",
      "before": null,
      "after": "d43dc594f909609bcce7f6e6a07867670fb98fc59dd12855f7bb3fd953020c89"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-exploded-view.md",
      "before": null,
      "after": "963e32d95b02e0067ca12fb1577c3ed654d395777e2527e1db6f28ad9939541c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-frame-capture.md",
      "before": null,
      "after": "ac9d479bd00ca0167c03dbbb98c2d4e6e709be3516cfcf5dc80e95228fa2a4cf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-motion-assets.md",
      "before": null,
      "after": "cc61ad280158642691edf8aaef60b89f377a294fff80c760ca2104c20cc3e6e0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-scroll-film.md",
      "before": null,
      "after": "6764caaf620fe1905d14238e949459eb55ede0b862748cae68878f6f8b76e824"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-site-check.md",
      "before": null,
      "after": "5b2f6703e924b849e180f5344768225fb13bbe82ec8877c220ab48cde53d2f36"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-threejs-scene-refs/geometry.md",
      "before": null,
      "after": "5ce6ab6bc4c5e82dab57dc68244ee0e12c8de4e76dd425ca63d9c86f413224c2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-threejs-scene-refs/lighting.md",
      "before": null,
      "after": "e548ade989c0218cab943ead3e7b68c56c446d426123b4ec45318ed17d2532fb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-threejs-scene-refs/performance.md",
      "before": null,
      "after": "3c26f657f326589bc989eec960773b40e567487e478e2280d776ad5437682194"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-threejs-scene-refs/shaders.md",
      "before": null,
      "after": "53939941a578fb9d3bd759ae0cb3752950186cb4c0e171c80c4f645d0cb64b41"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/open3d-threejs-scene.md",
      "before": null,
      "after": "bdd24320c4b9fd49912caa33d9185dc3dcf648fcbed15fb97233c4119b6a586d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/taste-big-scenes.md",
      "before": null,
      "after": "09420ac9a672bb4d3017b1390873a5a9b289884193a918b07c3836fd7f2e22c3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/taste-effects-creative.md",
      "before": null,
      "after": "aba0b5ed4873c7800aa6c3e4e73a7ee3253baccf91a3c1def32b0e20516f2e5f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/taste-effects-objects-product-render.md",
      "before": null,
      "after": "93bdb39388b8b0d4418ec5928eabf268f858f36799f7fbd86437e0da09e6084e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/taste-effects-usage.md",
      "before": null,
      "after": "78a101313061a3716ee6d14df19980d5cff2f3c71ccb5cd7d9492eb45bccb32d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-animation.md",
      "before": null,
      "after": "787d0b8eb94a5015388143ce3ef1719be7008393f9ba26fd2fd06636bbc1f79e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-asset-pipeline.md",
      "before": null,
      "after": "d46e3388e73b46548d6e232d4c9954559842e50d6eabc4aff2d42244277dc586"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-fundamentals.md",
      "before": null,
      "after": "fc0c67b0fbc65d2869d5a60995ba461ecd780cc1d2fd6334035b4376771b4af9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-geometry.md",
      "before": null,
      "after": "00caff0ab09cc49da26a022bcc86d87b68d876bacf98e6be30a20239df60fb6d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-interaction.md",
      "before": null,
      "after": "896b2fda0752950ea276ddaf9b72cd61a7cdcfb5b7cd9963a8f03d175816b21b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-lighting.md",
      "before": null,
      "after": "7d4e2a9445aeb9dd9378d925fa5e88a96e412130642f19bedb0605e8c169c395"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-loaders.md",
      "before": null,
      "after": "96b73f89b92efb75831217afe218f65f463ec0152149c5881cd06d8eebf752f6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-materials.md",
      "before": null,
      "after": "39177740de93b458a2b24daed7cab57df2dba55f8158b6d1439b7d298753e095"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-performance.md",
      "before": null,
      "after": "3f9cbb2aa4fec03f3bdb57bd59368755cdf86a6d4044063c4994bd1a77b52ad6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-postprocessing.md",
      "before": null,
      "after": "7189d90b0a95611999b20561241c702aa49fc22e5482a8c1e16f57aa41bab863"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-r186-and-r3f.md",
      "before": null,
      "after": "c092611ce0cf9d92102debc2fbd17a5a1c0a1437b2e991fd8933883e8ae673ed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-react-three-fiber.md",
      "before": null,
      "after": "20cda320099448748c3a2d6a0f29c69accc9de66d910168249d8ca11d27233f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-shaders.md",
      "before": null,
      "after": "cebb514afbe4f098cee7f0dcd3c651dab0839c5f194172b093e45c48cc917bd9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/webgl-3d/threejs-textures.md",
      "before": null,
      "after": "d4194aa27a8f6ba44156c7a3cbc6a375f5aaba96d23736216612c21baafccef6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/blender_locate.py",
      "before": null,
      "after": "eb8958bdd783b275e3d73497a68474ad961c27a4a53fe996bf7ed129a9ae7ed0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "0dd3339c3337eee1129cdd24611cab6dcc8a4919cbe8dc06ac351b3275daa41b",
      "after": "fb3c90b015cc9ed3e1626cec2816a73e8f5677782e1ff300f83c677fbb58bda8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture.py",
      "before": null,
      "after": "32e256dedf3b6527beae365fe9ff8ba43b0ca59eb3a3279208275e5e93607f71"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/capture_view_quality.py",
      "before": null,
      "after": "5fe3ca99b1182095a1da1764f2d1af30bdd3bf05df296b31ed2a35a6441c751f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/catalog.py",
      "before": null,
      "after": "5568d3ab986be4ebc51452880dc95aa3bc7cd4c1a884d6940f4c7cc73773e07f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/check-mode.js",
      "before": null,
      "after": "df32c92c33c480d7a629f4a1dfc888b33b25d71cb7532d84eacf2ca8b7bab41f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/copy-lint.mjs",
      "before": null,
      "after": "6a57c566246dddc5942e484d21cf043465800b7759b9b1e470a93d3a913ab9d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/core.py",
      "before": null,
      "after": "592bbad323acd7006ea4076bbbcc0d1d593aeaff9281ccfe4ae8a072a7eb9b00"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/design-context.py",
      "before": null,
      "after": "b452d20c1bbe4dd4e23a176f7e1bee2616caef684f09983bd4e247c1edef95d5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/design_system.py",
      "before": null,
      "after": "7d4a99e155cddc9ed927df9b05544a270294fcd1b50e1fcd29ddfabab2f62d4a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/edit.js",
      "before": null,
      "after": "5cdce6440827630b4338fa858876e9529b07b1ad643f33bd8575d41fffa040d6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/extract_frames.py",
      "before": null,
      "after": "80c16f2a50e7f10050e143af9464240c18c61d58394761d672f65c869f13952f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/fit_curves.py",
      "before": null,
      "after": "126f944b640b395da13d20d2c2861c4fcc79254e0bce5201b2d545b7d02474f1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/generate.js",
      "before": null,
      "after": "4893f188d34ab6299e20807ca699b1101b351a2e6f6ab0b78610b89bb5856f46"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/hero-tier.py",
      "before": null,
      "after": "5059695dcd3bd1249595c3447fca112f0a6082c51d346bd086ce7724ae83f058"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/host-probe.py",
      "before": null,
      "after": "7f9634d18bd7dd1b20e37726e7afbd61aa422bec45b948760663fb7d096f2b2f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/icons.mjs",
      "before": null,
      "after": "ac621942dabd2cd4c86c4e2785081a56ee5a0eba79bd96e343999c99dfee2178"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/manifest_contract.py",
      "before": null,
      "after": "d85b12fdd420bf2659809a18cd9dd04acbe2d3c0f9104ab02f6ded6338967489"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/photos.mjs",
      "before": null,
      "after": "eded9158e229daf1a4f849ca2340c2131c5b4d5daa8a59b5ecce80ee38657bee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/quality_brief.py",
      "before": null,
      "after": "4adf5fa87207bf5e3db2c741f4aa15943964e7c1763beec6d5f07a24306fb1ed"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/record_layout.py",
      "before": null,
      "after": "55f2f48b1ba8ef10ddc2dd48ee9ad0115250663daf36e37e4ddb441b7c614d23"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/resolve-theme.mjs",
      "before": null,
      "after": "45978c4de0de9de54e12a77ccd1f67df649ed94c48feee68719634423c012206"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/resolve.py",
      "before": null,
      "after": "57f899eb860bd4627cd6b26ebcae0d2b721d4bc653bd5050d1507dd36dbc0bd8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/search-3dviz.py",
      "before": null,
      "after": "c00783f026d00713bdf73aa43724cd061b0c1b5d4de762890f798f91e2b6974f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/search.py",
      "before": null,
      "after": "13a491bb36621389104675c8c1b9d63f1425e6061b6599e012081d506b1f2006"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/shared.js",
      "before": null,
      "after": "fb5aa330daf5e777081b1a1930c538feac746981c4c987c84fb3c98df5302be8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-accessibility-checks.mjs",
      "before": null,
      "after": "8d64c6a2cd57ff96e9db9c749b22f98e50153838714d538d5f982416aad58c70"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-color.mjs",
      "before": null,
      "after": "b873bf54afcc73e1416478ff49985d6842cafa8cf932dfb147d1a0465be9749b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-content-checks.mjs",
      "before": null,
      "after": "e86a8982154d047e02d084d2da93f077cb39e26ceb66970b15a37cb65bdc13e2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-detail-checks.mjs",
      "before": null,
      "after": "4863301284c91318e40cccc31233706394da771146be8b9a76f5e3a02a8c7a37"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-inventory.mjs",
      "before": null,
      "after": "5a13b63b148a8725b333e8a4888394e8bc76186bb56629e5d4b41f19413932b6"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-jsx.mjs",
      "before": null,
      "after": "1227fb808ebeff18bd524ffb96dfdb7a72b681b1b81169f73a6028d4965ca46e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-markup.mjs",
      "before": null,
      "after": "f40030d09e0bf1412e4ead2285cb2dacf7158729f6eb4e13d13f10196f9e50cf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-render-inventory.mjs",
      "before": null,
      "after": "1b6050aefa1ae3fa3b189645743c8755d7eb11cb43dcddf97b3695c1f233abb5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-render-layout.mjs",
      "before": null,
      "after": "07bd100565a0d7d715be1ae49326fdf4099d92f1db466d2d0b332a139e1e81e4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-render-quality.mjs",
      "before": null,
      "after": "ec4a5156368978ac1a6517fd31799d1ddc437d2ceb95b25ba4bb9db4f847a2fd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-render.mjs",
      "before": null,
      "after": "6d39098cf4f7d7382284e9f8681d0025fffac3cb7999c40df1791449348125d1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-report.mjs",
      "before": null,
      "after": "ae68a764bd711420a5aa0e777f47f261850715f844e35b9dcc2e5639e6b39c5e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-structure-checks.mjs",
      "before": null,
      "after": "87734a1cb2cdb8facc44450efded07f2e6e5ded374c7c52557958698f5498597"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-tailwind-checks.mjs",
      "before": null,
      "after": "1fffcd5637e3a7f05e5480094839dcd8b39a83d9bbf1cd8e31060a00c5568624"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-tailwind-parse.mjs",
      "before": null,
      "after": "f72389a4eaa4d62a7565ccaa6cefd3046bd6f23c2716bcfe004e332063b55c1f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint-visual-checks.mjs",
      "before": null,
      "after": "b152a95ee9b1a373fea99d1e70fb3e9fa0e8cf415253b52d29e376ae54dd75bc"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/sloplint.mjs",
      "before": null,
      "after": "30cac91180b19bb275e02d5911b3a0f64287911f3b8d713584320a75f786f32d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/style_context.py",
      "before": null,
      "after": "3a759778cccbcec17c607d53b8981ff3224b4e18f7a3b7e1de7701df6bf911ab"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/track_motion.py",
      "before": null,
      "after": "a8b5c60c1da1cea05e6e21307021d6e9369e76388a50c16293ff18eebe35dda7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-browser.mjs",
      "before": null,
      "after": "47dec7f1f593eb257ba586be67836ec8ed2460aa35ee5fcfa2b9de0ab9b1fc94"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-evidence.mjs",
      "before": null,
      "after": "09ceee198400ae958c061d10c8433f2198219c38a4dddf093ce87806ec4854b8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-source.mjs",
      "before": null,
      "after": "761daf235295a9406c6a0a00a36acadd7728fc34ba1a73cc35fb9e23c915543c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/verify-surface.mjs",
      "before": null,
      "after": "c6f5f603968057f936fe6ba8ad649afcda2af3135cda44fc135384bc77f6d3a8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/README.md",
      "before": null,
      "after": "43a24b8c70efcbf7885b870d73a9c9bd8b4df14d31026de888bd3e4dd72d5a03"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/checklists/inspection-per-frame.md",
      "before": null,
      "after": "aaa6ddbe2d1334b964f45661e680dd86bfcb0832adce5ab68e655f72f1ec3567"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/checklists/visual-anti-slop.md",
      "before": null,
      "after": "4fb554acb6b2a25995fc04266af14ef30bf210a185e974564ea4105795d18631"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/docs/design-system.md",
      "before": null,
      "after": "bd5bd350dabf28ef14b1c3a83f924a18ec036a30c1d57ec80a6620c53f0f06df"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/docs/scene-spec.json",
      "before": null,
      "after": "50acf648e9e63e575cd30aa83bbfec122c450cb620a5b74af4be2599d7a6e76c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/docs/validation-report.md",
      "before": null,
      "after": "30ba4d22dcd57112313d2936bbffc8a25ca5b5975d755398a33a210d1e036927"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/README.md",
      "before": null,
      "after": "f3bde5f72e828e305718fc89840c5d8d45e16695afcf90cedfc67149c13646a9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/_harness/blueprint-views.js",
      "before": null,
      "after": "febc7501486929504cc2da0e17e279ab2578cdcabc9aac1d5b475594d61817ca"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/_harness/export-glb.js",
      "before": null,
      "after": "4b6f3415b9192b8f91ec886398900c8391d4b5f70a865cea7338d25ab7772846"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/_harness/index.html",
      "before": null,
      "after": "13103a8637fa6cda821fb9fd9962113a15e7b7f9f832821d179851b84cf410cb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/_harness/main.js",
      "before": null,
      "after": "2137451f36393415dc8bf1f959ee1fe85990b60d917e5c65f6932a28702473f2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/_harness/viewer-contract.js",
      "before": null,
      "after": "454531c342a593d958f688eef96b15933e8f028a15f9ba815d54274fedd81070"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/blender/export-hero-tier.py",
      "before": null,
      "after": "4fc2c397ca5f7c6aad484f738badc8fbbc8a28c5d54d8ba02c7d26c360e6e58e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/blender/export-village-assets.py",
      "before": null,
      "after": "aeb6c833a5c5dfdfe7170d5fa5afa603d87f5f86a31e7f5f58905c73094e4395"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/buildings/long-hall.js",
      "before": null,
      "after": "02d426b90618d359c2164bff8ebf2600d96866898e55ae1093921991d5a52df1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/buildings/market-stall.js",
      "before": null,
      "after": "58ffbe3490badb19b64cf7500de98d1edcb4498b0c0c8fce1da36a32d54222a9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/buildings/round-tower.js",
      "before": null,
      "after": "705d89b48def0f126d5af6e1d805b6f97ab2d5a8969469b5fffc26d89aaab78c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/buildings/stone-bridge.js",
      "before": null,
      "after": "22aaf4608f9b34cf9573e841febee176a716b563de020760385b1d88925ee8a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/buildings/timber-cottage.js",
      "before": null,
      "after": "e945d5c736a43d6c6753782d140ac72b6b5853ec7148fd4c6dc59f22b569c412"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/buildings/watermill.js",
      "before": null,
      "after": "f074177b02b2a39bae8fc27d47eb94604840e4f9eb6791675f1d130f3de86b12"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/creatures/biped-walker.js",
      "before": null,
      "after": "2fb2cfebdd838412ecada72655d426dc01dd6d98bf28249d2843881d5307275a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/creatures/quadruped-walker.js",
      "before": null,
      "after": "15b4d744dd6db53df691bce09000d3107bb714ec8ce4241bf52d6eb279196ea3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/gltf/iron-lantern.js",
      "before": null,
      "after": "4857fe477f68edc4e0b8e58a3382c772d4d0de4bedf6aa51947744610bce19f5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/gltf/stone-guildhall.js",
      "before": null,
      "after": "3b040aa19025c077822da336aa3efa6789602f94dfdb8eb5a705c810749b659e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/gltf/timber-cottage-t3.js",
      "before": null,
      "after": "7351a146e8e69fff317722499973af85926b035888b794f0ad085211453d8e9e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/gltf/watermill-t3.js",
      "before": null,
      "after": "bbc52a598cd133f6e4aa9a883f04441c3b98f43414189efa565d8bd7af36c368"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-core.js",
      "before": null,
      "after": "2f74b83cce03ca695c010e375f3d9541da53554a00d3f97cbd0f11ea4a4be532"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-lod.js",
      "before": null,
      "after": "d16257c069a890915723203cfe0bd81ab8be83ac587825175063ba76422daf72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-surface-ao.js",
      "before": null,
      "after": "ef4b8ba6b2cf41a3e4ee16c8d6826426d7942424669e546390453613ef75e1ee"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-surface-draw-organic.js",
      "before": null,
      "after": "f1e2df25077346809ceabbfc504e0117edd0fac5c0170fef4ecc4bf23c2d007d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-surface-draw.js",
      "before": null,
      "after": "c1631556755cee20ad9008bcf85c361012c6d0f78c4a03ed99c273f7f288e6fa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-surface.js",
      "before": null,
      "after": "def394d7e6bc0bdd6f20ecde29b4dc2d2787b5d2d6a6983ca736e20cd862b323"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/kit-walk.js",
      "before": null,
      "after": "8240840c47d7dede0cc9c9574a8f64186a1463482415604b47f8490dc67b58c4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/layout/village-layout.js",
      "before": null,
      "after": "1e1d17206e8faefcab7c2005a570e14b6190f722b48c00a3e0ae58f6ccf010fd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/nature/reeds.js",
      "before": null,
      "after": "d3196cc7d50c78bd032e7d71104d97557d3cb7418568ce70563e2cc1833cc364"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/nature/rock-cluster.js",
      "before": null,
      "after": "250fba5fb12c51caaa8d6a85c8c24e167d70c7470f2845b38b5c8485abccfbb8"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/nature/tree-conifer.js",
      "before": null,
      "after": "7754941646552dc5fd922cfea077cd38f87461ae2293c5f23d78e05fc5d1c6a4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/nature/tree-round.js",
      "before": null,
      "after": "0d2266570f20fb23cb7320955842a407a61e356a1c047c2f7f7868dc07474415"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/bevelled-box.js",
      "before": null,
      "after": "c2c013b317485cd90f9f2cbec5b7997f604480c675934d7dd662ec89d9b5c39d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/chimney.js",
      "before": null,
      "after": "6a067c7082f73d8949e5b2977510681fb6101951ded7ef366b6da36207570d65"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/door-with-step.js",
      "before": null,
      "after": "10aa49cbb52e52422f9a819849334cfd109e6cbf4916eec6e31ada64cd7aae5a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/inset-window.js",
      "before": null,
      "after": "274fafa01c231f46a120cc8f9ed828328f25e6f1f6a8260b23c40795fd46c660"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/railing.js",
      "before": null,
      "after": "ed2e0e5f92acfba78460e1b8ff46794ec6de4a4ceb4797649dcf4d86a29685a5"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/roof-tile-strip.js",
      "before": null,
      "after": "4987c40ebb2f0c1aaf93eeff235c372c2136c5db3f260a795081518bca5e9284"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/sign.js",
      "before": null,
      "after": "e64d5ff9a887571c42c2f91cec2669017df0387ab637b7fcfe128775dcfb7fd4"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/stairs.js",
      "before": null,
      "after": "dd1e2e45bdc2a86cec5f1ef3d6077113d5e67f93275685c697a0c46f16e96ebf"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/primitives/timber-frame.js",
      "before": null,
      "after": "4e3285481eb3c156d28c3a59587ef4d126bea7223c841fb633cccb95b11c7c57"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/barrel.js",
      "before": null,
      "after": "e82c88bb55431931a15431672815daf4f2e97dbaa13436c898832ede36f820d0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/cart.js",
      "before": null,
      "after": "b92cb9abc42d571cde6c44a1808fb67036e874d1bc14b4c9a34becf447dc5a9e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/clothesline.js",
      "before": null,
      "after": "036597e3c25a09153bf1e8a48680c36533a917f0a97cb808926c4575fba6b1f9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/crate.js",
      "before": null,
      "after": "c998372c351a3e05adf04ca38255e021120984009a93a4a52be663c6311590d7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/fence-run.js",
      "before": null,
      "after": "066f5cd9d80884d1294d534d10a95b22e0424c1c199f83012e5cbd91f446837e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/lantern-post.js",
      "before": null,
      "after": "5ec01931315776eb1d45d49aa2c2fb2c1f6b47290e4047bb836f8755c4a69932"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/signboard.js",
      "before": null,
      "after": "c219159de172bd4ce1dbed8b68a4c0a41c8d44bdb7212b67a463d7a521833f72"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/kits/props/well.js",
      "before": null,
      "after": "c3293b4ae16f74b830f816e8fa0b256aadabdcd6f9f5c2feabd26fd40ecd87a9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/alpha-cutout/alpha-video.js",
      "before": null,
      "after": "d5be9d6f9b7c1e9c2226f00ff00e3afd6651c455132b36b0569d0afef9d07c32"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/cursor-rig/rig.js",
      "before": null,
      "after": "0bcabcaa1b61a290afb6e050106e7c949fef45b1e8683ad67d38f9cf2bd330c1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/exploded-view/demo/index.html",
      "before": null,
      "after": "7327c72a93a88789887d9d62f936292abfc095d2623db7f98ab2d18bd8bfcafa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/exploded-view/demo/motor.js",
      "before": null,
      "after": "bfea9391fadcc4b64ae904d1dca51d577087cc0cc15ba35e8b1bac2a980f1b5c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/exploded-view/explode.js",
      "before": null,
      "after": "399865f355d08b9d8d97cc03820bea85bf1752b2cede4f4a4c90e64a696a2ef3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/scroll-film/scroll-film.js",
      "before": null,
      "after": "0cecdc5fbb07c32ed76380903fb52013893021588686bf85e8878765e70c045d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/threejs-scene/starter/env.js",
      "before": null,
      "after": "f5d57a15278db0f6588eab3e7b29b7374424acf44db286d13b66d1e9bd841747"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/threejs-scene/starter/index.html",
      "before": null,
      "after": "154933b9da22034181e2fe73b49bb8806a908a2d1226482b251355a73d95bcfd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/threejs-scene/starter/kit.js",
      "before": null,
      "after": "3a5a55e48e6466e3f8479291c99a69d0eda9c5d03c071c0dc372e7b2d0e868d3"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/threejs-scene/starter/main.js",
      "before": null,
      "after": "590a1744f428046e8e1b862aedf85141c02dfe8ee0365773304ee8d9579c9e58"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/open3d/threejs-scene/starter/scene.js",
      "before": null,
      "after": "0d176ef485b58231d2d5da0c2219315014b3fb5a6c5ef52186a66888e4ba78a1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/rigs/camera-orbit-follow.js",
      "before": null,
      "after": "f14cce4fc340ff6012f0a067afd408ab03a804d907023d6f38233b47d7e5e453"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/rigs/lighting-night-lantern.js",
      "before": null,
      "after": "f26cba5fb20b1fa7aa807179d5bec3740b57569bbcf2726aa6be84efde754db2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/rigs/lighting-studio.js",
      "before": null,
      "after": "5c01c6e087bdba25b6bc73da07b279d7f120b8a6bc05042d57922a33fcbddf3e"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/rigs/lighting-sun.js",
      "before": null,
      "after": "5444c821b44f6914dbfe5623914f96b19ecbb3c061fa81b6ede3fce436c629fa"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/rigs/post-stack.js",
      "before": null,
      "after": "2f959a7ada33ffc4643916df4fdf142725ba156e899179faf021e1740d4da1de"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/README.md",
      "before": null,
      "after": "6eeaa855bb7fd99e84d22ab3913ea28c05908495085f3076575c9c0cba60c1bb"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/index.html",
      "before": null,
      "after": "f0402fe47fbc8ca66482e2f08821d0b8e39b57d7fc868dfe3ad144e604a702f7"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/main.js",
      "before": null,
      "after": "af3ee22fd3d85bb83b7ec909b96b2d018d6e311fdac7c4a17459f8fa64d8e7cd"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/package.json",
      "before": null,
      "after": "29171f7bcc97f9f342913f587ea0bea727f440c038b49819d74e233d7bb8fc90"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/scene.js",
      "before": null,
      "after": "5241b367d74c0a440195876e918deeb36ed39c85b8a4056763975dca836fc459"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/style.css",
      "before": null,
      "after": "cccf5b5a2025e08a8c353bcadfb331a7ce77726ef049627c5434ec9daff36a4b"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/templates/scaffold-vite-threejs/viewer-contract.js",
      "before": null,
      "after": "454531c342a593d958f688eef96b15933e8f028a15f9ba815d54274fedd81070"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/3dviz.txt",
      "before": null,
      "after": "8f14c9e32eca3aa5a85bb7c376ebd0471adb7c9c5a174c5f3f479f50bb0f5316"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/auteur.txt",
      "before": null,
      "after": "030435fc8e382b307cd0d592b43c307634abae20b69da361d356fea230ee0672"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/ecc.txt",
      "before": null,
      "after": "326146379f01bb137c0a5d3c54770c1aa31076705c8b88a7f6b26a460f6221b2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/hallmark.txt",
      "before": null,
      "after": "06088a8b94598626f27612dea42300154bf7be967c85d9d3eee4490cb056af7d"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/impeccable.txt",
      "before": null,
      "after": "02bb8c3b4e70190e3986c0404ad2fd8d639b4f534252d82379cc1b502b6d1812"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/open3d.txt",
      "before": null,
      "after": "9e22b0b3fd03d4b2c0e696c055c1d920af9a40e33eed82878844f018610e7102"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/taste.txt",
      "before": null,
      "after": "4575a543ab88dad12ccea7d97e563d0bce5b448b06072e65d3264497dad326df"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/threejs.txt",
      "before": null,
      "after": "d26f12fa1a0e03fd5aa4d3cbf05262a9f1c684672d0864abac78b3bbb12b268c"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/third-party-licenses/uiux.txt",
      "before": null,
      "after": "738f69dfa83db5c347c678fb9d90e560877059f0de93a327c39001bff92dc014"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "5111cb87e2fd2bbc5af66f1782e1dfff5b297706914a45429751c1866f8fe2e4",
      "after": "b6d9487d99c0f1c0133f1e2a5d7115a21727ad69c4e216422acd421e47aa7a40"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/composition.md",
      "before": "fa5f102d46f55aba4512fd6117ff88408ae1c783f97d7eed3c485f39ef67a33c",
      "after": "0641330452ce084e30c74e185e1107888549b082d0e2870c280d5065916af229"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "69e1875bd816605d92a24b72afc64cb06485c7c565f43940fa0d174e82216ea2",
      "after": "6b6d2054a17545a206fb77e5269182cc22b691f0804b17d0c32533c5db6b8295"
    },
    {
      "path": "crates/op-design-lint/src/detectors/slop.rs",
      "before": "7c8ab3ea2259c9e4a98ef8606901486b6e25ca34fc134ad3d981aff05710b7d4",
      "after": "b15d4e3d06466ba5a9775981ab3911e3618d63065413df21172e4271ec517eec"
    },
    {
      "path": "crates/op-design-lint/src/detectors/slop_tests.rs",
      "before": "f8276136927ab4a3f74e0529f5e9f48dca6ce8eed7ec4c479f48c203da5dbcea",
      "after": "defe6c35ead1053bd596b0a35cfd87eeebc9efd51dfe004fcf59bf953113075f"
    },
    {
      "path": "crates/op-dsh-engine/src/lib.rs",
      "before": "514f850d4811514dcc6ffa09fc9990d4f2b30e8345ee2f3fce9a338f4f277591",
      "after": "03ec3ad623459dd738fdee0a284e1bd15516daa5e56503fae040f76d60736bdf"
    },
    {
      "path": "crates/op-dsh-engine/src/lib_tests.rs",
      "before": "a9d4f2fac385fccf13c53a0d7bd43e0fd2075cfb96e982942c5b8632271b09b8",
      "after": "f1a0c9e5c83e9087d5a45eaea54bb1d9cef0f2807e6c5c0cd3947bb0cfc6dca8"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_tokens.rs",
      "before": null,
      "after": "7bd6c5cc1830589f880b68ccc3d7b88df6f0a15c328ffb166f92a03a19680756"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_tools.rs",
      "before": "1eaaad9b07a60390100747ea5bf626af61191b5ab63e4de2bb85c191d04fafce",
      "after": "77c31f768a521a8df59fb17175526bf39b2f9d06028bf0ff577e2fd45f98167a"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_variables.rs",
      "before": null,
      "after": "a609755711312f70becd1602b5ab1af179962eb2b0b69366a45fd889de501209"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog.rs",
      "before": "328a762641bfc6e199e2c95b0ebafe5fddb34387393118ea94cdda1098e83001",
      "after": "30e3ea4b0c54d39a66ac1be8ac478b08c5d7a028c88a069b294890d2c2d0ad28"
    },
    {
      "path": "crates/op-mcp/src/batch_design_tests.rs",
      "before": "44af5fafff4b2de55aa9ad1737e2631c00cf88e1d93eba8657883c84026bcb4d",
      "after": "e3c0eaf003d4f627a02eecca2a50aea7466689c09d5a0943117257d32bfb0b77"
    },
    {
      "path": "crates/op-mcp/src/batch_design_wire_error.rs",
      "before": "7e84cd0667f68a663398ec5aacab219967f5efa2577adebbafde6911959b5049",
      "after": "5d6cd20c06623d5df2d9af63e950a0b9620be66360a12e5f14a6cafe9eeda565"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "23e16b739082b9164d9d1013d5f5d03c1b91b663a9720d7f9bb7d73c2fd98ce1",
      "after": "a7cc726babf372721ed08e138c475aba7ffd0604180eefe9f382498c2f38ec7f"
    },
    {
      "path": "docs/kb/product.md",
      "before": "bf50f953ec33c4f26c9ee2a8f6e839bea42cc58ebac5babeb51b406ba183ea1c",
      "after": "0c36bc985e469d80bbca43b0c0c0fd49e9b0891d4f361cff0a1238b72d57473e"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "2dea81c6bf9a45dc4824c51b7e5c9ecd95a040e9646164dc5237b078f100e08f",
      "after": "dd70bcca6160c11527f85f0ae2435a8f65f55eb5e99b983e5124f06e31cd90c1"
    },
    {
      "path": "packages/dsh-node-runtime/build-engine.sh",
      "before": "1a5b26fb2c4c95851fb9e5a745450503a9590abc42c49e3e0624c7d29d172b93",
      "after": "11e0db5c2831c247bccb14d8b216d6cfd5f4864a3e492861cb7ba15b8250b222"
    },
    {
      "path": "packages/dsh-node-runtime/design-tools.test.mjs",
      "before": "f26524c1967483f59c4a97b7382bd6748962267111ee4de58097320074f10eb5",
      "after": "2db8aa6d74d04c335e839880738dd3f961949efb361e2d5f4b78c7e7dabf6f67"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-browser.test.mjs",
      "before": null,
      "after": "997a38a2b972bf2b2cac8df0bdf38ce267aad329aba8d9122d588c6f25fa03e3"
    },
    {
      "path": "packages/dsh-node-runtime/html-skill-migration.test.mjs",
      "before": null,
      "after": "192676e621d8b7a37d4df1e36b4c2799b6f683e7098fca47de5ec2d987db205e"
    },
    {
      "path": "packages/dsh-node-runtime/package.test.mjs",
      "before": "c47b4c6aeb68e7982c2d1aea18a7dc0d49ff6386c3a3216c705593f7db8b5a1c",
      "after": "df619e27b008036026bc088119b7962c17f94b3eded3edf121c5de1a6d8783e8"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "77a05ff6541b63ac376fd2cabb8f5c2073888d2b4299ea231fb28f532a64acc8",
      "after": "6b54338f0f12dbfb897ccd2a1558f36d2da383e10a1008a9c9f5b73b869756f2"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/scripts/capture-poc.mjs",
      "before": "0dd3339c3337eee1129cdd24611cab6dcc8a4919cbe8dc06ac351b3275daa41b",
      "after": "fb3c90b015cc9ed3e1626cec2816a73e8f5677782e1ff300f83c677fbb58bda8"
    },
    {
      "path": "scripts/stage-dsh-runtime.mjs",
      "before": "8917deeb0f8b8b22136f98a83503bcc7116e1cdd6165fa3089eb82f27028180a",
      "after": "0920c3a65f0926e554b1d4f80426e667edef70a0e872c74a6370bf9ae9f40dc5"
    }
  ]
}
```

Completed-At: 2026-11-11T02:07:25.774907+00:00

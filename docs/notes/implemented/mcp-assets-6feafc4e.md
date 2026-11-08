# Complete persistent scene-template, style-guide, theme-preset and editor-theme MCP tools with shared UI assets

Record-Version: 2
Task-ID: 6feafc4e-5363-47a4-9db0-483ee4b6380b
Base-Ref: aa8c6eaaace191668168065ac485a191ae7fc705
Started-At: 2026-11-07T15:41:54.457824+00:00
Type: feature
Status: complete

## Context

Complete persistent scene-template, style-guide, theme-preset and editor-theme MCP tools with shared UI assets

## Changes

Approved the complete shared/persistent MCP asset design and saved the implementation plan
in the session workspace. Added scoped AssetStore using the existing Node 24 standard-library
SQLite API: atomic transactions, revision conflicts, stable ids, readonly-id guards,
32 MiB payload limits, saved-template quota and explicit storage errors.
Ruling: use SQLite rather than a custom stale file-lock protocol; Node >=24 is already
required by this runtime, and SQLite gives cross-host atomic writes and process-exit lock release.
This avoids introducing a dependency or unsafe stale-lock recovery. Store list snapshots
contain metadata only; full payloads are loaded by id.
Added Rust catalogue/validation/template and theme application, Node asset dispatch/API,
and editor-control acknowledgement broker. Added state-scoped managed Web cards and deferred
persistence actions; final production WASM/CanvasKit builds and isolated Chrome acceptance
have been verified.
Ruling: retain unknown node fields in the Node document-history sidecar rather than losing
them when canonical Rust insertion allocates new ids — preserve extension data without
changing canonical layout/ref rewriting — an incorrect node pairing must fail explicitly.
Ruling: split reply, sync-JSON and selection enrichment helpers to shrink existing line-cap
exceptions rather than increase their ceilings — unchanged logic stays under regression tests.
Corrected the private capped-writer test relocation; all five managed Web tests now pass.
Direct engine style-guide ids now resolve explicitly and unknown ids fail rather than selecting
an unrelated guide. Added HTTP regressions for shared API queue release, conflict codes,
cross-page reusable master inclusion, revision-consistent catalogues and durable API autosaves.
Ruling: include required reusable masters as template roots — source references must remain
valid after insertion and cannot depend on another document's library — extra library roots
are visible rather than silently hiding a master and potentially hiding its instances.
Ruling: reject a catalogue whose revision changes while reading, and bound its response to
32 MiB with an explicit error directing callers to paginated tools — no mixed revisions or
silent truncation — a concurrent writer may require the caller to refresh.
Preset hydration now publishes only a complete ordered batch and reports network failures.
Editor acknowledgements expose failure, require the saved preference for persist=true, and
select the freshest heartbeat so a reloaded tab supersedes its old registration.
Ruling: require the current design to synchronize before UI asset saving/application —
avoid saving an older Node version or overwriting pending edits — the user may need to retry.
Fixed managed style pin ordering: fetch the stable-id body before applying its rules/variables;
unpin does not re-fetch or reapply the guide.
Final review found three coupled template bugs: aliases/slash references were not rewritten,
updating an asset could reuse old variables, and theme axes/defaults were lost. Added failing
regressions and repaired them using a formula-safe, collision-free namespace per managed
insertion. Rewrite definitions and node references together, migrate axis/default/override
selectors, and retain single-undo behavior. A shared formula identifier predicate prevents
the template lexer and variable resolver from drifting; slash remains division inside formulas.
HTTP save/insert/update/insert/undo verification also exposed ordinary set_variables/set_themes
arguments being removed by EngineSession. Restrict prelude extraction to batch_design.
Mechanically extracted script-prelude, script-expansion and host-http helpers to avoid growing
old source-size exceptions; preserve the original public re-export and viewport validation.
Review rulings: older Figma/canvas/harness changes and legacy native memory-only assets are
outside this task. Preserve explicit selected roots, including ancestor/descendant selections,
rather than adding undocumented filtering. Preset rename/hydration retry concerns did not
have sufficient evidence to justify new behavior: failures remain explicit and the last good
view stays available, never a false persistence success.
Final Chrome run exposed a reload timing race in the test's fixed 1.5-second sleep; isolated
reproduction passed. The test now waits for a successful new-client heartbeat and editor ready
before sending theme requests, without retrying or weakening actual tool assertions.

## Validation

- `node --test packages/dsh-node-runtime/asset-store.test.mjs` —
  first failed 12 tests with missing storage; then passed 12 tests.
- `node --test packages/dsh-node-runtime/*.test.mjs` —
  passed 139, failed 0, skipped 1 (Chrome not enabled); not claimed as real-browser acceptance.
- `node --test packages/dsh-node-runtime/asset-store.test.mjs` — passed 14 after
  adding real SQLite contention and corrupt-payload cases.
- `cargo test -p op-dsh-engine` — passed, with two existing ignored syntax tests;
  asset contract tests cover template/theme single undo and DESIGN.md aliases/errors.
- `node --test packages/dsh-node-runtime/asset-tools.test.mjs packages/dsh-node-runtime/editor-control.test.mjs packages/dsh-node-runtime/asset-store.test.mjs` —
  passed 23, skipped 0.
- Full Node suite initially exposed extension/history loss, missing-source-directory creation
  and a loaded-run performance failure. Fixed extension preservation and source-root creation;
  targeted AI loop passed its existing budgets. The final full rerun below passed.
- Managed Web tests first failed for missing scope/theme semantics, then passed 4.
  Added a fifth preset deferred-publication regression (failed before its implementation).
  A build exposed a private module-path error; corrected and verified in final tests/builds.
- `cargo test -p op-dsh-engine get_style_guide_id` — first failed unknown-id behavior,
  then passed one test; feature-enabled managed_assets_tests passed 5.
- Hardening HTTP suite — first failed 3 cases (queue, error codes, component dependencies),
  then passed 12. Publication suite first failed 2 cases (mixed revision and missing autosave),
  then asset/control/draft suites passed 21.
- `node --test packages/dsh-node-runtime/editor-control.test.mjs` — passed 7;
  persistent-preference and reloaded-client regressions failed before implementation.
- Review template regressions failed before their respective fixes and passed afterward.
- `cargo test -p op-dsh-engine` — 60 unit and 10 integration passed, two existing ignored.
- `cargo test -p op-editor-core --lib -- --test-threads=1` — 1288 passed, one existing ignored.
  An earlier parallel run failed a load-sensitive history timing benchmark; the full serial
  rerun passed without changing or weakening that benchmark.
- `cargo test -p op-editor-ui --lib asset_center_tab_tests` — 19 passed.
- `cargo test -p op-host-web --lib --features canvaskit -- --test-threads=1` —
  776 passed, 29 existing ignored.
- `cargo clippy -p op-dsh-engine --all-targets` and
  `cargo clippy -p op-host-web --all-targets --features canvaskit` — exit 0;
  warnings remain informational and do not count as errors.
- `cargo check --target wasm32-unknown-unknown -p op-host-web --no-default-features --features web`
  — exit 0.
- `bash packages/dsh-node-runtime/build-engine.sh` and
  `bash packages/dsh-node-runtime/build-web.sh` — exit 0 after the final semantic repairs;
  real CanvasKit bundle staged, not a stub renderer.
- `node --test packages/dsh-node-runtime/asset-tools.test.mjs` — 11 passed, zero skipped,
  including shared HTTP save/update/insert/undo and ordinary variable/theme tool calls.
- `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`
  — final rebuilt runtime: 162 passed, zero failed/skipped; real AI screenshot/lint/repair
  loop and managed editor temporary/persistent theme, reload and self-driven catalogue refresh.
  Initial final run failed once on reload editor-timeout; condition-based readiness then
  passed the complete suite, with production timeout behavior unchanged.
- `cargo fmt --all -- --check` — exit 0.
- `packages/node_modules/.bin/oxfmt --check --config packages/.oxfmtrc.json` on the 18
  current asset-related runtime modules/tests — passed. Wider directory check also inspected
  unrelated pre-existing formatting debt; did not mass-format old Figma/renderer/CLI files.
- `.venv-lint/bin/python -m unittest discover -s tools -p 'test_*.py'` —
  initially failed only because KB source fingerprints required review; final rerun after
  review passed all 81 tests.
- `.venv-lint/bin/python tools/knowledge.py check` — passed after substantive product/runtime
  review and unchanged-standards review; canvas-resources sources remain current and untouched.
- `bash tools/check-maintenance.sh --base HEAD --task 6feafc4e-5363-47a4-9db0-483ee4b6380b --lint-js`
  — exit 0, including oxlint (warnings allowed), task/knowledge harness and 500-line cap:
  2509 sources, 245 non-growing legacy entries.
- `.venv-lint/bin/python tools/task_notes.py check 6feafc4e-5363-47a4-9db0-483ee4b6380b` —
  passed; current task receipt contains 63 scoped files and no user .op/.fig/database changes.
- Relative-link validation passed for updated architecture/command/product/runtime/standards
  documents. `git diff --check` — exit 0.
- `cargo test --workspace` is NOT fully green: existing
  `op-host-web/tests/paint_order.rs::canvas_paints_before_property_panel_overlays`
  searches for an outdated source marker after earlier canvas splitting.
  No unrelated test/renderer change or claim of full-workspace success is made.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Rechecked persistent asset ownership, complete tool discovery, shared UI application and template update isolation against the architecture and final runtime acceptance.",
      "sha256": "72e914159c57b2b822ccfda74fdf4b0116f73357c81f0d8256e8a940c34e37d8"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Rechecked SQLite revision conflicts, template namespace and theme migration, batch-only argument extraction, ack queues and new-client readiness after reload; retained actual Node versus WASM script boundaries.",
      "sha256": "7fc26b78e1416d610cbdd6da300d51bca80a183642803830173a7688dcec32f5"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "COMMANDS gained asset tools and acceptance commands; authoritative 500 effective-line cap, errors-only lint policy and independent task/knowledge lifecycle remain unchanged. Rechecked wrapper and task/knowledge command behavior.",
      "sha256": "a89257da3ba3bdfd45ab8b446c9fb9af8833aec6f22c5f4641ee11fb0ab5eea0"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- No commit/push or remote CI/branch-protection change. The user's live host on 61891 and
  their design were not touched; restart the managed host to load the new runtime.
- No storage migration is needed for old in-memory assets; persistent storage uses schema v1.
  Unknown/corrupt schema explicitly fails, never silently resets. Unbound hosts can read
  builtins but need an existing document directory or explicit asset directory to save.
- Catalogue reads occur only when revision changes; SQL metadata projection is not further
  optimized. Payload/catalogue size limits and quotas fail explicitly; callers may paginate.
- Synchronization conflicts and concurrent asset writes require refresh/retry. Failed preset
  hydration preserves the last good view and reports errors; it is not reported as success.
- Legacy native hosts, remote CI and the unrelated full-workspace paint-order failure are not
  accepted as verified by this task. Existing ignored tests remain ignored and are disclosed.
- Rollback: revert only this task's scoped code after separating earlier dirty work; stop
  hosts before restoring a backed-up asset database. Deleting a library item never removes
  existing design nodes. Do not downgrade an unknown database schema by force.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "10f8e388696d2bafccfff00525527bc06cb0f2df3dbdd56d6de01674e8ceecd2",
      "after": "9fbf2c089843aded398af71fc09d858562055744fde9b1bc29dbf4a83bb290c0"
    },
    {
      "path": "COMMANDS.md",
      "before": "56f6e63eee794983cc31652152513eb11deb0a431606add75f95e7ea09cc5bc0",
      "after": "493f8561b7258f7c5c2f8e1ea9967a19d7b3daf1b3dc6bf82cb5eef571ee5dc8"
    },
    {
      "path": "Cargo.lock",
      "before": "925de4dc72e6c7b233ae781bdb598a78b2c9c7c7b452d412a8691403104aecc9",
      "after": "e25b4128eb5d3ae7cd9d5c0a9aac5f06fc9d47c074e24db198e6bed8a828ea22"
    },
    {
      "path": "crates/op-dsh-engine/Cargo.toml",
      "before": "17bbed945b7c70ba1bea95cf2fc011a7dd9dc3b5d9bf2b4fc0ad63d797d43d32",
      "after": "8b788e902125086168aaa596d84b4e33250004c442c53e9038e710048613a810"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_catalog.rs",
      "before": null,
      "after": "babde6f36a712522d39e3a6af95e4a2bd547faf114ed6dabd2b191dd66fdd4dc"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_semantics.rs",
      "before": null,
      "after": "1b91e8c8205116614e9c948e83f27256b42341e28e1fe6f8ba4221debd94341f"
    },
    {
      "path": "crates/op-dsh-engine/src/asset_tests.rs",
      "before": null,
      "after": "a170d6408b7843b8135f21acf87e74b4c6ec03f2e1c9a22861277eb41670fa88"
    },
    {
      "path": "crates/op-dsh-engine/src/lib.rs",
      "before": "c70595912d43712e6a3ce74288445fdfc67e71d2d491fa7bcee804b2615956c7",
      "after": "26fcaed77e30d238ce115e74bc464ba1fa561abe9b1e7c912601d4c64d335e7e"
    },
    {
      "path": "crates/op-dsh-engine/src/replies.rs",
      "before": null,
      "after": "ea60a482ff77322c4a6f55c38f54d24388ee5d0134ef43744dbb1ab258c296f9"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog.rs",
      "before": "bc02537371fb1fc2b8c222ac675d056529760363f4887e4cbec78ecf5e0bfde7",
      "after": "e048f175e7c07438b78764318b8429bfc114a3a155abef75ec5c7dca6cb3103b"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state.rs",
      "before": "914e030e0595ee98e31a375adc7a8a7635341dde3577f705cdd0fce72288de5a",
      "after": "35430934c0b8c8de025dc94e27dee846ddb2e47f5ca201e0e1a2343252bd54e7"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/chrome.rs",
      "before": "ce6e9abc735cca0acd7f5056fee12089a0ace3d4235b512cbdcfcf2d31f9b564",
      "after": "5138b2a1fae1da73a7200477ccb09e0cd9c0e225ac6fde653c7daa426e075617"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/defaults.rs",
      "before": "42ebe3dc728e7c7b0c403792a7e83ba6546d7d8e0711b47680d15bb5bb511ef0",
      "after": "17880f998b6c27aeba6190601101c44f7216099b10a452200c00c5f62dcf1b56"
    },
    {
      "path": "crates/op-editor-core/src/editor_ui_state/methods.rs",
      "before": "b96229fa2bf0e502d013be2233719e82c84dbe63df9c77327c682bae465379cf",
      "after": "32cf70fecda69aa8c4e69d98628408340c98791d64e18c31b55bfa18b6a3d1be"
    },
    {
      "path": "crates/op-editor-core/src/lib.rs",
      "before": "c0e065b50df13d192869e1634ff06cd413e949815f447f0d579b416087e06b4e",
      "after": "da977b37269789797d2056d96c2b7bfa4a4b82e385163e4b5c008101dd940025"
    },
    {
      "path": "crates/op-editor-core/src/managed_assets.rs",
      "before": null,
      "after": "6d69043e6aa87c19fc5935de2fb8f7a8fc39e5f7faeea80d354a9084c3b9ee8e"
    },
    {
      "path": "crates/op-editor-core/src/scene_template_append.rs",
      "before": "5949cdebb7312e3e1aaca2088c42ca5d2aceebd05b4c14703bdebdf363f02c2b",
      "after": "4a7eb51a15c1942f30e07b3b2ada2386b7bebe101b1adf6deaa5b06ddf3699d6"
    },
    {
      "path": "crates/op-editor-core/src/theme_presets.rs",
      "before": "42c0ec1b2622b62718d2a49993d00fc7cf214adfbea2ad375af6722ccd080437",
      "after": "37481f0c72a68dc2fd15814632e9b96428399998ab9df84e09fb59328a17175d"
    },
    {
      "path": "crates/op-editor-core/src/variables_resolve.rs",
      "before": "6b984e3ea2c909e1078102947a40106234aa251755e080605be9c1d00445defa",
      "after": "6894f13dc2cb1611802e729c57891b1903e4e2d45322f2731590524fa49f1daf"
    },
    {
      "path": "crates/op-editor-core/src/variables_resolve/evaluation.rs",
      "before": "6156e46cab28ae7111211a7e7335677ae552219b2d11b7eb29202928b68fb074",
      "after": "63949c106e12b274f5f7a095f30a58e531ca4d520a4dc077dc0708313edd89ac"
    },
    {
      "path": "crates/op-editor-core/src/variables_resolve/reference_rewrite.rs",
      "before": "0f66d8cc26edf6970a13a7d0ec00370e9ccae8424024a89ef34c64b7f49c84c0",
      "after": "a8d6b8537a1cc5d7e9504e8a27dab09cf3e671ee46a1127447428fb6cdccaffd"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/agent_settings_press_flow.rs",
      "before": "e272e068fe8fff964486ff1dcb2192d372b7a05cb311ed337418c8d494ba6fdb",
      "after": "53ea67ca5aa246d8020a70e17f6ba7ee1f652281754d47733b805d72c99e628f"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_style_cards.rs",
      "before": "acad847e71d15051b7e551a2d425cc5e3251d3bbb7d67818c6aa178d61b785e6",
      "after": "c39da53e9c2ae651f91cfcbd0c2525536e2ec9edc829761f23926bb95ef526bb"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_tab_tests.rs",
      "before": "adfbca4f84a5089a3b06e73b149f9dc6f82408f43fb3d12f4df5f9f24d3fd37c",
      "after": "d157d046c902f614098570113adf357c08ea67e75246714c7e7f5ef9aa0cbfa1"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/asset_center_template_cards.rs",
      "before": "255eb37e43a26c2a6aff1004a96335c6149f8a3662ef5dd86f2b6745a3949fd0",
      "after": "2a1180e60de193d11684c345ada6dca4aa2b0691e8255dcceb84bfad49e29613"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/press_flow.rs",
      "before": "edf7629f1040b66c9ec121e3c29ef3526a81e70eee11641afa363e4268d787da",
      "after": "6260b36cccddd4c59334ce309ee6c1d709d0dbf1764b63d944281a90a32d6a74"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_panel.rs",
      "before": "99c9243ae66eee98cce4a144338be7f092c65aa9d0de93eb5fb2ba2fa0550fc5",
      "after": "0830f8fde71955256f382c77deca859ab69df397632a5e0a05cf87dff728fc36"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_press_flow.rs",
      "before": "4ede4c15697c9b14620d4f494d02c7185e24b0e41f93cd36d3719c82d548ce92",
      "after": "77f9004169ecf62a8ecb0b516c268b0ca0c7d9fd38c4886f01fe3df5e1fb0407"
    },
    {
      "path": "crates/op-editor-ui/src/widgets/scene_template_user_layout.rs",
      "before": "cdd7de4174d67f6523447d62d7eccd4b336c078b15541179d11efb3ef9124645",
      "after": "bf0c767f54200e974ee01fb1a8a8c104bb455c74e6a9fd19fbfad2a13a8f8000"
    },
    {
      "path": "crates/op-host-web/src/lib.rs",
      "before": "f42dcfcee06077a2ad545b5df4fd8742d50fdd3b515f86af4fb1f089639364a1",
      "after": "bfe152429a7713570e6d03aced53c6a3e6d207ee1f1d0f7cc891ec5c92358202"
    },
    {
      "path": "crates/op-host-web/src/live_sync_glue.rs",
      "before": "64b927323ec86f0a9c07d73034840bee88abcc0298ce7cdcf51d5da4c98b8169",
      "after": "9b5f3faa6f5969480230945b3adb1141b40743ba8e64c328de928c07cb6416fc"
    },
    {
      "path": "crates/op-host-web/src/live_sync_glue_tests.rs",
      "before": "bcb9e9c4e751bbdc0d267e1c7f7fb267dd141c5da4646ea91b00145d37b21704",
      "after": "232fa65e440054918c22c78cd461bfd77cb95e004887d5f12782ece4c0456f1f"
    },
    {
      "path": "crates/op-host-web/src/live_sync_json.rs",
      "before": null,
      "after": "48c9972420ba7c35b8296fd50370a1149fa52cb9db38b97fd71c907715794356"
    },
    {
      "path": "crates/op-host-web/src/managed_assets_sync.rs",
      "before": null,
      "after": "be75c4ef515e50a1b182bc71d0c1b7d221689a6cb9ad5c518c8c6d16409cabb2"
    },
    {
      "path": "crates/op-host-web/src/managed_assets_tests.rs",
      "before": null,
      "after": "6c4b117abd57d69b0c4f82f6ebd5a0072703c0f40cf140ed903049105d51795e"
    },
    {
      "path": "crates/op-host-web/src/theme_preset_io.rs",
      "before": "73655dea97a723901e71d75443573a3d6a49909ca679cd06ee981f6479d696e8",
      "after": "6f196afd0c35e9edb4acd10f85c81a8c10904ed7c8a5f04c7b9db77278840f18"
    },
    {
      "path": "crates/op-host-web/src/widget_host/chrome_menu_press.rs",
      "before": "d97cb4a2336b4d01a372c5527064f2d690fc673b563a9c39c7f4c43ca451f440",
      "after": "a8fd1f3b2b796090510ba7df5b1a3e9b08550ea1ae2cf02361e5bc1f9601e721"
    },
    {
      "path": "crates/op-host-web/src/widget_host/scene_template_press.rs",
      "before": "9cdadd1d0a5c0cba3e10236f9ae8a65155e994235d4f9f8e4c6e4f53b5c34ec4",
      "after": "a2f986a93b4640447b6e490badcbe7e510ad8140cc3fbb4d6dcefb876d56d5b8"
    },
    {
      "path": "crates/op-host-web/src/widget_host/variables_preset_press.rs",
      "before": "d4a5744541601e233e4ec4d8bc0c357bc81d4d6b03f8db6d262cf76e2102db76",
      "after": "2810cce8085ad3931cc6291def40bf62c0e66b87a734895006bb4ad495348e60"
    },
    {
      "path": "crates/op-mcp/src/design_md_tools.rs",
      "before": "126b2429e901f068b746cb18c2a1dd7e0875ecdaceac99db3237fa0fdf1d8f8a",
      "after": "0bb7d57703abdd86f9cefcff0b12cb49cbc770d0531569d2794efb1eb488b358"
    },
    {
      "path": "crates/op-mcp/src/style_guide_tools.rs",
      "before": "463b170b479b1c455c4b8992b9f85bd93f2c1866538de29547ac37e000a86ccd",
      "after": "046b6c7c0a3a95ce281b5b0ea716d7860ff538e0585ab6ac0aabef0f2ac1533d"
    },
    {
      "path": "docs/kb/product.md",
      "before": "ea56dec2b44ccf2b8725644477424de267541d2dd10985339e00d388da9f538e",
      "after": "72e914159c57b2b822ccfda74fdf4b0116f73357c81f0d8256e8a940c34e37d8"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "840b598f943a793b535c55004d94bf0882e39d87672feb5029557c052965f663",
      "after": "7fc26b78e1416d610cbdd6da300d51bca80a183642803830173a7688dcec32f5"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "cd23c7cf5ebb1c06add333c482688da31364c690df224d964d8b86b6d146948c",
      "after": "a89257da3ba3bdfd45ab8b446c9fb9af8833aec6f22c5f4641ee11fb0ab5eea0"
    },
    {
      "path": "packages/dsh-node-runtime/asset-browser.test.mjs",
      "before": null,
      "after": "7ec18bb7069fbc40edee28fbab0316904064a4a1424cf272d26999c993313e7b"
    },
    {
      "path": "packages/dsh-node-runtime/asset-routes.mjs",
      "before": null,
      "after": "a6c1341b93c5880675e9fdcc2880180270c4f6134f6ae23e9d3e6dcf161a7e96"
    },
    {
      "path": "packages/dsh-node-runtime/asset-store.mjs",
      "before": null,
      "after": "24d87013389c06c7044a243f98273a658cc5c55f97d7c98e82926d7333330e10"
    },
    {
      "path": "packages/dsh-node-runtime/asset-store.test.mjs",
      "before": null,
      "after": "bf776239aac3083d36a1defbd506b2931381b0f532219a2752ee529c5b9357fa"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.mjs",
      "before": null,
      "after": "fdf48f0240503792ceab96cc435ca018b9941be3adad8fce3220b3324ccc7c46"
    },
    {
      "path": "packages/dsh-node-runtime/asset-tools.test.mjs",
      "before": null,
      "after": "b4cbf8f6d0237d92da6248a49e6aea4fc5e7343feda46ce934d665d95869a9bf"
    },
    {
      "path": "packages/dsh-node-runtime/cli.mjs",
      "before": "c7be9d266e9d1029ab6ad85a4cd2750b97e4f684ee559fbb8892079d51ff9dd6",
      "after": "b634e82a390d0335af36d2b1e2309c88f50d6e60fb893a169b1d6288308860af"
    },
    {
      "path": "packages/dsh-node-runtime/document-history.mjs",
      "before": "f900eb962c7cb48695988969f29b83cab9d8a342c4a8444dc477ec546ef35551",
      "after": "cf024102e4a1039215d46aa7639b2d1613c1d7403a9bfd5c270d7f3583c0010c"
    },
    {
      "path": "packages/dsh-node-runtime/draft-recovery.test.mjs",
      "before": "27c978e2a621bb5492bd58769ac499b2a046f36f28ce46de8fba3e927dfb9b21",
      "after": "889ca40df9375ed6da7790b2149728186bac1e5b292736309efab228ca32c222"
    },
    {
      "path": "packages/dsh-node-runtime/editor-control.mjs",
      "before": null,
      "after": "8fb0da89f7e860384a4e3ff4f935446295dc0877ddbe93c403834d3cd50b0d09"
    },
    {
      "path": "packages/dsh-node-runtime/editor-control.test.mjs",
      "before": null,
      "after": "63308779734b8b3797b96ca1906153c94f5c1e9270c2c0b38e9905f6f758a28e"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.mjs",
      "before": "f12442945ba7090ecfd3f85515f674f08c20c7ef99cbf54ee621cc3dbe0cbfaf",
      "after": "37b6cd8fdde391b7b793377ee6ed6e25c29f26bcc94d00c9b0049f3e0d6d5f26"
    },
    {
      "path": "packages/dsh-node-runtime/host-http.mjs",
      "before": null,
      "after": "13733007e50b0a0f6337ef5bcc6836a64f0c14347625415c36a94a4fa8f3c607"
    },
    {
      "path": "packages/dsh-node-runtime/node-host.mjs",
      "before": "f1279d68dcee9dc4f17583063f5f9fbb76f330e2b30b18e9e787daf22771dbe1",
      "after": "1ebdd730a46bb6f7b47e3659cfd6aa9c057e990161303140a57bf5878dce8aa5"
    },
    {
      "path": "packages/dsh-node-runtime/node-host.test.mjs",
      "before": "9cd79eb9b0c219b0b87276b47b19e7d3c97bf599e13c167ed7568ae25ee39579",
      "after": "041bbe6caac6776fde2dabf5c1bf00e77a6c522086e60e0938a10af2d06b3384"
    },
    {
      "path": "packages/dsh-node-runtime/script-expansion.mjs",
      "before": null,
      "after": "e387dd9dae6c9f40ebf47abaaa9b4ce262845c5779eb12f2e6d20b7ff4017f2a"
    },
    {
      "path": "packages/dsh-node-runtime/script-prelude.mjs",
      "before": null,
      "after": "5903a23cfe2ee9fa6f95fe8b9505cdaa8a3353751a189bca1dd67b6e045452c9"
    },
    {
      "path": "packages/dsh-node-runtime/selection-enrichment.mjs",
      "before": null,
      "after": "67cb561430c9ca7521dccec5036e46135ff2daeb3e5255a50035b5d68ecbdc69"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "8b78bf77cec268cc1df996eb55ded2bc65899726f427a3177dec4b82030d2c72",
      "after": "71e53a2f689da3f7d4af1e8bc1f321564597126727db0d150ebaf6ca914270a7"
    }
  ]
}
```

Completed-At: 2026-11-08T01:47:47.381200+00:00

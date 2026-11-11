# Review and fix remaining regressions in the recent design lint, AI review guidance and staged runtime

Record-Version: 2
Task-ID: a755115e-29da-4574-9654-487d397498d8
Base-Ref: ac066191a325d12ba59fa54e338e19a6d64885e1
Started-At: 2026-11-11T05:13:26.935744+00:00
Type: fix-bug
Status: complete

## Context

Review the immediately preceding lint-triage change and its SS draft integration; preserve the already-dirty worktrees and use isolated test documents. Two independent read-only reviews and local repros identified fixes.

## Changes

- Preserve independent diagnostics when they share a node/property, including shader errors alongside contrast or empty-panel hints. Distinct peer-radius rules can compare different populations and therefore remain separately discoverable; automatic writes to the same property are still deduplicated. Read-only issue IDs encode their reason to distinguish multiple findings with the same category and value; clients holding an older advisory ID must re-lint when it becomes stale.
- Treat unpainted zero-width/height spacers and descendants of hidden nodes consistently with other nonvisual peers. Validate suggested-value shapes before reporting mechanical fix eligibility or checking edit locks.
- In SS draft finish, match legacy quality entries against same-version lint evidence so peer, nesting, empty-panel and subjective aesthetic advisories do not block visual review; keep independent quality and blocking lint findings. Continue pagination while visible quality entries remain unclassified, reject stale/repeated/missing cursors or inconsistent counts, and fail closed at a bounded page limit.
- Point the shared Synapse skill to the actual private-draft context tool and its `value.nextCursor`; retain the existing quality-inspection path. Update runtime knowledge and SS plugin documentation.

## Validation

- Confirmed red-to-green isolated regressions: `cargo test -p op-dsh-engine --lib advisory_peer_padding_does_not_hide_independent_edge_padding_fix`, `cargo test -p op-dsh-engine --lib null_suggestions_are_not_eligible_or_allowed_to_block_real_repairs`, and `cargo test -p op-design-lint semantic_peer_tests`. The first zero-size fixture initially failed to deserialize an invalid fill; a valid typed fill reproduced the actual spacer issue before the fix.
- Real source-WASM findings and the actual SS finish function reproduced peer/nesting advisory blockers. Isolated SS tests now cover nonblocking peer and nesting observations, a later blocking lint page, stale version, repeated cursor and missing continuation; real draft context pagination returned 50+10 findings and rejected a stale cursor.
- `cargo test -p op-design-lint` passed 264 unit and 14 parity tests; `cargo test -p op-design-lint -p op-editor-core -p op-dsh-engine -p op-mcp -p op-ai-skills --lib` passed 2454 tests with 1 ignored. `cargo test -p op-host-web --lib --features canvaskit` passed 788 with 29 ignored. `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets` passed; Clippy reported warnings.
- Rebuilt Node/WASM tests for padding and locked null suggestions passed. The SS finish tool against the rebuilt WASM detects a shader error despite a contrast hint. The original 62-report isolated document still replays to 9 advisory findings without mutation.
- `pnpm run doc-check` in Synapse Studio passed, including 46 documentation tests; plugin TypeScript and Skill quick validation passed. Plugin `npx eslint src --no-error-on-unmatched-pattern` reported no errors and 36 warnings. The maintenance gate with `--lint-js` passed with warnings.
- `vet` could not complete within its configured $0.01 cap (`DollarLimitExceeded`); it is not counted as a successful review. Two independent reviewers performed read-only reviews of the changed behavior.
- Further independent review reproduced a shader fault hidden by a contrast observation, independent padding and peer-radius diagnostics sharing a property, a later-page advisory misclassified during early exit, and a pagination scan forgetting a blocking finding on an earlier page. Red-to-green tests were added for all of these and for subjective slop and empty-panel hints. The historical TypeScript parity fixture remains unchanged; a Rust-specific golden explicitly tests the additional independent radius finding.
- An isolated `gpt-6.1-sol` run on the instrumented customer-management sample used the real tools and CanvasKit: it changed navigation node `n17` from 28 to 44, then re-linted, took screenshots and simulated prototype paths. The resulting lint count was 9 advisory nesting findings, down from 10. The model explicitly left keyboard, screen-reader, mobile, dark mode and real data behavior unverified; token observations were truncated. This single controlled run does not establish general model reliability.
- `bash packages/dsh-node-runtime/build-engine.sh` and `bash packages/dsh-node-runtime/build-web.sh` completed. The local runtime was staged in `plugins/ss-dsh-design/runtime` using `scripts/stage-local-runtime.mjs`, which preserved the previous runtime; the plugin build and isolated runtime smoke passed. Byte comparisons confirmed the staged skill, engine WASM and web WASM match the core build.
- `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 218 passed, no skips.
- In `plugins/ss-dsh-design`, `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=<staged-runtime> DSH_E2E_CHROME=1 node --test --test-concurrency=1 tests/*.test.mjs`: 508 passed, no skips, including actual-browser and staged-WASM draft tests.
- `tools/check-maintenance.sh --base ac066191a325d12ba59fa54e338e19a6d64885e1 --task a755115e-29da-4574-9654-487d397498d8 --lint-js` and `tools/knowledge.py check` passed. `git diff --check` passed in both worktrees.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Reviewed the private-draft lint route and shared design guidance against current implementation and tests",
      "sha256": "1566b026728adaac0671e8eb155209dddc5521036fad8c6fcea451c15e856302"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Reviewed distinct lint diagnostics, fix eligibility, pagination and issue identity against current runtime tests",
      "sha256": "0c10987fbffe8eee645ef7f4cae06a18395efff85bef672c040ba45480fa083c"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Peer detection remains heuristic; matching structure or role does not establish design intent. Lint-page scans are capped at 100 pages and refuse publication if complete evidence is unavailable. CanvasKit screenshots and model review do not prove accessibility compliance. Do not interpret deterministic tests as unrestricted model reliability. Existing unrelated worktree changes are retained.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "056135abe48514d2688d7999e23c78c743211a68c361f3642d286c01ce8bc81a",
      "after": "c035838b5a76abd2077a1f4facff94e316a525d282c7a522157086e803786c49"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "c20510e49d4208875f52390c5f5242bed61281726a35bb2c5d3a69f686713b6f",
      "after": "9fb6a6f24b858b4f438017d6e663bfe8dc8da62a7a182cb2f223f25b1fb3dd1e"
    },
    {
      "path": "crates/op-ai-skills/src/synapse_op_design.rs",
      "before": "6fd510e2e2d48640c3e8a06db4c8fe88fa9cf75e339bdee1b90d7f5eb1e89a1d",
      "after": "ce21882f800a7377433dc3a44069f14ec511f84a7e1adde51e34802f75e3ff3c"
    },
    {
      "path": "crates/op-design-lint/src/detectors/mod.rs",
      "before": "51e29a47cac4b3dc88f2c3b996a6cbe2e48409608c0c7462711fb1cdd8f6946d",
      "after": "64769694ed39917a0736d5df2ebf726b75a91d21f11939eea3a39edb851edf72"
    },
    {
      "path": "crates/op-design-lint/src/detectors/sibling_peers.rs",
      "before": "1b8629d81385f2be485ed9d3c1899e1106295fc81c5e7ea2b7969111a9b28fbc",
      "after": "d02106737287006a49229fb702b2f4301304bf63368bc0bc88dd14e239089253"
    },
    {
      "path": "crates/op-design-lint/src/detectors/siblings.rs",
      "before": "df7af922dda8202a6e38b044dc882e3ac7dbd93ff1cf3431686bade01a6e50eb",
      "after": "c7574aebeee045e55f29db8abdab8e33e3d1f69e6d8cb446178b61deab349262"
    },
    {
      "path": "crates/op-design-lint/src/detectors/siblings_tests.rs",
      "before": "ce85762f77154d2692d0d1f911472fa0d1523725c6874800af9c73f3f8128482",
      "after": "a3b733a883eab7b17414b25043c5d2243a9b96968196a2ee5b0d929d2f131ff3"
    },
    {
      "path": "crates/op-design-lint/src/issue.rs",
      "before": "f7c05e5674820bbd274045a6d6f5917ba8394d4f1f0dbf96dc9f2611715c7d40",
      "after": "000c50ec5f47d1bb2ebf46d155cc0189b9f106c9f3da959be551cdb36d5f0873"
    },
    {
      "path": "crates/op-design-lint/tests/fixtures/rust-golden/mixed-sibling.json",
      "before": null,
      "after": "6c90c8023a8ac00872a656bf812fde1aaf709b01e85fc2cb1120247be2fd60d6"
    },
    {
      "path": "crates/op-design-lint/tests/parity.rs",
      "before": "60584f73019e26a4656e02f4364f00375a6a9b69215ab4cef445861cc7de29a5",
      "after": "4786e8d0b3974c3bc7219fc2f332f7e4692f1a38fe85fdbdbfd84a9b2a261a95"
    },
    {
      "path": "crates/op-dsh-engine/src/lib_tests.rs",
      "before": "dfa472a4add3d3e4c549b3c2f4ccf3d7572c0ea123ae48a92eec3dce8da64f25",
      "after": "16ea6810f9e9f41ef85d5b42dc8c7e738cc38a8e40ad34a9c08a145ee6d67d40"
    },
    {
      "path": "crates/op-editor-core/src/design_lint.rs",
      "before": "cbce67814477f6b8dd891d1f2cde57c4ff415ba2bd2469163e8bdbaf8c2ee001",
      "after": "73e85617429abc1abc5750a5ab11e31f5cbcdca3a2a569a169c41457eb3e2bb0"
    },
    {
      "path": "docs/kb/product.md",
      "before": "6baf277de7d5e0ecebc8942c9d04d6b553d7b38392deff75653d658f218e8645",
      "after": "1566b026728adaac0671e8eb155209dddc5521036fad8c6fcea451c15e856302"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "f693d8e8d1717d975c670e64971cef72bbb060f007b3cca987b2f8b9526fbfbd",
      "after": "0c10987fbffe8eee645ef7f4cae06a18395efff85bef672c040ba45480fa083c"
    },
    {
      "path": "packages/dsh-node-runtime/design-tools.test.mjs",
      "before": "9ef4b18e87ff4b60c3d5e1b08954e2ef289d72feefd6fa94d03752b36addeeb7",
      "after": "0d94b121da0c600ab01a83d18e74e076fe37e1a3ef795140eec8378f8aa65a3c"
    }
  ]
}
```

Completed-At: 2026-11-11T06:18:35.508927+00:00

# Audit real-model lint findings and improve reusable AI review and repair capabilities

Record-Version: 2
Task-ID: 025c2134-f6fb-4ee5-bdfd-507949de6309
Base-Ref: ac066191a325d12ba59fa54e338e19a6d64885e1
Started-At: 2026-11-11T04:21:18.380268+00:00
Type: fix-bug
Status: complete

## Context

Inspect the remaining 62 lint findings in an isolated real-model customer-workspace sample and improve reusable AI review and repair rather than changing the sample to silence diagnostics.

## Changes

- Reviewed all 62 original findings against the generated node tree and CanvasKit capture: 22 spacer-height plus 22 spacer-radius reports and 9 avatar/field height comparisons were false positives; 9 deep table-header paths were advisory and their column wrappers have a layout purpose. No confirmed visual defect was established by these findings alone.
  - Spacer nodes (each produced both a height and radius warning): `n16,n32,n106,n122,n195,n211,n287,n303,n377,n393,n467,n483,n557,n573,n647,n663,n737,n753,n827,n843,n881,n897`.
  - Avatar/field comparisons: `n78,n167,n259,n349,n439,n529,n619,n709,n799`.
  - Advisory deep table-header text: `n56,n148,n237,n327,n417,n507,n597,n687,n777`; each needs contextual review, and depth alone proves neither a defect nor a safe deletion.
- Group probable peers by explicit role or structure, exclude nonvisual spacers, keep unlabelled differences advisory, and mark nesting as `__none` rather than a removal. Preserve distinct report-only categories.
- Expose `autoFixEligible`, prevent mechanical peer normalization, leave deliberate edits undoable, and avoid blocking eligible fixes for locked review-only candidates.
- Update the bundled skill, review guidance, MCP prompt and catalog to inspect paginated findings, semantics and real screenshots, repair confirmed defects and retest. Stage and build the local runtime in ss-dsh-design; its prior runtime is preserved.

## Validation

- Red regressions reproduced erroneous spacer/peer comparisons, deep-node removal advice, and a locked advisory blocking a real fix; subsequent relevant Rust tests pass.
- `cargo test -p op-design-lint -p op-editor-core -p op-dsh-engine -p op-mcp -p op-ai-skills --lib`: 2446 passed, 1 ignored. `cargo test -p op-host-web --lib --features canvaskit`: 788 passed, 29 ignored. `cargo clippy --workspace --all-targets` and `cargo fmt --all -- --check`: passed with existing warnings.
- `node /tmp/synapse-lint-triage-025c2134/replay.mjs`: original 62 became 9 advisory depth findings, with 53 removed, zero added and no document mutation. `node --test --test-name-pattern='WASM lint keeps peer variants' packages/dsh-node-runtime/design-tools.test.mjs`: passed.
- Isolated `gpt-6.1-sol` model audit: read lint and inspected CanvasKit captures of 11 screens, retained nine legitimate review candidates without changes. A second isolated copy seeded one navigation row at 28px versus its 44px peers; the model identified it, used a targeted edit, reran lint and captured the changed screen. Structural comparison found exactly that single 28-to-44 change. These tests do not establish universal model reliability.
- `python3 .../skill-creator/scripts/quick_validate.py crates/op-ai-skills/skills/synapse-design`: passed. Initial use of `.venv-lint/bin/python` failed because PyYAML was not installed there; system Python succeeded. `vet --max-spend 0.01` did not run the review: estimated request exceeded the budget (DollarLimitExceeded).
- `PATH=/Users/franklin/.cargo/bin:/opt/homebrew/bin:$PATH bash packages/dsh-node-runtime/build-engine.sh` and `build-web.sh`: passed. The first engine build without the Cargo bin in PATH failed at missing `wasm-bindgen`; the specified retry succeeded. `node scripts/test-node-runtime.mjs` from ss-dsh-design passed; skill, engine WASM and web WASM match the core build byte for byte.
- First full `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs` run: 213 passed and 3 failed because the old loop assumed unrelated form fields and a button were comparable and automatically normalized. The loop was updated to compare three same-role fields, assert the peer candidate is not auto-fixed, then explicitly correct it; the first replacement used `role:input` and failed because the production authoring pipeline promotes it to a native input. The `role:form-field` fixture avoids that unrelated promotion. `DSH_VERIFY_FINGERPRINT=1 DSH_E2E_CHROME=1 node --test --test-concurrency=1 packages/dsh-node-runtime/ai-design-loop.test.mjs` then passed 4/4, including CanvasKit. The full core rerun passed 216/216 with fingerprint verification and real Chrome enabled. `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=/Users/franklin/Desktop/dsh-workspace/synapse-studio-dsh/plugins/ss-dsh-design/runtime DSH_E2E_CHROME=1 node --test --test-concurrency=1 tests/*.test.mjs` from ss-dsh-design passed 497/497. `PATH=/Users/franklin/.bun/bin:/opt/homebrew/bin:$PATH bash tools/check-maintenance.sh --base ac066191a325d12ba59fa54e338e19a6d64885e1 --task 025c2134-f6fb-4ee5-bdfd-507949de6309 --lint-js` passed, with legacy JS warnings. `npx tsc -p tsconfig.json --noEmit` and final `node scripts/build.mjs` from ss-dsh-design passed; the build retains third-party declaration warnings. `git diff --check` and `.venv-lint/bin/python tools/knowledge.py check` passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Document context-aware lint triage in the Synapse design skill",
      "sha256": "6baf277de7d5e0ecebc8942c9d04d6b553d7b38392deff75653d658f218e8645"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Recheck runtime behavior and update evidence after the end-to-end lint loop contract change",
      "sha256": "f693d8e8d1717d975c670e64971cef72bbb060f007b3cca987b2f8b9526fbfbd"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Peer detection is heuristic: optional structural differences may suppress a useful suggestion, and role alone does not prove equivalence. `autoFixEligible` means eligible for a mechanical attempt, not proof a suggested change is appropriate. Screenshots and prototype simulation are not keyboard, screen-reader, responsive behavior or accessibility certification. Real-model acceptance is a limited sample, not a guarantee across models or designs. Existing uncommitted work in both repositories is retained.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "c33b0f0b3c304725ca9cecc7f7a2b69b51d6095c9d34f0187a2df7f3fdaf9ac6",
      "after": "056135abe48514d2688d7999e23c78c743211a68c361f3642d286c01ce8bc81a"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "2012c993e71682c766e538ca7b97957f367e6a723593bc3a042824181f802997",
      "after": "c20510e49d4208875f52390c5f5242bed61281726a35bb2c5d3a69f686713b6f"
    },
    {
      "path": "crates/op-design-lint/src/detectors/mod.rs",
      "before": "0b67faac435f8320c1de3f5491aa724d39b5629c5df001c9c3ac5df4f9ae8879",
      "after": "51e29a47cac4b3dc88f2c3b996a6cbe2e48409608c0c7462711fb1cdd8f6946d"
    },
    {
      "path": "crates/op-design-lint/src/detectors/sibling_peers.rs",
      "before": null,
      "after": "1b8629d81385f2be485ed9d3c1899e1106295fc81c5e7ea2b7969111a9b28fbc"
    },
    {
      "path": "crates/op-design-lint/src/detectors/siblings.rs",
      "before": "6bb789f42315543e0cd2007b4e6153827e55b12be3fe3a4cf2e1f24d81618397",
      "after": "df7af922dda8202a6e38b044dc882e3ac7dbd93ff1cf3431686bade01a6e50eb"
    },
    {
      "path": "crates/op-design-lint/src/detectors/siblings_tests.rs",
      "before": "c93cc39ebd91910dbb54ab59513f9e2b702841b114f29db718ae4b0f51f9bc61",
      "after": "ce85762f77154d2692d0d1f911472fa0d1523725c6874800af9c73f3f8128482"
    },
    {
      "path": "crates/op-design-lint/src/detectors/structural_quality.rs",
      "before": "79b73f0430aad04e757c45ac92a9d3631376df60102f403b95bada151dcef3e8",
      "after": "a97d94a9d3c21b020cddb5c8787d5c88b29df798987b469e2e9370ac0811fc32"
    },
    {
      "path": "crates/op-design-lint/src/fixes.rs",
      "before": "2302791a68e40042ea4be5b98f1a76411ee7602d004a6beeb38260607a17d9dc",
      "after": "8b5c907f30334a2e08bc14c32e078d01152068029923f78c7f4e331c7cb0649e"
    },
    {
      "path": "crates/op-design-lint/src/issue.rs",
      "before": "5207b6cbc220ac5bc3f69305f7eecf8a3adc9dade37a1847e43e92a7c6bd3149",
      "after": "f7c05e5674820bbd274045a6d6f5917ba8394d4f1f0dbf96dc9f2611715c7d40"
    },
    {
      "path": "crates/op-design-lint/src/plan.rs",
      "before": "6f31dcddf2e3325f21761b1b0b004d13635816d497ae77e4487a66914bce65c4",
      "after": "20e08721244d61653739e53524067585d1624b1fb808c81b0057c7c78e8816ba"
    },
    {
      "path": "crates/op-dsh-engine/src/lib_tests.rs",
      "before": "f1a0c9e5c83e9087d5a45eaea54bb1d9cef0f2807e6c5c0cd3947bb0cfc6dca8",
      "after": "dfa472a4add3d3e4c549b3c2f4ccf3d7572c0ea123ae48a92eec3dce8da64f25"
    },
    {
      "path": "crates/op-dsh-engine/src/tool_catalog.rs",
      "before": "288c16701c55c0caca5778856069e5202917cb1193fec2e2638bbb03ff92b7e1",
      "after": "2453cce3b0c9f8c336fd92bc6397f2653272e2ae21c76b528063ab4a6e033785"
    },
    {
      "path": "crates/op-editor-core/src/design_lint.rs",
      "before": "17b4219760ad7f00ea6b7a5eb62a5d8f1054c7135226e4a1ffff27432364253e",
      "after": "cbce67814477f6b8dd891d1f2cde57c4ff415ba2bd2469163e8bdbaf8c2ee001"
    },
    {
      "path": "crates/op-editor-core/src/design_lint_tests.rs",
      "before": "6d35a0e5d048fb06a4d6aaab831bb1acf2706882fbf92db89c850ed9fe4187ba",
      "after": "0e3c7a2b4d50a1e954610d89aa5e1a59a200726633a57f68aff092542de0f8f2"
    },
    {
      "path": "crates/op-mcp/src/design_prompt.rs",
      "before": "d47052bb76b201ec7b6485d63bc3fc6056e35e9c6fe692cd46eabed8cb81f833",
      "after": "57e243ea954138029144be9d356a78d5875c95f83466d30c2907a9e4b9034c59"
    },
    {
      "path": "crates/op-mcp/src/lint_tools.rs",
      "before": "c14fb72bb43f9582a4e6e9ff3aa31221928df93bd965a30ae76e547e224fe8d6",
      "after": "64021f8f9e51105e71f76b4f1ed68973673c493af9681e25ff6f96d21ce05a55"
    },
    {
      "path": "docs/kb/product.md",
      "before": "631fd9f6f66c1781691c78af2d96d93f6be88fbb37873b7cac4b5f269837c18a",
      "after": "6baf277de7d5e0ecebc8942c9d04d6b553d7b38392deff75653d658f218e8645"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "577e5b90e5b7078fa169e3d7b91a03dd705c8a2d7d7b5a882c2d2b017c0d30b6",
      "after": "f693d8e8d1717d975c670e64971cef72bbb060f007b3cca987b2f8b9526fbfbd"
    },
    {
      "path": "packages/dsh-node-runtime/ai-design-loop.test.mjs",
      "before": "b9944ccecf2f390a273931a476bd6a32b36df3e25c8061038a09f7a31692cb1e",
      "after": "036abb2cb44f0734fd800c67a76e06350bc903366ead9cacc1e254b375f96233"
    },
    {
      "path": "packages/dsh-node-runtime/design-tools.test.mjs",
      "before": "e9e25d0d6b08b66006542a9d760b07526e9518076f577a29455f10a87acd3180",
      "after": "9ef4b18e87ff4b60c3d5e1b08954e2ef289d72feefd6fa94d03752b36addeeb7"
    }
  ]
}
```

Completed-At: 2026-11-11T05:10:58.233294+00:00

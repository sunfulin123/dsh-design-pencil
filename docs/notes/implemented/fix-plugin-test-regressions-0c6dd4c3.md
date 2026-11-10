# Investigate and fix the 23 ss-dsh-design test failures, rerun checks, and rebuild the staged runtime.

Record-Version: 2
Task-ID: 0c6dd4c3-f1ac-406c-ad30-23291f2081f4
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T11:21:24.373480+00:00
Type: fix-bug
Status: complete

## Context

Investigate and fix the 23 ss-dsh-design test failures, rerun checks, and rebuild the staged runtime.

## Changes

- Investigated the original 23 failures. Two image preview cases were actual delayed-image regressions; the platform fixture lacked the now-required explicit route; three old commerce template cases, seven plugin-owned quality/repair cases, four old visual-review cases, five retired app-agent cases and one deleted quality-module import described superseded contracts. Replaced those checks with current contract tests instead of restoring hard-coded design prompts or deleting quality gates.
- Reinstated touch-target inspection in the core quality tool using resolved editor layout; suggested padding repairs preserve fit-content sizing and are verified with direct/script writes and undo. Exact update payloads are no longer snapped by the Node script or direct-update adapters. The editor layout adapter currently ignores min-size fields, including on responsive-marked documents; this task does not silently change that global layout behavior.
- The plugin attempts image enrichment before changed-batch previews, reports failures and unresolved images, and detects concurrent changes. Finish indicates truncated native diagnostics and continues to block publication when findings remain.
- Extracted the existing core quality implementation to a focused sibling to respect the effective-line cap; ratcheted the shrinking baseline. Updated the separate ss-dsh-design test harness and packaged the local runtime there without changing the user's active host or business data.

## Validation

- Baseline: plugin suite before fixes had 456 tests: 433 passed and 23 failed. Real engine reproduction initially found a 17px fit-content target missed by quality inspection; another reproduced exact padding 18 being written as 16 by Node normalization.
- In the plugin checkout: `PATH=/opt/homebrew/bin:$PATH DSHPLUGIN_DESIGN_SOURCE_RUNTIME=/Users/franklin/Desktop/dsh-workspace/dsh-design-pencil/packages/dsh-node-runtime node --test --test-concurrency=1 --test-reporter=spec tests/*.test.mjs`: 462 passed, 0 failed, 0 skipped. The separate rebuilt/staged runtime `node --test --test-reporter=spec tests/pattern-audit-regressions.test.mjs`: 3 passed, including readback, both command paths and undo.
- `PATH=/opt/homebrew/bin:$PATH node --test --test-concurrency=1 packages/dsh-node-runtime/*.test.mjs`: 186 passed, 0 failed, 8 skipped browser-opt-in cases. The first run found the pre-existing snap-on-update expectation, which was updated to verify exact edits while retaining new-node normalization.
- `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/ai-design-loop.test.mjs`: 3 passed, including a real headless CanvasKit render, lint, correction and recapture. This is a scripted tool loop, not a real model autonomy evaluation.
- `cargo test -p op-dsh-engine --lib`: 72 passed; `cargo test -p op-host-web --lib --features canvaskit`: 781 passed, 29 ignored. `cargo fmt --all -- --check` and `cargo clippy --workspace --all-targets` passed; existing warnings remained visible.
- `PYTHON=.venv-lint/bin/python bash tools/check-file-line-cap.sh --ratchet` passed after moving quality code out of the oversized file. Plugin `npm run typecheck` passed.
- `bash packages/dsh-node-runtime/build-engine.sh`, plugin `node scripts/stage-local-runtime.mjs /Users/franklin/Desktop/dsh-workspace/dsh-design-pencil`, `node scripts/build.mjs`, and `npm run test:runtime` passed. The staged engine WASM hash matches the built source. The existing web bundle was reused because this fix did not change the web renderer.
- `vet` was attempted on the relevant logical changes with `--model gpt-4.1-mini --max-spend 0.01`; it could not execute because the full pre-existing dirty diff exceeded that cap (`DollarLimitExceeded`). No paid limit was raised.
- `PYTHON=.venv-lint/bin/python bash tools/check-maintenance.sh --base 6644990089bc122113f967a3dbabf5cf6d41665d --task 0c6dd4c3-f1ac-406c-ad30-23291f2081f4` passed; both repositories' `git diff --check` passed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/html-import.md",
      "action": "unchanged",
      "reason": "The engine entry file now delegates quality inspection to a sibling module; HTML import and authored-geometry dispatch remain unchanged.",
      "sha256": "23e16b739082b9164d9d1013d5f5d03c1b91b663a9720d7f9bb7d73c2fd98ce1"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document measured navigation-target diagnostics, effective padding repairs, the editor min-size limitation, and exact node-update semantics.",
      "sha256": "f5455e4a1e777051a37535cc3d448b37bbe21fc1fe0117e8b39868c196aca38d"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

- An actual autonomous model task and the user's running DSH app were not launched; the user will start and assess the packaged build. The CanvasKit validation above exercises actual rendering with scripted calls, not autonomous judgment.
- The editor adapter does not currently honor `minWidth` / `minHeight`; the implemented touch-target guidance uses measurable padding or available space rather than claiming those properties fixed the screen. Continue to verify layout after a suggested repair.
- A failed image enrichment keeps the already-committed design and reports an incomplete preview. Network availability and image provider quality were not evaluated.
- Eight unrelated default Node browser tests and 29 existing ignored CanvasKit host tests were not executed. Existing user changes in both repositories and the previous staged runtime backup remain untouched.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-dsh-engine/src/lib.rs",
      "before": "3dc470d55eb78accf2c1faf3e70d5e023a9205fd56deae17b63bf94544b2541a",
      "after": "514f850d4811514dcc6ffa09fc9990d4f2b30e8345ee2f3fce9a338f4f277591"
    },
    {
      "path": "crates/op-dsh-engine/src/lib_tests.rs",
      "before": "658462936e5264aaf744de50acc381266c0e1baf76d061c62492aa961562a592",
      "after": "a9d4f2fac385fccf13c53a0d7bd43e0fd2075cfb96e982942c5b8632271b09b8"
    },
    {
      "path": "crates/op-dsh-engine/src/quality_tools.rs",
      "before": null,
      "after": "1eaaad9b07a60390100747ea5bf626af61191b5ab63e4de2bb85c191d04fafce"
    },
    {
      "path": "crates/op-dsh-engine/src/touch_target_quality.rs",
      "before": null,
      "after": "0056a49ff93de654c5848f5448b78109bda2b9be485176ace9e3adeaad440cbd"
    },
    {
      "path": "docs/kb/html-import.md",
      "before": "794212135adf9debeaa6b9d81a32173bdefa824de963bdbf73493e1543d709d0",
      "after": "23e16b739082b9164d9d1013d5f5d03c1b91b663a9720d7f9bb7d73c2fd98ce1"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "0cdec1ef63b164d2d2aa522723db98823bf4018ae8a29328f2345cf374a25219",
      "after": "f5455e4a1e777051a37535cc3d448b37bbe21fc1fe0117e8b39868c196aca38d"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.mjs",
      "before": "7bc9e67523c821b8d72aabcf004be3fb9d0f2b0e5fefcdbcf34265ef3b50dc4c",
      "after": "aba6edd0d9a44f8a642fe7eae2ed08f4e070df1b7a56c976ea7154380387c213"
    },
    {
      "path": "packages/dsh-node-runtime/engine-session.test.mjs",
      "before": "538f39258bf0867b9cb1f7c4184c319187991bcd271e4e1e01546e805b131431",
      "after": "87a08cc50fd26b6798b275ae9477e10bc2333b227c5135a7a0d8b657030387a7"
    },
    {
      "path": "packages/dsh-node-runtime/script-prelude.mjs",
      "before": "5903a23cfe2ee9fa6f95fe8b9505cdaa8a3353751a189bca1dd67b6e045452c9",
      "after": "b0ed377de4e8192325aeac120e5f75d918cec4198e305e0900a7eb4817c0ead2"
    },
    {
      "path": "tools/code-line-baseline.json",
      "before": "7b7bd27b16ac9f7c6db03145a6002844e0df3385cc9cfde9eb7864fffa178b2c",
      "after": "0a0b36d25b56a84b18c4700c65b540e2c24abb9d8fdac2b6bb179088c367369b"
    }
  ]
}
```

Completed-At: 2026-11-10T12:01:18.592641+00:00

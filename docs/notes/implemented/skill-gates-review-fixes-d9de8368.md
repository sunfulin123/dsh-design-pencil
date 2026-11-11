# Fix review findings across Synapse design skills, eval scorer, POC evidence symlink/ledger checks, checkpoint validation, hydration keys, and finish review gates

Record-Version: 2
Task-ID: d9de8368-af45-4e21-9406-3a610b3ec0fe
Base-Ref: 78a7605ba46e417c49240629dcc9d36410c970f0
Started-At: 2026-11-11T08:53:58.715387+00:00
Type: fix-bug
Status: complete

## Context

Performed a full adversarial code review across all core and `ss-dsh-design` changes from the Synapse design guidance and stage-gate implementation, then fixed every confirmed defect, edge-case bypass, hydration mismatch, and documentation gap while preserving existing uncommitted worktree state.

## Changes

- Aligned `crates/op-ai-skills/skills/synapse-design/review.md` (`op-design-review`) with the five structured rubric dimensions (`task_integrity`, `structure_overflow`, `hierarchy_density`, `style_consistency`, `content_states`) and the `synapse_design_pipeline_finish` `review` receipt contract, and clarified initial `"pending"` (`GATE: OPEN`) vs. `"pass"` (`GATE: PASS`) ledger transitions and task-directory source fingerprinting in `crates/op-ai-skills/skills/synapse-design-html/SKILL.md`.
- Hardened `scripts/eval-synapse-design.mjs` (and `packages/dsh-node-runtime/eval-synapse-design.test.mjs`) to guard repeated lint cursors and non-advancing `touchTargetsNextOffset` up to 500 pages, require distinct non-empty container `frame`/`group` nodes per planned screen, require container `nodeId`s on mapped POC screens, and validate CLI artifact inputs.
- Fixed `plugins/ss-dsh-design` review findings:
  - **POC symlink & macOS `realpath` handling (`design-poc-evidence.ts`)**: rejected symbolic links inside `.synapse/html-design/tasks/<taskId>`, normalized `realpath` vs. lexical `/var/folders` <-> `/private/var/folders` paths before sandbox containment and hash-map lookup, and verified `targetViewports` against captured PNG `renderedEvidence` hashes in `evidence-report.json`.
  - **Finish review & recovery state machine (`design-draft-finish-review.ts`, `design-draft-finish.ts`, `design-draft-support.ts`, `design-draft-finish-publish.ts`)**: required each built screen to map to a distinct non-empty `frame`/`group` container `nodeId`, required POC screens to carry either a valid container `nodeId` + `pocScreenshot` + `differences` or a disclosed `omittedReason`, bound cached `verifiedReview` reuse to `screenshotSha256`, and scoped the 3-strike `blocked_review_limit` lock to the current user turn (`reviewBlockedUserCount`) without setting `terminalFailure`, so subsequent `batch` edits or follow-up user turns are never permanently bricked.
  - **Funnel, one-shot gate, checkpoint recovery & hydration (`design-funnel.ts`, `design-draft-tools.ts`, `design-task-checkpoint.ts`, `design-draft-resume.ts`, `presentation-hydration-parsers.ts`, `presentation-hydration-pipeline.ts`)**: allowed empty `screens: []` while `openQuestions` remain open, enforced ready funnel + non-HTML route in `claimOneShotDiscovery`, validated `plannedScreens` and `pocScreens` when loading checkpoints from disk, returned `checklist` on `resumeOwnedDraft`, and added `imageEnrichmentUnavailable` / `unresolvedImage*` / validated `remainingScreens` / validated `omittedScreens` / `screenshotSha256` / `reviewContract` to the Code Mode hydration parsers.

## Validation

- `cargo fmt --all -- --check`, `cargo clippy --workspace --all-targets`, and `cargo test -p op-ai-skills -p op-mcp -p op-dsh-engine --lib`: all passed (`op-ai-skills` 218, `op-dsh-engine` 92, `op-mcp` 544).
- `bash packages/dsh-node-runtime/build-engine.sh` and `node --test packages/dsh-node-runtime/eval-synapse-design.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs packages/dsh-node-runtime/asset-tools.test.mjs packages/dsh-node-runtime/package.test.mjs`: 24 passed, 0 failed.
- Restaged local runtime into `plugins/ss-dsh-design/runtime` (`scripts/stage-local-runtime.mjs`); `eslint src --no-error-on-unmatched-pattern --quiet` passed with 0 errors; `tsc -p tsconfig.json --noEmit`, `tsc -p tsconfig.client.json --noEmit`, `node scripts/build.mjs`, and `node scripts/docs/doc-check.mjs` passed.
- `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=<staged-runtime> DSH_E2E_CHROME=1 node --test --test-concurrency=1 tests/*.test.mjs`: 513 passed, 0 failed, 0 skipped (including new symlink escape, macOS realpath ledger, duplicate screen `nodeId`, hydration, and same-turn lock + batch recovery regressions).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Aligned op-design-review rubric, HTML Stage D ledger workflow, POC symlink/renderedEvidence checks, and distinct screen container review gate",
      "sha256": "81391b4f5f85c8bef46bf465209dd3f17995a09605e12858a0ef9b252a008688"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "Verified runtime MCP and eval scorer hardening preserve documented runtime-mcp invariants",
      "sha256": "5b089d8dd2d0dc1136f5d89618b15cee8733972dd2f9f6c6ca6b74d76169c8a9"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Live model evaluation runs and interactive desktop verification still require live LLM credentials and launching the local DSH app. Existing unrelated worktree changes in both repositories remain untouched and uncommitted.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "c74f36cf8aecab4b41d97a9ba371a8456e6c07b0762e795e6f897bb3a97c93bc",
      "after": "4f0902796d17da331e6c542408c185f1b7fb1c9e89f471c748a480b624547ff1"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/review.md",
      "before": "9fb6a6f24b858b4f438017d6e663bfe8dc8da62a7a182cb2f223f25b1fb3dd1e",
      "after": "ea499d466143fd6a27b9647aaaae5f902806e7db98111270c9844960cc3f6046"
    },
    {
      "path": "docs/kb/product.md",
      "before": "d75e8991ae20306363e557351d62585541fede8bad13c81b47d897c3a994aaf3",
      "after": "81391b4f5f85c8bef46bf465209dd3f17995a09605e12858a0ef9b252a008688"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "3d9dacfce2e48f38e1d003e0599ebb4bc3c87bf951e24efe9abbb86c31316ec5",
      "after": "5b089d8dd2d0dc1136f5d89618b15cee8733972dd2f9f6c6ca6b74d76169c8a9"
    },
    {
      "path": "packages/dsh-node-runtime/eval-synapse-design.test.mjs",
      "before": "f513cb2bf9c47a4818ae5b903ae3f369176881f88f5cdf9eeab5c5f79ca0acfd",
      "after": "c7ad8ede29dbc5703c756c3067931a85d7571b39792f54ebf834b3c5e00164c7"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "c74f36cf8aecab4b41d97a9ba371a8456e6c07b0762e795e6f897bb3a97c93bc",
      "after": "4f0902796d17da331e6c542408c185f1b7fb1c9e89f471c748a480b624547ff1"
    },
    {
      "path": "scripts/eval-synapse-design.mjs",
      "before": "b14d6724f5ec4a56d9141d994a83a278e66ff1fad051f3f398eaa8b2aa3a424d",
      "after": "d115a24ef8f273ba2eae97c427e5ee8b604daa030ed4559e8cbe5d77554845e7"
    }
  ]
}
```

Completed-At: 2026-11-11T09:28:23.053072+00:00

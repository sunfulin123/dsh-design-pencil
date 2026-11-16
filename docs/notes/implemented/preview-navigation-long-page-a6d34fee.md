# Fix atomic Browser Use navigation and add bounded long-page review while preserving managed dev-server and Talkdesk Preview flows.

Record-Version: 2
Task-ID: a6d34fee-b76d-46f1-9813-b769a503f3c1
Base-Ref: 46a832cac2538627627adf81999348709176c5e3
Started-At: 2026-11-16T03:56:25.725885+00:00
Type: fix-bug
Status: complete

## Context

Fix atomic Browser Use navigation and add bounded long-page review while preserving managed dev-server and Talkdesk Preview flows.

## Changes

Added committed-navigation recovery and bounded long-content instructions to the HTML Skill and Cobalt companion. The guidance keeps direct local URLs independent of Preview configuration, preserves configured managed/Talkdesk launch behavior, and requires overlapping viewport checks for nested and virtual content. Added executable guidance regressions and rebuilt/staged the engine runtime into SS. The SS desktop implementation waits for admitted guests, confirms committed URLs, exposes scroll geometry, captures bounded root-document originals, and restores DOM guest availability after service-stop cleanup.

## Validation

- Passed: `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-browser-guidance.test.mjs packages/dsh-node-runtime/poc-startup-guidance.test.mjs packages/dsh-node-runtime/poc-review-workflow.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs` (23 tests).
- Passed: `PATH="/Users/franklin/.cargo/bin:$PATH" bash packages/dsh-node-runtime/build-engine.sh`; the initial default PATH lacked installed wasm-bindgen, so the documented Cargo tool directory was added. The existing op-figma dead-code warning remains visible.
- Passed: SS `pnpm build`, `pnpm check:package`, focused Browser Use / managed-service suites (730 tests), DOM service-stop regression plus stop/slot tests (49 tests), and documentation checks. New regressions failed before their fixes.
- Passed in real Electron: workspace HTML navigation and original PNG/hash retrieval; redirects, nested/root/container scrolling, lazy and virtual content, cookie retention, capture bounds and failed-connection recovery; Talkdesk hosts admission/revocation and manifest/iframe inspection. The six-scenario Electron run passed, including gated managed startup/reuse/restart/stop and Session cancellation. The additional real Vite installation-hook/HMR/multiple-owner scenario passed. The distinct Talkdesk proxy scenario passed: Atlas was already listening while upstream startup remained gated, then the login redirect opened only after the upstream was ready. The native Atlas popup/fullscreen/opener-restoration scenario passed. These use disposable local fixtures; real account SSO and a production Talkdesk backend were not exercised.
- Passed: SS `pnpm --filter synapse-studio typecheck`, `pnpm --filter @synapse-studio/ss-dsh-preview typecheck`, `pnpm --filter @synapse-studio/ss-dsh-browser-use-tool typecheck`, `pnpm run test:e2e:typecheck`, changed-source ESLint (one existing no-console warning), `pnpm check:plugin-portability`, `pnpm check:plugin-english`, `node --test plugins/ss-dsh-design/tests/poc-review-workflow.test.mjs`, and `git diff --check`.
- Passed: SS `pnpm exec playwright test --config playwright.preview-browser-use.config.ts --grep 'Browser Use opens and inspects workspace HTML|Browser Use confirms direct navigation|Preview launch starts the sole service|Browser Use propagates Session cancellation|accepts a hosts-backed Talkdesk URL|inspects an unattached page in the shared Preview'` (6 scenarios).
- Passed: SS `pnpm exec playwright test --config playwright.preview-browser-use.config.ts --grep 'Browser Use opens and inspects workspace HTML|Managed Vite keeps hot updates|Talkdesk launch waits'` (3 scenarios), plus the Vite scenario again after adding the installation hook (1 scenario).
- Passed: SS `pnpm exec playwright test --config playwright.atlas-login.config.ts` (1 native scenario); focused exact-admission URL regressions (50 surface tests); agentic vet review for navigation, full-page capture, service-stop visibility and exact admission URL scope (no issues reported).
- Passed: `bash tools/check-maintenance.sh --base 46a832cac2538627627adf81999348709176c5e3 --task a6d34fee-b76d-46f1-9813-b769a503f3c1` and task check. The first maintenance run correctly rejected the unfinished note and stale knowledge receipts; both were filled from checked source and the gate then passed.
- Resolved acceptance blockers: missing FFmpeg paused Playwright page initialization; Dock guests required owner-first cleanup; service-stop reset needed native DOM visibility restoration. An intermediate test overlapped runtime packaging and stopped before scenarios at Companion availability; final Electron runs used completed builds. Markdown-rendered echoes were unsuitable for escaped snapshot JSON, so regression assertions read the persisted verbatim model echo instead.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Record committed-address review and bounded viewport coverage without changing static handoff.",
      "sha256": "3796fb0016753d12ebc93409d223459feafef87fede74ea49b900b7617f9e528"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Describe root-only fullPage capture and explicit nested scrolling while preserving managed Preview and headless fallback.",
      "sha256": "ddf4f59bf3d9ccfde990bcc25e24610f0e07b7b0617c15a1ff988a3c987e6e43"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Navigation recovery and long-page coverage retain manual acceptance, static delivery and source-maintenance gates.",
      "sha256": "ce548812308565942dc7cfaff4a187c60f607642c0c1a09e63b522ac2c08fa32"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Full-page capture covers only loaded root-document content, with 32 million physical pixels, a 32768px edge and 20 MiB PNG bounds. Nested, lazy and virtual content still requires explicit viewport coverage; a per-target 20-screen limit must be reported as incomplete. Running desktops must load rebuilt native code; staging a plugin cannot hot-patch Electron. User servers, login state and prior dirty changes are preserved. No commit or push.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "4971830011b109b0098945bc039c628f624d3116ddfb9b04baa5e1e9cf440150",
      "after": "ef0946ab3e241dd7174fa5d023defdb339e701fd2466c2f1d5d53ac8e26b8234"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "f87dec666a0965536d0bd3c58acf80578c892e682497ae7e6cce1b354a70cc17",
      "after": "38a97b20b9e6a6e2842c8be71f2f4af4aad5792e5e5db8b5f610204a825cbdde"
    },
    {
      "path": "docs/kb/product.md",
      "before": "59cc2a652bb01895fb3afc60499a3b3afe95e2bf89e1d04008e5bf5674f54099",
      "after": "3796fb0016753d12ebc93409d223459feafef87fede74ea49b900b7617f9e528"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "353fdc6b4124763133f72cd50c4253159277b235c08759e599ef73b047af3b0c",
      "after": "ddf4f59bf3d9ccfde990bcc25e24610f0e07b7b0617c15a1ff988a3c987e6e43"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "1c4fbf21abb6dc39d1495e391380b3a9ff8fbc5928b775ac703b68bc03fe8235",
      "after": "ce548812308565942dc7cfaff4a187c60f607642c0c1a09e63b522ac2c08fa32"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "92012c92415b96d10026c96efaf3e7e2a43619c2ea2e65841a6814ce1979fd97",
      "after": "beb00ca271fe0d43bfde04a35f41adcc286cf8181587db8194940d5962444e75"
    },
    {
      "path": "packages/dsh-node-runtime/poc-browser-guidance.test.mjs",
      "before": "b237f4157edd6f17b9ec0a00a9093ff5ed4c81efff49e527b098771c4e882445",
      "after": "16f7b00f41a3a2f83a6e70c8315acf123de6555e70f8f3f41c623a6a069ada74"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "4971830011b109b0098945bc039c628f624d3116ddfb9b04baa5e1e9cf440150",
      "after": "ef0946ab3e241dd7174fa5d023defdb339e701fd2466c2f1d5d53ac8e26b8234"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "7b44b31699e3a1ac7db528a5d6dad752f53f482598f4bbfff18427606d58fb4d",
      "after": "e986269a8fc1fe2a6b49a401f099113191957881b1fb3b0e66876605ec86ea76"
    }
  ]
}
```

Completed-At: 2026-11-16T05:03:14.293369+00:00

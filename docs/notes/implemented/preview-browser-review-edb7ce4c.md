# Prefer visible Browser Use for POC development checks, add explicit high-resolution acceptance screenshots, retain headless fallback and static evidence boundaries.

Record-Version: 2
Task-ID: edb7ce4c-c990-4022-8f96-7ecefcac22ea
Base-Ref: 46a832cac2538627627adf81999348709176c5e3
Started-At: 2026-11-16T02:45:55.173393+00:00
Type: feature
Status: complete

## Context

Prefer visible Browser Use for POC development checks, add explicit high-resolution acceptance screenshots, retain headless fallback and static evidence boundaries.

## Changes

POC guidance now prefers visible Browser Use after Agent-owned server startup. The main/HTML Skills, Cobalt companion, scaffold continuation and owner documents name the actual local URL, observed refs/framePath and the existing headless fallback. Formal static handoff and evidence validators are unchanged; an image attachment cannot replace the frozen full-viewport/DOM manifest.

SS Browser Use adds optional `quality: "original"` to its existing screenshot tool. Electron captures the whole current viewport at an existing native resolution without resizing or target cropping. The receipt separates PNG pixels from CSS viewport size. The Host validates dimensions, bytes and SHA-256 and stores a verbatim file in addition to the normalized display image. Default preview behavior remains capped at 1280px. The original limit is 20 MiB; unsupported backends/storage fail explicitly. No new tool family, service, Preview JSON requirement or arbitrary browser evaluation is introduced.

Rebuilt and staged the source runtime into the current SS worktree; packaged Skills and compiled WASM prompts contain the new guidance.

## Validation

- Passed: `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-browser-guidance.test.mjs packages/dsh-node-runtime/poc-startup-guidance.test.mjs packages/dsh-node-runtime/poc-review-workflow.test.mjs packages/dsh-node-runtime/html-skill-migration.test.mjs` (23 tests). Red/green source guidance regression passed after the original preference was changed; 23 source startup/review/migration tests passed with Chromium enabled.
- Engine build and local SS runtime staging passed. Packaged prompt regression confirms Browser Use guidance and original PNG policy.
- Passed: `pnpm exec vitest run plugins/ss-dsh-browser-use-tool/test` (61 tests), `pnpm --filter synapse-studio exec vitest run test/browser/agent-pointer-screenshot.test.ts test/browser/agent-screenshot-labels.test.ts test/browser/agent-scoped-lease.test.ts` (18 tests), `pnpm --filter synapse-studio typecheck`, plugin typecheck, focused ESLint, `pnpm test:e2e:typecheck`, `pnpm doc-check`, `pnpm check:plugin-portability`, `pnpm check:env-prefix`, `pnpm check:package` and plugin/desktop builds. SS focused Browser Use tests (60 before the additional file-integrity rejection, then 10 focused tests including it) and 18 native capture/label/lease tests passed. Typechecks, focused ESLint, portability, environment policy, documentation, desktop build and package check passed.
- Real Electron native smoke: a 1600x900 viewport produced a 1280x720 default preview and a 1600x900 original PNG; encoded dimensions and SHA-256 matched. The raw-file path also passed the real DSH ToolRuntime/native tool executor integration test.
- Failed: `pnpm exec playwright test --config playwright.preview-browser-use.config.ts --grep "Browser Use opens and inspects workspace HTML"`, attempted twice; both timed out during shared fixture startup before the scenario entered. Protocol logging localized the wait to page.emulateMedia after the first window, before Browser Use screenshot dispatch. This is unresolved acceptance coverage, not a passing test.
- Read-only agentic vet reported no issues. Source maintenance and task closure are recorded below after running the gate.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "Prefer visible Browser Use development review while retaining static evidence handoff.",
      "sha256": "59cc2a652bb01895fb3afc60499a3b3afe95e2bf89e1d04008e5bf5674f54099"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Document original PNG vs display image, CSS viewport vs pixel dimensions, headless fallback and no action replay.",
      "sha256": "353fdc6b4124763133f72cd50c4253159277b235c08759e599ef73b047af3b0c"
    },
    {
      "path": "docs/kb/standards.md",
      "action": "unchanged",
      "reason": "Browser preference and optional original captures do not alter static handoff, manual acceptance or maintenance gates.",
      "sha256": "1c4fbf21abb6dc39d1495e391380b3a9ff8fbc5928b775ac703b68bc03fe8235"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

Original screenshots preserve the current viewport; they neither resize it nor provide device emulation. Display images remain subject to Harness normalization. Existing headless scripts and formal capture manifests remain required where visible tools cannot provide exact viewport, DOM or static evidence. The installed/running desktop needs the rebuilt Electron owner to load this capability; source staging does not hot-patch an existing app. Full SS launch acceptance remains blocked as recorded above. No commit or push is included in this follow-up.

## Changed files

```json
{
  "files": [
    {
      "path": "ARCHITECTURE.md",
      "before": "213184eec054dea86e808399744ada72e985c5ed875ff41248b4fc2c5c6d2b6c",
      "after": "1d44414fabc3d7c3cc0c1938f43862b8bbe9f820db65f029fbd215e783b73c7e"
    },
    {
      "path": "COMMANDS.md",
      "before": "38e4ada0e4be38e9490a56ecba50c3adbd9af660c6d89a1534c2dd0880b713af",
      "after": "69c13b7656a540249a0beb84c3b468564842d11cd1ca78682d1de2e0881f09a0"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "d1a158920d29a0101b2b1be043666c130f2462f9e7a58e0aff47f58361932223",
      "after": "4971830011b109b0098945bc039c628f624d3116ddfb9b04baa5e1e9cf440150"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "93af5d6c60f4eee298832fe8a9ab6b59c59a722ca700d7cfc3a59d091ff9912b",
      "after": "f87dec666a0965536d0bd3c58acf80578c892e682497ae7e6cce1b354a70cc17"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design/SKILL.md",
      "before": "5664f9cbcf768bb3f4c2cace6d559b7e48cf07e1c3f31086edde414f97bd1643",
      "after": "74d3302244cde8170051c6413ba66ce29d5568deb85a7bef114e17b5ab2c68ef"
    },
    {
      "path": "docs/kb/product.md",
      "before": "6cb2ad66e37afe6d63b077ccadf638c81c069fa7fc1767af077e2127eb64055f",
      "after": "59cc2a652bb01895fb3afc60499a3b3afe95e2bf89e1d04008e5bf5674f54099"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "9f514d8b9fdc03004f2ed9cc4735b1d77fe1a0d8abc6c1fbbec948675994ba23",
      "after": "353fdc6b4124763133f72cd50c4253159277b235c08759e599ef73b047af3b0c"
    },
    {
      "path": "docs/kb/standards.md",
      "before": "96e15d7d4ef84fc5f6bee954a3589ca1ce7e057d25bd29a53b5ce7304b2cb3b5",
      "after": "1c4fbf21abb6dc39d1495e391380b3a9ff8fbc5928b775ac703b68bc03fe8235"
    },
    {
      "path": "packages/dsh-node-runtime/README.md",
      "before": "bec7124fdcba407cd1d3faeb3500cf70cb3aa4076c9f45fb505c1fadcc55b11e",
      "after": "92012c92415b96d10026c96efaf3e7e2a43619c2ea2e65841a6814ce1979fd97"
    },
    {
      "path": "packages/dsh-node-runtime/poc-browser-guidance.test.mjs",
      "before": null,
      "after": "b237f4157edd6f17b9ec0a00a9093ff5ed4c81efff49e527b098771c4e882445"
    },
    {
      "path": "packages/dsh-node-runtime/skills/synapse-design-html/SKILL.md",
      "before": "d1a158920d29a0101b2b1be043666c130f2462f9e7a58e0aff47f58361932223",
      "after": "4971830011b109b0098945bc039c628f624d3116ddfb9b04baa5e1e9cf440150"
    },
    {
      "path": "packages/talkdesk-cobalt/README.md",
      "before": "d5066b4e62dded01bee280fe6871cf7d638f7f81a6439543380ee657481f69b5",
      "after": "c40fbdc05d1cf26fd763913f4c16f4acc4b9a2bcb6eada496cdb2775edbf80ba"
    },
    {
      "path": "packages/talkdesk-cobalt/skill/references/cobalt-workspace.md",
      "before": "23653236857357a0590a9e3b175e511675e166e0b5badc5059c4542f1c1fe927",
      "after": "7b44b31699e3a1ac7db528a5d6dad752f53f482598f4bbfff18427606d58fb4d"
    },
    {
      "path": "packages/talkdesk-cobalt/tools/cobalt-project.mjs",
      "before": "2c7ba3aef7ae0fbd16915b5980600a00dba2d3744028191bd7ae3cff6de74f4d",
      "after": "89c25cebde5deb29acd02b618d1dd82bec892d624d67f6b18d4770d977f99813"
    }
  ]
}
```

Completed-At: 2026-11-16T03:26:50.887254+00:00

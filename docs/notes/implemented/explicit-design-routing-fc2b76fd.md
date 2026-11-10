# Respect explicit skill and output choices while keeping OP as the default design workflow.

Record-Version: 2
Task-ID: fc2b76fd-f831-44b6-83d0-a08e5a42212e
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T06:49:50.915034+00:00
Type: fix-bug
Status: complete

## Context

Respect explicit skill and output choices while keeping OP as the default design workflow.

## Changes

The companion `ss-dsh-design` Host now recognizes direct user choices of another Skill, tool, or output before OP defaults. It switches the owning Session out of OP restrictions and restores its previous tool presentation, while retaining pending drafts and style galleries. An explicit return or bound style confirmation re-enters OP; unrelated Sessions retain their own policy. Explicit alternative tasks cannot silently create an OP design, but OP read tools and an explicitly requested mixed workflow remain available. OP mode permits user questions and to-do updates while retaining its existing design-only mutation restrictions.

The local `/Users/franklin/Desktop/synapse-design-html` skill now uses `synapse-design-html` in its frontmatter and self-references. Its existing appearance-ledger path, scripts, resources, and workflow were preserved; it was not registered with DSH. Only the frontmatter description's arrow syntax changed to satisfy skill validation.

## Validation

- `pnpm --filter @synapse-studio/ss-dsh-design typecheck` and `pnpm --filter @synapse-studio/ss-dsh-design build`: passed.
- `node --test plugins/ss-dsh-design/tests/design-task-policy.test.mjs plugins/ss-dsh-design/tests/design-policy-registry.test.mjs plugins/ss-dsh-design/tests/host-service.test.mjs`: 17 passed, including actual DSH skill-loader registration, unknown skill errors, denied paths, nested tool guards, and presentation disposal.
- `pnpm run test:e2e:typecheck`: passed. `pnpm run test:e2e:prepare`: passed. The isolated Electron test `SYNAPSE_E2E_RECORD_VIDEO=0 pnpm exec playwright test --grep 'dsh-design follows an explicitly selected local HTML skill' --workers=1` passed with a model double and disposable profile; it used the real Host file tools and cleaned its temporary profile.
- A staged-runtime full plugin suite reported 408 passed and 22 failed; the failing test names exactly matched the 22-failure baseline from `/tmp/op-design-host-tests-final5-59e60cab.log`. A later parallel run also timed out waiting for a real screenshot while heavy checks ran; its `design-real-screenshot.test.mjs` case passed when run alone. The final serial full suite reported 412 passed with the same 22 failures (`/tmp/explicit-design-host-tests-serial-final-fc2b76fd.log`). The baseline failures include existing quality, enrichment, visual-review, removed-module, and retired-agent cases.
- `pnpm run doc-check`: passed (46 tests and documentation checks). `python3 /Users/franklin/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/franklin/Desktop/synapse-design-html`: passed. `node --check /Users/franklin/Desktop/synapse-design-html/scripts/check-mode.js`: passed.
- Optional `vet` review could not run because no configured model credentials were available; no replacement autonomous review was claimed.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/product.md",
      "action": "unchanged",
      "reason": "The change is in the companion DSH host router; the core OP product, editor, and design assets remain unchanged.",
      "sha256": "ee54bb80a7a62c537f3c74e3f839068b297eca630ce8105c73cf6bd7cdb25570"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "unchanged",
      "reason": "The Node and WASM tool catalog, runtime prompt, and OP execution protocols did not change; only the companion Host task routing changed.",
      "sha256": "01f6ce7aed25625da69775b86424d549ff84fed425e698c6db31b68ed458c2e2"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The HTML skill is intentionally not installed: name-only use remains unavailable until the user registers it, while an authorized explicit filesystem path can be read. No real model provider was used; the user will test normal application startup. The 22 inherited plugin-suite failures, including quality-gate behavior, remain unresolved. Routing uses direct-message intent patterns and cannot guarantee recognition of every ambiguous natural-language phrasing; direct skill paths and explicit OP or HTML requests have regression coverage.

## Changed files

```json
{
  "files": [
    {
      "path": "docs/kb/product.md",
      "before": "f111667bd274b6c5ffc9f1e002a89f4b001742794c4c5c260d3428958d9b1e66",
      "after": "ee54bb80a7a62c537f3c74e3f839068b297eca630ce8105c73cf6bd7cdb25570"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "cb5bbf538576ef416339084902470d7ecb45ebdad96f784f069758a4baa96292",
      "after": "01f6ce7aed25625da69775b86424d549ff84fed425e698c6db31b68ed458c2e2"
    }
  ]
}
```

Completed-At: 2026-11-10T07:27:17.196014+00:00

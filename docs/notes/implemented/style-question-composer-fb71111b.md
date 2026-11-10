# Move OP style selection to a question-style composer with direct chat submission

Record-Version: 2
Task-ID: fb71111b-3857-4bd4-8ab7-9752726ef7e8
Base-Ref: 6644990089bc122113f967a3dbabf5cf6d41665d
Started-At: 2026-11-10T08:59:34.668555+00:00
Type: feature
Status: complete

## Context

Move OP style selection to a question-style composer with direct chat submission

## Changes

The DSH host plugin owns a Session- and gallery-scoped style composer using the native pending-interaction and prompt interfaces. It preserves the resident draft, displays a compact conversation record, restores selections from Session history and browser session storage, and renders direct user choices without the machine-only gallery suffix. Native questions and authorization outrank the style panel. The runtime skill and style catalog remain the unchanged authorities.

## Validation

- `pnpm --filter @synapse-studio/ss-dsh-design typecheck` and `pnpm test:e2e:prepare` in the DSH host: passed; the latter rebuilt the plugin and desktop test bundles.
- `node --test tests/client.test.mjs tests/style-composer.test.mjs tests/style-gallery-browser.test.mjs tests/style-picker.test.mjs tests/style-approval-continuation.test.mjs` in the plugin: 161 passed, including real Chrome.
- `DSHPLUGIN_DESIGN_SOURCE_RUNTIME=/Users/franklin/Desktop/dsh-workspace/dsh-design-pencil/packages/dsh-node-runtime node --test --test-concurrency=1 tests/*.test.mjs` in the plugin: 427 passed, 22 failed, none skipped, before a complexity-only event-handler refactor that was rechecked by the focused suite. All 22 failing names match the earlier lifecycle task baseline.
- `pnpm run doc-check`, `pnpm test:e2e:typecheck` and targeted ESLint for the changed plugin sources and `e2e/design.e2e.ts` in the DSH host: passed.
- `SYNAPSE_E2E_RECORD_VIDEO=0 pnpm exec playwright test --grep 'dsh-design collects context before presenting the style gallery'` in the DSH host: one passed in an isolated Electron profile with a deterministic model double. It checks 85 styles, refresh recovery, native Question precedence, model switches, direct user submission, resident draft preservation, hidden marker, the selected style guidance and confirmed draft creation, and actual light and dark theme tokens.
- `node scripts/test-node-runtime.mjs` in the plugin: passed.
- `bash tools/check-maintenance.sh --base 6644990089bc122113f967a3dbabf5cf6d41665d --task fb71111b-3857-4bd4-8ab7-9752726ef7e8` in the design runtime: passed.
- `vet` did not run because neither `ANTHROPIC_API_KEY` nor `ANTHROPIC_AUTH_TOKEN` is configured.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [],
  "none_reason": "This task changes only the separate DSH host plugin's composer presentation and submission, tests and host documentation; the core runtime, design Skill, style catalog, and their recorded knowledge facts were not changed."
}
```

## Risks and follow-up

The pre-existing 22 plugin failures remain unresolved; they are not represented as passing. Electron acceptance uses a deterministic model double and does not establish behavior of an autonomous real model. The user will run their own application with their model and data.

## Changed files

```json
{
  "files": []
}
```

Completed-At: 2026-11-10T09:29:11.672876+00:00

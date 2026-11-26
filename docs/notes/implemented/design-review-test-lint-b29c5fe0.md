# Clear oxlint warnings introduced by the R1-R3 tests (toSorted, parallel file checks)

Record-Version: 2
Task-ID: b29c5fe0-093c-4d55-b865-5005263dd6c0
Base-Ref: 8a02e4e43ea1db98a2a9e06b35aa13e84a94ea36
Started-At: 2026-11-26T09:54:33.909065+00:00
Type: test
Status: complete

## Context

`check-maintenance.sh --lint-js` reported seven oxlint warnings in test files added by tasks 77b04566, 0624a549 and 81eb519c (`no-array-sort`, `no-await-in-loop`). The edits were made after those tasks were completed, so they are recorded here.

## Changes

- `guide-text.test-helper.mjs`, `poc-review-temp.test.mjs`: `toSorted()` instead of `sort()`.
- `html-skill-loading.test.mjs`: file existence, size and link checks run with `Promise.all`; the forced-read size still counts each file from the one source that contains it.

## Validation

- Passed: `oxlint --config packages/.oxlintrc.json` on the three files (0 warnings; the other changed files keep the same warnings as the base commit).
- Passed: `node --test packages/dsh-node-runtime/html-skill-loading.test.mjs poc-review-temp.test.mjs poc-startup-guidance.test.mjs poc-browser-guidance.test.mjs` (11 pass, 1 skipped without `DSH_E2E_CHROME`).

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [],
  "none_reason": "Test-only lint changes; no knowledge entry describes these tests."
}
```

## Risks and follow-up

None; test-only changes.
## Changed files

```json
{
  "files": []
}
```

Completed-At: 2026-11-26T09:55:42.060512+00:00

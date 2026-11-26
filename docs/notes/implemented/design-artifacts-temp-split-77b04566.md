# R1: split Design task output into .synapse/<kind>/artifacts/ and temporary review data into .synapse/<kind>/temp/; ignore .pnpm-store in the Cobalt project template

Record-Version: 2
Task-ID: 77b04566-03ac-4270-8cbd-f6e877658e97
Base-Ref: 8a02e4e43ea1db98a2a9e06b35aa13e84a94ea36
Started-At: 2026-11-26T08:33:50.903649+00:00
Type: feature
Status: complete

## Context

The Synapse Studio host deletes temporary Design data after 72 hours and ignores `.synapse/<kind>/temp/` in Git. Generated task folders mixed deliverables with review runs, plans and history under `.synapse/<kind>/tasks/`, so neither rule could apply. A sandboxed shell `pnpm install` leaves `.pnpm-store/` in a Cobalt project, which the template did not ignore.

## Changes

- `packages/dsh-node-runtime/document-file.mjs`: `designTaskDirectory` returns `.synapse/<kind>/artifacts/<slug>-<hash>`; new `designTempDirectory` returns `.synapse/<kind>/temp/<slug>-<hash>`; new `legacyDesignTaskDirectory` names the earlier `tasks/` folder for continuing existing tasks. `generatedOpPath` follows `designTaskDirectory`.
- `review-poc.mjs`: optional `--temp <dir>` (canonicalized, refused inside the task). With it, development runs, `dev-report.json` and history go to the temporary directory, the final run is written to `<task>/evidence/<run>/`, and earlier final runs are removed once the new ledger is published. Without it, output is unchanged under `<task>/review/`.
- `poc-review-evidence.mjs`: `archiveEvidence` accepts a history root; returns an absolute path when it lies outside the report directory.
- `poc-source-inventory.mjs`: `evidence/` is excluded from the fingerprinted source inventory, like `review/` and `shots/`.
- `SKILL.md`, `references/poc-review.md`: `<task-dir>` holds deliverables; `<temp-dir>` from the discovery receipt's `temporaryDirectory` holds plans, development runs and history; review commands pass `--temp`; without `temporaryDirectory` the previous layout is used.
- `packages/talkdesk-cobalt/templates/project/.gitignore`: adds `.pnpm-store/`.
- KB `runtime-mcp.md` and `product.md` describe the folders.

## Validation

- Passed: `node --test packages/dsh-node-runtime/document-file.test.mjs` (4).
- Passed: `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/poc-review-temp.test.mjs` (3, real Chrome: dev and two final runs with `--temp`).
- Passed: `node --test` on poc-review-workflow, html-review, html-skill-migration, poc-browser-guidance, poc-startup-guidance, document-file, poc-review-temp, poc-stability (36: 30 pass, 6 skipped without `DSH_E2E_CHROME`).
- Passed: `DSH_E2E_CHROME=1 node --test --test-name-pattern "final capture reuses one browser" packages/dsh-node-runtime/poc-review-workflow.test.mjs` on the base commit, as an environment check.
- Not comparable: `node --test packages/dsh-node-runtime/*.test.mjs` reports 40 failures both on the base commit and with this change (identical failing set). They are module-not-found and missing generated-registry failures because `bun install` could not reach the private `@talkdesk` registry (VPN disconnected); no dependency install was completed.
- Passed: `.venv-lint/bin/python tools/knowledge.py check`.

## Knowledge refresh

```json
{
  "status": "reviewed",
  "entries": [
    {
      "path": "docs/kb/runtime-mcp.md",
      "action": "updated",
      "reason": "Task paths now split into artifacts/ and temp/ with a legacy tasks/ helper; review-poc gained --temp.",
      "sha256": "ec51aa8dfcd5e51ef5e1cb5f18345cfc824641a43e92c24018b3fab1f5a0ff80"
    },
    {
      "path": "docs/kb/product.md",
      "action": "updated",
      "reason": "New Design task deliverables and temporary review data have separate workspace folders.",
      "sha256": "c661d4c1932e46304e7ad3d184b075910f33bd248e6d14fecbf45241935a2049"
    }
  ],
  "none_reason": null
}
```

## Risks and follow-up

The host must pass `temporaryDirectory` and adopt the `artifacts/` paths (Synapse Studio P6); until then a host using these helpers writes new tasks to `artifacts/` without a temporary directory, and the Skill falls back to the previous layout. Existing `tasks/` folders are not moved. The full Node suite and the WASM build were not run in this environment.

## Changed files

```json
{
  "files": [
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/SKILL.md",
      "before": "21014f31feb3aab1fba647ac008770b80f2a13b54d22c483758606e9695b66ce",
      "after": "bd17352e377cee384a96d20fdb2909ebcf93406dad0c81802f1f5ff71ec57602"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/references/poc-review.md",
      "before": "aaa86e2ea65b0cb853124399610a843866a78995419007d4b1f4747e211e84d0",
      "after": "82162030f3250a19395b3e21889659ddacbf470263c5f6e79fe172da49cceeb2"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-review-evidence.mjs",
      "before": "bcceaa942ff1ebdba2dffe7a8d57a1312794fd9b0a2ee260b9826a7cedf051b3",
      "after": "b8f96b9f54578d23046ec5831197e8b9ac9d194b0610c8c19d4cb28b4827936f"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/poc-source-inventory.mjs",
      "before": "51cae6bd081f6ff4f17b4311c4127c8a7686470cfb40f697e625949ccd35bb2e",
      "after": "272e947e882f5503e27e12cc7df53b7c4f22d1cb24114a209b548b0544746dc9"
    },
    {
      "path": "crates/op-ai-skills/skills/synapse-design-html/scripts/review-poc.mjs",
      "before": "2e4b3db7273f39d264fc89b8da3626c1e4632c838788bfc492cf5145812f606a",
      "after": "0fbb8ba3d26562b0352b7c7ee5d48a9e0dc228a3cfcfe3d0403d31b8f259fcd1"
    },
    {
      "path": "docs/kb/product.md",
      "before": "6deb6ef79f1dd294de3261129d9fe8ab0a0d6a34b1d2c9ea55617bb06e6d23a1",
      "after": "c661d4c1932e46304e7ad3d184b075910f33bd248e6d14fecbf45241935a2049"
    },
    {
      "path": "docs/kb/runtime-mcp.md",
      "before": "a1c5342f027e4553f68977a647523b66f59485a02459a480425b4e6f6b9b38e9",
      "after": "ec51aa8dfcd5e51ef5e1cb5f18345cfc824641a43e92c24018b3fab1f5a0ff80"
    },
    {
      "path": "packages/dsh-node-runtime/document-file.mjs",
      "before": "ffc461fcf75719d5530643cc82398bae9b65e08aca20c7d0d33ac0f5f0419465",
      "after": "6597b4f3fac86513142eef9d19c8ff154724ec33925e6dad192f6e303da39add"
    },
    {
      "path": "packages/dsh-node-runtime/document-file.test.mjs",
      "before": "9d6154fbb7ae35b0bd79feef9b8314269fef9b21e4cf8861c32dbab78eab9bde",
      "after": "eb1fcf71a89e56f9ab2152e502b2559b80ce795efff51700e160761e28319f8d"
    },
    {
      "path": "packages/dsh-node-runtime/poc-review-temp.test.mjs",
      "before": null,
      "after": "b548f6f20d5f39295fe6506e0ecad4da5d42e55029bc681e2118d3ad166182e1"
    },
    {
      "path": "packages/talkdesk-cobalt/templates/project/.gitignore",
      "before": "6bf37d408785b07c5117e75d7ef7ccc565ace0d338a991a4a23abb38736e53ad",
      "after": "e08605ba0e16597a32b477b2755db2e1a2d2a63425a589a56a49534444c1c8c1"
    }
  ]
}
```

Completed-At: 2026-11-26T09:15:50.428402+00:00

# AGENTS.md

This is the shared agent entry point for the current DSH design runtime.

> **The TypeScript OpenPencil has been retired.** `apps/web`, `apps/desktop`, `apps/cli`, and the `pen-*` packages are gone. The product is **Rust** (`crates/`) + a **wasm-backed web SDK** (`packages/op-web-sdk*`). See git history (last TS tag `v0.7.5`) for the retired code.

Read only the guidance relevant to the task:

- [Architecture and ownership](ARCHITECTURE.md): current DSH boundaries.
- [Commands](COMMANDS.md): runnable build, lint and validation commands.
- [Development harness](DEVELOPMENT.md): task workflow, isolation and evidence.
- [Coding standards](CODING_STANDARDS.md): effective-line cap and Rust/JS rules.
- [Review](REVIEW.md): high-confidence correctness and regression checks.
- [Knowledge base](docs/kb/README.md): verified non-obvious invariants.
- [Development notes](docs/notes/README.md): one record per independent task;
  follow the [notes guidance](docs/notes/AGENTS.md) for lifecycle placement.

Detailed historical module guidance remains in [crates/CLAUDE.md](crates/CLAUDE.md)
and [packages/CLAUDE.md](packages/CLAUDE.md). Current root guidance wins when an
old command or architecture description conflicts.

## Commands

Tooling is **Cargo** (Rust — the product). The root has **no `package.json`**; the JS/**Bun** tooling for the web SDK lives under `packages/` — run SDK/JS scripts from there.

- **Start every development task:** `.venv-lint/bin/python tools/task_notes.py start <slug> --type <type> --summary "<scope>"`.
  Keep the printed Task-ID and note path; do not reuse old notes.
- **Maintenance gate:** `bash tools/check-maintenance.sh --base <task-base-ref> --task <Task-ID>`
  (install the declared lint dependencies first; see [COMMANDS.md](COMMANDS.md)).
- **Rust:** `cargo fmt --all -- --check`; `cargo clippy --workspace --all-targets`.
- **Lint severity:** only errors block; warnings remain visible. Do not promote
  warnings with `-D warnings`, `--deny-warnings` or equivalent flags.
- **Actual web host tests:** `cargo test -p op-host-web --lib --features canvaskit`.
- **Node tests:** `node --test packages/dsh-node-runtime/*.test.mjs`.
- **WASM builds:** `bash packages/dsh-node-runtime/build-engine.sh`;
  `bash packages/dsh-node-runtime/build-web.sh`.

## Conventions

- New business source files must have **at most 500 effective code lines**.
  Tests are exempt; existing oversize files use an exact, shrinking baseline.
  Never enlarge the baseline, transfer an exception to a renamed file, or
  compress source to evade the cap. Run the checker, not `wc -l`.
- Fix the shared cause; preserve behavior and public paths when splitting.
- Start with a reproducible acceptance signal; finish with exact commands/results
  in this task's generated note. Follow the [knowledge guidance](docs/kb/AGENTS.md):
  read current product/standards and relevant KB, update or explicitly review affected facts.
  Run task check/finish only after validation and knowledge review; link the completed note
  in the final response. Missing notes or stale knowledge are errors.
- Abandon active work with `tools/task_notes.py archive <Task-ID> --reason "<reason>"`;
  preserve truthful evidence rather than faking completion or deleting private registration.
- User design data and active hosts are not benchmark/test fixtures.
- Do not automatically commit, push, or log credentials.
- `.rs` snake_case, `.ts`/`.tsx` kebab-case; source comments in English.
- Conventional Commits: `<type>(<scope>): <subject>` — scopes: `editor`, `canvas`, `panels`, `ai`, `codegen`, `variables`, `figma`, `mcp`, `desktop`, `web`, `renderer`, `sdk`, `cli`, `agent`, `i18n`.

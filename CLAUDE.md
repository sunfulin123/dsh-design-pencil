# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **The TypeScript OpenPencil has been retired.** `apps/web`, `apps/desktop`, `apps/cli`, and the `pen-*` packages (pen-types/core/engine/renderer/figma/mcp/ai-skills/sdk/react/acp) are gone. The product is now implemented in **Rust** (`crates/`) with a thin **wasm-backed web SDK** (`packages/op-web-sdk*`). Historical `// ported from pen-*` comments in the Rust sources name the retired TS as their origin — that code no longer exists in-tree; consult git history (last TS tag `v0.7.5`) if you need it.

For the current DSH product, start with [AGENTS.md](AGENTS.md),
[ARCHITECTURE.md](ARCHITECTURE.md), [COMMANDS.md](COMMANDS.md),
[DEVELOPMENT.md](DEVELOPMENT.md), [CODING_STANDARDS.md](CODING_STANDARDS.md)
and [REVIEW.md](REVIEW.md). These are authoritative over historical upstream
commands below or in subdirectory guides. Each task needs a
[development note](docs/notes/README.md); reusable verified lessons belong in
the [KB](docs/kb/README.md), not duplicated agent instructions.
Before development, generate a distinct task using `tools/task_notes.py start`.
Follow [knowledge guidance](docs/kb/AGENTS.md), verify the explicit Task-ID,
then finish that record. Old notes and freshly changed dates are not current evidence.
Abandon active work with `tools/task_notes.py archive <Task-ID> --reason "<reason>"`;
do not fake completion or manually remove private registration.

Detailed module docs load automatically in subdirectories:

- **`crates/CLAUDE.md`** — Detailed Rust module reference, including historical upstream hosts; current DSH architecture is in **`ARCHITECTURE.md`**.
- **`packages/CLAUDE.md`** — Remaining packages (op-web-sdk web viewer SDK family).

## Commands

Tooling is **Cargo** (Rust — the product). The root has **no `package.json`**; the JS/**Bun** tooling for the web SDK lives under `packages/` — run SDK/JS scripts from there.

- **Maintenance lint:** `bash tools/check-maintenance.sh --base <task-base-ref> --task <Task-ID>`
- **Build (Rust):** `cargo build --workspace --release`
- **Default workspace tests (Rust):** `cargo test --workspace`; these do not run all dependency-crate or CanvasKit tests.
- **Actual web host tests:** `cargo test -p op-host-web --lib --features canvaskit`
- **Node runtime tests:** `node --test packages/dsh-node-runtime/*.test.mjs`
- **Type check:** `cargo check --workspace`; wasm: `cargo check --target wasm32-unknown-unknown -p op-host-web --no-default-features --features web`
- **Lint / format (Rust):** `cargo clippy --workspace --all-targets` / `cargo fmt --all`
- **Lint severity:** errors block; warnings are visible and non-blocking. Do not promote warnings to errors.
- **Lint / format (remaining TS SDK):** from `packages/`: `bun run lint` (oxlint) / `bun run format` (oxfmt)
- **Current WASM runtime:** `bash packages/dsh-node-runtime/build-engine.sh`; `bash packages/dsh-node-runtime/build-web.sh`
- **MCP server:** current Node host in `packages/dsh-node-runtime/node-host.mjs`, backed by `op-dsh-engine` and the `op-mcp` path dependency.
- **Iconify catalog (Rust assets):** from `packages/`: `bun run generate-iconify-catalog`
- **Sync all managed versions:** `scripts/sync-version.sh` reads the canonical version from root `Cargo.toml`; verify without writing via `tools/check-version-sync.sh`

## Architecture

The current workspace has exactly two members: **op-dsh-engine** and
**op-host-web**. Node owns the managed host lifecycle and document version;
Rust owns design state, commands and tool contracts; CanvasKit renders the
browser editor. See [ARCHITECTURE.md](ARCHITECTURE.md) for the current data flow.
The following broader crate map describes retained upstream code, not a list
of current workspace members or an instruction to build native hosts:

```text
crates/
├── op-editor-core/       Canonical `.op` (PenDocument) editor state + EditorCommand + design-variable resolution
├── op-editor-ui/         Platform-free widgets + RenderBackend facade (wasm32-clean)
├── op-editor-host-core/  Transport-free host state machines shared by all hosts
├── op-host-native/       Native host lib (winit + skia-safe GL) — desktop + mobile
├── op-host-web/          Browser bundle: wasm32 cdylib, CanvasKit renderer
├── op-host-desktop/      Desktop binary `openpencil-desktop`; also the `--serve-web` daemon
├── op-host-services/     Headless serve-web / MCP daemon lib (shared by desktop + web-server)
├── op-host-web-server/   Thin GL-free web-server binary
├── op-cli/               `op` command-line tool
├── op-util/              Dependency-free leaf: hex-colour parsing + JSON / XML escaping
└── op-mcp / op-ai / op-ai-skills / op-codegen / op-orchestrator / op-figma /
   op-git / op-opmerge / op-pen-loader / op-design-lint / op-i18n / op-html /
   op-auth-bridge / op-smoke / …

packages/
├── op-web-sdk/           Read-only `.op` web viewer SDK (wraps the op-host-web wasm bundle)
├── op-web-sdk-react/     React 19 adapter for op-web-sdk
└── op-web-sdk-vue/       Vue 3 adapter for op-web-sdk
```

Data flow, canvas engine, Document/EditorCommand model, MCP layered-design workflow, design variables, and the run/debug recipe are all documented in **`crates/CLAUDE.md`**.

## Code Style

- New business files must not exceed **500 effective code lines**, enforced by
  `tools/check-file-line-cap.sh`. Pure comments/blank lines do not count; tests
  are exempt. Existing oversize files use `tools/code-line-baseline.json`,
  cannot grow, and must tighten their entry when reduced. See
  [CODING_STANDARDS.md](CODING_STANDARDS.md) for exact exclusions.
- Split by cohesive responsibility with a public spine and stable re-exports;
  do not mix behavior changes into a mechanical split.
- One component/widget per file, single responsibility.
- `.rs` filenames use snake_case; `.ts`/`.tsx` (SDK) use kebab-case.
- Source comments (`.rs`/`.ts`/`.toml`) in **English** (spec/plan markdown + test CJK fixtures may keep Chinese).
- Rust widgets paint against jian's `Painter`; `draw_text` is **baseline-relative** (label components center via `centered_text_baseline_y`, not `(h-fs)/2`).

## Git Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <subject>`

**Types:** `feat`, `fix`, `refactor`, `perf`, `style`, `docs`, `test`, `chore`

**Scopes:** `editor`, `canvas`, `panels`, `history`, `ai`, `codegen`, `store`, `types`, `variables`, `figma`, `mcp`, `desktop`, `web`, `renderer`, `sdk`, `cli`, `agent`, `i18n`

**Rules:** Subject in English, lowercase start, no period, imperative mood. Body optional; explain **why** not what. One commit per change.

## License

MIT License. See [LICENSE](./LICENSE) for details.

# HTML prototype review code library

This private source library owns the fixed, dependency-free Size/Page state/Reset preview UI for ordinary HTML POCs. It is copied as code, not recreated by the model and not installed or imported as an npm package. Cobalt Workspace prototypes retain their separate shell controls and Feature flags.

`scripts/html-review/` owns the exact HTML template, neutral CSS, browser controller and business-page adapter. `scripts/prepare-html-review.mjs` copies those sources next to an authored business entry, substitutes only the preview configuration, verifies copied JS/CSS bytes and writes SHA-256 provenance in `prototype-review/manifest.json`. It preserves business HTML and refuses unrelated output or linked paths.

`tools/export.mjs` copies the complete helper/library byte-for-byte into the existing HTML Skill resource paths and writes `scripts/html-review/library.json`. Runtime building and staging both call it. There is one maintained implementation; edits go here, never into generated runtime, SS or project copies.

The core [HTML review guide](../../crates/op-ai-skills/skills/synapse-design-html/references/html-review.md) owns authoring, supported states, locators, source fingerprints and business-only capture/handoff. The main Design skill and POC continuation instructions route to that contract. Review controls and their outer frame are not high-fidelity design content; business navigation and requested Workspace chrome remain in scope.

After changes, run `DSH_E2E_CHROME=1 node --test packages/dsh-node-runtime/html-review*.test.mjs` and the focused runtime packaging test from the repository root. Rebuild the engine when embedded skills change, then rebuild/stage the runtime. The library itself has no framework, private registry, network or runtime npm dependency; Playwright is a workspace test dependency only.

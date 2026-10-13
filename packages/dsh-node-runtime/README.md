# DSH Node runtime

This package hosts the original OpenPencil design engine in Node.js through `op-dsh-engine` WASM. It is an internal implementation, not a replacement release for the current DSH plugin yet.

The engine exposes passive document, selection, Position, history, node, page, variable and component tools through MCP `tools/list` and `tools/call`. Tool discovery and dispatch share one Rust catalog and use the original editor commands and MCP results. Failed transactions retain their original `applied: false` result. Node owns the authoritative document version; successful content changes advance it, reads and selection-only or metadata-only updates do not. Browser writes require a matching `baseVersion`.

`startNodeHost` binds an ephemeral `127.0.0.1` port and serves the original CanvasKit browser editor, `/mcp`, `/api/mcp/document`, and `/api/mcp/version`. It refuses foreign Host and Origin headers and non-JSON writes. Requests are limited to 32 MiB. Explicitly configured parent origins receive origin-scoped CORS responses. Managed data requests do not require a token. The lifecycle-only `openpencil/shutdown` method requires the random token returned in the startup handshake. `close()` closes connections and frees the WASM engine.

The CLI accepts `--serve-web --managed --port 0 --file <document>` and repeatable `--allow-origin <origin>` arguments. It emits one JSON startup handshake and exits on parent stdin EOF or shutdown. `/api/file/save` writes only the parent-bound file through an adjacent temporary file and atomic rename. Failed validation or external file changes retain the engine state; explicit stale versions are rejected. The browser sends its confirmed sync version with file saves and refuses a bound-file write before sync initialization or during an open/conflict. Unversioned API saves remain a compatibility path without stale-snapshot protection.

The browser starts in passive embedded mode, including direct opens. DSH owns theme, locale, model execution, credentials and sessions. Standalone chat, model discovery, AI transport, image generation and AI code-generation execution are removed from the browser target. The vendored `jian` schema, layout and widget libraries remain required; the standalone Agent SDKs and native window vendor are removed.

Managed editor tabs use equal-width text slots and a primary underline, with an icon fallback for narrow rails. Menu labels use the host's secondary foreground in light and dark modes. Default focus and selection use DSH business-primary blue; a host palette that maps primary to foreground ink receives the blue fallback, while an independent host interaction color is retained. The compact zoom/grid control keeps its button positions fixed across percentage labels. These appearance settings do not change document content or history.

Document snapshots retain top-level extension fields. Canonical design edits use the Rust schema. `editorMeta` restores the active page and authored geometry through the existing loader APIs. Metadata-only browser pushes cannot replace design nodes or advance the content version. Initial browser sync requires canonical fill arrays; import-time color shorthand normalization is not applied to the initial snapshot.

The status-bar grid control jointly toggles managed desktop rulers and pixel inspection, initially off. Rulers do not depend on host palette initialization and are hidden during presentation and preview. Pixel inspection appears at eight device pixels per document pixel. These transient overlays do not change document history and are disabled in scene-only viewers. Structural fill add/remove/type changes use one reversible transaction. The CanvasKit backend renders existing Gaussian layer blur and rounded-shape outer shadows with isolated filters; shadow spread and arbitrary-path outer shadow fidelity remain incomplete.

Browser node dragging snaps edges and centers within four screen pixels and paints transient alignment guides. Hidden nodes and dragged subtrees are excluded from targets; releasing the drag clears the guides, and the gesture remains one undo step. The Position inspector exposes six alignment and two distribution actions with localized hover labels. A single movable child aligns within its parent; two or more independent movable targets align within their combined bounds, and distribution requires at least three. A single root has no alignment reference. Flow-layout children use their parent's Layout controls instead. Ineligible inspector actions are disabled; rejected or unchanged MCP actions return an error without changing the document or history. Auto-layout alignment writes both axes in one undo step and ignores identical settings. Persistent guides, true Grid layout, constraints, aspect-ratio locking and corner smoothing remain incomplete.

## MCP coverage

Selection tools operate on engine selection; browser transient selection is not synchronized into it. AI callers must set their intended targets explicitly. Canonical node patches support existing layout and sizing fields, stacked fills and effects. Successful document mutations create an undo snapshot when their command does not already own history; commands that own history are not wrapped twice.

| Surface | Node/WASM coverage |
| --- | --- |
| Document, node and layout inspection | Canonical reads and batch operations |
| Selection, Position and history | Explicit selection, six alignment actions, two distributions, undo and redo |
| Node structure and appearance | Canonical create/edit/move/copy/delete, grouping, ordering, clipboard, SVG insertion, text, paints, strokes and effects |
| Pages, variables and components | Catalog-backed canonical tools |
| Browser selection, viewport and overlay controls | Not synchronized or exposed as managed view tools |
| Screenshot, script and export execution | Not implemented in this runtime |

Each completed design capability requires a discoverable passive MCP schema and tests of its actual effect, invalid inputs and state preservation. Authored edits additionally require undo/redo and save/reopen evidence. UI-only completion or catalog registration alone does not satisfy this gate. DSH remains the only AI execution owner.

## Build and test

Build in the source repository, not in the consumer plugin. Install Rust 1.96.0 with `wasm32-unknown-unknown`, Node.js 24 or newer, and `wasm-bindgen-cli` 0.2.117.

```sh
rustup target add wasm32-unknown-unknown --toolchain 1.96.0
cargo +1.96.0 install wasm-bindgen-cli --version 0.2.117 --locked
CARGO_TARGET_DIR=/tmp/dsh-design-pencil-wasm bash packages/dsh-node-runtime/build-engine.sh
CARGO_TARGET_DIR=/tmp/dsh-design-pencil-wasm bash packages/dsh-node-runtime/build-web.sh
node --test packages/dsh-node-runtime/*.test.mjs
node --test crates/op-host-web/tests/op_ck_bridge_*.test.mjs
```

The builds emit ignored Node.js bindings into `wasm/` and browser assets into `web-bundle/`. They do not build an App, native daemon, or Skia. `op-mcp` retains native text measurement by default; this engine disables that feature. Cargo defaults to the two DSH WASM owners instead of the standalone App.

`scripts/stage-dsh-runtime.mjs` stages a checksummed Node/WASM payload from a clean committed checkout. Its file whitelist excludes vendors, Rust source, build caches, tests, type declarations and Agent resources. GitHub webpage publication of `runtime-v0.8.5-synapse.3` runs the Node/WASM release workflow; it uploads validated assets without replacing the tag or overwriting existing assets. No release was published as part of this implementation.

## Delivery status

Complete design and MCP parity, script execution, screenshot/export tools, headless PNG/PDF rendering, browser/engine transient-state synchronization, and consumer launch adaptation are not implemented here. Browser imports use the original editor path. The Node runtime and release pipeline are internal until the DSH plugin is adapted and verified end to end; they are not a drop-in replacement for the native consumer contract.
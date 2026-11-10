# DSH Node runtime

This package hosts the original OpenPencil design engine in Node.js through `op-dsh-engine` WASM. It is an internal implementation, not a replacement release for the current DSH plugin yet.

The engine exposes passive document, selection, Position, history, node, page, variable and component tools through MCP `tools/list` and `tools/call`. Tool discovery and dispatch share one Rust catalog and use the original editor commands and MCP results. Failed transactions retain their original `applied: false` result. Node owns the authoritative document version; successful content changes advance it, reads and selection-only or metadata-only updates do not. Browser writes require a matching `baseVersion`.

`startNodeHost` binds an ephemeral `127.0.0.1` port and serves the original CanvasKit browser editor, `/mcp`, `/api/mcp/document`, and `/api/mcp/version`. The version probe also reports the saved `viewport` and pending `uiScale` hint, so the editor downloads the document only when content, the daemon camera, or a UI-scale hint changed — large documents are not re-parsed on every poll. Switching to a page with many layers shows a localized loading cover on the canvas for the frame before the page is laid out. It refuses foreign Host and Origin headers and non-JSON writes. Requests are limited to 32 MiB. Explicitly configured parent origins receive origin-scoped CORS responses. Managed data requests do not require a token. The lifecycle-only `openpencil/shutdown` method requires the random token returned in the startup handshake. `close()` closes connections and frees the WASM engine.

The CLI accepts `--serve-web --managed --port 0 --file <document>` and repeatable `--allow-origin <origin>` arguments. It emits one JSON startup handshake and exits on parent stdin EOF or shutdown. Offline commands never start a server: from this directory run `node cli.mjs import <source.mmd|mermaid|drawio|xml> --file <existing.op>` to add editable diagram nodes, `node cli.mjs tokens import <tokens.json> --file <existing.op>` to merge supported DTCG tokens into variables, or `node cli.mjs tokens export --file <existing.op> [--output <tokens.json>]` to export DTCG JSON (stdout by default, without rewriting the document). Imports retain existing authored nodes and extension fields, use the active production WASM tools, and reject unsupported formats or invalid input with stderr and a nonzero exit. Offline file writes and `/api/file/save` use an adjacent temporary file and atomic rename, refusing external changes; token output cannot overwrite the bound document. Failed validation or external file changes retain the engine state; explicit stale versions are rejected. The browser sends its confirmed sync version with file saves and refuses a bound-file write before sync initialization or during an open/conflict. Unversioned API saves remain a compatibility path without stale-snapshot protection.

The browser starts in passive embedded mode, including direct opens. DSH owns theme, locale, model execution, credentials and sessions. Standalone chat, model discovery, AI transport, image generation and AI code-generation execution are removed from the browser target. The vendored `jian` schema, layout and widget libraries remain required; the standalone Agent SDKs and native window vendor are removed.

Managed editor tabs use equal-width text slots and a primary underline, with an icon fallback for narrow rails. Menu labels use the host's secondary foreground in light and dark modes. Default focus and selection use DSH business-primary blue; a host palette that maps primary to foreground ink receives the blue fallback, while an independent host interaction color is retained. The compact zoom/grid control keeps its button positions fixed across percentage labels. These appearance settings do not change document content or history.

Document snapshots retain top-level extension fields. Canonical design edits use the Rust schema. `editorMeta` restores the active page, authored geometry and optional viewport (`panX`, `panY`, `zoom`, a multiplier clamped to 0.1–8). Fractional browser pan is preserved; restored views skip auto-fit. Metadata-only browser pushes cannot replace design nodes or advance the content version. Ordinary live sync without editor metadata retains the saved view; explicit metadata without a viewport or a top-level `viewport: null` resets it. Initial browser sync requires canonical fill arrays; import-time color shorthand normalization is not applied to the initial snapshot.

The status-bar grid control jointly toggles managed desktop rulers and pixel inspection, initially off. Rulers do not depend on host palette initialization and are hidden during presentation and preview. Pixel inspection appears at eight device pixels per document pixel. These transient overlays do not change document history and are disabled in scene-only viewers. Structural fill add/remove/type changes use one reversible transaction. The CanvasKit backend renders existing Gaussian layer blur and rounded-shape outer shadows with isolated filters; shadow spread and arbitrary-path outer shadow fidelity remain incomplete.

Browser node dragging snaps edges and centers within four screen pixels and paints transient alignment guides. Hidden nodes and dragged subtrees are excluded from targets; releasing the drag clears the guides, and the gesture remains one undo step. The Position inspector exposes six alignment and two distribution actions with localized hover labels. A single movable child aligns within its parent; two or more independent movable targets align within their combined bounds, and distribution requires at least three. A single root has no alignment reference. Flow-layout children use their parent's Layout controls instead. Ineligible inspector actions are disabled; rejected or unchanged MCP actions return an error without changing the document or history. Auto-layout alignment writes both axes in one undo step and ignores identical settings. Persistent guides, true Grid layout, constraints and corner smoothing remain incomplete. Numeric aspect-ratio locking is stored as `lockAspectRatio` and honored by node updates and drag resize.

## MCP coverage

### Figma parent links

For complete migrations, first try a Figma **File → Save local copy**
export and pass its `.fig` path to `import_figma`. Keep link/API import as a
supplement. Neither parser promises complete fidelity; validate both paths
against the original with screenshots. Figma's REST endpoints return JSON
and images, not a downloadable original `.fig` file.

`import_figma({url, mode:"auto"})` probes the parent, inserts its empty
frame, and fetches each child board separately. After 25 seconds it returns
a `jobId` rather than keeping the MCP call open; use
`get_figma_import_status({jobId})`, `resume_figma_import({jobId})`, or
`cancel_figma_import({jobId})`. `mode:"async"` returns immediately.
`inspect_figma_node({url})` lists the children before importing. Completed
chunks are cached by file version; a changed file requires a new import or
an explicit forced resume. Jobs are scoped to the bound document path;
unbound documents have session-local job scopes.

REST requests, including reading response bodies, time out after 60 seconds
(`DSH_FIGMA_TIMEOUT_MS`, 10,000–600,000 ms). Requests over 64 MiB are subdivided;
the default import limit is 60,000 nodes (`DSH_FIGMA_MAX_NODES`). A timeout is
retried once, rate limits and server errors up to three times. The REST token
comes from `figmaToken`, `FIGMA_TOKEN` or `FIGMA_ACCESS_TOKEN`; it is not stored
with jobs. Local `.fig` and Figma clipboard paste remain available; a local
`.fig` import also downloads and registers the fonts its text uses
(`fetchFonts:false` skips this) and reports unavailable faces as warnings.

`.fig` instances resolve overrides exactly by layer `overrideKey` (never
inside a nested instance), apply component properties (text, visibility,
swaps, including variable-bound values) with explicit overrides winning,
and honour Figma "first on top" stacking (`itemReverseZIndex`). Overrides
whose target layer was deleted from the component are reported in one
aggregate warning instead of being guessed onto another layer.

URL imports insert without replacing existing boards. `x`/`y`, `parent` and
`pageId` select the destination; otherwise the import lands beside existing
content. Parent-relative placement is retained and Figma's distant page
coordinates are normalized. The synchronized editor fits content when none
of it is visible. `layout:"preserve"` is the default; optional `"semantic"`
layout is compared against fixed geometry and drifting roots retain fixed
positions with a warning.

The REST path uses the Rust Figma converter, preserving text growth,
truncation/max lines, paths, flips, effects and layout fields instead of the
old independent JS mapper. The inspector exposes truncation off/1/2/3 lines;
arbitrary positive `maxLines` and `textTruncation:"ending"` are also available
through `update_node`/`batch_design`. Google Fonts faces are downloaded and
cached by family, weight and style. Private/unavailable fonts are reported,
not silently claimed to match.

`compare_figma_fidelity({url,nodeId})` compares official Figma PNG output with
the editor screenshot and reports pixel differences, dimensions,
structural deltas and text parity. Both import paths keep each layer's
Figma REST id as `figmaNodeId` (`I<instance>;<layer>` inside instances), so
layers are matched by id; vector parts merged into one path are not counted
missing. Text parity lists visible Figma texts missing from, or extra in,
the import and is part of `verified`. It requires a source URL containing `node-id`; pixels
require an open editor. Non-comparable screenshots never count as a pass.
The comparison currently supports non-interlaced RGB/RGBA8 PNG and includes
antialiasing edges. Documents imported before ids were kept fall back to
tree-order name matching.
This is not a guarantee of universal pixel parity: REST instances currently
import as expanded frames, and unsupported Figma features still need review.

A local `.fig` imported into an empty document keeps component linkage:
components used on its pages land on an extra **Components** page and each
page-level instance becomes a `ref` whose `descendants` hold its differences.
Every `ref` is re-expanded at import and kept only if it reproduces the exact
instance; otherwise that instance stays an expanded copy, counted in the
import summary. Inserting a `.fig` into an existing document imports expanded
copies (only its first page is inserted).

### Design feature additions

The active Rust catalog also exposes:

- `tool_search`: discover authoritative tool schemas by capability.
- `copy_properties`, `paste_properties`, `arrange_nodes`, `set_vector_path`, and `paste_html`.
- `import_html` / `import_html_url`: render the page in headless Chrome (scripts, media queries, web fonts, WebGL canvas pixels, native controls) and import one board per `viewports` width; fall back to the static CSS importer with `renderMode:"static-css"` and a warning when no Chrome exists.
- `compare_html_fidelity`: render the HTML source and compare it with an imported board (pixel ratio, 200px bands, hot regions with layers, visible-text coverage); read-only, host only.
- `set_text_content`, `set_text_markdown`, `set_text_style`, `get_text_style`, and `set_paragraph_style`. Existing `set_node_text` accepts `markdown: true`. Range offsets count Unicode scalar values. Range styles include `fontFamily` (empty clears the override). Styled canvas text measures each run's family, size and weight for wrapping, uses separate line ascent/descent boxes, and consistently scales all runs for auto-width shrink-to-fit.
- `list_styles`, `create_style`, `update_style`, `delete_style`, `apply_style`, and `detach_style`. Shared styles persist in `sharedStyles`; updates propagate to attached nodes.
- `bind_variable`, `unbind_variable`, `get_variable_mode`, `set_variable_mode`, `evaluate_variable`, and DTCG token import/export. Typed bindings cover visibility/enabled, text and supported existing shadow/blur effect paths. Node/page/global modes persist; `auto` removes an explicit axis override. Arithmetic uses bounded `calc(...)` expressions in numeric variable values, not executable scripts.
- Typed component-property CRUD, `set_instance_properties`, `reset_instance_properties` (named overrides or all overrides), `swap_instance`, `create_slot`, `update_slot`, `delete_slot`, `fill_slot`, `list_slots`, and authored variant creation/listing/selection. Slot edits validate existing instance content before committing.
- `get_component_behaviour` and `set_component_behaviour`: validated button/switch/checkbox/tabs/slider state bound to typed properties or family variants. Preview changes transient visuals; HTML/CSS and React Tailwind JSX emit functional state and ARIA. Nested behaviours and instance-swap bindings are rejected.
- `export_code`: read-only deterministic `html-css`, `tailwind-jsx` or `design-jsx` export for explicit active-page `nodeIds` (default: page roots), without model execution or file writes.
- `get_viewport` and `set_viewport`: camera pan/zoom, persisted without content revisions or undo entries. MCP uses `pan_x`, `pan_y`, `zoom_percent` strings; browser metadata preserves fractional pan. Local canvas dragging, trackpad panning and wheel/pinch zoom also synchronize, survive reload and enter recovery snapshots. After the daemon advertises `metadataOnlyPush`, view-only updates send a small metadata payload instead of serializing the document, including for oversized saved documents. Older daemons receive the complete document. Camera compare-and-set, captured acknowledgements and pull epochs prevent stale requests/replies from overwriting newer views. A concurrent AI camera change follows the existing recoverable server-authority conflict flow; unsynchronized local camera changes block checkpoint/restore.
- `get_ui_scale` and `set_ui_scale`: chrome/layout/hit-testing percentages 100/110/125/150, independent of document geometry and camera zoom. Click the canvas zoom percentage to open the interface-scale selector and Fit control, or use Cmd/Ctrl+Alt+0. Navigate with arrows/Tab, activate with Enter/Space, and dismiss with Escape. User preferences survive browser reload. The host retains AI scale hints until the browser acknowledges the matching value. These preferences do not change document content or history.
- `get_screenshot`: renders the actual CanvasKit design output as an MCP PNG image block plus `{nodeId, width, height, scale, version}` metadata, so an agent can visually check its work. Omit `nodeId` to capture all visible page content (16px margin); a top-level screen is captured in isolation, a nested node by its rendered bounds. `scale` 0.25-4 (default 1) is reduced to keep the longest edge within `maxSize` (default 1600, max 4096); `background` is `canvas` or `transparent`. An open synchronized Node-hosted editor is required; preview mode, hidden/missing nodes, timeouts and document changes fail explicitly. Capturing excludes editor chrome/grid/selection and changes no document/history state; the document-only engine cannot render images.
- `sample_color`: actual CanvasKit-composited RGBA8/hex at document-space `x`/`y` or a visible `nodeId` center, including ancestor transforms and alpha blending. An open synchronized Node-hosted editor is required; offscreen, preview and decoding targets fail explicitly. Sampling excludes editor chrome/grid/selection and changes no document/history state. The document-only engine cannot sample pixels. In the web color picker, the eyedropper activates a crosshair and a 9-by-9 rendered-pixel loupe. Click or Enter confirms the sampled RGB while retaining the target alpha in one undoable edit; Escape cancels without changing the document. Locked or changed targets are rejected.
- `list_drafts`, `create_draft`, `restore_draft`, and `delete_draft`: persistent recovery for the parent-bound document. Successful live document and viewport changes replace a private per-session autosave; checkpoints and pre-restore backups remain separate. Restore validates canonical content, writes a protective backup first, then creates one undoable edit without clearing earlier history or saving the bound file. Unknown top-level extensions follow undo/redo; canonical optional roots removed by undo do not reappear. Snapshots are scoped to the absolute bound-file path and are never restored automatically. Storage defaults to the OS user application/state directory; the managed CLI accepts `--draft-dir` to choose another location. No automatic snapshot pruning occurs; use `delete_draft` to discard copies. A failed autosave explicitly returns `draft-write-failed`, `applied: true`, and the current version (HTTP 507 for browser writes); the live edit remains available and must not be blindly retried.
  - The managed editor exposes **Recovery copies** in the zoom-percentage view menu (Cmd/Ctrl+Alt+0, then End and Enter); hosts exposing the full File menu also offer it there. The dialog lists localized autosave/checkpoint/backup kinds and timestamps, creates named checkpoints, and confirms restores/deletions. It blocks document shortcuts while open, requires synchronized local edits before checkpoint/restore, checks the restore version, and waits for the restored document to reach the canvas before closing. Storage and stale-list errors stay visible. The entry is offered only when the host advertises recovery for a bound document. UI scale and narrow-screen layout are supported.
- `import_mermaid`, `import_drawio`, and `create_connector`.
- `lint_document` rule/node filters and stable observed-value issue IDs; `fix_lint_issues` applies safe fixes atomically. Advisory findings remain explicit design work.

The layer menu offers appearance copy/paste and eligible Tidy Up/Pack actions. Browser Cmd/Ctrl+Alt+C/V copies/pastes appearance without taking over text inputs. Document writes are reversible; clipboard copies remain transient.

The Design inspector includes shared-style capture/update, browsing, apply/detach/delete; typed variable bindings, formula evaluation and layer/page/document modes; DTCG token import/export in a multiline field; and page diagnostics with per-finding reasons and safe atomic repairs. The existing Variables panel remains the collection/value editor. Reusable components and instances also expose Properties / Slots / Variants / Behaviour forms: persisted definitions load back into fields, instance values reset, slots copy authored nodes with validated limits, variants reuse existing frames, and Behaviour bindings configure executable preview/export state. Unsupported or locked targets show explicit warnings; draft form edits never enter document history.

The zoom percentage menu includes **Import Mermaid / draw.io…**, including in managed mode. Its file picker accepts `.mmd`, `.mermaid`, `.drawio`, and `.xml`, bounds reads to 8 MiB, and imports editable nodes without replacing existing boards. A successful import is one undoable edit; invalid files show an explicit error without modifying the document.

These additions do not establish complete feature parity. Markdown is a subset; inline text editing still uses a flat single-style caret/selection layout. Diagram imports support Mermaid flowcharts and single flat draw.io diagrams, including bounded compressed payloads (1 MiB compressed, 8 MiB inflated/source XML). Ambiguous multi-diagram files are rejected. Connectors are static and do not follow moved endpoints. Shared styles do not yet attach to virtual instance children. Tokens support colors, numbers, pixel dimensions, fontWeight, and aliases, not all DTCG composites/units. Variable bindings do not cover geometry, stroke width or unimplemented shadow spread. Behaviour export is supported in HTML/CSS and React Tailwind JSX, not every generator. The text inspector exposes Markdown, scalar-range and paragraph/list controls. Markdown input preserves pasted line breaks and tabs; Enter inserts a line break and Apply commits the conversion. Actual browser checks cover Unicode Markdown, range styling, mixed-font rendering and wrapping, paragraph geometry, undo, persistent recovery and its desktop/mobile dialog, the scale selector, interactive rendered-color sampling, token import, shared-style capture, variable binding, component-property authoring, individual lint repair with undo, and Mermaid/draw.io imports with visible labels. The diagram picker was also checked at a 390px viewport and 150% UI scale. Real HTTP MCP calls verify slot update/delete and instance-property reset against the rebuilt engine.

The browser synchronizes its selection as temporary host context; a text range is returned only while its source text still matches. AI callers can also set intended targets explicitly. Canonical node patches support existing layout and sizing fields, stacked fills and effects. Successful document mutations create an undo snapshot when their command does not already own history; commands that own history are not wrapped twice.

| Surface | Node/WASM coverage |
| --- | --- |
| Document, node and layout inspection | Canonical reads and batch operations |
| Selection, Position and history | Explicit selection, six alignment actions, two distributions, undo and redo |
| Node structure and appearance | Canonical create/edit/move/copy/delete, grouping, ordering, clipboard, SVG insertion, text, paints, strokes and effects |
| Pages, variables and components | Catalog-backed canonical tools |
| Browser selection and overlay controls | Session selection and text range are synchronized as temporary context; camera metadata is exposed through viewport tools |
| Code export | Read-only `export_code` for HTML/CSS, React Tailwind JSX and Design JSX |
| Screenshots | `get_screenshot` renders the real CanvasKit output in a hidden headless Chrome started on demand (`DSH_CHROME_PATH` overrides discovery; `--no-headless` or `DSH_HEADLESS=0` disables it), falling back to an open editor tab or, without Chrome, an approximate server render; `structuredContent.renderer` says which was used |
| Design scripts | `batch_design` expands design operations in a bounded QuickJS/WASM interpreter before the document transaction |
| Arbitrary script execution | Not exposed through the active catalog |

Each completed design capability requires a discoverable passive MCP schema and tests of its actual effect, invalid inputs and state preservation. Authored edits additionally require undo/redo and save/reopen evidence. UI-only completion or catalog registration alone does not satisfy this gate. DSH remains the only AI execution owner.

## Canvas rendering

The editor canvas is rendered from retained 256 px GPU tiles per zoom level, as Figma and browser compositors do. Pan and zoom only draw tiles; tiles a frame lacks are filled from the closest other level, at worst the always-kept page overview, and rasterized in a per-frame time budget once the camera settles, so the canvas never shows a hole. Edits redraw only the tiles their changed nodes touch; hover, selection and other chrome stay live. Text editing, node drags and layout transitions paint live.

Debug switches on the editor URL: `?perf=1` logs per-frame section timings to the console, and `?tiles=0` disables tiles (live painting) for comparison.

## AI design loop

`ai-design-loop.test.mjs` drives predetermined MCP calls for a design loop (create page, design, screenshot, lint, fix and adjust, screenshot) on an empty and a ~20k-node document. `DSH_E2E_CHROME=1 DSH_E2E_OUT=<dir> node --test ai-design-loop.test.mjs` repeats it with real headless CanvasKit captures and keeps the PNGs. This does not establish autonomous model performance.

## Build and test

Build in the source repository, not in the consumer plugin. Install Rust 1.96.0 with `wasm32-unknown-unknown`, Node.js 24 or newer, and `wasm-bindgen-cli` 0.2.117.

```sh
(cd packages && bun install --frozen-lockfile)
rustup target add wasm32-unknown-unknown --toolchain 1.96.0
cargo +1.96.0 install wasm-bindgen-cli --version 0.2.117 --locked
CARGO_TARGET_DIR=/tmp/dsh-design-pencil-wasm bash packages/dsh-node-runtime/build-engine.sh
CARGO_TARGET_DIR=/tmp/dsh-design-pencil-wasm bash packages/dsh-node-runtime/build-web.sh
node --test packages/dsh-node-runtime/*.test.mjs
node --test crates/op-host-web/tests/op_ck_bridge_*.test.mjs
```

The builds emit ignored Node.js bindings into `wasm/` and browser assets into `web-bundle/`. They do not build an App, native daemon, or Skia. `op-mcp` retains native text measurement by default; this engine disables that feature. Cargo defaults to the two DSH WASM owners instead of the standalone App.

`scripts/stage-dsh-runtime.mjs` stages a checksummed Node/WASM payload from a clean committed checkout. It includes the locked QuickJS interpreter packages and excludes unrelated vendors, Rust source, build caches, tests, type declarations and Agent resources. GitHub webpage publication of `runtime-v0.8.5-synapse.4` runs the Node/WASM release workflow; it uploads validated assets without replacing the tag or overwriting existing assets. No release was published as part of this implementation.

## Delivery status

Complete design and MCP parity, every sensitive host adapter, autonomous-model design acceptance, and full image-export parity are not yet verified. Deterministic `export_code` is available independently of AI execution. Browser imports use the original editor path. The Node runtime and release pipeline remain internal until the DSH plugin is adapted and verified end to end; they are not a drop-in replacement for the native consumer contract.

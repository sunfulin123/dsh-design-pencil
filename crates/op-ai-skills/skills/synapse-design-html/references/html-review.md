# Ordinary HTML prototype review controls

Use this helper for ordinary HTML POCs, including standalone pages. Workspace prototypes keep their existing Cobalt shell controls. The canonical implementation is the private `packages/html-prototype-review/` code library. Installed sessions already carry the library under `scripts/html-review/`; use the bundled helper without cloning a repository or installing an npm package. The helper copies its fixed sources and verifies JS/CSS hashes; models must not redraw, reimplement or edit the toolbar. The generic controls have no Feature flags, framework dependency, private registry access or influence on the selected business-page style.

## Author the business entry

Keep the original page structure and selected DESIGN. Add the adapter once in `<head>`, before application scripts:

```html
<script src="./prototype-review/page.js"></script>
```

Implement the applicable planned states. For plain HTML, put `data-prototype-state` on state-specific regions; shared navigation/header content stays outside them. Space-separated values share a region across states. The adapter hides nonmatching regions, even if their authored CSS overrides native `hidden` styles.

```html
<section data-prototype-state="success partial">Populated page content</section>
<section data-prototype-state="loading" hidden>Loading records…</section>
<section data-prototype-state="empty" hidden>No records yet.</section>
<section data-prototype-state="error" hidden>Could not load records.</section>
```

Script-rendered pages read `window.SynapsePrototypeReview.state` before their initial render and supply that scenario to their own renderer. The adapter also emits `prototype:statechange` at DOMContentLoaded, with `{ state }` in `event.detail`; late subscribers must read the initial API value rather than wait for a past event. The API is not a replacement for business interactions or validation. Every listed state needs real corresponding content and a browser assertion.

Do not place prototype state/size selectors in the business page. User-facing filters, tabs, dialogs and actions remain part of the business page.

## Prepare the review entry

After authoring, run from the task directory with its existing `SYNAPSE_DESIGN_TASK_DIR` binding:

```sh
node <html-skill>/scripts/prepare-html-review.mjs \
  --entry <task-dir>/index.html \
  --states success,loading,empty,error,partial \
  --default-state success
```

List only implemented, applicable states. Supported IDs are `success`, `loading`, `empty`, `error`, `partial`, `permission`; labels are Ready, Loading, Empty, Error, Partial, No access. A read-only/static page can declare only `success`; its state trigger is disabled instead of advertising fake variants. Explain non-applicable states in the normal evidence ledger.

The command returns `entry` (default `preview.html`), `businessEntry`, `states`, `defaultState` and the helper's `sourceFiles`. It copies `prototype-review/` next to the business HTML and preserves the business source. It refuses unrelated preview files/directories, path escapes and symlinks. Repeat it after source/template updates. An optional `--out` names another preview HTML in the same directory; do not put runtime assets inside `review/` or `shots/`.

For a bundled/Vite page, include the adapter tag in its source index, build first, then prepare the compiled business entry. Keep the copied review assets beside the compiled entry. Never wrap an existing Workspace shell or add the generic bar twice.

## Behavior and locators

Size changes the real iframe width without scaling or reloading it. Fill tracks the available width; Phone is a true 390 × 844 page with outer scrolling when necessary. Readout reports the actual page viewport, excluding the toolbar. The business iframe keeps its own scrolling, media queries and fixed-position controls.

State changes reload the current local business page with `?prototypeState=<id>`. Custom query parameters survive; separate local pages must include the same adapter and compatible state list. Reset restores Fill, the configured default state and original entry, reloading its transient DOM state. It does not erase business localStorage or other authored data. HTTP Preview supports local multi-page navigation; direct `file:` review supports the initial entry and its state presets. An unconnected/external page disables state controls with a visible reason.

The chrome follows the system light/dark preference independently of business styling. Menus close on Escape/outside interaction and return focus to their trigger; labels and stable locators stay available on narrow screens.

| Control | Accessible name / selector |
| --- | --- |
| Size trigger | `Window size`, `[data-testid="prototype-size-trigger"]` |
| Size option | `Window size 1440 px`, `[data-testid="prototype-size-1440"]` |
| Phone option | `Window size Phone · 390 × 844`, `[data-testid="prototype-size-mobile"]` |
| State trigger | `Page state`, `[data-testid="prototype-state-trigger"]` |
| Error option | `Page state Error`, `[data-testid="prototype-state-error"]` |
| Reset | `Reset prototype settings`, `[data-testid="prototype-reset"]` |
| Business frame | `iframe[data-testid="prototype-page"]` |

## Capture and handoff

Capture and `verify-surface` against **businessEntry**, with `?prototypeState=<id>` for a server URL when checking a forced state. This keeps the real business DOM, selected design and requested pixel viewport under review; a wrapper-only scan would miss iframe content. A file-path capture defaults to Ready; use a local HTTP Preview URL to capture other states. The review chrome has its own neutral palette and does not count as business design content.

Also exercise the wrapper's size/state/Reset controls with actual page visibility and iframe viewport assertions. A changed dropdown label alone is not evidence that content changed. Review both themes and relevant narrow widths.

Keep `verify-surface --source <whole-task-dir>` so business files, preview HTML and all `prototype-review/` assets remain fingerprinted. Register the generated **entry** for Preview handoff, include both business and helper source files (plus other authored assets and DESIGN.md), and record business screenshots with their actual viewport widths. The helper's returned source list does not discover other authored screens, CSS or images. Re-run capture/evidence after edits using the existing workflow; no Cucumber/E2E-document generation is added.

## POC to high-fidelity boundary

Size, Page state, Reset, Feature flags and the outer preview frame are review tools, never high-fidelity business content, including in strict-fidelity mode. Do not reproduce their controls, dimensions, neutral toolbar palette or wrapper padding as canvas nodes. Read the preview’s `prototype-review-config` JSON to resolve its `entry` relative to the preview HTML when the business entry is not already known. Use the original business source and business-only captures; retain real navigation, business actions and requested Workspace title bar/Dock/app menus. Dropping review chrome is not a missing screen or a scope deviation.

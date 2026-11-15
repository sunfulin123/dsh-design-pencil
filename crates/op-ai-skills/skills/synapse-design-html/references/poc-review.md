# POC development checks and frozen delivery review

Use the bundled `scripts/review-poc.mjs` entry point for ordinary HTML and Cobalt Workspace POCs. Development checks and delivery evidence serve different purposes; do not run the full handoff gate after every local adjustment.

## Before implementation

Bind the exact selected DESIGN with `resolve-theme.mjs` immediately after saving it. Do not handwrite a substitute guide. The review tool verifies this binding and every generated Workspace shell before opening Chromium or running a final build. A failed preflight is a diagnosis to fix, not a reason to skip validation.

Keep the confirmed screen/action scope. Establish the main business state and action results before building secondary views: when a sample staffing change must affect a metric, both views must derive from the same local sample data. Label illustrative data. Reuse an already confirmed Workspace/standalone choice; ask only if that choice remains unclear and changes the artifact. Read the exact pinned component source and its local Extensions wrapper before adjusting popup behavior or guessing props.

## Develop on the existing managed server

Use SS Preview's configured target and managed install/start lifecycle. Cobalt projects run `pnpm run dev` with Vite/HMR; install dependencies once and reuse that target. Ordinary HTML uses its existing managed local HTTP preview. The review CLI neither installs packages nor starts or stops a development server.

Batch related fixes, then check two or three representative sessions: the main view, its principal dialog and its principal drawer. Choose actual selectors from the implementation. Do not omit requested features to make verification shorter.

```sh
node scripts/review-poc.mjs dev --url http://127.0.0.1:<preview-port>/ --source <task-dir> --out <task-dir> --steps <task-dir>/review/steps.json --sessions main,dialog,drawer
```

Without a plan the tool captures desktop and phone main views. With a plan it defaults to the first three sessions; `--sessions` selects exact names. `--viewports 1440,390` runs the selected sessions at those widths. `--scheme light|dark` emulates the browser appearance; applications with an explicit theme menu still require their own theme actions. Each run launches one browser and reports counts/timings.

Development output stays under `review/dev/` and `review/dev-report.json`. It never builds delivery, overwrites `evidence-report.json` or supplies handoff evidence. A source change during capture fails rather than producing mixed-revision evidence.

## Frame-aware actions and detail images

Keep declarative sessions in `review/steps.json`. Existing actions remain available. Add `frame: "iframe[data-primary-frame]"` to target Workspace business controls, or an array of selectors for nested same-origin frames (maximum four). Ordinary preview wrappers use their business iframe selector. Missing, inaccessible or not-ready frames fail explicitly; an empty outer DOM is not a successful business review.

`click`, `fill` and `press` use Chromium input; Tab, Shift+Tab and Escape exercise real focus/default behavior. `assertFocused` and `assertValue` check the result. `focus`, native `select` and form `submit` retain their explicit DOM/control semantics. Covered or disabled click targets fail; do not force clicks through modal overlays.

A screenshot step may name a `selector` for an element crop, `clip: {x,y,width,height}` for a viewport rectangle, or `frame` for a business-frame image. Read detail crops while fixing local defects. Crops supplement full-viewport evidence; they cannot replace final responsive captures. Existing screenshot steps without a region keep their full-viewport behavior.

## Final review after related changes are complete

For Cobalt, the final entry point builds once and serves that static output on a temporary owned loopback port:

```sh
node scripts/review-poc.mjs final --project <task-dir>/project --source <task-dir> --out <task-dir> --steps <task-dir>/review/steps.json --scope app
```

For ordinary HTML, pass `--entry <task-dir>/preview.html` instead of `--project`; no build is needed. Handoff still registers the copied preview entry with its business HTML and review resources. Final session URLs may use paths/query strings inside static delivery, never an absolute development URL.

For the canonical ordinary preview wrapper, required surface captures resolve its configured business entry; keep separate planned sessions for wrapper Size/state/Reset integration. For Workspace, keep full-shell captures plus business-frame screenshots for handoff/high-fidelity reference. Use each screenshot metadata width as its actual pixel viewport; a business iframe can be narrower than the outer window.

Final review covers full 390x844, 768x1024 and 1440x900 viewports, supplementing planned sessions only where required coverage is missing. It performs interactions, live DOM inspections (including visible same-origin frames) and screenshots in one browser. It waits for generated lazy page loading, visible mask assets and Cobalt icon fonts. Unavailable visible assets fail the capture instead of recording incomplete chrome. Authored sources and editable Extensions receive source lint; compiled delivery and checksum-verified shell copies remain fingerprinted but are not business-style lint targets.

The resulting `review/final/<run-id>/capture.json` binds the source inventory, static entry, inspection scope and PNG hashes. `verify-surface.mjs --capture <capture.json>` verifies and reuses these artifacts without launching another browser. Source additions/deletions/edits, PNG changes, missing full viewports and development captures are rejected. All delivery JS/CSS/assets remain fingerprinted, including generated bundles.

The final ledger deliberately leaves human accessibility, visual/responsive review, content states and action classification pending. Inspect the captured images and actual action results, record only observations made, then run:

```sh
node scripts/verify-surface.mjs --check-evidence <task-dir>/evidence-report.json
```

A new final run archives prior records and images under `review/history/`, marks the current record pending during recapture, and preserves history even if build/capture fails. Never copy old pass statuses onto changed inputs. To check an already completed unchanged review, use `--check-evidence`, not another final run. Any edit after final capture requires a new final run after the related fixes are complete.

When Chromium remains unavailable after its built-in retry, retain the existing honest fallback: `verify-surface.mjs --url <static-entry> --source <task-dir> --out <task-dir>` records unverified rendered coverage. Explain diagnostics and unverified checks; do not loop on custom CDP scripts or invent pass statuses. Static delivery, source/style hashes, presentation order and POC handoff contracts remain unchanged.

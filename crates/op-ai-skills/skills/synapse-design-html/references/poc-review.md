# POC development checks and frozen delivery review

Prefer Browser Use for visible POC interaction and visual review when its tools are available. Keep the bundled `scripts/review-poc.mjs` as the headless fallback and frozen static-delivery verifier for ordinary HTML and Cobalt Workspace POCs. Development checks and delivery evidence serve different purposes; do not run the full handoff gate after every local adjustment.

## Before implementation

Bind the exact selected DESIGN with `resolve-theme.mjs` immediately after saving it. Do not handwrite a substitute guide. The review tool verifies this binding and every generated Workspace shell before opening Chromium or running a final build. A failed preflight is a diagnosis to fix, not a reason to skip validation.

Keep the confirmed screen/action scope. Establish the main business state and action results before building secondary views: when a sample staffing change must affect a metric, both views must derive from the same local sample data. Label illustrative data. Reuse an already confirmed Workspace/standalone choice; ask only if that choice remains unclear and changes the artifact. Read the exact pinned component source and its local Extensions wrapper before adjusting popup behavior or guessing props.

## Local revisions

For a small revision, first name the affected region, adjacent content and key interaction, then batch the related source changes. Reuse the running server and select only those development sessions with `dev --sessions <names>`; inspect a detail crop instead of repeatedly reading the entire page. A shared component, global CSS or responsive change expands the check to its consumers and required widths. Do not repeatedly run final capture while debugging. Group implementation, focused checks and final review as separate phases, and report measured build/browser/capture time separately from unmeasured model or user time.

Prior evidence remains historical after a source change. The current tool binds the complete source inventory; it cannot prove a narrower dependency boundary. Reuse final artifacts only when the verifier accepts their exact source and PNG hashes, never because an agent says a screen was unaffected. Finish with one current build and required static-delivery review. Cross-revision evidence reuse requires dependency-aware tooling and is not supplied by session selection.

## Start and reuse a local development server

Start the development server yourself using the available shell/process tools. For confirmed Cobalt SS tasks use `synapse_design_prototype` install/check for the prepared project. Let its native VPN/network Question complete before retry; distinguish authentication and certificate errors, and do not borrow dependencies or weaken build configuration. Then run `pnpm run dev` in that project through an owned process session. Outside SS, install only in the project and diagnose the actual registry failure before an explicit retry. Read Vite’s actual loopback URL from its output, retain the process handle and wait for a successful HTTP response before browser checks. Vite may choose another port when its default is occupied; use the reported URL without changing or terminating another service. Reuse this process for HMR instead of reinstalling or restarting after each edit. Ordinary HTML can use an existing local HTTP server or an owned server rooted at its task directory.

SS Preview Fill with AI, `.synapse/preview.json` and the SS service list are not prerequisites for POC development. Do not ask the user to configure them or treat an empty service list as a blocker. If the user already has a suitable managed service, it can be reused; do not modify its configuration or stop its process. Keep SS Preview’s static-file handoff for final presentation.

Do not stop after scaffolding. Finish the requested business pages and interactions, install/start the local project and verify them before reporting completion. The review CLI consumes the running URL; it does not install or start the development server. If actual shell execution, package access or permissions are unavailable, report that specific failure and continue independent implementation; never replace the missing capability with repeated requests for Preview setup.

Record the project directory, command, process handle and URL. Stop only processes created for this task, using that handle, when no longer needed; keep a requested review preview available. Never kill by name or port. Report registry/VPN failures rather than substituting components or claiming startup succeeded.

Background jobs are not durable services across a Harness restart. When resuming, check the recorded process handle and actual URL instead of assuming the server survived. If your task-owned server has stopped, restart it from the recorded directory and command, read its new URL and wait for HTTP readiness; do not reinstall unchanged dependencies or stop somebody else's service.

## Review the visible page with Browser Use

After HTTP readiness, use `browser_open` with the actual local URL and retain the returned surfaceId. The tool performs navigation and returns the committed `url` separately from `requestedUrl`; it is not an address-bar fill operation. Confirm meaningful page content with a read and screenshot before saying the prototype is visible. On failure, inspect the returned surfaceId and stage, check your server if needed and reuse that tab. Do not create blank tabs repeatedly or treat address-bar text as proof of navigation. If a separate UI tool edits an address bar, submit with Enter and check the resulting page. Existing configured dev-server/Talkdesk services keep their managed launch, readiness and ownership rules; Talkdesk's Atlas display URL is distinct from its development-server probe URL. Use `browser_read` to get fresh control refs and framePath values; operate the business iframe through those observed frames. Use native click/type/check/select/focus/press tools, then verify the visible application result with another read or screenshot. Source inspection helps identify controls; it never substitutes for the live page. Reuse the same Preview tab so the user sees the actual review and current page state.

Ordinary `browser_screenshot` uses preview quality for quick inspection. For detailed acceptance, request `browser_screenshot({ quality: "original", viewport: true })` without annotations. This opt-in retains the whole captured viewport without the 1280px resize and stores the verbatim PNG as a separate file attachment. The displayed image may still follow attachment normalization. Use the original file and capture width/height, bytes and SHA-256 as evidence; do not treat the displayed image’s dimensions as the original. Copy a needed read-only attachment to the task evidence directory through file tools and verify its hash. An annotated capture is navigation assistance, not clean visual evidence.

Original quality does not resize the Preview viewport or simulate a device. Exercise the prototype’s Size/state controls and application theme in the visible page. If exact outer viewports, a missing interaction, local evidence export or structured DOM inspection cannot be obtained through the exposed tools, use the retained headless fallback for that check. Formal `verify-surface` still requires a frozen capture manifest and full viewport/DOM evidence; an image attachment alone cannot satisfy it.

Do not replay a business action merely because a tool timed out or returned an uncertain result. Read the current page first. Do not assume a separate headless browser shares filled fields, storage or modal state: start a clean, reproducible fallback case and report the engine and coverage actually used. Missing Browser Use tools are a reason to use the fallback, never to ask the user to configure Preview services.

## Review long content without claiming unseen coverage

Use a fresh text `browser_read` to identify the relevant framePath and scrollable container ref. Frame and container scroll geometry reports x/y, viewportWidth/viewportHeight and contentWidth/contentHeight in CSS pixels. `browser_scroll` reports actual movement and the resulting geometry; a zero move can mean the wrong container or a boundary, not completed review.

Capture the starting viewport, scroll about 80% of the target's viewport height, read fresh refs and capture again. Continue until the requested content and bottom controls have actually been reviewed. Record the frame/container, scroll positions and screenshots; check fixed headers, pagination and lazy-loaded content in the real scrolled views. Limit each target to 20 screenshots, and report any remaining range or infinite/virtual content as unverified instead of claiming the entire page passed. DOM text outside the viewport is not visual inspection.

For an additional overview, request `browser_screenshot({ quality: "original", fullPage: true })`. Do not combine fullPage with viewport or annotated. The original PNG covers only the root document's currently loaded content without resizing or scrolling the page; iframe content, internally scrolled tables and virtual lists still require separate viewport checks. Preserve and inspect the original file, not only the normalized display image. Full-document capture is bounded by 32 million physical pixels, a 32768px edge and 20 MiB PNG bytes; use overlapping viewport captures when refused. A long overview cannot replace required viewport screenshots or frozen static evidence.

## Headless development fallback

Batch related fixes, then check two or three representative sessions: the main view, its principal dialog and its principal drawer. Choose actual selectors from the implementation. Do not omit requested features to make verification shorter.

```sh
node scripts/review-poc.mjs dev --url http://127.0.0.1:<preview-port>/ --source <task-dir> --out <task-dir> --steps <task-dir>/review/steps.json --sessions main,dialog,drawer
```

Without a plan the tool captures desktop and phone main views. With a plan it defaults to the first three sessions; `--sessions` selects exact names. `--viewports 1440,390` runs the selected sessions at those widths. `--scheme light|dark` emulates the browser appearance; applications with an explicit theme menu still require their own theme actions. Each run launches one browser and reports counts/timings.

Development output stays under `review/dev/` and `review/dev-report.json`. It never builds delivery, overwrites `evidence-report.json` or supplies handoff evidence. A source change during capture fails rather than producing mixed-revision evidence.

## Frame-aware actions and detail images

Keep declarative sessions in `review/steps.json`. Existing actions remain available. Add `frame: "iframe[data-primary-frame]"` to target Workspace business controls, or an array of selectors for nested same-origin frames (maximum four). Ordinary preview wrappers use their business iframe selector. Missing, inaccessible or not-ready frames fail explicitly; an empty outer DOM is not a successful business review.

`click`, `fill` and `press` use Chromium input; Tab, Shift+Tab and Escape exercise real focus/default behavior. `assertFocused` and `assertValue` check the result. `focus`, native `select` and form `submit` retain their explicit DOM/control semantics. Covered or disabled click targets fail; do not force clicks through modal overlays.

Before a screenshot after a panel transition, use Browser Use `browser_wait` with `kind: "settle"`; it waits for DOM quiet and finite animations, while ignoring infinite loops. In a headless capture plan use `{ "action": "waitFor", "selector": "#panel", "stable": true, "timeoutMs": 5000 }`, with `frame` when needed. This waits for target/ancestor finite motion and stable bounds; it does not alter CSS or stop animation. Then take one screenshot. A timeout is a failed wait, not permission to label an intermediate frame complete.

A screenshot step may name a `selector` for an element crop, `clip: {x,y,width,height}` for a viewport rectangle, or `frame` for a business-frame image. Read detail crops while fixing local defects. Crops supplement full-viewport evidence; they cannot replace final responsive captures. Existing screenshot steps without a region keep their full-viewport behavior.

## Final review after related changes are complete

For Cobalt, the final entry point builds once and serves that static output on a temporary owned loopback port:

```sh
node scripts/review-poc.mjs final --project <task-dir>/project --source <task-dir> --out <task-dir> --steps <task-dir>/review/steps.json --scope app
```

For ordinary HTML, pass `--entry <task-dir>/preview.html` instead of `--project`; no build is needed. Handoff still registers the copied preview entry with its business HTML and review resources. Final session URLs may use paths/query strings inside static delivery, never an absolute development URL.

For the canonical ordinary preview wrapper, required surface captures resolve its configured business entry; keep separate planned sessions for wrapper Size/state/Reset integration. For Workspace, keep full-shell captures plus business-frame screenshots for handoff/high-fidelity reference. Use each screenshot metadata width as its actual pixel viewport; a business iframe can be narrower than the outer window.

Final review covers full 390x844, 768x1024 and 1440x900 viewports, supplementing planned sessions only where required coverage is missing. It performs interactions, live DOM inspections (including visible same-origin frames) and screenshots in one browser. Duplicate DOM findings with identical rule, target, frame/session and message are collapsed; different targets or observations remain separate. Visually hidden native helper controls are excluded only when their own or an ancestor's computed visibility/clipping establishes that they are hidden. It waits for generated lazy page loading, visible mask assets and Cobalt icon fonts. Unavailable visible assets fail the capture instead of recording incomplete chrome. Authored sources and editable Extensions receive source lint; compiled delivery and checksum-verified shell copies remain fingerprinted but are not business-style lint targets.

The resulting `review/final/<run-id>/capture.json` binds the source inventory, static entry, inspection scope and PNG hashes. `verify-surface.mjs --capture <capture.json>` verifies and reuses these artifacts without launching another browser. Source additions/deletions/edits, PNG changes, missing full viewports and development captures are rejected. All delivery JS/CSS/assets remain fingerprinted, including generated bundles.

The final ledger deliberately leaves human accessibility, visual/responsive review, content states and action classification pending. Inspect the captured images and actual action results, record only observations made, then run:

```sh
node scripts/verify-surface.mjs --check-evidence <task-dir>/evidence-report.json
```

A new final run archives prior records and images under `review/history/`, marks the current record pending during recapture, and preserves history even if build/capture fails. Never copy old pass statuses onto changed inputs. To check an already completed unchanged review, use `--check-evidence`, not another final run. Any edit after final capture requires a new final run after the related fixes are complete.

When Chromium remains unavailable after its built-in retry, retain the existing honest fallback: `verify-surface.mjs --url <static-entry> --source <task-dir> --out <task-dir>` records unverified rendered coverage. Explain diagnostics and unverified checks; do not loop on custom CDP scripts or invent pass statuses. Static delivery, source/style hashes, presentation order and POC handoff contracts remain unchanged.

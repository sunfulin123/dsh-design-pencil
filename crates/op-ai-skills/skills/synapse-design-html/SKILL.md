---
name: synapse-design-html
metadata:
  version: synapse-design-html/3
user-invocable: false
description: Internal HTML proof-of-concept sub-skill loaded by synapse-design after context, style, and route selection, using the selected product style guide and evidence ledger.
---

# Synapse Design HTML POC

The HTML proof-of-concept branch of `synapse-design`. Execute Stages A–E in order so every planned screen, state, style binding and browser check completes before handoff. It produces a standalone prototype in the receipt's task directory, never production code unless the user expressly asks; a Cobalt Workspace POC may use the bundled React scaffold compiled to static HTML.

**Rule Precedence:** User instructions > Selected DESIGN specification > This skill > References selected by the loading table below.

## Reference Loading

Read files under `references/` only through this table. At the start of Stages B, C and D, evaluate every row whose stage matches; read every file of each row whose condition holds, and no other reference file. Conditions are facts you can check: discovery receipt fields, the screen and state plan, or the user's own words. Record the matched rows in `<task-dir>/evidence-report.json` as `contextSelection: [{row, stage, files}]`.

| Row | Condition | Stage | Read |
|---|---|---|---|
| `judgement` | always | B | `references/judgement-summary.md`, `references/direction/surface-modes-summary.md` |
| `poc-review` | always | C | `references/poc-review/summary.md` |
| `cobalt` | confirmed style id is `talkdesk-cobalt` and the request is not an explicit standalone page | C | `references/cobalt-workspace/summary.md` |
| `html-review` | confirmed style id is not `talkdesk-cobalt`, or the user explicitly asked for a standalone page | C | `references/html-review/summary.md` |
| `forms` | the screen plan contains a form, input field, validation or settings screen | C | `references/craft/harden-and-edge-cases.md` |
| `layout` | the screen plan contains a card grid, dashboard or section-based page | C | `references/layout-sections-and-cards.md`, `references/craft/craft-floor.md` |
| `direction` | the surface mode from row `judgement` is `Persuade` or `Experience` | B | `references/direction/_index.md` |
| `motion` | the user mentions animation, transitions, motion or micro-interactions | C | `references/motion/_index.md` |
| `imagery` | the plan needs generated, sourced or photographic images | C | `references/imagery/_index.md` |
| `webgl` | the user mentions 3D, WebGL, shaders or Three.js | C | `references/webgl-3d/_index.md` |
| `review` | the user gives revision feedback on an existing prototype | D | `references/review/_index.md` |
| `detail` | a summary paragraph you are applying links its detail, or a judgement or evidence question is not settled by the summary | B, C, D | the linked file, or `references/judgement.md` |

A file named by an index you read is loaded only when its routing rule matches the plan. Record every file read in its row's `files`.

## Stage A — Three-Layer Context & Screen Plan

Follow the same three-layer conversation, project/document, and requirements/style funnel as `synapse-design`:

1. Call `synapse_design_discovery` (`stage: "start"`).
2. On `needs_context`, read relevant project/document files, ask only material unanswered business questions via `ask_user_question`, and call `synapse_design_discovery` (`stage: "context"`) with `taskId`, a substantive `contextSummary` (`>= 40` chars) naming the user, their task and what counts as success, verified `sourceReferences`, `openQuestions`, and the complete `screens` plan (`[{name, states?}]`).
3. Wait for real answers when `needs_questions` or `needs_route` is returned. Never invent user answers or cite unread sources.

**Discover state transitions before submitting the screen plan.** Inspect supplied designs, prototypes and relevant route or event handlers for state controls, including tabs, filters, overlays and alternate data or permission views. Add each meaningful state to its screen's `states` plan, with the trigger and expected visible result in the review plan. An explicit state in the request or reference is in scope even if it is hidden by default.

## Stage B — Style Binding & Mandatory Craft Floor

- Obtain the user's real catalogue choice from resolved `synapse_design_discovery` (Talkdesk Cobalt is a recommendation, not automatic consent). Read the entire returned `DESIGN` specification; never use another theme index, fallback palette, or visual-direction survey. `<task-dir>` is the receipt's `taskDirectory` and holds deliverables only: sources, `DESIGN.md`, `evidence-report.json` and the final run in `evidence/`. `<temp-dir>` is its `temporaryDirectory` for review plans, development runs and history, deleted 72 hours after the last write; without it omit `--temp` and keep plans in `<task-dir>/review/`. To revise an existing prototype, reuse its literal task folder, entry and paths, including older folders.
- Save the exact `design` markdown bytes to `<task-dir>/DESIGN.md` unchanged, then bind the task-local style context:
  `node scripts/resolve-theme.mjs --style-id <guideId> --design-md <task-dir>/DESIGN.md --sha256 <contentHash> --out <task-dir>`
  Set `SYNAPSE_DESIGN_TASK_DIR=<task-dir>` whenever invoking bundled helper scripts.
- **Before authoring HTML,** apply the Stage B rows: classify each screen's surface mode, plan all six content states, settle structure and the three levels of space, and apply the quality floor and evidence rules. Ignore legacy instructions in reference files about alternate palettes, mandatory surveys or other hosts.

## Stage C — Build the Standalone Prototype

Apply the Stage C rows before implementation. Start the development server yourself, keep the confirmed business scope, establish shared sample data and action results first, and read pinned component sources before changing their behavior.

**Cobalt (`talkdesk-cobalt`):** continue the task-owned Workspace project the host prepared with a hash-bound DESIGN.md; never recreate the shell or scaffold twice. Without Cobalt MCP use the bundled fixed-version documentation; pause only if the user explicitly requires MCP. Use `synapse_design_prototype` for preparation, dependency installation and source checks. **Never run `pnpm`, `npm` or `yarn` `install`/`add`/`i` in a shell while `synapse_design_prototype` is available**: install only with its `install` action, which runs in the host with the user's package store; a sandboxed shell leaves a `.pnpm-store/` that `check` and handoff refuse. If `install` fails, report its actual error and retry the action on the same project; if a `.pnpm-store/` is reported, delete it and run `install` again. Never borrow another project's node_modules or remove build plugins or configuration. Only a verified explicit user request selects the standalone bootstrap with ordinary Size/Page state/Reset controls. A scaffold or imported component name is not completed business UI. The POC entry is the compiled `project/delivery/index.html`.

- Author clean HTML/CSS/JavaScript in `<task-dir>` for every planned screen and applicable state. **Connect every exposed state** to distinct business content: Cobalt routes use `usePrototypeScenario()` for Ready, Loading, Empty, Error, Partial and No access; ordinary pages expose states through the review adapter and keep every state shown in the reference.
- **Ordinary HTML review chrome:** following the `html-review` row, copy the fixed code library with `scripts/prepare-html-review.mjs`; never handwrite, redraw or reimplement its toolbar, and add no Feature flags. Deliver the generated `preview.html` with Size, Page state and Reset outside the business iframe.
- Apply the selected `DESIGN` typography, color roles, spacing and component anatomy; preserve user content and label sample data. Write UI text in **English by default**, switching only when the user explicitly asks to design in another language (then one language with CJK typography rules). Use semantic markup, persistent labels, visible focus, `min-width: 0` on flex/grid children, and state switching that exercises every screen in a real browser. Give each primary action an observable result; a control that only says a feature is unavailable is `not-implemented`.
- **Select chevron inset:** never leave a styled `<select>` on default browser `appearance`. Set `appearance: none; -webkit-appearance: none;`, inset a custom chevron `12px–16px` from the right border (`background-position: right 12px center; background-repeat: no-repeat; background-size: 16px 16px`, or a `pointer-events: none` icon at `right: 12px`), and reserve `padding-inline: 12px 38px`. Custom `[role="combobox"]` and `[aria-haspopup="listbox"]` triggers keep `12px–16px` right padding and an `8px–12px` gap before the chevron.

## Stage D — Browser Capture, Surface Gate & Visual Review

1. Review with `scripts/review-poc.mjs` using the development and final commands in the `poc-review` summary, always with `--temp <temp-dir>` when the receipt provides it. Prefer Browser Use while developing and check only the affected two or three sessions; run one final review at each checkpoint (1440x900, 768x1024, 390x844 plus user-required widths). Exercise every planned state through its visible control and assert the business result in the target frame (Cobalt: shell toolbar states, then Reset restores Ready); a selected label or URL is not evidence. Development reports never supply handoff evidence, and any later source change needs a new final run. Never write ad-hoc scripts importing `chrome-cdp.mjs` or `launchHeadlessPage`.
2. Inspect the captured PNGs with an image-capable tool (`read_image`): content completeness first (a gap left by missing content is not whitespace), then whole screen, groups and details across the five rubric dimensions. Record only what you observed in `<task-dir>/evidence-report.json`: `accessibility`, `responsive` and `visualReview` as `pass` + `evidence` or `unverified` + `uncovered`; `contentStates.*` as `pass` + `evidence`, `not-applicable` + `reason` or `unverified` + `uncovered`; `actions` as `{screen, label, kind}` (`verifiable` with observed `evidence`, `visual-only` or `not-implemented`); and `contextSelection`. If Chromium still fails after its retry, pass `--allow-unverified` to `capture-poc.mjs` so `verify-surface.mjs` records unverified rendered coverage, and mark dependent checks honestly. Then confirm `GATE: PASS` with `node scripts/verify-surface.mjs --check-evidence <task-dir>/evidence-report.json`.
3. Fix blocking defects (missing content, unreachable actions, clipping, overlap, overflow, missing key states), then contrast and style drift, and re-verify, for at most three rounds. Source-only checks, blank captures and uninspected screenshots are not passing evidence; never change a status to reach `GATE: PASS`.
4. For revision feedback, locate the defect with a focused development capture, fix its cause and affected siblings together, run one new final review, and report what was found, changed and left unverified. A problem raised twice means the first diagnosis was wrong.

## Stage E — Mandatory POC Presentation, Screenshot Echo & Handoff

Run these steps in strict order; never ask whether to continue to high-fidelity design before the HTML is open and a rendered screenshot is shown in chat:

1. **Record and open:** call `synapse_design_poc_handoff` with `action: "record"`, `taskId`, `discovery`, `entry`, `files`, `evidence` (`<task-dir>/evidence-report.json`) and `screenshots` (`[{path, screen, state?, viewport}]`, `viewport` an integer width such as `1440`; `[]` only when Chromium failed after retry and `renderedEvidence` is `unverified`). Use **absolute paths** inside `<task-dir>`. List only prototype sources and assets (`index.html`, `.css`, `.js`, assets, `DESIGN.md`) in `files`, **excluding `style-context.json`, `evidence-report.json`, `baseline.json`, `evidence/`, `shots/` and `review/`**. Recording verifies DESIGN.md, the ledger, source fingerprints and PNG widths, registers deliverables and **opens `<entry>` in the Preview panel**. End any active `cordis_run` or tool script right after `record`; never call `ask_user_question` in the same script.
2. **Echo:** send a visible message linking `[<entry-filename>](<entry-path>)`, **embedding at least one recorded screenshot as `![<Screen Name>](<primaryScreenshot-path>)`** (or stating that screenshot verification is `unverified`), and summarizing passed and unverified checks and actions by kind.
3. **Ask:** unless `autoContinue: true` was requested up front, call `ask_user_question` with ID `synapse-design-poc:<taskId>` in the user's language: `options[0]` continue from this POC to high-fidelity Synapse design, `options[1]` revise the HTML POC first, `options[2]` keep only the HTML POC for now. The runtime rejects this before `record` or without the screenshot echo.
4. **Continue on approval:** Exclude all prototype-only Size, Page state, Reset, Feature flags and preview-frame UI from the high-fidelity canvas; keep real business navigation and requested Workspace chrome. When the user picks `options[0]` or approves in chat, call `synapse_design_poc_handoff` with `action: "resolve"` and `taskId` in the same turn, then follow `synapse-design` Stages C–G using the returned sources and screenshots as reference data, never HTML import.

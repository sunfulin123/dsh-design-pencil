---
name: synapse-design-html
metadata:
  version: synapse-design-html/3
user-invocable: false
description: Internal HTML proof-of-concept sub-skill loaded by synapse-design after context, style, and route selection, using the selected product style guide and evidence ledger.
---

# Synapse Design HTML POC

This is the HTML proof-of-concept branch of `synapse-design`. Execute Stages A–E in order so every planned screen, state, style binding, and browser verification check completes before handoff. This workflow produces a standalone design prototype under `.synapse/html-design/tasks/<taskId>/`, never production React or application code unless the user expressly requests implementation.

**Rule Precedence:** User instructions > Selected DESIGN specification > This skill > Mandatory shared judgement (`references/judgement.md` and `references/direction/surface-modes.md`) > Optional supporting playbooks under `references/`.

## Stage A — Three-Layer Context & Screen Plan

Follow the same three-layer conversation, project/document, and requirements/style funnel as `synapse-design`:

1. Call `synapse_design_discovery` (`stage: "start"`).
2. On `needs_context`, read relevant project/document files, ask only material unanswered business questions via `ask_user_question`, and call `synapse_design_discovery` (`stage: "context"`) with `taskId`, a substantive `contextSummary` (`>= 40` chars) naming the user, their task and what counts as success, verified `sourceReferences`, `openQuestions`, and the complete `screens` plan (`[{name, states?}]`).
3. Wait for real answers when `needs_questions` or `needs_route` is returned. Never invent user answers or cite unread sources.

## Stage B — Style Binding & Mandatory Craft Floor

- Obtain the user's real catalogue choice from resolved `synapse_design_discovery` (Talkdesk Cobalt is a recommendation, not automatic consent). Read the entire returned `DESIGN` specification; never use another theme index, fallback palette, or visual-direction survey.
- Save the exact `design` markdown bytes to `<task-dir>/DESIGN.md` unchanged, then bind the task-local style context:
  `node scripts/resolve-theme.mjs --style-id <guideId> --design-md <task-dir>/DESIGN.md --sha256 <contentHash> --out <task-dir>`
  Set `SYNAPSE_DESIGN_TASK_DIR=<task-dir>` whenever invoking bundled helper scripts.
- **Mandatory reading before authoring HTML:** Read `references/direction/surface-modes.md` and `references/judgement.md` in full to classify the surface mode (`Operate`, `Persuade`, `Read`, `Experience`), plan all six content states (`loading`, `empty`, `error`, `partial`, `success`, `permission`), decide structure and the three levels of space (design judgement, section 4), and apply the Non-Negotiable Quality Floor and the evidence rules (sections 5–6). Load specialist files (`references/craft/layout-sections-and-cards.md`, `references/craft/craft-floor.md`, `references/review/audit-and-critique.md`, etc.) only when relevant; ignore any legacy instructions about alternate palettes, mandatory surveys, or other hosts.

## Stage C — Build the Standalone Prototype

- Author clean HTML/CSS/JavaScript inside `.synapse/html-design/tasks/<taskId>/` covering every planned screen from Stage A and applicable states from Stage B.
- Apply the selected `DESIGN` typography, color roles, spacing scale, and component anatomy faithfully while preserving user-supplied content and labeling illustrative sample data honestly.
- Write all authored UI text inside the HTML prototype in **English by default** (even when the conversation is in Chinese or another language), switching to another UI language—with full single-language consistency and CJK typography rules—**only** when the user explicitly requests designing in that language. Use semantic markup, persistent form labels, keyboard focus states, overflow-safe flex/grid sizing (`min-width: 0`), and the interactive state switching needed to exercise every planned screen and state in a real browser. Give each primary action an observable result; a control that only announces that a feature is unavailable is `not-implemented` and is reported as such.
- **Dropdown & `<select>` chevron inset:** Never leave a styled `<select>` on default browser `appearance` (which glues the disclosure arrow against the right border and lets text collide with it). Always set `appearance: none; -webkit-appearance: none;`, render a custom chevron inset `12px–16px` from the right border (`background-position: right 12px center; background-repeat: no-repeat; background-size: 16px 16px` or a `pointer-events: none` trailing icon at `right: 12px`), and reserve `padding-inline: 12px 38px` (`padding-right: 36px–40px`). Custom `[role="combobox"]` / `[aria-haspopup="listbox"]` triggers must likewise keep `12px–16px` right padding and `8px–12px` gap before the chevron.

## Stage D — Browser Capture, Surface Gate & Visual Review

1. Capture real Chromium screenshots and run interactive checks in **one single browser session** using `scripts/capture-poc.mjs`:
   - **Multi-viewport & interactive plan (preferred whenever checking multiple viewports, states, or interactive controls):** Write `<task-dir>/review/steps.json` (`{ "timeoutMs": 35000, "sessions": [{ "name": "desktop", "width": 1440, "height": 900, "steps": [...] }, { "name": "mobile", "width": 390, "height": 844, "steps": [...] }] }`, using actions `click`, `fill`, `select`, `submit`, `focus`, `press`, `waitFor`, `assertText`, `assertVisible`, `assertCount`, and `screenshot`) and run:
     `node scripts/capture-poc.mjs --url <local-html-or-server> --steps <task-dir>/review/steps.json [--timeout-ms 35000] [--allow-unverified]`
   - **Single static capture:** `node scripts/capture-poc.mjs --url <local-html-or-server> --out <task-dir>/shots/<name>.png --width <viewportWidth> --height <viewportHeight> [--timeout-ms 35000] [--allow-unverified]`
   - Default viewports are **`1440×900` desktop and `390×844` mobile** (pass `375×812` and `--mobile-width 375` only when the user explicitly requested `375px`). **Never write custom ad-hoc scripts importing `chrome-cdp.mjs` or `launchHeadlessPage` directly.**
   - Then run the surface verification scan:
     `node scripts/verify-surface.mjs --url <local-html-or-server> --source <task-dir> --out <task-dir> [--scope app|page] [--timeout-ms 45000]`
     Note: `verify-surface.mjs` automatically excludes helper directories (`shots/`, `review/`), switches operational workspaces/chat/dashboards to `--scope app`, and fingerprints every prototype source file in `<task-dir>` outside `shots/`, `review/`, `evidence-report.json`, `style-context.json`, and `baseline.json`. If you add or edit any prototype file in `<task-dir>` later, re-run `verify-surface.mjs` so source fingerprints stay current.
2. Inspect the actual captured PNGs with an image-capable tool (`read_image`). Confirm content completeness first (planned content vs. markup vs. the capture; a gap left by missing content is not whitespace), then review at three scales (whole screen, groups, details) across all five rubric dimensions (`task_integrity`, `structure_overflow`, `hierarchy_density`, `style_consistency`, `content_states`). Record what was actually done in `<task-dir>/evidence-report.json`:
   - `accessibility`, `responsive`, `visualReview`: `status: "pass"` + `evidence` naming what was observed, or `status: "unverified"` + `uncovered` naming what was not checked. A tab-order check alone does not verify accessibility; record the rest as `unverified`.
   - `contentStates.*`: `pass` + `evidence`, `not-applicable` + `reason`, or `unverified` + `uncovered`.
   - `actions`: every primary action as `{screen, label, kind}` with `kind` `verifiable` (add `evidence` of the result observed in the browser), `visual-only`, or `not-implemented`.
   - **Honest fallback when Chromium still times out after built-in retry:** Do not loop on custom browser scripts or stall handoff. Pass `--allow-unverified` to `capture-poc.mjs` and let `verify-surface.mjs` record `renderedEvidence` as `status: "unverified"` with stage diagnostics in `uncovered`; mark `visualReview`, `responsive`, and any uncaptured `contentStates` / `actions` honestly (`unverified` + `uncovered`, or `visual-only` for unexercised controls), never faking `"pass"`.
   Then confirm `GATE: PASS`:
   `node scripts/verify-surface.mjs --check-evidence <task-dir>/evidence-report.json`
3. Fix blocking defects (missing content, unreachable actions, clipping, overlap, overflow, missing key states), then contrast and style drift, and re-verify (at most three corrective rounds). Never treat source-only checks, missing/blank captures, or uninspected screenshots as passing evidence, and never change a status to reach `GATE: PASS`.
4. For revision feedback, locate the defect in a fresh capture, fix its cause, check siblings and other screens for the same problem, re-capture the affected scope, and report what was found, what changed and what remains unverified. A problem raised twice means the first diagnosis was wrong.

## Stage E — Mandatory POC Presentation, Screenshot Echo & Handoff

Execute these three steps in strict order—never ask the user whether to proceed to high-fidelity design before opening the HTML artifact and echoing a rendered screenshot in chat:

1. **Record verified POC & open HTML in Preview:** Call `synapse_design_poc_handoff` with `action: "record"`, `taskId`, `discovery`, `entry`, `files`, `evidence` (`<task-dir>/evidence-report.json`), and structured `screenshots` (`[{path, screen, state?, viewport}]`, where `viewport` is the integer pixel width such as `1440` or `390`, or `[]` only when Chromium failed after retry and `renderedEvidence` is recorded as `unverified`). Pass **absolute paths** inside `<task-dir>` for `entry`, `evidence`, `files`, and `screenshots[].path`, and list only prototype source/asset files (`index.html`, `.css`, `.js`, assets, `DESIGN.md`) in `files`—**exclude `style-context.json`, `evidence-report.json`, `baseline.json`, `shots/`, and `review/`**, which are verifier metadata rather than fingerprinted source files. Recording verifies `DESIGN.md`, the evidence ledger, source fingerprints, and PNG viewport widths, registers the HTML entry and screenshots as deliverables, and **proactively opens `<entry>` in the right-hand Preview panel**. End any active `cordis_run` / tool script immediately after `record` succeeds; do **not** call `ask_user_question` in the same script before emitting your presentation message.
2. **Echo rendered screenshot & HTML link in chat:** Output a visible assistant message that links the HTML prototype (`[<entry-filename>](<entry-path>)`), **embeds at least one recorded screenshot inline via Markdown image syntax `![<Screen Name>](<primaryScreenshot-path>)`** when screenshots were captured (or states explicitly that Chromium screenshot verification is `unverified` when degraded), and summarizes checks reported as passed or unverified plus actions by kind (`verifiable`, `visual-only`, `not-implemented`).
3. **Pop up the option card (`ask_user_question`):** Unless `autoContinue: true` was explicitly requested up front, call `ask_user_question` (question ID `synapse-design-poc:<taskId>`, phrased in the user's conversation language with `options[0]`: continue from this POC to high-fidelity Synapse design, `options[1]`: revise the HTML POC first, `options[2]`: keep only the HTML POC for now). Calling `ask_user_question` before `record` or without echoing `![...](<screenshot-path>)` in an assistant message after `record` is rejected by the runtime gate.
4. **Immediate continuation on approval:** As soon as the user selects `options[0]` (or approves in chat or custom text), call `synapse_design_poc_handoff` with `action: "resolve"` and `taskId` immediately in the same turn, then follow `synapse-design` Stages C–G using the returned source files and screenshots as reference data—never HTML import.

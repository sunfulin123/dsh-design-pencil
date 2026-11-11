---
name: synapse-design-html
metadata:
  version: synapse-design-html/2
description: Create, verify, and hand off a standalone HTML proof of concept for a Synapse design task using the selected product style guide and evidence ledger.
---

# Synapse Design HTML POC

This is the HTML proof-of-concept branch of `synapse-design`. Execute Stages A–E in order so every planned screen, state, style binding, and browser verification check completes before handoff. This workflow produces a standalone design prototype under `.synapse/html-design/tasks/<taskId>/`, never production React or application code unless the user expressly requests implementation.

**Rule Precedence:** User instructions > Selected DESIGN specification > This skill > Mandatory shared judgement (`references/judgement.md` and `references/direction/surface-modes.md`) > Optional supporting playbooks under `references/`.

## Stage A — Three-Layer Context & Screen Plan

Follow the same three-layer conversation, project/document, and requirements/style funnel as `synapse-design`:

1. Call `synapse_design_discovery` (`stage: "start"`).
2. On `needs_context`, read relevant project/document files, ask only material unanswered business questions via `ask_user_question`, and call `synapse_design_discovery` (`stage: "context"`) with `taskId`, a substantive `contextSummary` (`>= 40` chars), verified `sourceReferences`, `openQuestions`, and the complete `screens` plan (`[{name, states?}]`).
3. Wait for real answers when `needs_questions` or `needs_route` is returned. Never invent user answers or cite unread sources.

## Stage B — Style Binding & Mandatory Craft Floor

- Obtain the user's real catalogue choice from resolved `synapse_design_discovery` (Talkdesk Cobalt is a recommendation, not automatic consent). Read the entire returned `DESIGN` specification; never use another theme index, fallback palette, or visual-direction survey.
- Save the exact `design` markdown bytes to `<task-dir>/DESIGN.md` unchanged, then bind the task-local style context:
  `node scripts/resolve-theme.mjs --style-id <guideId> --design-md <task-dir>/DESIGN.md --sha256 <contentHash> --out <task-dir>`
  Set `SYNAPSE_DESIGN_TASK_DIR=<task-dir>` whenever invoking bundled helper scripts.
- **Mandatory reading before authoring HTML:** Read `references/direction/surface-modes.md` and `references/judgement.md` in full to classify the surface mode (`Operate`, `Persuade`, `Read`, `Experience`), plan all six content states (`loading`, `empty`, `error`, `partial`, `success`, `permission`), and apply the 12-check Non-Negotiable Quality Floor. Load specialist files (`references/craft/layout-sections-and-cards.md`, `references/craft/craft-floor.md`, `references/review/audit-and-critique.md`, etc.) only when relevant; ignore any legacy instructions about alternate palettes, mandatory surveys, or other hosts.

## Stage C — Build the Standalone Prototype

- Author clean HTML/CSS/JavaScript inside `.synapse/html-design/tasks/<taskId>/` covering every planned screen from Stage A and applicable states from Stage B.
- Apply the selected `DESIGN` typography, color roles, spacing scale, and component anatomy faithfully while preserving user-supplied content and labeling illustrative sample data honestly.
- Use semantic markup, persistent form labels, keyboard focus states, overflow-safe flex/grid sizing (`min-width: 0`), language consistency (full CJK localization when requested), and the interactive state switching needed to exercise every planned screen and state in a real browser.
- **Dropdown & `<select>` chevron inset:** Never leave a styled `<select>` on default browser `appearance` (which glues the disclosure arrow against the right border and lets text collide with it). Always set `appearance: none; -webkit-appearance: none;`, render a custom chevron inset `12px–16px` from the right border (`background-position: right 12px center; background-repeat: no-repeat; background-size: 16px 16px` or a `pointer-events: none` trailing icon at `right: 12px`), and reserve `padding-inline: 12px 38px` (`padding-right: 36px–40px`). Custom `[role="combobox"]` / `[aria-haspopup="listbox"]` triggers must likewise keep `12px–16px` right padding and `8px–12px` gap before the chevron.

## Stage D — Browser Capture, Surface Gate & Visual Review

1. Capture real Chromium screenshots for every planned screen and relevant state/viewport using `scripts/capture-poc.mjs --url <local-html-or-server> --out <task-dir>/shots/<name>.png --width <viewportWidth> --height <viewportHeight>` (for example `1440` desktop or `375` mobile) and run the verification scan:
   `node scripts/verify-surface.mjs --url <local-html-or-server> --source <task-dir> --out <task-dir>`
   Note: the initial scan seeds `accessibility`, `responsive`, `visualReview`, and `contentStates.*` as `"pending"` (exiting `GATE: OPEN`) and fingerprints every file in `<task-dir>` outside `shots/`, `review/`, `evidence-report.json`, `style-context.json`, and `baseline.json`. If you add or edit any file in `<task-dir>` later, re-run `verify-surface.mjs` so source fingerprints stay current.
2. Inspect the actual captured PNGs with an image-capable tool (`read_image`) across all five rubric dimensions (`task_integrity`, `structure_overflow`, `hierarchy_density`, `style_consistency`, `content_states`), update `accessibility`, `responsive`, `visualReview` (`status: "pass"` + `evidence`), and all six `contentStates` entries (`status: "pass"` + `evidence` or `status: "not-applicable"` + `reason`) in `<task-dir>/evidence-report.json`, then confirm `GATE: PASS`:
   `node scripts/verify-surface.mjs --check-evidence <task-dir>/evidence-report.json`
3. Fix confirmed P0/P1 defects, layout overflow, contrast issues, or style drift and re-verify (at most three corrective rounds). Never treat source-only checks, missing/blank captures, or uninspected screenshots as passing evidence.

## Stage E — Verified Handoff & Optional Synapse Continuation

- Call `synapse_design_poc_handoff` with `action: "record"`, `taskId`, `discovery`, `entry`, `files`, `evidence` (`<task-dir>/evidence-report.json`), and structured `screenshots` (`[{path, screen, state?, viewport}]`) covering every planned screen so the host verifies `DESIGN.md`, the evidence ledger, source fingerprints, and PNG viewport widths.
- Present the verified prototype and wait for user feedback unless automatic continuation was explicitly requested.
- When the user approves continuing to editable high-fidelity design, call `synapse_design_poc_handoff` with `action: "resolve"` and `taskId`, then follow `synapse-design` Stages C–G using the returned source files and screenshots as reference data—never HTML import.

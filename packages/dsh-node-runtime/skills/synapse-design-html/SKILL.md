---
name: synapse-design-html
metadata:
  version: synapse-design-html/1
description: Create and verify a standalone HTML proof of concept for a Synapse design task using the selected product style guide.
---

# Synapse Design HTML POC

This is the HTML branch of `synapse-design`. It creates a prototype for design review, not production React or application implementation. Respect a user's explicit request for an independent HTML prototype. Use the host's ordinary file and sandbox permissions; do not change application source unless the user expressly asks.

## Context and style

Use the same three-layer conversation, project/document, and requirements/style funnel as `synapse-design`. Call `synapse_design_discovery`, follow `needs_context`, `needs_questions`, and `needs_route` if returned, then use the user's actual style choice. Read the entire selected DESIGN returned by the product catalogue. Do not use another theme index, fallback palette, or separate visual-direction survey. Talkdesk Cobalt is a recommendation, not automatic consent.

## Create the prototype

Build a standalone HTML/CSS/JavaScript POC under `.synapse/html-design/tasks/<taskId>/`. Plan the complete requested scope before adding new elements. Reuse the selected guide's typography, colors, spacing and components, and preserve explicit user adjustments. Keep content truthful and label assumed data. Use semantic markup, keyboard focus, useful control states, responsive layouts, and the minimum interaction needed to test the user's scenario. Choose layout yourself from the requirements; ask only material unanswered business questions.

Choose the surface mode from the user's task: operating an application, persuading, reading, or an immersive experience. For existing or reference-based designs, first preserve the complete requested content and measure the relevant structure, typography, states and viewport. Plan loading, empty, error, partial, success and permission states, marking inapplicable ones with reasons. Consult `references/direction/surface-modes.md`, `references/craft/layout-sections-and-cards.md`, `references/review/audit-and-critique.md` and the other bundled references only when relevant. They are optional supporting material: this skill, the user's instructions and the selected product DESIGN override legacy instructions for alternate palettes, themes, mandatory questions, agents, host tools and output paths.

## Verify and hand off

Save the exact complete `design` returned by resolved `synapse_design_discovery` in the task directory as `DESIGN.md`, without adding or changing bytes. Use the accompanying `guideId` and `contentHash` to run `node scripts/resolve-theme.mjs --style-id <id> --design-md <task-dir>/DESIGN.md --sha256 <contentHash> --out <task-dir>`; this checks the local guide bytes and creates task-local style context, but the host still verifies the actual user selection. Set `SYNAPSE_DESIGN_TASK_DIR` to the same task directory when running optional legacy tools.

Open the actual POC in a browser and capture real screenshots of the required pages and states at the relevant viewport sizes. `scripts/capture-poc.mjs --url <local-html-or-server> --out <task-dir>/shots/<name>.png --width 1440 --height 900` captures one local page. `scripts/verify-surface.mjs --url <local-html-or-server> --source <task-dir> --out <task-dir>` also performs the migrated source, browser, state and evidence checks. Use the target device sizes relevant to the task; never treat an unavailable detector, missing screenshot or source-only check as a pass. The evidence ledger requires a separate visual-review observation after an image-capable model has inspected the actual capture, interaction/accessibility observations, and pass or justified not-applicable status for each content state.

Check content fit, hierarchy, contrast, keyboard interaction, overflow and missing assets; evaluate aesthetic findings against the user's actual style, not a generic ban on a font, color or layout. Fix and retest, up to three rounds. Record the renderer, viewport, page/state and source version. Report unavailable fonts, browser failures, unreviewed images or unverified interactions rather than claiming success. Deterministic checks and heuristic critique do not constitute user testing or accessibility certification.

Save task-specific source and screenshots without overwriting other chats' work. Call `synapse_design_poc_handoff` with `action: "record"`, the discovery `taskId`, `entry`, `files` and `screenshots` to bind evidence to the selected style and current chat. Present the prototype and wait for feedback unless the user explicitly asked to continue automatically. On approval, call the same tool with `action: "resolve"` and the same `taskId`; the `synapse-design` skill reads the returned files and screenshots as reference data and constructs editable Synapse nodes. Do not use HTML import as a substitute for native Synapse design.

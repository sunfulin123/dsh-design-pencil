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

Consult `references/layout-sections-and-cards.md` and `references/harden-and-edge-cases.md` when appropriate. User instructions and the selected DESIGN take precedence over general craft advice in these references. Never introduce a separate style library from those references.

## Verify and hand off

Open the actual POC in a browser and capture real screenshots of the required pages and states at the relevant viewport sizes. The bundled script `scripts/capture-poc.mjs --url <local-html-or-server> --out <task-dir>/shots/<name>.png --width 1440 --height 900` captures a local page with Chromium and reports its renderer, dimensions and hash. Check content fit, hierarchy, contrast, keyboard interaction, overflow and missing assets; fix and retest, up to three rounds. Record the renderer, viewport, page/state and source version. Report unavailable fonts, browser failures or unverified interactions rather than claiming success.

Save task-specific source and screenshots without overwriting other chats' work. Call `synapse_design_poc_handoff` with `action: "record"`, the discovery `taskId`, `entry`, `files` and `screenshots` to bind evidence to the selected style and current chat. Present the prototype and wait for feedback unless the user explicitly asked to continue automatically. On approval, call the same tool with `action: "resolve"` and the same `taskId`; the `synapse-design` skill reads the returned files and screenshots as reference data and constructs editable Synapse nodes. Do not use HTML import as a substitute for native Synapse design.

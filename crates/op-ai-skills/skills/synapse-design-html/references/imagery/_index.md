> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Imagery Domain Index (`references/imagery/`)

> **Stage:** Stage 2 (Visual Asset Planning, Generation & Photography)
> **Purpose:** Routes between the `imagegen` × `gpt-image-2` synthesis guides and full source playbooks from `imagegen`, `gpt-image-2`, `design-taste-frontend`, and `hallmark`.

---

## 1. Conflict Resolution Rules in This Domain

1. **Code-First UI Boundary (`imagegen` Wins Over `gpt-image-2` UI Mockups):** UI chrome, buttons, dashboards, charts, diagrams, and icons must ALWAYS be built in live HTML/CSS/SVG. Never generate raster screenshots of fake UI chrome.
2. **Task-local assets:** Save generated or licensed POC images within the current `.synapse/html-design/tasks/<taskId>/` directory; do not modify business project assets without a separate request.
3. **Clear provenance:** Include required credits and explanatory captions where appropriate for the actual content and license.

---

## 2. Primary Synthesis Guides (Read First)

| File | When to Load |
|---|---|
| [`imagegen-prompting-and-photos.md`](imagegen-prompting-and-photos.md) | **Read first whenever imagery is considered:** Code-vs-raster boundary, Mode A/B/C detection (`scripts/check-mode.js`), 11-line Labeled Prompt Spec, edit invariants, and save-path policy. |
| [`gpt-image-2-templates.md`](gpt-image-2-templates.md) | **Read for complex commercial renders:** Structured English JSON templates for studio product heroes, hardware exploded views, and wide web hero scenes. |

---

## 3. Full De-Conflicted Source Playbooks (Load for Deep Specialist Needs)

- [`imagegen-prompting-best-practices.md`](imagegen-prompting-best-practices.md) — Full `imagegen` prompting taxonomy, specificity policy, in-image text rules, and multi-image compositing.
- [`imagegen-sample-prompts.md`](imagegen-sample-prompts.md) — Copy-paste prompt specs for website assets, product shots, cutouts, and game assets.
- [`imagegen-api-reference.md`](imagegen-api-reference.md) — Model sizes (`1024x1024` up to `3840x2160` 4K), quality tiers, and transparency parameters.
- [`taste-licensed-photos.md`](taste-licensed-photos.md) — Sourcing, sizing, and crediting licensed real photography (`design-taste-frontend`).
- [`taste-icons-system.md`](taste-icons-system.md) — Using authentic full-color product/tool icons vs. consistent vector stroke icons.
- [`hallmark-imagery-rules.md`](hallmark-imagery-rules.md) — High-craft art direction for photography, aspect ratios, and avoiding stock clichés.

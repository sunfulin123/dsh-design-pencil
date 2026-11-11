> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Review, Audit & Polish Domain Index (`references/review/`)

> **Stage:** Stage 5 (Multi-Gate Review, Screenshot Inspection & Polish Loop)
> **Purpose:** Routes between the Stage 5 synthesis guides and all 14 source review playbooks from `impeccable`, `ui-animation`, and `Nutlope/hallmark`.

---

## 1. Mandatory Execution Sequence in Stage 5

1. **Capture and inspect:** Run `scripts/verify-surface.mjs` in the task directory and inspect the actual screenshots at the applicable viewport sizes. A captured image is not itself a visual review.
2. **Assess:** Review the user's task, relevant content states, hierarchy, usability, interaction, and selected DESIGN. Record checked, unsupported and indeterminate areas with evidence.
3. **Fix and retest:** Fix confirmed issues in priority order, repeat the relevant checks and screenshots, and stop after at most three rounds. Report missing evidence and unresolved issues rather than declaring success.

---

## 2. Primary Synthesis Guides (Read First in Stage 5)

| File | When to Load |
|---|---|
| [`audit-and-critique.md`](audit-and-critique.md) | Optional visual and usability review lenses; adapt scoring, states and interaction checks to the actual surface. |
| [`animation-review-standards.md`](animation-review-standards.md) | Optional motion review when animation is in scope. |
| [`polish-and-refinement.md`](polish-and-refinement.md) | Optional issue prioritization and refinement guidance; the product catalogue remains the style source. |

---

## 3. Full De-Conflicted Source Playbooks (Load for Deep Specialist Needs)

### From `impeccable`
- [`impeccable-audit.md`](impeccable-audit.md) — Full 5-dimension technical audit specification (A11y, Performance, Theming, Responsive, Implementation Integrity).
- [`impeccable-critique.md`](impeccable-critique.md) — Dual isolated sub-agent Assessment A (Design Review, Nielsen 10 heuristics, cognitive load) & Assessment B (Detector + Browser).
- [`impeccable-finish-reviewer.md`](impeccable-finish-reviewer.md) — Fresh-eyes finishing review protocol (Check 0 evidence lock + `TYPE/MATERIAL/GROUND` matrix).
- [`impeccable-polish.md`](impeccable-polish.md) — Full pre-ship refinement workflow across flow, layout, type, color, states, and code cleanup.
- [`impeccable-distill.md`](impeccable-distill.md) — Stripping over-engineered or cluttered UIs to their essential form.
- [`impeccable-bolder.md`](impeccable-bolder.md) — Amplifying timid or generic designs into committed visual worlds.
- [`impeccable-quieter.md`](impeccable-quieter.md) — Toning down overstimulating or noisy interfaces for daily operational use.
- [`impeccable-document-design-md.md`](impeccable-document-design-md.md) — Documenting durable design tokens and component rules in `DESIGN.md`.

### From `ui-animation` & `Nutlope/hallmark`
- [`uianim-review-format.md`](uianim-review-format.md) — Full motion review checklist, Flag-on-Sight triggers, and tiered verdict format.
- [`hallmark-review-hero.md`](hallmark-review-hero.md) — Cold-reviewing the isolated hero viewport before building the rest of the page.
- [`hallmark-review-finish.md`](hallmark-review-finish.md) & [`hallmark-gates.md`](hallmark-gates.md) — Floor, Reflex, and Finish gate tiers for anti-slop browser verification.
- [`hallmark-redesign-kept.md`](hallmark-redesign-kept.md) — Ensuring redesigns preserve 100% of existing links, form fields, handlers, and content (`--snapshot-before` / `--baseline`).

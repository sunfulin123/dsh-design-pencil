> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Polish, Distill, Bolder & Quieter Refinement Loop

> **Source:** Migrated and de-conflicted from `impeccable` (`polish.md`, `distill.md`, `bolder.md`, `quieter.md`, `document.md`).
> **Stage:** Stage 5 (Post-Review Triage & Final Pass).
> **Role:** Guides how to fix audit/critique findings without breaking the committed visual direction, how to calibrate visual intensity (`bolder` vs. `quieter` vs. `distill`), and how to persist `DESIGN.md`.

---

## 1. Strict Five-Step Polish Triage Order (`polish.md`)

Polish is refinement, never concealed redesign. Preserve the committed visual world, content, and wiring, and fix findings from [`audit-and-critique.md`](audit-and-critique.md) (§4 `P0–P3`) in this strict order:

1. **Step 1 — Broken Tasks & Layout Regressions (`P0`):** Fix broken interactions, console errors, horizontal overflow (`320px/375px`), overlapping elements, and missing `--kept` redesign baselines.
2. **Step 2 — Missing Content & Control States (`P1`):** Complete all 6 content states (`loading/empty/error/partial/success/permission`), control states (`default/hover/focus-visible/active/disabled`), and `≥ 44×44px` (`≥ 8px` gap) tap targets.
3. **Step 3 — Contrast, Hierarchy & Token Drift (`P1/P2`):** Fix WCAG AA contrast (`≥ 4.5:1` body, `≥ 3:1` large/UI), replace hardcoded hex literals with semantic CSS variables, and enforce `margin-top > margin-bottom` on headings + `tabular-nums`.
4. **Step 4 — Motion & Browser Surface Cohesion (`P2/P3`):** Apply the 9-step Remedial Hierarchy from [`animation-review-standards.md`](animation-review-standards.md) and theme `::selection`, `caret-color`, `scrollbar-color`, and `:focus-visible`.
5. **Step 5 — Code Cleanup & Re-Verify (`P3`):** Remove dead styles/logs and re-run `verify-surface.mjs --quick` until `GATE: PASS`.

---

## 2. Directional Calibration Lenses (`distill` / `bolder` / `quieter`)

When the rendered screenshot check in Stage 5 reveals that the overall feel is too cluttered, too timid, or too noisy, apply the matching lens:

### A. `Distill` (When the Screen Feels Cluttered or Over-Engineered)
- **Strip to Essence:** Remove decorative badges, secondary sub-labels, redundant stat pills, and wrapper cards around content that can sit directly on the canvas ground.
- **Proximity Over Borders:** Replace box borders and divider lines with whitespace (`24px–48px`) wherever grouping is already clear.
- **One Primary Action:** Demote competing secondary buttons to quiet text or tonal links.

### B. `Bolder` (When a `Persuade` / `Experience` Page Looks Safe or Bland)
- **Increase Scale Contrast:** Push the hero display headline up (`clamp(3rem, 6vw, 5.5rem)`, tracking `-0.03em`) while keeping body copy compact (`16px`).
- **Commit the Ground:** Replace timid white/gray backgrounds with the committed material palette (`parchment`, `titanium`, `obsidian`, or a bold brand band).
- **Enlarge the Subject:** Make the product visual or live `app-frame` dominate its stage instead of sitting mid-sized inside a gray padded box.

### C. `Quieter` (When an `Operate` / `Read` Screen Feels Loud or Exhausting)
- **Pull Back Saturation:** Restrict full-strength `--accent` to the single primary button and active selection indicator; move backgrounds and sidebars to calm tonal neutrals.
- **Cut Motion & Shadows:** Remove entrance staggers, hover scales, and wide drop shadows; use crisp `1px` structural borders and instant `0ms–140ms` state feedback.

---

## 3. Persisting `DESIGN.md` & Appearance Ledger (`document.md`)

- **Multi-Page Projects:** When building or establishing a multi-page application that lacked a `DESIGN.md`, write the finalized tokens (color roles, font families, type scale, spacing scale, elevation rule, and component conventions) to `DESIGN.md` (or `design-system/MASTER.md`) so future sessions inherit them automatically in Stage 0.
- **Appearance Ledger Update:** Record the project's shipped ground hex, accent hex, font pairing, and hero archetype in `~/.synapse-design/appearance-ledger.json` so subsequent greenfield projects stay fresh and distinct.

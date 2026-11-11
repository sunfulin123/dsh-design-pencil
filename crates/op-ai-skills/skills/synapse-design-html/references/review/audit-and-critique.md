> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Audit, Critique & Finish-Reviewer Protocol

> **Source:** Migrated and de-conflicted from `impeccable` (`audit.md`, `critique.md`, `degraded/finish-reviewer.md`) and `affaan-m/ECC` (`check-evidence.js`).
> **Stage:** Stage 5 (Multi-Gate Review).
> **Role:** Defines the deterministic machine gate, the Check 0 screenshot lock, the dual-lens UX Critique, and the 20-point Technical Audit rubric.

---

## 1. Check 0: Rendered Screenshot Evidence Lock (`finish-reviewer.md`)

Before scoring or claiming completion, verify that real rendered captures exist and are valid:
1. Run the verification gate script:
   ```bash
   node <skill-dir>/scripts/verify-surface.mjs --url <http-url-or-html-file> --source <source-path> --out <task-dir>
   ```
2. **Inspect actual captures:** Use the host's image-viewing capability to examine the recorded PNGs for the task's required viewports. If image inspection is unavailable, record visual review as unverified.
3. **Disposition Check:** If any screenshot is missing, 0 bytes, blank/black, or showing a bundler error overlay, the disposition is **`RECAPTURE`**. Fix the runtime issue and re-capture before evaluating anything else. Never review a UI from source code alone.

---

## 2. Fidelity Trio & Design Critique (`impeccable critique` × `finish-reviewer`)

Review against the requirements and the chosen style; use a separate reviewer only when the user and host workflow authorize one. Evaluate:

### A. Mandatory Fidelity Matrix (`TYPE` / `MATERIAL` / `GROUND`)
| Axis | Verification Question | Failure Mode to Hunt |
|---|---|---|
| **`TYPE`** | Do typography and line lengths support the selected style and content? | Unavailable fonts, cramped text, or overflow at the required viewport. |
| **`MATERIAL`** | Do surfaces, depth, controls, and media support the intended visual hierarchy? | Unintentional nesting, confusing elevation, or irrelevant media. |
| **`GROUND`** | Are backgrounds and contrast consistent with the selected DESIGN? | Accidental changes that undermine readability or the chosen style. |

### B. Cognitive Load & Usability Heuristics (`critique.md`)
- **First-Viewport 3-Second Test:** Can a visitor immediately tell what the product is, who it is for, and where the **one primary action** sits?
- **Choice Overload Gate:** Flag any decision group with `> 4` ungrouped visible options or competing primary CTAs.
- **Nielsen 10 Heuristics Check:** Verify system status visibility, real-world language, user control/undo, consistency, error prevention, recognition over recall, keyboard efficiency, minimalist data-ink ratio, actionable error recovery, and contextual help.

---

## 3. Technical Quality Audit Rubric (20-Point Scale, `audit.md`)

Use the following dimensions when applicable. A numeric score is optional and cannot substitute for recorded evidence or the actual requirements:

| # | Dimension | Score (`0–4`) | Mandatory Checks |
|---|---|---|---|
| **1** | **Accessibility (A11y)** | `?/4` | Check actual contrast, focus, labels, semantics, alt text, and reduced motion when applicable. |
| **2** | **Performance** | `?/4` | Inspect relevant animation, image sizing, layout stability, and off-screen work in the browser. |
| **3** | **Theming & Tokens** | `?/4` | Compare with the selected DESIGN and existing variables; preserve intentional local overrides. |
| **4** | **Responsive Design** | `?/4` | Check relevant screen sizes, overflow, target size, and sticky content in the browser. |
| **5** | **Implementation Integrity** | `?/4` | Check truthful copy, applicable content states and preservation of requested existing content. |

---

## 4. Tagging Findings by Severity (`P0–P3`)

- **`P0` Blocking:** Broken core flow, horizontal overflow, overlapping/colliding elements, runtime console error, or missing `--kept` redesign element. **Must fix immediately.**
- **`P1` Major:** Missing a required applicable state or a measured accessibility or interaction defect. Report unsupported checks instead of assuming failure or success.
- **`P2` Moderate:** Hierarchy weakness, spacing rhythm drift, vague CTA wording, or un-themed browser surfaces. **Fix in polish pass.**
- **`P3` Polish:** Optical kerning/alignment, `text-wrap: balance/pretty`, minor code cleanup.

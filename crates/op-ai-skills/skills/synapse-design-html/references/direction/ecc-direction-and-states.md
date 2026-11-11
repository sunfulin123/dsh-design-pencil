> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# ECC Design Direction & 6-State Contract

> **Source:** Migrated and de-conflicted from `affaan-m/ECC` (`frontend-design-direction`).
> **Stage:** Stage 1 (Ideation) & Stage 2 (Spec).
> **Role:** Vanguard direction-setting and mandatory content-state contract before writing UI code.

---

## 1. The 5-Point Design Direction Contract

Before writing code on any surface without an existing `DESIGN.md`, lock these 5 decisions:

1. **Purpose:** What concrete job does the interface perform for the user?
2. **Audience & First Scan:** Who repeats this workflow, and what must they scan in the first 3 seconds?
3. **Tone:** Choose an explicit register matched to the domain (`Utilitarian`, `Editorial`, `Industrial Precision`, `Refined Craft`, `Technical Telemetry`, `Dense Operations`, `Calm Reading`, `Playful Physical`, or `Monumental Showcase`—never generic "modern and clean").
4. **Memorable Detail:** One specific visual or interactive idea grounded in the product's mechanism that makes the surface feel authored rather than templated.
5. **Constraints:** Framework/stack, target viewports (`375px`, `768px`, `1440px`), accessibility floor (WCAG AA), and existing tokens/components.

**Domain-to-Direction Rule:**
- A SaaS operations tool, admin console, or editor (`Operate` mode) must be dense, quiet, and scannable. Never force a marketing landing-page hero onto a daily-use tool.
- Build the actual usable experience on the first screen unless the user explicitly asks for marketing copy.

---

## 2. Mandatory 6 Content States Contract

Before implementation, record the trigger, visible feedback, and safe recovery/next action for all 6 states:

| State | Required Implementation & UX Check |
|---|---|
| **`loading`** | Stable skeleton/shimmer matching final geometry (`CLS = 0`), progress feedback, and disabled duplicate submit triggers; cancellation where supported. |
| **`empty`** | Plain explanation of why no data is shown + one immediate, useful next action (e.g., `Reset filters`, `Create first item`, `Load sample dataset`). |
| **`error`** | Specific failure explanation placed inline near the offending field (`aria-live="polite"`) or surface + a concrete recovery action (`Retry`, `Edit input`). |
| **`partial`** | Render available data cleanly and explicitly mark unavailable, pending, or streaming portions without breaking layout geometry. |
| **`success`** | Confirm completion in place on the triggering control (e.g., `Saved`, `Added to bag · Undo`) and expose the next logical step or supported undo. |
| **`permission`** | Explain the access boundary plainly and provide a safe request-access or return path (mark `not-applicable` with a concrete reason on public surfaces). |

**Hard Rules for 6-State Execution & Verification:**
1. **No Fake Excuses:** Record a specific reason when a state genuinely does not apply. "Untested" or "no backend yet" is never a valid reason to mark a state `not-applicable`—expose a state switcher in the `Tweaks` panel so every applicable state can be inspected.
2. **Global `[hidden]` CSS Reset Mandatory:** Always declare `[hidden] { display: none !important; }` in the base stylesheet. Author rules like `.product-grid { display: grid; }` have higher specificity than the browser's user-agent `[hidden]` rule and will silently keep normal cards visible during `empty`, `loading`, `error`, or `permission` states unless `!important` is set.
3. **Strict Mutual Exclusion:** Replacement states (`loading`, `empty`, `error`, `permission`) must hide the normal content container (`[data-state-normal]` / primary grid) completely. Never stack an empty/error banner above still-visible normal items.
4. **Viewport Visibility & Scope Clarity:** If the `Tweaks` state switcher controls a specific section rather than the whole page, label the target scope inside `Tweaks` (e.g., `Scope: Catalog Grid`) and automatically scroll that section into the viewport (`window.scrollTo({ top, behavior: 'smooth' })`) whenever a user or reviewer switches states while scrolled elsewhere.
5. **Bidirectional Recovery Loop:** Clicking the recovery CTA inside `empty` (`Reset filters`), `error` (`Retry`), or `permission` (`Return`) must both restore the `normal` view and sync `aria-pressed="true"` on the `Tweaks` panel back to `Normal`.

---

## 3. Core Implementation Directives

- **Reuse First:** Use existing project components, CSS variables, icon libraries, and routing patterns before introducing new primitives.
- **Multi-Dimensional Palettes:** Avoid interfaces dominated by a single hue family; define distinct canvas, elevated surface, primary/secondary ink, border, and semantic status tokens.
- **Stable Geometry Across States:** Grids, aspect ratios, min/max widths, toolbars, and fixed-format controls must not shift when labels, hover states, or dynamic numbers update.
- **Text Fit:** Verify long labels, localization expansion (+30%), and narrow mobile containers wrap or truncate cleanly without overlapping adjacent elements.

---

## 4. Direction Anti-Patterns

- Never default to purple/indigo gradients, glowing decorative blobs, oversized equal-height cards, vague hero slogans, or stock atmospheric filler.
- Never nest UI cards inside other cards.
- Never hide the primary tool, product, or workflow behind generic marketing sections when the user asked for an app or tool.
- Never describe the UI's features in prose inside the UI when the interactive controls can speak for themselves.

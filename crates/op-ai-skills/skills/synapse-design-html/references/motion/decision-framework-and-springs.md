> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Motion Decision Framework, Easing Curves & Spring Physics

> **Source:** Migrated from `ui-animation` (`SKILL.md`, `references/decision-framework.md`, `references/spring-animations.md`).
> **Stage:** Stage 3 (Motion Planning) & Stage 4 (Implementation).
> **Role:** Answers whether an interaction should animate, selects the exact duration/curve/spring, and governs interruption physics.

---

## 1. The Four-Question Motion Gate (`decision-framework.md`)

Answer these four questions in order before writing any animation code:

### Question 1: Should This Animate at All? (Frequency Gate)

| Usage Frequency | UI Examples | Decision |
|---|---|---|
| **100+ times/day** | Keyboard shortcuts, command palette toggle, focus ring movement | **No animation (`0ms`). Ever.** |
| **Tens of times/day** | Hover highlights, list navigation, lateral tab switches | Instant (`0ms`) entry or subtle `100–150ms` color/opacity fade |
| **Occasional** | Modals, drawers, dropdowns, popovers, accordions | Standard asymmetric transition (`150–300ms`) |
| **Rare / First-Time** | Onboarding, empty-state activation, checkout completion | Can add deliberate delight / spring overshoot (`300–600ms`) |

- **Novelty Budget:** Keep ~90% of a surface quiet/expected and spend novelty on 1–2 focal moments.
- **One-Shot Only:** First-run staggers or intro flourishes must not replay on every reload.

### Question 2: What Is the Purpose?
Every animation must justify itself under one of four jobs:
1. **Feedback:** Confirms user input was received (`:active` `scale(0.97)` at `0ms`).
2. **Orientation:** Explains spatial origin (drawer slides from edge; popover scales from trigger).
3. **Continuity:** Preserves identity across view changes (shared-element morph, FLIP resize).
4. **Delight:** Celebrates a rare milestone (success checkmark draw).

### Question 3 & 4: What Easing & Duration Should It Use?

| UI Element / Interaction | Duration | Easing Curve |
|---|---|---|
| **Button press (`:active`)** | `0ms` down / `120–160ms` release | `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Tooltips, small popovers** | `125–180ms` enter / `100ms` exit | `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Dropdowns, selects** | `150–220ms` enter / `120ms` exit | `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Modals, drawers, sheets** | `220–350ms` enter / `160–220ms` exit | `cubic-bezier(0.32, 0.72, 0, 1)` (drawer) or `cubic-bezier(0.22, 1, 0.36, 1)` |
| **Move / slide on screen** | `200–300ms` | `cubic-bezier(0.25, 1, 0.5, 1)` |
| **Hover (color/opacity)** | `180–200ms` | `ease` |
| **Hover (transform/lift)** | `120–150ms` | `cubic-bezier(0.22, 1, 0.36, 1)` |

### Named Curves Catalog
- **Enter:** `cubic-bezier(0.22, 1, 0.36, 1)` (entrances and transform hover)
- **Move:** `cubic-bezier(0.25, 1, 0.5, 1)` (slides, panels)
- **Drawer (iOS-like):** `cubic-bezier(0.32, 0.72, 0, 1)` (extremely steep start; makes 350–500ms feel instant)
- **Expo out:** `cubic-bezier(0.19, 1, 0.22, 1)` (dramatic reveals, card hovers)
- **Press:** `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (button press feedback)
- **On-screen move:** `cubic-bezier(0.645, 0.045, 0.355, 1)` (back-and-forth movement remaining on screen)
- **Never use `ease-in` on UI:** It starts slow and makes the interface lag behind the user's click.

---

## 2. Spring Physics & Asymmetric Open/Close (`spring-animations.md`)

Use springs for gesture-driven motion, drag release, Elements that feel alive (e.g., container morphs), and motion that must preserve velocity when interrupted mid-flight.

### Apple Damping & Response Presets
- **Critically Damped Default (`dampingRatio = 1.0`, `bounce = 0`):** Smooth settle with zero overshoot. Use for 95% of product UI (`{ type: "spring", bounce: 0, duration: 0.4 }` or `{ stiffness: 500, damping: 40 }`).
- **Momentum / Physical Bounce (`dampingRatio = 0.8`, `bounce = 0.15–0.2`):** Use ONLY when preceded by a physical flick/drag or an expanding container morph (`{ stiffness: 300, damping: 20 }`).
- **Asymmetric Open vs. Close Rule:** When a container morph or sheet uses a slightly bouncy spring on open (`stiffness: 155, damping: 11`), **the close must be critically damped and ~2× faster** (`stiffness: 620, damping: 36` or `300ms cubic-bezier(0.32, 0.72, 0, 1)`). Never bounce on close.

---

## 3. Opportunity Discovery Sweep (6 Seam Classes)

When auditing an interface for missing motion, check these 6 seams:
1. **Feedback gap:** Clickable controls with no `:active` press state.
2. **Teleporting state:** `{isOpen && ...}` or `display: none` toggles that pop without transition.
3. **Missing spatial story:** Popovers/menus scaling from `center` instead of their trigger (`transform-origin`).
4. **Group entrance:** First-load card/list grids that could benefit from a `30–50ms` stagger (cap `≤ 300ms`).
5. **Gesture seam:** Draggable sheets/sliders that snap without velocity handoff or boundary rubber-banding.
6. **Flat delight moment:** Empty states or completion moments with zero visual confirmation.

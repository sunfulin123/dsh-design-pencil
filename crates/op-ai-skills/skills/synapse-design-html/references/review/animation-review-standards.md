> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Animation Review Format: 10 Non-Negotiable Standards & Remedial Hierarchy

> **Source:** Migrated verbatim and de-conflicted from `ui-animation` (`references/review-format.md`).
> **Stage:** Stage 5 (Multi-Gate Review).
> **Role:** Enforces a senior motion engineer's review posture with 10 Flag-on-Sight standards, a 9-step remedial hierarchy, and the mandatory `Before / After / Why` table.

---

## 1. Ten Non-Negotiable Motion Standards (Flag on Sight)

Measure every transition and animation in the codebase against these 10 rules:

1. **Justified Motion:** Every animation answers *"Why does this animate?"* (feedback, orientation, continuity, or rare delight). **Flag on sight:** decorative looping motion on frequently used UI.
2. **Frequency-Appropriate:** Keyboard navigation, focus rings, and `100+/day` actions respond at `0ms`. **Flag on sight:** animation that delays keyboard focus or repeated task execution.
3. **Responsive Easing:** Entering and moving UI elements use `ease-out` or a strong custom deceleration curve (`cubic-bezier(0.22, 1, 0.36, 1)`). **Flag on sight:** `ease-in` on any UI interaction.
4. **Sub-300ms UI:** Routine UI transitions stay `< 300ms`. **Flag on sight:** UI transition duration `> 300ms` without a full-screen travel justification.
5. **Origin & Physical Correctness:** Trigger-anchored popovers, dropdowns, and tooltips scale from their trigger (`transform-origin`), starting from `scale(0.92–0.96)`, never `scale(0)`. Modals stay `center`. **Flag on sight:** `transform-origin: center` on a popover/dropdown, or `scale(0)` entrance.
6. **Interruptibility:** Rapidly toggled UI (dropdowns, drawers, toasts, tabs) uses retargetable CSS transitions or springs. **Flag on sight:** `@keyframes` used on toggleable UI that jumps to frame 0 when re-triggered mid-flight.
7. **GPU-Only Properties:** Animate `transform` and `opacity` only. **Flag on sight:** `transition: all`, animating `width`, `height`, `top`, `left`, `margin`, `padding`, or updating a parent CSS variable every drag frame.
8. **Accessibility & Input Gating:** Wrap hover visuals in `@media (hover: hover) and (pointer: fine)` and provide a state-preserving `@media (prefers-reduced-motion: reduce)` rule (keep opacity/color feedback while removing spatial travel). **Flag on sight:** spatial travel with no reduced-motion guard, or a global `transition: none !important` that strips all state feedback.
9. **Asymmetric Enter/Exit:** `:active` press is instant (`0ms`); exit duration is ~30–40% faster than enter duration; only the open phase of a morph bounces while the close is critically damped. **Flag on sight:** delayed `:active` press or bouncy close animation.
10. **Cohesion:** Paired elements (modal + backdrop, tooltip + arrow) share identical duration and easing. Animate the container OR stagger its children (`30–50ms`), never both. **Flag on sight:** container sliding in while its children also stagger in.

---

## 2. Nine-Step Remedial Preference Hierarchy

When fixing motion defects in Stage 5, prefer earlier moves over later ones:
1. **Delete the animation** (if repeated frequently or lacking purpose).
2. **Reduce it** (shorter duration, smaller travel distance, fewer properties).
3. **Fix the easing** (swap `ease-in` / linear to `cubic-bezier(0.22, 1, 0.36, 1)`).
4. **Fix origin & physicality** (set trigger `transform-origin`; replace `scale(0)` with `scale(0.95)` + `opacity: 0`).
5. **Make it interruptible** (convert `@keyframes` to CSS `transition` or spring).
6. **Move to GPU** (replace `width/height/top/left` or `transition: all` with explicit `transform` and `opacity`).
7. **Apply asymmetric timing** (`0ms` press, fast exit, damped close).
8. **Polish** (subtle `blur(2px)` crossfade bridge, `@starting-style` entry).
9. **Gate for accessibility** (`@media (hover: hover)` and `@media (prefers-reduced-motion: reduce)`).

---

## 3. Mandatory `Before / After / Why` Table Format

Whenever `verify-surface.mjs` or visual review flags a motion issue, record the fix in this exact table:

| Before | After | Why |
|---|---|---|
| `transition: all 300ms ease` | `transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease` | Specify exact GPU properties; `all` animates layout properties off-GPU |
| `transform: scale(0)` | `transform: scale(0.95); opacity: 0` | Physical surfaces do not materialize from zero area |
| `ease-in` on dropdown | `cubic-bezier(0.22, 1, 0.36, 1)` | `ease-in` lags user input; steep `ease-out` feels immediate |
| No `:active` state on button | `transform: scale(0.97)` on `:active` with `transition-duration: 0s` | Tappable controls require instant physical press confirmation |
| `.is-error` and `.is-shaking` merged | Separate `.is-shaking` (animation) from `.is-error` (border/message) | Allows shake keyframe to finish and reset while error state persists |

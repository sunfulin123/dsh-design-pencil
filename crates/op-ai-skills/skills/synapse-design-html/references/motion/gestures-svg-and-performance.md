> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Gestures, Drag Physics, SVG Animation & Performance Deep Dive

> **Source:** Migrated from `ui-animation` (`gesture-drag.md`, `svg-animation.md`, `performance-deep-dive.md`, `debugging-symptoms.md`).
> **Stage:** Stage 3, Stage 4 & Stage 5.
> **Role:** Governs direct manipulation (drag/swipe), SVG vector motion, compositor performance, and symptom-based motion debugging.

---

## 1. Direct Manipulation & Drag Physics (`gesture-drag.md`)

Whenever implementing a draggable drawer, bottom sheet, slider, or comparison handle:
1. **Zero Easing During Drag:** While the pointer is down, lock the element 1:1 to the pointer (`transition: none`). Adding easing during active drag makes the element lag behind the finger.
2. **Pointer Capture:** Call `el.setPointerCapture(e.pointerId)` on `pointerdown` and release on `pointerup`/`pointercancel` so fast pointer movement outside the element bounds never drops the drag.
3. **Touch-Action Declaration:** Set `touch-action: pan-y` on horizontal carousels/sliders and `touch-action: none` on 2D drag handles so the browser's native page scroll does not steal the gesture mid-drag.
4. **Apple Rubber-Band Boundary Damping:** Never use hard stops at drag boundaries. Apply diminishing return past the limit:
   ```js
   function rubberband(overshoot, dimension, constant = 0.55) {
     return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
   }
   ```
5. **Velocity & Momentum Projection on Release:** Dismiss a sheet if `Math.abs(delta) > threshold` OR `velocity > 0.11 px/ms`. Project the landing snap point using exponential decay:
   `projected = current + (velocity / 1000) * 0.998 / (1 - 0.998)`.

---

## 2. SVG Vector Animation Rules (`svg-animation.md`)

1. **The Canvas-Origin Trap:** By default, SVG `<path>`, `<rect>`, and `<circle>` elements rotate and scale around the outer `<svg>` `(0, 0)` top-left corner, causing elements to fly off-center. Always apply transforms to a `<g>` wrapper with:
   ```css
   .svg-animated-part {
     transform-box: fill-box;
     transform-origin: center;
   }
   ```
2. **Line Drawing (`stroke-dashoffset`):** Measure exact path length dynamically (`const len = path.getTotalLength()`) or normalize with `<path pathLength="100">` in markup (`stroke-dasharray: 100; stroke-dashoffset: 100 -> 0`).

---

## 3. Browser Rendering Pipeline & Performance (`performance-deep-dive.md`)

### Property Cost Tiers
- **Tier 1 — Composite Only (Cheapest, 60/120fps under load):** `transform` (`translate`, `scale`, `rotate`), `opacity`, and bounded `clip-path` / `filter`.
- **Tier 2 — Paint + Composite (Moderate):** `background-color`, `color`, `border-color`, `box-shadow` (prefer `filter: drop-shadow()` or pseudo-element opacity fade for animated shadows).
- **Tier 3 — Layout + Paint + Composite (BANNED for UI animation):** `width`, `height`, `top`, `left`, `margin`, `padding`, `border-width`.

### High-Signal Performance Rules
- **Driver Priority:** `CSS Transitions > Web Animations API (el.animate) > CSS Keyframes > JS requestAnimationFrame`.
- **Never Co-Schedule Heavy Work & Animation Start:** Do not mount a heavy DOM tree, parse large JSON, or trigger layout reads in the same tick that starts a drawer/modal transition. Let 1 animation frame land (`requestAnimationFrame`), or defer heavy work to `transitionend`.
- **The CSS Variable Inheritance Trap:** Never update a CSS variable (`--drag-y`) on a parent container every frame during drag—it forces style recalculation on every child node. Write `el.style.transform = ...` directly on the moving element.
- **Off-Screen Loop Pause:** Any pulsing diagram, marquee, or ambient keyframe loop MUST pause (`animation-play-state: paused`) when scrolled off-screen via `IntersectionObserver`.

---

## 4. Debugging "Something Feels Off" (`debugging-symptoms.md`)

| Symptom | Root Cause | Exact Fix |
|---|---|---|
| **Feels sluggish / late to respond** | `ease-in` or `ease-in-out` curve, or duration `> 300ms` | Switch to `cubic-bezier(0.22, 1, 0.36, 1)` and cut duration to `150–220ms`; ensure `:active` is `0ms` |
| **Feels cheap / pops from nowhere** | Entering from `scale(0)` or `transform-origin: center` on a trigger-anchored menu | Start from `scale(0.94)` + `opacity: 0` with `transform-origin` anchored at the trigger |
| **Jumps on rapid double-click** | Using `@keyframes` for a toggleable UI state | Replace `@keyframes` with CSS `transition` so interruption retargets smoothly from current position |
| **Modal/overlay feels disconnected** | Backdrop and dialog have different durations or easing curves | Lock backdrop and surface to identical duration and easing |
| **1px text/icon shift at transition end** | Subpixel layer promotion snapping on/off | Add `backface-visibility: hidden` or keep `translateZ(0)` stable on the animated element |

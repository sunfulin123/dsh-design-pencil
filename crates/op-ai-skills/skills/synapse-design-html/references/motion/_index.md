> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Motion & View Transitions Domain Index (`references/motion/`)

> **Stage:** Stage 3 (Motion Planning) & Stage 4 (Implementation)
> **Purpose:** Routes between the 3-tier motion synthesis guides and all 29 full source playbooks from `ui-animation`, `vercel-react-view-transitions`, `impeccable`, `design-taste-frontend`, and `hallmark`.

---

## 1. Conflict Resolution Rules in This Domain

1. **Three-Tier Escalation Ladder:**
   - **Tier 1 (Default for 85% of UI):** Pure CSS transitions (`transform`, `opacity`) + `@starting-style` (`transition-recipes.md`).
   - **Tier 2 (View & Route Continuity):** Native browser `document.startViewTransition` / React `<ViewTransition>` (`view-transitions.md`).
   - **Tier 3 (Physics, Gestures & Scroll Choreography):** Springs (`uianim-spring-animations.md`), pointer-captured drag (`uianim-gesture-drag.md`), or CSS `animation-timeline: view()` (`scroll-and-clip-path.md`).
2. **Modern Package Rule:** When using Motion in React, import from `motion/react` (package `motion`), never legacy `framer-motion`.
3. **Reduced-Motion Preservation:** Never strip opacity/color state feedback with a global `* { transition: none !important }`; remove spatial movement (`transform: none !important`) while keeping `120ms` opacity/color transitions so state changes remain legible.

---

## 2. Primary Synthesis Guides (Read First)

| File | When to Load |
|---|---|
| [`decision-framework-and-springs.md`](decision-framework-and-springs.md) | **MANDATORY in Stage 3:** 4-question frequency gate, duration/curve lookup table, and Apple spring damping presets. |
| [`transition-recipes.md`](transition-recipes.md) | **Read in Stage 4:** Condensed CSS/JS recipes for the 14 core UI transitions (`:root` variables included). |
| [`view-transitions.md`](view-transitions.md) | **Read in Stage 4:** 5-pattern priority order for shared-element morphs, route transitions, and list reordering. |
| [`scroll-and-clip-path.md`](scroll-and-clip-path.md) | **Read in Stage 4 (Persuade/Experience):** Triggered vs. scrubbed scroll rules, award-site moments, and `clip-path` techniques. |
| [`gestures-svg-and-performance.md`](gestures-svg-and-performance.md) | **Read for drag/SVG/perf:** Pointer capture, rubber-band boundary damping, SVG `<g>` origin rules, and compositor tiers. |

---

## 3. Full De-Conflicted Source Playbooks (Load for Deep Specialist Needs)

### From `ui-animation` (Complete 17-File Suite)
- [`uianim-transition-recipes.md`](uianim-transition-recipes.md) — **Full 911-line reference** with complete HTML/CSS/JS for all 14 recipes (Container morph, Card resize, Panel reveal, Notification badge, Icon swap, Menu dropdown, Modal dialog, Text state swap, Page side-by-side slides, Number pop-in, Odometer digit roll, Avatar group hover, Success celebration, Error state shake).
- [`uianim-decision-framework.md`](uianim-decision-framework.md) — Frequency gate and the 6-seam opportunity discovery sweep.
- [`uianim-spring-animations.md`](uianim-spring-animations.md) — Apple damping/response framing, asymmetric open/close stiffness, and velocity retargeting.
- [`uianim-component-patterns.md`](uianim-component-patterns.md) — Buttons, toasts, crossfades, list stagger/removal, step forms, and Motion layout morphs.
- [`uianim-contextual-animations.md`](uianim-contextual-animations.md) — Contextual icon swaps, word-level stagger entrances, peripheral de-emphasis, and fixed-offset exits.
- [`uianim-clip-path-techniques.md`](uianim-clip-path-techniques.md) — Hardware-accelerated `clip-path: inset()` for sliding tabs, hold-to-delete, and comparison sliders.
- [`uianim-gesture-drag.md`](uianim-gesture-drag.md) — Velocity handoff, momentum projection, rubber-band damping, rotary drag, and detents.
- [`uianim-scroll-animations.md`](uianim-scroll-animations.md) — Scroll gate, `IntersectionObserver` reveals, and CSS `animation-timeline: view()`.
- [`uianim-svg-animation.md`](uianim-svg-animation.md) — SVG `transform-box: fill-box`, `stroke-dashoffset` line drawing, and path morphing.
- [`uianim-performance-deep-dive.md`](uianim-performance-deep-dive.md) — Composite vs. Paint vs. Layout tiers, `scheduler.yield()` chunking, WAAPI, and CSS variable traps.
- [`uianim-debugging-symptoms.md`](uianim-debugging-symptoms.md) — Symptom-indexed table for sluggish, cheap, jumpy, or misfiring animations.
- [`uianim-choreography.md`](uianim-choreography.md), [`uianim-curve-fitting.md`](uianim-curve-fitting.md), [`uianim-measurement-guide.md`](uianim-measurement-guide.md), [`uianim-code-output.md`](uianim-code-output.md) — Reverse-engineering motion from video recordings.
- [`uianim-vocabulary.md`](uianim-vocabulary.md) & [`uianim-interface-sfx.md`](uianim-interface-sfx.md) — Motion terminology reverse-lookup and sparse Web Audio UI SFX.

### From `vercel-react-view-transitions` (Complete 6-File Suite)
- [`vt-react-view-transitions.md`](vt-react-view-transitions.md) — Overview, `<ViewTransition>` triggers, and critical placement rules.
- [`vt-implementation.md`](vt-implementation.md) — Step-by-step audit and implementation workflow for existing apps.
- [`vt-css-recipes.md`](vt-css-recipes.md) — Complete `::view-transition-*` CSS animations and keyframes.
- [`vt-patterns.md`](vt-patterns.md) — Shared elements, list reorder, Suspense reveal, and directional navigation patterns.
- [`vt-nextjs.md`](vt-nextjs.md) — Next.js App Router integration and route transition recipes.
- [`vt-troubleshooting.md`](vt-troubleshooting.md) — Debugging aborted or non-firing View Transitions.

### From `impeccable`, `design-taste-frontend` & `hallmark`
- [`impeccable-animate.md`](impeccable-animate.md) & [`impeccable-delight.md`](impeccable-delight.md) — Motion thesis and personality moments.
- [`taste-motion-layer.md`](taste-motion-layer.md) & [`taste-moments.md`](taste-moments.md) — Hover micro-layer and dealt award-site section moments (`photo-chapters`, `pinned-chapters`, `word-highlight`).
- [`hallmark-microinteractions.md`](hallmark-microinteractions.md) & [`hallmark-scroll-choreography.md`](hallmark-scroll-choreography.md) — Tactile control feedback and scroll pacing.

> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Scroll-Driven Animations, Moments & Clip-Path Techniques

> **Source:** Migrated and de-conflicted from `ui-animation` (`scroll-animations.md`, `clip-path-techniques.md`) and `design-taste-frontend` (`moments.md`).
> **Stage:** Stage 3 & Stage 4 (Implementation).
> **Role:** Governs when scroll motion is allowed, distinguishes triggered vs. scrubbed scroll, and provides hardware-accelerated `clip-path` and award-site moment patterns.

---

## 1. The Scroll Animation Gate (`scroll-animations.md`)

Walk this gate before adding any scroll-linked motion:
1. **Is this an `Operate` or `Read` surface (dashboard, tool, admin, docs)?**
   → **NO scroll animations.** Content appearing late while scrolling a workspace reads as lag.
2. **Is the element in the first viewport (above the fold)?**
   → **Never wait for scroll.** The hero enters once on load or stands ready immediately.
3. **Are you about to fade-in every section down the page?**
   → **Banned.** Fading in every card or section is an AI template tell. Restrict scroll choreography to **1–2 deliberate moments** per landing page (`design-taste-frontend` Rule 5 & 8).
4. **Content Must Survive Without JS:**
   → The default un-scripted CSS state of every section must be `opacity: 1` and readable. Never ship a page of `opacity: 0` elements that stay invisible if a script fails.

---

## 2. Triggered Reveals vs. Scrubbed Timelines

Never confuse these two mechanisms:

### A. Triggered Reveal (Runs Once on Own Clock)
- Crossing `IntersectionObserver` (`rootMargin: "0px 0px -10% 0px"`) triggers a one-time transition (`400–550ms cubic-bezier(0.22, 1, 0.36, 1)` from `translateY(12px)` and `opacity: 0`), then immediately calls `observer.unobserve(el)` so it **never re-animates on scroll-up**.
- **One Entrance Per Container:** Animate the container OR stagger its children (`80–100ms` wave)—never both.

### B. Scrubbed Scroll Timeline (Scroll Position Is the Clock)
- Use **`linear` timing and zero duration**—adding an easing curve or transition duration to scrubbed motion makes it lag behind the user's finger/wheel.
- Prefer native CSS `animation-timeline: view()` inside `@supports`:
  ```css
  @supports (animation-timeline: view()) {
    @media (prefers-reduced-motion: no-preference) {
      .scrub-progress {
        animation: fill-bar linear both;
        animation-timeline: view();
        animation-range: entry 10% cover 80%;
      }
    }
  }
  ```
- **Never Hijack Scroll:** Never intercept `wheel` events, override native scroll inertia, or trap the user in a pinned section longer than `2–3 viewport heights`.

---

## 3. High-Impact Section Moments (`design-taste-frontend moments.md`)

On `Persuade` and `Experience` pages, pick **1 (short page) or 2 (long page)** authored moments from this catalog:
- **`pinned-chapters` (Product / Service / Tech):** Sticky visual frame on one side (`position: sticky; top: 96px`) while 2–4 step chapters scroll past on the other side, updating the active visual state at each threshold. Collapses to a static vertical stack on `< 768px` and `prefers-reduced-motion`.
- **`word-highlight` (Statement Section):** A short 15–25 word manifesto statement set large (`clamp(1.75rem, 3.2vw, 3rem)`), where words transition from `var(--muted)` to `var(--ink)` as the statement crosses the viewport center.
- **`counter-rolls` (Proof Figures):** Tabular proof figures that roll once into place when reached (`tabular-nums`), resting permanently afterward.

---

## 4. Hardware-Accelerated `clip-path` Recipes (`clip-path-techniques.md`)

`clip-path: inset(top right bottom left round radius)` runs on the compositor without layout reflow:

1. **Seamless Sliding Tab Indicator (Zero Color Timing Mismatch):**
   Duplicate the tab bar as an active-styled overlay (`background: var(--accent); color: var(--accent-ink)`) and clip it to the active tab's bounds:
   ```css
   .tabs-active-layer {
     position: absolute;
     inset: 0;
     pointer-events: none;
     clip-path: inset(0 var(--clip-right, 66%) 0 var(--clip-left, 0%) round 8px);
     transition: clip-path 220ms cubic-bezier(0.22, 1, 0.36, 1);
   }
   ```
2. **Hold-to-Confirm / Destructive Action Fill:**
   On a destructive button, place a fill overlay with `clip-path: inset(0 100% 0 0)`. On `:active`, transition `clip-path` to `inset(0 0 0 0)` over `1.5s linear`; on pointer release before completion, snap back over `180ms ease-out`.
3. **Before / After Comparison Slider:**
   Stack two product views/renders in the same frame; clip the top layer with `clip-path: inset(0 calc(100% - var(--split, 50%)) 0 0)` driven directly by pointer drag on the divider handle.

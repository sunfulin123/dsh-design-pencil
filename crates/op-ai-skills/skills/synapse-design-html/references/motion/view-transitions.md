> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# View Transitions: Shared Elements, Route Continuity & Morphs

> **Source:** Migrated from `vercel-labs/agent-skills` (`vercel-react-view-transitions/SKILL.md` and CSS recipes).
> **Stage:** Stage 3 & Stage 4 (Implementation).
> **Role:** Implements native browser `document.startViewTransition` and React `<ViewTransition>` for shared-element morphs, directional navigation, and list reordering.

---

## 1. Five View-Transition Patterns (In Priority Order)

Every View Transition must communicate spatial relationship or continuity. Implement applicable patterns in this order:

| Priority | Pattern | What It Communicates | Implementation Mechanism |
|---|---|---|---|
| **1** | **Shared Element (`name`)** | "Same object — inspecting deeper" | Matching `view-transition-name` on source card thumbnail/title and destination detail hero |
| **2** | **Suspense / Async Reveal** | "Requested data arrived" | Cross-fade + subtle vertical settle from skeleton to live content |
| **3** | **List Identity (per-item `key`)** | "Same items, re-sorted or filtered" | Unique `view-transition-name: item-${id}` on each card during filter/sort updates |
| **4** | **State Change (`enter`/`exit`)** | "Surface appeared or closed" | Drawer, comparison tray, or detail pane entering/leaving |
| **5** | **Route / Hierarchical Change** | "Moving deeper or back" | Directional slide (`nav-forward` / `nav-back`); use plain fade or `none` for lateral tabs |

---

## 2. Vanilla JS / DOM `startViewTransition` Pattern

Use this wrapper for any DOM state switch (filtering products, opening a detail view, switching layout density) so unsupported browsers and `prefers-reduced-motion` users degrade gracefully:

```js
export function runViewTransition(mutateDOM, className = '') {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!document.startViewTransition || prefersReduced) {
    mutateDOM();
    return;
  }
  if (className) document.documentElement.classList.add(className);
  const transition = document.startViewTransition(() => {
    mutateDOM();
  });
  transition.finished.finally(() => {
    if (className) document.documentElement.classList.remove(className);
  });
}
```

### Assigning Unique `view-transition-name` Values
**Critical Invariant:** No two simultaneously visible DOM elements may share the same `view-transition-name` at the same time (or the entire transition aborts).
- On a product grid: assign `style="view-transition-name: product-card-${item.id}"` to each card.
- When morphing a clicked card into a detail modal/page: assign `view-transition-name: active-product-image` to the clicked card right before calling `runViewTransition`, remove it when the card unmounts/hides, and mount the detail hero with `view-transition-name: active-product-image`.

---

## 3. React 19.3+ / Next.js `<ViewTransition>` Rules

When building in React 19.3+ or Next.js App Router:
1. **Trigger Requirement:** `<ViewTransition>` activates ONLY inside `startTransition`, `useDeferredValue`, or `<Suspense>`. Plain synchronous `setState` will not animate.
2. **Critical Placement Rule:** `<ViewTransition>` only fires `enter`/`exit` if it wraps the DOM node directly—never wrap a plain `<div>` outside `<ViewTransition>` in the conditional branch:
   ```tsx
   // CORRECT: ViewTransition is outermost inside the conditional
   {isOpen && (
     <ViewTransition enter="slide-in" exit="slide-out">
       <aside className="detail-panel">...</aside>
     </ViewTransition>
   )}
   ```
3. **Directional Navigation (`addTransitionType`):**
   Use `addTransitionType('nav-forward')` when drilling into a detail route and `addTransitionType('nav-back')` when returning. Never use directional slides for lateral top-level tab switching.

---

## 4. View Transition CSS Pseudo-Element Recipes

```css
/* Smooth shared-element morph timing */
::view-transition-group(*) {
  animation-duration: 260ms;
  animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
}

/* Directional forward/back navigation */
html.nav-forward::view-transition-old(main-view) {
  animation: 220ms cubic-bezier(0.25, 1, 0.5, 1) both vt-out-left;
}
html.nav-forward::view-transition-new(main-view) {
  animation: 260ms cubic-bezier(0.22, 1, 0.36, 1) both vt-in-right;
}
html.nav-back::view-transition-old(main-view) {
  animation: 220ms cubic-bezier(0.25, 1, 0.5, 1) both vt-out-right;
}
html.nav-back::view-transition-new(main-view) {
  animation: 260ms cubic-bezier(0.22, 1, 0.36, 1) both vt-in-left;
}

@keyframes vt-in-right {
  from { opacity: 0; transform: translateX(24px); }
}
@keyframes vt-out-left {
  to { opacity: 0; transform: translateX(-24px); }
}
@keyframes vt-in-left {
  from { opacity: 0; transform: translateX(-24px); }
}
@keyframes vt-out-right {
  to { opacity: 0; transform: translateX(24px); }
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) {
    animation-duration: 0.01ms !important;
  }
}
```

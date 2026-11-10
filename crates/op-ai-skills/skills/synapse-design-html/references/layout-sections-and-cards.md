# Layout Architecture, Section Rhythm & Responsive Cards

> **Source:** Migrated and de-conflicted from `impeccable` (`layout.md`, `adapt.md`) and `design-taste-frontend` (`layout-v4.md`, `sections.md`, `cards.md`).
> **Stage:** Stage 3 (UI Design) & Stage 4 (Implementation).
> **Role:** Governs spatial hierarchy, grid alignment, responsive adaptation, and card/section composition across modes.
> **Conflict Resolution:** `design-taste-frontend`'s strict 1-or-2 screen section height rule (`100svh`) applies **only** to `Persuade` marketing/company landing pages when appropriate; `Operate` apps and `Read` documentation use content-driven scrolling and structural app shells.

---

## 1. Spatial Hierarchy & The Squint Test (`impeccable layout`)

Before writing layout CSS, define the spatial thesis:
1. **The Squint Test:** With the screen blurred, can a viewer immediately identify (1) the primary focal element, (2) the primary CTA, and (3) the major functional groups in reading order?
2. **Proximity Before Containers:** Group related items by tightening whitespace (`8px–12px`) and separating distinct groups generously (`32px–64px`) before reaching for borders or background boxes.
3. **Equal Content Edges (`design-taste-frontend` Rule 4):** Every section inside a page shares a consistent `.wrap` max-width and horizontal gutter so left and right content edges align cleanly down the viewport. Never leave ragged, accidental one-sided indents.
4. **4pt / 8pt Spacing Scale:** Use a systematic spacing scale (`4, 8, 12, 16, 24, 32, 48, 64, 96, 128px`). Prefer CSS Grid and Flexbox `gap` over ad-hoc child margins.

---

## 2. Mode-Specific Layout Architecture

### A. `Operate` Mode (Dashboards, Tools, Workspaces)
- **Structural App Shell:** Fixed or collapsible sidebar (`240–280px` on desktop, drawer/bottom-nav `≤ 5 items` on mobile) + sticky top toolbar + scrollable main canvas (`min-width: 0` on all flex/grid children).
- **Dense, Scannable Panels:** At most **2 levels of box nesting** (`canvas -> panel -> content`). Never put a bordered card inside a bordered card inside a panel.
- **Stable Control Bars:** Filter bars, action headers, and table columns must not jump or reflow when switching tabs or toggling empty/loading states.

### B. `Persuade` Mode (Company, Product & Launch Pages)
- **Hero-First Viewport:** The hero occupies the first viewport cleanly with the primary headline, 1 hard fact, the primary CTA visible above the fold, and the lead visual (`app-frame`, studio product shot, or interactive specimen). No second section heading should peek awkwardly into the bottom 40px of the first viewport on desktop (`1440×900`).
- **Compositional Variety Across Sections (`sections.md`):**
  - Never repeat the exact same section layout twice in a row (e.g., do not stack three 50/50 split sections or two 3-column card grids back-to-back).
  - Alternate structural rhythm: `Hero Stage` → `Interactive App-Frame / Product Showcase` → `Asymmetric 2-Column Proof` → `Bento / Specification Matrix` → `Focused Closing CTA + Footer`.
- **One Contrasting Band:** Use at most one inverse/contrasting surface band (e.g., dark ink band on a light page) to pace a long landing page; separate other sections with generous whitespace (`96px–128px`).

### C. `Read` Mode (Docs, Articles, Guides)
- **Three-Zone Layout:** Left navigation tree (`240px`) + centered reading column (`65–75ch` max-width) + right "On this page" anchor rail (`200px` on `≥ 1280px`).

---

## 3. Feature Cards, UI Fragments & Diagrams (`cards.md`)

When a section uses cards on a `Persuade` or `Operate` surface:
1. **One Card Family Per Page:** Keep border radius (`8px` sharp, `12–16px` soft), border/shadow treatment, and internal padding (`20px–28px`) uniform across the page.
2. **Show, Don't Describe:** Inside a feature card on a software/tech page, show a **live mini UI fragment** (a real diff block, a working toggle matrix, a live command search, or a pulsing SVG node diagram)—never an arbitrary decorative icon over generic marketing fluff.
3. **Card Titles:** `Verb + Object` or concrete noun phrase on a single line; body copy `≤ 25 words`.

---

## 4. Responsive Adaptation Across Breakpoints (`adapt.md` × `layout-v4.md`)

Verify layout behavior across all four width classes:
- **`1440px` (Desktop):** Full multi-column grid, generous gutters (`48px–80px`), hover micro-interactions active.
- **`1024px` / `768px` (Tablet Portrait):** Collapse 3–4 column grids to 2 columns (`48px` gutter); convert wide sidebars into collapsible rails or top bars; ensure no orphan single card sits half-empty unless it spans full width.
- **`375px` & `320px` (Mobile):**
  - Single-column flow (`16px–20px` horizontal gutter); zero horizontal scroll (`overflow-x: hidden` on body is a band-aid—fix the overflowing child element).
  - In split sections, stack **text and heading first, visual second**.
  - Primary CTA buttons span full width (`width: 100%`) or sit in a fixed bottom action bar (`padding-bottom` added to `<main>` so the bar never covers footer or content).
  - All interactive controls outside running prose must be at least **`44×44px`** with `≥ 8px` clearance.

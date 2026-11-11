> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Surface Modes: Operate, Persuade, Read, Experience

> **Source:** Migrated and de-conflicted from `impeccable` (`mode-operate.md`, `mode-persuade.md`, `mode-read.md`, `operate.md`).
> **Stage:** Stage 1 & Stage 2.
> **Role:** Governs how much visual expression vs. structural restraint a surface should carry.

---

## 1. Mode Selection Rule

Choose the mode from **what the visitor's success looks like on this specific surface**, not from the company's industry:
- A developer tool's landing page is **`Persuade`**; its console is **`Operate`**; its API guide is **`Read`**.
- A fashion house's lookbook is **`Experience`**; its checkout admin is **`Operate`**.

---

## 2. `Operate` Mode (Dashboards, Apps, Tools, Editors, Settings)

On an `Operate` surface, the visitor came to complete a task. Familiarity, scanability, and speed outrank artistic expression.

### What the Visual World May Contribute
Consider these four dimensions alongside the selected style and actual product needs:
1. **Typography** (usually a single well-tuned sans family + monospace for data/code; fixed `rem` scale with `1.125–1.2` step ratio—never giant fluid `clamp()` display headings that break sidebars).
2. **Palette** (restrained canvas + slightly warmer/cooler secondary surface for sidebars/toolbars + semantic status tokens; reserve full-saturation accent for primary actions and active selection).
3. **Density** (high data-ink ratio; tables at `120ch+` and compact `4px/8px` spacing increments are welcome).
4. **One Signature Move** (e.g., service health drawn as a transit map, a schedule set in a timetable's column rhythm).

### `Operate` Considerations
- **Recognizable controls:** Preserve clarity and familiarity even when the product has a distinctive visual treatment.
- **Motion:** Keep primary tasks immediately usable and choose transitions appropriate to the task and reduced-motion preference.
- **Imagery:** Use decorative media only when it supports the user, product, and selected style without obscuring the task.
- **Escape Clipping:** Dropdowns, popovers, and tooltips inside `overflow: hidden/auto` containers must use `<dialog>`, the Popover API, `position: fixed`, or portals so they never clip.

---

## 3. `Persuade` & `Experience` Modes (Landing Pages, Campaigns, Pricing, Showcases, Portfolios)

On `Persuade` and `Experience` surfaces, design is the product's proof. Earn attention and action through a committed visual world.

### `Persuade` Rules
- **First Viewport Obligation:** Make the offer intelligible in 5 seconds, expose a working primary action (e.g., route search, model configurator, add to bag, start trial—not a dead link), and demonstrate something only this product can prove.
- **Material Coverage Without Turning Into a Poster:** The visual world's material owns the ground, major surfaces, and display typography, while navigation links, body copy, and interactive buttons remain unmistakably operable.
- **One Dominant Move:** Commit deeply to one focal visual or interactive mechanism in the hero rather than scattering five competing gimmicks across the screen.
- **Avoid the Category Template:** Do not ship a generic centered headline + subcopy + 2 pills over a 3-card icon row.

### `Experience` Rules
- **Artifact Leads Immediately:** On portfolios, galleries, 3D showcases, and interactive demos, the work/artifact itself occupies the first viewport; navigation and UI chrome recede to quiet peripheral controls.

---

## 4. `Read` Mode (Documentation, Articles, Help Centers, Changelogs)

On a `Read` surface, the visitor came to understand something. Comprehension and wayfinding stay intact at every step.

### `Read` Rules
- **The World Owns the Frame; the Column Stays Calm:** Express brand identity in the masthead, sidebar navigation rail, running headers, section openers, and code/callout styling. Keep the prose reading column calm (`60–75ch` measure, `16–18px` body size, `1.6–1.75` line-height, high contrast, zero moving backgrounds behind text).
- **Publishing Traditions Transfer Best:** Draw structure from reference manuals, type specimens, field guides, scholarly marginalia, or technical datasheets.
- **Wayfinding Clarity:** The reader must always know where they stand in the hierarchy (breadcrumbs, active TOC rail, clear `h1 -> h2 -> h3` progression, and next/previous links).

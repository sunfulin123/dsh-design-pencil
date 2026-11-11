> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# The Craft Floor: Non-Negotiable UI Quality & Anti-Slop Laws

> **Source:** Migrated and de-conflicted from `impeccable` (`reference/craft-floor.md`) and `ui-ux-pro-max` (`Quick Reference` & `Common Rules for Professional UI`).
> **Stage:** Stage 3 (Pre-Code Gate) & Stage 4 (Implementation).
> **Role:** Defines the hard mechanical and visual floor that every screen must clear before and during implementation.

---

## 1. Implementation Detail for the 12 Laws

The 12 Non-Negotiable Quality Floor checks are defined in [`../judgement.md`](../judgement.md); law numbers below add HTML/CSS implementation detail where a browser surface applies. Each is a check on the built result:

- **Law 1 (contrast):** Large text means `≥ 24px` or `≥ 19px bold`; active UI boundaries and icons also need `≥ 3:1`. On colored or dark surfaces, derive secondary text from the surface's hue (`oklch(from var(--ink) l c h / 0.68)`).
- **Law 2 (measure and type):** Mobile measure `35–60ch`; display max `6rem`; tracking of `-0.02em` to `-0.03em` usually reads best; `text-wrap: balance` on headings and `text-wrap: pretty` on body copy; obvious scale and weight steps between type roles.
- **Law 3 (elevation):** A soft shadow is offset, e.g. `0 8px 24px -4px oklch(0 0 0 / 0.08)`. Zero-offset colored halos (`0 0 20px`) are decoration, not depth.
- **Law 4 (proximity) — spacing rhythm:** `4px–8px` inside related clusters, `24px–64px` between distinct groups, and **more vertical space above a heading than below it** (e.g., `margin-top: 2.5rem; margin-bottom: 0.75rem`).
- **Laws 4–7 (second-order tells):** The full ban wording and what to build instead are in Section 2.
- **Law 9 (browser surfaces):** Focus ring `2px solid var(--accent)` with `outline-offset: 2px`; links get `text-underline-offset: 0.2em` and a set `text-decoration-thickness`.
- **Law 10 (touch and semantics):** `touch-action: manipulation`; `min-width: 0` on flex children; proper landmarks (`<header>`, `<main>`, `<nav>`, `<footer>`); `<button>` for actions and `<a href>` for navigation.
- **Dropdown & `<select>` anatomy:** Never leave a bordered/filled `<select>` with default UA `appearance` (Chromium paints the built-in disclosure arrow ~3px from the right border and ignores `padding-right`). Always declare `appearance: none; -webkit-appearance: none;`, draw or position a `16px` chevron inset `12px–16px` from the right border (`background-position: right 12px center; background-repeat: no-repeat; background-size: 16px 16px` or an overlay SVG at `right: 12px; pointer-events: none`), and set `padding-inline: 12px 38px` (`text-overflow: ellipsis`) so option text never touches the chevron. Custom combobox/listbox buttons must also keep `12px–16px` right padding and `≥ 8px` gap before the trailing chevron.
- **Control states (beyond the 12 laws):** Every control implements `default`, `hover` (gated by `@media (hover: hover)`), `focus-visible`, `active` (`0ms` press feedback), `disabled`, `loading`, and `error`.

---

## 2. Structural & Surface Refusals (Ban List)

Reaching for any of these patterns when the brief did not explicitly demand them is a failure:

### Banned Page Scaffolds
- **Same-size 3-card icon grids** (`[icon + h3 + 2 lines of text]` repeated across the page) as the primary structure.
- **Nested cards** (cards placed inside other cards).
- **The hero-metric cliche:** giant arbitrary percentage/number + tiny label + 3 stat pills.
- **Eyebrow / kicker labels above headings:** Small all-caps tracked labels above every `h2` (`FEATURES`, `WORKFLOW`, `CAPABILITIES`). **Absolute ban:** delete the eyebrow and let the heading carry its own weight.
- **Arbitrary section numbers (`01 / 02 / 03`):** Banned unless the sequence itself represents a required chronological or procedural step.
- **Unearned modals:** Never use a modal dialog for a task that needs neither user interruption nor protected focus; prefer inline expansion, drawers, or dedicated views.

### Banned Second-Order AI Tells (`Hallmark Gates 3, 4, 54, 63, 64, 65, 67, 80` × `Auteur Taste`)
- **Pill & Box Soup (Gates 3 & 4):** Never wrap every piece of metadata, filter, or specification in a `1px` bordered pill/chip, and never nest cards inside cards. Prefer open typographic alignment, whitespace (`proximity before borders`), and full-bleed or hairline-divided rows (`macrostructures/10-specimen.md`, `11-catalogue.md`, `13-index-first.md`).
- **Tracked-Caps Small Labels (Gate 67 — Absolute Floor Ban):** Never set any label, tag, badge, table header, nav link, or chip at `≤ 15px` in `UPPERCASE` / `small-caps` or with `letter-spacing > 0.03em`. Set all small labels in the body font, sentence case, untracked.
- **Middle-Dot-Joined Meta Strings & Glued Arrows (Gate 63 — Absolute Floor Ban):** Never write metadata strings joined by middle dots (`SKU: 02 · 184g · 5500mAh`) or glue `→` arrows onto link/button text.
- **Monospace as a Tech Costume (Gate 64):** Never apply `font-family: var(--font-mono)` to category tags, badges, pill buttons, captions, or section labels. Reserve monospace strictly for actual code blocks, CLI commands, cryptographic hashes, or dense numeric tables.
- **Amateur Inline SVG Drawings of Products/People (Gate 80):** Never draw inline `<svg>` geometric cartoons (`≥ 120px` circles/rectangles pretending to be phones, headphones, food, buildings, or people). Physical subjects require real photography (`scripts/photos.mjs` or raster image generation) or genuine 3D WebGL geometry; software subjects require a live HTML `app-frame`.
- **The Warm-Cream + Terracotta Split-Hero Reflex (Gate 65):** Do not default to warm cream/gray paper (`#F4F4F1`) + terracotta/orange accent + 50/50 split hero + 3 equal cards below unless explicitly requested by the user.

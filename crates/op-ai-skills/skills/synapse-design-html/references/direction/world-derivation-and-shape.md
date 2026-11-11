> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# World Derivation, Discovery & Brand Protocol

> **Source:** Migrated and de-conflicted from `impeccable` (`new-work.md`, `shape.md`), `design-taste-frontend` (`SKILL.md` Section 1–2), and `huashu-design` (Brand Asset Protocol & Aesthetic Paradigms).
> **Stage:** Stage 1 (Ideation & Brainstorm).
> **Role:** Guides how to shape ambiguous requests, derive non-generic visual worlds, and extract real brand assets without blocking on bureaucratic `init` flows.

---

## 1. Visual Authority Triage (`new-work`)

Before inventing a visual style, classify the workspace's existing authority:
- **Established World (`INHERIT`):** Coherent tokens/components or `DESIGN.md` already exist and no redesign was requested → Inherit existing palette, typography, radius, and component vocabulary. Never turn a local feature addition into a rebranding exercise.
- **Incomplete Brand (`EXPAND`):** Logo or primary color exists, but full UI tokens are missing → Preserve confirmed brand assets and expand a supporting token system around them.
- **Redesign (`REPLACE`):** Keep product truth, real content, links, form fields, and workflows intact (`--snapshot-before`), but treat the old visual styling as an anti-reference and build a replacement visual world.
- **Greenfield (`CREATE`):** No existing visual authority → Derive a new visual world using Section 2 below.

> **Alignment Gate & `direction-approved.json` Schema:** Follow the canonical Stage 1 procedure (Two-Altitude Reflex Test, Tracks 1/2/3, and `direction-approved.json` schema) in [`SKILL.md`](../../SKILL.md).

---

## 2. Deriving a Non-Generic Visual World (`impeccable` × `huashu-design`)

When creating or replacing a visual world on a `Persuade` or `Experience` surface:

1. **Name the Rut & Its Predictable Opposite:**
   - What does every lazy template in this category look like? (e.g., dark blue/purple neon SaaS grid, or generic beige luxury template). Explicitly ban both.
2. **Ground in Real Cultural Artifacts (Span ≥ 3 Material Families):**
   - Ask: *What physical object, instrument, print publication, or space did this domain use before the web?*
   - Examples across families:
     - **Print & Editorial:** Swiss railway timetable, Monocle/Kinfolk column grid, Bell Labs 1960s technical memorandum, Song-Dynasty woodblock folio, classical bookcraft with side-note rail and vermilion seal accent.
     - **Industrial & Physical:** anodized aluminum audio rack, Braun/Rams polycarbonate instrument, architectural blueprint with dimension leader lines, ceramic studio specimen tray.
     - **Screen & Graphic Systems:** Bloomberg dense ticker matrix, Ikko Tanaka poster geometry, Rijksmuseum dark gallery lightbox, cartographic elevation contour sheet.
3. **Check the Appearance Ledger (`~/.synapse-design/appearance-ledger.json`):**
   - Never repeat the same ground color, display font, and hero composition used in the user's last 3 projects. `scripts/resolve-theme.mjs` penalizes repeated palettes, accent hues and display fonts and prints the recent hero archetypes; choosing a different hero composition is yours to do.

---

## 3. Business Kind & Page Anatomy Matrix (`design-taste-frontend`)

Match the page's structural plan and media rules to the business kind:

| Business Kind | `page-type` | `site-kind` | Mandatory Anatomy & Media Rules |
|---|---|---|---|
| **Software / SaaS / AI / DevTool / Fintech** | `software` | `software` | Show the real software UI as live HTML inside an `app-frame` (e.g., interactive diff, live query runner, pipeline board)—never an abstract blob or generic fake dashboard. Keep prose to `60–80 words/screen` outside UI frames. |
| **Game / Interactive Title** | `software` | `gaming` | Game title in `h1`, launch/status fact, full-bleed world key art (or large title over setting photography). Never replace key art with a generic shader. |
| **Hardware / Technical Device** | `product` | `tech` | Product shown **large** (`≥ 60%` of frame); a different angle/view in each section; close-up part details; **clicking a color swatch MUST switch the displayed product visual**. |
| **Physical Product Brand** (bike, furniture, apparel) | `product` | `other` | Real or licensed stand-in photography leads (`≥ 2` photos/screen); flat token grounds, 1 brand band; **zero WebGL/shaders/grain** unless 3D is explicitly requested. |
| **Professional Service** (clinic, law, agency, studio) | `service` | `other` | Photography of work/people/space + authentic tool icons; flat grounds; at most 1 static diagram; clear booking/contact action. |
| **Local Place** (cafe, bakery, hotel, shop, gym) | `place` | `other` | Photographic hero, visit/hours/district block on screen 2, distinct compositions for offer vs. space, 1 large typographic moment, mobile sticky action bar. Zero shaders or diagrams. |

---

## 4. Brand Asset 5-Step Protocol (`huashu-design`)

When the user names a real brand or reference site:
1. Check workspace for existing brand guidelines, SVGs, or CSS tokens.
2. Check official brand/press resources or user-supplied screenshots/files.
3. Extract exact `#hex` / `rgb` / `oklch` color frequencies from SVG/CSS/HTML source—**never guess a real brand's color from memory**.
4. Lock extracted colors into `:root` CSS custom properties (`--brand-primary`, `--brand-bg`, `--brand-ink`).
5. Use official SVG marks or clean typographic wordmarks; never hand-draw a distorted imitation of a real logo.

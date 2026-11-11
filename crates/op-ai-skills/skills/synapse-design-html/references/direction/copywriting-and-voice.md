> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Copywriting, Voice, Registers & Anti-Slop Rules

> **Source:** Migrated and de-conflicted from `design-taste-frontend` (`copy.md`, `copy-voice.md`, `copy-registers.md`, `copy-tells.md`) and `impeccable` (`clarify.md`).
> **Stage:** Stage 1, Stage 2 & Stage 4.
> **Role:** Ensures every heading, button, label, error message, and paragraph reads like a human domain expert wrote it, with zero AI writing tells.

---

## 1. The Five Iron Laws of Web Copy

1. **The `h1` Names the Category and the Buyer/Place in 2–8 Words:**
   - Say plainly what is sold and who it is for (e.g., *"Payroll automation for multi-state clinics"*, *"Grade-5 titanium flagship smartphone"*, *"Sourdough bakery in Leith"*).
   - Never use a vague riddle, mood slogan, or empty command (*"Where the future begins"*, *"Every shift, sorted"*, *"Elevate your workflow"*).
2. **Screen 1 Holds At Least One Hard Fact:**
   - Include a concrete price, dimension, latency figure, capacity, operating hour, or live interactive specimen in the first viewport.
3. **Every Section Heading Contains a Concrete Noun:**
   - Name the subject, part, or capability (*"Rooms and nightly rates"*, *"Optical periscope assembly"*, *"Automated tax filing"*).
   - If a heading uses a muted second sentence (`<span class="muted">`), separate both sentences with a period—never write a run-on fragment.
4. **Buttons Are `Verb + Object` (1–5 Words):**
   - Start with an action verb + what the user gets: `Start 14-day trial`, `Add Aether Phone to bag`, `Download CSV report`, `Book a consultation`, `Compare 3 models`.
   - **Banned button labels:** `Submit`, `Click here`, `Learn more`, `Read more`, `Discover`, `Explore`, `More`.
5. **Action Discipline:**
   - At most **2 actions in the hero** (primary + secondary).
   - The primary transaction CTA uses identical wording in the navbar, hero, and closing section, and appears at most twice in a single viewport.

---

## 2. Voice Registers by Domain (`copy-registers`)

Pick one voice register in Stage 1 and hold it across the entire surface:

| Register | Best For | Sentence Rhythm & Diction |
|---|---|---|
| **Dry Technical** | DevTools, infrastructure, compilers, security, hardware engineering | Short declarative clauses, exact units (`ms`, `GB/s`, `μm`), active verbs, zero adjectives without numbers. |
| **Warm Matter-of-Fact** | Local places, bakeries, clinics, hospitality, physical craft | Plain spoken nouns, materials, provenance, opening hours, and prices stated without sales pressure. |
| **Crisp Operational** | Fintech, B2B SaaS, logistics, admin dashboards | Direct task labels, unambiguous status badges, cause-and-recovery error copy. |
| **Editorial Essay** | Cultural exhibitions, research labs, architecture studios, long-form docs | Measured cadence, historical or material context, concrete citations, calm authority. |

---

## 3. Word Budgets & Microcopy Clarity (`copy.md` × `clarify.md`)

- **Marketing / Tech Screen Budget:** Keep copy outside UI mocks/diagrams to **60–80 words per screen** at `1440px`. Card body copy is 1–2 sentences (`12–25 words` max). No paragraph wider than `75ch` or taller than 5 lines on marketing pages.
- **No Captions Under Visuals:** Never write a caption under an image or 3D render explaining what the picture already shows. License credits go in a single footer line.
- **Actionable Error & Empty Microcopy (`clarify.md`):**
  - Bad error: *"Invalid input"* or *"Error 500"*.
  - Good error: *"Card security code must be 3 digits"* or *"Could not save changes because the connection dropped. Retry save."*

---

## 4. Banned AI Slop Words & Structural Tells (`copy-tells`)

`verify-surface.mjs` automatically scans for and flags these tells:

- **Banned Vocabulary:** `seamlessly`, `unleash`, `elevate`, `supercharge`, `empower`, `delve`, `tapestry`, `beacon`, `game-changing`, `revolutionary`, `next-gen`, `cutting-edge`, `world-class`, `synergy`, `unlock the power of`, `built for the modern`.
- **Banned Rhetorical Tics:**
  - Starting every section with a 1-word or 2-word all-caps eyebrow label (`FEATURES`, `WHY US`, `THE PLATFORM`).
  - Repeated `"Not X. Just Y."` or `"No X, no Y, just Z"` contrast formulas (use at most once per page).
  - Triplet slogan headers (`"Fast. Secure. Scalable."`).
- **Honest Fact & Contact Rules:**
  - Never invent customer quotes, star ratings, company registration numbers, street numbers, or real-format phone numbers.
  - Use `.example` for placeholder emails/domains (`support@acme.example`).
  - Mark any illustrative price, metric, or schedule with `data-assumed="true"` and list it in the final delivery report.

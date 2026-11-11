> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Imagegen Guardrails, Prompting Schema & Licensed Photography

> **Source:** Migrated and de-conflicted from `imagegen` (`SKILL.md`, `references/prompting.md`, `references/sample-prompts.md`) and `design-taste-frontend` (`references/photos.md`).
> **Stage:** Stage 2 (Asset Planning & Generation).
> **Role:** Enforces the boundary between code-native UI and raster imagery, defines the 11-line Labeled Prompt Spec, locks edit invariants, and governs workspace asset paths.

---

## 1. When NOT to Generate Raster Images (Hard Boundary)

Do **not** invoke any image generation tool when the visual belongs in code:
- **UI Controls, Dashboards, Cards, Forms, Navigation, Charts, and Tables:** Build these as live, interactive HTML/CSS/SVG. Never generate a bitmap picture of a dashboard or button and drop it into an `<img>` tag.
- **Icons, Logos, and Technical Diagrams:** Use an established SVG icon family (Lucide, Heroicons, or `design-taste-frontend/scripts/icons.mjs`) or clean inline SVG geometry.
- **`Operate` and `Read` Surfaces:** Default to **zero decorative raster images**. Only generate or include imagery on `Operate`/`Read` surfaces when the task itself manipulates media or requires an instructional diagram.

---

## 2. Runtime Mode Detection (`Mode A / Mode B / Mode C`)

Before generating or editing raster assets, determine the active runtime mode:
1. **Mode B (Host-Native Tool — Preferred Default):** If the agent environment exposes a built-in image tool (`image_generation`, `image_gen`, `dalle`, `mcp__*image*`), pass the structured prompt directly to that tool. No `OPENAI_API_KEY` is required.
2. **Mode A (Local CLI API):** If `ENABLE_GARDEN_IMAGEGEN=1` and `OPENAI_API_KEY` are set (verified via `node <skill-dir>/scripts/check-mode.js --json`), run `node <skill-dir>/scripts/generate.js` or `node <skill-dir>/scripts/edit.js`.
3. **Mode C (Prompt Advisor + Licensed Photo / Placeholder Fallback):** When neither a host tool nor an API key is available:
   - Save the rendered prompt to `docs/prompts/<asset-slug>.md`;
   - Use licensed Wikimedia Commons photography or a clean aspect-ratio CSS placeholder card;
   - Report the saved prompt path in Section 4 of the delivery report. Never pretend an image was generated when it was not.

---

## 3. Shared 11-Line Labeled Prompt Schema (Standard Assets & Cutouts)

Structure prompts in this exact order: `scene/backdrop -> subject -> details -> constraints`.

```text
Use case: <photorealistic-natural | product-mockup | background-extraction | stylized-concept | precise-object-edit>
Asset type: <landing page hero | product card visual | transparent cutout | section feature photo>
Primary request: <concise description of what to generate or edit>
Input images: <Image 1: edit target; Image 2: style reference> (omit if generating from scratch)
Scene/backdrop: <environment or surface; for cutouts specify "transparent background">
Subject: <main subject, posture, scale, and physical details>
Style/medium: <editorial photography, 50mm f/2.8, natural film grain | studio 3D render>
Composition/framing: <wide shot with 40% clean negative space on left for HTML headline overlay | 4:5 portrait>
Lighting/mood: <soft directional key light, subtle contact shadow, warm neutral tone>
Color palette: <anchored to surface tokens: --bg, --surface, --accent>
Constraints: no UI chrome, no buttons, no text overlays, no logos, no watermarks
```

### Augmentation & Specificity Rules
- If the user's image request is already specific, normalize it into the schema without inventing extra props, characters, or story beats.
- For **photorealism**, call for concrete physical texture: matte anodized aluminum grain, woven fabric threads, natural stone pores, soft contact shadows.
- For **transparent cutouts (`background-extraction`)**, explicitly request a clean silhouette on a genuinely transparent alpha background with zero halos and no fake checkerboard pattern.

---

## 4. Image Editing & Multi-Image Invariants

1. **Distinguish Intent:**
   - **Edit:** Modifying an existing image while preserving the rest.
   - **Generate with Reference:** Using an input image for mood, lighting, or composition while creating a new scene.
2. **Lock Invariants Aggressively:** Every edit prompt must state:
   `Constraints: change only <target attribute>; keep <subject identity, silhouette edges, camera angle, and lighting> unchanged; no text; no watermark.`
3. **Non-Destructive Versioning:** Never overwrite an existing user asset unless explicitly asked; write to a versioned sibling filename (`hero-product-v2.png`).

---

## 5. Workspace Save-Path & HTML Integration Rules

- **Never leave project-referenced images in `/tmp`, `$CODEX_HOME`, or external skill folders.** Copy or save every shipped asset into the project's static directory (`public/assets/`, `src/assets/`, or `./assets/`).
- **Prevent Cumulative Layout Shift (CLS):** Every `<img>` tag must declare explicit `width`, `height`, `aspect-ratio`, and a descriptive `alt` attribute (empty `alt=""` only for purely decorative backgrounds).
- **Never Filter or Grade Real Photographs in CSS:** Do not apply heavy CSS `filter: sepia/contrast`, halftone, or dither shaders over product or place photography.
- **No Captions Under Visuals:** Never place an explanatory caption beneath a photo or render; place photo license credits in a single compact line inside `<footer>`.

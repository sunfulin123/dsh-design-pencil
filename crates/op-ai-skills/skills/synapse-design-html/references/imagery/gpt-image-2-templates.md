> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# GPT-Image-2 Structured JSON Templates for Web & Product Visuals

> **Source:** Migrated, de-conflicted, and translated to 100% English from `gpt-image-2` (`references/prompt-writing.md`, `product-visuals/*`, `poster-and-campaigns/banner-hero.md`, `scenes-and-illustrations/concept-scene.md`).
> **Stage:** Stage 2 (High-Impact Visual Asset Generation).
> **Role:** Provides structured JSON prompt templates for complex commercial visuals where a simple paragraph prompt underperforms.
> **Conflict Removed:** All templates that generate fake raster UI screenshots (`live-commerce-ui`, `social-interface-mockup`, `landing-page-case-study`) are excluded—web UI chrome must always be built in live HTML/CSS.

---

## 1. When to Use JSON Prompt Templates

Use these structured JSON templates instead of the 11-line schema when generating:
1. **Commercial Studio Flagship Product Shots** (hero hardware, luxury bottles, industrial devices)
2. **Technical Exploded-View Product Cutaways** (layered internal engineering assemblies)
3. **Wide Hero Banners with Engineered Negative Space** (16:9 / 21:9 compositions built to hold live HTML typography on one side)
4. **Lifestyle Product Scenes** (physical products placed in authentic architectural or outdoor settings)
5. **Cinematic World / Game Key Art** (full-bleed environmental concept scenes)

**Popular `gpt-image-2` Sizes:**
- `1536x1024` (Landscape 3:2) or `2048x1152` (2K 16:9 wide hero)
- `1024x1024` (1:1 square product card)
- `1024x1536` (Portrait 2:3 editorial frame)
- `3840x2160` (4K ultra-sharp landscape)

---

## 2. Template 1: Commercial Studio Product Hero (`premium-studio-product`)

Use for flagship hardware, consumer electronics, watches, cosmetics, or industrial objects where the product is the sole hero.

```json
{
  "type": "commercial_studio_product_hero",
  "goal": "Magazine-grade studio product photography where the physical product is the unmistakable focal point with tactile material fidelity",
  "subject": {
    "product_name": "<e.g., Grade-5 Titanium Smartphone / Precision Espresso Grinder>",
    "visual_description": "<exact geometry, chamfered edges, matte anodized finish, camera module or mechanical dials>",
    "position": "Positioned on the right-center third (leaving left 40% calm for live HTML typography)",
    "scale": "Occupies 55-65% of frame height"
  },
  "background": {
    "surface": "<e.g., brushed dark basalt slab / warm architectural travertine / seamless matte studio sweep>",
    "color_tone": "<matched to page --bg and --surface tokens>"
  },
  "lighting": {
    "key_light": "45-degree top-left softbox creating crisp specular highlights along machined edges",
    "fill_light": "Subtle warm bounce fill from right",
    "rim_light": "Controlled backlight separating silhouette from background",
    "contact_shadow": "Natural grounded occlusion shadow directly beneath the base"
  },
  "props": {
    "enabled": false,
    "rule": "Max 1-2 tonal material props only if required by brief; never clutter the product"
  },
  "constraints": {
    "must_keep": [
      "Product geometry crisp and undistorted",
      "Unified lighting direction and color temperature",
      "Clean negative space on the designated text side"
    ],
    "avoid": [
      "Baked-in UI buttons, fake website navigation, or watermarks",
      "Gibberish text on the background",
      "Competing background objects or neon purple/pink lighting"
    ]
  }
}
```

---

## 3. Template 2: Technical Hardware Exploded View (`exploded-view-poster`)

Use for engineering deep-dives, hardware architecture sections, or modular product breakdowns. *(Tip: Keep callout labels in live HTML/SVG over the image rather than baking small text into the bitmap.)*

```json
{
  "type": "technical_exploded_view_render",
  "goal": "High-precision 3D engineering exploded view showing internal subsystems aligned along a clean vertical or isometric axis",
  "subject": "<e.g., Flagship Smartphone / VR Headset / Acoustic Speaker / Electric Motor>",
  "layout": {
    "axis": "Isometric 30-degree or vertical stacked explosion along a single central axis",
    "layers_from_top_to_bottom": [
      "1. Micro-textured ceramic shield front glass",
      "2. Ultra-thin OLED display assembly with copper flex cable",
      "3. Machined titanium mid-frame chassis",
      "4. Custom silicon mainboard with shielding cans",
      "5. Triple-lens optical periscope module with prism",
      "6. High-density graphite thermal vapor chamber",
      "7. High-capacity battery cell pack",
      "8. Matte glass rear housing"
    ],
    "spacing": "Even vertical separation between layers with clear air gaps and zero interpenetration"
  },
  "style": {
    "rendering": "Photorealistic industrial CAD studio render, physically based materials (copper, brushed titanium, matte silicon, optical glass)",
    "background": "Solid neutral studio ground matching page --bg token (or transparent alpha)",
    "lighting": "Clean studio rim and top lighting revealing internal depth and metallic micro-textures"
  },
  "constraints": {
    "must_keep": [
      "Every internal layer coaxial and proportionally accurate",
      "Crisp edges suitable for overlaying live HTML/SVG leader lines"
    ],
    "avoid": [
      "Baked-in blurry text labels or misspelled callouts inside the bitmap",
      "Intersecting or floating random gears",
      "Sci-fi glowing holograms"
    ]
  }
}
```

---

## 4. Template 3: Wide Web Hero Scene (`banner-hero` / `lifestyle-product-scene`)

Use when a `Persuade` or `Experience` landing page needs a wide environmental or lifestyle hero image behind or beside live HTML copy.

```json
{
  "type": "web_hero_environmental_visual",
  "aspect_ratio": "16:9",
  "subject": {
    "primary": "<product or architectural/artisan subject in authentic use>",
    "placement": "Right two-thirds of frame, sharp focus on subject"
  },
  "environment": {
    "setting": "<concrete real-world setting: e.g., sunlit Nordic woodworking bench / late-evening Tokyo acoustic studio>",
    "depth_of_field": "85mm f/2.0 shallow depth of field, calm uncluttered background on left third"
  },
  "color_and_light": {
    "lighting": "Natural directional window light or golden-hour practicals",
    "palette": "Harmonized with page CSS variables (--bg, --ink, --accent)"
  },
  "constraints": {
    "must_keep": [
      "Left 35-40% low-frequency tonal area so live HTML h1 and CTA button remain > 4.5:1 contrast",
      "Authentic physical textures (wood grain, linen, metal, skin pores)"
    ],
    "avoid": [
      "Any text, headlines, buttons, or logos rendered inside the image",
      "Plastic AI skin smoothing or oversaturated HDR halos"
    ]
  }
}
```

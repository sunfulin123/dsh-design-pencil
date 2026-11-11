> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# 3D, WebGL, Shaders & Scroll Cinema Domain Index (`references/webgl-3d/`)

> **Stage:** Stage 3 & Stage 4 (Load **ONLY** when 3D, WebGL, shaders, hardware cutaways, or scroll cinema are in scope)
> **Purpose:** Routes between the 3D synthesis guides and all 49 specialized playbooks from `CloudAI-X/threejs-skills`, `Moh4696/open-3d-skills`, `viettranx/3dviz-pro-max`, `agiwhitelist/auteur`, `design-taste-frontend`, and `impeccable`.

---

## 1. Conflict Resolution & Budget Rules in This Domain

1. **The `site-kind` Gate:** WebGL, shaders, and 3D scenes are permitted ONLY on technical, software, gaming, hardware, or creative showcase surfaces (`Persuade` / `Experience`) or when the user explicitly asks for 3D. Never put WebGL shaders on local cafes, clinics, law firms, or `Operate` admin tables.
2. **Hard Context & FPS Budget:** Max **4 live WebGL contexts** on a page (`perf.mjs` / `verify-surface.mjs` rule); cap `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))`; pause off-screen render loops via `IntersectionObserver`; render a static frame or poster on mobile (`< 768px`) and under `prefers-reduced-motion: reduce`.
3. **Three.js r186 API Authority:** Whenever writing Three.js or React Three Fiber code, `threejs-r186-and-r3f.md` and the `threejs-*.md` modules win over older training-data habits (`Timer` over `Clock`, `HDRLoader` over `RGBELoader`, `SRGBColorSpace` over `sRGBEncoding`).

---

## 2. Primary Synthesis Guides (Read First When Using 3D/WebGL)

| File | When to Load |
|---|---|
| [`threejs-r186-and-r3f.md`](threejs-r186-and-r3f.md) | **Mandatory before writing any Three.js / R3F code:** Deprecated-vs-r186 API table, zero-leak 3-point lighting starter, and R3F 9 rules. |
| [`exploded-views-and-scroll-films.md`](exploded-views-and-scroll-films.md) | **Read for hardware showcases:** Interactive 3D exploded views, 2D HTML leader-line callouts, scroll-scrubbed frame sequences, and transparent video. |
| [`effects-budget-and-overdrive.md`](effects-budget-and-overdrive.md) | **Read for shaders/particles:** The 4-context WebGL budget, progressive enhancement fallbacks, and Overdrive/Auteur techniques. |

---

## 3. Full De-Conflicted Source Playbooks (Load Only the Specific Module Needed)

### A. `CloudAI-X/threejs-skills` (13 Modules — Three.js r186, WebGPU/TSL & R3F 9.8)
- [`threejs-fundamentals.md`](threejs-fundamentals.md) — Scene, camera, `WebGLRenderer`/`WebGPURenderer`, `Timer` loop, resize & disposal.
- [`threejs-geometry.md`](threejs-geometry.md) — `BufferGeometry`, `InstancedMesh`, `BatchedMesh`, points, lines, and custom attributes.
- [`threejs-materials.md`](threejs-materials.md) — PBR `MeshStandardMaterial` / `MeshPhysicalMaterial`, clearcoat, transmission, and `NodeMaterial`.
- [`threejs-lighting.md`](threejs-lighting.md) — Physical light units, `PCFSoftShadowMap`, `HDRLoader` environment maps, and shadow bias tuning.
- [`threejs-textures.md`](threejs-textures.md) — Color spaces (`SRGBColorSpace` vs. linear), anisotropy, mipmaps, KTX2, and render targets.
- [`threejs-animation.md`](threejs-animation.md) — `AnimationMixer`, skeletal/morph targets, and action crossfading.
- [`threejs-loaders.md`](threejs-loaders.md) — `GLTFLoader` with Draco, Meshopt, KTX2, progress tracking, and memory cleanup.
- [`threejs-shaders.md`](threejs-shaders.md) — `ShaderMaterial`, GLSL uniforms/varyings, `onBeforeCompile`, and WebGPU TSL (`Fn`, `uniform`, `uv`).
- [`threejs-postprocessing.md`](threejs-postprocessing.md) — `EffectComposer`, Bloom, SSAO, tone mapping, and WebGPU `RenderPipeline`.
- [`threejs-interaction.md`](threejs-interaction.md) — `Raycaster` picking, `OrbitControls`, camera flight interpolation, and drag gizmos.
- [`threejs-performance.md`](threejs-performance.md) — Frame budget profiling, draw-call reduction, GPU memory leaks, and shader compile stalls.
- [`threejs-react-three-fiber.md`](threejs-react-three-fiber.md) — R3F 9.8 `<Canvas>`, `useFrame` mutation rules, `@react-three/drei` 10.7 helpers, and Suspense.
- [`threejs-asset-pipeline.md`](threejs-asset-pipeline.md) — Optimizing `.glb` models with `@gltf-transform/cli` and `gltfjsx`.

### B. `Moh4696/open-3d-skills` (8 Modules — 3D Product Sites & Scroll Films)
- [`open3d-threejs-scene.md`](open3d-threejs-scene.md) — Real-time 60fps architectural/machine scenes built from code, sky/sun blending, and fitted shadows.
- [`open3d-exploded-view.md`](open3d-exploded-view.md) — Staged mechanical explode, X-ray cutaway casing, section planes, and leader-line labels.
- [`open3d-scroll-film.md`](open3d-scroll-film.md) — Scroll-scrubbed canvas frame sequences and keyframe-aligned video playback.
- [`open3d-alpha-cutout.md`](open3d-alpha-cutout.md) — Cross-browser transparent video (Safari HEVC + WebGL stacked-alpha keyer).
- [`open3d-cursor-rig.md`](open3d-cursor-rig.md) — Spring-driven pose grids and cursor-tracking character/object rigs.
- [`open3d-motion-assets.md`](open3d-motion-assets.md), [`open3d-site-check.md`](open3d-site-check.md), [`open3d-frame-capture.md`](open3d-frame-capture.md) — Planning AI motion assets, checking WebGL draw calls/frame times, and virtual-clock 60fps recording.

### C. `viettranx/3dviz-pro-max` (12 Modules — Creative 3D Worlds & Procedural Craft)
- [`3dviz-pro-max-overview.md`](3dviz-pro-max-overview.md) & [`3dviz-catalog-index.md`](3dviz-catalog-index.md) — 10-step 3D world workflow, 24 subject directions, and CLI search (`python3 <skill-dir>/scripts/search-3dviz.py "<query>"`).
- [`3dviz-design-synthesis.md`](3dviz-design-synthesis.md), [`3dviz-object-reasoning.md`](3dviz-object-reasoning.md), [`3dviz-object-craft.md`](3dviz-object-craft.md) — Procedural modeling from real structural anatomy.
- [`3dviz-lighting-direction-and-scale.md`](3dviz-lighting-direction-and-scale.md), [`3dviz-motion-and-state.md`](3dviz-motion-and-state.md), [`3dviz-physical-interaction.md`](3dviz-physical-interaction.md), [`3dviz-subject-clarity-and-motion.md`](3dviz-subject-clarity-and-motion.md) — Camera bookmarks, atmospheric lighting, and physical simulation rules.
- [`3dviz-blender-threejs-handoff.md`](3dviz-blender-threejs-handoff.md), [`3dviz-research-and-truth.md`](3dviz-research-and-truth.md), [`3dviz-reasoning-and-checks.md`](3dviz-reasoning-and-checks.md) — Blender-to-Three.js pipeline and visual frame inspection.

### D. `agiwhitelist/auteur`, `design-taste-frontend` & `impeccable`
- [`auteur-scroll-cinema.md`](auteur-scroll-cinema.md), [`auteur-scroll-flight.md`](auteur-scroll-flight.md), [`auteur-ambient-backgrounds.md`](auteur-ambient-backgrounds.md), [`auteur-motion.md`](auteur-motion.md), [`auteur-direct.md`](auteur-direct.md), [`auteur-taste.md`](auteur-taste.md), [`auteur-verify.md`](auteur-verify.md) — Film-directed WebGL particles, fluid shaders, and scroll-flight stages.
- [`taste-effects-usage.md`](taste-effects-usage.md), [`taste-effects-objects-product-render.md`](taste-effects-objects-product-render.md), [`taste-effects-creative.md`](taste-effects-creative.md), [`taste-big-scenes.md`](taste-big-scenes.md) — Raymarched JSON `product-render` builder, print shaders, and scroll-held big scenes.
- [`impeccable-overdrive.md`](impeccable-overdrive.md) — Pushing browser limits with WebGPU, OffscreenCanvas, WASM, and custom shaders.

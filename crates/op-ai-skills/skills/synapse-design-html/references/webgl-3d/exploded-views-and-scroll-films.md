> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Interactive Exploded Views, Scroll Films, Cutouts & 3D Worlds

> **Source:** Migrated from `Moh4696/open-3d-skills` (`threejs-scene`, `exploded-view`, `scroll-film`, `alpha-cutout`, `cursor-rig`) and `viettranx/3dviz-pro-max`.
> **Stage:** Stage 3 & Stage 4 (When building interactive 3D hardware explainers, scroll-scrubbed films, or 3D visualizations).
> **Role:** Provides architectural blueprints for interactive hardware cutaways, leader-line annotations, scroll-scrubbed video/frame sequences, and 24-direction 3D visualization kits.

---

## 1. Interactive Hardware Exploded Views (`open-3d-skills: exploded-view`)

Use this architecture when the user asks to show how a device, machine, or product works inside (e.g., flagship smartphone internals, electric motor, camera lens, acoustic speaker):

### Step 1: Define Coaxial Part Metadata
Group every physical component into a named `THREE.Group` with authored rest and explosion vectors:
```js
const PARTS = [
  { id: 'display', name: 'LTPO OLED Display', spec: '120Hz · 2400 nits peak', rest: [0, 0.45, 0], explode: [0, 1.8, 0], start: 0.0, end: 0.6 },
  { id: 'chassis', name: 'Grade-5 Titanium Frame', spec: 'CNC unibody · 184g', rest: [0, 0.15, 0], explode: [0, 0.65, 0], start: 0.1, end: 0.7 },
  { id: 'optics', name: '5x Periscope Telephoto', spec: '120mm focal equivalent', rest: [0.3, 0.05, -0.2], explode: [1.1, 0.3, -0.4], start: 0.2, end: 0.85 },
  { id: 'logic', name: 'Aether Silicon SoC', spec: '3nm · 45 TOPS NPU', rest: [0, -0.1, 0], explode: [0, -0.45, 0], start: 0.15, end: 0.8 },
  { id: 'battery', name: 'Silicon-Carbon Cell', spec: '5500 mAh · 80W fast charge', rest: [0, -0.35, 0], explode: [0, -1.5, 0], start: 0.0, end: 0.65 },
];
```

### Step 2: Staged Smoothstep Interpolation + X-Ray Shell
Drive explosion factor `t ∈ [0, 1]` from a clean interactive step pill bar (`Assembled (0)` / `Exploded (1)` / `Optics Focus`) or a range scrubber:
```js
function smoothstep(min, max, value) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

function updateExplosion(t) {
  for (const part of partMeshes) {
    const localT = smoothstep(part.meta.start, part.meta.end, t);
    part.mesh.position.lerpVectors(part.restVec, part.explodeVec, localT);
  }
  // Optional X-Ray casing fade when partially exploded
  outerShellMaterial.opacity = 1 - smoothstep(0.1, 0.45, t) * 0.75;
  outerShellMaterial.transparent = outerShellMaterial.opacity < 1;
}
```

### Step 3: Crisp 2D HTML Callout Leader Lines
Never render technical specification text as blurry textures inside the 3D canvas. Project each part's 3D anchor point to 2D screen space and draw crisp SVG leader lines to HTML callout badges:
```js
function updateCalloutPosition(anchorWorldVec3, camera, canvasRect, domEl) {
  const projected = anchorWorldVec3.clone().project(camera);
  const x = (projected.x * 0.5 + 0.5) * canvasRect.width;
  const y = (-(projected.y * 0.5) + 0.5) * canvasRect.height;
  domEl.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
}
```

---

## 2. Scroll-Scrubbed Films (`open-3d-skills: scroll-film`)

When a marketing section scrubs through a pre-rendered image sequence or video clip as the user scrolls:
- **Canvas Image Sequence Over `<video currentTime>`:** Setting `video.currentTime` directly on scroll stutters unless the video is encoded with every frame as a keyframe (`-g 1`). Drawing preloaded WebP frames onto a `<canvas>` (`ctx.drawImage(frames[frameIndex], 0, 0)`) is rock-solid at 60fps across all browsers.
- **Hold Windows for Captions:** Hold the start frame for the first `10%` of scroll and the end frame for the last `10%` so headline and specification captions can be read at rest.
- **Mobile & Reduced-Motion Fallback:** Below `768px` or under `prefers-reduced-motion: reduce`, unpin the sticky stage and show 2–3 key still frames in a clean vertical layout.

---

## 3. Transparent Video & Cursor Rigs (`alpha-cutout` & `cursor-rig`)

- **Cross-Browser Transparent Video (`alpha-cutout`):** Safari does not support WebM VP9 alpha in all contexts; either provide dual `<source src="clip.mov" type='video/mp4; codecs="hvc1"'>` + `<source src="clip.webm" type="video/webm">` or use a WebGL stacked-alpha shader (top half RGB, bottom half luma mask).
- **Cursor-Tracking Rig (`cursor-rig`):** Use a damped spring (`stiffness: 180, damping: 24`) to interpolate pointer normalized coordinates `[-1, 1]` into subtle object/character head yaw (`±12°`) and pitch (`±8°`). Disable on touch devices (`@media (pointer: coarse)`).

---

## 4. Creative 3D Visualization Principles (`viettranx/3dviz-pro-max`)

When building domain-specific 3D explainers (architecture cutaways, logistics flows, molecules, orbital mechanics, gear trains):
1. **Model the Rules, Not Just Moving Decoration:** Coupled gears must turn at their true tooth ratio (`r1 / r2`); architectural cutaways must show real floor slabs and circulation paths.
2. **Camera Presets (Bookmark Views):** Provide 3–4 named camera preset buttons (`Overview`, `Cutaway`, `Top Plan`, `Detail Close-Up`) that smoothly slerp camera position and `controls.target` so users never get lost in 3D space.
3. **Visual Self-Check:** Capture the rendered WebGL canvas in headless Chromium (`verify-surface.mjs`) and inspect the PNG to verify the model is framed, lit, and non-blank.

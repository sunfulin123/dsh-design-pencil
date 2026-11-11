> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Three.js r186, React Three Fiber 9, WebGPU/TSL & Asset Pipeline

> **Synapse precedence:** This is a migrated source playbook. `SKILL.md` overrides it. Ignore any rule here about asking the user (Stage 1 asks once), its own workflow order, starter files, screenshot sizes other than 375/768/1440, or CLIs not present in `scripts/`. Use it only for craft knowledge.


> **Source:** Migrated from `CloudAI-X/threejs-skills` (13 modules verified against `three@0.186`, `@react-three/fiber@9.8`, `@react-three/drei@10.7`, `@gltf-transform/cli@4.5`).
> **Stage:** Stage 3 & Stage 4 (When 3D / WebGL / WebGPU is in scope).
> **Role:** Prevents deprecated Three.js API crashes, enforces physically based lighting/materials, and standardizes React Three Fiber and glTF pipelines.

---

## 1. Common Mistakes: Deprecated vs. Modern `three@0.180–0.186+` APIs

Models frequently emit outdated Three.js r140–r165 patterns. Always use the right-hand column:

| Outdated / Broken Pattern (NEVER USE) | Modern `three@0.180–0.186+` Replacement (MUST USE) |
|---|---|
| `renderer.outputEncoding = THREE.sRGBEncoding` | `renderer.outputColorSpace = THREE.SRGBColorSpace` (default in r152+) |
| `texture.encoding = THREE.sRGBEncoding` | `texture.colorSpace = THREE.SRGBColorSpace` (for color maps; leave normal/roughness/metalness linear) |
| `new THREE.Clock()` | `new THREE.Timer()` (`timer.update(timestamp); const dt = timer.getDelta();`) |
| `RGBELoader` (renamed in r180+) | `HDRLoader` from `three/addons/loaders/HDRLoader.js` (or `RGBELoader` only if pinned `< 0.175`) |
| `BoxBufferGeometry`, `SphereBufferGeometry` | `BoxGeometry`, `SphereGeometry` (all built-in geometries are `BufferGeometry`) |
| `geometry.addAttribute('position', ...)` | `geometry.setAttribute('position', ...)` |
| `physicallyCorrectLights = true` | Removed; physical lighting units (candela, lux, lumens) are always on by default |
| Uncapped `renderer.setPixelRatio(window.devicePixelRatio)` | `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))` |

---

## 2. Production Vanilla Three.js Starter (`threejs-fundamentals` & `threejs-lighting`)

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.0/examples/jsm/"
  }
}
</script>
```

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function mountScene(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(3.2, 2.2, 4.5);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 3-Point Studio Lighting Rig
  const hemi = new THREE.HemisphereLight(0xffffff, 0x22242a, 0.7);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 7, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  const rimLight = new THREE.DirectionalLight(0xea580c, 1.1);
  rimLight.position.set(-4, 3, -4);
  scene.add(hemi, keyLight, rimLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false; // Prevent hijacking page wheel scroll

  const timer = new THREE.Timer();
  let rafId = null;
  let isVisible = true;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function render(timestamp) {
    if (!isVisible) return;
    timer.update(timestamp);
    controls.update();
    renderer.render(scene, camera);
    if (!reducedMotion) rafId = requestAnimationFrame(render);
  }

  const ro = new ResizeObserver(() => {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.render(scene, camera);
  });
  ro.observe(container);

  const io = new IntersectionObserver(([entry]) => {
    isVisible = entry.isIntersecting;
    if (isVisible && !reducedMotion) rafId = requestAnimationFrame(render);
    else if (rafId) cancelAnimationFrame(rafId);
  });
  io.observe(container);

  // Always render at least 1 initial frame immediately
  renderer.render(scene, camera);

  return function dispose() {
    if (rafId) cancelAnimationFrame(rafId);
    ro.disconnect();
    io.disconnect();
    controls.dispose();
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => m?.dispose());
      }
    });
    renderer.dispose();
  };
}
```

---

## 3. React Three Fiber 9 & Drei Best Practices (`threejs-react-three-fiber`)

- **Never mutate React state inside `useFrame`:** Calling `setState` at 60fps triggers 60 React re-renders per second. Mutate `meshRef.current.rotation.y += delta` or uniforms directly inside `useFrame((state, delta) => ...)`.
- **Cap DPR & Demand Framing:** On battery-sensitive or static product viewers, set `<Canvas dpr={[1, 2]} frameloop="demand" shadows>`.
- **Use Proven `drei` Helpers:** `<Environment preset="studio" />`, `<ContactShadows opacity={0.4} scale={10} blur={2} />`, `<Float>`, `<Html transform occlude>` for 3D-anchored annotations, and `useGLTF.preload('/model.glb')`.

---

## 4. Materials, Shaders, WebGPU/TSL & Performance (`threejs-materials` / `performance`)

- **PBR Material Realism:** Pure `metalness: 1.0, roughness: 0.0` looks black without an environment map (`scene.environment`). Keep realistic machined metals around `metalness: 0.85–0.95, roughness: 0.18–0.32`, and anodized/matte polymers at `metalness: 0.1, roughness: 0.45–0.65`.
- **Instancing & Draw Calls:** Keep draw calls `< 100` on web pages. When rendering `> 50` identical meshes (particles, grid pins, architectural louvers), use `THREE.InstancedMesh` or `THREE.BatchedMesh`.
- **glTF Compression (`threejs-asset-pipeline`):** Configure `DRACOLoader` (`https://www.gstatic.com/draco/versioned/decoders/1.5.7/`) or `MeshoptDecoder` when loading production `.glb` files.
- **WebGPU & TSL (`threejs-shaders`):** Only use `WebGPURenderer` when explicitly requested and always guard with `if ('gpu' in navigator)` plus a `WebGLRenderer` fallback.

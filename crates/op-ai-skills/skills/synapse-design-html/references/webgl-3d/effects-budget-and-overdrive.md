> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Effects Budget, Big Scenes, Raymarched Objects & Overdrive

> **Source:** Migrated and de-conflicted from `design-taste-frontend` (`effects-usage.md`, `effects-objects.md`, `scenes.md`), `impeccable` (`overdrive.md`), and `agiwhitelist/auteur`.
> **Stage:** Stage 3 & Stage 4 (Implementation).
> **Role:** Enforces the strict WebGL/shader budget so ambitious effects elevate a tech/creative site without turning it into laggy slop.

---

## 1. The Effects Gate: Who Earns Shader / WebGL Effects? (`effects-usage.md`)

- **Allowed (`site-kind: software | gaming | tech`):** AI products, developer tools, fintech platforms, games, hardware devices, and creative portfolios (`Experience`).
- **Banned (`site-kind: place | service | other`):** Local cafes, bakeries, restaurants, clinics, law firms, agencies, and non-technical retail shops. On those surfaces, real photography, typography, and flat token grounds carry the page—never put a WebGL fluid shader or particle field behind a bakery or clinic.
- **Subject Before Effect:** An abstract shader or particle cloud must never replace the product itself. Show the software's actual UI (`app-frame`), the hardware's geometry/photographs, or the game's world art first; the effect supports the stage.

---

## 2. Hard Tech & Performance Budget (`effects-usage.md` × `perf.md`)

Every page with ambitious effects must obey these 5 budgets:
1. **One Focal Effect Per Page:** Choose at most **one** primary WebGL/shader centerpiece (a hero shader ground, a 3D product stage, or 1 scroll-driven big scene). Never stack two competing shaders in adjacent sections.
2. **Max 4 Live WebGL Contexts:** Browsers drop the oldest WebGL context above 8–16 contexts, and mobile GPUs thermal-throttle above 4. Keep total active `<canvas>` WebGL contexts `≤ 4` and pause/free off-screen canvases via `IntersectionObserver`.
3. **Never Behind Body Copy:** Never run a moving shader, particle field, or high-contrast grid directly behind multi-line reading paragraphs.
4. **One Pointer Effect Per Page:** Use at most one cursor-linked effect (a subtle card spotlight or a 3D object gently turning toward the pointer). Never replace the native OS cursor with a lagging custom DOM cursor, and never use magnetic buttons that jump away from clicks.
5. **5-Second Loop Pause Rule:** Any continuous visual loop lasting longer than 5 seconds requires a quiet pause toggle or automatic pause when off-screen, and must rest completely under `prefers-reduced-motion: reduce`.

---

## 3. Pushing Browser Limits Responsibly (`impeccable overdrive` × `auteur`)

When a brief explicitly calls for an extraordinary, award-level ("Overdrive" / "Auteur") technical centerpiece:

| Goal | Recommended Browser-Native / GPU Technique | Required Fallback |
|---|---|---|
| **Cinematic state morph** | Native `View Transitions API` (`document.startViewTransition`) + `@starting-style` | Instant DOM swap under `prefers-reduced-motion` |
| **Massive dataset (50k+ rows)** | Virtualized viewport rendering or `OffscreenCanvas` in a Web Worker | Paginated semantic `<table>` for screen readers |
| **Interactive particle / fluid hero (`auteur`)** | Instanced buffer geometry or 2D GPGPU ping-pong FBO (`≤ 65k` particles on desktop, `≤ 8k` on mobile) | Crisp static typography / SVG poster when WebGL2 is unavailable or reduced-motion is active |
| **Animated gradients / custom properties** | CSS `@property` with typed `<angle>` or `<color>` (`inherits: false`) | Static gradient stop fallback |
| **Hardware without 3D model files (`product-render`)** | Procedural raymarched SDF or composite rounded-box/cylinder Three.js assembly from a JSON spec | High-contrast studio still or SVG technical elevation |

### Progressive Enhancement Pattern (Non-Negotiable)
```js
function initAmbitiousEffect(canvas, fallbackEl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    fallbackEl.hidden = false;
    canvas.hidden = true;
    return;
  }
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) {
    fallbackEl.hidden = false;
    canvas.hidden = true;
    return;
  }
  // Initialize WebGL effect...
}
```

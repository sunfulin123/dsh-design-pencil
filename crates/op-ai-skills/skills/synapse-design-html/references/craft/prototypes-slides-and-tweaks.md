> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# Interactive Prototypes, Tweaks Panel, Device Frames & Slide Engine

> **Source:** Migrated and de-conflicted from `web-design-engineer` (`SKILL.md`, `references/advanced-patterns.md`) and `huashu-design`.
> **Stage:** Stage 3 & Stage 4 (Implementation).
> **Role:** Provides ready-to-use code templates for the collapsible `Tweaks` panel (state/theme/variant switching), React+Babel rules, device frames, 1920×1080 HTML slide decks, and data visualizations.

---

## 1. Collapsible `Tweaks` Panel Template (For Live State & Variant Review)

Embed this lightweight, self-contained `Tweaks` panel in prototypes and greenfield builds so both the user and `verify-surface.mjs` can test all **6 content states** (`normal`, `loading`, `empty`, `error`, `partial`, `success`, `permission`) and theme/layout variants on the fly. Keep it **closed by default** so viewport screenshots stay clean.

**Three Non-Negotiable State-Switching Laws:**
1. **Always include `[hidden] { display: none !important; }` globally** so `display: grid` / `display: flex` containers never stay visible when `.hidden = true` is set.
2. **Mutually exclusive state views:** Replacement states (`loading`, `empty`, `error`, `permission`) must hide `[data-state-normal]`.
3. **Auto-scroll off-screen state scope into view:** When a state button in `Tweaks` is clicked, if `[data-state-scope]` is outside the current viewport, smoothly scroll it into view via `window.scrollTo` so the user immediately sees the state change.

```html
<style>
  [hidden] { display: none !important; }
  .synapse-tweaks {
    position: fixed;
    bottom: 16px;
    right: 16px;
    z-index: 9990;
    font-family: var(--font-sans, system-ui, sans-serif);
    font-size: 13px;
  }
  .synapse-tweaks__toggle {
    background: var(--ink, #121316);
    color: var(--bg, #F4F4F1);
    border: 1px solid color-mix(in oklch, var(--bg, #fff) 20%, transparent);
    border-radius: 999px;
    padding: 8px 14px;
    min-height: 36px;
    cursor: pointer;
    opacity: 0.72;
    transition: opacity 150ms ease, transform 150ms cubic-bezier(0.22, 1, 0.36, 1);
  }
  .synapse-tweaks__toggle:hover { opacity: 1; }
  .synapse-tweaks__panel {
    margin-bottom: 8px;
    width: 276px;
    background: var(--surface, #fff);
    color: var(--ink, #121316);
    border: 1px solid color-mix(in oklch, var(--ink, #000) 14%, transparent);
    border-radius: 12px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .synapse-tweaks__row { display: flex; flex-direction: column; gap: 4px; }
  .synapse-tweaks__label { font-size: 11px; font-weight: 600; color: var(--muted, #555); }
  .synapse-tweaks__pills { display: flex; flex-wrap: wrap; gap: 4px; }
  .synapse-tweaks__pill {
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid color-mix(in oklch, var(--ink, #000) 15%, transparent);
    background: transparent;
    color: inherit;
    font-size: 12px;
    cursor: pointer;
  }
  .synapse-tweaks__pill[aria-pressed="true"] {
    background: var(--accent, #C2410C);
    color: var(--accent-ink, #fff);
    border-color: transparent;
  }
</style>

<aside class="synapse-tweaks" aria-label="Design Tweaks">
  <div class="synapse-tweaks__panel" id="synapse-tweaks-panel" hidden>
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <strong>Tweaks</strong>
      <button type="button" class="synapse-tweaks__pill" onclick="document.getElementById('synapse-tweaks-panel').hidden=true">Close</button>
    </div>
    <div class="synapse-tweaks__row">
      <span class="synapse-tweaks__label">Content State (Target: Primary Data Section)</span>
      <div class="synapse-tweaks__pills" role="group" aria-label="Content state">
        <button type="button" class="synapse-tweaks__pill" data-set-state="normal" aria-pressed="true">Normal</button>
        <button type="button" class="synapse-tweaks__pill" data-set-state="loading" aria-pressed="false">Loading</button>
        <button type="button" class="synapse-tweaks__pill" data-set-state="empty" aria-pressed="false">Empty</button>
        <button type="button" class="synapse-tweaks__pill" data-set-state="error" aria-pressed="false">Error</button>
        <button type="button" class="synapse-tweaks__pill" data-set-state="partial" aria-pressed="false">Partial</button>
        <button type="button" class="synapse-tweaks__pill" data-set-state="success" aria-pressed="false">Success</button>
        <button type="button" class="synapse-tweaks__pill" data-set-state="permission" aria-pressed="false">Permission</button>
      </div>
    </div>
  </div>
  <button type="button" class="synapse-tweaks__toggle" onclick="const p=document.getElementById('synapse-tweaks-panel');p.hidden=!p.hidden">
    Tweaks
  </button>
</aside>

<script>
  function applySurfaceState(nextState, { scrollIfOffscreen = true } = {}) {
    document.documentElement.dataset.uiState = nextState;
    document.querySelectorAll('[data-set-state], [data-state-btn]').forEach(btn => {
      const val = btn.dataset.setState || btn.dataset.stateBtn;
      btn.setAttribute('aria-pressed', String(val === nextState));
    });
    const scope = document.querySelector('[data-state-scope]') || document.getElementById('catalog-section');
    if (scope && scrollIfOffscreen) {
      const rect = scope.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.65) {
        const targetTop = Math.max(0, window.scrollY + rect.top - 72);
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
    }
  }
</script>
```

---

## 2. Three Non-Negotiable Rules for Inline React + Babel Prototypes

When building standalone HTML prototypes using React 18 UMD + `@babel/standalone`:
1. **Never declare `const styles = { ... }`:** Multiple scripts declaring a top-level `styles` object silently overwrite each other. Always namespace by component (`const navbarStyles = { ... }`).
2. **Attach Cross-File Components to `window`:** Separate `<script type="text/babel">` blocks do not share module scope. Export shared components explicitly at the bottom of each script:
   `Object.assign(window, { ProductCard, ComparisonDrawer });`
3. **Never Call `element.scrollIntoView()`:** In embedded preview frames, `scrollIntoView` hijacks the outer host window's scroll position. Use `container.scrollTop = ...` or `window.scrollTo({ top, behavior: 'smooth' })`.

---

## 3. Responsive 16:9 HTML Slide Deck Engine (`1920×1080`)

When the deliverable is an HTML presentation deck:
- Fixed `1920×1080` `.stage` auto-fitted to any viewport via `transform: scale(Math.min(innerWidth/1920, innerHeight/1080))`.
- Keep navigation controls **outside** `.stage` so buttons stay clickable on small screens.
- Persist current slide index in `localStorage`.
- **1-Indexed Slide Labels:** Every `<section class="slide">` carries `data-screen-label="01 Title"`, `02 Architecture`, etc., and displays `1 / N` to the user.

---

## 4. Device Simulation Frames (Mobile App Prototypes)

When the user asks for an iOS/Android mobile app prototype viewed on desktop:
- Center a `390×844px` device frame (`border-radius: 48px`, `12px` bezel, `54px` status bar with `9:41` and Dynamic Island pill, `34px` bottom home indicator clearance).
- On actual mobile screens (`@media (max-width: 480px)`), strip the outer bezel and fill `100dvh` natively.

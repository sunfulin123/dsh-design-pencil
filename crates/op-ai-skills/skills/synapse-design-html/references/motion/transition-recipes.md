> **Synapse adaptation:** This is optional reference material. The active `synapse-design` and `synapse-design-html` skills, the user’s request, and the selected product DESIGN take precedence over legacy theme selection, palettes, tool instructions, working directories, mandatory questions, and references to other hosts. Apply only guidance relevant to this task.

# 14 CSS & JS Transition Recipes

> **Source:** Migrated verbatim and de-conflicted from `ui-animation` (`references/transition-recipes.md`).
> **Stage:** Stage 3 & Stage 4 (Implementation).
> **Role:** Copy-paste, production-tested CSS and JS recipes for the 14 canonical UI transitions.

---

## 1. Shared `:root` Motion Tokens

Include the relevant variables from this block in your stylesheet:

```css
:root {
  --ease-enter: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-move: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
  --ease-overshoot: cubic-bezier(0.34, 1.56, 0.64, 1);

  --morph-open-dur: 580ms;
  --morph-close-dur: 300ms;
  --morph-open-ease: linear(0, 0.45, 0.78, 1, 1.17, 1.21, 1.18, 1.12, 1.05, 1.02, 1);
  --morph-close-ease: cubic-bezier(0.32, 0.72, 0, 1);
  --morph-content-dur: 140ms;
  --morph-content-blur: 3px;

  --dropdown-open-dur: 200ms;
  --dropdown-close-dur: 130ms;
  --dropdown-pre-scale: 0.95;

  --modal-open-dur: 240ms;
  --modal-close-dur: 150ms;
  --modal-scale: 0.96;

  --panel-open-dur: 320ms;
  --panel-close-dur: 220ms;
  --panel-translate-y: 10px;
  --panel-blur: 3px;

  --odo-dur: 240ms;
  --text-swap-dur: 150ms;
  --icon-swap-dur: 180ms;
}
```

---

## 2. Container Morph (Trigger Becomes Surface)

A button or pill grows in place into the form, search bar, or card it opens.
1. Old face fades/blurs out (`0 -> 140ms`);
2. Container tweens measured `width`/`height` (`580ms` with spring overshoot on open, `300ms` critically damped on close);
3. New face fades/blurs in after `transition-delay: 140ms`.

```css
.t-morph {
  position: relative;
  overflow: hidden;
  transition: width var(--morph-close-dur) var(--morph-close-ease),
              height var(--morph-close-dur) var(--morph-close-ease);
}
.t-morph[data-open="true"] {
  transition-duration: var(--morph-open-dur);
  transition-timing-function: var(--morph-open-ease);
}
.t-morph-face {
  transition: opacity var(--morph-content-dur) ease, filter var(--morph-content-dur) ease;
}
.t-morph-face[data-face="open"] { position: absolute; inset: 0; }
.t-morph[data-open="false"] [data-face="open"],
.t-morph[data-open="true"] [data-face="closed"] {
  opacity: 0;
  filter: blur(var(--morph-content-blur));
  pointer-events: none;
}
.t-morph[data-open="true"] [data-face="open"],
.t-morph[data-open="false"] [data-face="closed"] {
  transition-delay: var(--morph-content-dur);
}
```

---

## 3. Origin-Aware Menu Dropdown & Tooltip

Dropdowns scale from their trigger (`transform-origin`), starting at `scale(0.95)` (never `scale(0)`).

```css
.t-dropdown {
  opacity: 1;
  transform: scale(1) translateY(0);
  transform-origin: var(--trigger-origin, top left);
  transition: opacity var(--dropdown-open-dur) var(--ease-enter),
              transform var(--dropdown-open-dur) var(--ease-enter),
              display var(--dropdown-open-dur) allow-discrete;
  @starting-style {
    opacity: 0;
    transform: scale(var(--dropdown-pre-scale)) translateY(-4px);
  }
}
.t-dropdown[hidden], .t-dropdown.is-closing {
  opacity: 0;
  transform: scale(0.97) translateY(-2px);
  transition-duration: var(--dropdown-close-dur);
}
```
*Tooltip rule:* First tooltip opens after `300ms` hover delay (`125ms` transition from `scale(0.97)`); subsequent tooltips in the same bar get `[data-instant] { transition-duration: 0ms; }`.

---

## 4. Modal Dialog & Drawer Sheet

- **Modal:** Keep `transform-origin: center` (app-level overlay), animate both modal (`scale(0.96 -> 1)`) and backdrop (`opacity`) with identical duration (`240ms` open, `150ms` close).
- **Drawer / Sheet:** Slide from screen edge using percentage `transform: translate3d(100%, 0, 0) -> translate3d(0, 0, 0)` over `280ms` with `var(--ease-drawer)` (`cubic-bezier(0.32, 0.72, 0, 1)`).

---

## 5. Icon Swap & In-Place Text State Swap

### Icon Swap (Grid Stack Cross-Blur)
```css
.t-icon-swap { display: inline-grid; place-items: center; }
.t-icon-swap > * {
  grid-area: 1 / 1;
  opacity: 0;
  transform: scale(0.4);
  filter: blur(2px);
  transition: opacity var(--icon-swap-dur) ease, transform var(--icon-swap-dur) var(--ease-enter), filter var(--icon-swap-dur) ease;
}
.t-icon-swap[data-state="a"] [data-icon="a"],
.t-icon-swap[data-state="b"] [data-icon="b"] {
  opacity: 1;
  transform: scale(1);
  filter: blur(0);
}
```

### Text State Swap ("Copy" → "Copied" in Place)
Confirm actions directly on the button that triggered them (`translateY(-4px)` + `blur(2px)` exit, swap text, force reflow `void el.offsetWidth`, `translateY(4px -> 0)` enter).

---

## 6. Odometer Digit Roll & Number Pop-In

Always set `font-variant-numeric: tabular-nums` and only roll the digits that actually changed (`d !== prev[i]`):

```css
.t-odo { display: inline-flex; font-variant-numeric: tabular-nums; }
.t-odo-slot { display: inline-block; overflow: hidden; height: 1em; line-height: 1em; }
@keyframes odo-roll {
  from { transform: translateY(calc(var(--odo-dir, 1) * 1em)); opacity: 0; }
}
.t-odo-digit[data-rolling] { display: block; animation: odo-roll var(--odo-dur) var(--ease-enter) both; }
```

---

## 7. Page Side-by-Side Slides, Success Draw & Error Shake

- **Page Side-by-Side:** Stack views in `display: grid` (`grid-area: 1 / 1`); outgoing view translates `-8px` with `blur(3px)` while incoming view enters from `+8px`.
- **Success Celebration:** Measure SVG checkmark length via `path.getTotalLength()`, set `--path-length`, and transition `stroke-dashoffset` from `var(--path-length)` to `0` over `450ms var(--ease-enter)`.
- **Error State Shake:** Keep `.is-shaking` (controls `220ms` `±4px` horizontal keyframe shake, removed on `animationend`) separate from `.is-error` (controls persistent error border and inline message).

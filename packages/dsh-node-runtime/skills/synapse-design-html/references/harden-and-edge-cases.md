# Production Hardening, Forms, Onboarding & Edge Cases

> **Source:** Migrated and de-conflicted from `impeccable` (`harden.md`, `onboard.md`) and `ui-ux-pro-max` (`Forms & Feedback`, `Accessibility`, `Touch & Interaction`).
> **Stage:** Stage 3 & Stage 4 (Implementation).
> **Role:** Ensures the interface survives extreme data, long strings, internationalization, network failures, and first-run empty states.

---

## 1. Text Overflow, Flex/Grid Shrink & Extreme Data (`harden.md`)

Designs that only work with curated 3-word strings break in production. Always guard containers against extreme inputs:

1. **Flex & Grid Minimum Size Guard:**
   Every flex child or grid cell holding dynamic text, tables, or code MUST set `min-width: 0` (and `min-height: 0` in nested vertical flex/grid) so long content wraps or truncates instead of blowing out the viewport width:
   ```css
   .flex-child, .grid-cell { min-width: 0; }
   .truncate-1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
   .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
   .break-safe { overflow-wrap: break-word; word-break: break-word; hyphens: auto; }
   ```
2. **Test With Extreme Values:**
   - 80-character product titles or user names / emails without spaces
   - `0` items, `1` item (check grid alignment when only 1 card exists), and `100+` items
   - Large currency/metric numbers (`$12,450,990.00` with `tabular-nums`)

---

## 2. Internationalization (i18n) & Logical CSS Properties

- **30–40% Text Expansion Budget:** Never set fixed pixel widths (`width: 96px`) on buttons, tabs, or badges; use `padding-inline` and `min-width` so German, French, or localized strings expand gracefully.
- **Logical Properties for RTL Readiness:** Prefer `margin-inline-start`, `padding-inline`, `border-inline-end`, and `inset-inline-end` over physical `left`/`right`.
- **Locale-Aware Formatting:** Format numbers, currencies, and dates with `Intl.NumberFormat` / `Intl.DateTimeFormat`. Preserve Zero-Width Non-Joiners (`U+200C`) in user input sanitizers.

---

## 3. Forms, Validation & Feedback Engineering (`ui-ux-pro-max` §8)

Whenever a surface includes forms, filters, search, or configuration inputs:

1. **Visible Labels Always:** Every `<input>`, `<select>`, and `<textarea>` requires a persistent visible `<label for="...">`. Placeholder-only labels disappear on typing and fail accessibility.
2. **Mobile Keyboard & Zoom Prevention:**
   - Set `font-size: 1rem` (`≥ 16px`) on all form inputs on mobile so iOS Safari never auto-zooms the page on focus.
   - Use semantic input attributes: `type="email"`, `type="tel"`, `inputmode="numeric"`, `autocomplete="..."`.
3. **Inline Validation on Blur (Never on Every Keystroke):**
   - Validate when the user leaves the field (`blur`) or submits; clear the error immediately as soon as the user edits the field back to a valid state.
   - Render error messages directly below the offending field (`role="alert"` or `aria-live="polite"`) stating **what is wrong + how to fix it**—never show a generic banner at the top of the page alone.
   - On submit failure, automatically move focus (`el.focus()`) to the first invalid field.
4. **Submit, Success & Undo States:**
   - Disable or lock the submit button during async loading and show inline progress (`Saving...`).
   - Confirm completion in place on the control; only fire a confirmation after a real action handler completes.
   - For destructive or bulk actions (delete item, clear cart, reset config), either offer an immediate inline **`Undo`** action (5-second window) or require explicit confirmation with the destructive button visually separated in semantic danger color.

---

## 4. Onboarding & First-Run Empty States (`onboard.md`)

- **Empty States Must Teach and Act:** An empty table, cart, filter result, or dashboard widget must never say only *"No data"*. State what belongs there, why it is currently empty, and provide **1 primary button** that resolves it (e.g., `Load sample dataset`, `Clear active filters`, `Create first workflow`).
- **Progressive Disclosure:** Do not overwhelm first-time users with 15 advanced configuration fields upfront; surface the core 3 controls and place advanced parameters in an expandable drawer or secondary section.

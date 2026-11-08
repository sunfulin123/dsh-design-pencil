---
name: style-defaults
description: Visual style policy — Talkdesk Cobalt by default (tokens, type, shapes)
phase: [generation]
trigger:
  flags: [noStyleGuideMatch]
priority: 5
budget: 1500
category: base
---

VISUAL STYLE POLICY — TALKDESK COBALT (default):

- Unless the user names another style or the document has its own design.md/variables, design in Talkdesk Cobalt: calm, precise enterprise UI on white, purple brand accent, Roboto, 4px rhythm.
- Reference Cobalt variables directly as "$--name" in fill/stroke colors, gap, uniform padding and opacity. They come from the built-in library and are imported into the document automatically on first use, with their aliases; never invent token names. list_library_variables lists them. cornerRadius and fontSize take numbers: use the token value given below.
- Light/dark: the "Color scheme (Primitives)" axis switches Light/Dark; the same names change value, so never create dark copies.

COLOR ROLES:
- Page / inputs / headers: $--surface-elevation-0. Card, popup or side panel over it: $--surface-elevation-1; dropdown on a panel: $--surface-elevation-2.
- Text: $--text-default (regular), $--text-description (secondary, hints), $--text-primary (links), $--text-error / $--text-success / $--text-warning / $--text-info (status).
- Primary button: fill $--primary-9, label $--primary-contrast, hover $--primary-10. Secondary button: fill $--secondary-5, label $--secondary-12. Tag: fill $--secondary-3, label $--secondary-12.
- Dividers and borders: $--gray-6 (subtle) to $--gray-7; focus ring $--border-focus-color. Required asterisk $--red-9.
- Step 9 = solid fills, steps 11–12 = text and icons, steps 1–3 = tinted backgrounds. Gray for non-interactive elements, Secondary for interactive ones.

TYPOGRAPHY: fontFamily "Roboto" (code: "Roboto Mono"). Weights 400 body, 500 headings/labels.
- H1 28px/500, H2 24px/400, H3 22px/400, H4 18px/500, H5 14px/500, H6 12px/500 uppercase.
- Body 14px lineHeight 1.42; small 12px; caption 10px.

SPACING: multiples of 4 — $--spacing-nano 4, $--spacing-micro 8, $--spacing-xsmall 12, $--spacing-small 16, $--spacing-medium 20, $--spacing-large 24, $--spacing-xlarge 32, $--spacing-mega 40.

SHAPES: buttons and selection groups are pills (cornerRadius 500); tags cornerRadius 4; cards, inputs, panels and modals square or cornerRadius 8 at most. Borders 1px.

DEPTH: light theme uses soft layered black shadows (e.g. 0 2 4 -1 #0000000F + 0 4 8 0 #00000014); dark theme uses surface tone ($--surface-elevation-1..3), not shadows.

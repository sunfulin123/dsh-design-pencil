---
name: 'talkdesk-cobalt'
tags: [enterprise, corporate, clean, light-mode, dark-mode, calm, crisp, sidebar]
platform: webapp
---

## Style Scope

This guide is self-contained. Apply its palette, radius scale, spacing, shadows, and component treatments only when this exact guide is selected; do not borrow food, social, dashboard, luxury, terminal, or other guide-specific patterns into another style. Treat unnamed layout frames as structural by default: no fill, stroke, cornerRadius, or shadow unless the node is intentionally a card, input, button, badge, media mask, navigation surface, or other visible component. Avoid decorative wrapper shells around components; hierarchy should come from spacing, typography, and this guide's explicit surfaces.

## Style Summary

Talkdesk Cobalt is the Talkdesk product design system and the default style of this editor: a calm, precise enterprise interface on white with Talkdesk Purple (#5405BD) as the single brand accent, Roboto throughout, and a 4px spacing rhythm. Colour comes from generated 12-step ramps, so each step has one job in both light and dark themes and a screen switches theme without new decisions. Every token below is a built-in library variable: reference it as `$--name` in colors, gap, padding and opacity, and it is imported into the document, with its aliases, on first use. cornerRadius and fontSize take the listed numbers.

Key aesthetics:

- **Contrast-first ramps**: step 9 for solid fills, steps 11–12 for text and icons, steps 1–3 for tinted backgrounds
- **One brand accent**: `$--primary-9` (#5405BD) for primary actions only; Gray for non-interactive elements, Secondary for interactive ones
- **Pill buttons, square containers**: buttons are fully rounded, while cards, inputs and panels stay square or nearly so
- **Roboto at two weights**: 400 for body, 500 for headings and labels
- **Tonal dark theme**: the `Color scheme (Primitives)` axis switches Light/Dark; dark depth comes from surface tone, not shadows

## Color System

### Surfaces

| Token | Light | Dark | Usage |
| --- | --- | --- | --- |
| `$--surface-elevation-0` | #FFFFFF | #1A1A1A | Page background, inputs, headers |
| `$--surface-elevation-1` | #FFFFFF | #1D2123 | Card, popup or side panel over the page |
| `$--surface-elevation-2` | #FFFFFF | #25292D | Dropdown on a side panel |
| `$--gray-2` | #F8F9FA | #1B1D1F | Subtle inset areas, table stripes |

### Text

| Token | Light | Usage |
| --- | --- | --- |
| `$--text-default` | #1D2123 | Regular text, headings |
| `$--text-description` | #606569 | Descriptions, hints, supporting text |
| `$--text-placeholder` | #B6BCC0 | Placeholder on inputs with a visible label |
| `$--text-primary` | #6A41D2 | Links, refresh actions, active tabs |
| `$--text-error` / `$--text-success` / `$--text-warning` / `$--text-info` | #D22B21 / #00814A / #A26A00 / #275DCC | Status text |

### Accent and components

| Token | Light | Usage |
| --- | --- | --- |
| `$--primary-9` | #5405BD | Primary button fill (same in dark) |
| `$--primary-10` | #4600A6 | Primary hover / pressed |
| `$--primary-contrast` | #FFFFFF | Label on primary fill |
| `$--primary-3` | #F2F0FF | Selected row, accent wash |
| `$--secondary-5` / `$--secondary-12` | #DEE2E4 / #1C2023 | Secondary button fill / label |
| `$--secondary-3` | #EEF0F2 | Tag fill |
| `$--gray-6` / `$--gray-7` | #D6DADD / #CACFD3 | Dividers, borders |
| `$--border-focus-color` | #A794FF | Focus ring |
| `$--red-9` | #DB362A | Required asterisk, destructive fill |

## Typography

### Font Families

| Role | Family | Usage |
| --- | --- | --- |
| Base | Roboto | All UI text |
| Mono | Roboto Mono | Code, IDs, tabular data |

### Type Scale

| Level | fontSize | Weight | Line height | CSS token |
| --- | --- | --- | --- | --- |
| H1 | 28px | 500 | 1.42 | `--font-size-xgiga` |
| H2 | 24px | 400 | 1.33 | `--font-size-giga` |
| H3 | 22px | 400 | 1.33 | `--font-size-xmega` |
| H4 | 18px | 500 | 1.33 | `--font-size-xlarge` |
| H5 | 14px | 500 | 1.42 | `--font-size-medium` |
| H6 | 12px | 500, uppercase | 1.33 | `--font-size-small` |
| Body | 14px | 400 | 1.42 | `--font-size-medium` |
| Small | 12px | 400 | 1.33 | `--font-size-small` |

## Spacing & Shapes

- Spacing is multiples of 4: `$--spacing-nano` 4, `$--spacing-micro` 8, `$--spacing-xsmall` 12, `$--spacing-small` 16, `$--spacing-medium` 20, `$--spacing-large` 24, `$--spacing-xlarge` 32, `$--spacing-mega` 40.
- Buttons and selection groups: cornerRadius 500 (`--border-radius-pill`). Tags: 4 (`--border-radius-xsmall`). Cards, inputs, panels and modals: square, or 8 (`--border-radius-small`) at most.
- Borders: 1px (`--border-width-base`); focus rings 2px (`--border-width-thin`).
- Light-theme elevation uses soft layered black shadows (level 1: 0 2 4 -1 #0000000F plus 0 4 8 0 #00000014). In dark theme use surface tone instead of shadows.

## Do's and Don'ts

- Do use semantic roles (Primary, Secondary, Info, Success, Warning, Error) rather than raw families.
- Do keep the label on `$--primary-9` as `$--primary-contrast`; never `$--surface-elevation-0`, which is dark in dark theme.
- Don't use Neutral directly, invent token names, or create separate dark variables.
- Don't use more than one accent colour on a screen; status colours are for status only.

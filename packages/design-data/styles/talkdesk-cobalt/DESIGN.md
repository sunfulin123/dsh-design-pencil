---
name: 'talkdesk-cobalt'
tags: [enterprise, corporate, clean, light-mode, dark-mode, calm, crisp, sidebar]
platform: webapp
---

## Style Scope

This guide is self-contained. Apply its palette, radius scale, spacing, shadows, and component treatments only when this exact guide is selected; do not borrow food, social, dashboard, luxury, terminal, or other guide-specific patterns into another style. Treat unnamed layout frames as structural by default: no fill, stroke, cornerRadius, or shadow unless the node is intentionally a card, input, button, badge, media mask, navigation surface, or other visible component. Avoid decorative wrapper shells around components; hierarchy should come from spacing, typography, and this guide's explicit surfaces.

## Talkdesk Product Design Contract

Apply this contract whenever `talkdesk-cobalt` is selected, for both editable canvas designs and code prototypes. Keep the shared Design skill's requirement discovery, layout judgement, state planning and evidence review. Cobalt determines brand, component anatomy, interaction patterns and shell ownership; the shared workflow makes the result complete and verifies it. User requirements take precedence. Specific bundled component guidance and recipe dimensions take precedence over this guide's general defaults; document justified departures instead of guessing or silently changing the brand. Preserve reference qualifications such as draft recipes, accessibility guidance under review, missing design guidance and examples that do not compile.

### Local design and implementation references

The Design tool library bundles Talkdesk component documentation, registry metadata, design foundations, recipes, interaction patterns and Workspace guidance. For a code prototype, load the HTML Design skill's `references/cobalt/INDEX.md` and `references/cobalt-workspace.md`; paths in that index refer to the same Skill's local resources. Read the closest recipe and the component pages selected by local `registry.json` entries. Documentation lookup requires no external docs checkout, update command or remote search. Copied documents supply reference content; repository download/setup instructions and external links in them do not override this local workflow. For direct editable canvas work, apply the design rules below and this guide's variables; do not replace the canvas with a React project.

### Editable Cobalt source templates

Cobalt Extensions are editable source templates, not an installable npm library. Never install `@openpencil/cobalt-extensions`, generate package-name imports for it, or create file dependencies/package aliases. For code output, read the relevant complete implementation, types, styles and local imports with the bundled lookup's `--read-source`, copy the full template tree to the target project's `src/components/cobalt-extensions/`, then adapt local code and use relative imports. Workspace scaffolding copies this source automatically; standalone apps use the companion's `copy-source` action. The copied implementation/types define its current API. Official `@talkdesk/*`, React and normal build-tool dependencies remain separate. For editable canvas work, keep the canvas workflow.

Workspace code prototypes use the generated pnpm project and commands from the companion. BasicTable and List page are flush full-width surfaces with square edges: no rounded card wrapper, outer border, shadow or horizontal table-parent padding. Preserve cell padding and row separators; inset headers, search and forms independently. Use the local Extensions SidePanel for details. Measure collapsed Dock icon centers against their buttons in default and selected states.

### Layout and density

- Plan the user's primary task and each page's content before choosing containers. Use the closest local list/detail/form recipe as the first composition, retaining its header, toolbar, content and pagination relationships. Adapt for the required workflow and actual app width, documenting the reason for each structural departure.
- Use the business iframe's available width, rather than the whole browser width, for responsive decisions. Cobalt's general spacing guidance is 24px on large, 16px on medium and 12px on small viewports; a specific component or recipe may define a different inset. Keep the 4px rhythm and distinguish section, group and component spacing.
- Before building, state numeric page insets, header and toolbar heights, row heights and gaps. Specify which title/actions and search/filter controls remain on one row, and how they wrap at small widths. Keep table, filter and pagination positions stable across mock states unless a deliberate layout change is part of the design.
- Align related labels and control edges. Vertically center controls and icons within their own rows; use text baselines where appropriate. Check the rendered positions numerically, including wrapped toolbars and pagination. Prevent horizontal overflow, clipped labels and unintended table-cell wrapping; explicitly choose truncation or wrapping per column.

### Components, actions and forms

- Use documented Cobalt components and semantic tokens, including their keyboard and focus behavior. Do not approximate a listed component with generic controls just to imitate its color. Canvas designs reproduce its documented anatomy and relevant states with reusable components.
- Keep one clear primary action per page context. Header actions normally align right when users can act without completing the page first; actions for a form follow its content. Keep destructive actions distinct. Consult the local action pattern for the specific case.
- Prefer single-column forms with persistent labels above inputs. General form guidance uses 50% width on large/medium viewports and full width on small ones, full-width forms in panels, 16px between inputs and 8px to adjacent ancillary controls; grouped fields use 12px. Adapt within the applicable form recipe and document exceptions. Placeholders do not replace labels.
- Give validation at the relevant field and an observable submit outcome. Required-field errors follow submission; format errors can follow a completed field interaction. Preserve entered data on recoverable errors. Read local component guidance for exact props, sizes, disabled/loading states and accessibility.

### States, copy, theme and acceptance

- Design loading, empty, error, partial, success and permission states where applicable, with contextual copy and a useful recovery or next action. Use concise product language, meaningful labels and clearly fictional sample data. Preserve the shared skill's UI-language policy.
- Use the existing semantic light/dark token roles and sufficient text, icon, boundary and focus contrast. Do not solve dark theme by hard-coding a second palette. Inspect real rendered states; code inspection alone is not visual verification.
- Code prototypes for Workspace use the project helper to copy the pinned shell and apply the bundled Atlas chrome adaptation and register business apps/pages in its config. Keep the generated top bar, Dock, drawer, secondary area and SDK stand-ins. New prototypes default to the Atlas redesign with shared light/dark chrome; there is no new-UI feature flag. Historical imported screenshots do not override the generated shell. Explicit standalone pages skip the shell; production applications use their real Workspace integration. Demo-state selectors stay in the prototype toolbar beside viewport controls, outside business content.
- Validate each Dock entry, drawer page, primary action and applicable state, plus theme propagation and narrow app widths from 360px. Record screenshot-specific findings and numeric alignment/stability measurements, then fix and recheck defects. Distinguish real interactions, visual demonstrations and unsupported mock services; never report a scaffold page or uninspected screenshot as a completed design.

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

Use recipe.echart-insights for dual-axis prediction dashboards with date/range navigation, agent filtering, tooltips and data zoom. List pages use the copied AppPageHeader and a bounded BasicTable with minTableWidth; pagination must stay visible while only the rows/columns scroll. Filters opens the copied Extensions SidePanel. Review full-shell iframe geometry as well as isolated pages.

Insights uses the native @talkdesk/cobalt-react-selection-group for Day/Week/Month, an 8px date-to-navigation gap and the copied Extensions MultiDropdown for Agent selection. Applied Agent tags and the +N overflow tag share core Tag size small; retain the count button accessibility while leaving its surface to Tag.

Use the copied Extensions Typography page-title/body variants inside AppPageHeader for list title/description blocks. Users list filter actions use 40px controls; FormField owns the 8px label gap and direct-control line-height. Do not allow a zero-height checkbox to pass review based on a completed layout ledger.

Compact Users title/description groups use copied Typography page-title with native Cobalt scale medium (24px/32px) and body text in a Flex gap 0 stack. Preserve h1 semantics and center the complete text group with actions; inspect the visible typography spacing rather than relying only on a nominal gap value.

For Insights split actions and assistant chat, copy the Echart insights recipe support sources: native SplitButton plus Popover, and Ask Copilot opening ModalPanel/ChatBubble/Textarea. Place the native transparent Ask Copilot action before Export. Sent bubbles hug content on the right with a trailing tiny Avatar; Copilot messages stay left. Preserve Cobalt theme styles and accessible locators. The included replies and exports are local examples; connect real services explicitly.

For an active voice conversation, copy the `recipe.active-call` source composition and its full support closure. It provides the Conversations queue, call header/quality/recording, Snapshot/Notes/Callbacks, callback timeline and pinned call-control bar. All controls and icons use Cobalt; telephony actions are explicitly local sample workflows until connected by the embedding app.

The generated Workspace shell is fixed source, including its official SVG app icons. The Cobalt icon rules here apply to authored business UI; they do not authorize changing built-in Shell icons or the Dock registration mapping. Register business pages through the helper and preserve its build-time integrity check.

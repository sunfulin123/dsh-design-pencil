# Color

## Guidance

:::note
Sourced from the live Cobalt DS's Color page.
:::

Cobalt Design System comes with its own color palette. Some colors are defined by the brand, others
are static.

## Theme

### Semantic colors

In code, each token is a CSS variable from the theme stylesheet (see [Develop](/get-started/develop/)):
`Colors.Primary.9` is `var(--primary-9)`, `Colors.Text.Default` is `var(--text-default)`. The tables below
give each token's variable.

#### Primary

The primary color is the most prominent color of Talkdesk interfaces. It establishes brand awareness
and must be used in the most important elements.

| Token                     | CSS variable         | Value   | Usage                                                |
| ------------------------- | -------------------- | ------- | ---------------------------------------------------- |
| `Colors.Primary.1`        | `--primary-1`        | #FCFCFF | Backgrounds                                          |
| `Colors.Primary.2`        | `--primary-2`        | #F9F8FF | Backgrounds                                          |
| `Colors.Primary.3`        | `--primary-3`        | #F2F0FF | Interactive elements and states                      |
| `Colors.Primary.4`        | `--primary-4`        | #E8E4FF | Interactive elements and states                      |
| `Colors.Primary.5`        | `--primary-5`        | #DED8FF | Interactive elements and states                      |
| `Colors.Primary.6`        | `--primary-6`        | #D1C8FF | Borders and separators                               |
| `Colors.Primary.7`        | `--primary-7`        | #BEB3FF | Borders and separators                               |
| `Colors.Primary.8`        | `--primary-8`        | #A794FF | Borders and separators                               |
| `Colors.Primary.9`        | `--primary-9`        | #5405BD | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Primary.10`       | `--primary-10`       | #4600A6 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Primary.11`       | `--primary-11`       | #6A41D2 | Accessible text over shades 1–2                      |
| `Colors.Primary.12`       | `--primary-12`       | #331E6B | Accessible text over shades 1–2                      |
| `Colors.Primary.contrast` | `--primary-contrast` | #FFFFFF | Used over shade 9                                    |

**Primary or Static Purple:** the primary brand color is variable and updates automatically with
future brand changes. If you want something to always be "purple," independent of brand, use the
static Purple color instead.

#### Secondary

The canvas of the UI — a neutral-based palette, leaving accents to the brand color. Mainly used for
components, interactive elements, and text.

| Token                       | CSS variable           | Value   | Usage                                                |
| --------------------------- | ---------------------- | ------- | ---------------------------------------------------- |
| `Colors.Secondary.1`        | `--secondary-1`        | #FCFCFD | Backgrounds                                          |
| `Colors.Secondary.2`        | `--secondary-2`        | #F8F9FA | Backgrounds                                          |
| `Colors.Secondary.3`        | `--secondary-3`        | #EEF0F2 | Interactive elements and states                      |
| `Colors.Secondary.4`        | `--secondary-4`        | #E6E9EB | Interactive elements and states                      |
| `Colors.Secondary.5`        | `--secondary-5`        | #DEE2E4 | Interactive elements and states                      |
| `Colors.Secondary.6`        | `--secondary-6`        | #D6DADD | Borders and separators                               |
| `Colors.Secondary.7`        | `--secondary-7`        | #CACFD3 | Borders and separators                               |
| `Colors.Secondary.8`        | `--secondary-8`        | #B7BCC1 | Borders and separators                               |
| `Colors.Secondary.9`        | `--secondary-9`        | #888E92 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Secondary.10`       | `--secondary-10`       | #7E8387 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Secondary.11`       | `--secondary-11`       | #5F6568 | Accessible text over shades 1–2                      |
| `Colors.Secondary.12`       | `--secondary-12`       | #1C2023 | Accessible text over shades 1–2                      |
| `Colors.Secondary.contrast` | `--secondary-contrast` | #FFFFFF | Used over shade 9                                    |

#### System colors

System colors stay unchanged regardless of brand, guaranteeing product consistency. They're widespread
and important, but — unlike Primary — don't represent an identity.

**Error** — communicates a dangerous consequence or an error.

| Token                   | CSS variable       | Value   | Usage                                                |
| ----------------------- | ------------------ | ------- | ---------------------------------------------------- |
| `Colors.Error.1`        | `--error-1`        | #FFFCFC | Backgrounds                                          |
| `Colors.Error.2`        | `--error-2`        | #FFF8F7 | Backgrounds                                          |
| `Colors.Error.3`        | `--error-3`        | #FFEBE8 | Interactive elements and states                      |
| `Colors.Error.4`        | `--error-4`        | #FFDBD4 | Interactive elements and states                      |
| `Colors.Error.5`        | `--error-5`        | #FFCDC4 | Interactive elements and states                      |
| `Colors.Error.6`        | `--error-6`        | #FFBDB2 | Borders and separators                               |
| `Colors.Error.7`        | `--error-7`        | #F7A89C | Borders and separators                               |
| `Colors.Error.8`        | `--error-8`        | #EE8D7F | Borders and separators                               |
| `Colors.Error.9`        | `--error-9`        | #DB362A | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Error.10`       | `--error-10`       | #CC2018 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Error.11`       | `--error-11`       | #D22B21 | Accessible text over shades 1–2                      |
| `Colors.Error.12`       | `--error-12`       | #621F18 | Accessible text over shades 1–2                      |
| `Colors.Error.contrast` | `--error-contrast` | #FFFFFF | Used over shade 9                                    |

**Success** — communicates a positive consequence or success.

| Token                     | CSS variable         | Value   | Usage                                                |
| ------------------------- | -------------------- | ------- | ---------------------------------------------------- |
| `Colors.Success.1`        | `--success-1`        | #FBFEFC | Backgrounds                                          |
| `Colors.Success.2`        | `--success-2`        | #F4FBF6 | Backgrounds                                          |
| `Colors.Success.3`        | `--success-3`        | #E6F6EB | Interactive elements and states                      |
| `Colors.Success.4`        | `--success-4`        | #D6F1DF | Interactive elements and states                      |
| `Colors.Success.5`        | `--success-5`        | #C4E8D0 | Interactive elements and states                      |
| `Colors.Success.6`        | `--success-6`        | #AEDDBF | Borders and separators                               |
| `Colors.Success.7`        | `--success-7`        | #90CEA7 | Borders and separators                               |
| `Colors.Success.8`        | `--success-8`        | #61B885 | Borders and separators                               |
| `Colors.Success.9`        | `--success-9`        | #00874F | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Success.10`       | `--success-10`       | #007942 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Success.11`       | `--success-11`       | #00814A | Accessible text over shades 1–2                      |
| `Colors.Success.12`       | `--success-12`       | #1D3B29 | Accessible text over shades 1–2                      |
| `Colors.Success.contrast` | `--success-contrast` | #FFFFFF | Used over shade 9                                    |

**Warning** — communicates a possible, non-critical, dangerous consequence.

| Token                     | CSS variable         | Value   | Usage                                                |
| ------------------------- | -------------------- | ------- | ---------------------------------------------------- |
| `Colors.Warning.1`        | `--warning-1`        | #FEFDFB | Backgrounds                                          |
| `Colors.Warning.2`        | `--warning-2`        | #FFF9E7 | Backgrounds                                          |
| `Colors.Warning.3`        | `--warning-3`        | #FFF1C4 | Interactive elements and states                      |
| `Colors.Warning.4`        | `--warning-4`        | #FFE7AC | Interactive elements and states                      |
| `Colors.Warning.5`        | `--warning-5`        | #FFDC8E | Interactive elements and states                      |
| `Colors.Warning.6`        | `--warning-6`        | #FFCC61 | Borders and separators                               |
| `Colors.Warning.7`        | `--warning-7`        | #F7BB52 | Borders and separators                               |
| `Colors.Warning.8`        | `--warning-8`        | #E7A200 | Borders and separators                               |
| `Colors.Warning.9`        | `--warning-9`        | #EDA813 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Warning.10`       | `--warning-10`       | #E29D00 | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Warning.11`       | `--warning-11`       | #A26A00 | Accessible text over shades 1–2                      |
| `Colors.Warning.12`       | `--warning-12`       | #4B3718 | Accessible text over shades 1–2                      |
| `Colors.Warning.contrast` | `--warning-contrast` | #2C1F09 | Used over shade 9                                    |

**Information** — communicates informative content.

| Token                  | CSS variable      | Value   | Usage                                                |
| ---------------------- | ----------------- | ------- | ---------------------------------------------------- |
| `Colors.Info.1`        | `--info-1`        | #FDFDFE | Backgrounds                                          |
| `Colors.Info.2`        | `--info-2`        | #F6FAFF | Backgrounds                                          |
| `Colors.Info.3`        | `--info-3`        | #ECF2FF | Interactive elements and states                      |
| `Colors.Info.4`        | `--info-4`        | #DDEAFF | Interactive elements and states                      |
| `Colors.Info.5`        | `--info-5`        | #CCE0FF | Interactive elements and states                      |
| `Colors.Info.6`        | `--info-6`        | #B8D3FF | Borders and separators                               |
| `Colors.Info.7`        | `--info-7`        | #A0C0FC | Borders and separators                               |
| `Colors.Info.8`        | `--info-8`        | #7FA7F3 | Borders and separators                               |
| `Colors.Info.9`        | `--info-9`        | #003FBD | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Info.10`       | `--info-10`       | #002BAA | Solid — buttons, toasts, messages, large UI graphics |
| `Colors.Info.11`       | `--info-11`       | #275DCC | Accessible text over shades 1–2                      |
| `Colors.Info.12`       | `--info-12`       | #162E5E | Accessible text over shades 1–2                      |
| `Colors.Info.contrast` | `--info-contrast` | #FFFFFF | Used over shade 9                                    |

Use system colors (Error/Success/Warning, etc.) to indicate status rather than their static
equivalents — since these can be adapted per theme in the future and your product updates
automatically. Static colors ("green", "yellow", "red") are for things that must always be that color
regardless of theme — e.g. a REC button should always be red, so use the static Red rather than the
semantic Error color.

### Static colors

Static colors never change, no matter which brand is applied — useful when you want a color's meaning
to be independent of the active theme's semantic mapping (e.g. a static Red guarantees "red" even if a
theme redefines what "Error" means visually). Each system color has its own static version.

In code, a static color's shades are CSS variables named after the palette: `--blue-1` to `--blue-12`, and
the same for green, neutral, orange, purple, red, teal, yellow and gray.

| Palette                                                     | 1 (bg)  | 9 (solid) | 11 (text) |
| ----------------------------------------------------------- | ------- | --------- | --------- |
| Blue                                                        | #FDFDFE | #003FBD   | #275DCC   |
| Green                                                       | #FBFEFC | #00874F   | #00814A   |
| Neutral *(primitive behind Secondary — don't use directly)* | #FCFCFD | #888E92   | #5F6568   |
| Orange                                                      | #FEFCFB | #FF6300   | #D94300   |
| Purple                                                      | #FCFCFF | #5405BD   | #6A41D2   |
| Red                                                         | #FFFCFC | #DB362A   | #D22B21   |
| Teal                                                        | #FAFDFE | #4BC4C9   | #008085   |
| Yellow                                                      | #FEFDFB | #EDA813   | #A26A00   |
| Gray                                                        | #FBFCFD | #898E93   | #606569   |

**Gray or Secondary?** The Neutral primitive should never be used directly — it only backs the
Secondary semantic. Use **Gray** for non-interactive elements (text, dividers); use **Secondary** for
interactive elements (buttons) and/or when color needs semantic connotation (e.g. tags).

### Background and surfaces

**Background colors** — a `background-color` variable translates automatically between light (`#FFFFFF`)
and dark (`#1A1A1A`, not full black) mode.

**Surface background colors** — introduced for Dark theme, since shadows aren't "inverted" in dark mode
the way borders/surfaces need distinguishing:

* `surface-elevation-1` — maps to `background-color` (light) / `neutral-2` (dark). E.g. a side panel or
  popup/card sitting above the main content.
* `surface-elevation-2` — maps to `background-color` (light) / `neutral-3` (dark). For a surface above
  `surface-elevation-1` — e.g. a dropdown opened from within a side panel.
* `surface-elevation-3` — maps to `background-color` (light) / `neutral-4` (dark). An extra overlap
  level, rarely used — e.g. a dropdown opened from a card that's already inside a panel.

### Text variables

Theme-level text variables ensure accessibility over `background-color`:

* `text-default` — regular text color.
* `text-description` — descriptions, hints, supporting text.
* `text-placeholder` — placeholders on a field that has its own label. If a component has no label at
  all (e.g. a toolbar search with only a placeholder), use `text-description` instead — a
  placeholder-only color doesn't pass contrast, a recognized exception, so the description color is
  used instead in that specific case.
* `text-error`, `text-warning`, `text-success`, `text-info` — for text conveying that specific state.

### Helper colors

Helper colors exist only for documentation purposes in Figma.

### Library

**Color tokens** — the color libraries are available on Figma.

## Dark theme

In dark mode, our variables change automatically. The overall visual creates a darker color palette
for all screens, views, menus, and controls, and it uses more vibrancy to make foreground content
stand out against the darker backgrounds.

Dark themes reduce the luminance emitted by device screens, while still meeting minimum color
contrast ratios — some people with visual impairments do better with dark mode (in users with normal
vision, light mode leads to better performance most of the time). Another advantage is facilitating
screen use in dark environments and improving visual ergonomics by reducing eye strain, preventing
long-term effects associated with light mode.

In dark mode, there are two sets of background colors — called **base** and **elevated** — to enhance
the perception of depth when one dark interface is layered above another. The base colors are darker,
making background interfaces appear to recede; the elevated colors are lighter, making foreground
interfaces appear to advance.

:::note
The mobile dark-color guidelines below don't follow the current updated color algorithm.
:::

Dark theme UIs use predominantly dark surfaces, with sparse color accents. They emit low levels of
light while maintaining a high standard of usability.

For mobile, the background color is always `#000000` so that content can vary, with enough contrast,
against the other 3 main dark colors (Dark 300, 200, 100) — the rule being that the higher a
surface's elevation (raising it closer to an implied light source), the lighter that surface becomes.

Complementary gray colors can be used in rare cases where the main dark colors don't work well — for
example, intersecting or overlapping elements such as lines or bars in a grid.

## Accessibility

### Color contrast

Color contrast is an essential aspect of accessibility. Good contrast makes it easier for people with
visual impairments and helps in poor conditions like low-light environments or older screens.

Contrast ratios represent how different one color is from another; they range from 1 to 21 (commonly
written 1:1 to 21:1). The greater the difference between the two numbers in the ratio, the greater the
difference in relative luminance between the colors.

We are committed to complying with the Web Content Accessibility Guidelines AA standard contrast
ratios and Section 508, which sets a legal standard for the contrast level between text and its
background. The exception is brand logos, which do not have to meet color contrast requirements.

**Recommended contrast ratios (Level AA)**

| Element type  | Contrast ratio                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------- |
| Standard text | 4.5:1 against the background                                                                                        |
| Large text    | 3:1 against the background — defined as 18pt (typically 24px) or larger, or bold 14pt (typically 18.66px) or larger |

If you choose colors beyond what is documented here, a color contrast tool is a helpful resource to
test color combinations, or use a Figma plugin such as Contrast, A11y - Color Contrast Checker, Low
Vision, or Stark.

It's also important to ensure graphical icons provide enough contrast: when choosing colors for an
icon, consider the color(s) next to it and test that the contrast ratio is at least 4.5:1.

### Color blindness

Color-blindness (color vision deficiency) is the inability to distinguish certain shades of color.
The most common types are protanomaly (reduced sensitivity to red light), deuteranomaly (reduced
sensitivity to green light), and tritanomaly (reduced sensitivity to blue light).

Relying solely on color for readability and affordance makes a website difficult to use, which
ultimately affects readership and sales. This includes conveying information, indicating an action,
prompting the user for a response, or distinguishing one visual element from another — for example, a
text field's error state should be communicated through multiple cues, not just a colored stroke.
Use a color blindness simulator to analyze how different types of color blindness affect an image.

**Useful tools:** a color contrast checker (to calculate the contrast between two colors) and Color
Oracle (to simulate how a colorblind person sees colors).

## Color usage

The following components are affected by color usage: Tag, Avatar, LabeledIcon, Mark, ProgressBar,
ChatBubble. Some other components have color usage associated but can't be applied in a non-semantic
context, so they follow their own specific guidelines.

### Semantic vs. non-semantic

**Semantic** — color applied with a consistent meaning keeps cognitive load low and creates a unified,
engaging experience:

* Brand — e.g. new, brand product
* Warning — e.g. pending, on hold, processing, close to limit
* Negative — e.g. error, alert, rejected, failed
* Positive — e.g. approved, complete, success, new, purchased, licensed
* Informative — e.g. active, in use, live, published
* Neutral — e.g. archived, deleted, paused, draft, not started, ended, N/A

Semantic color helps users identify a standard status quickly and simply — avoid misusing semantic
opportunities in status categories, since it must stay as clear as possible for the user.

**Non-semantic** — colors used to indicate conventional meaning for color-coded categories and
customization settings (e.g. Purple for Healthcare/support, Yellow for Sales/dedicated, Red for
Marketing/VIP customers, Green for Digital connect/chat, Blue for Agent, Gray for Call center, White
for order issues, plus Orange/Teal/Midnight for other categories). White tags can be used the same way
as gray tags, or when the layout's color logic needs to be "inverted" for darker backgrounds.

Use the same background color for related items and let the content's color differentiate individual
items — avoid multiple background-colored avatars in the same list (for a contacts list, prefer
light-primary).

### Emphasis level

Color can also be chosen based on the emphasis needed:

* **Default** — bold emphasis, best isolated to highlight a specific element (e.g. "New").
* **Light** — subtle emphasis, can be applied across items in the same category or group (e.g. ring
  groups).

Keep the same emphasis level within a category or group for consistency, and reserve stronger,
isolated emphasis for highlighting a single element — mixing emphasis levels within the UI, or across
categories, causes confusion. Exception: when a tag is used to indicate more tags are available (a
"+N" tag), always emphasize it — don't invert the emphasis or change its main (Primary) color in that
case.

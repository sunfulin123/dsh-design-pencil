# Iconography

## Guidance

:::note
Sourced from the live Cobalt DS's Assets > Icons page and its App Icons / Feature Icons / Icons /
Guidelines / How to add a new icon tabs. The asset browsers themselves (live, filterable icon
galleries) aren't reproduced here — these sections carry the surrounding guidance only.
:::

Icons are a symbol or image-based visual representation of commands or common actions, used to
provide visual context and improve user experience.

## App Icons

Must be used only in the dock, to identify a product, and should not be reused for different
meanings. Organized in the asset library as `Cobalt Design System / Assets / Icons / App Icons /
app_(icon_name)`. Creation is owned by the Creative Team — request one by following the
[guidelines below](#how-to-add-a-new-icon).

## Feature Icons

Can be used in different components, but only to identify a feature — they can be reused for
different meanings as long as they stay related to the same feature. Organized as `Cobalt Design
System / Assets / Icons / Feature Icons / (feature_group) / feature_(icon_name)`. Creation is also
owned by the Creative Team.

## Icons

Can be used in different components and contexts/actions, and can carry different meanings. Organized
as `Cobalt Design System / Assets / Icons / (icon_group) / (icon_name)`. Unlike App and Feature icons,
these are created by Product Design following the guidelines below.

In code, an icon is drawn by core Icon with its name: `<Icon name="refresh" />`. Every name it accepts:

Every icon name is listed as the `name` prop of [Icon](/ai-docs/components/core/icon/icon.md).

## Guidelines

### Categorization

Icons are categorized into 3 categories: **App Icons**, **Feature Icons** and **Icons.**

| Category         | App Icons                                                                                                                   | Feature Icons                                                                                                               | Icons                                                                                                                     |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **Usage**        | Must be used only in the dock                                                                                               | Can be used in different components                                                                                         | Can be used in different components                                                                                       |
| **Context**      | Must be used only to identify a product                                                                                     | Must be used only to identify a feature                                                                                     | Can be used in different contexts/actions                                                                                 |
| **Meaning**      | Should not be used for different meanings                                                                                   | Can be used for different meanings but always related with the same feature                                                 | Can have different meanings                                                                                               |
| **Organization** | Cobalt Design System / Assets / Icons / App Icons / app\_(icon\_name)                                                       | Cobalt Design System / Assets / Icons / Feature Icons / (feature\_group) / feature\_(icon\_name)                            | Cobalt Design System / Assets / Icons / (icon\_group) / (icon\_name)                                                      |
| **Creation**     | Creative Team. Request by following [these guidelines](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/18b165) | Creative Team. Request by following [these guidelines](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/18b165) | Product Design following [these guidelines](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/18b165/t/2271cb) |

*An illustrative screenshot normally appears here on ZeroHeight but is not reproduced — it showed
fictional full names paired with phone numbers in a "Recent activities" style table. See the data-handling
note at the top of this file.
[View on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/166599).*

---

### Sizing

Icons size uses a 4px baseline grid, the sizes most used are 16px, 20px, 24px and 48px. Make sure that
the icon size is consistent throughout your product.

![Icon size scale showing 12px, 16px, 20px, 24px, 32px, 48px, and 64px icon examples](/assets/iconography/icon-sizes.png)

---

### Usage

Icons with 20px size are used in form elements (`<input>`, `<button>`, etc.)

![Search toolbar using 20px icons for search, sort options, table options, and filters](/assets/iconography/usage-20px-search.png)

The default size (24px) is used on toasts, media controls, and other elements.

![Media player toolbar using 24px icons for play, volume, and skip controls, and a 24px icon in an error toast message](/assets/iconography/usage-24px-media-controls.png)

We use the major icons in alert dialogs and empty states.

![Empty state message using a 48px major icon above a title, description, and Secondary/Primary buttons](/assets/iconography/usage-48px-major-icon.png)

---

### Color

Icons are always a solid, monochromatic color and need to pass the same color contrast ratio as
typography (4.5:1).

For more information, see the
[color accessibility guidelines](https://designsystem.talkdesk.com/51aaf6147/p/01309d-colors/b/86f3da).

---

### Alignment

When used next to text, icons should be center-aligned.

![Do — a plus icon center-aligned to the 'Add another row' text](/assets/iconography/alignment-do.png)
*Do Center-align icons when they're next to text.*

![Don't — a plus icon baseline-aligned to the 'Add another row' text](/assets/iconography/alignment-dont.png)
*Don't Don't baseline-align icons to the text.*

---

### Principles

#### Simple over detailed

Limit the creation of icon variations. Different icons should not represent the same concept (e.g.
"admin settings" vs. "user settings")

![Do — a simple upload icon with clean, minimal lines](/assets/iconography/simple-over-detailed-do.png)
*Do Icons should have simple lines and shapes.*

![Don't — an export icon with finer, more detailed linework](/assets/iconography/simple-over-detailed-dont.png)
*Don't Icons should not be too heavy in details, this increases cognitive load on the user.*

#### Clear over conceptual

* Don't reinvent an icon that's already been accepted as a convention.
* Users should be able to understand what the icon represents.
* Interpreting abstract (symbolic) icons can take more time and effort.

#### Family over friends

Users should be able to understand what the icon represents. Interpreting abstract (symbolic) icons can
take more time and effort.

![Do — upload, download, new folder, and cloud icons sharing a consistent filled style](/assets/iconography/family-over-friends-do.png)
*Do The icon set needs to look and feel related.*

![Don't — the same 4 icons mixing inconsistent outline and filled styles](/assets/iconography/family-over-friends-dont.png)
*Don't Icons that aren't related may look out of place.*

---

### Accessibility

#### Specify if an icon is decorative

Icons can either be **decorative** or **informative**. With a decorative icon, it's unnecessary to
inform the user about its existence on the page.

For example, the information provided by the icon might already be given using adjacent text.

#### Give informative icons a title

If an icon isn't decorative, you must provide a title property, so assistive technology can infer equal
meaning as a sighted user would. **To fix this, add an aria-label or the alt attribute if it is an
image.**

![Do — a bell icon with an accessible title of 'notifications'](/assets/iconography/informative-title-do.png)
*Do Provide meaningful information.*

![Don't — the same bell icon with a generic accessible title of 'bell'](/assets/iconography/informative-title-dont.png)
*Don't Don't use generic titles.*

#### Pair icons with text

The combination of icons and a corresponding label helps everyone: people with mental impairments, the
elderly who aren't "internet natives", and even yourself.

![Do — an 'Add event' button pairing a plus icon with a text label](/assets/iconography/pair-icons-with-text-do.png)
*Do*

![Don't — a bare plus icon with no text label](/assets/iconography/pair-icons-with-text-dont.png)
*Don't*

In case you have to use an icon without a label, always provide a tooltip.

*An example screenshot normally appears here on ZeroHeight but is not reproduced — it showed fictional
full names paired with phone numbers in a call-list UI. See the data-handling note at the top of this
file.
[View on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/166599).*

---

## How to add a new icon

### Adding a new App icon or Feature icon

1. **Icon category** — review the Icons Categorization board to confirm the new icon complies with
   all guidelines.
2. **Open Cobalt Style** — open the Cobalt Assets library file, or search for App Icons or Feature
   Icons.
3. **Review current icons** — search for the icon; if it's already there, no need to add it.
4. **Request to the Creative Team** — App Icons and Feature Icons must always be created by the
   Creative Team.
5. **Add the icon to the Design System** — once the SVG is available, create a Figma branch in the
   Assets file, adjust the SVG (flatten the color layer), match the needed properties (24×24 bounding
   box, 20×20 inner layer), paste-to-replace into a duplicated icon, rename it following the naming
   convention (lowercase, underscores; e.g. `action/account_balance_wallet` for regular icons,
   `agent_actions/feature_assign_agent_pool` for feature icons — must include "feature" in the name —
   and `app_conversation`-style names with no folder for app icons), match constraints (frame
   Left/Top, color layer Scale/Scale), convert to a component, and have the Design System team review
   the branch.
6. **Add the icon to the Cobalt Assets library** — coordinate in the design and engineering SME
   channels to get it added.

### Adding a new general icon

1. Check the Cobalt Assets library / Icons page — if the icon already exists, stop here.
2. Look for it in Material Symbols and Icons (Google Fonts) or Material Design Icons, in that order.
3. If found, export as SVG, add it as a Figma symbol, categorize/rename it per the Icons
   Categorization board, keep the Material icon settings (Weight 400, Grade 0, Optical size 24px,
   style Material Symbols (New) - Outlined), reduce it to a simple path, and fill it with the
   Gray/gray-12 color variable.
4. If not found, decide whether it can be a **composed icon or variant** of an existing icon (define
   identification/meaning/context, search for reference patterns, prototype, and request review) or
   needs to be **created from scratch** (same identification/meaning/context and reference-search
   process, then request review) — in both cases, coordinate through the design-private and
   eng-sme-cobalt channels before it's added to the library.

---

## Useful links

**[File types](https://talkdesk.atlassian.net/wiki/spaces/~612169912/pages/2965668462/File+type+Icon+proposal)**
— A match list between file types and icons

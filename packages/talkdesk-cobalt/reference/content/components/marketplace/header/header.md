# Header

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-header`

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-header
```

```tsx
import Header, { HeaderHeading, PreTitle, Description, HeaderActions, ActionsDivider, HeaderTabs } from "@talkdesk/cobalt-marketplace-react-header";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-header-stories--main)

## Known gaps

Read before using it:

* Description is typed as a bare FC, so with React 18 types <Description>text</Description> doesn't compile, although it renders children. Header also lays out as three equal columns, so the actions get a third of the width: more than three or four actions overflow, and below 640px they overlap the title. The List View and Form Page recipes build the header from core parts instead.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-grid`](../../../components/core/grid/grid.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-tab`](../../../components/core/tab/tab.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

Headers are applied on the top of a page, card, modal or panel and are used to identity them.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Only use headers for the **top heading** of the page. If you need to use headers to create sections within a page, use a [**Section Header**](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header/t/650c9d) instead.

### Anatomy

![Header example — Anatomy](/assets/header/anatomy.png)

1. **PreTitle**
2. **Back navigation**
3. **Heading Title**
4. **Description**
5. **Divider**

### Variants

#### Sizes

There are three sizes available (Large, Medium and Small), each to be applied to the respective viewport.

![Header example — Variants Sizes: Size - Large](/assets/header/sizes-size-large.png)
*Size - Large*

  ![Header example — Variants Sizes: Size - Medium](/assets/header/sizes-size-medium.png)
*Size - Medium*

  ![Header example — Variants Sizes: Size - Small](/assets/header/sizes-size-small.png)
*Size - Small*

#### Types

![Header example — Variants Types: H1 - Small](/assets/header/sizes-size-small.png)
*H1 - Small*

  ![Header example — Variants Types: H1 - Medium](/assets/header/sizes-size-medium.png)
*H1 - Medium*

  ![Header example — Variants Types: H1 - Large](/assets/header/sizes-size-large.png)
*H1 - Large*

![Header example — Variants Types: H2 - Small](/assets/header/types-h2-small.png)
*H2 - Small*

  ![Header example — Variants Types: H2 - Medium](/assets/header/types-h2-medium.png)
*H2 - Medium*

  ![Header example — Variants Types: H2 - Large](/assets/header/types-h2-large.png)
*H2 - Large*

![Header example — Variants Types: H3 - Small](/assets/header/types-h3-small.png)
*H3 - Small*

  ![Header example — Variants Types: H3 - Medium](/assets/header/types-h3-medium.png)
*H3 - Medium*

  ![Header example — Variants Types: H3 - Large](/assets/header/types-h3-large.png)
*H3 - Large*

![Header example — Variants Types: H4 - Small](/assets/header/types-h4-small.png)
*H4 - Small*

  ![Header example — Variants Types: H4 - Medium](/assets/header/types-h4-medium.png)
*H4 - Medium*

  ![Header example — Variants Types: H4 - Large](/assets/header/types-h4-large.png)
*H4 - Large*

#### Modifiers

![Header example — Variants Modifiers: With Back Navigation](/assets/header/sizes-size-large.png)
*With Back Navigation*

  ![Header example — Variants Modifiers: With Labeledicon](/assets/header/modifiers-with-labeledicon.png)
*With Labeledicon*

  ![Header example — Variants Modifiers: Without Pre Title](/assets/header/modifiers-without-pre-title.png)
*Without Pre Title*

![Header example — Variants Modifiers: With Pre Title](/assets/header/modifiers-with-pre-title.png)
*With Pre Title*

  ![Header example — Variants Modifiers: With Pre Title Dark](/assets/header/modifiers-with-pre-title-dark.png)
*With Pre Title Dark*

  ![Header example — Variants Modifiers: Required](/assets/header/modifiers-required.png)
*Required*

![Header example — Variants Modifiers: With Subtitle](/assets/header/modifiers-with-subtitle.png)
*With Subtitle*

  ![Header example — Variants Modifiers: With Description](/assets/header/modifiers-with-pre-title.png)
*With Description*

  ![Header example — Variants Modifiers: With Title Action](/assets/header/modifiers-with-title-action.png)
*With Title Action*
This variant should only be used when there is no description. If there is a description, the action must be applied after, side by side, the description.

![Header example — Variants Modifiers: With Description Action](/assets/header/modifiers-with-description-action.png)
*With Description Action*

### Guidelines

#### Group

The header should be combined with different components, as the following examples show.

![Header example — Guidelines Group: Simple Header - Medium](/assets/header/group-simple-header-medium.png)
*Simple Header - Medium*

  ![Header example — Guidelines Group: Simple Header - Small](/assets/header/group-simple-header-small.png)
*Simple Header - Small*

![Header example — Guidelines Group: Simple Header - Large](/assets/header/group-simple-header-large.png)
*Simple Header - Large*

![Header example — Guidelines Group: Header with Actions - Medium](/assets/header/group-header-with-actions-medium.png)
*Header with Actions - Medium*

  ![Header example — Guidelines Group: Header with Actions- Small](/assets/header/group-header-with-actions-small.png)
*Header with Actions- Small*

![Header example — Guidelines Group: Header with Actions - Large](/assets/header/group-header-with-actions-large.png)
*Header with Actions - Large*

![Header example — Guidelines Group: Header with Nav - Medium](/assets/header/group-header-with-nav-medium.png)
*Header with Nav - Medium*

  ![Header example — Guidelines Group: Header with Nav- Small](/assets/header/group-header-with-nav-small.png)
*Header with Nav- Small*

![Header example — Guidelines Group: Header with Nav - Large](/assets/header/group-header-with-nav-large.png)
*Header with Nav - Large*

![Header example — Guidelines Group: Header with Nav and Toolbar - Medium](/assets/header/group-header-with-nav-and-toolbar.png)
*Header with Nav and Toolbar - Medium*

  ![Header example — Guidelines Group: Header with Nav and Toolbar- Small](/assets/header/group-header-with-nav-and-toolbar-2.png)
*Header with Nav and Toolbar- Small*

![Header example — Guidelines Group: Header with Nav and Toolbar - Large](/assets/header/group-header-with-nav-and-toolbar-3.png)
*Header with Nav and Toolbar - Large*

![Header example — Guidelines Group: Header with Nav and multiple Toolbar - Medium](/assets/header/group-header-with-nav-and-multiple.png)
*Header with Nav and multiple Toolbar - Medium*

  ![Header example — Guidelines Group: Header with Nav and multiple Toolbar- Small](/assets/header/group-header-with-nav-and-multiple-2.png)
*Header with Nav and multiple Toolbar- Small*

![Header example — Guidelines Group: Header with Nav and multiple Toolbar - Large](/assets/header/group-header-with-nav-and-multiple-3.png)
*Header with Nav and multiple Toolbar - Large*

##### Headers with and without borders

By default, headers come with a visible bottom border. In this case, they follow the general spacing rules.

However, if you use borderless headers, the spacing below should be reset to **0px**.

![Header example — Group Headers with and without borders](/assets/header/group-headers-with-and-without-borders.png)

##### Used with a nav, toolbar or section headers

When used with any of these components, they should be snapped together (**no spacing**). Make sure also to remove the header’s bottom border when using with the Nav component.

![Header example — Group Used with a Nav, Toolbar or Section Headers](/assets/header/group-used-with-a-nav-toolbar.png)

#### Placement

The main page header should always be placed at the top of the page and have full width.

![Header example — Guidelines Placement](/assets/header/guidelines-placement.png)

#### Use cases

##### Multiple actions

Multiple actions can be combined in the header. These actions have different hierarchies and the following guidelines should be applied,

* Before a destructive action or a Toggle, a Divider should always be used.
* Between secondary/primary actions and tertiary actions, a Divider should always be used.
* When there is more than one secondary action, a primary outlined style should be used.
* The max. amount of visible actions is 5 (excluding the more option action), and 50% of the header width is the max. width for actions.
* When an action is hidden, all actions from the same hierarchy and below should also be hidden.

*See some examples below.*

| **Hierarchy**       | **Style**                                                                                                       | **Quantity**     | **Divider**                                                                       | **Visibility**            |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------- | ------------------------- |
| More options action | Always secondary transparent.                                                                                   | Is unique.       | *N/A*                                                                             | Is always visible.        |
| Primary action      | Always primary filled.                                                                                          | Is unique.       | Always use a divider after the primary action if there are any secondary actions. | Is always visible.        |
| Secondary actions   | Secondary filled when there is only one secondary action.Primary outlined there are multiple secondary actions. | Can be multiple. | Always use a divider after the secondary actions group.                           | Can be visible or hidden. |
| Tertiary actions    | Always transparent.                                                                                             | Can be multiple. | Always use a divider before the tertiary actions group.                           | Can be visible or hidden. |
| Toggle              | *N/A*                                                                                                           | Can be multiple. | Always use a divider before the group of toggles.                                 | Can be visible or hidden. |
| Destructive action  | Always error transparent.                                                                                       | Is unique.       | Always use a divider before.                                                      | Can be visible or hidden. |

##### Divider

Before a destructive action or a Toggle, a Divider should always be used.

![Header example — Use cases Divider: Destructive action](/assets/header/divider-destructive-action.png)
*Destructive action*

![Header example — Use cases Divider: Destructive action - open](/assets/header/divider-destructive-action-open.png)
*Destructive action - open*

![Header example — Use cases Divider: Toggle](/assets/header/divider-toggle.png)
*Toggle*

![Header example — Use cases Divider: Toggle - open](/assets/header/divider-toggle-open.png)
*Toggle - open*

![Header example — Use cases Divider: Toggle and destructive action](/assets/header/divider-toggle-and-destructive-action.png)
*Toggle and destructive action*

![Header example — Use cases Divider: Toggle and destructive action - open](/assets/header/divider-toggle-and-destructive-action-open.png)
*Toggle and destructive action - open*

Between a secondary/primary actions and tertiary actions, a Divider should always be used.

![Header example — Use cases Divider: Tertiary action](/assets/header/divider-tertiary-action.png)
*Tertiary action*

![Header example — Use cases Divider: Tertiary action - open](/assets/header/divider-tertiary-action-open.png)
*Tertiary action - open*

![Header example — Use cases Divider: 2 secondary and 1 tertiary actions](/assets/header/divider-2-secondary-and-1-tertiary.png)
*2 secondary and 1 tertiary actions*

![Header example — Use cases Divider: 2 secondary and 1 tertiary actions - open](/assets/header/divider-2-secondary-and-1-tertiary-2.png)
*2 secondary and 1 tertiary actions - open*

##### Style

When there is more than one secondary action should be used primary outlined style

![Header example — Use cases Style: multiple secondary actions](/assets/header/style-multiple-secondary-actions.png)
*multiple secondary actions*

![Header example — Use cases Style: multiple secondary actions - open](/assets/header/style-multiple-secondary-actions-open.png)
*multiple secondary actions - open*

##### Visibility

5 is the max amount of visible actions (excluding the more option action) and 50% of the header width is the max width for actions.

When an action is hidden all actions from the same hierarchy and below should be also hidden.

![Header example — Use cases Visibility: 3 tertiary actions](/assets/header/visibility-3-tertiary-actions.png)
*3 tertiary actions*

![Header example — Use cases Visibility: 3 tertiary actions - open](/assets/header/visibility-3-tertiary-actions-open.png)
*3 tertiary actions - open*

![Header example — Use cases Visibility: 5 tertiary actions](/assets/header/visibility-5-tertiary-actions.png)
*5 tertiary actions*

![Header example — Use cases Visibility: 5 tertiary actions - open](/assets/header/visibility-5-tertiary-actions-open.png)
*5 tertiary actions - open*

![Header example — Use cases Visibility: 3 secondary and 2 tertiary actions](/assets/header/visibility-3-secondary-and-2-tertiary.png)
*3 secondary and 2 tertiary actions*

![Header example — Use cases Visibility: 3 secondary and 2 tertiary actions - open](/assets/header/visibility-3-secondary-and-2-tertiary-2.png)
*3 secondary and 2 tertiary actions - open*

![Header example — Use cases Visibility: 5 secondary and 1 tertiary actions](/assets/header/visibility-5-secondary-and-1-tertiary.png)
*5 secondary and 1 tertiary actions*

![Header example — Use cases Visibility: 5 secondary and 1 tertiary actions - open](/assets/header/visibility-5-secondary-and-1-tertiary-2.png)
*5 secondary and 1 tertiary actions - open*

#### Headers vs section headers

Section headers are similar to headers, but they have slightly different inner padding. They should be used to separate sections inside the page.

##### On the page

Section headers should follow the same rules as normal headers. When placed on the page, the first header should be placed right after the main header (**0px**) even if the main header has a toolbar or a nav below.

Remember to use a logical tree of headings. Every main section should use an **H2** section header. Sub-sections inside them should use **H3**, **H4**, and so on.

Section headers should not have the bottom border unless you need it for a very specific reason. They should also always be full-width. The content within each section, however, should follow the global rules of **L:24px / M:16px / S:12px** horizontal padding.

At the end of a section, we usually add a divider at **L:24px / M:16px / S:12px** below the last element of that section. If you don’t want dividers, just keep the same spacing of **L:24px / M:16px / S:12px** from the next section.

![Header example — Headers vs Section headers On the page](/assets/header/headers-vs-section-headers-on-the.png)

##### On panels

On panels the guidelines are mostly the same, the only difference is to use H4 headers instead.

![Header example — Headers vs Section headers On panels](/assets/header/headers-vs-section-headers-on-panels.png)

##### Headers and dividers

Some forms have headers and dividers inside to create logic groups. Main sections should be displayed with an **H2 section header** (without a border) followed by its form fields (on panels use **H4 section header** instead). The spacing between the header and the first label is **0px**.

The header is full-width, but the contents of each section follow the general rules. So the lateral padding should be **L:24px / M:16px / S:12px**.

By the end of each section, we’ll have a divider that is **L:24px / M:16px / S:12px** below the last element of the section. The next section’s header should be snapped to the previous divider (**0px**).

Here’s some examples on different viewports:

![Header example — Headers vs Section headers Headers and dividers: Section headers and dividers - Small viewport](/assets/header/dividers-section-headers-and-dividers-small.png)
*Section headers and dividers - Small viewport*

![Header example — Headers vs Section headers Headers and dividers: Section headers and dividers - Large viewport](/assets/header/headers-vs-section-headers-on-the.png)
*Section headers and dividers - Large viewport*

### Behavior

#### Responsiveness

In large and medium viewports the header should always be fixed on top. For small viewports, the header could be fixed or not, depending on the use case.

The actions associated to the header could be fixed or not, placed on the top or in the bottom, depending on the interaction.

##### User needs to interact with elements before interacting with the actions:

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Medium. Fixed header.*

Viewport: Medium

Header: Fixed

Actions: Non-fixed. Placed on the bottom, below the content.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 69.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Large. Fixed header.*

Viewport: Large

Header: Fixed

Actions: Non-fixed. Placed on the bottom, below the content.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 68.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Small. Non-fixed header.*
Viewport: Small; Header: Non-fixed; Actions: Non-fixed. Placed on the bottom, below the content.

  ![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Small. Fixed header.*
Viewport: Small; Header: Fixed; Actions: Non-fixed. Placed on the bottom, below the content.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 70, image 71.*

##### User doesn't need to interact with any of the elements or needs to interact with one/limited elements before interacting with the action:

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Medium. Fixed header.*

Viewport: Medium

Header: Fixed

Actions: Fixed on top, attached to the header.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 73.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Large. Fixed header.*

Viewport: Large

Header: Fixed

Actions: Fixed on top, attached to the header.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 72.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Small. Non-fixed header.*
Viewport: Small; Header: Non-fixed; Actions: Fixed on the bottom, detached from the header.

  ![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Small. Fixed header.*
Viewport: Small; Header: Fixed; Actions: Fixed on top, attached to the header.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 74, image 75.*

#### Interaction

When a vertical scroll is applied and the header is fixed on top, a scroll shadow to the header must be applied.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/85a3f8-header) — Design tab, image 76.*

#### Text truncation

The header title and description should never be truncated. If the title and/or the description has a significant amount of text, it should be multi-lined, as the following examples show.

![Header example — Behavior Text truncation: Long Title - Medium](/assets/header/truncation-long-title-medium.png)
*Long Title - Medium*

  ![Header example — Behavior Text truncation: Long Title - Small](/assets/header/truncation-long-title-small.png)
*Long Title - Small*

![Header example — Behavior Text truncation: Long Title - Large](/assets/header/truncation-long-title-large.png)
*Long Title - Large*

![Header example — Behavior Text truncation: Long Description - Medium](/assets/header/truncation-long-description-medium.png)
*Long Description - Medium*

  ![Header example — Behavior Text truncation: Long Description - Small](/assets/header/truncation-long-description-small.png)
*Long Description - Small*

![Header example — Behavior Text truncation: Long Description - Large](/assets/header/truncation-long-description-large.png)
*Long Description - Large*

#### Spacing

Headers follow the general rules of **L:24px / M:16px / S:12px** for the space inside the header.

![Header example — Variants Spacing: Spacing - Small](/assets/header/spacing-spacing-small.png)
*Spacing - Small*

  ![Header example — Variants Spacing: Spacing - Medium](/assets/header/spacing-spacing-medium.png)
*Spacing - Medium*

  ![Header example — Variants Spacing: Spacing - Large](/assets/header/spacing-spacing-large.png)
*Spacing - Large*

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Header`and `Cobalt Design System > Patterns > HeaderPattern`

* [Header component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=578%3A25304) — Core component library
* [HeaderPattern](https://www.figma.com/file/RbiNiZDJelIajXxTjDY72N/3---%E2%9A%97%EF%B8%8F-Patterns?node-id=2%3A30431) — Patterns library
* [Header handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=200%3A131808) — Handoff guidelines

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

* Map the header to an appropriate heading level (`h1`–`h6`) so document structure is conveyed.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Header

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `divided` | boolean |  | no | false |  |
| `contained` | boolean |  | no | false |  |
| `backgroundColor` | BackgroundColor |  | no |  |  |
| `children` | ReactNode |  | yes |  |  |

### HeaderHeading

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `withBackNavigation` | boolean |  | no | false |  |
| `onBack` | () => void |  | no | undefined |  |
| `children` | ReactNode |  | yes |  |  |

### PreTitle

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `icon` | enum | 1,103 icon names, one per line in [icon-values.txt](icon-values.txt) | no |  |  |
| `children` | ReactNode |  | yes |  |  |

### Description

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |

### HeaderActions

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |

### HeaderTabs

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |

## Examples

_3 of 10 compile against the published `@talkdesk/cobalt-marketplace-react-header@2.2.2` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** uses `Heading` without importing or defining it. Fix it before use.

```tsx
import Header, { HeaderHeading } from "@talkdesk/cobalt-marketplace-react-header";

<Header>
  <HeaderHeading>
    <Heading level={1}>Title</Heading>
  </HeaderHeading>
</Header>
```

### Pretitlewithicon

> **Doesn't compile:** uses `Heading` without importing or defining it. Fix it before use.

```tsx
import Header, { HeaderHeading, PreTitle } from "@talkdesk/cobalt-marketplace-react-header";

<Header>
  <HeaderHeading>
    <PreTitle icon="person">Pre title</PreTitle>
    <Heading level={1}>Title</Heading>
  </HeaderHeading>
</Header>
```

### Contained

```tsx
import Header from "@talkdesk/cobalt-marketplace-react-header";

<Header contained>
  ...
</Header>
```

### Divided

```tsx
import Header from "@talkdesk/cobalt-marketplace-react-header";

<Header divided>
  ...
</Header>
```

### Backgroundcolor

```tsx
import Header from "@talkdesk/cobalt-marketplace-react-header";

<Header backgroundColor="lightblue" divided>
  ...
</Header>
```

### Image

> **Doesn't compile:** the published types reject it: JSX element class does not support attributes because it does not have a 'props' property. (it also uses `Image` without importing it). Fix it before use.

```tsx
import Header, { HeaderHeading } from "@talkdesk/cobalt-marketplace-react-header";

<Header divided>
  <HeaderHeading>
    <Image
      src="..."
      alt="..."
      width={...}
      height={...}
    />
  </HeaderHeading>
</Header>
```

### Actions

> **Doesn't compile:** uses `Button`, `Text` without importing or defining it. Fix it before use.

```tsx
import Header, { HeaderHeading, HeaderActions } from "@talkdesk/cobalt-marketplace-react-header";

<Header divided>
  <HeaderHeading>
    ...
  </HeaderHeading>
  <HeaderActions>
    <Button>
      <Text>Action 1</Text>
    </Button>
    <Button>
      <Text>Action 2</Text>
    </Button>
  </HeaderActions>
</Header>
```

### Actionsdivider

> **Doesn't compile:** uses `Button`, `Text` without importing or defining it. Fix it before use.

```tsx
import Header, { HeaderHeading, HeaderActions, ActionsDivider } from "@talkdesk/cobalt-marketplace-react-header";

<Header divided>
  <HeaderHeading>
    ...
  </HeaderHeading>
  <HeaderActions>
    <Button>
      <Text>Action 1</Text>
    </Button>
    <ActionsDivider />
    <Button>
      <Text>Action 2</Text>
    </Button>
  </HeaderActions>
</Header>
```

### Backnavigation

> **Doesn't compile:** the published types reject it: Type '{ children: string; }' has no properties in common with type 'IntrinsicAttributes'. (it also uses `Heading` without importing it). Fix it before use.

```tsx
import Header, { HeaderHeading, PreTitle, Description } from "@talkdesk/cobalt-marketplace-react-header";

<Header divided>
  <HeaderHeading
    withBackNavigation
    onBack={...}
  >
    <PreTitle>Pre title</PreTitle>
    <Heading level={1}>Title</Heading>
    <Description>Description</Description>
  </HeaderHeading>
</Header>
```

### Bottomtabs

> **Doesn't compile:** uses `Tab` without importing or defining it. Fix it before use.

```tsx
import Header, { HeaderHeading, HeaderTabs } from "@talkdesk/cobalt-marketplace-react-header";

<Header divided>
  <HeaderHeading>
    ...
  </HeaderHeading>
  <HeaderTabs>
    <Tab active>Tab 1</Tab>
    <Tab>Tab 2</Tab>
  </HeaderTabs>
</Header>
```

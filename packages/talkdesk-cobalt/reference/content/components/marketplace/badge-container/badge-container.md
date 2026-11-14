# BadgeContainer

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-badge-container`

## Install (v2.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-badge-container
```

```tsx
import BadgeContainer from "@talkdesk/cobalt-marketplace-react-badge-container";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-badgecontainer-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-position-hook`](../../../hooks/core/position-hook/position-hook.md), [`@talkdesk/cobalt-react-tag`](../../../components/core/tag/tag.md).

## Guidance

Consist in a tag associated to another component (buttons, tabs in the nav, avatar or icons) to visually indicate information associated to the paired element.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Used to inform,

•	the number of associated items to the paired element (e.g. number of applied filters, number of unread notifications, …)

•	a characteristic of the paired element (e.g. new associated with a tab, channel icon associated with an avatar, …)

![Badge container example — Overview](/assets/badge-container/overview.png)

### Anatomy

![Badge container example — Anatomy](/assets/badge-container/anatomy.png)

1. **Paired element** - The component that the BadgeContainer is connected to
2. **Tag**

### Variants

The BadgeContainer component doesn’t have different sizes, colors, and modifiers, however, the associated [Tag](/components/core/tag/) can assume all tag component sizes, colors, and modifiers.

![Badge container example — Variants](/assets/badge-container/variants.png)

#### States

Despite the BadgeContainer using the component Tag, which is interactive, the Tag component should always remain in the default state because the BadgeContainer paired element could be interactive (e.g. button).

#### Position

The BadgeContainer can assume different positions always on top of the paired element. Usually, it is used on the right of the paired element.

![Badge container example — Variants Position](/assets/badge-container/variants-position.png)

### Guidelines

#### Use cases

The BadgeContainer component can be used in multiple use cases, such as used to inform,

##### the number of associated items to the paired element

![Badge container example — Use cases the number of associated items to the paired element: number of applied filters](/assets/badge-container/element-number-of-applied-filters.png)
*number of applied filters*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*number of associated items*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/86f1ac-badgecontainer) — Design tab, image 6.*

![Badge container example — Use cases the number of associated items to the paired element: number of unread notifications](/assets/badge-container/element-number-of-unread-notifications.png)
*number of unread notifications*

##### a characteristic of the paired element

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*channel icon associated with an avatar*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/86f1ac-badgecontainer) — Design tab, image 8.*

![Badge container example — Use cases a characteristic of the paired element: new associated with a tab](/assets/badge-container/element-new-associated-with-a-tab.png)
*new associated with a tab*

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > BadgeContainer`

* [BadgeContainer component](https://www.figma.com/file/OAai6yfKydI1p4afnUUI6V/2B---%F0%9F%93%96-Core-documentation-A-%3E-L?type=design\&node-id=1421%3A381588\&mode=design\&t=Vktyc5rRlh55wYJf-1) — Core component library
* [BadgeContainer handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=279%3A175865\&mode=design\&t=OYdQrmIqXnoHEMYC-1) — Handoff guidelines

### Code

### Props

### Examples

### Content

### Introduction

The BadgeContainer component is used to visually represent and group related badges or labels within a user interface. It provides a concise and organized way to convey additional information or highlight specific attributes associated with an element or content.

### Tone and voice

Maintain a consistent tone and voice when writing for the Badge Container component. Consider the context and purpose of the badges, and ensure the language aligns with the overall tone and voice of the rest of your product. The tone can be informative, friendly, or directive, depending on the specific use case.

### Word choice

Use language that is concise, easily understandable, and aligned with the user's expectations. Avoid jargon or technical terms unless your target audience is familiar with them.

Choose clear and descriptive words like "New" and "Favorite".

### Numbers and maximum numbers

##### Informative tags

The number of items (issues, emails, conversations) assign to you, the limit of characters on a text area, the number of items you're creating, etc.

* Show all characters
* Limit of 7 characters
  * 1
  * 12
  * 123
  * 1,234
  * 12,345
  * 99,999+
* For unlimited characters, no label is needed.

##### Counter tags

The number of filters applied, the number of items in tables, etc.

* Show up to 3 characters
  * 1
  * 12
  * 99+

### Concise and clear writing

Keep the content within badge labels brief and to the point. Users should be able to grasp the information quickly without excessive reading or interpretation.

### Variants

Consider different variations of the Badge Container component, such as different badge styles, sizes, or positioning. Coordinate with the visual design to ensure the badges align with the overall user interface.

### Best practices

![Do example](/assets/badge-container/dos-and-don-ts-do.png)
*Do*
Number of filters applied

![Do example](/assets/badge-container/dos-and-don-ts-do-2.png)
*Do*
Number of emails unread

**Do:** Country code
![Do example](/assets/badge-container/dos-and-don-ts-do-3.png)

**Don't:** The + is placed on the left side of the number
![Don't example](/assets/badge-container/dos-and-don-ts-dont.png)

### Accessibility

### Considerations

#### Development

* Announce the badge content (e.g. an `aria-label` like "3 unread").
* Don't rely on color or position alone to convey meaning.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `gapY` | number |  | no | 12 |  |
| `gapX` | number |  | no | 0 |  |
| `color` | enum | `theme`, `light-theme`, `gray`, `light-gray`, `green`, `light-green`, `yellow`, `light-yellow`, `orange`, `red`, `light-red`, `blue`, `light-blue`, `teal`, `light-teal`, `purple`, `light-purple`, `white` | yes | red |  |
| `originPosition` | enum | `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` | no | NE |  |
| `directionPosition` | enum | `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` | no | NW |  |
| `size` | enum | `tiny`, `small`, `medium`, `large` | no | small |  |
| `badgeContent` | ReactNode |  | no |  | Can't be combined with `badgeNumber` or `badgeMaxNumber`: pass one or the other. |
| `badgeNumber` | number |  | no | 0 | Can't be combined with `badgeContent`: pass one or the other. |
| `badgeMaxNumber` | number |  | no | 9 | Can't be combined with `badgeContent`: pass one or the other. |
| `children` | any |  | yes |  |  |

## Examples

_0 of 5 compile against the published `@talkdesk/cobalt-marketplace-react-badge-container@2.2.0` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** uses `BadgeContainerWrapper`, `Button` without importing or defining it. Fix it before use.

```tsx
<BadgeContainerWrapper
  color="red"
  badgeNumber={9}
  originPosition="NW"
  directionPosition="NE"
>
  <Button>NW</Button>
</BadgeContainerWrapper>
<BadgeContainerWrapper
  color="red"
  badgeNumber={9}
  originPosition="S"
  directionPosition="S"
  gapY={-12}
>
  <Button>S</Button>
</BadgeContainerWrapper>
<BadgeContainerWrapper
  color="red"
  badgeNumber={9}
  originPosition="NE"
  directionPosition="NW"
>
  <Button>NE</Button>
</BadgeContainerWrapper>
```

### Max number

> **Doesn't compile:** uses `BadgeContainerWrapper`, `Button` without importing or defining it. Fix it before use.

```tsx
<BadgeContainerWrapper color="red" badgeNumber={10} badgeMaxNumber={9}>
  <Button>Hello</Button>
</BadgeContainerWrapper>
```

### Content

> **Doesn't compile:** uses `BadgeContainerWrapper`, `Button` without importing or defining it. Fix it before use.

```tsx
<BadgeContainerWrapper color="red" badgeContent="!">
  <Button>Button</Button>
</BadgeContainerWrapper>
```

### Avatar

> **Doesn't compile:** uses `BadgeContainerWrapper`, `Avatar` without importing or defining it. Fix it before use.

```tsx
<BadgeContainerWrapper badgeNumber={9} color="red">
  <Avatar color="theme">TD</Avatar>
</BadgeContainerWrapper>
```

### Icon

> **Doesn't compile:** uses `BadgeContainerWrapper`, `Icon` without importing or defining it. Fix it before use.

```tsx
<BadgeContainerWrapper badgeNumber={9} color="red" gapX={5}>
  <Icon name="event_note" size="medium" />
</BadgeContainerWrapper>
```

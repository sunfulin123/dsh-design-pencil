# List

> **Cobalt core** component · `@talkdesk/cobalt-react-list`
>
> Not the same as [List (Cobalt Marketplace)](../../../components/marketplace/list/list.md), `@talkdesk/cobalt-marketplace-react-list`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.2.6)

```sh
npm install @talkdesk/cobalt-react-list
```

```tsx
import List, { Item, ClickableItem } from "@talkdesk/cobalt-react-list";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-list-docs--docs)

## Guidance

Lists are continuous, vertical indexes of content. They are highly legible, intuitive, and simple.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Lists are compiled of an ordered set of items. They can be used stand-alone but usually, they’re mixed with other components like dropdowns or popup menus.

### Anatomy

![List anatomy: asset, main label, secondary label, secondary icon, tag, action, divider, description, avatar](/assets/list/anatomy.png)
*List Anatomy*

1. **Asset** - Element that can indicate an icon, flag, checkbox, radio, and more.
2. **Main label** - Mandatory text that informs what to expect on that list item.
3. **Secondary label** - Optional value to indicate a microcopy aligned on the right.
4. **Secondary icon** - Optional visual representation of the item displayed in a simplified way.
5. **Tag** - Optional visual reference to indicate a type of list item.
6. **Action** - Optional button to allow an interactive list item.
7. **Divider** - A line to create a separation between the list of items.
8. **Description** - Optional content to give more context about the item.
9. **Avatar** - Optional modifier that indicates a person/user reference.

### Variants

#### Sizes

Lists don’t have a defined width or height. They adjust to its container. However, they have different spacing values for each viewport.

![Large list item size](/assets/list/size-large.png)
*Large*

  ![Medium list item size](/assets/list/size-medium.png)
*Medium*

  ![Small list item size](/assets/list/size-small.png)
*Small*

#### States

![Default state list item](/assets/list/state-default.png)
*Default*

  ![Hover state list item](/assets/list/state-hover.png)
*Hover*

![Focused state list item](/assets/list/state-focused.png)
*Focused*

  ![Active state list item](/assets/list/state-active.png)
*Active*

![Error state list item](/assets/list/state-error.png)
*Error*

  ![Disabled state list item](/assets/list/state-disabled.png)
*Disabled*

#### Modifiers

Some variations may be:

![List with text-only items](/assets/list/modifier-text-only.png)
*With Text only*

  ![List items with an action](/assets/list/modifier-action.png)
*With Action*

![List items with an asset (icon, flag, checkbox, radio)](/assets/list/modifier-asset.png)
*With Asset*

  ![List items with an avatar](/assets/list/modifier-avatar.png)
*With Avatar*
Use when showing an image or initial of an user

![List items with a description](/assets/list/modifier-description.png)
*With Description*
Use to add supporting text content to list items.

  ![List items with a secondary icon](/assets/list/modifier-icon.png)
*With Icon*

![List items with a secondary label](/assets/list/modifier-secondary-label.png)
*With Secondary label*

  ![List items with a tag](/assets/list/modifier-tag.png)
*With Tag*

### Guidelines

#### When to use

Use lists to highlight benefits, provide links to other screens, and much more.

* To create simple and easily scannable lists.
* To break up chunks of related content to make the information easier to scan.
* To display name/value pairs such as terms and definitions.
* To display a glossary list.

#### When not to use

* To show tabular or multi-column data. Instead, use a [Table](/components/core/table/).
* For list items with multi-actions.

#### Group

Use a divider to create logical groups of information inside a list.

![List with a divider creating logical groups of items](/assets/list/group-divider.png)

#### Placement

This component does not have a specific placement rule.

### Behavior

#### Stacking

Lists can be only stacked vertically.

#### Actionable content

If it has an action, the whole list item is clickable. During user interaction, the button action state should be always Default.

![Clickable list item with a hover state on the whole row](/assets/list/actionable-content.png)

#### Responsiveness

The component is ready to adapt to any screen like mobile, tablet, and desktop viewports.

#### Text truncation

Text truncation is supported, however, we recommend you to try to be concise whenever possible.

If the text is too long for one line, add an ellipsis `(…)` for overflow content, and accompany a tooltip to show the full string of text.

![List item with truncated text shown as an ellipsis with a tooltip](/assets/list/text-truncation.png)

#### Internationalization

For RTL (right-to-left) languages, the layout of the list should be mirrored. All texts are right-aligned while icons are left-aligned.

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > List`

* [List component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=470%3A11284) — Core Components library

* [List Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=314%3A177509) — Specs

* [Marketplace component](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/marketplace_marketplace-components-list-stories--basic)

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Interactions

#### Keyboard

No keyboard interaction is needed.

* [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/) — W3C guidelines

### Considerations

#### Development

Components must be accessible to allow interaction regardless of the user's context. Lists are announced as expected in all screen readers including VoiceOver.

* List outputs a description list that has a semantic meaning in HTML. For this reason, the list component should never be used for displaying e.g. tabular data.
* By default, list items are conveyed as a group of related elements to assistive technology users.

## Props

### List

_Also accepts the standard `HTMLAttributes<ListType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `divided` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLUListElement> |  | no |  |  |

### Item

_Also accepts the standard `HTMLAttributes<ItemType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `noPadding` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLLIElement> |  | no |  |  |

### ClickableItem

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `disabled` | boolean |  | no |  |  |
| `noPadding` | boolean |  | no |  |  |
| `selected` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLAnchorElement> |  | no |  |  |
| `href` | string |  | no |  | Can't be combined with `onClick`: pass one or the other. |
| `onClick` | MouseEventHandler<HTMLAnchorElement> |  | no |  | Can't be combined with `href`: pass one or the other. |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-react-list@2.2.6` (React 18, TypeScript strict)._

### Basic

```tsx
import List, { Item } from "@talkdesk/cobalt-react-list"

<List>
  <Item>Item 1</Item>
  <Item>Item 2</Item>
  <Item>Item 3</Item>
</List>
```

### Nopadding

```tsx
import List, { Item } from "@talkdesk/cobalt-react-list"

<List>
  <Item noPadding>Item 1</Item>
  <Item noPadding>Item 2</Item>
  <Item noPadding>Item 3</Item>
</List>
```

### Divided

```tsx
import List, { Item } from "@talkdesk/cobalt-react-list"

<List divided>
  <Item>Item 1</Item>
  <Item>Item 2</Item>
  <Item>Item 3</Item>
</List>
```

### Clickable

```tsx
import List, { ClickableItem } from "@talkdesk/cobalt-react-list";

//using onClick
<List>
  <ClickableItem onClick={...}>Item Selectable</ClickableItem>
  <ClickableItem onClick={...} selected>Item Selected</ClickableItem>
  <ClickableItem onClick={...} disabled>Item Disabled</ClickableItem>
</List>

//or using href
<List>
  <ClickableItem href="...">Item Selectable</ClickableItem>
  <ClickableItem href="..." selected>Item Selected</ClickableItem>
  <ClickableItem href="..." disabled>Item Disabled</ClickableItem>
</List>
```

# Accordion

> **Cobalt core** component · `@talkdesk/cobalt-react-accordion`
>
> Extended in Cobalt Marketplace by [AccordionStateful](../../../components/marketplace/accordion-stateful/accordion-stateful.md) (`@talkdesk/cobalt-marketplace-react-accordion-stateful`), built on this package.

## Install (v3.0.1)

```sh
npm install @talkdesk/cobalt-react-accordion
```

```tsx
import { Accordion, AccordionHeader, AccordionContent, AccordionGroup } from "@talkdesk/cobalt-react-accordion";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-accordion-docs--docs)

## Guidance

Composed of related items, vertically organized, that can be collapsed or expanded. When collapsed only the item title is shown. When expanded also the item content is visible.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Accordions are used when the user needs to deal with a large amount of content that can be grouped into related items. The accordion interaction enables the user to see all component content progressively by groups which help the user to process the information.

### Anatomy

![Accordion anatomy: collapsed item, item title, item arrow, expanded item, item content](/assets/accordion/anatomy.png)

1. **Collapsed item**
2. **Item title**
3. **Item arrow**
4. **Expanded item**
5. **Item content**

### Variants

#### Styles

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

Each accordion item has an arrow that, when visible, can have different positions.

![Arrow: default position](/assets/accordion/arrow-default.png)
*Arrow: default*

  ![Arrow: inline position](/assets/accordion/arrow-inline.png)
*Arrow: inline*

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Quantity

Accordions can have as many items as needed.

![Accordion with many items](/assets/accordion/quantity.png)

### Guidelines

#### Group

The spacing between accordions on the page should follow the global rules of **L:24px / M:16px / S:12px**.

![Grouped accordions spaced apart following the global spacing rules](/assets/accordion/usage-group.png)

### Behavior

#### Interaction

Accordions can have two main interactions distinguished by the number of items that can be opened simultaneously. In both cases, the item arrow changes when the item is open.

##### Single item open

In this interaction when one item is expanded and upon expanding a different one, the first will automatically collapse. There’s only one item expanded at a time. Expanding the following item should close the previous one automatically.

This is the ideal accordion interaction that should be used whenever possible.

![Single item open interaction, where expanding an item collapses the previously open one](/assets/accordion/interaction-single-item-open.png)

##### Multiple items open

In some use cases, we can have multiple accordion items opened. This interaction should be carefully used because the users may deal with a massive amount of content, which could decrease their experience.

![Multiple items open interaction, where more than one item can be expanded at the same time](/assets/accordion/interaction-multiple-items-open.png)

#### Text truncation

The accordion item title is single-lined because it is inside a rectangular shape with a fixed height. For that reason must be truncated when needed.

The accordion item content should never be truncated because its container height grows to accommodate all content.

![Accordion item with a truncated title](/assets/accordion/text-truncation.png)

#### Spacing

Accordion content has a consistent inner padding of 12px.

![Accordion content with a 12px inner padding](/assets/accordion/spacing.png)

#### Dimensions

Accordions have `width=100%`. Additionally, an optional maximum width of **620px** can be set.

![Accordion set to an optional maximum width](/assets/accordion/dimensions-maxwidth.png)

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Accordion`

* [Accordion component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=192%3A16157\&t=LFDEEZ7VR7CSc7m6-1) — Core component library
* [Accordion handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=378%3A204079\&t=R0lvmGNtaRi2cFSA-1) — Handoff guidelines

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

### Considerations

#### Development

* Make each header a focusable control that toggles `aria-expanded`.
* Link each header to its content region via `aria-controls` so it expands/collapses by keyboard.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Accordion

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `variant` | enum | `basic`, `transparent`, `filled` | no | basic |  |
| `edges` | enum | `none`, `bottom`, `all` | no | all |  |
| `isDisabled` | boolean |  | no |  | Whether the disclosure is disabled. |
| `onExpandedChange` | (isExpanded: boolean) => void |  | no |  | Handler that is called when the disclosure's expanded state changes. |
| `isExpanded` | boolean |  | no |  | Whether the disclosure is expanded (controlled). |
| `defaultExpanded` | boolean |  | no |  | Whether the disclosure is expanded by default (uncontrolled). |

### AccordionHeader

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `chevronPlacement` | enum | `start`, `end` | no | end | Where to render the expand/collapse chevron. |
| `hideChevron` | boolean |  | no | false | Omits the chevron entirely. It's decorative (`aria-hidden`), so this only affects sighted layout, never the accessible name or state. |
| `isDisabled` | boolean |  | no |  | Whether the button is disabled. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `type` | "button" \| "submit" \| "reset" | `button`, `submit`, `reset` | no |  | The behavior of the button when used in an HTML form. @default 'button' |
| `preventFocusOnPress` | boolean |  | no |  | Whether to prevent focus from moving to the button when pressing it.  Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control. |
| `form` | string |  | no |  | The `<form>` element to associate the button with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#form). |
| `formAction` | string |  | no |  | The URL that processes the information submitted by the button. Overrides the action attribute of the button's form owner. |
| `formEncType` | string |  | no |  | Indicates how to encode the form data that is submitted. |
| `formMethod` | string |  | no |  | Indicates the HTTP method used to submit the form. |
| `formNoValidate` | boolean |  | no |  | Indicates that the form is not to be validated when it is submitted. |
| `formTarget` | string |  | no |  | Overrides the target attribute of the button's form owner. |
| `name` | string |  | no |  | Submitted as a pair with the button's value as part of the form data. |
| `value` | string |  | no |  | The value associated with the button's name when it's submitted with the form data. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `isPending` | boolean |  | no |  | Whether the button is in a pending state. This disables press and hover events while retaining focusability, and announces the pending state to screen readers. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

### AccordionContent

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `labelElementType` | ElementType |  | no |  | The HTML element used to render the label, e.g. 'label', or 'span'. @default 'label' |
| `label` | ReactNode |  | no |  | The content to display as the label. |

### AccordionGroup

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `expandedKeys` | Key[] |  | no |  | Currently expanded keys (controlled). See `defaultExpandedKeys`. |
| `onExpandedChange` | (keys: Key[]) => void |  | no |  | Called when the expanded keys change. A `Set` is used internally to track expanded state, but this always receives a plain array, to match `expandedKeys`/`defaultExpandedKeys`. |
| `allowsMultipleExpanded` | boolean |  | no |  | Whether multiple items can be expanded at the same time. |
| `isDisabled` | boolean |  | no |  | Whether all items are disabled. |
| `defaultExpandedKeys` | Iterable<Key> |  | no |  | The initial expanded keys in the group (uncontrolled). |

## Examples

_14 of 15 compile against the published `@talkdesk/cobalt-react-accordion@3.0.1` (React 18, TypeScript strict)._

### Basic

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion defaultExpanded>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### Controlled

```tsx
import { useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

const [isExpanded, setIsExpanded] = useState(false);

<Accordion isExpanded={isExpanded} onExpandedChange={setIsExpanded}>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### Disabled

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion isDisabled>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### Borderless

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion edges="none" variant="basic" defaultExpanded>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>

<Accordion edges="none" variant="basic">
  <AccordionHeader>Title 2</AccordionHeader>
  <AccordionContent>I am the content 2</AccordionContent>
</Accordion>;
```

### Border bottom

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion edges="bottom" defaultExpanded>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>

<Accordion edges="bottom">
  <AccordionHeader>Title 2</AccordionHeader>
  <AccordionContent>I am the content 2</AccordionContent>
</Accordion>;
```

### Transparent

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion variant="transparent" defaultExpanded>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### Filled

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion variant="filled" defaultExpanded>
  <AccordionHeader>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### Nested

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion variant="filled" defaultExpanded>
  <AccordionHeader>Outer</AccordionHeader>
  <AccordionContent>
    <Accordion variant="transparent" defaultExpanded>
      <AccordionHeader>Inner expanded</AccordionHeader>
      <AccordionContent>I am the inner content 1</AccordionContent>
    </Accordion>
    <Accordion variant="transparent">
      <AccordionHeader>Inner collapsed</AccordionHeader>
      <AccordionContent>I am the inner content 2</AccordionContent>
    </Accordion>
  </AccordionContent>
</Accordion>;
```

### Chevron start

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion defaultExpanded>
  <AccordionHeader chevronPlacement="start">Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### Hide chevron

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<Accordion defaultExpanded>
  <AccordionHeader hideChevron>Title 1</AccordionHeader>
  <AccordionContent>I am the content 1</AccordionContent>
</Accordion>;
```

### RTL

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";
import { I18nProvider } from "react-aria-components";

<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <Accordion defaultExpanded>
      <AccordionHeader>Title 1</AccordionHeader>
      <AccordionContent>I am the content 1</AccordionContent>
    </Accordion>

    <Accordion defaultExpanded>
      <AccordionHeader chevronPlacement="start">Title 2</AccordionHeader>
      <AccordionContent>I am the content 2</AccordionContent>
    </Accordion>
  </div>
</I18nProvider>;
```

### Group

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

// Single-expand by default: passing more than one default key still
// collapses down to just the first ("item-1") once mounted.
<AccordionGroup defaultExpandedKeys={["item-1", "item-2"]}>
  <Accordion id="item-1">
    <AccordionHeader>Item 1</AccordionHeader>
    <AccordionContent>I am the content 1</AccordionContent>
  </Accordion>
  <Accordion id="item-2">
    <AccordionHeader>Item 2</AccordionHeader>
    <AccordionContent>I am the content 2</AccordionContent>
  </Accordion>
  <Accordion id="item-3">
    <AccordionHeader>Item 3</AccordionHeader>
    <AccordionContent>I am the content 3</AccordionContent>
  </Accordion>
</AccordionGroup>;
```

### Group multiple

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<AccordionGroup allowsMultipleExpanded>
  <Accordion id="item-1">
    <AccordionHeader>Item 1</AccordionHeader>
    <AccordionContent>I am the content 1</AccordionContent>
  </Accordion>
  <Accordion id="item-2">
    <AccordionHeader>Item 2</AccordionHeader>
    <AccordionContent>I am the content 2</AccordionContent>
  </Accordion>
  <Accordion id="item-3">
    <AccordionHeader>Item 3</AccordionHeader>
    <AccordionContent>I am the content 3</AccordionContent>
  </Accordion>
</AccordionGroup>;
```

### Group controlled

> **Doesn't compile:** the published types reject it: Type 'Dispatch<SetStateAction<never[]>>' is not assignable to type '(keys: Key[]) => void'. Fix it before use.

```tsx
import { useState } from "react";
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

const [expandedKeys, setExpandedKeys] = useState([]);

<AccordionGroup expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
  <Accordion id="item-1">
    <AccordionHeader>Item 1</AccordionHeader>
    <AccordionContent>I am the content 1</AccordionContent>
  </Accordion>
  <Accordion id="item-2">
    <AccordionHeader>Item 2</AccordionHeader>
    <AccordionContent>I am the content 2</AccordionContent>
  </Accordion>
</AccordionGroup>;
```

### Group disabled

```tsx
import {
  Accordion,
  AccordionHeader,
  AccordionContent,
  AccordionGroup,
} from "@talkdesk/cobalt-react-accordion";

<AccordionGroup isDisabled>
  <Accordion id="item-1">
    <AccordionHeader>Item 1</AccordionHeader>
    <AccordionContent>I am the content 1</AccordionContent>
  </Accordion>
  <Accordion id="item-2">
    <AccordionHeader>Item 2</AccordionHeader>
    <AccordionContent>I am the content 2</AccordionContent>
  </Accordion>
</AccordionGroup>;
```

# AccordionStateful

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-accordion-stateful`
>
> Built on [Accordion (Cobalt core)](../../../components/core/accordion/accordion.md), `@talkdesk/cobalt-react-accordion`.

## Install (v2.3.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-accordion-stateful
```

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-accordionstateful-stories--basic)

## Known gaps

Read before using it:

* AccordionStateful's props type doesn't declare children (it relied on React.FC's implicit children before React 18's types), so passing children doesn't compile under React 18 types, although they render. Its examples are marked "Doesn't compile" for this reason.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-accordion`](../../../components/core/accordion/accordion.md), [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

AccordionStateful is a Cobalt Marketplace component built on the Cobalt core [Accordion](/components/core/accordion/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for AccordionStateful is on the Cobalt core [Accordion](/components/core/accordion/) page: AccordionStateful is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### AccordionStateful

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `multiple` | boolean |  | no | false | Determines if multiple accordion items can be open at the same time. |
| `arrowPlacement` | enum | `default`, `left`, `inline`, `none` | no | default |  |
| `background` | enum | `basic`, `transparent`, `filled` | no | basic |  |
| `border` | enum | `none`, `bottom`, `all` | no | all |  |
| `defaultOpen` | number \| Set<number> |  | no | multiple ? new Set<number>() : NONE | Index(es) of open accordion item(s) by default. Indexes start at 0.  If `multiple = true`, this must be a `Set<number>`.  If `multiple = false`, this must be a `number`. |
| `children` | ReactNode |  | no |  |  |

### Item

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | ReactNode |  | yes |  |  |
| `noPadding` | boolean |  | no | false |  |
| `onClick` | MouseEventHandler<HTMLButtonElement> |  | no | () => {} | The onClick is optional. If passed, the onClick function is executed **after** the open/close action is executed. |
| `children` | ReactNode |  | yes |  |  |
| `forwardedRef` | Ref<HTMLDivElement> & Ref<HTMLButtonElement> |  | no |  |  |
| `open` | boolean |  | no |  |  |

## Examples

_3 of 6 compile against the published `@talkdesk/cobalt-marketplace-react-accordion-stateful@2.3.2` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** uses `Accordion` without importing or defining it. Fix it before use.

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";

<Accordion defaultOpen={1}>
  <Item title="...">...</Item>
  ...
</Accordion>
```

### Multiple

> **Doesn't compile:** uses `Accordion` without importing or defining it. Fix it before use.

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";

<Accordion multiple defaultOpen={new Set([0, 1])}>
  ...
</Accordion>
```

### Background

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";

// basic (default)
<AccordionStateful background="basic">
  ...
</AccordionStateful>

// filled
<AccordionStateful background="filled">
  ...
</AccordionStateful>

// transparent
<AccordionStateful background="transparent">
  ...
</AccordionStateful>
```

### Border

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";

// all border (default)
<AccordionStateful border="all">
  ...
</AccordionStateful>

// no border
<AccordionStateful border="none">
  ...
</AccordionStateful>

// bottom border only
<AccordionStateful border="bottom">
  ...
</AccordionStateful>
```

### Arrow placement

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";

// right arrow (default)
<AccordionStateful arrowPlacement="default">
  ...
</AccordionStateful>

// left arrow
<AccordionStateful arrowPlacement="left">
  ...
</AccordionStateful>

// inline arrow
<AccordionStateful arrowPlacement="inline">
  ...
</AccordionStateful>

// none arrow
<AccordionStateful arrowPlacement="none">
  ...
</AccordionStateful>
```

### No padding

> **Doesn't compile:** the published types reject it: Property 'title' is missing in type '{ children: string; }' but required in type 'PropsAux'.. Fix it before use.

```tsx
import AccordionStateful, { Item } from "@talkdesk/cobalt-marketplace-react-accordion-stateful";

// with padding (default)
<AccordionStateful>
  <Item>
  ...
  </Item>
</AccordionStateful>

// none padding
<AccordionStateful>
  <Item noPadding>
  ...
  </Item>
</AccordionStateful>
```

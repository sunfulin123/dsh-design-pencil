# Table

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-table`
>
> Not the same as [Table (Cobalt core)](../../../components/core/table/table.md), `@talkdesk/cobalt-react-table`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.1.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-table
```

```tsx
import Table, { Cell, HeadCell, Head, Body, Row, ExpandableRow, DragHandle } from "@talkdesk/cobalt-marketplace-react-table";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-table-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-table`](../../../components/core/table/table.md).

## Guidance

Table is a Cobalt Marketplace component. It is a separate package from the Cobalt core [Table](/components/core/table/), with its own API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance is on the Cobalt core [Table](/components/core/table/) page. This marketplace package has its own API: see the Code tab, and check which of the two packages your code already imports before using either.

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

### Cell

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |
| `as` | "td" \| "div" | `td`, `div` | no |  |  |
| `width` | Width |  | no |  | Defines the percentage of the width the cell should take. Use values from 5 to 100, in multiples of 5. 33 and 66 are also possible values. To have the cell occupy the minimum space needed, use "min". |
| `forwardedRef` | Ref<HTMLTableCellElement> |  | no |  |  |

### HeadCell

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |
| `as` | "th" \| "div" | `th`, `div` | no |  |  |
| `width` | Width |  | no |  | Defines the percentage of the width the cell should take. Use values from 5 to 100, in multiples of 5. 33 and 66 are also possible values. To have the cell occupy the minimum space needed, use "min". |
| `forwardedRef` | Ref<HTMLTableHeaderCellElement> |  | no |  |  |

## Examples

_1 of 1 compile against the published `@talkdesk/cobalt-marketplace-react-table@2.1.0` (React 18, TypeScript strict)._

### Main

```tsx
import Table, { Head, Body, Row, HeadCell, Cell} from "@talkdesk/cobalt-marketplace-react-table";

<Table>
  <Head>
    <Row>
      <HeadCell>...</HeadCell>
      <HeadCell>...</HeadCell>
      ...
    </Row>
  </Head>
  <Body>
    <Row>
      <Cell>...</Cell>
      <Cell>...</Cell>
      ...
    </Row>
    <Row>
      <Cell>...</Cell>
      <Cell>...</Cell>
      ...
    </Row>
  </Body>
</Table>
```

# ExpandableTable

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-expandable-table`
>
> Built on [Table (Cobalt core)](../../../components/core/table/table.md), `@talkdesk/cobalt-react-table`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-expandable-table
```

```tsx
import { ExpandableTableBody, ExpandableTableRow, ExpandableTableHead } from "@talkdesk/cobalt-marketplace-react-expandable-table";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-expandabletable-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-table`](../../../components/core/table/table.md).

## Guidance

ExpandableTable is a Cobalt Marketplace component built on the Cobalt core [Table](/components/core/table/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for ExpandableTable is on the Cobalt core [Table](/components/core/table/) page: ExpandableTable is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

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

### ExpandableTableBody

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `multiple` | boolean |  | no | false | Determines if multiple rows can be expanded at the same time. |
| `defaultOpen` | number \| Set<number> |  | no | multiple ? new Set<number>() : NONE | Index(es) of open row(s) by default. Indexes start at 0.  If `multiple = true`, this must be a `Set<number>`.  If `multiple = false`, this must be a `number`. |
| `as` | "tbody" \| "div" | `tbody`, `div` | no |  |  |
| `forwardedRef` | Ref<HTMLTableSectionElement> |  | no |  |  |

### ExpandableTableRow

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `onClick` | MouseEventHandler<HTMLTableRowElement> |  | no | () => {} |  |
| `content` | ReactNode |  | yes |  |  |
| `as` | "tr" \| "div" | `tr`, `div` | no |  |  |
| `variation` | Variation | `theme`, `info`, `success`, `warning`, `error`, `feature` | no |  |  |
| `forwardedRef` | Ref<HTMLTableRowElement> |  | no |  |  |
| `expanded` | boolean |  | no |  |  |

### ExpandableTableHead

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | "thead" \| "div" | `thead`, `div` | no |  |  |
| `forwardedRef` | Ref<HTMLTableSectionElement> |  | no |  |  |

## Examples

_3 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-expandable-table@2.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import { ExpandableTableBody, ExpandableTableRow, ExpandableTableHead} from "@talkdesk/cobalt-marketplace-react-expandable-table";
import Table, { HeadCell, Cell } from "@talkdesk/cobalt-react-table";

<Table>
  <ExpandableTableHead>
    <HeadCell>
      ...
    </HeadCell>
    ...
  </ExpandableTableHead>
  <ExpandableTableBody>
    <ExpandableTableRow onClick={() => {}} content={...}>
      <Cell>
        ...
      </Cell>
      ...
    </ExpandableTableRow>
  </ExpandableTableBody>
</Table>
```

### Multiple

```tsx
import { ExpandableTableBody, ExpandableTableRow, ExpandableTableHead} from "@talkdesk/cobalt-marketplace-react-expandable-table";
import Table, { HeadCell, Cell } from "@talkdesk/cobalt-react-table";

<Table>
  <ExpandableTableHead>
    <HeadCell>
      ...
    </HeadCell>
    ...
  </ExpandableTableHead>
  <ExpandableTableBody multiple>
    <ExpandableTableRow onClick={() => {}} content={...}>
      <Cell>
        ...
      </Cell>
      ...
    </ExpandableTableRow>
  </ExpandableTableBody>
</Table>
```

### Default open

```tsx
import { ExpandableTableBody, ExpandableTableRow, ExpandableTableHead} from "@talkdesk/cobalt-marketplace-react-expandable-table";
import Table, { HeadCell, Cell } from "@talkdesk/cobalt-react-table";

<Table>
  <ExpandableTableHead>
    <HeadCell>
      ...
    </HeadCell>
    ...
  </ExpandableTableHead>
  <ExpandableTableBody defaultOpen={1}>
    <ExpandableTableRow onClick={() => {}} content={...}>
      <Cell>
        ...
      </Cell>
      ...
    </ExpandableTableRow>
  </ExpandableTableBody>
</Table>
```

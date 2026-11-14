# Grid

> **Cobalt core** component · `@talkdesk/cobalt-react-grid`
>
> Related (Grid): [Grid](../../../foundations/tokens/grid/grid.md).

## Install (v2.3.0)

```sh
npm install @talkdesk/cobalt-react-grid
```

```tsx
import Grid, { Column } from "@talkdesk/cobalt-react-grid";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-layout-components-grid-docs--docs)

## Guidance

Grid is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Grid tokens and layout rules are in [Foundations › Grid](/foundations/tokens/grid/). Grid's own props and examples are in the Code tab.

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

### Grid

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `section`, `header`, `main`, `footer`, `div`, `aside`, `article`, `details`, `nav` | no | div | Renders the component using a different element. |
| `backgroundColor` | BackgroundColor |  | no |  |  |
| `columns` | ResponsiveValue<ColumnNumber> |  | no | 1 | Defines the number of columns per row. Use values from 1 to 20, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `gap` | ResponsiveValue<Space> |  | no |  | Defines the space between columns (horizontally and vertically). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `height` | ResponsiveValue<Height<string \| number>> |  | no |  | Defines the height of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `width` | ResponsiveValue<Width<string \| number>> |  | no |  | Defines the width of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `padding` | ResponsiveValue<Space> |  | no |  | Defines the padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingX` | ResponsiveValue<Space> |  | no |  | Defines the horizontal padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingY` | ResponsiveValue<Space> |  | no |  | Defines the vertical padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingBottom` | ResponsiveValue<Space> |  | no |  | Defines the bottom padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingInlineStart` | ResponsiveValue<Space> |  | no |  | Defines the padding at the start of the inline axis (left in LTR, right in RTL). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingInlineEnd` | ResponsiveValue<Space> |  | no |  | Defines the padding at the end of the inline axis (right in LTR, left in RTL). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingLeft` | ResponsiveValue<Space> |  | no |  | Alias of `paddingInlineStart`, so it follows the writing direction (it applies to the right in RTL). @deprecated Use `paddingInlineStart` instead. |
| `paddingRight` | ResponsiveValue<Space> |  | no |  | Alias of `paddingInlineEnd`, so it follows the writing direction (it applies to the left in RTL). @deprecated Use `paddingInlineEnd` instead. |
| `paddingTop` | ResponsiveValue<Space> |  | no |  | Defines the top padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `forwardedRef` | Ref<any> |  | no |  |  |

### Column

_Also accepts the standard `HTMLAttributes<ColumnType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `length` | ResponsiveValue<ColumnNumber> |  | no |  | Defines the number of columns the column is supposed to occupy. Use values from 1 to 20, or a tuple with values for the supported viewports. |
| `position` | ResponsiveValue<ColumnNumber> |  | no |  | Defines the position the column is supposed to be placed in. Use values from 1 to 20, or a tuple with values for the supported viewports. |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_3 of 8 compile against the published `@talkdesk/cobalt-react-grid@2.3.0` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** uses `Column` without importing or defining it. Fix it before use.

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

<Grid columns={2}>
  <Column>...</Column>
  <Column>...</Column>
</Grid>
```

### Columns

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

// Both number and string values are valid.
<Grid columns={1}>
  ...
</Grid>

// Responsive value can also be used
<Grid columns={[1, 2, 4]}>
  ...
</Grid>
```

### Padding

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

// Both number and string values are valid.
<Grid padding={2} paddingY={4} paddingTop={8}>
  ...
</Grid>

// Responsive value can also be used
<Grid padding={[1, 2, 4]}>
  ...
</Grid>
```

### Gap

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

// Both number and string values are valid.
<Grid gap={2}>
  ...
</Grid>

// Responsive value can also be used
<Grid gap={[1, 2, 4]}>
  ...
</Grid>
```

### Column length

> **Doesn't compile:** uses `Column` without importing or defining it. Fix it before use.

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

// Both number and string values are valid.
<Grid columns={3}>
  <Column>
    Column 1
  </Column>
  <Column length={2}>
    Column 2
  </Column>
</Grid>

// Responsive value can also be used
<Grid columns={3}>
  <Column>
    Column 1
  </Column>
  <Column length={[1, 2, 4]}>
    Column 2
  </Column>
</Grid>
```

### Column position

> **Doesn't compile:** uses `Column` without importing or defining it. Fix it before use.

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

// Both number and string values are valid.
<Grid columns={3}>
  <Column>
    Column 1
  </Column>
  <Column position={3}>
    Column 2
  </Column>
</Grid>

// Responsive value can also be used
<Grid columns={3}>
  <Column>
    Column 1
  </Column>
  <Column position={[1, 2, 3]}>
    Column 2
  </Column>
</Grid>
```

### Background color

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

<Grid backgroundColor="...">
```

### RTL

> **Doesn't compile:** uses `Column` without importing or defining it. Fix it before use.

```tsx
import Grid from "@talkdesk/cobalt-react-grid";

<div dir="rtl">
  {/* The start padding is applied to the right side */}
  <Grid columns={2} paddingInlineStart={8} paddingInlineEnd={2}>
    <Column>...</Column>
    <Column>...</Column>
  </Grid>
</div>;
```

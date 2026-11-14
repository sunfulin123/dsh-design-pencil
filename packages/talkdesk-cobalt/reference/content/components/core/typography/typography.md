# Typography

> **Cobalt core** component · `@talkdesk/cobalt-react-typography`
>
> Related (Typography): [Typography](../../../foundations/tokens/typography/typography.md).

## Install (v3.0.2)

```sh
npm install @talkdesk/cobalt-react-typography
```

```tsx
import { Heading, Text, Mark } from "@talkdesk/cobalt-react-typography";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-typography-heading-docs--docs)

## Guidance

Typography is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Type styles and their usage are in [Foundations › Typography](/foundations/tokens/typography/). Typography's own props and examples are in the Code tab. It is used inside these Cobalt core components: [Accordion](/components/core/accordion/), [Pagination](/components/core/pagination/).

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

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Heading

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `textAlign` | enum | `-moz-initial`, `inherit`, `initial`, `revert`, `revert-layer`, `unset`, `-khtml-center`, `-khtml-left`, `-khtml-right`, `-moz-center`, `-moz-left`, `-moz-right`, `-webkit-center`, `-webkit-left`, `-webkit-match-parent`, `-webkit-right`, `center`, `end`, `justify`, `left`, `match-parent`, `right`, `start` | no |  |  |
| `asLevel` | number |  | no |  |  |
| `scale` | enum | `large`, `medium`, `small` | no |  |  |
| `color` | Color |  | no |  |  |
| `truncated` | boolean |  | no |  |  |
| `level` | number |  | no |  | The heading level. @default 3 |

### Text

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `elementType` | enum | `p`, `span`, `strong`, `em`, `small`, `code` | no | "p" | Which DOM element to render. |
| `variant` | enum | `default`, `description`, `placeholder`, `primary`, `info`, `success`, `warning`, `error` | no |  |  |
| `color` | Color |  | no |  |  |
| `size` | enum | `small`, `medium` | no |  |  |
| `textAlign` | enum | `-moz-initial`, `inherit`, `initial`, `revert`, `revert-layer`, `unset`, `-khtml-center`, `-khtml-left`, `-khtml-right`, `-moz-center`, `-moz-left`, `-moz-right`, `-webkit-center`, `-webkit-left`, `-webkit-match-parent`, `-webkit-right`, `center`, `end`, `justify`, `left`, `match-parent`, `right`, `start` | no |  |  |
| `truncated` | boolean |  | no |  |  |
| `weight` | enum | `inherit`, `medium`, `light`, `regular` | no |  |  |
| `font` | enum | `sans`, `mono` | no |  |  |
| `inline` | boolean |  | no |  | @deprecated Use `elementType="span"` instead |
| `slot` | string |  | no | null |  |

### Mark

_Also accepts the standard `HTMLAttributes<MarkType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | enum | `yellow`, `light-yellow`, `theme`, `light-theme`, `green`, `light-green`, `red`, `light-red`, `blue`, `light-blue` | no | yellow |  |

## Examples

_18 of 18 compile against the published `@talkdesk/cobalt-react-typography@3.0.2` (React 18, TypeScript strict)._

### Heading default

```tsx
import { Heading } from "@talkdesk/cobalt-react-typography";

<Heading level={1}>...</Heading>
<Heading level={2}>...</Heading>
<Heading level={3}>...</Heading>
<Heading level={4}>...</Heading>
<Heading level={5}>...</Heading>
<Heading level={6}>...</Heading>
```

### Heading modifiers

```tsx
import { Heading } from "@talkdesk/cobalt-react-typography";

<Heading level={2} asLevel={1}>
  This is an H2 with the style of H1
</Heading>
<Heading level={1} asLevel={2}>
  This is an H1 with the style of H2
</Heading>
<Heading level={1} asLevel={3}>
  This is an H1 with the style of H3
</Heading>
<Heading level={1} asLevel={4}>
  This is an H1 with the style of H4
</Heading>
<Heading level={1} asLevel={5}>
  This is an H1 with the style of H5
</Heading>
<Heading level={1} asLevel={6}>
  This is an H1 with the style of H6
</Heading>
```

### Heading align

```tsx
import { Heading } from "@talkdesk/cobalt-react-typography";

<Heading level={1} textAlign="...">...</Heading>
```

### Heading truncated

```tsx
import { Heading } from "@talkdesk/cobalt-react-typography";

<Heading level={1} truncated>...</Heading>
```

### Heading color

```tsx
import { Heading } from "@talkdesk/cobalt-react-typography";

<Heading level={1} color="...">...</Heading>
```

### Heading scale

```tsx
import { Heading } from "@talkdesk/cobalt-react-typography";

<Heading level={1} scale="large">...</Heading>
<Heading level={1} scale="medium">...</Heading>
<Heading level={1} scale="small">...</Heading>
```

### Text default

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text>...</Text>
```

### Text align

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text textAlign="...">...</Text>
```

### Sizes

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text size="small">...</Text>

<Text size="medium">...</Text>
```

### Weights

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text weight="light">...</Text>

<Text weight="regular">...</Text>

<Text weight="medium">...</Text>

<Text weight="inherit">...</Text>

<Text>This is a text <Text weight="medium" inline> partially in bold</Text>.</Text>
```

### Text inline

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text inline>
  Text 1.
</Text>
<Text inline>
  Text 2.
</Text>
<Text inline>
  Text 3.
</Text>
```

### Text color

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text color="...">...</Text>
```

### Text variant

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text variant="default">...</Text>
<Text variant="description">...</Text>
<Text variant="placeholder">...</Text>
<Text variant="primary">...</Text>
<Text variant="info">...</Text>
<Text variant="success">...</Text>
<Text variant="warning">...</Text>
<Text variant="error">...</Text>
```

### Text truncated

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text truncated>....</Text>
```

### Text font

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text font="sans">....</Text>
<Text font="mono">....</Text>
```

### Text element type

```tsx
import { Text } from "@talkdesk/cobalt-react-typography";

<Text elementType="p">...</Text>
<Text elementType="span">...</Text>
<Text elementType="strong">...</Text>
<Text elementType="em">...</Text>
<Text elementType="small">...</Text>
<Text elementType="code">...</Text>
```

### Mark

```tsx
import { Text, Mark } from "@talkdesk/cobalt-react-typography";

<Text>
  Hello world! This is just a <Mark>highlighted</Mark> element
</Text>
```

### Mark color

```tsx
import { Mark } from "@talkdesk/cobalt-react-typography";

<Mark color="yellow">...</Mark>
<Mark color="light-yellow">...</Mark>
<Mark color="theme">...</Mark>
<Mark color="light-theme">...</Mark>
<Mark color="green">...</Mark>
<Mark color="light-green">...</Mark>
<Mark color="red">...</Mark>
<Mark color="light-red">...</Mark>
<Mark color="blue">...</Mark>
<Mark color="light-blue">...</Mark>
```

# Flex

> **Cobalt core** component · `@talkdesk/cobalt-react-flex`
>
> Related (Layout): [Layout](../../../foundations/layout/layout.md).

## Install (v3.3.0)

```sh
npm install @talkdesk/cobalt-react-flex
```

```tsx
import Flex from "@talkdesk/cobalt-react-flex";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-layout-components-flex-docs--docs)

## Guidance

Flex is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Layout and spacing guidance is in [Foundations › Layout](/foundations/layout/). Flex's own props and examples are in the Code tab.

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

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `direction` | enum | `row`, `column` | no | row | Sets the direction of the flex container. |
| `alignX` | enum | `start`, `center`, `end`, `space-around`, `space-evenly`, `space-between`, `stretch` | no | start | Defines the horizontal alignment of the child elements. |
| `alignY` | enum | `start`, `center`, `end`, `space-around`, `space-evenly`, `space-between`, `stretch` | no | start | Defines the vertical alignment of the child elements. |
| `as` | enum | `article`, `main`, `section`, `header`, `footer`, `div`, `aside`, `details`, `nav`, `span` | no | div | Renders the component using a different element. |
| `backgroundColor` | BackgroundColor |  | no |  |  |
| `grow` | boolean |  | no |  | Fills the available space in a flex container. |
| `height` | ResponsiveValue<Height<string \| number>> |  | no |  | Defines the height of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `inwards` | boolean |  | no |  | Converts the gap into negative space. This is useful to make child elements stack on top of each other. |
| `padding` | ResponsiveValue<Space> |  | no |  | Defines the padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingX` | ResponsiveValue<Space> |  | no |  | defines the horizontal padding. use values from 0 to 12, or a tuple with values for the supported viewports. these values will be multiplied by a predefined space unit. |
| `paddingY` | ResponsiveValue<Space> |  | no |  | defines the vertical padding. use values from 0 to 12, or a tuple with values for the supported viewports. these values will be multiplied by a predefined space unit. |
| `paddingBottom` | ResponsiveValue<Space> |  | no |  | Defines the bottom padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingInlineStart` | ResponsiveValue<Space> |  | no |  | Defines the padding at the start of the inline axis (left in LTR, right in RTL). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingInlineEnd` | ResponsiveValue<Space> |  | no |  | Defines the padding at the end of the inline axis (right in LTR, left in RTL). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingLeft` | ResponsiveValue<Space> |  | no |  | Alias of `paddingInlineStart`, so it follows the writing direction (it applies to the right in RTL). @deprecated Use `paddingInlineStart` instead. |
| `paddingRight` | ResponsiveValue<Space> |  | no |  | Alias of `paddingInlineEnd`, so it follows the writing direction (it applies to the left in RTL). @deprecated Use `paddingInlineEnd` instead. |
| `paddingTop` | ResponsiveValue<Space> |  | no |  | Defines the top padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `gap` | ResponsiveValue<Space> |  | no |  | Defines the space between child elements. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `scrollable` | boolean |  | no |  | Makes the container scrollable. |
| `width` | ResponsiveValue<Width<string \| number>> |  | no |  | Defines the width of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `wrap` | boolean |  | no |  | Wraps the child elements. |
| `forwardedRef` | Ref<any> |  | no |  |  |

## Examples

_10 of 11 compile against the published `@talkdesk/cobalt-react-flex@3.3.0` (React 18, TypeScript strict)._

### Basic

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

<Flex />;
<Flex direction="column" />;
```

### Horizontal alignment

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

// This also works for non-inline flex containers.
<Flex alignX="start" />;
<Flex alignX="center" />;
<Flex alignX="end" />;
<Flex alignX="space-around" />
<Flex alignX="space-between" />
<Flex alignX="space-evenly" />
<Flex direction="column" alignX="stretch" />;
```

### Vertical alignment

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

// This also works for inline flex containers.
<Flex direction="column" alignY="start" />;
<Flex direction="column" alignY="center" />;
<Flex direction="column" alignY="end" />;
<Flex direction="column" alignY="space-around" />
<Flex direction="column" alignY="space-between" />
<Flex direction="column" alignY="space-evenly" />
<Flex direction="row" alignY="stretch"/>;
```

### Padding

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

// Both number and string values are valid.
<Flex padding={2} paddingY={4} paddingTop={8} />;

// Responsive value can also be used
<Flex padding={[1, 2, 4]} />;
```

### Gap

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

// Both number and string values are valid.
<Flex gap={4} />;
<Flex direction="column" gap={4} />;

// Responsive value can also be used
<Flex gap={[1, 2, 4]} />;
```

### Item grow

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

// Applies the `flex-grow` property to the child with the corresponding index.
<Flex gap={4} width="100%">;
  <Flex grow />
</Flex>
```

### Inwards

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

<Flex inwards gap={4} />;
<Flex direction="column" inwards gap={4} />;
```

### Wrap

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

// Use with gap to get horizontal and vertical spacing automatically.
<Flex gap={4} wrap />;
<Flex direction="column" gap={4} wrap />;
```

### Scrollable

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

<Flex scrollable />;
<Flex direction="column" scrollable />;
```

### Background color

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

<Flex backgroundColor="...">
```

### RTL

```tsx
import Flex from "@talkdesk/cobalt-react-flex";

<div dir="rtl">
  {/* The start padding is applied to the right side */}
  <Flex paddingInlineStart={8} paddingInlineEnd={2}>
    ...
  </Flex>

  {/* The negative gap is mirrored too */}
  <Flex inwards gap={4}>
    ...
  </Flex>
</div>;
```

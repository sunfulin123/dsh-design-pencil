# Box

> **Cobalt core** component · `@talkdesk/cobalt-react-box`
>
> Related (Layout): [Layout](../../../foundations/layout/layout.md).

## Install (v2.3.0)

```sh
npm install @talkdesk/cobalt-react-box
```

```tsx
import Box from "@talkdesk/cobalt-react-box";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-layout-components-box-docs--docs)

## Known gaps

Read before using it:

* Box sets line-height: 0, so plain text placed directly inside it collapses onto one line or disappears (both build-test agents hit it, with List links and Dropdown values). Wrap text in Typography, or use Flex or a plain element for layout around text.

## Guidance

Box is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Layout and spacing guidance is in [Foundations › Layout](/foundations/layout/). Box's own props and examples are in the Code tab.

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

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `section`, `header`, `main`, `footer`, `div`, `aside`, `article`, `details`, `nav`, `span` | no | div | Renders the component using a different element. |
| `backgroundColor` | BackgroundColor |  | no |  |  |
| `grow` | boolean |  | no |  | Fills the available space in a flex container. |
| `height` | ResponsiveValue<Height<string \| number>> |  | no |  | Defines the height of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `padding` | ResponsiveValue<Space> |  | no |  | Defines the padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingX` | ResponsiveValue<Space> |  | no |  | defines the horizontal padding. use values from 0 to 12, or a tuple with values for the supported viewports. these values will be multiplied by a predefined space unit. |
| `paddingY` | ResponsiveValue<Space> |  | no |  | defines the vertical padding. use values from 0 to 12, or a tuple with values for the supported viewports. these values will be multiplied by a predefined space unit. |
| `paddingBottom` | ResponsiveValue<Space> |  | no |  | Defines the bottom padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingInlineStart` | ResponsiveValue<Space> |  | no |  | Defines the padding at the start of the inline axis (left in LTR, right in RTL). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingInlineEnd` | ResponsiveValue<Space> |  | no |  | Defines the padding at the end of the inline axis (right in LTR, left in RTL). Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingLeft` | ResponsiveValue<Space> |  | no |  | Alias of `paddingInlineStart`, so it follows the writing direction (it applies to the right in RTL). @deprecated Use `paddingInlineStart` instead. |
| `paddingRight` | ResponsiveValue<Space> |  | no |  | Alias of `paddingInlineEnd`, so it follows the writing direction (it applies to the left in RTL). @deprecated Use `paddingInlineEnd` instead. |
| `paddingTop` | ResponsiveValue<Space> |  | no |  | Defines the top padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `scrollable` | boolean |  | no |  | Makes the container scrollable. |
| `width` | ResponsiveValue<Width<string \| number>> |  | no |  | Defines the width of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `forwardedRef` | Ref<any> |  | no |  |  |

## Examples

_5 of 5 compile against the published `@talkdesk/cobalt-react-box@2.3.0` (React 18, TypeScript strict)._

### Basic

```tsx
import Box from "@talkdesk/cobalt-react-box";

<Box />;
```

### Padding

```tsx
import Box from "@talkdesk/cobalt-react-box";

// Both number and string values are valid.
<Box padding={2} paddingY={4} paddingTop={8}>
  ...
</Box>

// Responsive value can also be used
<Box padding={[1, 2, 4]}>
  ...
</Box>
```

### Scrollable

```tsx
import Box from "@talkdesk/cobalt-react-box";

<Box scrollable />;
```

### Background color

```tsx
import Box from "@talkdesk/cobalt-react-box";

<Box backgroundColor="..." />
```

### RTL

```tsx
import Box from "@talkdesk/cobalt-react-box";

<div dir="rtl">
  {/* The start padding is applied to the right side */}
  <Box paddingInlineStart={8} paddingInlineEnd={2}>
    ...
  </Box>
</div>;
```

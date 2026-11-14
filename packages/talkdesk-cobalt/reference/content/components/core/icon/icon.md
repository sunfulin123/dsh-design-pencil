# Icon

> **Cobalt core** component · `@talkdesk/cobalt-react-icon`
>
> Extended in Cobalt Marketplace by [LabeledIcon](../../../components/marketplace/labeled-icon/labeled-icon.md) (`@talkdesk/cobalt-marketplace-react-labeled-icon`), built on this package.
>
> Related (Iconography): [Iconography](../../../foundations/tokens/iconography/iconography.md).

## Install (v2.31.0)

```sh
npm install @talkdesk/cobalt-react-icon
```

```tsx
import IconWithProvider, { Icon, IconsProvider, iconsCatalog } from "@talkdesk/cobalt-react-icon";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-icon-docs--docs)

## Known gaps

Read before using it:

* The named Icon export stays invisible without an IconsProvider above it: it waits for the icon font, and only the provider loads it. The default export (import Icon from "@talkdesk/cobalt-react-icon") wraps itself in the provider and works anywhere.

## Guidance

Icon is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The icon set and the rules for using icons are in [Foundations › Iconography](/foundations/tokens/iconography/). Icon's own props and examples are in the Code tab. It is used inside these Cobalt core components: [Accordion](/components/core/accordion/), [Dropdown](/components/core/dropdown/), Field, Menu, [Modal](/components/core/modal/), NumberInput, [Pagination](/components/core/pagination/), [Panel](/components/core/panel/), [SearchInput](/components/core/search-input/), [Tag](/components/core/tag/).

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

### IconWithProvider

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `accessibilityLabel` | string |  | no |  | Descriptive name for the icon, to be read by screen readers |
| `name` | enum | 1,129 icon names, one per line in [name-values.txt](name-values.txt) | yes |  |  |
| `color` | Color |  | no |  |  |
| `size` | enum | `nano`, `micro`, `tiny`, `small`, `medium`, `large`, `xlarge` | no |  |  |
| `forwardedRef` | Ref<HTMLElement> |  | no |  |  |
| `disabled` | boolean |  | no |  | This prop should only be used when onClick is defined as well |
| `onClick` | MouseEventHandler<HTMLElement> & MouseEventHandler<HTMLButtonElement> |  | no |  |  |

### Icon

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `accessibilityLabel` | string |  | no |  | Descriptive name for the icon, to be read by screen readers |
| `name` | enum | 1,129 icon names, one per line in [name-values.txt](name-values.txt) | yes |  |  |
| `color` | Color |  | no |  |  |
| `size` | enum | `nano`, `micro`, `tiny`, `small`, `medium`, `large`, `xlarge` | no |  |  |
| `forwardedRef` | Ref<HTMLElement> |  | no |  |  |
| `disabled` | boolean |  | no |  | This prop should only be used when onClick is defined as well |
| `onClick` | MouseEventHandler<HTMLElement> & MouseEventHandler<HTMLButtonElement> |  | no |  |  |

### IconsProvider

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `_OPTIONS` | { font: FontFace; baseURL: string; fontFamilyPath: string; } |  | no | {   font: null as FontFace \| null,   baseURL: "https://prd-cdn-talkdesk.talkdesk.com",   fontFamilyPath: `cobalt-utils/assets/${FONT_FAMILY_VERSION.replace(     /-/g,     "."   )}/fonts`, } |  |

## Examples

_5 of 5 compile against the published `@talkdesk/cobalt-react-icon@2.31.0` (React 18, TypeScript strict)._

### Basic

```tsx
import IconWithProvider, { Icon, IconsProvider } from "@talkdesk/cobalt-react-icon";

// Use the default export to render a single icon
<IconWithProvider name="person" />;

// Use the provider when rendering more icons (recommended)
<IconsProvider>
  <Icon name="person" />
</IconsProvider>
```

### Sizes

```tsx
import { Icon } from "@talkdesk/cobalt-react-icon";

<Icon name={...} size="micro" />
<Icon name={...} size="tiny" />
<Icon name={...} size="small" />
<Icon name={...} size="medium" />
<Icon name={...} size="large" />
<Icon name={...} size="xlarge" />
```

### Color

```tsx
import { Icon } from "@talkdesk/cobalt-react-icon";

<Icon name={...} color={...} />
```

### Clickable

```tsx
import { Icon } from "@talkdesk/cobalt-react-icon";

<Icon name={...} onClick={...} />

// Disabled
<Icon name={...} disabled onClick={...} />
```

### Accessibility

```tsx
import { Icon } from "@talkdesk/cobalt-react-icon";

// Decorative (default): hidden from assistive tech
<Icon name="person" />

// Meaningful: exposed as an image with an accessible name
<Icon name="info" aria-label="More information" />
```

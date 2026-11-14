# Flag

> **Cobalt core** component · `@talkdesk/cobalt-react-flag`
>
> Related (Flags): [Flags](../../../foundations/tokens/flags/flags.md).

## Install (v2.2.7)

```sh
npm install @talkdesk/cobalt-react-flag
```

```tsx
import Flag from "@talkdesk/cobalt-react-flag";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-flag-docs--docs)

## Guidance

Flag is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The flag set is in [Foundations › Flags](/foundations/tokens/flags/). Flag's own props and examples are in the Code tab.

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

_Also accepts the standard `HTMLAttributes<FlagType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `code` | enum | 246 values, one per line in [code-values.txt](code-values.txt) | yes |  |  |
| `size` | enum | `tiny`, `small`, `medium`, `large`, `xlarge` | no | small |  |
| `forwardedRef` | Ref<HTMLElement> |  | no |  |  |

## Examples

_3 of 4 compile against the published `@talkdesk/cobalt-react-flag@2.2.7` (React 18, TypeScript strict)._

### Basic

```tsx
import Flag from "@talkdesk/cobalt-react-flag";

<Flag code="pt" />
```

### Sizes

```tsx
import Flag from "@talkdesk/cobalt-react-flag";

<Flag code="pt" size="tiny" />
<Flag code="pt" size="small" />
<Flag code="pt" size="medium" />
<Flag code="pt" size="large" />
<Flag code="pt" size="xlarge" />
```

### Catalog

```tsx
import Flag from "@talkdesk/cobalt-react-flag";

<Flag code="ad" />
...
<Flag code="zw" />
```

### Unsupported

> **Doesn't compile:** the published types reject it: Type '"zz"' is not assignable to type '"id" | "is" | "no" | "td" | "pt" | "ad" | "ae" | "af" | "ag" | "ai" | "al" | "am" | "an" | "ao" | "aq" | "ar" | "as" | "at" | "au" | "aw" | "ax" | "az" | "ba" | . Fix it before use.

```tsx
import Flag from "@talkdesk/cobalt-react-flag";

<Flag code="zz" />
```

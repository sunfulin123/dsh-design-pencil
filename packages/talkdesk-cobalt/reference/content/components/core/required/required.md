# Required

> **Cobalt core** component · `@talkdesk/cobalt-react-required`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-required
```

```tsx
import Required from "@talkdesk/cobalt-react-required";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-required-docs--docs)

## Guidance

Required is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Required yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

_Also accepts the standard `HTMLAttributes<RequiredType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | string |  | yes |  |  |
| `forwardedRef` | Ref<HTMLElement> |  | no |  |  |

## Examples

_1 of 1 compile against the published `@talkdesk/cobalt-react-required@2.2.5` (React 18, TypeScript strict)._

### Basic

```tsx
import Required from "@talkdesk/cobalt-react-required";

<span>Text</span>
<Required title="required" />
```

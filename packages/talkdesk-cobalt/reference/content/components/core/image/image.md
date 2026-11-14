# Image

> **Cobalt core** component · `@talkdesk/cobalt-react-image`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-image
```

```tsx
import Image from "@talkdesk/cobalt-react-image";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-image-docs--docs)

## Guidance

Image is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Image yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

_Also accepts the standard `ImgHTMLAttributes<ImageType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `alt` | string |  | yes |  |  |
| `src` | string |  | yes |  |  |
| `forwardedRef` | Ref<HTMLImageElement> |  | no |  |  |

## Examples

_1 of 1 compile against the published `@talkdesk/cobalt-react-image@2.2.5` (React 18, TypeScript strict)._

### Basic

```tsx
import Image from "@talkdesk/cobalt-react-image";

<Image src={...} alt={...} />;
```

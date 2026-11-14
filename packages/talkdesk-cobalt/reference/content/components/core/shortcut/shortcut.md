# Shortcut

> **Cobalt core** component · `@talkdesk/cobalt-react-shortcut`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.3.1)

```sh
npm install @talkdesk/cobalt-react-shortcut
```

```tsx
import Shortcut from "@talkdesk/cobalt-react-shortcut";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-shortcut-docs--docs)

## Guidance

Shortcut is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Shortcut yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

_Also accepts the standard `HTMLAttributes<ShortcutType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `platform` | enum | `windows`, `mac`, `linux` | no |  |  |
| `variant` | enum | `light`, `dark` | no |  |  |
| `separator` | string |  | no | + |  |
| `forwardedRef` | Ref<HTMLElement> |  | no |  |  |
| `children` | string |  | yes |  |  |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-react-shortcut@1.3.1` (React 18, TypeScript strict)._

### Basic

```tsx
import Shortcut from "@talkdesk/cobalt-react-shortcut";

<Shortcut platform="mac">meta+k</Shortcut>;
<Shortcut platform="windows">meta+k</Shortcut>;
```

### Variants

```tsx
import Shortcut from "@talkdesk/cobalt-react-shortcut";

<Shortcut variant="light">meta+k</Shortcut>;
<Shortcut variant="dark">meta+k</Shortcut>;
```

### Custom separator

```tsx
import Shortcut from "@talkdesk/cobalt-react-shortcut";

<Shortcut separator="_">meta_k</Shortcut>;
```

### Accessibility

```tsx
import Shortcut from "@talkdesk/cobalt-react-shortcut";

<button aria-keyshortcuts="Meta+K">
  Search <Shortcut platform="mac">meta+k</Shortcut>
</button>;

<Shortcut platform="mac" aria-hidden={false} aria-label="Command K">
  meta+k
</Shortcut>;
```

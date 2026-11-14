# OverflowScroll

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-overflow-scroll`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-overflow-scroll
```

```tsx
import OverflowScroll from "@talkdesk/cobalt-marketplace-react-overflow-scroll";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-overflowscroll-stories--tabs)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md).

## Guidance

OverflowScroll is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for OverflowScroll yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `scrollSnap` | number |  | no |  |  |
| `gap` | ResponsiveValue<Space> |  | no | 4 |  |
| `children` | any |  | yes |  |  |

## Examples

_0 of 2 compile against the published `@talkdesk/cobalt-marketplace-react-overflow-scroll@2.2.2` (React 18, TypeScript strict)._

### Tabs

> **Doesn't compile:** uses `OverflowScroll`, `Tab` without importing or defining it. Fix it before use.

```tsx
<OverflowScroll>
  <Tab>...</Tab>
  <Tab>...</Tab>
  ...
</OverflowScroll>
```

### Tags

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
<OverflowScroll gap="2>
  <Tag>...</Tag>
  <Tag>...</Tag>
  ...
</OverflowScroll>
```

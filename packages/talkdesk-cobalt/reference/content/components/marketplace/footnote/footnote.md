# Footnote

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-footnote`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-footnote
```

```tsx
import Footnote from "@talkdesk/cobalt-marketplace-react-footnote";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-footnote-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

Footnote is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Footnote yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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
| `microcopy` | boolean |  | no | false |  |
| `children` | ReactNode |  | yes |  |  |

## Examples

_0 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-footnote@2.2.0` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** imports `@talkdesk/cobalt-marketplace-footnote`, which isn't a published package. Fix it before use.

```tsx
import Footnote from "@talkdesk/cobalt-marketplace-footnote";

<Footnote>This is a footnote</Footnote>
```

### Link

> **Doesn't compile:** imports `@talkdesk/cobalt-marketplace-footnote`, which isn't a published package. Fix it before use.

```tsx
import Footnote from "@talkdesk/cobalt-marketplace-footnote";
import Link from "@talkdesk/cobalt-react-link";

<Footnote>
  This is a footnote with a <Link href="#">link</Link>
</Footnote>
```

### Microcopy

> **Doesn't compile:** imports `@talkdesk/cobalt-marketplace-footnote`, which isn't a published package. Fix it before use.

```tsx
import Footnote from "@talkdesk/cobalt-marketplace-footnote";

<Footnote microcopy>
  This is a footnote with microcopy modifier
</Footnote>
```

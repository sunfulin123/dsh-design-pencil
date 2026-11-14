# Media

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-media`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.1.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-media
```

```tsx
import Media from "@talkdesk/cobalt-marketplace-react-media";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-media-stories--default)

## Known gaps

Read before using it:

* Media's props type doesn't declare children (it relied on React.FC's implicit children before React 18's types), so passing children doesn't compile under React 18 types, although they render. Its examples are marked "Doesn't compile" for this reason.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

Media is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Media yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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
| `title` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | yes |  |  |
| `alignment` | enum | `start`, `center`, `end` | no | start |  |
| `reversed` | boolean |  | no | false |  |

## Examples

_0 of 5 compile against the published `@talkdesk/cobalt-marketplace-react-media@2.1.0` (React 18, TypeScript strict)._

### Default

> **Doesn't compile:** the published types reject it: Type '{ children: Element; description: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Media from "@talkdesk/cobalt-marketplace-react-media";
import Avatar from "@talkdesk/cobalt-react-avatar";

<Media description="...">
  <Avatar>...</Avatar>
</Media>
```

### With title

> **Doesn't compile:** the published types reject it: Type '{ children: Element; title: any; description: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Media from "@talkdesk/cobalt-marketplace-react-media";
import Avatar from "@talkdesk/cobalt-react-avatar";

<Media title="..." description="...">
  <Avatar>...</Avatar>
</Media>
```

### Alignment

> **Doesn't compile:** the published types reject it: Type '{ children: Element; alignment: "start"; title: any; description: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Media from "@talkdesk/cobalt-marketplace-react-media";
import Avatar from "@talkdesk/cobalt-react-avatar";

<Media alignment="start" title="..." description="...">
  <Avatar>...</Avatar>
</Media>

<Media alignment="center" title="..." description="...">
  <Avatar>...</Avatar>
</Media>

<Media alignment="end" title="..." description="...">
  <Avatar>...</Avatar>
</Media>
```

### With image

> **Doesn't compile:** the published types reject it: Type '{ children: Element; title: any; description: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Media from "@talkdesk/cobalt-marketplace-react-media";
import Image from '@talkdesk/cobalt-react-image';

<Media title="..." description="...">
  <Image src="..." alt="..." />
</Media>
```

### Reversed

> **Doesn't compile:** the published types reject it: Type '{ children: Element; reversed: true; title: any; description: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Media from "@talkdesk/cobalt-marketplace-react-media";
import Avatar from "@talkdesk/cobalt-react-avatar";

<Media reversed title="..." description="...">
  <Avatar>...</Avatar>
</Media>
```

# DismissibleTag

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-dismissible-tag`
>
> Built on [Tag (Cobalt core)](../../../components/core/tag/tag.md), `@talkdesk/cobalt-react-tag`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-dismissible-tag
```

```tsx
import DismissibleTag from "@talkdesk/cobalt-marketplace-react-dismissible-tag";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-dismissibletag-stories--basic)

## Known gaps

Read before using it:

* The dismiss control has no accessible name: it is an Icon with onClick and no accessibilityLabel, and DismissibleTag exposes no prop to set one, so a screen reader announces just "button". It also depends on @talkdesk/cobalt-react-tag ^2.3.2, so an app on core Tag 3 installs a second Tag (2.4.2) with its own styles. Until it's fixed, use a small core Tag with a clickable Icon and an accessibilityLabel (see the List View recipe). Needs a fix in cobalt-marketplace.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-tag`](../../../components/core/tag/tag.md).

## Guidance

DismissibleTag is a Cobalt Marketplace component built on the Cobalt core [Tag](/components/core/tag/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for DismissibleTag is on the Cobalt core [Tag](/components/core/tag/) page: DismissibleTag is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

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

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `onDismiss` | () => void |  | yes |  |  |
| `children` | ReactNode |  | yes |  |  |
| `color` | Color$1 | `theme`, `light-theme`, `gray`, `light-gray`, `green`, `light-green`, `yellow`, `light-yellow`, `orange`, `red`, `light-red`, `blue`, `light-blue`, `teal`, `light-teal`, `purple`, `light-purple`, `white` | no |  |  |
| `disabled` | boolean |  | no |  |  |
| `size` | Size$1 | `tiny`, `small`, `medium`, `large` | no |  |  |
| `forwardedRef` | Ref<HTMLSpanElement> |  | no |  |  |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-marketplace-react-dismissible-tag@2.2.2` (React 18, TypeScript strict)._

### Dismissible

```tsx
import DismissibleTag from "@talkdesk/cobalt-marketplace-react-dismissible-tag";

<DismissibleTag onDismiss={() => console.log('tag removed')}>Basic DismissibleTag</DismissibleTag>
```

### With color

```tsx
import DismissibleTag from "@talkdesk/cobalt-marketplace-react-dismissible-tag";

<DismissibleTag onDismiss={() => console.log('tag removed')} color="gray">Gray DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="theme">Theme DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="green">Green DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="yellow">Yellow DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="red">Red DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="purple">Purple DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')}>Default DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="light-theme">Light Theme DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="light-green">Light Green DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="light-yellow">Light Yellow DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="light-red">Light Red DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} color="light-purple">Light Purple DismissibleTag</DismissibleTag>
```

### With size

```tsx
import DismissibleTag from "@talkdesk/cobalt-marketplace-react-dismissible-tag";

<DismissibleTag onDismiss={() => console.log('tag removed')} size="tiny">Tiny DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} size="small">Small DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} size="medium">Medium DismissibleTag</DismissibleTag>
<DismissibleTag onDismiss={() => console.log('tag removed')} size="large">Large DismissibleTag</DismissibleTag>
```

### Disabled

```tsx
import DismissibleTag from "@talkdesk/cobalt-marketplace-react-dismissible-tag";

<DismissibleTag onDismiss={() => console.log('tag removed')} disabled>Disabled DismissibleTag</DismissibleTag>
```

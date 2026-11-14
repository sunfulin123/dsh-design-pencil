# StatefulButton

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-stateful-button`
>
> Built on [Button (Cobalt core)](../../../components/core/button/button.md), `@talkdesk/cobalt-react-button`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-stateful-button
```

```tsx
import StatefulButton from "@talkdesk/cobalt-marketplace-react-stateful-button";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-statefulbutton-stories--states)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-spinner`](../../../components/core/spinner/spinner.md).

## Guidance

StatefulButton is a Cobalt Marketplace component built on the Cobalt core [Button](/components/core/button/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for StatefulButton is on the Cobalt core [Button](/components/core/button/) page: StatefulButton is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

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

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `state` | enum | `loading`, `inline-loading`, `success`, `error` | no |  |  |
| `htmlType` | "submit" \| "reset" \| "button" | `submit`, `reset`, `button` | no |  |  |
| `shape` | Shape | `full-width`, `compact` | no |  |  |
| `size` | Size | `tiny`, `small`, `medium` | no |  |  |
| `type` | Type | `success`, `primary`, `secondary`, `info`, `danger`, `warning`, `feature`, `mono-dark`, `mono-light` | no |  |  |
| `variation` | Variation | `outline`, `transparent` | no |  |  |
| `contrast` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLButtonElement> |  | no |  |  |

## Examples

_1 of 1 compile against the published `@talkdesk/cobalt-marketplace-react-stateful-button@2.2.2` (React 18, TypeScript strict)._

### States

```tsx
import StatefulButton from "@talkdesk/cobalt-marketplace-react-stateful-button";

<StatefulButton state="loading">Primary</StatefulButton>
<StatefulButton state="inline-loading">Primary</StatefulButton>
<StatefulButton state="loading" variation="transparent">Primary</StatefulButton>
<StatefulButton state="error">Primary</StatefulButton>
<StatefulButton state="error" size="small">Primary</StatefulButton>
<StatefulButton state="success">Primary</StatefulButton>
<StatefulButton state="success" size="small">Primary</StatefulButton>
```

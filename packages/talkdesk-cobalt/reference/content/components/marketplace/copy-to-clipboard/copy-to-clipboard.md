# CopyToClipboard

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-copy-to-clipboard`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.3.3)

```sh
npm install @talkdesk/cobalt-marketplace-react-copy-to-clipboard
```

```tsx
import CopyToClipboard from "@talkdesk/cobalt-marketplace-react-copy-to-clipboard";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-copytoclipboard-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

CopyToClipboard is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for CopyToClipboard yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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
| `onCopy` | ((text: string) => void) & ClipboardEventHandler<HTMLButtonElement> |  | no | () => {} |  |
| `text` | string |  | yes |  |  |
| `htmlType` | "submit" \| "reset" \| "button" | `submit`, `reset`, `button` | no |  |  |
| `shape` | Shape | `full-width`, `compact` | no |  |  |
| `size` | Size | `tiny`, `small`, `medium` | no |  |  |
| `type` | Type | `primary`, `secondary`, `info`, `danger`, `warning`, `success`, `feature`, `mono-dark`, `mono-light` | no |  |  |
| `variation` | Variation | `outline`, `transparent` | no |  |  |
| `contrast` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLButtonElement> |  | no |  |  |

## Examples

_0 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-copy-to-clipboard@2.3.3` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import CopyToClipboard from "@talkdesk/cobalt-marketplace-react-copy-to-clipboard";

<CopyToClipboard text="Hello world">
  <Icon name="copy" size="tiny" />
</CopyToClipboard>
```

### Small

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import CopyToClipboard from "@talkdesk/cobalt-marketplace-react-copy-to-clipboard";

<CopyToClipboard text="Hello world" size="small">
  <Icon name="copy" size="micro" />
</CopyToClipboard>
```

### Tiny

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import CopyToClipboard from "@talkdesk/cobalt-marketplace-react-copy-to-clipboard";

<CopyToClipboard text="Hello world" size="tiny">
  <Icon name="copy" size="nano" />
</CopyToClipboard>
```

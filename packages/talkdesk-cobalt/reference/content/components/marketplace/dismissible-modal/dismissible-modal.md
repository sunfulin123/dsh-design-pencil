# DismissibleModal

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-dismissible-modal`
>
> Built on [Modal (Cobalt core)](../../../components/core/modal/modal.md), `@talkdesk/cobalt-react-modal`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-dismissible-modal
```

```tsx
import DismissibleModal from "@talkdesk/cobalt-marketplace-react-dismissible-modal";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-dismissiblemodal-stories--default)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-modal`](../../../components/core/modal/modal.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

DismissibleModal is a Cobalt Marketplace component built on the Cobalt core [Modal](/components/core/modal/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for DismissibleModal is on the Cobalt core [Modal](/components/core/modal/) page: DismissibleModal is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

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
| `focusOptions` | false \| Options |  | no |  | Allows to configure the `focusTrap` options (reference [here](https://bit.ly/3ncdb2r)). If set to `false`, no focus trap logic is provided. |
| `size` | Size | `small`, `medium`, `large`, `fill` | no |  |  |
| `visible` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-marketplace-react-dismissible-modal@2.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import React, { useState } from "react";
import DismissibleModal from "@talkdesk/cobalt-marketplace-react-dismissible-modal";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";

const [visible, setVisible] = useState(false);

<Portal>
  <DismissibleModal onDismiss={() => setVisible(false)} visible={visible}>
    Modal content
  </DismissibleModal>
</Portal>
```

### Small

```tsx
import DismissibleModal from "@talkdesk/cobalt-marketplace-react-dismissible-modal";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";

<Portal>
  <DismissibleModal onDismiss={...} size="small">
    ...
  </DismissibleModal>
</Portal>
```

### Medium

```tsx
import DismissibleModal from "@talkdesk/cobalt-marketplace-react-dismissible-modal";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";

<Portal>
  <DismissibleModal onDismiss={...} size="medium">
    ...
  </DismissibleModal>
</Portal>
```

### Large

```tsx
import DismissibleModal from "@talkdesk/cobalt-marketplace-react-dismissible-modal";
import { Portal } from "@talkdesk/cobalt-react-portal-provider";

<Portal>
  <DismissibleModal onDismiss={...} size="large">
    ...
  </DismissibleModal>
</Portal>
```

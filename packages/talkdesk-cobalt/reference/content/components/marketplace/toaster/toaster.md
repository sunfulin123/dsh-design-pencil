# Toaster

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-toaster`
>
> Related (Toast): [Message](../../../components/core/message/message.md), `@talkdesk/cobalt-react-message`.

## Install (v2.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-toaster
```

```tsx
import Toaster from "@talkdesk/cobalt-marketplace-react-toaster";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-toaster-stories--basic)

## Known gaps

Read before using it:

* Toasts animate with react-transition-group without a nodeRef, so it falls back to findDOMNode: React 18 logs a findDOMNode warning in StrictMode, and React 19, which removed findDOMNode, can't render them.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-message`](../../../components/core/message/message.md), [`@talkdesk/cobalt-react-responsive-value-hook`](../../../hooks/core/responsive-value-hook/responsive-value-hook.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

Toaster is a Cobalt Marketplace component that shows toasts. It is built on the Cobalt core [Message](/components/core/message/) component.

### Design

### Overview

Toasts are documented in the Toast section of the Cobalt core [Message](/components/core/message/) page. Toaster is built on core Message and follows that guidance; its own props and examples are in the Code tab.

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
| `toasts` | TToast[] |  | no |  |  |
| `max` | number |  | no | 2 |  |
| `position` | enum | `top-left`, `top-right`, `bottom-left`, `bottom-right` | no | bottom-right |  |
| `onDismiss` | (toastId: string) => void |  | no |  |  |
| `children` | (opts: { toast: TToast; dismissToast: () => void; }) => ReactNode |  | yes |  |  |

## Examples

_0 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-toaster@2.2.0` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** the published types reject it: Type 'number' is not assignable to type 'string'.. Fix it before use.

```tsx
import Toaster from '@talkdesk/cobalt-marketplace-react-toaster'

<Toaster
    toasts={[
        { id: 1, type: 'info', message: 'Hello world' },
    ]}
>
    {({ toast }) => (
        <div>{toast.message}</div>
    )}
</Toaster>;
```

### Dismissible

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Toaster from '@talkdesk/cobalt-marketplace-react-toaster'

<Toaster
    toasts={[
        { id: 1, type: 'info', message: 'Hello world' },
        { id: 2, type: 'error', message: 'Hey world' },
    ]}
    onDismiss={/* remove the message */}
>
    {({ toast, dismissToast }) => (
        <div>
            <span>{toast.message}</span>
            <button onClick={dismissToast}>X</button>
        </div>
    )}
</Toaster>;
```

### Auto dismissible

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Toaster from '@talkdesk/cobalt-marketplace-react-toaster'

<Toaster
    toasts={[
        { id: 1, type: 'info', message: 'Hello world', timeout: 5000 },
        { id: 2, type: 'error', message: 'Hey world' },
    ]}
    onDismiss={/* remove the message */}
>
    {({ toast }) => (
        <div>{toast.message}</div>
    )}
</Toaster>;
```

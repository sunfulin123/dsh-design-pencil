# Message

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-message`
>
> Not the same as [Message (Cobalt core)](../../../components/core/message/message.md), `@talkdesk/cobalt-react-message`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-message@2.2.2
```

```tsx
import Message from "@talkdesk/cobalt-marketplace-react-message";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-message-stories--states)

## Known gaps

Read before using it:

* npm's latest tag for this package points at a prerelease (2.2.2-pre.80bf68a), so pnpm add installs the prerelease. Pin the version: pnpm add @talkdesk/cobalt-marketplace-react-message@2.2.2.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-message`](../../../components/core/message/message.md), [`@talkdesk/cobalt-react-spinner`](../../../components/core/spinner/spinner.md).

## Guidance

Message is a Cobalt Marketplace component. It is a separate package from the Cobalt core [Message](/components/core/message/), with its own API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance is on the Cobalt core [Message](/components/core/message/) page. This marketplace package has its own API: see the Code tab, and check which of the two packages your code already imports before using either.

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
| `onDismiss` | () => void |  | no |  |  |
| `withLoader` | boolean |  | no |  |  |
| `block` | boolean |  | no |  | Aligns icon on top when multiple children are provided |
| `type` | Type | `banner`, `floating` | no |  |  |
| `variation` | Variation | `info`, `success`, `warning`, `error`, `feature`, `primary`, `secondary` | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_3 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-message@2.2.2` (React 18, TypeScript strict)._

### Action

```tsx
import Message from "@talkdesk/cobalt-marketplace-react-message";
import { Text } from "@talkdesk/cobalt-react-typography";

<Message variation="info" onDismiss={() => {}}><Text>This is a dismissible info message</Text></Message>;
```

### Block

```tsx
import Message from "@talkdesk/cobalt-marketplace-react-message";
import { Text } from "@talkdesk/cobalt-react-typography";

<Message block>
  <Text>This is a block message with multiple children:</Text>
  <Text>Children 1</Text>
  <Text>Children 2</Text>
</Message>;
```

### Variation

```tsx
import Message from "@talkdesk/cobalt-marketplace-react-message";
import { Text } from "@talkdesk/cobalt-react-typography";

<Message variation="error"><Text>This is an error message</Text></Message>
<Message variation="feature"><Text>This is a feature message</Text></Message>
<Message variation="info"><Text>This is an info message</Text></Message>
<Message variation="success"><Text>This is a success message</Text></Message>
<Message variation="warning"><Text>This is a warning message</Text></Message>
<Message variation="feature" withLoader><Text>This is a feature message with loader</Text></Message>
```

# FakeInput

> **Cobalt core** component · `@talkdesk/cobalt-react-fake-input`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.6)

```sh
npm install @talkdesk/cobalt-react-fake-input
```

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-fakeinput-docs--docs)

## Guidance

FakeInput is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for FakeInput yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

_Also accepts the standard `HTMLAttributes<FakeInputType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `disabled` | boolean |  | no |  |  |
| `readOnly` | boolean |  | no |  |  |
| `size` | enum | `small`, `medium` | no | medium |  |
| `variation` | enum | `error`, `warning`, `unstyled` | no |  |  |
| `wrap` | boolean |  | no |  | Removes the defined height and allows the FakeInput to grow (in height) with is inner component. |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_7 of 7 compile against the published `@talkdesk/cobalt-react-fake-input@2.2.6` (React 18, TypeScript strict)._

### Primary

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput />
```

### Sizes

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput size="small" />
<FakeInput size="medium" />
```

### Variations

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput variation="error" />
<FakeInput variation="warning" />
```

### Disabled

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput disabled />
```

### Readonly

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput readOnly />
```

### Wrap

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput wrap />
```

### Clickable

```tsx
import FakeInput from "@talkdesk/cobalt-react-fake-input";

<FakeInput onClick={...} />
```

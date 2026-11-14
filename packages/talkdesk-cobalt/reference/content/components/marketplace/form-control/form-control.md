# FormControl

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-form-control`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-form-control
```

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-formcontrol-stories--main)

## Known gaps

Read before using it:

* FormControl's props type doesn't declare children (it relied on React.FC's implicit children before React 18's types), so passing children doesn't compile under React 18 types, although they render. Its examples are marked "Doesn't compile" for this reason.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-label`](../../../components/core/label/label.md), [`@talkdesk/cobalt-react-required`](../../../components/core/required/required.md), [`@talkdesk/cobalt-react-tag`](../../../components/core/tag/tag.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

FormControl is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for FormControl yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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
| `currentLength` | number |  | no |  | Behavior should be controlled manually. Required if `maxLength` is defined. Requires `label` to be defined as well. `tertiaryLabel` must not be defined. |
| `description` | string |  | no |  | Description to be displayed below the `label`. |
| `feedbackMessage` | string |  | no |  | Validation message to be displayed below the input. Color defined by the `feedbackStatus` prop. |
| `feedbackStatus` | enum | `error`, `warning` | no |  |  |
| `hint` | string |  | no |  | Hint to be displayed below the input. |
| `inputId` | string |  | yes |  | ID of the input passed as children. |
| `label` | string |  | no |  |  |
| `maxLength` | number |  | no |  | Behavior should be controlled manually. Required if `currentLength` is defined. Requires `label` to be defined as well. `tertiaryLabel` must not be defined. |
| `required` | boolean |  | no | false |  |
| `secondaryLabel` | string |  | no |  | Label to be displayed right after the main label. |
| `tertiaryLabel` | string |  | no |  | Label to be displayed at the opposite side of the main label. Can't be defined if `currentLength` and `maxLength` are defined. |
| `width` | Width<string \| number> |  | no |  |  |

## Examples

_0 of 6 compile against the published `@talkdesk/cobalt-marketplace-react-form-control@2.2.2` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: string; hint: string; required: true; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";

<FormControl label="Label" hint="Some hint" required>
  // Some input
</FormControl>
```

### Secondary description

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: string; secondaryLabel: string; description: string; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";

<FormControl
  label="Label"
  secondaryLabel="Secondary label"
  description="Description"
>
  // Some input
</FormControl>
```

### Tertiary

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: string; tertiaryLabel: string; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";

<FormControl
  label="Label"
  tertiaryLabel="Tertiary label"
>
  // Some input
</FormControl>
```

### Hint

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: string; hint: string; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";

<FormControl
  label="Label"
  hint="Hint"
>
  // Some input
</FormControl>
```

### Character counter

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: string; currentLength: number; maxLength: number; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";

<FormControl
  label="Label"
  currentLength={3}
  maxLength={5}
>
  // Some input
</FormControl>
```

### Feedback

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: string; feedbackStatus: "warning"; feedbackMessage: string; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormControl from "@talkdesk/cobalt-marketplace-react-form-control";

// Warning
<FormControl
  label="Warning"
  feedbackStatus="warning"
  feedbackMessage="This is a warning message"
>
  // Some input
</FormControl>

// Error
<FormControl
  label="Error"
  feedbackStatus="error"
  feedbackMessage="This is an error message"
>
  // Some input
</FormControl>
```

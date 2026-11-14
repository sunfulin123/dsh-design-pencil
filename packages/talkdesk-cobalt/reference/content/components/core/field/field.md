# Field

> **Cobalt core** component · `@talkdesk/cobalt-react-field`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.4.1)

```sh
npm install @talkdesk/cobalt-react-field
```

```tsx
import { useField, Field, FieldErrorMessage, useFieldGroup } from "@talkdesk/cobalt-react-field";
```

## Guidance

Field is a Cobalt core component.

### Design

### Overview

No design guidance has been written for Field on its own: it is a building block, used inside these Cobalt core components: [Checkbox](/components/core/checkbox/), ColorInput, [Dropdown](/components/core/dropdown/), [InputGroup](/components/core/input-group/), NumberInput, [Radio](/components/core/radio/), [SearchInput](/components/core/search-input/), [Tag](/components/core/tag/), TextInput, [Textarea](/components/core/textarea/), [Toggle](/components/core/toggle/). You usually get it through them. Its props and examples are in the Code tab.

### Code

### Live playground

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

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

### Field

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | string |  | no |  |  |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `isInvalid` | boolean |  | no |  |  |
| `hintId` | string |  | yes |  |  |
| `warningId` | string |  | yes |  |  |
| `errorId` | string |  | no |  |  |
| `descriptionId` | string |  | no |  |  |
| `children` | ReactNode |  | yes |  |  |
| `errors` | ReactNode |  | no |  |  |

### FieldErrorMessage

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | string |  | no |  |  |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `isInvalid` | boolean |  | no |  |  |
| `hintId` | string |  | yes |  |  |
| `warningId` | string |  | yes |  |  |
| `errorId` | string |  | no |  |  |
| `descriptionId` | string |  | no |  |  |
| `children` | ReactNode |  | yes |  |  |
| `errors` | ReactNode |  | no |  |  |

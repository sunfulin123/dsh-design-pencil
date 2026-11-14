# ColorInput

> **Cobalt core** component · `@talkdesk/cobalt-react-color-input`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.2.1)

```sh
npm install @talkdesk/cobalt-react-color-input
```

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-colorinput-docs--docs)

## Guidance

ColorInput is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for ColorInput yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `onChange` | (value: string) => void |  | no |  |  |
| `validate` | (value: string) => true \| ValidationError |  | no |  |  |
| `inputRef` | Ref<HTMLInputElement> |  | no |  |  |
| `placeholder` | string |  | no |  |  |
| `size` | enum | `small`, `medium` | no | medium |  |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `value` | string \| (Color & string) |  | no |  | The current value (controlled). |
| `defaultValue` | string \| (Color & string) |  | no |  | The default value (uncontrolled). |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `isWheelDisabled` | boolean |  | no |  | Enables or disables changing the value with scroll. |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |

## Examples

_15 of 15 compile against the published `@talkdesk/cobalt-react-color-input@1.2.1` (React 18, TypeScript strict)._

### Default

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Background color" />
```

### With hint

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput
  label="Background color"
  hint="Used behind the main content area"
/>
```

### Controlled

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Background color" value={value} onChange={setValue} />
```

### Sizes

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Small" size="small" />
<ColorInput label="Medium" size="medium" />
```

### Required

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Background color" isRequired />
```

### Invalid

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Background color" isInvalid />
```

### With error message

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput
  label="Background color"
  isInvalid
  errorMessage="Enter a color in hex format"
/>
```

### With warning message

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput
  label="Background color"
  defaultValue="#ffcc61"
  warningMessage="This color is very light"
/>
```

### Disabled

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Background color" defaultValue="#ffcc61" isDisabled />
```

### Read only

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput label="Background color" defaultValue="#ffcc61" isReadOnly />
```

### With secondary label

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<ColorInput
  label="Background color"
  secondaryLabel={<Text inline>Optional</Text>}
/>
```

### With tertiary label

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<ColorInput
  label="Background color"
  tertiaryLabel={<Text inline>Tertiary Label</Text>}
/>
```

### With description

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"

<ColorInput
  label="Background color"
  description="Shown on your public profile"
/>
```

### With all labels

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"

<ColorInput
  label="Label"
  isRequired
  secondaryLabel={
    <>
      <Icon name="info" size="micro" />
      <Text inline>Secondary Label</Text>
    </>
  }
  tertiaryLabel={
    <>
      <Text inline>Tertiary Label</Text>
      <Link href="#">Link here</Link>
    </>
  }
  description="Description"
  hint="Form hint"
/>
```

### Labels overflow

```tsx
import { ColorInput } from "@talkdesk/cobalt-react-color-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<div style={{ width: 320 }}>
  <ColorInput
    label="Label"
    secondaryLabel={
      <Text inline truncated>
        A secondary label long enough to be truncated
      </Text>
    }
    tertiaryLabel={<Text inline>Tertiary Label</Text>}
  />
</div>
```

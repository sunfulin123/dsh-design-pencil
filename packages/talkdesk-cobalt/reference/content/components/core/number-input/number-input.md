# NumberInput

> **Cobalt core** component · `@talkdesk/cobalt-react-number-input`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.2.3)

```sh
npm install @talkdesk/cobalt-react-number-input
```

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-numberinput-docs--docs)

## Guidance

NumberInput is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for NumberInput yet. It is used inside these Cobalt core components: [Pagination](/components/core/pagination/). Its props and examples are in the Code tab, and its Storybook is linked above.

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
| `prefix` | ReactNode |  | no |  |  |
| `suffix` | ReactNode |  | no |  |  |
| `placeholder` | string |  | no |  |  |
| `inputRef` | Ref<HTMLInputElement> |  | no |  |  |
| `size` | enum | `small`, `medium` | no |  |  |
| `accessibilityLabels` | AccessibilityLabels |  | no |  |  |
| `hideIncrementAndDecrementButtons` | boolean |  | no |  |  |
| `shouldAutoSize` | boolean |  | no |  |  |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `decrementAriaLabel` | string |  | no |  | A custom aria-label for the decrement button. If not provided, the localized string "Decrement" is used. |
| `incrementAriaLabel` | string |  | no |  | A custom aria-label for the increment button. If not provided, the localized string "Increment" is used. |
| `isWheelDisabled` | boolean |  | no |  | Enables or disables changing the value with scroll. |
| `formatOptions` | NumberFormatOptions |  | no |  | Formatting options for the value displayed in the number field. This also affects what characters are allowed to be typed by the user. |
| `commitBehavior` | "validate" \| "snap" | `validate`, `snap` | no |  | Controls the behavior of the number field when the user blurs the field after editing. 'snap' will clamp the value to the min/max values, and snap to the nearest step value. 'validate' will not clamp the value, and will validate that the value is within the min/max range and on a valid step. @default 'snap' |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `validate` | (value: number) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `value` | number |  | no |  | The current value (controlled). |
| `defaultValue` | number |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: number) => void |  | no |  | Handler that is called when the value changes. |
| `minValue` | number |  | no |  | The smallest value allowed for the input. |
| `maxValue` | number |  | no |  | The largest value allowed for the input. |
| `step` | number |  | no |  | The amount that the input value changes with each increment or decrement "tick". |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |

## Examples

_23 of 23 compile against the published `@talkdesk/cobalt-react-number-input@1.2.3` (React 18, TypeScript strict)._

### Default

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput label="Quantity" placeholder="Enter a number" />
```

### With hint

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  hint="Whole numbers only"
/>
```

### Sizes

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput label="Small" placeholder="Enter a number" size="small" />
<NumberInput label="Medium" placeholder="Enter a number" size="medium" />
```

### Min max step

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  defaultValue={5}
  minValue={0}
  maxValue={100}
  step={5}
/>
```

### Required

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput label="Quantity" placeholder="Enter a number" isRequired />
```

### Invalid

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput label="Quantity" placeholder="Enter a number" isInvalid />
```

### With error message

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  isInvalid
  errorMessage="Enter a quantity of 1 or more"
/>
```

### With warning message

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  warningMessage="This value is unusually high"
/>
```

### Disabled

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  defaultValue={9}
  isDisabled
/>
```

### Read only

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  defaultValue={9}
  isReadOnly
/>
```

### Custom labels

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  defaultValue={9}
  accessibilityLabels={{
    increment: "Increase quantity",
    decrement: "Decrease quantity",
  }}
/>
```

### Without buttons

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  hideIncrementAndDecrementButtons
/>
```

### Wheel enabled

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  placeholder="Enter a number"
  isWheelDisabled={false}
/>
```

### With secondary label

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<NumberInput
  label="Quantity"
  secondaryLabel={<Text inline>Optional</Text>}
/>
```

### With tertiary label

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<NumberInput
  label="Quantity"
  tertiaryLabel={<Text inline>Tertiary Label</Text>}
/>
```

### With description

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput
  label="Quantity"
  description="Shown on your public profile"
/>
```

### With all labels

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"

<NumberInput
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

### With prefix

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import Icon from "@talkdesk/cobalt-react-icon"

<NumberInput
  label="Price"
  defaultValue={9}
  prefix={<Icon name="attach_money" size="micro" />}
/>
```

### With suffix

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<NumberInput
  label="Weight"
  defaultValue={72}
  suffix={<Text inline color="var(--text-description)">kg</Text>}
/>
```

### With prefix and suffix

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Tag } from "@talkdesk/cobalt-react-tag"
import Button from "@talkdesk/cobalt-react-button"

<NumberInput
  label="Label"
  defaultValue={9}
  prefix={<Icon name="accessibility" size="micro" />}
  suffix={
    <>
      <Text inline color="var(--text-description)">Value</Text>
      <Icon name="accessibility" size="micro" />
      <Tag color="light-gray" size="small">A</Tag>
      <Button
        variation="transparent"
        shape="compact"
        size="tiny"
        aria-label="Expand"
      >
        <Icon name="expand" size="micro" />
      </Button>
    </>
  }
/>
```

### Disabled with slots

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import { Text } from "@talkdesk/cobalt-react-typography"
import Button from "@talkdesk/cobalt-react-button"
import Icon from "@talkdesk/cobalt-react-icon"

<NumberInput
  label="Weight"
  isDisabled
  defaultValue={72}
  suffix={
    <>
      <Text inline color="var(--text-description)">kg</Text>
      <Button
        variation="transparent"
        shape="compact"
        size="tiny"
        aria-label="Reset"
      >
        <Icon name="refresh" size="micro" />
      </Button>
    </>
  }
/>
```

### Auto size

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"

<NumberInput label="Quantity" defaultValue={9} shouldAutoSize />
```

### Labels overflow

```tsx
import { NumberInput } from "@talkdesk/cobalt-react-number-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<div style={{ width: 320 }}>
  <NumberInput
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

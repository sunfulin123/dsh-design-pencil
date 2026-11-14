# TextInput

> **Cobalt core** component · `@talkdesk/cobalt-react-text-input`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.3.0)

```sh
npm install @talkdesk/cobalt-react-text-input
```

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-textinput-docs--docs)

## Guidance

TextInput is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for TextInput yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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
| `inputRef` | Ref<HTMLInputElement> |  | no |  |  |
| `placeholder` | string |  | no |  |  |
| `size` | enum | `small`, `medium` | no |  |  |
| `type` | enum | `text`, `email`, `tel`, `url`, `password` | no | text |  |
| `accessibilityLabels` | AccessibilityLabels |  | no |  |  |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `enterKeyHint` | "enter" \| "done" \| "go" \| "next" \| "previous" \| "search" \| "send" | `enter`, `done`, `go`, `next`, `previous`, `search`, `send` | no |  | An enumerated attribute that defines what action label or icon to preset for the enter key on virtual keyboards. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint). |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the value is invalid. |
| `validate` | (value: string) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `onFocus` | (e: FocusEvent<HTMLInputElement, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<HTMLInputElement, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `value` | string |  | no |  | The current value (controlled). |
| `defaultValue` | string |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: string) => void |  | no |  | Handler that is called when the value changes. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `autoComplete` | string |  | no |  | Describes the type of autocomplete functionality the input should provide if any. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete). |
| `maxLength` | number |  | no |  | The maximum number of characters supported by the input. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefmaxlength). |
| `minLength` | number |  | no |  | The minimum number of characters required by the input. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefminlength). |
| `pattern` | string |  | no |  | Regex pattern that the value of the input must match to be valid. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefpattern). |
| `inputMode` | "search" \| "none" \| "text" \| "tel" \| "url" \| "email" \| "numeric" \| "decimal" | `search`, `none`, `text`, `tel`, `url`, `email`, `numeric`, `decimal` | no |  | Hints at the type of data that might be entered by the user while editing the element or its contents. See [MDN](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute). |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |

## Examples

_21 of 21 compile against the published `@talkdesk/cobalt-react-text-input@1.3.0` (React 18, TypeScript strict)._

### Default

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Name" />
```

### With hint

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput
  label="Name"
  hint="As it appears on your government-issued ID"
/>
```

### Types

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Text" type="text" />
<TextInput label="Email" type="email" />
<TextInput label="Tel" type="tel" />
<TextInput label="URL" type="url" />
<TextInput label="Password" type="password" />
```

### Sizes

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Small" size="small" />
<TextInput label="Medium" size="medium" />
```

### Required

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Name" isRequired />
```

### Invalid

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Name" isInvalid />
```

### With error message

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput
  label="Name"
  isInvalid
  errorMessage="Enter your name as it appears on your ID"
/>
```

### With warning message

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput
  label="Name"
  warningMessage="This name is already in use by another account"
/>
```

### Disabled

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Name" isDisabled />
```

### Read only

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Name" isReadOnly />
```

### With secondary label

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<TextInput label="Name" secondaryLabel={<Text inline>Optional</Text>} />
```

### With tertiary label

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import { Tag } from "@talkdesk/cobalt-react-tag"

<TextInput
  label="Name"
  tertiaryLabel={<Tag color="light-gray" size="small">3/15</Tag>}
/>
```

### With character count

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<TextInput
  label="Name"
  tertiaryLabel={<Text inline>Optional</Text>}
  maxLength={50}
/>
```

### With description

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"

<TextInput label="Name" description="Shown on your public profile" />
```

### With all labels

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"
import { Tag } from "@talkdesk/cobalt-react-tag"

<TextInput
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
      <Tag color="light-gray" size="small">3/15</Tag>
    </>
  }
  description="Description"
  hint="Form hint"
/>
```

### With prefix

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import Icon from "@talkdesk/cobalt-react-icon"

<TextInput label="Website" prefix={<Icon name="link" size="micro" />} />
```

### With suffix

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<TextInput
  label="Weight"
  defaultValue="72"
  suffix={<Text inline color="var(--text-description)">kg</Text>}
/>
```

### With interactive suffix

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import Button from "@talkdesk/cobalt-react-button"
import Icon from "@talkdesk/cobalt-react-icon"

const [isVisible, setIsVisible] = useState(false);

<TextInput
  label="Password"
  type={isVisible ? "text" : "password"}
  suffix={
    <Button
      variation="transparent"
      shape="compact"
      size="tiny"
      aria-label={isVisible ? "Hide password" : "Show password"}
      onPress={() => setIsVisible((visible) => !visible)}
    >
      <Icon name="visibility" size="micro" />
    </Button>
  }
/>
```

### With prefix and suffix

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Tag } from "@talkdesk/cobalt-react-tag"
import Button from "@talkdesk/cobalt-react-button"

<TextInput
  label="Label"
  defaultValue="9"
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
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import Button from "@talkdesk/cobalt-react-button"
import Icon from "@talkdesk/cobalt-react-icon"

<TextInput
  label="Password"
  isDisabled
  defaultValue="correct horse"
  prefix={<Icon name="lock" size="micro" />}
  suffix={
    <Button
      variation="transparent"
      shape="compact"
      size="tiny"
      aria-label="Show password"
    >
      <Icon name="visibility" size="micro" />
    </Button>
  }
/>
```

### Labels overflow

```tsx
import { TextInput } from "@talkdesk/cobalt-react-text-input"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Tag } from "@talkdesk/cobalt-react-tag"

<div style={{ width: 320 }}>
  <TextInput
    label="Label"
    secondaryLabel={
      <Text inline truncated>
        A secondary label long enough to be truncated
      </Text>
    }
    tertiaryLabel={<Tag color="light-gray" size="small">3/15</Tag>}
  />
</div>
```

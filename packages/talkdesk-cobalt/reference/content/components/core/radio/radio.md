# Radio

> **Cobalt core** component · `@talkdesk/cobalt-react-radio`

## Install (v1.1.6)

```sh
npm install @talkdesk/cobalt-react-radio
```

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-radio-docs--docs)

## Guidance

The Radio button lists are used to allow a user to select a single option from a list of visible options.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Variants

***Examples*** *illustrating a component’s named variation, states, and other dimensions like sizes, colors, content, etc, preferably paired with and rendered by code instead of presented via static images.*

#### Sizes

One fixed size

![Radio example — Variants Sizes](/assets/radio/variants-sizes.png)

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Theming

From a design system implementation, the Radio element/component variations will depend on the scoped context in which they are going to be used as this may affect sizing, color, and behavior as well. In parallel, a markup implementation should also be discussed within the team as this may affect how the component will be styled.

### Variants

Optionally, radios can have their own text hint under the radio label.

Radios must be grouped the same set of options under the same `name` attribute and link the `label` to the corresponding `id` of each radio to increase the clickable area.

### Guidelines

Much like checkboxes, radio is a visual and actionable element mean to represent and to allow a user to change a certain information/option/query's' state (but in this case making so that it holds a value, for a wrapping/surrounding radio-group, picked by the user). Similarly to checkboxes radio buttons should also be scoped within a form and furthermore in a radio group.

### Behavior

#### Internationalization

The radio element itself does not require special efforts when it comes to i18n implementation or concerns, but rather, the label either id/name-matching or surrounding them should have the appropriate copy alongside any specific description in the end-users language (either matching user-defined preferences or resorting to following the system-wide adopted language).

#### Spacing

![Radio example — Variants Spacings](/assets/radio/variants-spacings.png)

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Radio`

* [Radio](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=260%3A23948) — Cobalt Core Component

* [FormCheck](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=1087%3A347610) — Cobalt Core Component

* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/form-elements-checkboxes-radio-radio--checked) — Cobalt

* [V2](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/input--primary-story#radio) — Cobalt

### Group

To add a radio group, should be used the component FormCheck. The main guideline for this component is to **select the first option of the radio button by default**.

![Radio example — Group](/assets/radio/group.png)

📌 [Reading reference - Radio buttons: Always select one?](https://www.nngroup.com/articles/radio-buttons-default-selection/)

Radio buttons and checkboxes already have the required spacing to the right and to the bottom to allow creating groups of items.

You can just snap them together vertically or horizontally.

![Radio example — Group](/assets/radio/group-2.png)

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

* Radio buttons must all be labeled. Write clear, positive, active, concise, and distinct labels. The biggest usability problems for radio buttons come from labels that are vague, misleading, or describe options that are difficult to understand.
* Use sentence case.
* Avoid punctuation, unless you’re using more than one sentence.
* Avoid negative statements (e.g., *Don’t send me any emails*): the user shouldn’t have to select a radio button to make something not happen.
* Use *Select* to refer to the user’s action towards a radio button. Avoid words like *check*, *uncheck* or *click*, because they can be ambiguous.
* Make the button and the label clickable: a bigger target is faster to click.

**Do:** Use of "Select", sentence case and a write a clear and concise label.
![Do example](/assets/radio/do.png)

**Don't:** Avoid words like "click".
![Don't example](/assets/radio/dont.png)

### Accessibility

The attribute “value” is the unique value associated with each radio button. Although the value is not shown to the end-user, but is sent to the server on "submit" to identify which radio button value/option was selected.

Radio buttons must be used within a certain context (a form) and should either be sibling to a label with a matching name property or contained/wrapped by a label as this provides assistive tools with a better description of what the element is, what state of selection it represents at a given time.

As of this time there is no markup implementation on Cobalt V2 or suggested approach so, more granularly:

* The radio-button currently checked in a group or unchecked is identified using `aria-checked=“true”` and `aria-checked=“false”` respectively;
* Only one radio button can be selected at a time, all other radio buttons in a group should define `aria-checked=”false”`;
* The label for the radio group is defined using `aria-labelledby` attribute;
* `div` element with role `radio` has `onkeydown` event to support keyboard activation of the radio.
* `div` element with role `radio` has `tabindex="0"` to become part of the tab order of the page.
* Each radio has `tabindex="-1"` except one.
* The state of selection must be visually indicated (e.g. checked, unchecked). To ensure the visual state representation is visible when browsers or operating system use “High Contrast” settings by people with any type visual impairments; The visual representations must be implemented in CSS rather than through use of a background images. (as CSS background image techniques yield disappearing/non-usabe visual representations when browsers or operating systems are set to display high contrast themes/modes)
* `setRadioButton` function uses `aria-checked` attribute to make sure the information communicated to assistive technology is the same as the visual state. (e.g. `img` element)
* `onfocus` and `onblur` event handlers on `radio` support visual focus styling for keyboard only users.

## Props

### Radio

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `description` | ReactNode |  | no |  |  |
| `inputRef` | Ref<HTMLInputElement> |  | no |  | A ref for the HTML input element. |
| `value` | string |  | yes |  | The value of the radio button, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#Value). |
| `isDisabled` | boolean |  | no |  | Whether the radio button is disabled or not. Shows that a selection exists, but is not available in that circumstance. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |

### RadioGroup

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
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `orientation` | Orientation | `horizontal`, `vertical` | no |  | The axis the Radio Button(s) should align with. @default 'vertical' |
| `value` | string |  | no |  | The current value (controlled). |
| `defaultValue` | string |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: string) => void |  | no |  | Handler that is called when the value changes. |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `validate` | (value: string) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `children` | ReactNode |  | no |  |  |

## Examples

_13 of 13 compile against the published `@talkdesk/cobalt-react-radio@1.1.6` (React 18, TypeScript strict)._

### Default

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options">
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2">Option 2</Radio>
  <Radio value="option-3">Option 3</Radio>
</RadioGroup>
```

### Disabled

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options" isDisabled>
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2">Option 2</Radio>
</RadioGroup>
```

### Disabled option

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options">
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2" isDisabled>Option 2</Radio>
</RadioGroup>
```

### Horizontal

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options" orientation="horizontal">
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2">Option 2</Radio>
</RadioGroup>
```

### Required

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options" isRequired>
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2">Option 2</Radio>
</RadioGroup>
```

### With error message

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options" isInvalid errorMessage="Pick one of the options">
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2">Option 2</Radio>
</RadioGroup>
```

### With warning message

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options" warningMessage="This choice is uncommon">
  <Radio value="option-1">Option 1</Radio>
  <Radio value="option-2">Option 2</Radio>
</RadioGroup>
```

### With hint

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup label="Options" hint="Choose one of the options below">
  <Radio value="option-1" description="Description for option 1">
    Option 1
  </Radio>
  <Radio value="option-2" description="Description for option 2">
    Option 2
  </Radio>
</RadioGroup>
```

### With secondary label

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"
import { Text } from "@talkdesk/cobalt-react-typography"

<RadioGroup
  label="Choose"
  secondaryLabel={<Text inline>Optional</Text>}
>
  <Radio value="a">Option 1</Radio>
  <Radio value="b">Option 2</Radio>
</RadioGroup>
```

### With tertiary label

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"
import { Text } from "@talkdesk/cobalt-react-typography"

<RadioGroup
  label="Choose"
  tertiaryLabel={<Text inline>Tertiary Label</Text>}
>
  <Radio value="a">Option 1</Radio>
  <Radio value="b">Option 2</Radio>
</RadioGroup>
```

### With group description

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"

<RadioGroup
  label="Choose"
  description="Shown on your public profile"
>
  <Radio value="a">Option 1</Radio>
  <Radio value="b">Option 2</Radio>
</RadioGroup>
```

### With all labels

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"

<RadioGroup
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
>
  <Radio value="a">Option 1</Radio>
  <Radio value="b">Option 2</Radio>
</RadioGroup>
```

### Labels overflow

```tsx
import { Radio, RadioGroup } from "@talkdesk/cobalt-react-radio"
import { Text } from "@talkdesk/cobalt-react-typography"

<div style={{ width: 320 }}>
  <RadioGroup
    label="Label"
    secondaryLabel={
      <Text inline truncated>
        A secondary label long enough to be truncated
      </Text>
    }
    tertiaryLabel={<Text inline>Tertiary Label</Text>}
  >
    <Radio value="a">Option 1</Radio>
    <Radio value="b">Option 2</Radio>
  </RadioGroup>
</div>
```

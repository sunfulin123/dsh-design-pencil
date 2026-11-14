# Checkbox

> **Cobalt core** component · `@talkdesk/cobalt-react-checkbox`

## Install (v1.1.6)

```sh
npm install @talkdesk/cobalt-react-checkbox
```

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-checkbox-docs--docs)

## Known gaps

Read before using it:

* A Checkbox with no visible label (only aria-label, as in a table's selection column) collapses to 0px height, so its box sits off-centre in the row. Give it a box: wrap it in a flex container with min-height: 20px (as the List View recipe does).

## Guidance

Checkboxes are used to allow users to select any number of options, simultaneously.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Variants

***Examples*** *illustrating a component’s named variation, states, and other dimensions like sizes, colors, content, etc, preferably paired with and rendered by code instead of presented via static images.*

#### Sizes

One size variation

![Checkbox example — Variants Sizes](/assets/checkbox/variants-sizes.png)

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Theming

From a design system implementation, the Checkbox element/component variations will depend on the scoped context in which they are going to be used as this may affect sizing, color, and behavior as well. In parallel, a markup implementation should also be discussed within the team as this may affect how the component will be styled.

### Variants

Optionally, checkboxes can have their own text hint under the checkbox label.

Checkboxes must be grouped the same set of options under the same `name` attribute and link the `label` to the corresponding `id` of each checkbox to increase the clickable area.

### Guidelines

Checkboxes are a visual and actionable element mean to represent and to allow a user to change a certain information/option/query's' state (checked, unchecked or even mixed). As opposed to toggles (which in our implementation should roughly equate to a switch), checkboxes are form-contained controls and are able to represent both visually and value-wise more than two states.

### Behavior

#### Internationalization

When it comes to i18n concerns the checkbox element itself does not require any special attention, but instead, the label either next to it (id-matching) or surrounding it should have the appropriate copy alongside with any specific description in the end-users language (either matching user-defined preferences or resorting to following the system-wide adopted language).

#### Spacing

![Checkbox example — Variants Spacings](/assets/checkbox/variants-spacings.png)

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Checkbox`

For ease of reading, follow all the specifications for the checkbox component from the base to all variations inherent in it.

* [Checkbox](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=192%3A14874) — Cobalt Core Component

* [FormCheck](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=1087%3A347610) — Cobalt Core Component

* [FormCheck](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/react-form-check/1.0.0/docs/index.html?path=/docs/formcheck--main) — Marketplace

* [V1 Storybook](https://talkdesk.github.io/cobalt-react-components/?path=/story/form-elements-checkboxes-radio-checkbox--default) — Cobalt

### Group

To add a checkbox group, should be used the component FormCheck.

![Checkbox example — Group](/assets/checkbox/group.png)

Radio buttons and checkboxes already have the required spacing to the right and to the bottom to allow creating groups of items.

You can just snap them together vertically or horizontally.

![Checkbox example — Group](/assets/checkbox/group-2.png)

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

* Checkboxes must all be labeled. Write clear, positive, active, concise, and distinct labels. The biggest usability problems for checkboxes and radio buttons come from labels that are vague, misleading, or describe options that are difficult to understand.
* Use sentence case.
* Avoid punctuation, unless you’re using more than one sentence.
* Avoid negative statements (e.g., *Don’t send me any emails*): the user shouldn’t have to check a box to make something not happen. **Exception:** negative phrasing can make sense for checkboxes referring to repeated messages (e.g., *Don't show this message again*).
* If there's more than option available, use *Select* to refer to the user’s action towards a checkbox. Avoid words like *check*, *uncheck* or *click*, because they can be ambiguous.
* Place labels to the right side of checkboxes. **Exception:** for RTL (Right-to-Left) languages, such as Arabic and Hebrew, labels should appear to the left of checkboxes.
* Make the checkbox and the label clickable: a bigger target is faster to click.

**Do:** Use positive statements.
![Do example](/assets/checkbox/do.png)

**Don't:** Avoid negative statements.
![Don't example](/assets/checkbox/dont.png)

### Accessibility

As mentioned above checkboxes are meant to be used within a certain context (a form) and should either be a sibling to a label with a matching ID property or contained/wrapped by a label as this provides assistive tools with a better description of what the element is, what states it can cycle through, what state the element is representing in any given time.

It is still not clear at this time if we are going to resort to a styled approach to the native implementation of a checkbox but if not we must expose the element as having a checkbox role in the operating system's accessibility API and When the aria-checked value changes, fire an accessible state changed event.

More granularly:

* The checkbox element must have a checkbox role.
* The checkbox must have an accessible label provided by one of the following:
  * Visible text content contained within the element with role checkbox;
  * A visible label referenced by the value set by aria-labelledby on the element with role checkbox;
  * aria-label set on the element with role checkbox.
* When checked, the checkbox element has state aria-checked set to true;
* When not checked, it has state aria-checked set to false;
* When “partially” checked, the state aria-checked is set to mixed;
* A set of checkboxes is to be represented as a logical group with a visible label, the checkboxes are included in a wrapping element/container with role group that has the property aria-labelledby set to the ID of the element containing the label.

## Props

### Checkbox

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `description` | ReactNode |  | no |  |  |
| `inputRef` | Ref<HTMLInputElement> |  | no |  | A ref for the HTML input element. |
| `isIndeterminate` | boolean |  | no |  | Indeterminism is presentational only. The indeterminate visual representation remains regardless of user interaction. |
| `value` | string |  | no |  | The value of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefvalue). |
| `defaultSelected` | boolean |  | no |  | Whether the element should be selected (uncontrolled). |
| `isSelected` | boolean |  | no |  | Whether the element should be selected (controlled). |
| `onChange` | (isSelected: boolean) => void |  | no |  | Handler that is called when the element's selection state changes. |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `validate` | (value: boolean) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |

### CheckboxGroup

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
| `orientation` | enum | `vertical`, `horizontal` | no | vertical |  |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `value` | string[] |  | no |  | The current value (controlled). |
| `defaultValue` | string[] |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: string[]) => void |  | no |  | Handler that is called when the value changes. |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `validate` | (value: string[]) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `children` | ReactNode |  | no |  |  |

## Examples

_18 of 18 compile against the published `@talkdesk/cobalt-react-checkbox@1.1.6` (React 18, TypeScript strict)._

### Default

```tsx
import { Checkbox } from "@talkdesk/cobalt-react-checkbox"

<Checkbox>Value</Checkbox>
```

### Selected

```tsx
import { Checkbox } from "@talkdesk/cobalt-react-checkbox"

<Checkbox isSelected>Value</Checkbox>
```

### Disabled

```tsx
import { Checkbox } from "@talkdesk/cobalt-react-checkbox"

<Checkbox isDisabled>Value</Checkbox>
```

### Indeterminate

```tsx
import { Checkbox } from "@talkdesk/cobalt-react-checkbox"

<Checkbox isIndeterminate>Value</Checkbox>
```

### With description

```tsx
import { Checkbox } from "@talkdesk/cobalt-react-checkbox"

<Checkbox description="Description">Value</Checkbox>
```

### Group default

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options">
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2">Option 2</Checkbox>
  <Checkbox value="option-3">Option 3</Checkbox>
</CheckboxGroup>
```

### Group disabled

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options" isDisabled>
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2">Option 2</Checkbox>
</CheckboxGroup>
```

### Group disabled option

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options">
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2" isDisabled>Option 2</Checkbox>
</CheckboxGroup>
```

### Group horizontal

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options" orientation="horizontal">
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2">Option 2</Checkbox>
</CheckboxGroup>
```

### Group required

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options" isRequired>
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2">Option 2</Checkbox>
</CheckboxGroup>
```

### Group with error message

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options" isInvalid errorMessage="Pick at least one">
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2">Option 2</Checkbox>
</CheckboxGroup>
```

### Group with warning message

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options" warningMessage="Selecting all is unusual">
  <Checkbox value="option-1">Option 1</Checkbox>
  <Checkbox value="option-2">Option 2</Checkbox>
</CheckboxGroup>
```

### Group with hint

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup label="Options" hint="Choose any of the options below">
  <Checkbox value="option-1" description="Description for option 1">
    Option 1
  </Checkbox>
  <Checkbox value="option-2" description="Description for option 2">
    Option 2
  </Checkbox>
</CheckboxGroup>
```

### With secondary label

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"
import { Text } from "@talkdesk/cobalt-react-typography"

<CheckboxGroup
  label="Choose"
  secondaryLabel={<Text inline>Optional</Text>}
>
  <Checkbox value="a">Option 1</Checkbox>
  <Checkbox value="b">Option 2</Checkbox>
</CheckboxGroup>
```

### With tertiary label

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"
import { Text } from "@talkdesk/cobalt-react-typography"

<CheckboxGroup
  label="Choose"
  tertiaryLabel={<Text inline>Tertiary Label</Text>}
>
  <Checkbox value="a">Option 1</Checkbox>
  <Checkbox value="b">Option 2</Checkbox>
</CheckboxGroup>
```

### With group description

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"

<CheckboxGroup
  label="Choose"
  description="Shown on your public profile"
>
  <Checkbox value="a">Option 1</Checkbox>
  <Checkbox value="b">Option 2</Checkbox>
</CheckboxGroup>
```

### With all labels

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"

<CheckboxGroup
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
  <Checkbox value="a">Option 1</Checkbox>
  <Checkbox value="b">Option 2</Checkbox>
</CheckboxGroup>
```

### Labels overflow

```tsx
import { Checkbox, CheckboxGroup } from "@talkdesk/cobalt-react-checkbox"
import { Text } from "@talkdesk/cobalt-react-typography"

<div style={{ width: 320 }}>
  <CheckboxGroup
    label="Label"
    secondaryLabel={
      <Text inline truncated>
        A secondary label long enough to be truncated
      </Text>
    }
    tertiaryLabel={<Text inline>Tertiary Label</Text>}
  >
    <Checkbox value="a">Option 1</Checkbox>
    <Checkbox value="b">Option 2</Checkbox>
  </CheckboxGroup>
</div>
```

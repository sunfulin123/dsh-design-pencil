# Textarea

> **Cobalt core** component · `@talkdesk/cobalt-react-textarea`

## Install (v3.1.2)

```sh
npm install @talkdesk/cobalt-react-textarea
```

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-textarea-docs--docs)

## Guidance

A text area is a large text input form field that can be used to add multiple lines of text.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Variants

#### Medium

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Small

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Theming

*Describe the rules related to colors, shapes or others, that may be affected when changing the theme*

#### Size

Textarea can accept the modifiers to **Size** them. will be used only one size (**small**), please take a look at the specs above ☝️

### Guidelines

The text area input, much like the regular text input (input type=”text”) defines an unless developer specified, input that will hold an unlimited number of user-inputted characters, regardless of the “visual” size defined in a multi-line presentation.

Its size is defined by the cols and rows attributes, or via the width and height CSS properties.

### Behavior

#### Internationalization

No special steps are needed to be extended to the textarea component/element when dealing with i18n concerns apart from its text direction through the `dir` attribute (which can be `ltr` or `rtl`)  and defined by the end-users (apps). Furthermore, the only concern is to address the copy of the label wrapping the textarea component/element and again this is a concern passed on to the apps.

### Resources

|                      | **Medium**                                                                                                  | **Small** |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | --------- |
| Min height           | `40px`                                                                                                      | `32px`    |
| Width                | `100%`                                                                                                      |           |
| Font size            | `14px`                                                                                                      | `12px`    |
| Font weight          | `400`                                                                                                       |           |
| Color                | `basic-800`                                                                                                 |           |
| Background color     | `basic-000`                                                                                                 |           |
| Padding              | `12px`                                                                                                      | `8px`     |
| Border radius        | `4px`                                                                                                       |           |
| Border width / style | `2px solid`                                                                                                 |           |
| Border color         | `basic-400`                                                                                                 |           |
| Resize               | `vertical`                                                                                                  |           |
| box sizing           | `border-box`                                                                                                |           |
| Outline              | `none`                                                                                                      |           |
| Transition           | `transition-property: box-shadow, border; ``transition-duration: 0.2s; ``transition-timing-function: ease;` |           |
|                      | `touch-action: manipulation;`                                                                               |           |

Textareas are fully available in Figma under `Cobalt Design System > Cobalt Core Components > Form Elements > Textarea`

* [Textarea](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Cobalt-Core-Components?node-id=289%3A12204) — Cobalt component

#### Modifiers

A text area can hold an unlimited number of characters, to set the size of the text area, just use the rows attribute. A placeholder text can also be added using the placeholder attribute.

```html
<textarea id="text1" rows="5" placeholder="Write something here"></textarea>
```

### Placeholder

Form Textarea placeholder attributes are helpful for providing hints to (sighted) users in forms. Often times, due to design decisions, a placeholder is used to replace a more semantic label element. Unfortunately, accessible placeholder browser support isn’t complete and placeholders often lack sufficient color contrast by default.

Read more: [https://a11yproject.com/posts/placeholder-input-elements/](https://a11yproject.com/posts/placeholder-input-elements/)

| **Font weight** | `400`       |
| --------------- | ----------- |
| **Color**       | `basic-500` |

![Placeholder state, medium size](/assets/textarea/state-medium-placeholder.png)

### Disabled

| ☢️ | To avoid remove pointer events, make sure that status (eg.Hover,…) will be applied with CSS pseudo-class:not(\[disabled]). You can see an example being used in Button component styles. |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

The `disabled` and `readonly` attributes have similar effects — in fact, they look the same from the user's perspective.

In both cases, what the user sees is a field that is slightly “**grayed out**” over opacity, which cannot be clicked on or edited.

Read more: [https://html.com/attributes/input-disabled/#ixzz6D5h6B1gv](https://html.com/attributes/input-disabled/#ixzz6D5h6B1gv)

|                  | Disabled                  | Read-only   |
| ---------------- | ------------------------- | ----------- |
| Cursor           | not-allowed               | not-allowed |
| Background color | `basic-200`               | `basic-200` |
| Label color      | `basic-800 (opacity 40%)` | `basic-800` |
| Border color     | `basic-300`               | `basic-500` |

![Disabled state, medium size](/assets/textarea/state-medium-disabled.png)
*Disabled*

![Read-only state, medium size](/assets/textarea/state-medium-readonly.png)
*Read-only*

### Status color

| Border wolor | `error-700` | `warning-700` |
| ------------ | ----------- | ------------- |
| Border width | `2px`       | `2px`         |

![Error state, medium size](/assets/textarea/state-medium-error.png)
*Error*

  ![Warning state, medium size](/assets/textarea/state-medium-warning.png)
*Warning*

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

* Use a combination of a concise label and supportive helper text for clarification of the field input. Don’t rely solely on placeholder text as it is not visible at all times.
* Use a concise label to indicate what information goes in the text area input. For example, if the text area appears in a modal called *Create component*, the label for a description text area should only say *Description* and not repeat the modal’s title.
* Place helper text above the text input (below the area label) if it is necessary to understand the field.
* If appropriate, you can have pre-filled information in the text input. (see image 1).

**Do:** Label and helper text clarify what the user needs to do/know. The pre-filled information in the text area expedites the user's work.
![Do example](/assets/textarea/content-do-prefilled.png)

**Don't:** Don't rely solely on placeholders.
![Don't example](/assets/textarea/content-dont-placeholder-only.png)

#### Placeholder text

In general, placeholder text should only be used if it adds value. In recurrent tasks it’s particularly important to have this in mind to prevent cognitive overload.

**Note:** Do not use a placeholder as the label of the field.

**Do:** When appropriate, help users to know what is expected of them, by giving examples.
![Do example](/assets/textarea/content-do-example.png)

**Don't:** Do not add extra text just to fill space.
![Don't example](/assets/textarea/content-dont-extra-text.png)

![Do example](/assets/textarea/content-do-blank.png)
*Do*
Leave it blank if the label is self-explanatory.

### Accessibility

* Keep it simple - not all browsers correctly expose multiple labels that are linked to the same form element.
* Use labels for every textarea and make the `for=""` and i`d=""` values match. IDs must be unique on each page, only one label can be associated with each unique form element.
* Make required fields obvious by using an indicator - border color change, asterisk, description text, etc.
* Fields with error validation should have `aria-describedby` to insure that the associated field-level error message is read by assistive technology. If the error message has an `id="my-error-message"`, then the input should have `aria-describedby="my-error-message"`.
* Similarly to other inputs the textarea must either be wrapped in a label with matching (and unique) `for=”...”` and `id=”...”` attribute pairs.
* If resorting to a non textarea native tag to implement this behaviour the `role=”textbox”` is used on the container and some other attributes should be set to ensure that all users can interact properly with this component/element like `aria-multiline=”true”`, for example.

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
| `textareaRef` | Ref<HTMLTextAreaElement> |  | no |  |  |
| `size` | enum | `small`, `medium` | no |  |  |
| `isResizable` | boolean |  | no | true |  |
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
| `type` | "search" \| "text" \| "url" \| "tel" \| "email" \| "password" \| (string & {}) |  | no |  | The type of input to render. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdeftype). @default 'text' |
| `inputMode` | "search" \| "text" \| "url" \| "tel" \| "email" \| "none" \| "numeric" \| "decimal" | `search`, `text`, `url`, `tel`, `email`, `none`, `numeric`, `decimal` | no |  | Hints at the type of data that might be entered by the user while editing the element or its contents. See [MDN](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute). |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

## Examples

_18 of 18 compile against the published `@talkdesk/cobalt-react-textarea@3.1.2` (React 18, TypeScript strict)._

### Default

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" />
```

### Controlled

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

const [value, setValue] = useState("");

<Textarea label="Comment" value={value} onChange={setValue} />
```

### With hint

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea
  label="Comment"
  hint="Visible to everyone on this ticket"
/>
```

### Sizes

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Small" size="small" />
<Textarea label="Medium" size="medium" />
```

### Required

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" isRequired />
```

### Invalid

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" isInvalid />
```

### With error message

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea
  label="Comment"
  isInvalid
  errorMessage="Enter a comment before submitting"
/>
```

### With warning message

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea
  label="Comment"
  warningMessage="This comment looks empty"
/>
```

### Disabled

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" defaultValue="Read-only value" isDisabled />
```

### Read only

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" defaultValue="Read-only value" isReadOnly />
```

### Non resizable

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" isResizable={false} />
```

### Rows

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" rows={6} />
```

### With character count

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"
import { Text } from "@talkdesk/cobalt-react-typography"

<Textarea
  label="Comment"
  tertiaryLabel={<Text inline>Optional</Text>}
  maxLength={500}
/>
```

### With secondary label

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"
import { Text } from "@talkdesk/cobalt-react-typography"

<Textarea label="Comment" secondaryLabel={<Text inline>Optional</Text>} />
```

### With tertiary label

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"
import { Tag } from "@talkdesk/cobalt-react-tag"

<Textarea
  label="Comment"
  tertiaryLabel={<Tag color="light-gray" size="small">Draft</Tag>}
/>
```

### With description

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"

<Textarea label="Comment" description="Shared with your whole team" />
```

### With all labels

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"
import { Tag } from "@talkdesk/cobalt-react-tag"

<Textarea
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
      <Tag color="light-gray" size="small">Draft</Tag>
    </>
  }
  description="Description"
  hint="Form hint"
/>
```

### Labels overflow

```tsx
import { Textarea } from "@talkdesk/cobalt-react-textarea"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Tag } from "@talkdesk/cobalt-react-tag"

<div style={{ width: 320 }}>
  <Textarea
    label="Label"
    secondaryLabel={
      <Text inline truncated>
        A secondary label long enough to be truncated
      </Text>
    }
    tertiaryLabel={<Tag color="light-gray" size="small">Draft</Tag>}
  />
</div>
```

# Input

> **Cobalt core** component · `@talkdesk/cobalt-react-input`
>
> Extended in Cobalt Marketplace by [SearchInput](../../../components/marketplace/search-input/search-input.md) (`@talkdesk/cobalt-marketplace-react-search-input`), built on this package.

## Install (v2.3.6)

```sh
npm install @talkdesk/cobalt-react-input
```

```tsx
import Input from "@talkdesk/cobalt-react-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-input-docs--docs)

## Guidance

Text inputs enable the user to interact with and input content and data, let users enter and edit text. This component can be used for form entries.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

Text fields are used to allow users to input and edit text. There may be data validation (ex. confirming proper email format), but otherwise, users are free to type any combination of letters, numbers, & symbols.

![Input anatomy: label, placeholder text, input area, hint text](/assets/input/anatomy.png)

1. **Label:** Should show what sort of information the field requires and is left-aligned directly above the input area.
2. **Placeholder text:** Let people know how they should use the field, for example, “Start typing to see names.”
3. **Input area:** This is where people enter text.
4. **Hint text:** Gives context about a field's input.

### Variants

#### Text

The text variant is a single-line text field for generic text.

![Text input variation](/assets/input/variation-text.png)

#### Number

Input field designed to accept numerical input. Launches the numerical keyboard on mobile devices.

![Number input variation](/assets/input/variation-number.png)

#### Max

Text inputs can be set with a maximum character limit.

Inline validation can also be set to alert the user and clarify the request.

**Recommendations**

Give subtle feedback when the user has got enough characters and let users know that they have written too much, by using a chip with the number of characters inserted and the maximum character limit.

![Max character limit input with counter chip](/assets/input/variation-max.png)

#### Password

The password input is a single-line text field whose value is obscured, used when you need to protect the user's content from being read.

**Recommendations**

* Show the password requirements and make sure the user can see them before interacting, to reduce friction when creating a password.
* Allow the user to see the password they are typing by adding the eye icon as a toggle to display or hide the password. By default, keep the password hidden.
* Passwords that don’t meet the criteria should use error messages to help the user correct their input.

![Input example — Variants Password](/assets/input/variants-password.png)

#### Search

![Search input variation](/assets/input/variation-search.png)

For the search field's full guidance, see [SearchInput](/components/core/search-input/).

#### Email

Email input is a text input that allows a user to specifically enter an email address.

![Email input variation](/assets/input/variation-email.png)

#### InputGroup

Icons can be added before the text field to clarify an action and call attention to a button.

![Input group with leading icons](/assets/input/variation-inputgroup.png)

##### Currency

When an input has an associated currency it should be used with the `InputGroup` component.

![Currency input using InputGroup](/assets/input/variation-currency.png)

#### With supporting content

An input label should make it clear what the user should enter into the field. For legibility, keep the label short and limit it to a few words.

* The input label needs to help the user understand what is expected of them, but it doesn't need to be instructive
* Labels are placed above the input text field
* Labels are to be written in sentence case and should only be 1-3 words long

##### Label with description

![Input with label and description](/assets/input/supporting-label-description.png)

##### Hint text

Hint text can be added below an input field in order to better clarify how the user should answer.

![Password input with show/hide toggle](/assets/input/variation-password.png)

##### Placeholder

Placeholder text is shown inside the text input to help users know what information they can enter.

* Field placeholder text is used for supplementary information
* The text should be written as examples instead of instructions
* Placeholder text disappears after the user begins entering data into the input and should not contain crucial information.

**Do:** 
![Do example](/assets/input/variation-email.png)

**Don't:** 
![Don't example](/assets/input/supporting-placeholder.png)

Putting instructions on how to complete an input, requirements, or any other essential information into placeholder text is not accessible. Once a value is entered, this text is no longer viewable; if someone is using an automatic form filler, they will never get the information in the placeholder text.

#### Right-aligned numeric fields

Left-aligned text input should be your default choice, however, is also available right-aligned text input to use in specific circumstances:

* Right-aligned text input could be used for numeric inputs.
* Right-aligned text input should be used when multiple numeric fields need to be compare.

![Right-aligned numeric fields in a list](/assets/input/right-aligned-numeric.png)

#### Sizes

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

An input’s state depends on the interaction itself or a submission error.

##### Default

The default form of a text field.

![Default state](/assets/input/state-default.png)

##### Placeholder and active-placeholder

Placeholder text (if used) remains until user types

![Placeholder state](/assets/input/state-placeholder.png)
*Input placeholder*

  ![Input example — States Placeholder and Active-placeholder: Input Active-placeholder](/assets/input/active-placeholder-input-active-placeholder.png)
*Input Active-placeholder*

##### Active typing

![Active typing state](/assets/input/state-active.png)

##### Disabled

A disabled text input shows that the user cannot interact with the text field. This can maintain layout continuity and communicate that a field may become available later.

![Disabled state](/assets/input/state-disabled.png)

##### Read-only

Text inputs have a read-only option for when the content in the disabled state still needs to be shown. This allows for content to be copied, but not interacted with or changed.

![Read-only state](/assets/input/state-readonly.png)

##### Required or optional

Text fields can be marked as optional or required, depending on the situation.

Required shows that the user must specify a value for the input before the form can be submitted. Optional text inputs have no sign at all.

![Required state](/assets/input/state-required.png)
*Input Required*

##### Focused

The focused variation is used to highlight an element that has focus applied. This provide more visibility when an input gets focus.

![Focused state](/assets/input/state-focused.png)

#### On dark

![Input example — On dark](/assets/input/on-dark.png)

### Behavior

#### Validation

##### States

Text Inputs use inline validation. The error displays under the field and the expected behavior in most cases is to avoid showing the error until the user has finished with the field and moved to the next field.

![Input example — Validation States: Input error placeholder](/assets/input/states-input-error-placeholder.png)
*Input error placeholder*

  ![Input with inline error validation](/assets/input/validation-error.png)
*Input error - inline validation*
Inline errors should be presented with copy explaining the issue and how to fix it.

![Input with warning validation](/assets/input/validation-warning.png)
*Input warning*

  ![Input example — Validation States: Input warning placeholder](/assets/input/states-input-warning-placeholder.png)
*Input warning placeholder*

##### Wait to validate

Only show error validation messages, or styling after a user has interacted with a particular field.

**Do:** 
![Do example](/assets/input/validation-wait-to-validate-do.png)

**Don't:** 
![Don't example](/assets/input/validation-wait-to-validate-dont.png)

#### Previous search

When the user searches and accesses a detail page and then comes back, it should go back to the immediately previous action/page that the user was on and not reset by the initial state to maintain a consistent experience regardless of context and based on the user journey.

![Input example — Behavior Previous search](/assets/input/behavior-previous-search.png)

If the user goes to a different page with the search results, it also should go to the previous search performed.

#### Length of the input

The length of the text input provides a hint to users how much text to write. Do not require users to write paragraphs of text into a single-line input box; use a text area instead.

**Do:** 
![Do example](/assets/input/behavior-length-of-the-input-do.png)

**Don't:** 
![Don't example](/assets/input/behavior-length-of-the-input-dont.png)

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Form Elements > Input`

* [Input component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Cobalt-Core-Components?node-id=260%3A25717) — Core component library

* [Input](https://talkdesk.atlassian.net/wiki/spaces/COB/pages/1835860207/Input) — Cobalt documentation

* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/form-elements-form-field--default) — Cobalt

### Code

### Props

### Examples

### Content

* Use a combination of a concise label and supportive helper text for clarification of the field input. Don’t rely solely on placeholder text as it is not visible at all times.
* Use a concise label to indicate what information goes in the text area input. For example, if the text area appears in a modal called *Create component*, the label for a description text area should only say *Description* and not repeat the modal’s title.
* Place helper text above the text input (below the area label) if it is necessary to understand the field.
* If appropriate, you can have pre-filled information in the text input. (see image 1).

**Do:** Label and helper text clarify what the user needs to do/know. The pre-filled information in the text area expedites the user's work.
![Do example](/assets/input/do.png)

**Don't:** Don't rely solely on placeholders.
![Don't example](/assets/input/dont.png)

#### Include a label

Labels must be must be meaningful and always visible when possible.

* Provide a label that describes the purpose of each field

**Do:** 
![Do example](/assets/input/include-a-label-do.png)

**Don't:** 
![Don't example](/assets/input/include-a-label-dont.png)

* Provide a label that explicitly describes the information expected in the field

**Do:** 
![Do example](/assets/input/include-a-label-do-2.png)

**Don't:** 
![Don't example](/assets/input/include-a-label-dont-2.png)

#### Placeholder text

In general, placeholder text should only be used if it adds value. In recurrent tasks, it’s particularly important to have this in mind to prevent cognitive overload.

Help text can show hints and requirements. The help text’s message should not simply restate the same information in the label in order to prompt someone to interact with it.

**Note:** Do not use a placeholder as the label of the field.

**Do:** When appropriate, help users to know what is expected of them, by giving examples.
![Do example](/assets/input/include-a-label-placeholder-text-do.png)

**Don't:** Do not add extra text just to fill space.
![Don't example](/assets/input/include-a-label-placeholder-text-dont.png)

**Do:** 
![Do example](/assets/input/include-a-label-placeholder-text-do-2.png)

**Don't:** 
![Don't example](/assets/input/include-a-label-placeholder-text-dont-2.png)

![Do example](/assets/input/include-a-label-placeholder-text-do-3.png)
*Do*
Leave it blank if the label is self-explanatory.

#### Search fields

Placeholder copy in search fields should not include ellipsis (exception: *Jump to...*) or other ending punctuation and it should help users to know **everything** they can search for whenever there is enough space. Do not truncate text.

**Do:** Be specific.
![Do example](/assets/input/include-a-label-search-fields-do.png)

**Don't:** Don't use ellipsis.
![Don't example](/assets/input/include-a-label-search-fields-dont.png)

**Do:** “Search” (If there is no space for more information or if it's absolutely obvious what the user can search for).
![Do example](/assets/input/include-a-label-search-fields-do-2.png)

**Don't:** “Search…”
![Don't example](/assets/input/include-a-label-search-fields-dont-2.png)

**Do:** When possible we should make it clear what user the can search for.
![Do example](/assets/input/include-a-label-search-fields-do-3.png)

**Don't:** The word “search” without a preposition means we are searching a specific area for something in particular. E.g., “I searched the office (for my laptop)”.
![Don't example](/assets/input/include-a-label-search-fields-dont-3.png)

### Accessibility

### Considerations

#### Design

* [1.3.5 Identify Input Purpose AA](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose)
* [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)
* [3.3.2 Labels or Instructions A](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions)
* [2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html)
* [4.1.2 Name, Role, Value A](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value)

#### Development

In order for users to know how to fill out a form, the form has to be accessible. Users may not be able to fill out form fields correctly if the visible label is not programmatically associated with its field.

For assistive technologies like screen readers to interact with and render messages to users, messages need to be composed using programmatically determinable text: either actual text or text available through alternatives such as `alt`, `aria-label`, `aria-labelledby`, and `aria-describedby`.

Key concepts include:

* Labels for form inputs
* Instructions and hints, where necessary
* Error prevention
* Form validation
* Keyboard support

##### Provide a valid label

All form inputs and controls need to have a label — a label that is understandable by all users whether the user can see the page or not.

* Labels must be in proximity to their control.
* Ensure form field constraints and errors are associated with their corresponding field

**Labels must be programmatically associated with their control**

There is a hierarchy of methods for providing an accessible name for an input:

**\<label>** — Typically label and form fields need to be explicitly programmatically associated which is commonly done by providing a "for" attribute on the \<label> element with its value set to the input's id value or by providing another mechanism that specifies an accessible name.

**HTML Example**

```html
<label for="fname_a">First Name:</label> 
<input type="text" name="fname_a" id="fname_a">
```

**aria-labelledby** — Other alternative is to use the aria-labelledby attribute, assistive technologies will use the associated text (referenced by ID) as the accessible name.

**HTML Example**

```html
<span id="Nickname">Nickname:</span> <input type="text" aria-labelledby="Nickname">
```

**aria-label** — The `aria-label` text will be used as the accessible name if there is no `aria-labelledby` reference. Note that the `aria-label` text is completely invisible. It is useful only to screen reader users, so it is not appropriate in most circumstances.

* When there isn't a visible label and we need to use an aria-label property, it's important to provide an informative text for a screen reader user to understand.

**Example**

In the search input, there is no label, so we use the **aria-label property, and this should be informative, as we can see below**.

![Input example — Best practices Provide a valid label](/assets/input/best-practices-provide-a-valid-label.png)

```html
<input type="text" aria-label="Search for name, number, email or company" placeholder="Search for name, number, email or company...">
```

##### Avoid the use of placeholder values to label or explain the input

A `placeholder` attribute should not be used as a label, is a short hint intended to aid the user with data entry.

The placeholder may not be available to assistive technology and thus may not be relied upon to convey an accessible name or description.

**Do:** 
![Do example](/assets/input/best-practices-avoid-the-use-of.png)

**Don't:** 
![Don't example](/assets/input/best-practices-avoid-the-use-of-2.png)

##### Validation

In order for assistive technologies like screen readers to access error messages, error messages either need to be composed as actual (real) text or text must be provided through an alternative like `alt`, `aria-label`, `aria-labelledby`, and `aria-describedby`. Without programmatically determinable text, it would be near impossible for assistive technologies to be able to render error messages to users.

Some things to consider for input validation based on the guidelines are:

* **Set invalid fields to** `aria-invalid="true"`
* **Ensure an error is clearly identified**, e.g. "Error: First name is required"
* **Ensure error messages are associated with form fields** using `aria-describedby` so that screen reader users know how to fix the problem.
* **Ensure error/success message container is set to** `tabindex="-1"`**.** Otherwise, focus cannot be set successfully, when form is submitted.
* **Ensure error messages are adjacent to the inputs** so that screen magnification users can easily see which messages belong to which fields.
* **Error feedback must be meaningful.** Error messages should be clear, accurate, and provide actionable information that allows users to fix the error properly. Give users correction cues within the error messages for specific form inputs, buttons, or other controls.

![Input example — Best practices Validation](/assets/input/best-practices-validation.png)

```html
<label for="fname">First Name *</label>
<input type="text" id="fname" aria-invalid="true" aria-describedby="fname_error" required />
<span id="fname_error">First name is required.</span>
```

##### Keyboard

###### Data entry

Use the keyboard intended for the type of data entry, as the numeric keyboard when entering a phone number, or the alphanumeric keyboard when entering an email address.

###### Focus order

A web page’s focus order must preserve a page’s meaning and promote ease of use.

Focus proceeds through all items according to their source order in the DOM. Elements with `tabindex="0"` will occur according to their place within the DOM.

![Input example — Keyboard Focus order: Input - Focus order](/assets/input/order-input-focus-order.png)
*Input - Focus order*
The order that elements appear in the document source should reflect the order they appear visually.

##### Search fields

See [SearchInput](/components/core/search-input/) for the search field's accessibility.

## Props

_Also accepts the standard `Omit<
  InputHTMLAttributes<InputType>,
  "type" | "size" | "defaultValue" | "defaultChecked"
>` attributes._

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `noArrows` | boolean |  | no |  |  |
| `size` | enum | `small`, `medium` | no | medium |  |
| `textAlign` | enum | `left`, `center`, `right` | no | left |  |
| `type` | enum | `number`, `color`, `text`, `search`, `email`, `password`, `tel`, `url`, `checkbox`, `radio` | no | text |  |
| `variation` | enum | `error`, `warning`, `unstyled` | no |  |  |
| `forwardedRef` | Ref<HTMLInputElement> |  | no |  |  |

## Examples

_7 of 9 compile against the published `@talkdesk/cobalt-react-input@2.3.6` (React 18, TypeScript strict)._

### Default

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input value={...} onChange={...}/>
```

### Types

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input type="text" value={...} onChange={...}/>
<Input type="email" value={...} onChange={...}/>
<Input type="number" value={...} onChange={...}/>
<Input type="number" noArrows value={...} onChange={...}/>
<Input type="tel" value={...} onChange={...}/>
<Input type="url" value={...} onChange={...}/>
<Input type="password" value={...} onChange={...}/>
<Input type="checkbox" value={...} onChange={...}/>
<Input type="radio" value={...} onChange={...}/>
```

### Sizes

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input size="small" value={...} onChange={...}/>
<Input size="medium" value={...} onChange={...}/>
```

### Variations

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input variation="warning" value={...} onChange={...}/>
<Input variation="error" value={...} onChange={...}/>
<Input variation="unstyled" value={...} onChange={...}/>
```

### Alignments

> **Doesn't compile:** the published types reject it: Type '{ textAlignt: string; value: any; onChange: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input textAlignt="left" value={...} onChange={...}/>
<Input textAlignt="center" value={...} onChange={...}/>
<Input textAlignt="right" value={...} onChange={...}/>
```

### Read only

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input readOnly value={...} onChange={...}/>
```

### Checkbox

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input type="checkbox" value={...} onChange={...}/>
<Input type="checkbox" checked value={...} onChange={...}/>
<Input type="checkbox" disabled value={...} onChange={...}/>
<Input type="checkbox" disabled checked value={...} onChange={...}/>

//Indeterminate
const ref_checked = React.createRef<HTMLInputElement>();
const ref_disabled = React.createRef<HTMLInputElement>();

const indeterminateState = () => {
  if (ref_checked.current !== null) ref_checked.current.indeterminate = true;
  if (ref_disabled.current !== null)
    ref_disabled.current.indeterminate = true;
};

useEffect(() => {
  indeterminateState();
});

<Input type="checkbox" forwardedRef={ref_checked} onChange={indeterminateState} value={...} onChange={...}/>
<Input type="checkbox" forwardedRef={ref_disabled} disabled value={...} onChange={...}/>
```

### Radio

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input type="radio" value={...} onChange={...}/>
<Input type="radio" checked value={...} onChange={...}/>
<Input type="radio" disabled value={...} onChange={...}/>
<Input type="radio" checked disabled value={...} onChange={...}/>
```

### Color

```tsx
import Input from "@talkdesk/cobalt-react-input"

<Input type="color" value={...} onChange={...}/>
```

# SearchInput

> **Cobalt core** component · `@talkdesk/cobalt-react-search-input`
>
> Not the same as [SearchInput (Cobalt Marketplace)](../../../components/marketplace/search-input/search-input.md), `@talkdesk/cobalt-marketplace-react-search-input`: a separate package with its own API. Check which one the code imports before using either.

## Install (v1.1.7)

```sh
npm install @talkdesk/cobalt-react-search-input
```

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-searchinput-docs--docs)

## Known gaps

Read before using it:

* The clear button's accessible name comes only from accessibilityLabels.clear, with no default, so without it the button is announced unnamed. A default ("Clear search") would match Pagination, which defaults its labels.

## Guidance

SearchInput allows users to enter a word or phrase to find relevant content.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

SearchInput allows the user to find relevant content. The user can filter content using different words or phrases as keywords.

### Anatomy

![Search input example — Anatomy](/assets/search-input/anatomy.png)

1. **Label**
2. **Icon**
3. **Hint**
4. **Placeholder**
5. **Dismissible button**

### Variants

#### Sizes

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

![Search input example — Variants Modifiers: Standalone](/assets/search-input/modifiers-standalone.png)
*Standalone*

  ![Search input example — Variants Modifiers: With label](/assets/search-input/modifiers-with-label.png)
*With label*

  ![Search input example — Variants Modifiers: With hint](/assets/search-input/modifiers-with-hint.png)
*With hint*

#### Arrangement

![Search input example — Variants Arrangement: Variable-width](/assets/search-input/arrangement-variable-width.png)
*Variable-width*
e.g. toolbar

![Search input example — Variants Arrangement: Full-width](/assets/search-input/arrangement-full-width.png)
*Full-width*
e.g. small viewports when associated with the toolbar, inside a Panel, and others.

### Guidelines

#### Group

The SearchInput can be combined with other components such as Button, Toggle, Dropdown, InputGroup, and more to improve the search results.

#### Placement

You can use this component inside a Toolbar, Panel, and Form pages.

![Search input example — Guidelines Placement: Toolbar](/assets/search-input/placement-toolbar.png)
*Toolbar*

  ![Search input example — Guidelines Placement: Panel](/assets/search-input/placement-panel.png)
*Panel*

![Search input example — Guidelines Placement: Pages & Forms](/assets/search-input/placement-pages-forms.png)
*Pages & Forms*

#### Use cases

![Search input example — Guidelines Use cases: Search + results](/assets/search-input/cases-search-results.png)
*Search + results*

  ![Search input example — Guidelines Use cases: Search + Popup with items and description](/assets/search-input/cases-search-popup-with-items-and.png)
*Search + Popup with items and description*
Atomic components can be used together

#### Placeholder

The placeholder is mandatory on SearchInput. The default copy is "*Search...*" but you could add more meaning depending on the content of your search.

#### Best practices

**Do:** You can include a label to provide more context. If so, make sure that the label is clear and concise.
![Do example](/assets/search-input/guidelines-do-s-don-ts-do.png)

**Don't:** Search should fit into one line. Do not use multiline search inputs.
![Don't example](/assets/search-input/guidelines-do-s-don-ts-dont.png)

![Do example](/assets/search-input/guidelines-do-s-don-ts-do-2.png)
*Do*
If necessary, provide search orientations. This helps users to find what they are looking for, especially if the searchable items are complex or have some technical limitations.

![Caution example](/assets/search-input/guidelines-do-s-don-ts-caution.png)
*Caution*
It is recommended to have only one search per page. If you need multiple searches, clearly label them to indicate their purpose.

### Behavior

#### Responsiveness

The small size should be used only for small viewports and the medium size can be used for medium and large viewports.

#### Interaction

The dismissible button should appear after the user type any character inside the SearchInput. When clicking on the close icon, the information added is deleted.

![Search input example — Behavior Interaction](/assets/search-input/behavior-interaction.gif)

#### Loading

When bringing the results is taking longer than 1.5 seconds, a loading spinner could be displayed until requests are received. Apply the Spinner loading behavior inside the content to be loaded.

For more context, access the [Spinner](/components/core/spinner/) guidelines.

![Search input example — Behavior Loading](/assets/search-input/behavior-loading.png)

#### Text truncation

When the entered text is too long for the available horizontal space in the field, the text truncates.

![Search input example — Behavior Text truncation](/assets/search-input/behavior-text-truncation.png)

#### Spacing

![Search input example — Variants Spacings](/assets/search-input/variants-spacings.png)

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > FormElements > SearchInput`

* [Search Component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=271%3A10227\&t=1CBkPFqm1GdJC1bR-1) — Core Components library
* [Search Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=48%3A41320\&t=nRCaVIq2uR8ZwXYS-1) — Specs

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Writing guidelines

The placeholder and label rules for search fields are in the Input content guidelines, under
[Search fields](/components/core/input/). For copy rules that apply everywhere, see
[Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

SearchInput is built on react-aria's `SearchField`, so the field is a search box (`type="search"`),
`Esc` clears it and `Enter` calls `onSubmit`.

* Give it a `label` (shown above the field, with optional description, hint and error message), so the
  field has an accessible name.
* Pass `accessibilityLabels.clear` (for example "Clear search"). The clear button has no default name,
  so without it a screen reader announces an unnamed button.
* Announce result counts via a live region as the user types. The component does not do this; the page
  showing the results has to.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

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
| `placeholder` | string |  | no |  |  |
| `inputRef` | Ref<HTMLInputElement> |  | no |  |  |
| `size` | enum | `small`, `medium` | no | medium |  |
| `accessibilityLabels` | AccessibilityLabels |  | no |  |  |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `type` | "text" \| "search" \| "url" \| "tel" \| "email" \| "password" \| (string & {}) |  | no |  | The type of input to render. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdeftype). @default 'search' |
| `enterKeyHint` | "search" \| "enter" \| "done" \| "go" \| "next" \| "previous" \| "send" | `search`, `enter`, `done`, `go`, `next`, `previous`, `send` | no |  | An enumerated attribute that defines what action label or icon to preset for the enter key on virtual keyboards. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/enterkeyhint). |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
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
| `inputMode` | "text" \| "search" \| "url" \| "tel" \| "email" \| "none" \| "numeric" \| "decimal" | `text`, `search`, `url`, `tel`, `email`, `none`, `numeric`, `decimal` | no |  | Hints at the type of data that might be entered by the user while editing the element or its contents. See [MDN](https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute). |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `onSubmit` | (value: string) => void |  | no |  | Handler that is called when the SearchField is submitted. |
| `onClear` | () => void |  | no |  | Handler that is called when the clear button is pressed. |

## Examples

_15 of 15 compile against the published `@talkdesk/cobalt-react-search-input@1.1.7` (React 18, TypeScript strict)._

### Default

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput label="Search" placeholder="Search..." />
```

### With hint

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Search"
  placeholder="Search..."
  hint="Search by name, email, or ID"
/>
```

### Sizes

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput label="Small" placeholder="Search..." size="small" />
<SearchInput label="Medium" placeholder="Search..." size="medium" />
```

### Required

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput label="Search" placeholder="Search..." isRequired />
```

### Invalid

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput label="Search" placeholder="Search..." isInvalid />
```

### With error message

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Search"
  placeholder="Search..."
  isInvalid
  errorMessage="Enter at least three characters"
/>
```

### With warning message

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Search"
  placeholder="Search..."
  warningMessage="No results may be found"
/>
```

### Disabled

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Search"
  placeholder="Search..."
  defaultValue="Hello"
  isDisabled
/>
```

### Read only

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Search"
  placeholder="Search..."
  defaultValue="Hello"
  isReadOnly
/>
```

### Custom labels

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Search"
  placeholder="Search..."
  defaultValue="Hello"
  accessibilityLabels={{ clear: "Clear contacts search" }}
/>
```

### With secondary label

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<SearchInput
  label="Contacts"
  secondaryLabel={<Text inline>Optional</Text>}
/>
```

### With tertiary label

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<SearchInput
  label="Contacts"
  tertiaryLabel={<Text inline>Tertiary Label</Text>}
/>
```

### With description

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"

<SearchInput
  label="Contacts"
  description="Shown on your public profile"
/>
```

### With all labels

```tsx
import { SearchInput } from "@talkdesk/cobalt-react-search-input"
import Icon from "@talkdesk/cobalt-react-icon"
import { Text } from "@talkdesk/cobalt-react-typography"
import { Link } from "@talkdesk/cobalt-react-link"

<SearchInput
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
import { SearchInput } from "@talkdesk/cobalt-react-search-input"
import { Text } from "@talkdesk/cobalt-react-typography"

<div style={{ width: 320 }}>
  <SearchInput
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

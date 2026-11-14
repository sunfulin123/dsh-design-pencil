# Toggle

> **Cobalt core** component · `@talkdesk/cobalt-react-toggle`

## Install (v3.1.1)

```sh
npm install @talkdesk/cobalt-react-toggle
```

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-toggle-docs--docs)

## Guidance

A Toggle lets people turn a single setting on or off immediately.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Use this selection control when the user needs to toggle a single item on or off. They are an effective way to quickly define settings or preferences at an account or system level.

### Anatomy

![Toggle example — Anatomy](/assets/toggle/anatomy.png)

1. **Toggle** - Element with different states available and determinates if something is on or off
2. **Label** - Text to clarify the action that the Toggle performs

### Variants

#### Sizes

Toggles come in two different sizes: Small and Medium. Toggle size is dependent on the viewport. The Small is to be used in Small viewports and the Medium is to be used in Medium and Large viewports.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

Toggles should always have labels. When the Label is not defined, a Toggle becomes standalone. Standalone toggles should only be used when their connection to other components is clear, and they give sufficient context.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Orientation

![Label on the left of the toggle](/assets/toggle/orientation-ltr.png)
*Default - LTR (Left to Right)*

  ![RTL (Right to Left) orientation](/assets/toggle/orientation-rtl.png)
*RTL (Right to Left)*
The RTL version is not implemented in Storybook.

#### Position

When creating an on/off Toggle, you can choose to have the Toggle on the left or right of the label. The label on the right is the default and most frequently used option.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

### Guidelines

#### Group

You can include multiple Toggles together when necessary keeping one per line.

#### Best practices

##### No partial states

Toggles can only be on or off. If you need to show a partial state, use a checkbox instead of a Toggle.

**Do:** 
![Do example](/assets/toggle/behavior-no-partial-do.png)

**Don't:** 
![Don't example](/assets/toggle/behavior-no-partial-dont.png)

##### Visual language

**Do:** Be concise.
![Do example](/assets/toggle/behavior-visual-language-do.png)

**Don't:** There is no need to pair two labels with a Toggle.
![Don't example](/assets/toggle/behavior-visual-language-dont.png)

##### Toggle copy

Don’t change the toggle copy dependent on its state.

**Do:** 
![Do example](/assets/toggle/behavior-toggle-copy-do.png)

**Don't:** 
![Don't example](/assets/toggle/behavior-toggle-copy-dont.png)

### Behavior

#### Interaction

Example of the Toggle being used with the applied states.

![Animated toggle switching between its on and off states](/assets/toggle/interaction.gif)

#### Overflow

When the Label is too long for the horizontal space available in a Toggle, it wraps to form another line.

![A long label wrapping to a second line next to a toggle](/assets/toggle/overflow.png)

#### Toggle vs checkbox

Toggles are best used for communicating activation (e.g., on/off states), while checkboxes are best used for selection (e.g., multiple table rows). Toggles, unlike checkboxes, can't have an error state.

**Do:** 
![Do example](/assets/toggle/checkbox-do.png)

**Don't:** 
![Don't example](/assets/toggle/checkbox-dont.png)

#### Toggle vs radio buttons

Toggles are very similar to [Radio buttons](https://designsystem.talkdesk.com/51aaf6147/p/085bf5-radio) where they're both single selectors: there can only ever be one option selected. However, unlike Radio buttons, **a Toggle can only have 2 options**, which usually relate to something being active or inactive.

**When you should use Toggles:**

* If there are only 2 options.
* If the 2 options relate to something being "On" or "Off" or being "Active" or "Disabled".
* If you want the action to be instant.

**Do:** 
![Do example](/assets/toggle/behavior-visual-language-do.png)

**Don't:** 
![Don't example](/assets/toggle/radio-dont1.png)

**When you should use Radio buttons:**

* If there are more than 2 options.
* If the options aren’t referring to something being on or off.
* If you want the user to confirm settings.

**Do:** Direct and unambiguous.
![Do example](/assets/toggle/radio-do2.png)

**Don't:** This label is neutral and makes the users second-guess what to do.
![Don't example](/assets/toggle/radio-dont2.png)

#### Internationalization

For RTL (right-to-left) languages, the layout of the Toggle is mirrored. The track is placed on the right side of the text and the handle is positioned to the left when the Toggle is turned on.

![RTL toggle example with the track mirrored to the right](/assets/toggle/internationalization.png)

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Toggle`

* [Toggle component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=475%3A16299) — Core Component library
* [Toggle handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=178-119867) — Handoff guidelines

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Introduction

The Toggle component is a switch that allows users to turn a feature on or off. This component is commonly used in settings, preferences, or options.

### Tone and voice

Be clear, informative, and directive. Use friendly and conversational language while still being concise.

### Word choice

Use words that clearly indicate the state of the toggle, such as **"on",** **"off", "active", "inactive", "enabled", or "disabled".**

Give preference to synonyms, as they can be clear on the state of the toggle.

Avoid using ambiguous language that may confuse users.

### Concise and clear writing

Clearly explain what the toggle does and how to use it. Keep labels short and direct. Labels should describe what the control will do when the switch is on; they should not be neutral or ambiguous.

Avoid asking questions.

### Examples

**Do**
- Use action verbs to clearly indicate what will happen if the toggle is on/off.
- 
- 
![Do example](/assets/toggle/content-example-disabled.png)

**Don't:** Without context, labels like these are not clear.
![Don't example](/assets/toggle/content-example-enabled.png)

### Accessibility

### Considerations

#### Development

* Expose it as a switch (`role="switch"` with `aria-checked`) or rely on native checkbox semantics with a clear label.
* Don't signal on/off by color or position alone.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Toggle

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `description` | ReactNode |  | no |  |  |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `labelPlacement` | enum | `start`, `end` | no | end |  |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
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
| `inputRef` | Ref<HTMLInputElement> |  | no |  | A ref for the HTML input element. |
| `children` | ChildrenOrFunction<SwitchButtonRenderProps> |  | no |  |  |

### ToggleGroup

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

_20 of 21 compile against the published `@talkdesk/cobalt-react-toggle@3.1.1` (React 18, TypeScript strict)._

### Basic

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

// A toggle without a visible label needs an accessible name via aria-label.
<Toggle aria-label="Low power mode" />
```

### States

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

<Toggle aria-label="Off" />
<Toggle aria-label="On" defaultSelected />
<Toggle aria-label="Disabled" isDisabled />
<Toggle aria-label="Disabled and on" defaultSelected isDisabled />
```

### Controlled

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

const [isSelected, setIsSelected] = useState(false);

<Toggle
  aria-label="Low power mode"
  isSelected={isSelected}
  onChange={setIsSelected}
/>
```

### Sizes

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

<Toggle aria-label="Small" size="small" />
<Toggle aria-label="Medium" size="medium" />
<Toggle aria-label="Large" size="large" />
```

### With label

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

<Toggle>Low power mode</Toggle>
```

### With description

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

<Toggle description="Reduces performance to save battery">
  Low power mode
</Toggle>
```

### Label position

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

<Toggle labelPlacement="end" description="Reduces performance to save battery">
  Low power mode
</Toggle>
<Toggle labelPlacement="start" description="Reduces performance to save battery">
  Low power mode
</Toggle>
```

### With state label

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"

// children can be a render function (React Aria Components' own
// convention), so the label can depend on the toggle's own state.
<Toggle aria-label="Low power mode">
  {({ isSelected }) => (isSelected ? "Enabled" : "Disabled")}
</Toggle>
```

### RTL

```tsx
import { Toggle } from "@talkdesk/cobalt-react-toggle"
import { I18nProvider } from "react-aria-components";

<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <Toggle labelPlacement="start" defaultSelected>
      Label at start position
    </Toggle>
    <Toggle labelPlacement="end" defaultSelected>
      Label at end position
    </Toggle>
  </div>
</I18nProvider>
```

### Togglegroup default

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

// The group owns the name and the selection: each Toggle needs a unique value.
<ToggleGroup label="SSO login types" name="sso">
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
  <Toggle value="okta">Okta</Toggle>
</ToggleGroup>
```

### Togglegroup default selection

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup label="SSO login types" defaultValue={["google", "okta"]}>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
  <Toggle value="okta">Okta</Toggle>
</ToggleGroup>
```

### Togglegroup controlled selection

> **Doesn't compile:** the published types reject it: Untyped function calls may not accept type arguments.. Fix it before use.

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

const [value, setValue] = useState<string[]>(["google"]);

<ToggleGroup label="SSO login types" value={value} onChange={setValue}>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
  <Toggle value="okta">Okta</Toggle>
</ToggleGroup>
```

### Togglegroup disabled

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup label="SSO login types" defaultValue={["google"]} isDisabled>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
</ToggleGroup>
```

### Togglegroup disabled toggle

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup label="SSO login types">
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft" isDisabled>
    Microsoft
  </Toggle>
</ToggleGroup>
```

### Togglegroup read only

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup label="SSO login types" defaultValue={["google"]} isReadOnly>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
</ToggleGroup>
```

### Togglegroup required

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

// Required means at least one toggle has to be on.
<ToggleGroup label="SSO login types" isRequired>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
</ToggleGroup>
```

### Togglegroup validation

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup
  label="SSO login types"
  defaultValue={["google", "microsoft", "okta"]}
  validationBehavior="aria"
  validate={(value) =>
    value.length > 2 ? "Allow at most two login types" : null
  }
>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
  <Toggle value="okta">Okta</Toggle>
</ToggleGroup>
```

### Togglegroup with error message

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup label="SSO login types" isInvalid errorMessage="Pick at least one">
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
</ToggleGroup>
```

### Togglegroup with warning message

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup
  label="SSO login types"
  warningMessage="Disabling all login types may lock users out"
>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
</ToggleGroup>
```

### Togglegroup with hint

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup label="SSO login types" hint="Choose which login methods to allow">
  <Toggle value="google" description="Uses Google Workspace accounts">
    Google
  </Toggle>
  <Toggle value="microsoft" description="Uses Microsoft Entra ID accounts">
    Microsoft
  </Toggle>
</ToggleGroup>
```

### Togglegroup with all labels

```tsx
import { Toggle, ToggleGroup } from "@talkdesk/cobalt-react-toggle"

<ToggleGroup
  label="SSO login types"
  isRequired
  description="Shown on the organization's login page"
  hint="Choose which login methods to allow"
>
  <Toggle value="google">Google</Toggle>
  <Toggle value="microsoft">Microsoft</Toggle>
</ToggleGroup>
```

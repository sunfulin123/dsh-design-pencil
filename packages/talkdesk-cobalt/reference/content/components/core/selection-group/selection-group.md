# SelectionGroup

> **Cobalt core** component · `@talkdesk/cobalt-react-selection-group`

## Install (v3.1.0)

```sh
npm install @talkdesk/cobalt-react-selection-group
```

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-selectiongroup-docs--docs)

## Guidance

Selection group is a type of interaction used in buttons, where the user has available one or more options in a group

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

![Selection group example — overview](/assets/selection-group/cover.png)

### Overview

Selection groups are toggles with the appearance of a button. These toggles can be configured to behave as radio buttons with single selection or as checkboxes with multiple selection.

The Selection group should share a common container to emphasize groups of related buttons.

### Anatomy

![SelectionGroup anatomy: container, item, label, divider, icon, selected item](/assets/selection-group/anatomy.png)
*Anatomy*

1. **Container** - Background box that clusters all the itens in the selection group.
2. **Item** - A choice for the user, shown with other options.
3. **Label** - Text that informs what to expect on selecting that item.
4. **Divider** - A line to create a separation between different parts of the selection.
5. **Icon** - An option to groups different actions that are displayed in a visual and simplified way.
6. **Selected item** - A variation of status for the selected item.

### Variants

#### Sizes

We have a `large` , `medium` and `small` versions. Horizontally, a selection group can grow up to a limited number of options provided by the component.

![Large selection group size](/assets/selection-group/size-large.png)
*Size - Large*

  ![Medium selection group size](/assets/selection-group/size-medium.png)
*Size - Medium*

![Small selection group size](/assets/selection-group/size-small.png)
*Size - Small*

#### Content

`Icon with Label` , `Icon` or `Label` content options

![Content - Icon and Label](/assets/selection-group/content-icon-label.png)
*Content - Icon and Label*

  ![Content - Icon](/assets/selection-group/content-icon.png)
*Content - Icon*

![Content - Label](/assets/selection-group/content-label.png)
*Content - Label*

#### Type

`default` and `outline`

Note: Only one version can be used on the same page.

![Type - Default](/assets/selection-group/type-default.png)
*Type - Default*

  ![Type - Outlined](/assets/selection-group/type-outlined.png)
*Type - Outlined*

#### State

`default`, `selected`, `hover`, `disabled`, `disabled-selected`

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

![State - Disabled](/assets/selection-group/state-disabled.png)
*State - Disabled*

  ![State - Disabled-selected](/assets/selection-group/state-disabled-selected.png)
*State - Disabled-selected*

**Error states**

`error default`, `error selected`, `error hover`, `error disabled`, `error disabled-selected`

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

![Variation - Error - Disabled](/assets/selection-group/error-disabled.png)
*Variation - Error - Disabled*

  ![Variation - Error - Disabled-selected](/assets/selection-group/error-disabled-selected.png)
*Variation - Error - Disabled-selected*

**Warning states**

`warning default`, `warning selected`, `warning hover`, `warning disabled`, `warning disabled-selected`

![Variation - Warning - Default](/assets/selection-group/warning-default.png)
*Variation - Warning - Default*

  ![Variation - Warning - Selected](/assets/selection-group/warning-selected.png)
*Variation - Warning - Selected*

![Variation - Warning - Hover](/assets/selection-group/warning-hover.png)
*Variation - Warning - Hover*

  ![Variation - Warning - Disabled](/assets/selection-group/warning-disabled.png)
*Variation - Warning - Disabled*

![Variation - Warning - Disabled-selected](/assets/selection-group/warning-disabled-selected.png)
*Variation - Warning - Disabled-selected*

#### Options

Quantity of options available: `2`, `3`, `4`, `5`,`6`, `7`, `10` and `12`.

![Options - 2](/assets/selection-group/options-2.png)
*Options - 2*

  ![Selection group example — Variants Options: Options - 3](/assets/selection-group/options-options-3.png)
*Options - 3*

  ![Selection group example — Variants Options: Options - 4](/assets/selection-group/options-options-4.png)
*Options - 4*

![Selection group example — Variants Options: Options - 5](/assets/selection-group/options-options-5.png)
*Options - 5*

  ![Options - 2](/assets/selection-group/options-2.png)
*Options - 6*

  ![Options - 7](/assets/selection-group/options-7.png)
*Options - 7*

![Selection group example — Variants Options: Options - 10](/assets/selection-group/options-options-10.png)
*Options - 10*

  ![Options - 12](/assets/selection-group/options-12.png)
*Options - 12*

### Guidelines

A Selection group can be used to allow users to complete tasks that involve making choices such as selecting options or switch settings.

#### IVR

**Studio** is where this component is being most used as they use it to configure IVRs. This is one of the main reasons why we have options 10 to 12 available (considering special characters).

![Selection group example — Guidelines IVR](/assets/selection-group/guidelines-ivr.png)

#### Days of the week

**Admin** is using Selection groups for business hours (selecting the days of the week the contact center is open).

![Selection group used to pick days of the week (MON through SUN)](/assets/selection-group/days-of-the-week.png)

#### Multiple normal

We can have this scenario for example in the **Business hours** configuration page where multiple selection groups are used to set multiple independent working hours.

![Multiple independent selection groups, one per day, used to set business hours](/assets/selection-group/multiple-normal.png)

#### Tab navigation

Everywhere else, is a toggle between two or more actions (mostly used as a tabbed nav).

### Behavior

#### Selecting

##### Single selection

By default, the Selection group acts like a radio button group. In this scenario, only one item can be selected and active at a time. If you select one item, respectively this action will deselects any other.

![Single selection: selecting one item deselects any other](/assets/selection-group/single-selection.png)

##### Multiple selection

Adding the `multiple` attribute allows multiple items to be selected (similar to the behavior of a checkbox). In this mode the values of the toggles are not used.

![Multiple selection: more than one item can be selected at once](/assets/selection-group/multiple-selection.png)

#### Available options

The minimum available options are 2. There is no maximum defined however as a design rule you should try to keep your options under 7 items.

There are exceptions for this if you need to use the selection group for IVR, which will need all the digits 0-9 and also the # and \* characters, making it a 12 options selection group.

#### Positioning

They can be placed anywhere inside the screen respecting the grid from the layout pre-settings.

#### Orientation

They can be rendered only in a **horizontal** orientation.

**Do:** 
![Do example](/assets/selection-group/orientation-do.png)

**Don't:** 
![Don't example](/assets/selection-group/orientation-dont.png)

#### Appearance

The appearance of a Selection group will follow the `default` style. If you want to, you can switch into the `outline` style. Just remembering that it is necessary to follow **only one style per page**.

**Do:** 
![Do example](/assets/selection-group/appearance-do.png)

**Don't:** 
![Don't example](/assets/selection-group/appearance-dont.png)

#### Disabled options

A Selection group with options that cannot be selected can either be given a disabled state, or be hidden.

![Selection group example — Behavior Disabled options: Disabled-selected](/assets/selection-group/options-disabled.png)
*Disabled*

  ![Selection group example — Behavior Disabled options: Disabled-selected](/assets/selection-group/options-disabled.png)
*Disabled-selected*

#### Collapsing

When a Selection group is reduced to a width that would cause it to wrap, replace it with a button that opens a Dropdown menu containing the Selection group options in a list to prevent the component from breaking.

![Collapsed selection group replaced by a button that opens a dropdown menu listing the options](/assets/selection-group/collapsing.png)

#### Internationalization

For RTL (right-to-left) languages, the layout orientation of the Selection group is mirrored.

![Selection group in LTR versus RTL orientation](/assets/selection-group/rtl.png)

#### Responsiveness

We have two versions. A responsive one, `full-width`, where each item in the group stretches to fill the space of the container; and a fixed version, `content width`, where each item in the group only stretches to accommodate the content inside it.

### Resources

Find this component under: `Cobalt Design System > Core Components > Selection group`

* [Selection group](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Cobalt-Core-Components?node-id=575%3A24867) — Cobalt core component

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

### Interactions

#### Keyboard

* Users should be able to navigate to the Selection group by using normal keyboard navigation;
* To change the focused item, use the `Left Arrow` or `Right Arrow` keys. Another option to switch between the items is to use `Tab` or `Shift` + `Tab`;
* Selected items should display a visible focus state when users tab to them.

If using the keyboard, the expected behavior:

| **Keys**             | **Interaction**                                       |
| -------------------- | ----------------------------------------------------- |
| Enter (↵) or spacing | Trigger and activates the select event                |
| Left arrow (⬅)       | Navigate between the selected items to the left       |
| Right arrow (➡)      | Navigate between the selected items to the right      |
| Tab (⇥)              | Dismisses the focus and moves to the next on the page |
| Shift + Tab          | Go back to the previous item (tabbing backwards)      |

### Considerations

#### Design

The Selection group supports the standards for providing accessible web content which are set by the [Web Content Accessibility Guidelines 2.1](https://www.w3.org/TR/WCAG21/).

* [1.1.1 Non-text Content A](https://w3.org/WAI/WCAG21/quickref/?showtechniques=131#non-text-content)
* [1.3.1 Info and Relationships A](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html)

#### Development

Components need to be accessible to allow its interaction regardless of user's context. The Selection group is accessible by screen readers providing WAI-ARIA, WCAG 2.1 and keyboard support.

* Avoid very long labels to facilitate understandability and perceivability;
* Selection groups should always have one active item;
* If a Selection group contains only icons, you should specify a meaningful label via `aria-label` or `aria-labelledby` for each of the options available;
* Always include an `aria-label="..."` to describe the intention of the Selection group.

## Props

### SelectionGroup

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `isInvalid` | boolean |  | no |  |  |
| `errorMessage` | ReactNode |  | no |  |  |
| `isFullWidth` | boolean |  | no |  |  |
| `size` | enum | `tiny`, `small`, `medium`, `large` | no | medium |  |
| `type` | enum | `outline`, `secondary` | no |  |  |
| `selectedKeys` | Key[] |  | no |  | Currently selected keys (controlled). See `defaultSelectedKeys`. |
| `onSelectionChange` | (keys: Key[]) => void |  | no |  | Called when the selection changes. A `Set` is used internally to track the selection, but this always receives a plain array, to match `selectedKeys`/`defaultSelectedKeys`. |
| `name` | string |  | no |  | The name used to submit each selected key with a form. |
| `isRequired` | boolean |  | no |  | Whether a selection is required before the form can be submitted. |
| `validate` | (keys: Key[]) => true \| ValidationError |  | no |  | Validates the selected keys. It is not called while nothing is selected - use `isRequired` for that. |
| `validationBehavior` | enum | `native`, `aria` | no |  | Whether to use native form validation, blocking submission and showing errors on submit, or only mark the group invalid with ARIA, showing errors in realtime. Defaults to the enclosing `Form`'s, or `native`. |
| `selectionMode` | "single" \| "multiple" | `single`, `multiple` | no |  | Whether single or multiple selection is enabled. @default 'single' |
| `disallowEmptySelection` | boolean |  | no |  | Whether the collection allows empty selection. |
| `defaultSelectedKeys` | Iterable<Key> |  | no |  | The initial selected keys in the collection (uncontrolled). |
| `isDisabled` | boolean |  | no |  | Whether all items are disabled. |
| `children` | ReactNode |  | no |  |  |

### SelectionGroupOption

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `prefix` | ReactNode |  | no |  |  |
| `suffix` | ReactNode |  | no |  |  |
| `preventFocusOnPress` | boolean |  | no |  | Whether to prevent focus from moving to the button when pressing it.  Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `isSelected` | boolean |  | no |  | Whether the element should be selected (controlled). |
| `defaultSelected` | boolean |  | no |  | Whether the element should be selected (uncontrolled). |
| `onChange` | (isSelected: boolean) => void |  | no |  | Handler that is called when the element's selection state changes. |
| `isDisabled` | boolean |  | no |  | Whether the button is disabled. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

## Examples

_9 of 12 compile against the published `@talkdesk/cobalt-react-selection-group@3.1.0` (React 18, TypeScript strict)._

### Basic

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<SelectionGroup aria-label="Frequency" defaultSelectedKeys={["monthly"]}>
  <SelectionGroupOption id="daily">Daily</SelectionGroupOption>
  <SelectionGroupOption id="monthly">Monthly</SelectionGroupOption>
  <SelectionGroupOption id="yearly" isDisabled>Yearly</SelectionGroupOption>
</SelectionGroup>
```

### Sizes

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<SelectionGroup aria-label="Weekday" size="tiny">...</SelectionGroup>
<SelectionGroup aria-label="Weekday" size="small">...</SelectionGroup>
<SelectionGroup aria-label="Weekday" size="medium">...</SelectionGroup>
<SelectionGroup aria-label="Weekday" size="large">...</SelectionGroup>
```

### Full width

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<SelectionGroup aria-label="Weekday" isFullWidth>
  ...
</SelectionGroup>
```

### Types

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

//Default (no type prop)
<SelectionGroup aria-label="Option">...</SelectionGroup>

//Outline
<SelectionGroup aria-label="Option" type="outline">...</SelectionGroup>

//Secondary
<SelectionGroup aria-label="Option" type="secondary">...</SelectionGroup>
```

### Multi select

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<SelectionGroup
  aria-label="Options"
  selectionMode="multiple"
  defaultSelectedKeys={["option-2", "option-3"]}
>
  <SelectionGroupOption id="option-1">Option 1</SelectionGroupOption>
  <SelectionGroupOption id="option-2">Option 2</SelectionGroupOption>
  <SelectionGroupOption id="option-3">Option 3</SelectionGroupOption>
  <SelectionGroupOption id="option-4">Option 4</SelectionGroupOption>
</SelectionGroup>
```

### Prefix

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

//The prefix is decorative and hidden from assistive technology
<SelectionGroup aria-label="View" defaultSelectedKeys={["list"]}>
  <SelectionGroupOption id="list" prefix={<Icon name="list" />}>List</SelectionGroupOption>
  <SelectionGroupOption id="grid" prefix={<Icon name="apps" />}>Grid</SelectionGroupOption>
</SelectionGroup>
```

### Suffix

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

//The suffix is decorative and hidden from assistive technology
<SelectionGroup aria-label="Sort" defaultSelectedKeys={["asc"]}>
  <SelectionGroupOption id="asc" suffix={<Icon name="arrow_upward" />}>Ascending</SelectionGroupOption>
  <SelectionGroupOption id="desc" suffix={<Icon name="arrow_downward" />}>Descending</SelectionGroupOption>
</SelectionGroup>
```

### RTL

> **Doesn't compile:** imports `@talkdesk/cobalt-react-i18n-provider`, which isn't a published package. Fix it before use.

```tsx
import { I18nProvider } from "@talkdesk/cobalt-react-i18n-provider";
 import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<I18nProvider locale="ar-EG">
  <SelectionGroup aria-label="التكرار" selectionMode="multiple">
    <SelectionGroupOption id="daily">يومي</SelectionGroupOption>
    <SelectionGroupOption id="monthly">شهري</SelectionGroupOption>
    <SelectionGroupOption id="yearly">سنوي</SelectionGroupOption>
  </SelectionGroup>
</I18nProvider>
```

### Controlled

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

const [selectedKeys, setSelectedKeys] = useState(["monthly"]);

<SelectionGroup
  aria-label="Frequency"
  selectedKeys={selectedKeys}
  onSelectionChange={setSelectedKeys}
  disallowEmptySelection
>
  <SelectionGroupOption id="daily">Daily</SelectionGroupOption>
  <SelectionGroupOption id="monthly">Monthly</SelectionGroupOption>
  <SelectionGroupOption id="yearly">Yearly</SelectionGroupOption>
</SelectionGroup>
```

### Field

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<SelectionGroup
  label="Frequency"
  description="How often the report is sent"
  hint="You can change this later"
>
  ...
</SelectionGroup>
```

### Validation

```tsx
import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<SelectionGroup label="Frequency" isInvalid errorMessage="Select a frequency">
  <SelectionGroupOption id="daily">Daily</SelectionGroupOption>
  <SelectionGroupOption id="monthly">Monthly</SelectionGroupOption>
  <SelectionGroupOption id="yearly">Yearly</SelectionGroupOption>
</SelectionGroup>

<SelectionGroup
  label="Frequency"
  warningMessage="Yearly reports are sent once a year"
  defaultSelectedKeys={["yearly"]}
>
  <SelectionGroupOption id="daily">Daily</SelectionGroupOption>
  <SelectionGroupOption id="monthly">Monthly</SelectionGroupOption>
  <SelectionGroupOption id="yearly">Yearly</SelectionGroupOption>
</SelectionGroup>
```

### Form

```tsx
import { Form } from "react-aria-components";
import Button from "@talkdesk/cobalt-react-button";
 import { SelectionGroup, SelectionGroupOption } from "@talkdesk/cobalt-react-selection-group";

<Form validationErrors={validationErrors} onSubmit={onSubmit}>
  <SelectionGroup
    label="Frequency"
    name="frequency"
    isRequired
    errorMessage="Select a frequency"
  >
    <SelectionGroupOption id="daily">Daily</SelectionGroupOption>
    <SelectionGroupOption id="monthly">Monthly</SelectionGroupOption>
    <SelectionGroupOption id="yearly">Yearly</SelectionGroupOption>
  </SelectionGroup>
  <SelectionGroup
    label="Working days"
    name="days"
    selectionMode="multiple"
    defaultSelectedKeys={["mon", "tue", "wed", "thu", "fri"]}
    validate={(keys) =>
      keys.length > 5 ? "Select up to 5 working days" : null
    }
  >
    <SelectionGroupOption id="mon">MON</SelectionGroupOption>
    <SelectionGroupOption id="tue">TUE</SelectionGroupOption>
    <SelectionGroupOption id="wed">WED</SelectionGroupOption>
    <SelectionGroupOption id="thu">THU</SelectionGroupOption>
    <SelectionGroupOption id="fri">FRI</SelectionGroupOption>
    <SelectionGroupOption id="sat">SAT</SelectionGroupOption>
    <SelectionGroupOption id="sun">SUN</SelectionGroupOption>
  </SelectionGroup>
  <Button htmlType="submit" type="primary" size="small">Submit</Button>
  <Button htmlType="reset" size="small">Reset</Button>
</Form>
```

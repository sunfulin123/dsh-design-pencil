# InputGroup

> **Cobalt core** component · `@talkdesk/cobalt-react-input-group`

## Install (v3.0.1)

```sh
npm install @talkdesk/cobalt-react-input-group
```

```tsx
import { Group, GroupItem, GroupLabel } from "@talkdesk/cobalt-react-input-group";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-inputgroup-docs--docs)

## Guidance

InputGroups are useful for giving context to input field values.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

InputGroup allows form controls to be extended by grouping inputs, buttons, and other elements into an adjacent visual unit.

### Anatomy

![InputGroup anatomy: label, icon, hint, item, value, dropdown, extra input](/assets/input-group/anatomy.png)

1. **Label**
2. **Icon**
3. **Hint**
4. **Item**
5. **Value**
6. **Dropdown**
7. **Extra input**

### Variants

#### Sizes

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Orientation

You can use the gray BG variation to highlight and improve more meaning of what the user needs to add in the input (white BG variation). Also, this gray variation is only interactive when associated with an expandable arrow (Dropdown).

![Last item in a group](/assets/input-group/spacing-last.png)
*Last*

![First item in a group](/assets/input-group/spacing-first.png)
*First*

![Middle item in a group](/assets/input-group/spacing-middle.png)
*Middle*

#### Quantity

In Figma, our component supports a maximum of 3 items combined.

![2 items grouped](/assets/input-group/quantity-2-items.png)
*2 items*

  ![3 items grouped](/assets/input-group/quantity-3-items.png)
*3 items*

On the implementation side, there is no limitation for the max of inputs grouped. For now, we recommend a max of 5 inputs together.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/11bf86-inputgroup) — Design tab, image 32.*

Quality Manager reference with 5 items applied.

### Guidelines

#### Placement

This component should be used inside form pages and associated with form elements.

#### Best practices

![Do example](/assets/input-group/dodont-do-1.png)
*Do*
Use it to add on at either end of a field related to a question, like an amount with a numerical value or a time frame value.

![Do example](/assets/input-group/dodont-do-3.png)
*Do*
Use it when there’s an association between one attribute and another, as it adds a clear affordance for what type of data is required to be entered in the field. e.g. $ or %.

![Do example](/assets/input-group/dodont-do-2.png)
*Do*
Combine it with icons to improve the meaning of the InputGroup need.

![Caution example](/assets/input-group/dodont-caution-1.png)
*Caution*
Caution with complex groupings that will be constricted by horizontal space, prefer to use individual inputs instead.

### Behavior

#### Responsiveness

The small size should be used for small viewports and the medium size only for medium and large viewports.

#### Text truncation

When the entered text is too long for the available horizontal space in the field, the text truncates.

![Text truncated inside a grouped input value](/assets/input-group/text-truncation.png)

#### Spacing

![0px spacing between grouped items, 16px spacing between separate InputGroups](/assets/input-group/spacing-annotation.png)

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > FormElements > InputGroup`

* [InputGroup Component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=841%3A59275\&t=zwIBY1J1BrxidX75-1) — Core components library
* [InputGroup Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=189%3A132879\&t=n6rlp69VxUxeh39Q-1) — Specs

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

#### Development

* Keep the grouped input's own associated label.
* Label any add-on (icon/button), or hide it from assistive tech if purely decorative.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Group

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `small`, `medium` | no | medium |  |
| `className` | string |  | no |  |  |
| `groupRef` | Ref<HTMLDivElement> |  | no |  | Ref to the bordered box element itself, as opposed to the outer wrapper (also holding the label/hint/error) that the top-level ref points to. |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `children` | ReactNode |  | no |  |  |
| `isDisabled` | boolean |  | no |  | Whether the group is disabled. |
| `isInvalid` | boolean |  | no |  | Whether the group is invalid. |
| `isReadOnly` | boolean |  | no |  | Whether the group is read only. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

### GroupContext

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `small`, `medium` | no | medium |  |
| `className` | string |  | no |  |  |
| `groupRef` | Ref<HTMLDivElement> |  | no |  | Ref to the bordered box element itself, as opposed to the outer wrapper (also holding the label/hint/error) that the top-level ref points to. |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `children` | ReactNode |  | no |  |  |
| `isDisabled` | boolean |  | no |  | Whether the group is disabled. |
| `isInvalid` | boolean |  | no |  | Whether the group is invalid. |
| `isReadOnly` | boolean |  | no |  | Whether the group is read only. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

### GroupItem

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isMuted` | boolean |  | no |  | Renders the item with a muted background, e.g. for a leading label segment, or any other non-editable content. Purely visual - pass role="presentation" separately for genuinely non-interactive content, e.g. a static label with no field of its own. |
| `width` | enum | `min`, `5`, `10`, `15`, `20`, `25`, `30`, `33`, `35`, `40`, `45`, `50`, `55`, `60`, `65`, `66`, `70`, `75`, `80`, `85`, `90`, `95`, `100` | no |  | Defines the percentage of the width the item should take. Use values from 5 to 100, in multiples of 5. 33 and 66 are also possible values. To have the item occupy the minimum space needed, use "min". |
| `children` | ReactNode |  | no |  |  |
| `isDisabled` | boolean |  | no |  | Whether the group is disabled. |
| `isInvalid` | boolean |  | no |  | Whether the group is invalid. |
| `isReadOnly` | boolean |  | no |  | Whether the group is read only. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

### GroupLabel

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isDisabled` | boolean |  | no |  | Whether the group is disabled. |
| `isInvalid` | boolean |  | no |  | Whether the group is invalid. |
| `isReadOnly` | boolean |  | no |  | Whether the group is read only. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

## Examples

_16 of 16 compile against the published `@talkdesk/cobalt-react-input-group@3.0.1` (React 18, TypeScript strict)._

### Basic

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group aria-label="Amount">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Third" />
  </GroupItem>
</Group>
```

### Seamless

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import Flex from "@talkdesk/cobalt-react-flex";
import Button from "@talkdesk/cobalt-react-button";
import { Textarea } from "@talkdesk/cobalt-react-textarea";

<Group aria-label="Message">
  <Flex direction="column" width="100%">
    <Textarea
      aria-label="Message"
      placeholder="Ask anything"
      isResizable={false}
    />
    <Button
      aria-label="Send"
      shape="compact"
      size="small"
      style={{ alignSelf: "flex-end", marginBottom: 8, marginRight: 8 }}
    >
      ↑
    </Button>
  </Flex>
</Group>
```

### Sizes

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group size="small" label="Small">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Third" />
  </GroupItem>
</Group>

<Group size="medium" label="Medium">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Third" />
  </GroupItem>
</Group>
```

### Widths

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group aria-label="Amount">
  <GroupItem width="15">
    <TextInput aria-label="First" defaultValue="15%" />
  </GroupItem>
  <GroupItem width="35">
    <TextInput aria-label="Second" defaultValue="35%" />
  </GroupItem>
  <GroupItem width="50">
    <TextInput aria-label="Third" defaultValue="50%" />
  </GroupItem>
</Group>
```

### Label

```tsx
import {
  Group,
  GroupItem,
  GroupLabel,
} from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";
import { NumberInput } from "@talkdesk/cobalt-react-number-input";

<Group aria-label="Condition">
  <GroupLabel>If</GroupLabel>
  <GroupItem width="35">
    <TextInput aria-label="Field" placeholder="Field" />
  </GroupItem>
  <GroupItem width="65">
    <NumberInput aria-label="Value" placeholder="Value" />
  </GroupItem>
</Group>
```

### Icon label

```tsx
import {
  Group,
  GroupItem,
  GroupLabel,
} from "@talkdesk/cobalt-react-input-group";
import Icon from "@talkdesk/cobalt-react-icon";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group aria-label="Search">
  <GroupLabel>
    <Icon name="search" accessibilityLabel="Search" />
  </GroupLabel>
  <GroupItem>
    <TextInput aria-label="Search" placeholder="Search" />
  </GroupItem>
</Group>
```

### With dropdown

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { Dropdown, DropdownItem } from "@talkdesk/cobalt-react-dropdown";
import { TextInput } from "@talkdesk/cobalt-react-text-input";
import { NumberInput } from "@talkdesk/cobalt-react-number-input";

{/* isMuted gives the segment a muted background, for a field that isn't the main input */}
<Group aria-label="Order">
  <GroupItem isMuted width="35">
    <Dropdown aria-label="Category" defaultValue="electronics">
      <DropdownItem id="electronics">Electronics</DropdownItem>
      <DropdownItem id="clothing">Clothing</DropdownItem>
      <DropdownItem id="books">Books</DropdownItem>
    </Dropdown>
  </GroupItem>
  <GroupItem width="40">
    <TextInput aria-label="Item name" placeholder="Item name" />
  </GroupItem>
  <GroupItem width="25">
    <NumberInput aria-label="Quantity" placeholder="Qty" />
  </GroupItem>
</Group>
```

### States

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

{/* Cascades to every field inside automatically */}
<Group isDisabled label="Disabled">
  <GroupItem>
    <TextInput aria-label="First" defaultValue="Content with disabled" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" defaultValue="Content with disabled" />
  </GroupItem>
</Group>

{/* Cascades to every field inside automatically */}
<Group isReadOnly label="Read-only">
  <GroupItem>
    <TextInput aria-label="First" defaultValue="Content with readOnly" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" defaultValue="Content with readOnly" />
  </GroupItem>
</Group>
```

### Validity feedback

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

{/* Cascades to every field inside, plus a group-level error message */}
<Group isInvalid label="Global" errorMessage="Something is wrong">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Third" />
  </GroupItem>
</Group>

{/* Overrides the ambient Group state for just that item */}
<Group label="Individual">
  <GroupItem isInvalid>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

### Inside form

```tsx
import { Form } from "react-aria-components";
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import Button from "@talkdesk/cobalt-react-button";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Form validationErrors={{ last: "This last name is already registered" }}>
  <Group label="Name" hint="As it appears on your ID">
    <GroupItem width="50">
      <TextInput
        name="first"
        aria-label="First name"
        defaultValue="Ada"
        isRequired
      />
    </GroupItem>
    <GroupItem width="50">
      <TextInput
        name="last"
        aria-label="Last name"
        defaultValue="Lovelace"
      />
    </GroupItem>
  </Group>
  <Button htmlType="submit">Submit</Button>
</Form>
```

### With hint

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group label="Amount" hint="Enter values between 0 and 100">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

### With secondary label

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group label="Amount" secondaryLabel="Optional">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

### With tertiary label

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group label="Amount" tertiaryLabel="Updated 2 minutes ago">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

### With description

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group label="Amount" description="Shown on the invoice">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

### With warning message

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group label="Amount" warningMessage="These values look unusually high">
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

### With all labels

```tsx
import { Group, GroupItem } from "@talkdesk/cobalt-react-input-group";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<Group
  label="Amount"
  secondaryLabel="Optional"
  tertiaryLabel="Updated 2 minutes ago"
  description="Shown on the invoice"
  hint="Enter values between 0 and 100"
>
  <GroupItem>
    <TextInput aria-label="First" />
  </GroupItem>
  <GroupItem>
    <TextInput aria-label="Second" />
  </GroupItem>
</Group>
```

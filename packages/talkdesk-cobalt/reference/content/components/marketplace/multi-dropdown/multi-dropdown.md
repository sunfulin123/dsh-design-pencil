# MultiDropdown

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-multi-dropdown`
>
> Built on [Dropdown (Cobalt core)](../../../components/core/dropdown/dropdown.md), `@talkdesk/cobalt-react-dropdown`.

## Install (v3.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-multi-dropdown
```

```tsx
import MultiDropdown, { NestedOptions, Option, Search, SelectAll, addNewSelectedOptions, removeSelectedOptions } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-multidropdown-stories--default)

## Known gaps

Read before using it:

* MultiDropdown's types make onChange required, and most of its examples leave it out, so they don't compile. Always pass onChange.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-dropdown`](../../../components/core/dropdown/dropdown.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-input`](../../../components/core/input/input.md), [`@talkdesk/cobalt-react-label`](../../../components/core/label/label.md), [`@talkdesk/cobalt-react-list`](../../../components/core/list/list.md), [`@talkdesk/cobalt-react-outside-click-hook`](../../../hooks/core/outside-click-hook/outside-click-hook.md), [`@talkdesk/cobalt-react-tag`](../../../components/core/tag/tag.md).

## Guidance

MultiDropdown is a Cobalt Marketplace component built on the Cobalt core [Dropdown](/components/core/dropdown/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for MultiDropdown is on the Cobalt core [Dropdown](/components/core/dropdown/) page: MultiDropdown is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### MultiDropdown

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `aria-labelledby` | string |  | no |  | For accessibility. Identifies the element (or elements) that labels the current element. @see aria-describedby. |
| `contentSize` | enum | `small`, `medium`, `large` | no |  | This prop should only be used in a borderless dropdown |
| `customValue` | ReactNode |  | no |  |  |
| `defaultOpen` | boolean |  | no | false |  |
| `disabled` | boolean |  | no | false |  |
| `dismissValues` | boolean |  | no | false | This prop allows the user to dismiss the tags individually in the input |
| `error` | boolean |  | no | false |  |
| `horizontalOrigin` | enum | `left`, `right` | no |  | Defines the horizontal origin for the dropdown content |
| `inputSize` | enum | `small`, `medium` | no |  |  |
| `loading` | boolean |  | no | false |  |
| `maxVisibleValues` | number |  | no | 2 |  |
| `messages` | { error?: string; placeholder?: string; selectAll?: string; } |  | no |  | Translation object. If you don't set this, the component will use default values |
| `onChange` | OnChangeOption |  | yes |  |  |
| `onClose` | () => void |  | no |  | Callback called when the dropdown closes |
| `renderSelectAll` | boolean |  | no | true | If the component should render the Select All option |
| `searchable` | boolean |  | no | false | If the dropdown has the search input. If you are using the `Search` component, you must set this to `true` |
| `items` | { title: string \| number; value: string \| number; icon?: Element; }[] |  | yes |  |  |
| `onSelectAll` | OnChangeOption |  | no |  |  |
| `selectedValues` | { title: string \| number; value: string \| number; icon?: Element; }[] |  | no |  |  |
| `children` | ReactNode \| ControlledChildren |  | no |  |  |
| `borderless` | boolean |  | no |  |  |
| `direction` | Direction | `down`, `up` | no |  |  |
| `height` | Height<string \| number> |  | no |  | Defines the height of the dropdown. Use any valid value for CSS property. |
| `width` | Width<string \| number> |  | no |  | Defines the width of the dropdown. Use any valid value for CSS property. |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |
| `onBlur` | () => void |  | no |  |  |

### NestedOptions

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `onClick` | (option: { title: string \| number; value: string \| number; icon?: Element; }, isSelected: boolean) => void |  | yes |  |  |
| `selectedItems` | number |  | yes |  |  |
| `totalItems` | number |  | yes |  |  |
| `value` | string \| number |  | no |  |  |
| `disabled` | boolean |  | no |  |  |
| `title` | string \| number |  | yes |  |  |
| `children` | ReactNode |  | yes |  |  |

### Option

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `borderBottom` | boolean |  | no | false |  |
| `onClick` | OnChangeOption |  | no |  |  |
| `icon` | Element |  | no |  |  |
| `disabled` | boolean |  | no | false |  |
| `value` | string \| number |  | yes |  |  |
| `title` | string \| number |  | yes |  |  |
| `description` | string |  | no |  |  |
| `selected` | boolean |  | no | false |  |
| `right` | ReactNode |  | no |  |  |
| `forwardedRef` | Ref<HTMLInputElement> |  | no |  |  |

### Search

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `messages` | { noResults?: string; placeholder?: string; } |  | no |  | Translation object. If you don't set this, the component will use default values |
| `onChangeSearch` | (query: string) => void |  | no |  | Callback that gives you the current search text. Useful if you are doing the filtering in the BE |
| `onClick` | OnChangeOption |  | no |  | This is an internal prop that is passed automatically. Avoid using it |
| `onSearch` | (query: string, children: ReactNode) => ReactNode |  | no | (query: string, children: ReactNode) => {   return React.Children.toArray(children).filter((child) => {     const title = (child as any).props.title;      if (!title) {       return false;     }      return title.toLowerCase().includes(query.toLowerCase());   }); } | If you don't want the filtering to be done in the FE, you should set this prop to `undefined` and use the prop `onChangeSearch` to have access to the search value |
| `children` | ReactNode \| ControlledChildren |  | no |  |  |

### SelectAll

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `filteredOptions` | { title: string \| number; value: string \| number; icon?: Element; }[] |  | no |  |  |

## Examples

_4 of 27 compile against the published `@talkdesk/cobalt-marketplace-react-multi-dropdown@3.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [selected, setSelected] = useState<OptionSelected[]>([]);

const options = [
  { title: "Green Arrow", value: "green-arrow" },
  { title: "Batman", value: "batman" },
  { title: "Flash", value: "flash" },
];

<p id="multi-dropdown-label">Dropdown</p>
<MultiDropdown
  items={options}
  onChange={setSelected}
  selectedValues={selected}
  aria-labelledby="multi-dropdown-label"
>
  {options.map((option) => (
    <Option
      key={option.value}
      selected={selected.some(({ value }) => value === option.value)}
      title={option.title}
      value={option.value}
    />
  ))}
</MultiDropdown>
```

### Controlled render

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [selected, setSelected] = useState<OptionSelected[]>([]);

const options = [
  { title: "Green Arrow", value: "green-arrow" },
  { title: "Batman", value: "batman" },
  { title: "Flash", value: "flash" },
];
const customOption = {
  title: "I do nothing, just close the dropdown :(",
  value: "nothing",
};

<MultiDropdown
  items={[...options, customOption]}
  onChange={setSelected}
  selectedValues={selected}
>
  {({ onClick, setIsOpen }) => (
    <>
      {options.map((option) => (
        <Option
          key={option.value}
          onClick={onClick}
          selected={selected.some(({ value }) => value === option.value)}
          title={option.title}
          value={option.value}
        />
      ))}
      <Option
        onClick={() => setIsOpen(false)}
        title={customOption.title}
        value={customOption.value}
      />
    </>
  )}
</MultiDropdown>
```

### Without select all

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; renderSelectAll: false; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; conten. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown renderSelectAll={false}>
  ...
</MultiDropdown>
```

### Custom select all

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; messages: { selectAll: string; }; onSelectAll: (options: { title: string | number; value: string | number | null; icon?: Element | undefined. Fix it before use.

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [selected, setSelected] = useState<OptionSelected[]>([]);

<MultiDropdown
  messages={{ selectAll: "Select all but first" }}
  onSelectAll={(options) => setSelected(options.slice(1))}
>
  ...
</MultiDropdown>
```

### Custom selection

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; customValue: string | null; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; co. Fix it before use.

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [selected, setSelected] = useState<OptionSelected[]>([]);

<MultiDropdown
  customValue={
    selected.length
      ? `Selected characters: ${selected
          .map((option) => option.title)
          .join(", ")}`
      : null
  }
>
  ...
</MultiDropdown>
```

### Dismiss

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; dismissValues: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSi. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown dismissValues>
  ...
</MultiDropdown>
```

### Disabled

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; disabled: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: . Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown disabled>
  ...
</MultiDropdown>
```

### Loading

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; loading: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: S. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown loading>
  ...
</MultiDropdown>
```

### Error

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; error: true; messages: { error: string; }; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | Control. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown
  error
  messages={{ error: "An error occurred when retrieving the list." }}
>
  ...
</MultiDropdown>
```

### Borderless

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; borderless: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown borderless>
  ...
</MultiDropdown>
```

### Horizontal origin

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; horizontalOrigin: "left"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; cont. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown horizontalOrigin="left">
  ...
</MultiDropdown>
<MultiDropdown horizontalOrigin="right">
  ...
</MultiDropdown>
```

### Upward

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; direction: "up"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?:. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown direction="up">
  ...
</MultiDropdown>
```

### Options with description

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Size | undefine. Fix it before use.

```tsx
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown>
  <Option description="The Dark Knight" />
</MultiDropdown>
```

### Option disabled

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Size | undefine. Fix it before use.

```tsx
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown>
  <Option disabled />
</MultiDropdown>
```

### Option with border

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Size | undefine. Fix it before use.

```tsx
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown>
  <Option borderBottom />
</MultiDropdown>
```

### Options with icon

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: (string | Element)[]; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Si. Fix it before use.

```tsx
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";
import Icon from "@talkdesk/cobalt-react-icon";

<MultiDropdown>
    <Option icon={<Icon name="..." size="..." />} />
    ...
</MultiDropdown>
```

### Custom option

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Size | undefine. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown>
  <div>whatever content you need</div>
</MultiDropdown>
```

### Searchable

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; searchable: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize. Fix it before use.

```tsx
import MultiDropdown, { Option, Search } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown searchable>
  <Search>
    <Option />
    <Option />
  </Search>
</MultiDropdown>
```

### Controlled searchable

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; searchable: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize. Fix it before use.

```tsx
import MultiDropdown, { Option, Search } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const options = [
  { title: "Green Arrow", value: "green-arrow" },
  { title: "Batman", value: "batman" },
];

<MultiDropdown searchable>
  <Search>
    {(query) =>
      options
        .filter((option) =>
          option.title.includes(query)
        )
        .map((option) => (
          <Option />
        ))
    }
  </Search>
</MultiDropdown>
```

### Search be filtering

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; searchable: true; onClose: () => void; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | Controlled. Fix it before use.

```tsx
import React, { useState } from "react";
import MultiDropdown, { Option, Search } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [search, setSearch] = useState("");

<MultiDropdown searchable onClose={() => setSearch("")}>
  <Search onChangeSearch={setSearch} onSearch={null}>
    <Option />
    <Option />
  </Search>
</MultiDropdown>
```

### With action

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element[]; renderSelectAll: false; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; con. Fix it before use.

```tsx
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import { Text } from "@talkdesk/cobalt-react-typography";
import { Action, Actions } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown, { Option, SelectAll } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown renderSelectAll={false}>
  <Actions>
    <Action onClick={...}>First action</Action>
    <Action onClick={...}>
      <Flex gap="2">
        <Icon name="add" size="tiny" />
        <Text inline>
          This is a custom action. You can render anything here
        </Text>
      </Flex>
    </Action>
  </Actions>
  <SelectAll />
  <Option />
  <Option />
</MultiDropdown>
```

### Load more

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element[]; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Size | undefi. Fix it before use.

```tsx
import { LoadMore } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const loading = false;
const error = false;
const hasMoreToLoad = true;

<MultiDropdown>
  <Option />
  <Option />
  <LoadMore onLoad={() => {}} loading={loading} error={error} visible={hasMoreToLoad} />
</MultiDropdown>
```

### Content sizes

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; borderless: true; contentSize: "small"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | Controlled. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown borderless contentSize="small">
  ...
</MultiDropdown>
<MultiDropdown borderless contentSize="medium">
  ...
</MultiDropdown>
<MultiDropdown borderless contentSize="large">
  ...
</MultiDropdown>
```

### Input sizes

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; inputSize: "small"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSiz. Fix it before use.

```tsx
import MultiDropdown from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown inputSize="small">
  ...
</MultiDropdown>
<MultiDropdown inputSize="medium">
  ...
</MultiDropdown>
```

### Group options

```tsx
import React, { useState } from "react";
import { GroupOptions, OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [selected, setSelected] = useState<OptionSelected[]>([]);

const groups = [
  {
    groupName: "Movies",
    items: [
      { title: "Spider Man", value: "spider-man" },
      { title: "Batman", value: "batman" },
    ],
  },
  {
    groupName: "Series",
    items: [
      { title: "Mr Robot", value: "mr-robot" },
      { title: "The Office", value: "the-office" },
    ],
  },
];

<MultiDropdown
  items={([] as OptionSelected[]).concat(
    [],
    ...groups.map(({ items }) => [
      ...items.map((item) => ({
        title: item.title,
        value: item.value,
      })),
    ])
  )}
  onChange={setSelected}
  selectedValues={selected}
>
  {({ onClick }) =>
    groups.map(({ groupName, items }, index) => (
      <GroupOptions
        key={groupName}
        borderBottom={index !== groups.length - 1}
        title={groupName}
      >
        {items.map((item) => (
          <Option
            key={item.value}
            selected={selected.some(({ value }) => value === item.value)}
            value={item.value}
            title={item.title}
            onClick={onClick}
          />
        ))}
      </GroupOptions>
    ))
  }
</MultiDropdown>
```

### Selectable group options

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import MultiDropdown, {
  NestedOptions,
  Option,
  addNewSelectedOptions,
  removeSelectedOptions
} from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

const [selected, setSelected] = useState<OptionSelected[]>([]);

const groups = [
  {
    groupName: "Movies",
    items: [
      { title: "Spider Man", value: "spider-man" },
      { title: "Batman", value: "batman" },
    ],
  },
  {
    groupName: "Series",
    items: [
      { title: "Mr Robot", value: "mr-robot" },
      { title: "The Office", value: "the-office" },
    ],
  },
];

<MultiDropdown
  items={([] as OptionSelected[]).concat(
    [],
    ...groupedOptions.map(({ items }) => [
      ...items.map((item) => ({
        title: item.title,
        value: item.value,
      })),
    ])
  )}
  onChange={setSelected}
  selectedValues={selected}
>
  {({ onClick }) =>
    groupedOptions.map(({ groupName, items }) => (
      <NestedOptions
        key={groupName}
        selectedItems={
          items.filter(({ value }) =>
            selected.some(
              ({ value: valueSelected }) => valueSelected === value
            )
          ).length
        }
        value={groupName}
        title={groupName}
        totalItems={items.length}
        onClick={(_, isSelected) => {
          setSelected((prevSelected) =>
            !isSelected
              ? removeSelectedOptions(prevSelected, items)
              : addNewSelectedOptions(prevSelected, items)
          );
        }}
      >
        {items.map((item) => (
          <Option
            key={item.value}
            selected={selected.some(({ value }) => value === item.value)}
            value={item.value}
            title={item.title}
            onClick={onClick}
          />
        ))}
      </NestedOptions>
    ))
  }
</MultiDropdown>
```

### Option right side

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren; contentSize?: Size | undefine. Fix it before use.

```tsx
import MultiDropdown, { Option } from "@talkdesk/cobalt-marketplace-react-multi-dropdown";

<MultiDropdown>
  <Option right={<span>A</span>} />
</MultiDropdown>
```

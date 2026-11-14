# Dropdown

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-dropdown`
>
> Not the same as [Dropdown (Cobalt core)](../../../components/core/dropdown/dropdown.md), `@talkdesk/cobalt-react-dropdown`: a separate package with its own API. Check which one the code imports before using either.

## Install (v3.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-dropdown
```

```tsx
import Dropdown, { Option, useDropdown, Input } from "@talkdesk/cobalt-marketplace-react-dropdown";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-dropdown-stories--default)

## Known gaps

Read before using it:

* Dropdown's types make onChange required, and most of its examples leave it out, so they don't compile. Always pass onChange.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-dropdown`](../../../components/core/dropdown/dropdown.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-list`](../../../components/core/list/list.md), [`@talkdesk/cobalt-react-outside-click-hook`](../../../hooks/core/outside-click-hook/outside-click-hook.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

Dropdown is a Cobalt Marketplace component. It is a separate package from the Cobalt core [Dropdown](/components/core/dropdown/), with its own API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance is on the Cobalt core [Dropdown](/components/core/dropdown/) page. This marketplace package has its own API: see the Code tab, and check which of the two packages your code already imports before using either.

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

### Dropdown

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `aria-labelledby` | string |  | no |  | For accessibility. Identifies the element (or elements) that labels the current element. @see aria-describedby. |
| `contentSize` | enum | `small`, `medium`, `large` | no |  |  |
| `customInput` | ReactElement<any, string \| JSXElementConstructor<any>> |  | no |  | Element that replaces the default dropdown input |
| `defaultOpen` | boolean |  | no | false |  |
| `disabled` | boolean |  | no | false |  |
| `dismissible` | boolean |  | no | false |  |
| `error` | boolean |  | no | false |  |
| `horizontalOrigin` | enum | `left`, `right` | no |  | Defines the horizontal origin for the dropdown content |
| `inputSize` | enum | `small`, `medium` | no |  |  |
| `loading` | boolean |  | no | false |  |
| `messages` | { error?: string; placeholder?: string; } |  | no |  | Translation object. If you don't set this, the component will use default values |
| `onChange` | OnChangeOption<T> |  | yes |  |  |
| `onClose` | () => void |  | no |  | Callback called when the dropdown closes |
| `searchable` | boolean |  | no | false |  |
| `value` | ReactNode |  | no |  |  |
| `children` | (ReactNode \| ControlledChildren<T>) & ReactNode |  | no |  |  |
| `borderless` | boolean |  | no |  |  |
| `direction` | Direction | `down`, `up` | no |  |  |
| `height` | Height<string \| number> |  | no |  | Defines the height of the dropdown. Use any valid value for CSS property. |
| `width` | Width<string \| number> |  | no |  | Defines the width of the dropdown. Use any valid value for CSS property. |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |
| `onBlur` | () => void |  | no |  |  |

### Option

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `borderBottom` | boolean |  | no | false |  |
| `color` | string |  | no |  |  |
| `description` | string |  | no |  |  |
| `disabled` | boolean |  | no | false |  |
| `icon` | "description" \| "1" \| "priority_1" \| "2" \| "priority_2" \| "8" \| "priority_8" \| "9" \| "priority_9" \| "360" \| "notification_add" \| "applause" \| "applause_border" \| "error" \| "error_circle" \| ... 1088 more ... \| Element |  | no |  |  |
| `onClick` | OnChangeOption |  | no |  |  |
| `selected` | boolean |  | no | false |  |
| `title` | string \| number |  | yes |  |  |
| `value` | string \| number |  | yes |  |  |
| `right` | ReactNode |  | no |  |  |

### Input

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `dismissible` | boolean |  | no |  |  |
| `error` | boolean |  | yes |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | yes |  |  |
| `loading` | boolean |  | yes |  |  |
| `onClear` | MouseEventHandler<HTMLElement> |  | no |  |  |
| `onClick` | MouseEventHandler<HTMLDivElement> |  | yes |  |  |
| `open` | boolean |  | yes |  |  |
| `placeholder` | string |  | yes |  |  |
| `children` | ReactNode |  | no |  |  |
| `disabled` | boolean |  | no |  |  |
| `size` | Size | `small`, `medium` | no |  |  |
| `variation` | Variation | `error`, `warning`, `unstyled` | no |  |  |
| `onBlur` | () => void |  | no |  |  |

## Examples

_0 of 26 compile against the published `@talkdesk/cobalt-marketplace-react-dropdown@3.2.2` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** the published types reject it: This comparison appears to be unintentional because the types '{ title: string | number; value: string | number | null; icon?: Element | undefined; }' and 'string' have no overlap.. Fix it before use.

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

const [selected, setSelected] = useState<OptionSelected>({
  value: "",
  title: "",
});

<p id="dropdown-label">Dropdown</p>
<Dropdown
  onChange={(option) => setSelected(option)}
  value={selected.title}
  aria-labelledby="dropdown-label"
>
  <Option
    selected={selected === "green-arrow"}
    title="Green Arrow"
    value="green-arrow"
  />
  <Option
    selected={selected === "batman"}
    title="Batman"
    value="batman"
  />
</Dropdown>
```

### Controlled render

> **Doesn't compile:** the published types reject it: Type '({ onClick, setIsOpen }: { onClick: OnChangeOption<unknown>; setIsOpen: (open: boolean) => void; }) => Element' is not assignable to type '((string | number | boolean | ReactElement<any, string . Fix it before use.

```tsx
import React, { useState } from "react";
import { OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

const [selected, setSelected] = useState<OptionSelected>({
  value: "",
  title: "",
});

const options = [
  { title: "Green Arrow", value: "green-arrow" },
  { title: "Batman", value: "batman" },
];

<Dropdown
  onChange={(option) => setSelected(option)}
  value={selected.title}
>
  {({ onClick, setIsOpen }) => (
    <>
      {options.map((option) => (
        <Option
          key={option.value}
          onClick={onClick}
          selected={selected.value === option.value}
          title={option.title}
          value={option.value}
        />
      ))}
      <Option
        onClick={() => setIsOpen(false)}
        title="I do nothing, just close the dropdown :("
        value="nothing"
      />
    </>
  )}
</Dropdown>
```

### Disabled

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; disabled: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; conte. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown disabled>
  ...
</Dropdown>
```

### Loading

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; loading: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; conten. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown loading>
  ...
</Dropdown>
```

### Selected

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size |. Fix it before use.

```tsx
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <Option selected />
</Dropdown>
```

### Error

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; error: true; messages: { error: string; }; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | Control. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown
  error
  messages={{ error: "An error occurred when retrieving the list." }}
>
  ...
</Dropdown>
```

### Dismissible

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; dismissible: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; co. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown dismissible>
  ...
</Dropdown>
```

### Borderless

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; borderless: true; contentSize: "small"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | Controlled. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown borderless contentSize="small">
  ...
</Dropdown>
```

### Horizontal origin

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; borderless: true; contentSize: "small"; direction: "down"; horizontalOrigin: "left"; }' but required in type '{ "aria-labelledby"?: string |. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown borderless contentSize="small" direction="down" horizontalOrigin="left">
  ...
</Dropdown>
<Dropdown borderless contentSize="small" direction="up" horizontalOrigin="left">
  ...
</Dropdown>
<Dropdown borderless contentSize="small" direction="down" horizontalOrigin="right">
  ...
</Dropdown>
<Dropdown borderless contentSize="small" direction="up" horizontalOrigin="right">
  ...
</Dropdown>
```

### Upward

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; direction: "up"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; cont. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown direction="up">
  ...
</Dropdown>
```

### Options with description

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size |. Fix it before use.

```tsx
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <Option description="The Dark Knight" />
</Dropdown>
```

### Option disabled

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size |. Fix it before use.

```tsx
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <Option disabled />
</Dropdown>
```

### Option with icon

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element[]; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size. Fix it before use.

```tsx
import Flag from "@talkdesk/cobalt-react-flag";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <Option icon="person" />
  <Option icon={<Flag code="pt" size="tiny" />} />
</Dropdown>
```

### Option with border

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size |. Fix it before use.

```tsx
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <Option borderBottom />
</Dropdown>
```

### Custom option

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size |. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <div>whatever content you need</div>
</Dropdown>
```

### Option right side

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size |. Fix it before use.

```tsx
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
  <Option right={<span>A</span>} />
</Dropdown>
```

### Searchable

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; searchable: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; co. Fix it before use.

```tsx
import { Search } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown searchable>
  <Search>
    <Option />
    <Option />
  </Search>
</Dropdown>
```

### Controlled searchable

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; searchable: true; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; co. Fix it before use.

```tsx
import { Search } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

const options = [
  { title: "Green Arrow", value: "green-arrow" },
  { title: "Batman", value: "batman" },
];

<Dropdown searchable>
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
</Dropdown>
```

### Search be filtering

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element; searchable: true; onClose: () => void; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | Controlled. Fix it before use.

```tsx
import React, { useState } from "react";
import { Search } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

const [search, setSearch] = useState("");

<Dropdown searchable onClose={() => setSearch("")}>
  <Search onChangeSearch={setSearch} onSearch={null}>
    <Option />
    <Option />
  </Search>
</Dropdown>
```

### With action

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element[]; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size. Fix it before use.

```tsx
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import { Text } from "@talkdesk/cobalt-react-typography";
import { Action, Actions } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown>
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
  <Option />
  <Option />
</Dropdown>
```

### Load more

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element[]; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; contentSize?: Size. Fix it before use.

```tsx
import { LoadMore } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

const loading = false;
const error = false;
const hasMoreToLoad = true;

<Dropdown>
  <Option />
  <Option />
  <LoadMore onLoad={() => {}} loading={loading} error={error} visible={hasMoreToLoad} />
</Dropdown>
```

### Content sizes

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; contentSize: "small"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>;. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown contentSize="small">
  ...
</Dropdown>
<Dropdown contentSize="medium">
  ...
</Dropdown>
<Dropdown contentSize="large">
  ...
</Dropdown>
```

### Input sizes

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: string; inputSize: "small"; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknown>; c. Fix it before use.

```tsx
import Dropdown from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown inputSize="small">
  ...
</Dropdown>
<Dropdown inputSize="medium">
  ...
</Dropdown>
```

### Custom input

> **Doesn't compile:** the published types reject it: Property 'onChange' is missing in type '{ children: Element[]; customInput: Element; }' but required in type '{ "aria-labelledby"?: string | undefined; children?: ReactNode | ControlledChildren<unknow. Fix it before use.

```tsx
import Button from "@talkdesk/cobalt-react-button";
import { Text } from "@talkdesk/cobalt-react-typography";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

<Dropdown
  customInput={
    <Button size="small" type="secondary">
      <Text>Import something</Text>
    </Button>
  }
>
  <Option />
  <Option />
</Dropdown>
```

### Group options

> **Doesn't compile:** the published types reject it: Type '({ onClick }: { onClick: OnChangeOption<ExtraPropsOnChange>; setIsOpen: (open: boolean) => void; }) => Element[]' is not assignable to type '((string | number | boolean | ReactElement<any, strin. Fix it before use.

```tsx
import React, { useState } from "react";
import { Text } from "@talkdesk/cobalt-react-typography";
import { GroupOptions, OptionSelected } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
import Dropdown, { Option } from "@talkdesk/cobalt-marketplace-react-dropdown";

type ExtraPropsOnChange = { groupName?: string };

const [selected, setSelected] = useState<OptionSelected<ExtraPropsOnChange>>({
  value: "",
  title: "",
});

const groups = [
  {
    groupName: "Movies",
    items: [
      {
        title: "Spider Man",
        value: "spider-man",
        description:
          "Spider-Man is a superhero created by writer-editor Stan Lee and writer-artist Steve Ditko.",
      },
      {
        title: "Batman",
        value: "batman",
        description:
          "Batman was created by artist Bob Kane and writer Bill Finger, and debuted in the 27th issue of the comic book Detective Comics on March 30, 1939.",
      },
    ],
  },
  {
    groupName: "Series",
    items: [
      {
        title: "Mr Robot",
        value: "mr-robot",
        description:
          "Mr. Robot is an American drama thriller television series created by Sam Esmail for USA Network.",
      },
      {
        title: "The Office",
        value: "the-office",
        description:
          "The Office is an American mockumentary sitcom television series that depicts the everyday work lives of office employees in the Scranton, Pennsylvania.",
      },
    ],
  },
];

<Dropdown<ExtraPropsOnChange>
  onChange={(option) => setSelected(option)}
  value={
    selected.title && (
      <>
        <Text inline color="gray" weight="medium">
          {selected.groupName}:{" "}
        </Text>
        <Text inline>{selected.title}</Text>
      </>
    )
  }
>
  {({ onClick }) =>
    groups?.map(({ groupName, items }) => (
      <GroupOptions key={groupName} title={groupName}>
        {items?.map((item) => (
          <Option
            key={item.value}
            selected={selected.value === item.value}
            title={item.title}
            value={item.value}
            description={item.description}
            onClick={(option) => onClick({ ...option, groupName })}
          />
        ))}
      </GroupOptions>
    ))
  }
</Dropdown>
```

### Input group

> **Doesn't compile:** the published types reject it: Module '"@talkdesk/cobalt-react-input-group"' has no exported member 'Item'.. Fix it before use.

```tsx
import Dropdown, { Input, useDropdown } from "@talkdesk/cobalt-marketplace-react-dropdown";
import InputGroup, { Item } from "@talkdesk/cobalt-react-input-group";

function MyCustomInput() {
  const { inputProps } = useDropdown();

  return (
    <Input
      {...inputProps}
      variation="unstyled"
    />
  );
}

<InputGroup>
  <Item>
    <Dropdown
      borderless
      width="100%"
      height="100%"
      customInput={<MyCustomInput />}
    >
      ...
    </Dropdown>
  </Item>
</InputGroup>
```

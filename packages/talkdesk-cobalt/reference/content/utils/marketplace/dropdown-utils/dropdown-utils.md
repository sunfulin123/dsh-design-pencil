# DropdownUtils

> **Cobalt Marketplace** util · `@talkdesk/cobalt-marketplace-react-dropdown-utils`

## Install (v3.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-dropdown-utils
```

```tsx
import { Action, Actions, DropdownError, GenericOption, GroupOptions, Input, LoadMore, OptionsWrapper, useDropdown, Search, useKeyboard, Keys } from "@talkdesk/cobalt-marketplace-react-dropdown-utils";
```

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-dropdown`](../../../components/core/dropdown/dropdown.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-list`](../../../components/core/list/list.md), [`@talkdesk/cobalt-react-spinner`](../../../components/core/spinner/spinner.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md), [`@talkdesk/cobalt-react-viewport-provider`](../../../providers/core/viewport-provider/viewport-provider.md).

## Props

### Action

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `disabled` | boolean |  | no |  |  |
| `onClick` | MouseEventHandler<HTMLAnchorElement> |  | yes |  |  |
| `children` | ReactNode |  | yes |  |  |

### Actions

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |

### DropdownError

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | string |  | yes |  |  |

### GenericOption

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | no |  | @deprecated Use `left` instead. Can't be combined with `left`: pass one or the other. |
| `color` | string |  | no |  |  |
| `left` | ReactNode |  | no |  | Can't be combined with `children`: pass one or the other. |
| `right` | ReactNode |  | no |  |  |
| `description` | string |  | no |  |  |
| `disabled` | boolean |  | no | false |  |
| `style` | CSSProperties |  | no |  |  |
| `title` | string \| number |  | yes |  |  |

### GroupOptions

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `borderBottom` | boolean |  | no | false |  |
| `title` | ReactNode |  | yes |  |  |
| `children` | ReactNode |  | yes |  |  |

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

### LoadMore

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `onLoad` | () => void |  | yes |  |  |
| `visible` | boolean |  | no | false |  |
| `loading` | boolean |  | no | false |  |
| `error` | boolean |  | no | false |  |
| `messages` | { error?: string; loading?: string; loadMore?: string; tryAgain?: string; } |  | no |  | Translation object. If you don't set this, the component will use default values |

### OptionsWrapper

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `role` | string |  | no |  |  |
| `children` | ReactNode |  | no |  |  |

### Search

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `autoFocus` | boolean |  | no |  |  |
| `messages` | { noResults?: string; placeholder?: string; } |  | no |  | Translation object. If you don't set this, the component will use default values |
| `onChangeSearch` | (query: string) => void |  | no |  | Callback that gives you the current search text. Useful if you are doing the filtering in the BE |
| `onClick` | OnChangeOption |  | no |  | This is an internal prop that is passed automatically. Avoid using it |
| `onSearch` | (query: string, children: ReactNode) => ReactNode |  | no | (query: string, children: ReactNode) => {   return React.Children.toArray(children).filter((child) => {     const title = (child as any).props.title;      if (!title) {       return false;     }      return title.toLowerCase().includes(query.toLowerCase());   }); } | If you don't want the filtering to be done in the FE, you should set this prop to `undefined` and use the prop `onChangeSearch` to have access to the search value |
| `children` | ReactNode \| ControlledChildren |  | no |  |  |

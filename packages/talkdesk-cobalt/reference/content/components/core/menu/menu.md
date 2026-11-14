# Menu

> **Cobalt core** component · `@talkdesk/cobalt-react-menu`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.2.3)

```sh
npm install @talkdesk/cobalt-react-menu
```

```tsx
import { Menu, MenuItem, MenuSection, MenuTrigger } from "@talkdesk/cobalt-react-menu";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-menu-docs--docs)

## Known gaps

Read before using it:

* Opens in a layer at the end of <body>, outside ThemeProvider's <div>, so without the theme stylesheet it loses the theme: text falls back to the browser's serif font and the theme variables don't resolve. Import @talkdesk/cobalt-theme-base/dist/styles.css and set the body font from it, as in Get started › Develop.
* The header has no background: the menu's popover is transparent and only the list of items below the header is filled, so whatever is behind the menu shows through the header's text. Until that's fixed, use a MenuSection title instead of header.

## Guidance

Menu is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Menu yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Menu

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `small`, `medium`, `large` | no |  |  |
| `placement` | enum | `bottom`, `bottom left`, `bottom right`, `bottom start`, `bottom end`, `top`, `top left`, `top right`, `top start`, `top end`, `left`, `left top`, `left bottom`, `start`, `start top`, `start bottom`, `right`, `right top`, `right bottom`, `end`, `end top`, `end bottom` | no |  | Where the menu's popover opens relative to its trigger. Accepts react-aria `Placement` values (e.g. `"bottom start"`, `"top end"`); `start`/`end` are RTL-aware. Defaults to react-aria's own placement for the surrounding trigger (`"bottom start"` for `MenuTrigger`, `"end top"` for `SubmenuTrigger`) unless overridden here. The popover still flips automatically when there isn't room on the chosen side. |
| `header` | ReactNode |  | no |  | Non-interactive content shown above the menu's items, outside the selectable/keyboard-navigable collection entirely. |
| `selectionMode` | enum | `none`, `single`, `multiple` | no |  |  |
| `selectedKey` | Key |  | no |  |  |
| `defaultSelectedKey` | Key |  | no |  |  |
| `onSelectionChange` | ((key: Key) => void) \| ((keys: Selection) => void) |  | no |  | Called when the selection changes. Receives a `Set<Key>`, or the string `"all"` when the user selects every item (e.g. via Ctrl/Cmd+A) — check for `"all"` before treating the argument as an iterable of keys. |
| `selectedKeys` | Selection |  | no |  | Currently selected keys. A `Set<Key>`, or the string `"all"` when every item is selected — `"all"` is a sticky sentinel (it keeps future items selected too) rather than an enumerated set, so handle it explicitly. |
| `defaultSelectedKeys` | Selection |  | no |  | Initially selected keys for an uncontrolled menu. See `selectedKeys`. |
| `escapeKeyBehavior` | "clearSelection" \| "none" | `clearSelection`, `none` | no |  | Whether pressing the escape key should clear selection in the menu or not.  Most experiences should not modify this option as it eliminates a keyboard user's ability to easily clear selection. Only use if the escape key is being handled externally or should not trigger selection clearing contextually. @default 'clearSelection' |
| `shouldFocusWrap` | boolean |  | no |  | Whether keyboard navigation is circular. |
| `onAction` | (key: Key, value: T) => void |  | no |  | Handler that is called when an item is selected. |
| `onClose` | () => void |  | no |  | Handler that is called when the menu should close after selecting an item. |
| `items` | Iterable<T> |  | no |  | Item objects in the collection. |
| `disabledKeys` | Iterable<Key> |  | no |  | The item keys that are disabled. These items cannot be selected, focused, or otherwise interacted with. |
| `disallowEmptySelection` | boolean |  | no |  | Whether the collection allows empty selection. |
| `className` | ClassNameOrFunction<MenuRenderProps> & string |  | no |  | The CSS [className](https://developer.mozilla.org/en-US/docs/Web/API/Element/className) for the element. A function may be provided to compute the class based on component state. @default 'react-aria-Menu' |
| `renderEmptyState` | () => ReactNode |  | no |  | Provides content to display when there are no items in the menu. |
| `shouldCloseOnSelect` | boolean |  | no |  | Whether the menu should close when the menu item is selected. |
| `dependencies` | readonly any[] |  | no |  | Values that should invalidate the item cache when using dynamic collections. |

### MenuItem

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `icon` | enum | 1,129 icon names, one per line in [icon-values.txt](icon-values.txt) | no |  | Leading icon, shown before `prefix` and the label. Only rendered in non-selectable menus — single- and multiple-selection menus reserve this part of the slot for the selection checkmark and ignore `icon`. |
| `prefix` | ReactNode |  | no |  | Leading content, shown after `icon`/the selection checkmark and before the label. Unlike `icon`, it is not suppressed by selection mode. |
| `suffix` | ReactNode |  | no |  | Trailing content, shown before any automatically-rendered trailing icon (the submenu chevron, or the external-link icon). |
| `description` | ReactNode |  | no |  |  |
| `menu` | ReactElement<Props, string \| JSXElementConstructor<any>> |  | no |  | A submenu to open from this item. When set, the item becomes a submenu trigger (its `onAction` and selection are inert) and renders a trailing chevron. Can't be combined with `href` or `hrefLang` or `target` or `rel` or `download` or `ping` or `referrerPolicy`: pass one or the other. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `value` | object |  | no |  | The object value that this item represents. When using dynamic collections, this is set automatically. |
| `textValue` | string |  | no |  | A string representation of the item's contents, used for features like typeahead. |
| `isDisabled` | boolean |  | no |  | Whether the item is disabled. |
| `onAction` | () => void |  | no |  | Handler that is called when the item is selected. |
| `shouldCloseOnSelect` | boolean |  | no |  | Whether the menu should close when the menu item is selected. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `children` | ReactNode |  | no |  |  |
| `href` | string |  | no |  | A URL to link to. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href). Can't be combined with `menu`: pass one or the other. |
| `hrefLang` | string |  | no |  | Hints at the human language of the linked URL. See[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#hreflang). Can't be combined with `menu`: pass one or the other. |
| `target` | HTMLAttributeAnchorTarget |  | no |  | The target window for the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target). Can't be combined with `menu`: pass one or the other. |
| `rel` | string |  | no |  | The relationship between the linked resource and the current page. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel). Can't be combined with `menu`: pass one or the other. |
| `download` | string \| boolean |  | no |  | Causes the browser to download the linked URL. A string may be provided to suggest a file name. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download). Can't be combined with `menu`: pass one or the other. |
| `ping` | string |  | no |  | A space-separated list of URLs to ping when the link is followed. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#ping). Can't be combined with `menu`: pass one or the other. |
| `referrerPolicy` | HTMLAttributeReferrerPolicy | ``, `no-referrer`, `no-referrer-when-downgrade`, `origin`, `origin-when-cross-origin`, `same-origin`, `strict-origin`, `strict-origin-when-cross-origin`, `unsafe-url` | no |  | How much of the referrer to send when following the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#referrerpolicy). Can't be combined with `menu`: pass one or the other. |
| `routerOptions` | never |  | no |  | Options for the configured client side router. |

### MenuSection

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | string |  | no |  |  |
| `shouldCloseOnSelect` | boolean |  | no |  | Whether the menu should close when the menu item is selected. |
| `value` | T |  | no |  | The object value that this section represents. When using dynamic collections, this is set automatically. |
| `dependencies` | readonly any[] |  | no |  | Values that should invalidate the item cache when using dynamic collections. |
| `items` | Iterable<T> |  | no |  | Item objects in the section. |
| `selectionMode` | SelectionMode | `none`, `single`, `multiple` | no |  | The type of selection that is allowed in the collection. |
| `disallowEmptySelection` | boolean |  | no |  | Whether the collection allows empty selection. |
| `selectedKeys` | "all" \| Iterable<Key> |  | no |  | The currently selected keys in the collection (controlled). |
| `defaultSelectedKeys` | "all" \| Iterable<Key> |  | no |  | The initial selected keys in the collection (uncontrolled). |
| `onSelectionChange` | (keys: Selection) => void |  | no |  | Handler that is called when the selection changes. |

## Examples

_19 of 19 compile against the published `@talkdesk/cobalt-react-menu@1.2.3` (React 18, TypeScript strict)._

### Basic

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu>
    <MenuItem id="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem id="duplicate" onAction={() => duplicate()}>Duplicate</MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Selection mode single

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Sort by</Button>
  <Menu selectionMode="single" selectedKey={sortKey} onSelectionChange={setSortKey}>
    <MenuItem id="newest">Newest first</MenuItem>
    <MenuItem id="oldest">Oldest first</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Selection mode multiple

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Columns</Button>
  <Menu selectionMode="multiple" selectedKeys={columns} onSelectionChange={setColumns}>
    <MenuItem id="name">Name</MenuItem>
    <MenuItem id="status">Status</MenuItem>
    <MenuItem id="owner">Owner</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Disabled items

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu disabledKeys={["delete"]}>
    <MenuItem id="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem id="duplicate" onAction={() => duplicate()}>Duplicate</MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Empty state

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger defaultOpen>
  <Button type="secondary">Actions</Button>
  <Menu renderEmptyState={() => "No actions available"} />
</MenuTrigger>;
```

### Sizes

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu size="small">
    <MenuItem id="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem id="duplicate" onAction={() => duplicate()}>Duplicate</MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Leading icons

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu>
    <MenuItem id="edit" icon="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem id="duplicate" icon="copy" onAction={() => duplicate()}>Duplicate</MenuItem>
    <Divider />
    <MenuItem id="delete" icon="delete_outline" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Prefix and suffix

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";
import { Tag } from "@talkdesk/cobalt-react-tag";

// `prefix`/`suffix` accept arbitrary content (not just icon names, unlike
// `icon`). `suffix` renders before any automatically-rendered trailing
// icon, so it works alongside the external-link icon and the submenu
// chevron without any extra configuration.
<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu>
    <MenuItem id="edit" icon="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem
      id="notifications"
      description="3 unread since yesterday"
      suffix={<Tag color="light-gray" size="small">12</Tag>}
    >
      Notifications
    </MenuItem>
    <MenuItem
      id="docs"
      href="https://docs.example.com"
      target="_blank"
      rel="noreferrer"
      suffix={<Tag color="theme" size="small">New</Tag>}
    >
      Documentation
    </MenuItem>
    <MenuItem
      id="share"
      suffix={<Tag color="light-gray" size="small">3</Tag>}
      menu={
        <Menu>
          <MenuItem id="email" onAction={() => shareByEmail()}>Email</MenuItem>
          <MenuItem id="link" onAction={() => copyLink()}>Copy link</MenuItem>
        </Menu>
      }
    >
      Share
    </MenuItem>
  </Menu>
</MenuTrigger>;

// Unlike `icon`, `prefix` is not suppressed by selection mode — it renders
// alongside the selection checkmark. This is how to show an icon per item in
// a selectable menu.
<MenuTrigger>
  <Button type="secondary">Priority</Button>
  <Menu selectionMode="single" selectedKey={priority} onSelectionChange={setPriority}>
    <MenuItem
      id="urgent"
      prefix={<Icon name="flag" size="tiny" />}
      description="Needs attention within 1 hour"
    >
      Urgent
    </MenuItem>
    <MenuItem id="normal" prefix={<Icon name="check_circle" size="tiny" />}>Normal</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Description

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Reports</Button>
  <Menu>
    <MenuItem
      id="q3-report"
      icon="file_document"
      description="Last generated 2 days ago"
      onAction={() => openReport()}
    >
      Q3 financial report
    </MenuItem>
    <MenuItem
      id="roadmap"
      description="Shared with the engineering team"
      onAction={() => openRoadmap()}
    >
      Roadmap
    </MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Shortcuts

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import { Shortcut } from "@talkdesk/cobalt-react-shortcut";

// A `Shortcut` passed as `suffix` is wired by React Aria into the item's
// aria-describedby, so assistive tech announces it as part of the item's
// description. aria-keyshortcuts is passed too, even though React Aria
// currently drops it, so nothing needs to change if it starts supporting it.
<MenuTrigger>
  <Button type="secondary">File</Button>
  <Menu>
    <MenuItem id="save" aria-keyshortcuts="Meta+S" suffix={<Shortcut>meta+s</Shortcut>} onAction={() => save()}>
      Save
    </MenuItem>
    <MenuItem id="save-as" aria-keyshortcuts="Meta+Shift+S" suffix={<Shortcut>meta+shift+s</Shortcut>} onAction={() => saveAs()}>
      Save as...
    </MenuItem>
    <Divider />
    <MenuItem id="close" aria-keyshortcuts="Meta+W" suffix={<Shortcut>meta+w</Shortcut>} onAction={() => close()}>
      Close
    </MenuItem>
  </Menu>
</MenuTrigger>;
```

### Truncated labels

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import { Text } from "@talkdesk/cobalt-react-typography";

// MenuItem doesn't truncate its label by default — a long label wraps or
// overflows a fixed-width menu instead. Wrap it in a truncated Text to get
// an ellipsis. `inline` renders a <span> so it composes inside the item's
// flex row, and `title` restores the full label as a tooltip since the
// ellipsis is purely visual.
<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu size="small">
    <MenuItem id="report" onAction={() => openReport()}>
      <Text inline truncated title="Q3 financial performance summary">
        Q3 financial performance summary
      </Text>
    </MenuItem>
    <MenuItem id="roadmap" onAction={() => openRoadmap()}>
      <Text inline truncated title="Roadmap and engineering priorities">
        Roadmap and engineering priorities
      </Text>
    </MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Dynamic items

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

// `items` + a render-function child builds the menu from data instead of
// static JSX. Each item's `id` becomes its key, and is what drives
// `selectedKey`, `disabledKeys`, and `onAction` — no separate JSX `key`
// to keep in sync by hand. MenuSection accepts the same items/render pair.
const actions = [
  { id: "edit", label: "Edit" },
  { id: "duplicate", label: "Duplicate" },
  { id: "delete", label: "Delete" },
];

<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu items={actions}>
    {(action) => (
      <MenuItem id={action.id} onAction={() => runAction(action.id)}>
        {action.label}
      </MenuItem>
    )}
  </Menu>
</MenuTrigger>;
```

### Links

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

// Give a MenuItem an `href` and it renders as a link (an <a>). Standard
// anchor props like `target` and `rel` are forwarded. Items with
// target="_blank" get a trailing open_in_new icon automatically.
<MenuTrigger>
  <Button type="secondary">Account</Button>
  <Menu>
    <MenuItem id="profile" href="/profile">Profile</MenuItem>
    <MenuItem id="docs" href="https://docs.example.com" target="_blank" rel="noreferrer">
      Documentation
    </MenuItem>
    <Divider />
    <MenuItem id="signout" onAction={() => signOut()}>Sign out</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Placement

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

// `placement` accepts react-aria Placement values (start/end are RTL-aware).
// Defaults to "bottom start". The menu still flips when there isn't room.
<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu placement="bottom end">
    <MenuItem id="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem id="duplicate" onAction={() => duplicate()}>Duplicate</MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Submenu

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

// Pass a Menu to a MenuItem's `menu` prop to turn it into a submenu
// trigger. A trailing chevron is added automatically, and each Menu keeps
// its own selection/onAction — levels are independent.
<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu>
    <MenuItem id="edit" onAction={() => edit()}>Edit</MenuItem>
    <MenuItem id="share" menu={
      <Menu>
        <MenuItem id="email" onAction={() => shareByEmail()}>Email</MenuItem>
        <MenuItem id="social" menu={
          <Menu selectionMode="single" selectedKey={network} onSelectionChange={setNetwork}>
            <MenuItem id="x">X</MenuItem>
            <MenuItem id="linkedin">LinkedIn</MenuItem>
          </Menu>
        }>
          Social
        </MenuItem>
      </Menu>
    }>
      Share
    </MenuItem>
    <Divider />
    <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
  </Menu>
</MenuTrigger>;
```

### Submenu positioning

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

// A submenu opens on the inline-end side of its trigger (right in LTR). When
// there isn't room there — e.g. the button sits against the right edge of the
// screen — react-aria automatically flips it to open on the left. No config.
<div style={{ display: "flex", justifyContent: "flex-end", width: "100%" }}>
  <MenuTrigger>
    <Button type="secondary">Actions</Button>
    <Menu>
      <MenuItem id="edit">Edit</MenuItem>
      <MenuItem id="share" menu={
        <Menu>
          <MenuItem id="email">Email</MenuItem>
          <MenuItem id="social" menu={
            <Menu>
              <MenuItem id="x">X</MenuItem>
              <MenuItem id="linkedin">LinkedIn</MenuItem>
            </Menu>
          }>
            Social
          </MenuItem>
        </Menu>
      }>
        Share
      </MenuItem>
      <Divider />
      <MenuItem id="delete">Delete</MenuItem>
    </Menu>
  </MenuTrigger>
</div>;
```

### Sections

```tsx
import { Menu, MenuItem, MenuSection, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";

<MenuTrigger>
  <Button type="secondary">Actions</Button>
  <Menu>
    <MenuSection title="Recent">
      <MenuItem id="report-a">Q3 report</MenuItem>
      <MenuItem id="report-b">Roadmap</MenuItem>
    </MenuSection>
    <Divider />
    <MenuSection title="Actions">
      <MenuItem id="edit" onAction={() => edit()}>Edit</MenuItem>
      <MenuItem id="delete" onAction={() => remove()}>Delete</MenuItem>
    </MenuSection>
  </Menu>
</MenuTrigger>;
```

### Header

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { Text } from "@talkdesk/cobalt-react-typography";

<MenuTrigger>
  <Button type="secondary">App menu</Button>
  <Menu
    header={
      <Flex direction="column" gap={1}>
        <Text weight="medium">Current version: 3.0.2-qa.482.92c2521e8b (DMG)</Text>
        <Text size="small" color="var(--text-description, #475059)">Copyright © 2026 Talkdesk</Text>
      </Flex>
    }
  >
    <MenuItem id="other-versions" href="https://example.com/versions" target="_blank" rel="noreferrer">
      Other versions
    </MenuItem>
  </Menu>
</MenuTrigger>;
```

### RTL

```tsx
import { Menu, MenuItem, MenuTrigger } from "@talkdesk/cobalt-react-menu";
import Button from "@talkdesk/cobalt-react-button";
import Divider from "@talkdesk/cobalt-react-divider";
import { I18nProvider } from "react-aria-components";

// In an RTL locale the whole menu mirrors automatically: leading icons move to
// the right, submenus open to the left, and the submenu chevron flips to point
// left. No extra work is required beyond providing the locale/direction.
<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <MenuTrigger>
      <Button type="secondary">إجراءات</Button>
      <Menu>
        <MenuItem id="edit" icon="edit">تعديل</MenuItem>
        <MenuItem id="share" icon="share" menu={
          <Menu>
            <MenuItem id="email" icon="email">البريد الإلكتروني</MenuItem>
            <MenuItem id="link" icon="link">نسخ الرابط</MenuItem>
          </Menu>
        }>
          مشاركة
        </MenuItem>
      </Menu>
    </MenuTrigger>
  </div>
</I18nProvider>;
```

# Tag

> **Cobalt core** component · `@talkdesk/cobalt-react-tag`
>
> Extended in Cobalt Marketplace by [DismissibleTag](../../../components/marketplace/dismissible-tag/dismissible-tag.md) (`@talkdesk/cobalt-marketplace-react-dismissible-tag`), built on this package.

## Install (v3.0.2)

```sh
npm install @talkdesk/cobalt-react-tag
```

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-tag-docs--docs)

## Known gaps

Read before using it:

* TagGroup's remove button is 12×12px and is named just "Remove" for every tag, so a screen reader can't tell which filter it removes. TagGroup also won't take size tiny or small ("interactive tags are at least 24px"), although that floor applies to the tag, not to its 12px remove target. Designs with 20px removable tags (the Users app filter bar) have to use a standalone small Tag with a clickable Icon and an accessibilityLabel instead. Needs a fix in cobalt: name each remove button after its tag, and either allow a small size or document why not.

## Guidance

Tag is a visually recognizable component that represents a category, a status or an item.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Anatomy

![Tag anatomy: icon, label, X](/assets/tag/anatomy.png)
*Anatomy*

1. **Icon**
2. **Label**
3. **X**: The close x icon will close the tag.

### Variants

#### Sizes

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Colors

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Shapes

Xsmall tags can be circular when they are only-icon. This variation is not interactive and is commonly placed associated to other components, such as, the Avatar by using the BadgeContainer component.

![Circular icon-only tag used as a badge on an Avatar](/assets/tag/shape-only-icon-badge.png)

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

![Dismissible tag with icon+label](/assets/tag/modifier-dismissible-icon-label.png)
*Dismissible tag with icon+label*

  ![Tag with icon+label](/assets/tag/modifier-icon-label.png)
*Tag with icon+label*

  ![Dismissible tag with label](/assets/tag/modifier-dismissible-label.png)
*Dismissible tag with label*

![Tag with label](/assets/tag/modifier-label-only.png)
*Tag with label*

  ![Only-icon tag](/assets/tag/modifier-only-icon.png)
*Only-icon tag*

### Guidelines

#### Group

![Four tags spaced 4px apart horizontally](/assets/tag/group-spacing.png)

Tags should always have **4px** spacing between them, horizontally.

![Tag example — Guidelines Group](/assets/tag/guidelines-group.png)

The horizontal spacing between tags and transparent buttons should be **4px**.

![Tag example — Guidelines Group](/assets/tag/guidelines-group-2.png)

The horizontal spacing between tags and labels should be **8px**.

![Tag example — Guidelines Group](/assets/tag/guidelines-group-3.png)

The horizontal spacing between tags and text should be **8px**.

![Filter name with two descriptive tags and a numeric +1 tag](/assets/tag/group-overflow.png)

When multiple tags are combined and are not all visible, the first 2 tags should be descriptive tags, and the third tag should be numerical, showing the total number of hidden tags. In several use cases when this happened (e.g. in a toolbar), 2 descriptive tags are secondary with a label, and the numeric tag is a primary tag.

![Tag example — Guidelines Group](/assets/tag/guidelines-group-4.png)

When multiple tags are combined and they are all visible, the horizontal spacing between them should be **4px** and the vertical **8px**.

#### Placement

Tags are usually used:

#### Best practices

Please consider checking the [Color | Color usage](https://zeroheight.com/51aaf6147/p/49728f/b/94c676) page when applying different colors in tags.

### Behavior

#### Interaction

User interactions with tags could be initiated by:

* Hover + end when the user leaves the tag area.
* Touch/click + end when the user taps the tag or clicks another area of the screen.

The outcome of an interaction with a tag will depend on the use case.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

Interaction with the close icon of an interactive tag (dismissible tag) independently of its placement (including for tags inside a dropdown input or in a filters toolbar).

  * Initiated by: Click;
  * Outcome: the tag disappears.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/26887e-tag) — Design tab, image 40.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

Interaction with interactive non-descriptive (e.g. +9) tags in a filters toolbar:

  * Initiated by: Hover;
  * Outcome: a tooltip open, identifying the total number of results and showing all results (even the visible ones before the interaction).
  * Initiated by: Click;
  * Outcome: the filters panel opens.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/26887e-tag) — Design tab, image 41.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

Interaction with interactive non-descriptive (e.g. +9) tags.

  * Initiated by: Click
  * Outcome: a popup opens, identifying the total number of results and showing all results (even the visible ones before the interaction).

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/26887e-tag) — Design tab, image 42.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

Interaction with interactive descriptive tags (e.g. status, ring group).

  * Initiated by: Hover;
  * Outcome: a tooltip opens, showing all related content.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/26887e-tag) — Design tab, image 43.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

Interaction with interactive descriptive tags (e.g. status, ring group).

  * Initiated by: Click;
  * Outcome: a popup opens, showing all related content.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/26887e-tag) — Design tab, image 44.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

Interaction with truncated tags.

  * Initiated by: Hover
  * Outcome: a tooltip opens, showing all tag content.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/26887e-tag) — Design tab, image 45.*

#### Text truncation

Tags can be truncated at the end of the copy or in the middle.

* Default truncation:
  * add an ellipsis (…) at the end of the copy.
* Mid truncation can be useful when several tags copy only change at the end or in the beginning.
  * add an ellipsis (…) before a specific number of characters;
  * add an ellipsis (…) after a specific number of characters.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Dimensions

##### Tag maximum width

We set an optional maximum width of:

* **160px** for the small Tag;
* **160px** for the medium Tag;
* **200px** for the large Tag.

In a scenario where you have a longer text, an ellipsis (…) is added to the text in the tag.

![Tag maximum width measurements: 160px, 160px, 200px](/assets/tag/dimensions-max-width.png)

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Tag`

* [Tag](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=130%3A2348\&t=gOZc40T5nvCFtsiX-1) — Core component library

* [Tag handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=93%3A58641\&t=95Pz6d3a8brmlaMB-1) — Handoff guidelines

* [V1 Storybook](https://talkdesk.github.io/cobalt-react-components/?path=/story/chip--all) — Cobalt

* [V2 Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/tag--primary-story) — Cobalt

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

Tags can be helpful in labeling objects for faster recognition. Use tags in moderation as they easily increase the amount of visual noise on a screen — especially when combined with other visual elements.

* Be clear and concise.
  * To choose the right wording, consider first all the tags for that particular product/feature. If there’s a tag named *Completed with errors*, there should be one named *Completed* (and not *Done* or *Successful*).
  * Furthermore, pay attention to the meaning of the words and what they entail. For example, *Suspended* usually implies the ability to resume something whereas *Stopped* doesn’t.
* Avoid line-wrapping and truncating text. If necessary, check guidelines for [text truncation](/components/core/tag/).
* Colors can be used to help distinguish tags more quickly, but can never be the only method to do it. [The wording is absolutely crucial.](https://zeroheight.com/51aaf6147/v/latest/p/36ed56-word-choice/b/405dff)

**Do:** Example of tags with names from the same family: "Completed", "Completed with errors".
![Do example](/assets/tag/content-do-status-names.png)

**Don't:** "Done" and "Unsuccessful" are not antonyms. "Cancelled" should be spelled "Canceled". "Resume" is not a status. "Incomplete" is not the same as "Completed with errors".
![Don't example](/assets/tag/content-dont-status-names.png)

#### Text truncation

Tags can be truncated at the end of the copy or in the middle.

* Default truncation:
  * add an ellipsis (…) at the end of the copy.
* Mid truncation can be useful when several tags copy only change in the end or in the beginning.
  * add an ellipsis (…) before a specific number of characters;
  * add an ellipsis (…) after a specific number of characters.

![Text truncation examples: default truncation and mid truncation](/assets/tag/content-text-truncation-examples.png)
*Text truncation examples*

### Accessibility

### Considerations

#### Development

* Don't convey meaning by color alone — include text.
* If interactive (removable/selectable), expose it as a control with an accessible name.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Tag

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `tiny`, `small`, `medium`, `large` | no |  |  |
| `prefix` | ReactNode |  | no |  |  |
| `color` | "theme" \| "light-theme" \| "gray" \| "light-gray" \| "green" \| "light-green" \| "yellow" \| "light-yellow" \| "orange" \| "light-orange" \| "red" \| "light-red" \| "blue" \| "light-blue" \| ... 6 more ... \| "white" | `theme`, `light-theme`, `gray`, `light-gray`, `green`, `light-green`, `yellow`, `light-yellow`, `orange`, `light-orange`, `red`, `light-red`, `blue`, `light-blue`, `teal`, `light-teal`, `purple`, `light-purple`, `midnight`, `light-midnight`, `white` | no |  |  |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `textValue` | string |  | no |  | A string representation of the tags's contents, used for accessibility. Required if children is not a plain text string. |
| `isDisabled` | boolean |  | no |  | Whether the tag is disabled. |
| `onAction` | () => void |  | no |  | Handler that is called when a user performs an action on the item. The exact user event depends on the collection's `selectionBehavior` prop and the interaction modality. |
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

### TagGroup

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
| `isInvalid` | boolean |  | no |  |  |
| `color` | enum | `theme`, `light-theme`, `gray`, `light-gray`, `green`, `light-green`, `yellow`, `light-yellow`, `orange`, `light-orange`, `red`, `light-red`, `blue`, `light-blue`, `teal`, `light-teal`, `purple`, `light-purple`, `midnight`, `light-midnight`, `white` | no |  | Color applied to every tag in the group (each tag may override it). |
| `size` | enum | `medium`, `large` | no |  | Size applied to every tag in the group. Interactive tags are at least 24px, so `tiny` and `small` are only available to standalone `Tag`s. |
| `listRef` | Ref<HTMLDivElement> |  | no |  | Ref to the element that directly wraps the tags. |
| `escapeKeyBehavior` | "clearSelection" \| "none" | `clearSelection`, `none` | no |  | Whether pressing the escape key should clear selection in the TagGroup or not.  Most experiences should not modify this option as it eliminates a keyboard user's ability to easily clear selection. Only use if the escape key is being handled externally or should not trigger selection clearing contextually. @default 'clearSelection' |
| `onAction` | (key: Key) => void |  | no |  | Handler that is called when a user performs an action on an item. The exact user event depends on the collection's `selectionBehavior` prop and the interaction modality. |
| `selectionBehavior` | SelectionBehavior | `toggle`, `replace` | no |  | How multiple selection should behave in the collection. @default 'toggle' |
| `shouldSelectOnPressUp` | boolean |  | no |  | Whether selection should occur on press up instead of press down. |
| `onRemove` | (keys: Set<Key>) => void |  | no |  | Handler that is called when a user deletes a tag. |
| `disabledKeys` | Iterable<Key> |  | no |  | The item keys that are disabled. These items cannot be selected, focused, or otherwise interacted with. |
| `selectionMode` | SelectionMode | `none`, `single`, `multiple` | no |  | The type of selection that is allowed in the collection. |
| `disallowEmptySelection` | boolean |  | no |  | Whether the collection allows empty selection. |
| `selectedKeys` | Iterable<Key> \| "all" |  | no |  | The currently selected keys in the collection (controlled). |
| `defaultSelectedKeys` | Iterable<Key> \| "all" |  | no |  | The initial selected keys in the collection (uncontrolled). |
| `onSelectionChange` | (keys: Selection) => void |  | no |  | Handler that is called when the selection changes. |
| `items` | Iterable<T> |  | no |  | Item objects in the collection. |
| `renderEmptyState` | (props: TagListRenderProps) => ReactNode |  | no |  | Provides content to display when there are no items in the tag list. |

## Examples

_11 of 12 compile against the published `@talkdesk/cobalt-react-tag@3.0.2` (React 18, TypeScript strict)._

### Default

```tsx
import { Tag } from "@talkdesk/cobalt-react-tag"

<Tag>Tag</Tag>
```

### Sizes

```tsx
import { Tag } from "@talkdesk/cobalt-react-tag"

<Tag size="tiny">Tiny</Tag>;
<Tag size="small">Small</Tag>;
<Tag size="medium">Medium</Tag>;
<Tag size="large">Large</Tag>;
```

### Prefix

```tsx
import { Tag } from "@talkdesk/cobalt-react-tag"
import Icon from "@talkdesk/cobalt-react-icon"

// `prefix` is decorative and hidden from assistive technology.
<Tag prefix={<Icon name="bullet" />} color="light-green">Available</Tag>
<Tag prefix={<Icon name="bullet" />} color="light-red">Offline</Tag>
```

### Colors

```tsx
import { Tag } from "@talkdesk/cobalt-react-tag"

<Tag color="theme">Theme</Tag>
<Tag color="light-theme">Light Theme</Tag>
<Tag color="green">Green</Tag>
<Tag color="light-green">Light Green</Tag>
<Tag color="yellow">Yellow</Tag>
<Tag color="light-yellow">Light Yellow</Tag>
<Tag color="orange">Orange</Tag>
<Tag color="light-orange">Light Orange</Tag>
<Tag color="red">Red</Tag>
<Tag color="light-red">Light Red</Tag>
<Tag color="blue">Blue</Tag>
<Tag color="light-blue">Light Blue</Tag>
<Tag color="teal">Teal</Tag>
<Tag color="light-teal">Light Teal</Tag>
<Tag color="purple">Purple</Tag>
<Tag color="light-purple">Light Purple</Tag>
<Tag color="gray">Gray</Tag>
<Tag color="midnight">Midnight</Tag>
<Tag color="light-midnight">Light Midnight</Tag>
<Tag color="white">White</Tag>
```

### Truncation

```tsx
import { Tag } from "@talkdesk/cobalt-react-tag"

// Tags cap at a per-size max-width (160px for tiny/small/medium, 200px for
// large) and truncate overflowing labels with an ellipsis.
<Tag size="tiny">This is a very long tag label that will not fit</Tag>
<Tag size="small">This is a very long tag label that will not fit</Tag>
<Tag size="medium">This is a very long tag label that will not fit</Tag>
<Tag size="large">This is a very long tag label that will not fit</Tag>
```

### Taggroup default

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

<TagGroup label="Contact tags">
  <Tag>VIP</Tag>
  <Tag>New</Tag>
  <Tag>Follow-up</Tag>
  <Tag>Churn risk</Tag>
</TagGroup>
```

### Taggroup single selection

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

<TagGroup
  label="Priority"
  selectionMode="single"
  defaultSelectedKeys={new Set(["medium"])}
>
  <Tag id="low">Low</Tag>
  <Tag id="medium">Medium</Tag>
  <Tag id="high">High</Tag>
  <Tag id="urgent">Urgent</Tag>
</TagGroup>
```

### Taggroup multiple selection

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

<TagGroup
  label="Skills"
  selectionMode="multiple"
  defaultSelectedKeys={new Set(["sales"])}
>
  <Tag id="sales">Sales</Tag>
  <Tag id="support">Support</Tag>
  <Tag id="billing">Billing</Tag>
  <Tag id="onboarding">Onboarding</Tag>
</TagGroup>
```

### Taggroup controlled selection

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

const [selected, setSelected] = useState(new Set(["sales"]));

<TagGroup
  label="Skills"
  selectionMode="multiple"
  selectedKeys={selected}
  onSelectionChange={setSelected}
>
  <Tag id="sales">Sales</Tag>
  <Tag id="support">Support</Tag>
  <Tag id="billing">Billing</Tag>
  <Tag id="onboarding">Onboarding</Tag>
</TagGroup>
```

### Taggroup replace selection

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

// A plain click replaces the selection; modifier/keyboard still multi-select.
<TagGroup
  label="Channel"
  selectionMode="multiple"
  selectionBehavior="replace"
  defaultSelectedKeys={new Set(["voice"])}
>
  <Tag id="voice">Voice</Tag>
  <Tag id="email">Email</Tag>
  <Tag id="chat">Chat</Tag>
  <Tag id="sms">SMS</Tag>
</TagGroup>
```

### Taggroup dismissible

> **Doesn't compile:** the published types reject it: Property 'id' does not exist on type 'object'.. Fix it before use.

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

const [filters, setFilters] = useState([
  { id: "open", name: "Open" },
  { id: "voice", name: "Voice" },
  { id: "unassigned", name: "Unassigned" },
  { id: "today", name: "Today" },
]);

// Keyboard accessible: focus a tag and press Backspace/Delete, or the ✕ button.
<TagGroup
  label="Applied filters"
  items={filters}
  onRemove={(keys) =>
    setFilters((prev) => prev.filter((filter) => !keys.has(filter.id)))
  }
  renderEmptyState={() => <span>No filters applied</span>}
>
  {(filter) => <Tag id={filter.id}>{filter.name}</Tag>}
</TagGroup>
```

### Taggroup disabled

```tsx
import { Tag, TagGroup } from "@talkdesk/cobalt-react-tag"

<TagGroup label="Permissions" selectionMode="multiple" disabledKeys={["delete"]}>
  <Tag id="view">View</Tag>
  <Tag id="edit">Edit</Tag>
  <Tag id="delete">Delete</Tag>
</TagGroup>
```

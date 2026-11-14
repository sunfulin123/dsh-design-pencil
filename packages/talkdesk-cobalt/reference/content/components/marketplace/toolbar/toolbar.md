# Toolbar

> **Verified local composition:** read `recipes/list-page.md` and `recipes/list-page.tsx` from the bundle root. They compose this published Toolbar with Cobalt Extensions BasicTable and are typechecked with the local examples. The migrated examples below retain their individual compile results; they are not all usable templates.

For `StartContent`, put text inside its children; the published API does not have a `text` prop. Use `Search` with `onSearch` for its debounced value. The pinned Search implementation assigns `aria-label` from the current query, so pass a stable `aria-labelledby` pointing to a label in the page. Its `value` seeds local input state rather than synchronizing every later change; preserve query state when moving the search control between responsive layouts. The maintained ListPage passes the current query when the control remounts.


> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-toolbar`

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-toolbar
```

```tsx
import Toolbar, { StartContent, EndContent, OptionButton, Search, Filters } from "@talkdesk/cobalt-marketplace-react-toolbar";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-toolbar-stories--custom-content)

## Known gaps

Read before using it:

* Toolbar's Search is Marketplace SearchInput, with its gaps: value only sets the starting text, onChange stops it updating, and the field is named after its own text (unnamed when empty). Use onSearch. Toolbar also needs @talkdesk/cobalt-react-viewport-provider and @talkdesk/cobalt-react-portal-provider installed and above it (peer dependencies yarn 1 doesn't install).

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-portal-provider`](../../../providers/core/portal-provider/portal-provider.md), [`@talkdesk/cobalt-react-responsive-value-hook`](../../../hooks/core/responsive-value-hook/responsive-value-hook.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-viewport-provider`](../../../providers/core/viewport-provider/viewport-provider.md).

## Guidance

Toolbars should be used to display actions and information regarding the content that is being presented on the page.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Anatomy

![Toolbar example — Anatomy](/assets/toolbar/anatomy.png)

1. **Number of records.** On the left side of the toolbar, we will mostly display information. The most common information is to show the number of records available in a given set.
2. **Selected records.** In case of a table this value shows how many rows were selected by the user. The element is visible only after the user selects the first item.
3. **Link.** This link is visible only after the user selects the first item. If one or more rows are selected the link value is “Select all (number of total items)”. After interacting with this link all items will be selected and the link value change to “Unselect all (number of items)”.
4. **Toogle.** This element hide non-selected items.
5. **Search input.** Search items or related content. In small viewports this element has different positions and behavior.
6. **Actions.** By interacting with these elements the user could sort, filter and take other actions that could impact the items visibility.
7. **Filters toolbar.** Only visible when there are filters applied.
8. **Filters title.** Only visible in large and medium viewports.
9. **Applied filters.** Applied filters identification by category.
10. **Filter navigation.** These buttons allow the user to see hidden applied filters.
11. **Clear all button.** Action that when active will clear all applied filters.

### Variants

#### Sizes

There are three sizes available (Large, Medium and Small), each to be applied to the respective viewport.

![Toolbar example — Variants Sizes: Size - small](/assets/toolbar/sizes-size-small.png)
*Size - small*

![Toolbar example — Variants Sizes: Size - medium](/assets/toolbar/sizes-size-medium.png)
*Size - medium*

  ![Toolbar example — Variants Sizes: Size - large](/assets/toolbar/sizes-size-large.png)
*Size - large*

#### Modifiers

##### With actions

![Toolbar example — Modifiers With actions: Small](/assets/toolbar/actions-small.png)
*Small*

![Toolbar example — Modifiers With actions: Medium](/assets/toolbar/actions-medium.png)
*Medium*

  ![Toolbar example — Modifiers With actions: Large](/assets/toolbar/actions-large.png)
*Large*

##### With actions and search input

![Toolbar example — Modifiers With actions and search input: Small](/assets/toolbar/input-small.png)
*Small*

![Toolbar example — Modifiers With actions and search input: Medium](/assets/toolbar/input-medium.png)
*Medium*

  ![Toolbar example — Modifiers With actions and search input: Large](/assets/toolbar/input-large.png)
*Large*

##### With actions, search input and toggle

![Toolbar example — Modifiers With actions, search input and toggle: Small](/assets/toolbar/toggle-small.png)
*Small*

![Toolbar example — Modifiers With actions, search input and toggle: Medium](/assets/toolbar/toggle-medium.png)
*Medium*

  ![Toolbar example — Modifiers With actions, search input and toggle: Large](/assets/toolbar/toggle-large.png)
*Large*

##### With selected items

![Toolbar example — Modifiers With selected items: Small](/assets/toolbar/items-small.png)
*Small*

![Toolbar example — Modifiers With selected items: Medium](/assets/toolbar/items-medium.png)
*Medium*

  ![Toolbar example — Modifiers With selected items: Large](/assets/toolbar/items-large.png)
*Large*

##### With all items selected

![Toolbar example — Modifiers With all items selected: Small](/assets/toolbar/selected-small.png)
*Small*

![Toolbar example — Modifiers With all items selected: Medium](/assets/toolbar/selected-medium.png)
*Medium*

  ![Toolbar example — Modifiers With all items selected: Large](/assets/toolbar/selected-large.png)
*Large*

##### With filters applied

![Toolbar example — Modifiers With filters applied: Small](/assets/toolbar/applied-small.png)
*Small*

![Toolbar example — Modifiers With filters applied: Medium](/assets/toolbar/applied-medium.png)
*Medium*

  ![Toolbar example — Modifiers With filters applied: Large](/assets/toolbar/applied-large.png)
*Large*

### Guidelines

#### Placement

The toolbar should be placed right after the header component. It is mostly used to show the number of records available, search and actions (like filters, table options, bulk actions, etc).

![Toolbar example — Guidelines Placement: Placement - Medium](/assets/toolbar/placement-placement-medium.png)
*Placement - Medium*

  ![Toolbar example — Guidelines Placement: Placement - Small](/assets/toolbar/placement-placement-small.png)
*Placement - Small*

![Toolbar example — Guidelines Placement: Placement - Large](/assets/toolbar/placement-placement-large.png)
*Placement - Large*

#### Sort options button

The sort options button should only be visible when the table have hidden columns headers. Usually this happen in small viewports.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/339b38-toolbar) — Design tab, image 28.*

### Behavior

#### Responsiveness

Toolbars left and right paddings follow the general rules for each viewport, **L:24px / M:16px / S:12px**

For small viewports,

* the search input is part of the content area. It is not fixed positioned. It should be placed bellow the toolbars.
* the action buttons will be displayed without label.

![Toolbar example — Behavior Responsiveness: Responsiveness - Small](/assets/toolbar/responsiveness-responsiveness-small.png)
*Responsiveness - Small*

![Toolbar example — Behavior Responsiveness: Responsiveness - Medium](/assets/toolbar/responsiveness-responsiveness-medium.png)
*Responsiveness - Medium*

  ![Toolbar example — Behavior Responsiveness: Responsiveness - Large](/assets/toolbar/responsiveness-responsiveness-large.png)
*Responsiveness - Large*

#### Interaction

##### Filter on toolbar

Each filter could display two tags secondary with label + one primary tag with the value of associated tags that are invisible.

![Toolbar example — Interaction Filter on toolbar: Filter on toolbar - small](/assets/toolbar/sizes-size-small.png)
*Filter on toolbar - small*

![Toolbar example — Interaction Filter on toolbar: Filter on toolbar - medium](/assets/toolbar/sizes-size-medium.png)
*Filter on toolbar - medium*

  ![Toolbar example — Interaction Filter on toolbar: Filter on toolbar - Large](/assets/toolbar/sizes-size-large.png)
*Filter on toolbar - Large*

##### Batch operations

Batch operations actions are applied for tables that allow these actions and should be only visible when at least one item is selected on the table.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Batch operations - Medium*

  ![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Batch operations - Small*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/339b38-toolbar) — Design tab, image 36, image 37.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Batch operations - Large*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/339b38-toolbar) — Design tab, image 35.*

#### Overflow

When the filters content is larger than the toolbar width, the user can access to hidden content by using the navigation buttons positioned on the right.

![Toolbar example — Behavior Overflow: Overflow - small](/assets/toolbar/overflow-overflow-small.png)
*Overflow - small*

![Toolbar example — Behavior Overflow: Overflow - medium](/assets/toolbar/overflow-overflow-medium.png)
*Overflow - medium*

  ![Toolbar example — Behavior Overflow: Overflow - Large](/assets/toolbar/overflow-overflow-large.png)
*Overflow - Large*

#### Spacing

A toolbar can have two groups of content:

* Left content, aligned to the left.
* Right content, aligned to the right.

Toolbar actions follow the spacing used for small buttons which is usually **4px** between them.

In some cases, we may have a double toolbar. The second toolbar should be used to display applied filters and it should snap to the toolbar above.

The content inside the filters toolbar has multiple groups. Each applied filter consists of a label and one or more tags. Each group is separated by **12px**, including from the toolbar title.

Inside the group, the spacing between the label and the tags should be **8px**, and the spacing between tags should be **4px**.

![Toolbar example — Variants Spacings](/assets/toolbar/variants-spacings.png)

#### Dimensions

For all viewports, the toolbar has always a fixed height of 48px.

![Toolbar example — Variants Dimensions](/assets/toolbar/variants-dimensions.png)

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Toolbar`

* [Toolbar component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=734%3A41949) — Core component library
* [Toolbar handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=412%3A220026) — Handoff guidelines

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

* Consider `role="toolbar"` with arrow-key navigation between controls.
* Give every action an accessible name (icon-only buttons need `aria-label`).

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Toolbar

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `topBorder` | boolean |  | no | true |  |
| `bottomBorder` | boolean |  | no | true |  |
| `direction` | "row" \| "column" | `row`, `column` | no |  | Sets the direction of the flex container. |
| `alignX` | Alignment \| Spacing \| "stretch" | `start`, `center`, `end`, `space-around`, `space-evenly`, `space-between`, `stretch` | no |  | Defines the horizontal alignment of the child elements. |
| `alignY` | Alignment \| Spacing \| "stretch" | `start`, `center`, `end`, `space-around`, `space-evenly`, `space-between`, `stretch` | no |  | Defines the vertical alignment of the child elements. |
| `as` | "section" \| "header" \| "main" \| "footer" \| "div" \| "aside" \| "article" \| "details" \| "nav" \| "span" | `section`, `header`, `main`, `footer`, `div`, `aside`, `article`, `details`, `nav`, `span` | no |  | Renders the component using a different element. |
| `backgroundColor` | BackgroundColor |  | no |  |  |
| `grow` | boolean |  | no |  | Fills the available space in a flex container. |
| `height` | ResponsiveValue<Height<string \| number>> |  | no |  | Defines the height of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `inwards` | boolean |  | no |  | Converts the gap into negative space. This is useful to make child elements stack on top of each other. |
| `padding` | ResponsiveValue<Space> |  | no |  | Defines the padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingX` | ResponsiveValue<Space> |  | no |  | defines the horizontal padding. use values from 0 to 12, or a tuple with values for the supported viewports. these values will be multiplied by a predefined space unit. |
| `paddingY` | ResponsiveValue<Space> |  | no |  | defines the vertical padding. use values from 0 to 12, or a tuple with values for the supported viewports. these values will be multiplied by a predefined space unit. |
| `paddingBottom` | ResponsiveValue<Space> |  | no |  | Defines the bottom padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingLeft` | ResponsiveValue<Space> |  | no |  | Defines the left padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingRight` | ResponsiveValue<Space> |  | no |  | Defines the right padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `paddingTop` | ResponsiveValue<Space> |  | no |  | Defines the top padding. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `gap` | ResponsiveValue<Space> |  | no |  | Defines the space between child elements. Use values from 0 to 12, or a tuple with values for the supported viewports. These values will be multiplied by a predefined space unit. |
| `scrollable` | boolean |  | no |  | Makes the container scrollable. |
| `width` | ResponsiveValue<Width<string \| number>> |  | no |  | Defines the width of the element. Use any valid value for CSS property, or a tuple with values for the supported viewports. |
| `wrap` | boolean |  | no |  | Wraps the child elements. |
| `forwardedRef` | Ref<any> |  | no |  |  |

### OptionButton

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | string |  | yes |  |  |
| `onClick` | () => void |  | no |  |  |
| `iconName` | enum | 1,103 icon names, one per line in [iconname-values.txt](iconname-values.txt) | yes |  |  |

### Search

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `placeholder` | string |  | no |  |  |
| `readOnly` | boolean |  | no |  |  |
| `value` | string \| (string & readonly string[]) |  | no |  |  |
| `onChange` | ((event: ChangeEvent<HTMLInputElement>) => void) & ChangeEventHandler<HTMLInputElement> |  | no |  |  |
| `dismissable` | boolean |  | no |  |  |
| `onSearch` | (value: string) => void |  | no |  |  |
| `triggerDelay` | number |  | no |  |  |
| `type` | Type | `number`, `color`, `text`, `search`, `email`, `password`, `tel`, `url`, `checkbox`, `radio` | no |  |  |
| `noArrows` | boolean |  | no |  |  |
| `textAlign` | TextAlign | `left`, `center`, `right` | no |  |  |
| `variation` | Variation | `error`, `warning`, `unstyled` | no |  |  |
| `forwardedRef` | Ref<HTMLInputElement> |  | no |  |  |

### Filters

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `badgeColor` | enum | `theme`, `light-theme`, `gray`, `light-gray`, `green`, `light-green`, `yellow`, `light-yellow`, `orange`, `red`, `light-red`, `blue`, `light-blue`, `teal`, `light-teal`, `purple`, `light-purple`, `white` | no | theme |  |
| `badgeNumber` | number |  | no |  |  |
| `label` | string |  | no | Filters |  |
| `onClick` | () => void |  | no |  |  |

## Examples

_0 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-toolbar@2.2.2` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** the published types reject it: Type '{ text: string; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Toolbar, {
  StartContent,
  EndContent,
  Search,
  OptionButton,
  Filters
} from "@talkdesk/cobalt-marketplace-react-toolbar";

<Toolbar>
  <StartContent text="163 voicemail messages" />
  <EndContent>
    <Search placeholder="Search..." />
    <OptionButton label="Sort options" iconName="format_line_spacing" />
    <OptionButton label="Table Options" iconName="tune" />
    <Filters />
  </EndContent>
</Toolbar>
```

### Custom

> **Doesn't compile:** uses `Text` without importing or defining it. Fix it before use.

```tsx
import Toolbar, {
  StartContent,
  EndContent
} from "@talkdesk/cobalt-marketplace-react-toolbar";

<Toolbar>
  <StartContent>
    <Text>my custom left side</Text>
  </StartContent>
  <EndContent>
    <Text>my custom right side</Text>
  </EndContent>
</Toolbar>
```

### Pagination

> **Doesn't compile:** the published types reject it: JSX element class does not support attributes because it does not have a 'props' property. (it also uses `Flex`, `Text` without importing it). Fix it before use.

```tsx
import Toolbar, { StartContent, EndContent } from "@talkdesk/cobalt-marketplace-react-toolbar";
import PaginationCobalt from '@talkdesk/cobalt-marketplace-react-pagination';
import Dropdown, { Option } from '@talkdesk/cobalt-marketplace-react-dropdown';

<Toolbar>
  <StartContent>
    <PaginationCobalt
      currentPage={currentPage}
      maxPagesCount={5}
      totalPages={10}
      onNextClick={noop}
      onPageClick={noop}
      onPreviousClick={noop}
    />
  </StartContent>
  <EndContent>
    <Flex alignY="center" gap="1">
      <Text size="small">Jump to page</Text>
      <Dropdown
        borderless
        horizontalOrigin="right"
        value={currentPage}
        onChange={noop}
      >
        {pages.map((option) => (
          <Option
            key={option}
            selected={option === currentPage}
            title={option}
            value={option}
          />
        ))}
      </Dropdown>
    </Flex>
  </EndContent>
</Toolbar>
```

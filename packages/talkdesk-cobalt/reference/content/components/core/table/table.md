# Table

> **Cobalt core** component · `@talkdesk/cobalt-react-table`
>
> Not the same as [Table (Cobalt Marketplace)](../../../components/marketplace/table/table.md), `@talkdesk/cobalt-marketplace-react-table`: a separate package with its own API. Check which one the code imports before using either.
>
> Extended in Cobalt Marketplace by [ExpandableTable](../../../components/marketplace/expandable-table/expandable-table.md) (`@talkdesk/cobalt-marketplace-react-expandable-table`), built on this package.

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-table
```

```tsx
import Table, { Body, Head, HeadCell, Cell, Row, ExpandableRow, DragHandle } from "@talkdesk/cobalt-react-table";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-table-docs--docs)

## Known gaps

Read before using it:

* Table has no cell padding and no row height, and lays each row out as its own flex row (cells are flex: 1), so header cells only line up with the body cells below them when every cell in a column gets the same width. Set the same width (or flex basis) on a column's HeadCell and Cells, and give rows and cells their spacing; the List View recipe shows one way.

## Guidance

Tables are used to organize and display information from a data set. This way, users can have a more detailed comparison with other elements.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Tables display information in a grid-like format of rows and columns. They organize information in a way that’s easy to scan so that users can look for patterns and develop insights from data.

Use when a data structure includes two or more columns of data. For a single data column, use a **List Group** instead.

### Anatomy

**Tables may contain:**

* Interactive components - Checkbox, Radio buttons, Links, Buttons (all types + button groups), Dropdown, Tags
* Non-interactive - Avatar, Basic Text
* Tools to interact with Data queries - Filters, Search, Pagination (they are placed on a Toolbar before and/or after the table)

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

1. **Draggable interaction.** By interacting with this component the user can reorder the items.
2. **Checkbox.** By interacting with this component the user can select the item.
3. **Avatar**
4. **Link.** By interacting with this component the user will be forwarded to the item info page.
5. **First column**
6. **Text column**
7. **Sorted column.** All items are organized starting from the most recent.
8. **Monospaced column**
9. **Tag column**
10. **Status column**
11. **Actions column**
12. **Hovered row**
13. **Selected row**
14. **Toolbar**
15. **Pagination**

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 1.*

### Variants

Tables are a common element in our applications. They can be customized in different ways to adapt to every single use case.

#### Modifiers

##### Basic table

This table example is showing cell elements with no advanced interactions.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 2.*

##### Scrollable table

A scrollable table fixes the Header on the page and allows for the table body to scroll underneath it.

| ☢️ | This variation should only be used inside modals or panels (where the height of the element is fixed) and it should occupy all the available height of the component. It should also load more rows by lazy-loading instead of a pagination toolbar. |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 3.*

### Guidelines

#### Use cases

##### Table options

Several table options can be edited by the user which will impact the table content visibility, placement, and others. Each of these options is optional and will not be available on all products consistently.

Table options can be accessed by interacting with the button “table options” available on the toolbar. When active, this button opens a popup with all available option actions.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 4.*

Small viewports don't have enough space to place two popups side by side, so it should be used one single popup and added back action when necessary.

![Table example — Use cases Table options: Table options selection](/assets/table/options-table-options-selection.png)
*Table options selection*

  ![Table example — Use cases Table options: Table options / Option selection](/assets/table/options-table-options-option-selection.png)
*Table options / Option selection*

Only for large viewports, when the table has up to three table options available they can be placed in the toolbar instead of using the table options button action.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 7.*

##### Items per page

Allow the user to define the number of items/results (rows) per page. Other items/results can be accessed by using the pagination.

By default, a table should display 10 items and the user can change it to 20, 50, or 100.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 8.*

##### Pinned columns

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 9.*

##### Columns visibility

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 10.*

##### Columns order

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 11.*

### Behavior

#### Interaction

##### Draggable rows

This can be useful if you need to order rows.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 12.*

##### Expandable rows

When data doesn’t fit on a single row and needs more room to display primary and secondary info, you can use expandable rows. You can place any information inside an expanded row, as it doesn’t need to be tabular data.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 13.*

##### Resizable columns

Lets users adjust the **column width** in a table so they can prioritize the content that matters most to them, instead of relying on a fixed layout.

![Table example — Interaction Resizable columns](/assets/table/interaction-resizable-columns.png)

New button in toolbar called Resize columns

Clicking on the "**Resize columns" button** in the toolbar, enters the **resize mode.** It activates vertical lines in all resizable columns. When hovering a resizable border, the cursor changes to a left-right resize icon.

![Table example — Interaction Resizable columns](/assets/table/interaction-resizable-columns-2.png)

Resize mode activated

The toolbar adapts to show a tile on the left "**Resize Columns**" and a set of actions related to resizing: **Reset sizes**, **Cancel** and **Save**

![Table example — Interaction Resizable columns](/assets/table/interaction-resizable-columns-3.png)

Resize toolbar

All row-level interactive elements are disabled while in this mode: checkboxes, bulk actions, inputs, end-row actions...

![Table example — Interaction Resizable columns](/assets/table/interaction-resizable-columns-4.png)

Disabled actions in a row

**Column border states**  While in resize mode, resizable column borders become 2px wide, with color changing by state:

| **State**     | **Border color** |
| ------------- | ---------------- |
| Default       | Secondary 4      |
| Hover / focus | Secondary 6      |
| Dragging      | Secondary 8      |

**To resize,** drag a border to increase or decrease the column's width.

**Accessibility**

A resize divider can be focused with the keyboard. Once focused, the arrow keys increase or decrease the column's width — dragging isn't required to use the pattern.

**Cell content** On resize, cell content adapts immediately to the new width. If content is truncated, increasing the column's width reveals more characters; decreasing it truncates further.

**Interacting with elements outside of the table** Interacting with anything outside the table content — a header action, the drawer, or switching to another app — cancels the resize.

![Table example — Interaction Resizable columns](/assets/table/interaction-resizable-columns-5.png)

On resize UI changes

##### Sortable columns

* Improve table usability by making data sortable. Column headers will display the controls by showing an icon.
* A sorted table has three states: unsorted (arrows up and down), sorted-ascending (arrow up), and sorted-descending (arrow down).
* The sort icon should always be visible in the column header. If a table just has 1 row yet, the sort icon should be visible in the disabled state.

![Unsorted column header](/assets/table/sortable-unsorted.png)
*Unsorted*

  ![Unsorted column header, hover state](/assets/table/sortable-unsorted-hover.png)
*Unsorted - Hover*

![Unsorted column header, disabled state](/assets/table/sortable-unsorted-disabled.png)
*Unsorted - Disabled*

  ![Sorted-descending column header](/assets/table/sortable-sorted-descending.png)
*Sorted-up - Descending*

![Sorted-ascending column header](/assets/table/sortable-sorted-ascending.png)
*Sorted-up - Ascending*

##### Selectable rows

* The examples below show, on the left, the Checkbox selection which allows the user to select multiple rows. The table header provides interaction to select all rows.
* On the right, the Radio button selection will allow the user to strictly select only one row. In this case, the column header has no interaction.
* Selected rows change their background color to purple.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Checkbox*

  ![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Radio Button*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 24, image 25.*

If you are using checkboxes on your selectable rows, make sure your column header is responding correctly to the checked elements.

The checkbox on the column header will display different states, depending on if the user interaction is single or multiple:

![Column header checkbox states for single vs multiple row selection](/assets/table/selectable-header-checkbox-states.png)

A table with selectable rows has a deep integration with the toolbar component. So when selecting a few rows, the Toolbar will display the number of selected items.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 27.*

After selecting all rows, the toolbar will show the user that all rows on this page are selected. And will offer an option to select all items on all pages.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 28.*

After all items are selected, the toolbar updates the totals.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 29.*

##### Actions for each row

The last column of each row can have a set of actions that can be performed. Usually, it’s just simple transparent icon buttons, but we can add any kind of action here.

Each row can have a maximum of three actions. For rows with more than three, a more options button should be added as a third action. When active a popup with all hidden actions should be visible.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 30.*

##### Status rows

Rows can change their background to display the status of its contents.

![Table rows with status background colors](/assets/table/status-rows.png)

#### Loading

##### Lazy loading

Tables may be sourcing information from large data sets and so processing may take a few moments. That's why we use [skeleton](https://designsystem.talkdesk.com/51aaf6147/p/243842-skeleton) states on these data-based components.

The size of the loading is defined by the size of the item itself.

![Table skeleton loading state](/assets/table/lazy-loading.png)

#### Spacing

Independently of the viewport, if a table is the central element of the page, then it should also stretch to **full width**. If it’s not the central element and it shares the screen with multiple other elements, then it should follow the inner page padding (**L:24px / M:16px / S:12px**).

##### On panels and cards

Tables inside panels and cards should always be displayed at **full-width**, touching the borders of the container they’re in.

### Resources

Find this component under: `Cobalt Design System > Core Components > TableCell` and also `Cobalt Design System > Patterns > Table`

* [TableCell](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Cobalt-Core-Components?node-id=796%3A55791) — Cobalt core component
* [Table](https://www.figma.com/file/RbiNiZDJelIajXxTjDY72N/3---%E2%9A%97%EF%B8%8F-Patterns?node-id=5%3A57882) — Patterns

### Responsiveness

#### Sizes and paddings

Rows can have three different heights: small, medium, and large.

The highest first cell will determine the row height. In the same table, all the rows should have the same height, determined by the highest row.

##### Large row

To use when the first row is using a Label.

![Table example — Sizes and paddings Large row: Large row - small viewport](/assets/table/row-large-row-small-viewport.png)
*Large row - small viewport*
Row height: 68px

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Large row - medium viewport*
Row height: 76px

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 34.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Large row - large viewport*
Row height: 80px

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 33.*

##### Medium row

To use when the first row is not using a Label but is using an Avatar or a description.

![Table example — Sizes and paddings Medium row: Medium row - small viewport](/assets/table/row-medium-row-small-viewport.png)
*Medium row - small viewport*
Row height: 52px

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Medium row - medium viewport*
Row height: 56px

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 37.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Medium row - large viewport*
Row height: 60px

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 36.*

##### Small row

To use when the first row is not using a Label, an Avatar, and a description.

![Table example — Sizes and paddings Small row: Small row - small viewport](/assets/table/row-small-row-small-viewport.png)
*Small row - small viewport*
Row height: 36px

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Small row - medium viewport*
Row height: 40px

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 40.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Small row - large viewport*
Row height: 44px

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 39.*

However, you need to make sure that your designs are prepared for different viewports. A large dataset table will not fit on a small screen and you can have different columns (or even a completely different table) depending on the viewport size.

![Table cell padding at different sizes](/assets/table/cells-padding.png)

#### Columns visibility vs horizontal scroll

##### Columns visibility

Decreasing the number of visible columns for each viewport.

The table's first column and the table actions column (if applicable) should be always visible. If the user gives visibility to a hidden column a visible column will lose its visibility.

![Table example — Sizes and paddings Medium row: Medium row - small viewport](/assets/table/row-medium-row-small-viewport.png)
*Small*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Medium*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 44.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Large*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 43.*

In this case, the user needs to interact with the row to inspect all the content related to an item that will be presented inside a panel.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 46.*

##### Horizontal scroll

Using the horizontal scroll to access hidden columns.

In this case, the table actions column (if applicable) needs to be fixed on the right.

![Table example — Columns visibility vs Horizontal Scroll Horizontal Scroll: Small](/assets/table/scroll-small.png)
*Small*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Medium*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 48.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Large*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/36db72-table) — Design tab, image 47.*

### Storybook

* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/table--basic) — Cobalt

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Design

* [1.3.1 Correctly marking up table headers](https://www.w3.org/TR/WCAG20-TECHS/F91.html)
* [05.1 Identify row and column headers for data tables.](https://amp.levelaccess.net/public/standards/view_standard.php?rule_id=64)

#### Development

Screen reader users can navigate data tables from cell to cell, in a multi-directional way (up, down, right, left), much like navigating a spreadsheet. As they move from cell to cell, screen readers will read the associated header labels (if the table has been created with accessibility in mind). This structure and easy navigation ability with screen readers make tables well-suited to tabular data.

##### Provide semantic markup for tabular data

Tabular data SHOULD be represented in a `<table>`.

###### Table caption/name

The `caption` element is the most straightforward way to give a name to a table. It is also possible to use `aria-label` or `aria-labelledby`.

On a page with multiple tables, screen reader users can pull up a list of all tables on the web page, which will show the captions (such as "1st Quarter Results") along with the table size (such as "3 columns, 4 rows").

Here is a table list as viewed with the VoiceOver screen reader table list:

![VoiceOver screen reader table list example](/assets/table/accessibility-voiceover-table-list.png)

Voice over example of a table list

The purpose of the caption or name is to allow users to identify the table and/or understand the purpose of the table, so **the caption or name should be meaningful**.

**Do:** <caption> Table 1: First Quarter Earnings </caption>

**Don't:** <caption> Table 1 </caption>

The name/caption of each data table SHOULD be unique within the context of other tables on the same page.

###### Table headers

The only way that screen readers can know if a table cell is a header is by marking it with `<th>`. For more complex tables, explicit associations may be needed using `scope`, `id`, and `headers` attributes.

If the text in the header cell is vague (for example, naming it "Column 2"), or if it contains extraneous information (like links, buttons or extra descriptions that aren't the name of the column), it can confuse for screen reader users. **It's best to keep the header text accurate and simple.**

**Table data cells MUST be associated with their corresponding header cells.**

Each header is marked with either `<th scope="col">` or `<th scope="row">` as appropriate.

**Good example (on html)**

```html
<table>
	<caption><strong>Activities table</strong></caption>
	<thead>
		<tr>
			<th scope="col">Name</th>
			<th scope="col">1 mile</th>
			<th scope="col">5 km</th>
			<th scope="col">10 km</th>
		</tr>
    </thead>
	<tbody>
		<tr>
			<th scope="row">Mary</th>
			<td>8:32</td>
			<td>28:04</td>
			<td>1:01:16</td>
		</tr>
     </tbody>
</table>
```

## Props

### Table

_Also accepts the standard `HTMLAttributes<TableType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `table`, `div` | no | table |  |
| `border` | enum | `all`, `none` | no |  |  |
| `forwardedRef` | Ref<HTMLTableElement> |  | no |  |  |

### Body

_Also accepts the standard `HTMLAttributes<BodyType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `tbody`, `div` | no | tbody |  |
| `forwardedRef` | Ref<HTMLTableSectionElement> |  | no |  |  |

### Head

_Also accepts the standard `HTMLAttributes<HeadType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `thead`, `div` | no | thead |  |
| `forwardedRef` | Ref<HTMLTableSectionElement> |  | no |  |  |

### HeadCell

_Also accepts the standard `HTMLAttributes<HeadCellType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `th`, `div` | no | th |  |
| `width` | enum | `min`, `5`, `5`, `10`, `10`, `15`, `15`, `20`, `20`, `25`, `25`, `30`, `30`, `33`, `33`, `35`, `35`, `40`, `40`, `45`, `45`, `50`, `50`, `55`, `55`, `60`, `60`, `65`, `65`, `66`, `66`, `70`, `70`, `75`, `75`, `80`, `80`, `85`, `85`, `90`, `90`, `95`, `95`, `100`, `100` | no |  | Defines the percentage of the width the cell should take. Use values from 5 to 100, in multiples of 5. 33 and 66 are also possible values. To have the cell occupy the minimum space needed, use "min". |
| `forwardedRef` | Ref<HTMLTableHeaderCellElement> |  | no |  |  |

### Cell

_Also accepts the standard `HTMLAttributes<CellType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `td`, `div` | no | td |  |
| `width` | enum | `min`, `5`, `5`, `10`, `10`, `15`, `15`, `20`, `20`, `25`, `25`, `30`, `30`, `33`, `33`, `35`, `35`, `40`, `40`, `45`, `45`, `50`, `50`, `55`, `55`, `60`, `60`, `65`, `65`, `66`, `66`, `70`, `70`, `75`, `75`, `80`, `80`, `85`, `85`, `90`, `90`, `95`, `95`, `100`, `100` | no |  | Defines the percentage of the width the cell should take. Use values from 5 to 100, in multiples of 5. 33 and 66 are also possible values. To have the cell occupy the minimum space needed, use "min". |
| `forwardedRef` | Ref<HTMLTableCellElement> |  | no |  |  |

### Row

_Also accepts the standard `HTMLAttributes<RowType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `tr`, `div` | no | tr |  |
| `variation` | enum | `theme`, `info`, `success`, `warning`, `error`, `feature` | no |  |  |
| `forwardedRef` | Ref<HTMLTableRowElement> |  | no |  |  |

### ExpandableRow

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `tr`, `div` | no |  |  |
| `variation` | enum | `theme`, `info`, `success`, `warning`, `error`, `feature` | no |  |  |
| `forwardedRef` | Ref<HTMLTableRowElement> |  | no |  |  |
| `expanded` | boolean |  | no |  |  |

### DragHandle

_Also accepts the standard `Omit<HTMLAttributes<DragHandleType>, "placeholder">` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `as` | enum | `td`, `th`, `div` | no |  |  |
| `placeholder` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLTableCellElement> |  | no |  |  |

## Examples

_8 of 8 compile against the published `@talkdesk/cobalt-react-table@2.2.5` (React 18, TypeScript strict)._

### Basic

```tsx
import Table, { Head, Row, HeadCell, Body, Cell } from "@talkdesk/cobalt-react-table";

  <Table>
    <Head>
      <Row>
        <HeadCell>Head cell</HeadCell>
        <HeadCell>Head cell</HeadCell>
      </Row>
    </Head>
    <Body>
      <Row>
        <Cell>Table cell</Cell>
        <Cell>Table cell</Cell>
      </Row>
      <Row>
        <Cell>Table cell</Cell>
        <Cell>Table cell</Cell>
      </Row>
    </Body>
  </Table>
```

### Widths

```tsx
import Table, { Head, Row, HeadCell, Body, Cell } from "@talkdesk/cobalt-react-table";

  <Table>
    <Head>
      <Row>
        <HeadCell width="30">Head 30%</HeadCell>
        <HeadCell width="55">Head 55%</HeadCell>
        <HeadCell width="15">Head 15%</HeadCell>
      </Row>
    </Head>
    <Body>
      <Row>
        <Cell width="30">Table 30%</Cell>
        <Cell width="55">Table 55%</Cell>
        <Cell width="15">Table 15%</Cell>
      </Row>
      <Row>
        <Cell width="30">Table 30%</Cell>
        <Cell width="55">Table 55%</Cell>
        <Cell width="15">Table 15%</Cell>
      </Row>
    </Body>
  </Table>
```

### Borderless

```tsx
import Table from "@talkdesk/cobalt-react-table";

  <Table border="none">
    ...
  </Table>
```

### Bordered

```tsx
import Table from "@talkdesk/cobalt-react-table";

  <Table border="all">
    ...
  </Table>
```

### Variations

```tsx
import Table, { Body, Row } from "@talkdesk/cobalt-react-table";

  <Table>
    <Body>
      <Row variation="theme">
        ...
      </Row>
      <Row variation="success">
        ...
      </Row>
      <Row variation="warning">
        ...
      </Row>
      <Row variation="error">
        ...
      </Row>
      <Row variation="feature">
        ...
      </Row>
    </Body>
  </Table>
```

### Clickable

```tsx
import Table, { Body, Row } from "@talkdesk/cobalt-react-table";

  <Table>
    <Body>
      <Row onClick={...}>
        ...
      </Row>
      <Row onClick={...}>
        ...
      </Row>
    </Body>
  </Table>
```

### Expandable

```tsx
import Table, { Body, ExpandableRow, Cell } from "@talkdesk/cobalt-react-table";


  <Table>
    <Body>
      <ExpandableRow
        content="This is the closed content of the expandable row"
        onClick={...}
      >
        <Cell width="min">...</Cell>
        <Cell>...</Cell>
        <Cell>...</Cell>
        ...
      </ExpandableRow>
    </Body>

    <Body>
      <ExpandableRow
        expanded
        content="This is the open content of the expandable row"
        onClick={...}
      >
        <Cell width="min">...</Cell>
        <Cell>...</Cell>
        <Cell>...</Cell>
        ...
      </ExpandableRow>
    </Body>
  </Table>
```

### With drag handles

```tsx
import Table, { Head, Row, HeadCell, Body, Cell, DragHandle } from "@talkdesk/cobalt-react-table";

  <Table>
    <Head>
      <Row>
        <DragHandle placeholder />
        <HeadCell width="30">Head cell</HeadCell>
        <HeadCell width="70">Head cell</HeadCell>
      </Row>
    </Head>
    <Body>
      <Row>
        <DragHandle>...</DragHandle>
        <Cell width="30">Table cell</Cell>
        <Cell width="70">Table cell</Cell>
      </Row>
      <Row>
        <DragHandle>...</DragHandle>
        <Cell width="30">Table cell</Cell>
        <Cell width="70">Table cell</Cell>
      </Row>
    </Body>
  </Table>
```

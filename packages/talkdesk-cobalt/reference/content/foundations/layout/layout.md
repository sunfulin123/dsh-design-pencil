# Layout

## Guidance

:::note
This page doesn't map to the current Foundations taxonomy (Tokens / Content / Accessibility) — flagged for review.
:::

Talkdesk products can be developed with 5 different layout types; Block, Column, Modular, Hierarchical, and Flow.

Layout types differ by the used grid type, number of containers, number of push panels, and other characteristics and guidelines.

## Overview

|                 |         | **Block** | **Column** Tables and Calendars | **Column** Forms | **Modular** | **Hierarchical** | **Flow** |
| --------------- | ------- | --------- | ------------------------------- | ---------------- | ----------- | ---------------- | -------- |
| **Grid**        | Fluid   | ❌         | ✅                               | ✅                | ✅           | ✅                | ✅        |
|                 | Fixed   | ✅         | ❌                               | ✅                | ✅           | ❌                | ❌        |
| **Containers**  | One     | ✅         | ✅                               | ✅                | ✅           | ✅                | ✅        |
|                 | Two 1/3 | ❌         | *Rarely*                        | *Rarely*         | *Rarely*    | ❌                | ❌        |
|                 | Two 2/2 | ❌         | *Rarely*                        | *Rarely*         | *Rarely*    | ❌                | ❌        |
| **Push Panels** | 0       | ❌         | ✅                               | ✅                | ✅           | ✅                | ❌        |
|                 | 1       | ✅         | *Sometimes*                     | *Sometimes*      | *Sometimes* | ❌                | ✅        |
|                 | 2       | ❌         | *Rarely*                        | *Rarely*         | *Rarely*    | ❌                | ✅        |

---

## Block layouts

Block layouts use a centered aligned fixed grid type and only have one container.

The max width is applied for each viewport.

Usually, all MainApp elements, vertically and horizontally centered aligned, are inside the four columns positioned in the center.

![Abstract diagram of a Block layout: one centered, fixed-width container](/assets/layout/block-xlarge.png)

![Example of a Block layout: a dialer screen centered on the page](/assets/layout/block-example.png)

| Column 1           | Column 2                                                                             |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Responsiveness** | Block layouts support all viewports                                                  |
| **Push panels**    | Block layouts can use one panel. By default, the panel is open but can be collapsed. |
| **Actions**        | Block layout actions are fixed and positioned on the bottom of the Main App area.    |
| **Background**     | Block layouts use a white background.                                                |

#### Responsiveness

![Block layout at the small viewport](/assets/layout/block-small.png)
*Block small*

![Block layout at the medium viewport](/assets/layout/block-medium.png)
*Block medium*

![Block layout at the large viewport](/assets/layout/block-large.png)
*Block large*

![Block layout at the xlarge viewport](/assets/layout/block-xlarge.png)
*Block xlarge*

---

## Column layouts

Column layouts use different grid types, usually fluid, and have one or two containers.

MainApp elements are positioned according to the grid columns.

Column layouts are usually applied to the following layouts:

* Tables
* Forms
* Calendars

| Column layouts     | Table and Calendar                                                                                                       | Forms                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| **Responsiveness** | Depending on the product, column (Table and Calendar) layouts might support all viewports                                | Depending on the product, column (Forms) layouts might support all viewports                 |
| **Push panels**    | Column (Table and Calendar) layouts can use one panel. By default, the panel is open but can be collapsed.               | Column (Forms) layouts can use one panel. By default, the panel is open but can be collapsed |
| **Actions**        | Column (Table and Calendar) layout actions are fixed and positioned in the top right corner, associated with the header. | Column (Forms) layout actions are positioned below the form.                                 |
| **Background**     | Column (Table and Calendar) layouts use a white background.                                                              | Column (Forms) layouts use a white background.                                               |

#### Responsiveness

![Column layout at the small viewport](/assets/layout/column-small.png)
*Column small*

![Column layout at the medium viewport](/assets/layout/column-medium.png)
*Column medium*

![Column layout at the large viewport](/assets/layout/column-large.png)
*Column large*

![Column layout at the xlarge viewport](/assets/layout/column-xlarge.png)
*Column xlarge*

### Tables

Tables usually use a column layout, fluid grid type, and have one container.

Table columns' width can be dynamic or fixed, depending on the content.

![Abstract diagram of a Column layout used for a table](/assets/layout/column-table-xlarge.png)

There are use cases where Tables have one push panel.

#### Responsiveness

![Column table layout at the small viewport](/assets/layout/column-table-small.png)
*Column table small*

![Column table layout at the medium viewport](/assets/layout/column-table-medium.png)
*Column table medium*

![Column table layout at the large viewport](/assets/layout/column-table-large.png)
*Column table large*

![Column table layout at the xlarge viewport](/assets/layout/column-table-xlarge.png)
*Column table xlarge*

### Calendar

Calendars usually use a column layout, fluid grid type, and have one container.

![Abstract diagram of a Column layout used for a calendar](/assets/layout/column-calendar-xlarge.png)

![Example of a Column calendar layout: a monthly schedule view](/assets/layout/column-calendar-example.png)

#### Responsiveness

![Column calendar layout at the small viewport](/assets/layout/column-calendar-small.png)
*Column calendar small*

![Column calendar layout at the medium viewport](/assets/layout/column-calendar-medium.png)
*Column calendar medium*

![Column calendar layout at the large viewport](/assets/layout/column-calendar-large.png)
*Column calendar large*

![Column calendar layout at the xlarge viewport](/assets/layout/column-calendar-xlarge.png)
*Column calendar xlarge*

### Forms

Forms usually use a column layout, fluid or fixed grid type, and have one container.

Form inputs use the total width only in small viewports. In other viewports, they use half of the total width.

Explore more about forms in the [Forms pattern documentation](https://designsystem.talkdesk.com/51aaf6147/p/04cbc6-forms).

![Abstract diagram of a Column layout used for a form](/assets/layout/column-form-xlarge.png)

![Example of a Column form layout: a create-contact form](/assets/layout/column-form-example.png)

There are use cases where Forms have one push panel.

![Example of a Column form layout with one push panel: an add-case form](/assets/layout/column-form-example-one-push-panel.png)

#### Responsiveness

![Column form layout at the small viewport](/assets/layout/column-form-small.png)
*Column form small*

![Column form layout at the medium viewport](/assets/layout/column-form-medium.png)
*Column form medium*

![Column form layout at the large viewport](/assets/layout/column-form-large.png)
*Column form large*

![Column form layout at the xlarge viewport](/assets/layout/column-form-xlarge.png)
*Column form xlarge*

---

## Modular layouts

Modular layouts use different grid types, usually fluid, and have one or two containers.

Modular layouts are usually used to show Cards, in Modules (fluid or fixed) or Rows.

| Column 1           | Column 2                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------- |
| **Responsiveness** | Depending on the product, modular layouts might support all viewports                                     |
| **Push panels**    | There are no use cases where a Modular layout uses push panels but they can use one panel when necessary. |
| **Actions**        | Modular layout actions are fixed and positioned in the top right corner, associated with the header.      |
| **Background**     | Modular layouts usually use a gray background but can also use a white background.                        |

#### Responsiveness

![Modular layout at the small viewport](/assets/layout/modular-small.png)
*Modular small*

![Modular layout at the medium viewport](/assets/layout/modular-medium.png)
*Modular medium*

![Modular layout at the large viewport](/assets/layout/modular-large.png)
*Modular large*

![Modular layout at the xlarge viewport](/assets/layout/modular-xlarge.png)
*Modular xlarge*

### Cards - Modules

Cards Modules usually use a modular layout and only have one container.

Sometimes, in Cards Modules, cards have fixed dimensions. In these cases, they don't follow the grid structure.

#### Fluid grid type

![Example of a modular Cards - Modules layout with a fluid grid type: an AI Launchpad screen](/assets/layout/modular-cardmodules-example-fluid.png)

#### Responsiveness

![Cards - Modules fluid layout at the small viewport](/assets/layout/hierarchical-small.png)
*Hierarchical small*

![Cards - Modules fluid layout at the medium viewport](/assets/layout/hierarchical-medium.png)
*Hierarchical medium*

![Cards - Modules fluid layout at the large viewport](/assets/layout/hierarchical-large.png)
*Hierarchical large*

![Cards - Modules fluid layout at the xlarge viewport](/assets/layout/hierarchical-xlarge.png)
*Hierarchical xlarge*

#### Fixed grid type and cards with fixed dimensions

![Example of a modular Cards - Modules layout with a fixed grid type: a Studio Functions screen](/assets/layout/modular-cardmodules-example-fixed.png)

#### Responsiveness

![Cards - Modules fixed layout at the small viewport](/assets/layout/hierarchical-small.png)
*Hierarchical small*

![Cards - Modules fixed layout at the medium viewport](/assets/layout/hierarchical-medium.png)
*Hierarchical medium*

![Cards - Modules fixed layout at the large viewport](/assets/layout/hierarchical-large.png)
*Hierarchical large*

![Cards - Modules fixed layout at the xlarge viewport](/assets/layout/hierarchical-xlarge.png)
*Hierarchical xlarge*

### Cards - Row

Cards Rows usually use a modular layout and only have one container.

Usually used fluid grid types.

![Abstract diagram of a modular Cards - Row layout](/assets/layout/modular-row-xlarge.png)

![Example of a modular Cards - Row layout: an Insights screen](/assets/layout/modular-cardrows-example-fluid.png)

#### Responsiveness

![Cards - Row layout at the small viewport](/assets/layout/modular-row-small.png)
*Modular row small*

![Cards - Row layout at the medium viewport](/assets/layout/modular-row-medium.png)
*Modular row medium*

![Cards - Row layout at the large viewport](/assets/layout/modular-row-large.png)
*Modular row large*

![Cards - Row layout at the xlarge viewport](/assets/layout/modular-row-xlarge.png)
*Modular row xlarge*

---

## Hierarchical layouts

Hierarchical layouts usually use fluid grid types and only have one container.

Hierarchical layouts are usually used to show Cards with different dimensions.

| Column 1           | Column 2                                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------------------- |
| **Responsiveness** | Depending on the product, hierarchical layouts might support all viewports                                     |
| **Push panels**    | There are no use cases where a Hierarchical layout uses push panels but they can use one panel when necessary. |
| **Actions**        | Hierarchical layout actions are fixed and positioned in the top right corner, associated with the header.      |
| **Background**     | Hierarchical layouts use a gray background.                                                                    |

#### Responsiveness

![Hierarchical layout at the small viewport](/assets/layout/hierarchical-small.png)
*Hierarchical small*

![Hierarchical layout at the medium viewport](/assets/layout/hierarchical-medium.png)
*Hierarchical medium*

![Hierarchical layout at the large viewport](/assets/layout/hierarchical-large.png)
*Hierarchical large*

![Hierarchical layout at the xlarge viewport](/assets/layout/hierarchical-xlarge.png)
*Hierarchical xlarge*

### Cards - hierarchical

Cards hierarchical usually use a hierarchical layout and only have one container.

Usually used fluid grid types.

![Abstract diagram of a Cards - hierarchical layout](/assets/layout/hierarchical-card-xlarge.png)

![Example of a Cards - hierarchical layout: a Cases dashboard](/assets/layout/hierarchical-example.png)

#### Responsiveness

![Cards - hierarchical layout at the small viewport](/assets/layout/hierarchical-card-small.png)
*Hierarchical card small*

![Cards - hierarchical layout at the medium viewport](/assets/layout/hierarchical-card-medium.png)
*Hierarchical card medium*

![Cards - hierarchical layout at the large viewport](/assets/layout/hierarchical-card-large.png)
*Hierarchical card large*

![Cards - hierarchical layout at the xlarge viewport](/assets/layout/hierarchical-card-xlarge.png)
*Hierarchical card xlarge*

---

## Flow layouts

Flow layouts usually use fluid grid types and only have one container.

Usually, they have one or two push panels.

![Abstract diagram of a Flow layout](/assets/layout/flow-xlarge.png)

![Example of a Flow layout: the Automation Designer canvas](/assets/layout/flow-example.png)

**Responsiveness** —
Flow layouts don't support small and medium viewports —

**Push panels** —

Flow layouts can use two panels. As an exception, only in this kind of layout, panels don't overlap the header and the toolbar.

In flow layouts we should provide to our users the largest canvas area possible so panels should only be open when the user needs to interact with them. Examples of actions that can contribute to this are,

* Only one panel is open at a time. When the user opens a panel the other one automatically closes. This also contributes to a better experience when the secondary area and the drawer are open avoiding having multiple panels open simultaneously.

* Use float buttons that overlap the flow.

  Because in flow layouts the user needs to use several panels you should not close the panel to open another one when selecting a new card. Instead of that replace the panel content with the new one maintaining the panel open.
  —

  **Actions** —

  Flow layouts have Flow and View actions.

  Flow actions are actions with who the user interacts to create and manage the flow. Examples of these actions are searching or creating/configuring variables.

  View actions are actions with who the user interacts to change the way the flow is observed. Examples of these actions are adding notes, zooming in/out, or Fit screen.
  —

  **Flow actions** —
  Flow actions, such as search or create/configure variables, should be placed on the top of the flow, right, or left. Can be positioned floating, on the panel, or on the toolbar. —

  **View actions** —

  View actions, such as adding notes, zoom and view modes should have a fixed floating position, overlapping the flow.

  Should not have a label and a tooltip should be used to show the label.

  They should always be placed on the bottom, right, left, horizontally or vertically.
  —

  **Background** —

  Flow layout uses a background with a dotted pattern.

  They can assume different colors to represent different flow modes. Gray is the recommended default color to use in the background.
  —

#### Responsiveness

![Flow layout at the large viewport](/assets/layout/flow-large.png)
*Flow large*

![Flow layout at the xlarge viewport](/assets/layout/flow-xlarge.png)
*Flow xlarge*

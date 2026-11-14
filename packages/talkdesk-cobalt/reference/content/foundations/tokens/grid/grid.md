# Grid

## Guidance

The Grid is the geometric foundation of all the visual elements, from typography to columns, boxes,
icons, and illustrations. It provides structure and guidance for all creative decision-making.

## Baseline Grid

We use a **4px** baseline grid to help achieve the vertical rhythm of elements throughout a page.

This means that everything will be a multiple of 4 (0, 4, 8, 12, 16, 20, 24, and so on). The result is a
subconscious recognition of balance and congruity.

![Text with 4px baseline grid](/assets/grid/baseline-grid-text.png)

Always try to align objects on the 8px grid, but where necessary, use good judgment to fine-tune your
designs to 4px.

The 4px baseline is there allows more flexibility for line heights and smaller adjustments.

![Example of the 4px baseline grid](/assets/grid/baseline-grid-example.png)

---

## Anatomy

![Anatomy of the MainApp grid, numbered 1 through 9](/assets/grid/anatomy.png)

1. **Title bar**
2. **Dock**
3. **Drawer**
4. **MainApp container with Inner Padding,** fixed values based on the viewport
5. **Column,** the number of columns is based on the viewport
6. **Gutter,** fixed values based on the viewport
7. **First container**
8. **Second container**
9. **Secondary Area**

The amount of columns is based on the viewport:

* Small, from 424 to 640px, 4 columns
* Medium, from 641 to 960px, 8 columns
* Large, from 961 to 1440px, 12 columns
* XLarge, from 1441px ou 1601px, 12 columns

Gutters are fixed values based on the viewport:

* Small, from 424 to 640px, gutters width is 12px
* Medium, from 641 to 960px, gutters width is 16px
* Large, from 961 to 1440px, gutters width is 24px
* XLarge, from 1441px ou 1601px, gutters width is 24px

---

## MainApp container grid types

### Fluid

In fluid grids, column widths are dynamic, dependent on the main app width.

![Fluid grid diagram](/assets/grid/fluid.png)

![Fluid grid applied to a real product screen](/assets/grid/fluid-example.png)

#### Responsiveness

![Fluid grid, small viewport](/assets/grid/fluid-small.png)
*Small*

![Fluid grid, medium viewport](/assets/grid/fluid-medium.png)
*Medium*

![Fluid grid, large viewport](/assets/grid/fluid-large.png)
*Large*

![Fluid grid, xlarge viewport](/assets/grid/fluid-xlarge.png)
*XLarge*

Columns width in fluid grid types should be defined in percentage and calculated as, if
MainAppViewportWidth is L=1440px, M=860px, S=434px:

**4/4 column width** = 100% —
**4/4 column width** = 100% —

**3/4 column width**,

* `L = ((100%-(24\*100%/MainAppViewportWidth)\*3)/4)\*3`

* `M = ((100%-(16\*100%/MainAppViewportWidth)\*3)/4)\*3`

* `S = ((100%-(12\*100%/MainAppViewportWidth)\*3)/4)\*3`

  —

  **3/4 column width**,

* `L = ((100%-(24\*100%/1440)\*3)/4)\*3 = 71,25%`

* `M = ((100%-(16\*100%/860)\*3)/4)\*3 = 70,81%`

* `S = ((100%-(12\*100%/434)\*3)/4)\*3 = 68,78%`

  —

  **2/4 column width**,

* `L = (100%-(24\*100%/MainAppViewportWidth))/2`

* `M = (100%-(16\*100%/MainAppViewportWidth))/2`

* `S = (100%-(12\*100%/MainAppViewportWidth))/2`

  —

  **2/4 column width**,

* `L = (100%-(24\*100%/1440))/2 = 49,17%`

* `M = (100%-(16\*100%/860))/2 = 49,07%`

* `S = (100%-(12\*100%/434))/2 = 48,62%`

  —

  **1/4 column width**,

* `L = (100%-(24\*100%/MainAppViewportWidth)\*3)/4`

* `M = (100%-(16\*100%/MainAppViewportWidth)\*3)/4`

* `S = (100%-(12\*100%/MainAppViewportWidth)\*3)/4`

  —

  **1/4 column width**,

* `L = (100%-(24\*100%/1440)\*3)/4 = 23,75%`

* `M = (100%-(16\*100%/860)\*3)/4 = 23,60%`

* `S = (100%-(12\*100%/434)\*3)/4 = 22,93%`

  —

### Fixed

Fixed grids have a max width.

The max width can be applied only for large viewports or for each viewport.

![Fixed grid diagram](/assets/grid/fixed.png)

![Fixed grid applied to a real product screen](/assets/grid/fixed-example.png)

#### Responsiveness

![Fixed grid, small viewport](/assets/grid/fixed-small.png)
*Small*

![Fixed grid, medium viewport](/assets/grid/fixed-medium.png)
*Medium*

![Fixed grid, large viewport](/assets/grid/fixed-large.png)
*Large*

![Fixed grid, xlarge viewport](/assets/grid/fixed-xlarge.png)
*XLarge*

---

## Grid containers

Grids can have one or two containers.

Each container has its own scroll.

### One container

![One container grid diagram](/assets/grid/one-container.png)

![One container grid applied to a real product screen](/assets/grid/one-container-example.png)

#### Responsiveness

![One container grid, small viewport](/assets/grid/one-container-small.png)
*Small*

![One container grid, medium viewport](/assets/grid/one-container-medium.png)
*Medium*

![One container grid, large viewport](/assets/grid/one-container-large.png)
*Large*

![One container grid, xlarge viewport](/assets/grid/one-container-xlarge.png)
*XLarge*

### Two containers

A two containers grid can be used on a scale of 1/3 or 2/2.

#### Two containers 1/3

![Two containers 1/3 grid diagram](/assets/grid/two-containers-13.png)

![Two containers 1/3 grid applied to a real product screen](/assets/grid/two-containers-13-example.png)

**Responsiveness**

![Two containers 1/3 grid, small viewport](/assets/grid/two-containers-13-small.png)
*Small*

![Two containers 1/3 grid, medium viewport](/assets/grid/two-containers-13-medium.png)
*Medium*

![Two containers 1/3 grid, large viewport](/assets/grid/two-containers-13-large.png)
*Large*

![Two containers 1/3 grid, xlarge viewport](/assets/grid/two-containers-13-xlarge.png)
*XLarge*

#### Two containers 2/2

![Two containers 2/2 grid diagram](/assets/grid/two-containers-22.png)

*A real-product "two containers 2/2" example screenshot exists on ZeroHeight but is not reproduced here —
it showed a fictional full name and phone number together ("Filipa Pereira", "+61 2 6162 0780"). See the
data-handling note at the top of this file. [View on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/582820-grid).*

**Responsiveness**

![Two containers 2/2 grid, small viewport](/assets/grid/two-containers-22-small.png)
*Small*

![Two containers 2/2 grid, medium viewport](/assets/grid/two-containers-22-medium.png)
*Medium*

![Two containers 2/2 grid, large viewport](/assets/grid/two-containers-22-large.png)
*Large*

![Two containers 2/2 grid, xlarge viewport](/assets/grid/two-containers-22-xlarge.png)
*XLarge*

---

## Push panels

Layouts can have one or two push panels with fixed widths that push the content, influencing its grid.
We suggest using push panels only for [one container grid](https://designsystem.talkdesk.com/51aaf6147/p/582820-grid/t/156f31).

Push panels paddings and gutters should follow the viewport padding.

* Small, from 424 to 640px, paddings and gutters value is 12px
* Medium, from 641 to 960px, paddings and gutters value is 16px
* Large, from 961 to 1440px, paddings and gutters value is 24px
* XLarge, from 1441px ou 1601px, paddings and gutters value is 24px

Push panels can be closed and their width will be 60px.

The push panel is usually small size.

For main app widths below 1041px the push panels, when open, will overlap the main app container.

For main app widths below 1237px, the push panels cannot be opened simultaneously.

Each push panel has its own scroll.

### One push panel

![One push panel grid diagram](/assets/grid/one-push-panel.png)

![One push panel applied to a real product screen](/assets/grid/one-push-panel-example.png)

#### Responsiveness

![One push panel, small viewport](/assets/grid/one-push-panel-small.png)
*Small*

![One push panel, medium viewport](/assets/grid/one-push-panel-medium.png)
*Medium*

![One push panel, large viewport](/assets/grid/one-push-panel-large.png)
*Large*

![One push panel, xlarge viewport](/assets/grid/one-push-panel-xlarge.png)
*XLarge*

**Push panel closed**

![One push panel closed, small viewport](/assets/grid/one-push-panel-small-closed.png)
*Small*

![One push panel closed, medium viewport](/assets/grid/one-push-panel-medium-closed.png)
*Medium*

![One push panel closed, large viewport](/assets/grid/one-push-panel-large-closed.png)
*Large*

![One push panel closed, xlarge viewport](/assets/grid/one-push-panel-xlarge-closed.png)
*XLarge*

#### Push Panels in different grid types

Push panels can be applied to different MainApp container layout types.

![Push panel with fluid grid](/assets/grid/push-panel-with-fluid-grid.png)
*Fluid grid*

![Push panel with fixed grid](/assets/grid/push-panel-with-fixed-grid.png)
*Fixed grid*

### Two push panels

![Two push panels grid diagram](/assets/grid/two-push-panels.png)

![Two push panels applied to a real product screen](/assets/grid/two-push-panels-example.png)

#### Responsiveness

![Two push panels, small viewport](/assets/grid/two-push-panels-small.png)
*Small*

![Two push panels, medium viewport](/assets/grid/two-push-panels-medium.png)
*Medium*

![Two push panels, large viewport](/assets/grid/two-push-panels-large.png)
*Large*

![Two push panels, xlarge viewport](/assets/grid/two-push-panels-xlarge.png)
*XLarge*

**Push panel closed**

![Two push panels closed, small viewport](/assets/grid/two-push-panels-small-closed.png)
*Small*

![Two push panels closed, medium viewport](/assets/grid/two-push-panels-medium-closed.png)
*Medium*

![Two push panels closed, large viewport](/assets/grid/two-push-panels-large-closed.png)
*Large*

![Two push panels closed, xlarge viewport](/assets/grid/two-push-panels-xlarge-closed.png)
*XLarge*

---

## Useful links

**[Grids Assets](https://www.figma.com/file/f9xqOzlZwaQQRxxciYal50/2D---%F0%9F%93%96-Strucutre-documentation?node-id=624%3A228410\&t=J8281x8b0m3ZVDHn-1)**
— Grid figma assets to reuse in your designs

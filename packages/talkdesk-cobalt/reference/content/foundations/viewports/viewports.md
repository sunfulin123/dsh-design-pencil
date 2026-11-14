# Viewports

## Guidance

:::note
This page doesn't map to the current Foundations taxonomy (Tokens / Content / Accessibility) — flagged for review.
:::

Use this set of standard breakpoints to maintain layout integrity across viewport sizes. For best
results, test designs and code at each of these standard breakpoints.

## Overview

A viewport is the area of a screen/window shown to the user. In Workspace, we have 2 viewports: the
Workspace viewport and the Application viewports.

![Diagram showing the Workspace viewport containing the Application viewport](/assets/viewports/viewport.png)

These 2 viewports are needed because Workspace applications are rendered inside iframes, which means
that the application's content reacts to the iframe size. The applications are unable to know the
width of the Workspace viewport, and as a consequence cannot react to it.

---

## Viewport breakpoints

The 2 viewports always respect the use of this set of standard breakpoints to maintain layout
integrity across viewport sizes. For best results, test designs and code at each of these standard
breakpoints.

![Small 424px-640px, Medium 641px-960px, and Large greater than 961px breakpoints](/assets/viewports/breakpoints.png)

Please be aware that the min-width supported by Workspace is 424px. Cobalt supports lower widths since
we also support mobile apps.

### Media queries

```css
// Small devices (landscape phones, up to 640px)
@media (max-width: 640px) { ... }

// Medium devices (tablets, between 641px and 960px)
@media (min-width: 641px) and (max-width: 960px) { ... }

// Large devices (desktops, 961px and up)
@media (min-width: 961px) { ... }
```

---

## Canvas sizes

The Canvas size is the recommended size to design screens for each viewport size. When designing a
screen make sure to use the recommended canvas sizes that will be dependent of:

* App viewport: Small, Medium, or Large
* Drawer visibility (when fixed)
* Secondary Area visibility

By using the component [CanvasTemplate](https://www.figma.com/file/txlnFgFiMVzav4GpRfjeJ3/Workspace-library?node-id=367%3A71247)
available in the Workspace Figma library you can explore and use your designs with all recommended
canvas sizes.

| Workspace viewport size | Drawer         | Secondary Area | Main App viewport size |
| ----------------------- | -------------- | -------------- | ---------------------- |
| Small (424x640px)       | No drawer      | ❌              | Small (370x600px)      |
|                         | Hidden (hover) | ❌              | Small (360x600px)      |
| Medium (860x640px)      | No drawer      | ❌              | Medium (806x600px)     |
|                         | Hidden         | ❌              | Medium (789x600px)     |
|                         | Fixed          | ❌              | Small (593x600px)      |
| Large (1440x900px)      | No drawer      | Open           | Large (986x860px)      |
|                         | No drawer      | Closed         | Large (1386x860px)     |
|                         | Hidden         | Open           | Large (969x860px)      |
|                         | Hidden         | Closed         | Large (1369x860px)     |
|                         | Fixed          | Open           | Medium (773x860px)     |
|                         | Fixed          | Closed         | Large (1173x860px)     |
| XLarge (1920x900px)     | No drawer      | Open           | Large (1466x860px)     |
|                         | No drawer      | Closed         | Large (1866x860px)     |
|                         | Hidden         | Open           | Large (1449x860px)     |
|                         | Hidden         | Closed         | Large (1849x860px)     |
|                         | Fixed          | Open           | Large (1253x860px)     |
|                         | Fixed          | Closed         | Large (1653x860px)     |

ℹ️

* In specific scenarios, designers can use different canvas sizes that better adapt to their use case
  (studio and live - wallboard).
* The drawer can be fixed when the Workspace width is at least 641px;
* The Secondary area can be open if the Workspace width is at least 1041px;
* The drawer and the Secondary area can be fixed open at the same time if the Workspace width is at
  least 1237px.

```css
@media (max-width: 640px) {
  /* drawer: closed, can't be fixed */
  /* secondary-area: closed, can't open */
}

@media (min-width: 641px) and (max-width: 1040px) {
  /* drawer: open */
  /* secondary-area: closed, can't open */
}

@media (min-width: 1041px) and (max-width: 1236px) {
  /* Only 1 component can be opened */
  /* secondary-area or drawer */
}

@media (min-width: 1237px) {
   /* Both components can be opened */
   /* drawer: open */
   /* secondary-area: open */
}
```

### Mobile

When designing for mobile applications it's important to take into consideration smaller devices in
order to understand what's the minimal breakpoint but also the component and layout behavior.

Always test layouts in 2 screen sizes.

* For Android, the standard size is 360x640, which is considered a small screen for today's standards
  (2021).

⚠️ Usually, the second canvas is not a default but instead the device size used for testing. ATM it
was the iPhone XR.

---

## Workspace and Cobalt components in different canvas sizes

The canvas size in use will influence the Workspace and Cobalt components variants. This means that
when you are designing for specific canvas sizes (small, medium, and large) you should use the
available variants from the Figma library, and make sure that your development team applies the
correct variants to each viewport size.

Explore each component documentation to understand which variant should be used in your use case.

**Small components**

![Small components canvas with 8 numbered callouts](/assets/viewports/small-components.png)

1. Main app - **padding 12px**
2. Button component in small size variant - **height 32px / font-size 12px**
3. Heading component h1 for small viewports - **font-size 22px**
4. Nav component in small size variant - **padding 12px / font-size 12px**
5. Toolbar component in small size variant - **padding 12px / buttons without label**
6. Drawer component - **hidden in small size variant**
7. EmptyState component in small size variant - **fixed-width of 320px**
8. Toast component in small size variant - **padding 12px**

**Medium components**

![Medium components canvas with 8 numbered callouts](/assets/viewports/medium-components.png)

1. Main app - **padding 16px**
2. Button component in medium size variant - **height 40px / font-size 14px**
3. Heading component h1 for medium viewports - **font-size 28px**
4. Nav component in medium size variant - **padding 16px / font-size 14px**
5. Toolbar component in medium size variant - **padding 16px**
6. Drawer component - **hidden in medium-size variant**
7. EmptyState component in medium size variant - **fixed width of 484px**
8. Toast component in medium size variant - **padding 16px**

**Large components**

![Large components canvas with 8 numbered callouts](/assets/viewports/large-components.png)

1. Main app - **padding 24px**
2. Button component in medium size variant - **height 40px / font-size 14px**
3. Heading component h1 for large viewports - **font-size 28px**
4. Nav component in large size variant - **padding 24px / font-size 16px**
5. Toolbar component in large size variant - **padding 24px**
6. Drawer component - **hidden in large-size variant**
7. EmptyState component in large size variant - **fixed-width 564px**
8. Toast component in large size variant - **padding 24px**

---

## Useful links

**[Viewports sheet](https://docs.google.com/spreadsheets/d/1IwinI6QFExJ9djnUJCpDsM3xV5I2mvO9Po1lcvqCK1E/edit?usp=sharing)**
— Data from screen sizes and viewports

**[CanvasTemplate](https://www.figma.com/file/txlnFgFiMVzav4GpRfjeJ3/Workspace-library?node-id=367%3A71247)**
— Workspace component

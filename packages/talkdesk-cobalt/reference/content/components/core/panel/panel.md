# Panel

> **Cobalt core** component · `@talkdesk/cobalt-react-panel`

## Install (v3.0.3)

```sh
npm install @talkdesk/cobalt-react-panel
```

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-panel-docs--docs)

## Known gaps

Read before using it:

* Opens in a layer at the end of <body>, outside ThemeProvider's <div>, so without the theme stylesheet it loses the theme: text falls back to the browser's serif font and the theme variables don't resolve. Import @talkdesk/cobalt-theme-base/dist/styles.css and set the body font from it, as in Get started › Develop.
* data-co-bleed does nothing with the published packages: the rules that pull a bleeding element out to the panel's edges are in cobalt-theme-base's source, but not in its latest release, 2.5.0. The Bleed example renders inset, like any other content. Until a release includes them, set the negative margins yourself.

## Guidance

Panel is a component that comes from a side of the screen. It is as place to displays more information or to perform a task related with the information available in the container.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

A panel can have multiple uses, such as:

* Display content that complements the information available in the container
* Perform a task that will impact the container information. e.g. filtering

### Anatomy

![Panel example — Anatomy](/assets/panel/anatomy-2.png)

1. Header
2. Content
3. Footer
4. Overlay

### Variants

#### Sizes

There are three sizes available: Large, Medium, and Small.

![Panel example — Variants Sizes: Small](/assets/panel/sizes-small.png)
*Small*

![Panel example — Variants Sizes: Medium](/assets/panel/sizes-medium.png)
*Medium*

![Panel example — Guidelines Placement: right (default)](/assets/panel/sizes-large.png)
*Large*

![Panel example — Variants Sizes: X-Large](/assets/panel/sizes-x-large.png)
*X-Large*

#### Modifiers

![Panel example — Guidelines Placement: right (default)](/assets/panel/sizes-large.png)
*with overlay*

  ![Panel example — Variants Modifiers: without actions](/assets/panel/modifiers-without-actions.png)
*without actions*

  ![Panel example — Variants Modifiers: without dismissible button](/assets/panel/modifiers-without-dismissible-button.png)
*without dismissible button*

![Panel example — Variants Modifiers: without header](/assets/panel/modifiers-without-header.png)
*without header*

  ![Panel example — Variants Modifiers: without nav](/assets/panel/modifiers-without-nav.png)
*without nav*

  ![Panel example — Variants Modifiers: without overlay](/assets/panel/modifiers-without-overlay.png)
*without overlay*

![Panel example — Variants Modifiers: with scroll](/assets/panel/modifiers-with-scroll.png)
*with scroll*

### Guidelines

#### Group

##### Multiple panels

It is not possible to have two panels simultaneously opened.

##### Header

The panel header is an **H2 Header.** You can find it under PanelPattern in the Patterns Figma library.

![Panel example — Group Header](/assets/panel/group-header.png)

Unless we have a Nav or a Toolbar, usually the Headers **should not** have a bottom border.

![Panel example — Group Header](/assets/panel/group-header-2.png)

If the Header does not have a **Nav** or a **Toolbar**, then the spacing from the top should be **0px**.

##### Footer

Panel footers can be fixed at the bottom of the panel. You can find it under PanelPattern in the Patterns Figma library.

![Panel without a header row](/assets/panel/modifier-without-header.png)

##### Secondary area

It is possible to have both components (panel and secondary area) active.

![Panel example — Group Secondary Area](/assets/panel/group-secondary-area.png)

#### Placement

Panels are usually displayed coming from the right side of the screen (apart from some exceptional use cases). Generally, the height is the entire page size from top to bottom.

![Panel example — Guidelines Placement: right (default)](/assets/panel/sizes-large.png)
*right (default)*

  ![Panel displayed from the left side of the screen](/assets/panel/placement-left.png)
*left*

#### Overlay

To decide if the panel should be used with or without overlay you should ask:

* **Can the user take the tasks only with the information available in the panel?**

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

If yes, you should use the Panel with overlay.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/898106-panel) — Design tab, image 19.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

If not, you should use the Panel without the overlay.

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/898106-panel) — Design tab, image 20.*

![Panel displayed from the right side of the screen (default)](/assets/panel/placement-right.png)

A third option could be considered if the user needs all information available in the container to perform the task.

  In this case, the panel should be used without the overlay and also should push the container.

  This option could show responsiveness issues, so it should be avoided.

  This option should only be used for products that don’t support or that are not used in small viewports.

### Behavior

#### Responsiveness

##### Padding

Panels also follow the general spacing rules for each viewport. So we’ll have an inner padding of **L:24px / M:16px / S:12px**

![Panel example — Responsiveness Padding: Small viewport and padding](/assets/panel/padding-small-viewport-and-padding.png)
*Small viewport and padding*

![Panel example — Responsiveness Padding: Medium viewport and padding](/assets/panel/padding-medium-viewport-and-padding.png)
*Medium viewport and padding*

![Large viewport and padding](/assets/panel/padding-large-viewport.png)
*Large viewport and padding*

##### Content from external app

When the panel content is from an external app,

* The panel header and footer will follow the general spacing rules for the app viewport size.
* The panel content will follow the general spacing rules for the container size which is small.

![Panel example — Responsiveness Content from external app: Small viewport and small padding](/assets/panel/app-small-viewport-and-small-padding.png)
*Small viewport and small padding*

![Panel example — Responsiveness Content from external app: Medium viewport and small padding](/assets/panel/app-medium-viewport-and-small-padding.png)
*Medium viewport and small padding*

![Panel example — Responsiveness Content from external app: Large viewport and small padding](/assets/panel/app-large-viewport-and-small-padding.png)
*Large viewport and small padding*

#### Interaction

##### Dismissal

There are two options available:

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*panel with overlay*

Once expanded and if it does have an overlay the user must click the close button or any other area out of the panel zone to dismiss it

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/898106-panel) — Design tab, image 28.*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*panel without overlay*

If it doesn’t have a dark overlay only the close and/or the cancel button can dismiss the panel

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/898106-panel) — Design tab, image 29.*

##### Container

It is possible to change the Panel content without closing and opening the Panel by interacting with the information available in the container.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/898106-panel) — Design tab, image 30.*

#### Overflow

When the information inside the panel content is longer than the panel content height, the content section should scroll vertically with the header and footer remaining fixed in place.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/898106-panel) — Design tab, image 31.*

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Panel` and `Cobalt Design System > Patterns > PanelPattern`

* [Panel component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=2911%3A521199\&t=kK7CUBcAfB6TtCOo-1) — Core component library

* [PanelPattern](https://www.figma.com/file/RbiNiZDJelIajXxTjDY72N/3---%E2%9A%97%EF%B8%8F-Patterns?node-id=156%3A452612\&t=o66S4KY7242cafnp-1) — Patterns library

* [Panel handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=199%3A131807\&t=EDFXlUAHAmUkYOLn-1) — Handoff guidelines

* [Filtering](https://designsystem.talkdesk.com/51aaf6147/p/538f94-filtering) — Patterns

The panel header/footer pattern is available under **Cobalt Design System › Patterns › [PanelPattern](https://www.figma.com/design/RbiNiZDJelIajXxTjDY72N/?node-id=156-452612)**.

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

#### Development

* Manage focus when it opens and allow Esc to close.
* Give it a dialog/complementary role with an accessible name; with an overlay, treat the rest of the page as inert.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Panel

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | string |  | no |  | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `size` | enum | `small`, `medium`, `large`, `xlarge` | no | medium |  |
| `position` | enum | `start`, `end` | no | end |  |
| `variant` | "floating" |  | no |  |  |
| `container` | Element |  | no |  | Renders the panel inside this element instead of over the viewport, so it is positioned against — and for `ModalPanel` clipped by — that element. The element has to be positioned; a `static` container warns in development. With `shouldPushContent` it is also the flex row the panel shares with the content, so it has to be a flex or grid container instead. |
| `isOpen` | boolean |  | no |  |  |
| `defaultOpen` | boolean |  | no |  |  |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  |  |
| `isDismissible` | boolean |  | no |  | Renders a close button and lets the `Escape` key close the panel. |
| `hideCloseButton` | boolean |  | no |  | Drops the close button `isDismissible` would otherwise render, for panels whose own header already offers a way out. `Escape` still closes the panel. |
| `accessibilityLabels` | { close?: string; } |  | no |  |  |
| `shouldPushContent` | boolean |  | no |  | Makes room for the panel instead of covering the page: the panel becomes a flex child of `container` and the content next to it shrinks as it opens. Off by default.  Requires a `container` that is a flex (or grid) container. Let the content grow to fill the row so it is the part that gives way, adding `min-width: 0` if it holds anything that can't wrap.  The panel does not adapt to a container too narrow for it and the content: it is clipped, which can hide its close button, and the content is squeezed to nothing. Turning this off at those sizes, for example from a media query, is the consumer's responsibility.  A `start` panel is placed first with CSS `order` but stays last in the DOM, so keyboard and screen reader users reach it after the content.  The panel is as tall as the row, so it suits a row of fixed height with any scrolling inside the content: in a row that grows with a scrolling page, the panel scrolls away with it. |
| `shouldContainFocus` | boolean |  | no |  | Keeps keyboard focus inside the panel. Off by default: a panel without an overlay sits beside live page content, which the user is meant to reach. Note that this contains `Tab` only — the rest of the page stays readable to assistive technology, which is the point of a non-modal panel. |
| `isEntering` | boolean |  | no |  | Whether the dialog is currently performing an entry animation. Focus is not moved into the dialog until the animation completes, since moving the screen reader cursor may cause scrolling that interrupts the animation. |

### ModalPanel

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | string |  | no |  | The element's unique identifier. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/id). |
| `size` | enum | `small`, `medium`, `large`, `xlarge` | no | medium |  |
| `position` | enum | `start`, `end` | no | end |  |
| `variant` | "floating" |  | no |  |  |
| `container` | Element |  | no |  | Renders the panel inside this element instead of over the viewport, so it is positioned against — and for `ModalPanel` clipped by — that element. The element has to be positioned; a `static` container warns in development. With `shouldPushContent` it is also the flex row the panel shares with the content, so it has to be a flex or grid container instead. |
| `isOpen` | boolean |  | no |  |  |
| `defaultOpen` | boolean |  | no |  |  |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  |  |
| `isDismissible` | boolean |  | no |  | Renders a close button and lets the `Escape` key close the panel. |
| `hideCloseButton` | boolean |  | no |  | Drops the close button `isDismissible` would otherwise render, for panels whose own header already offers a way out. `Escape` still closes the panel. |
| `accessibilityLabels` | { close?: string; } |  | no |  |  |
| `isEntering` | boolean |  | no |  | Whether the dialog is currently performing an entry animation. Focus is not moved into the dialog until the animation completes, since moving the screen reader cursor may cause scrolling that interrupts the animation. |

### PanelTrigger

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |

## Examples

_5 of 15 compile against the published `@talkdesk/cobalt-react-panel@3.0.3` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** uses `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<PanelTrigger>
  <Button type="secondary">Open panel</Button>
  <Panel aria-label="Panel" isDismissible>Panel content</Panel>
</PanelTrigger>
```

### Modal

> **Doesn't compile:** uses `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<PanelTrigger>
  <Button type="secondary">Open panel</Button>
  <ModalPanel aria-label="Panel" isDismissible>
    Panel content
  </ModalPanel>
</PanelTrigger>
```

### Controlled

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<Panel aria-label="Panel" isOpen={isOpen} onOpenChange={setIsOpen}>
  Panel content
</Panel>
```

### Sizes

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<Panel aria-label="Panel" size="small" isDismissible>Panel content</Panel>
```

### Start

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<Panel aria-label="Panel" position="start" isDismissible>Panel content</Panel>
```

### RTL

> **Doesn't compile:** uses `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";
import { I18nProvider } from "react-aria-components";

<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <PanelTrigger>
      <Button type="secondary">start</Button>
      <Panel aria-label="start panel" position="start" isDismissible>
        Panel content
      </Panel>
    </PanelTrigger>
    <PanelTrigger>
      <Button type="secondary">end</Button>
      <Panel aria-label="end panel" position="end" isDismissible>
        Panel content
      </Panel>
    </PanelTrigger>
  </div>
</I18nProvider>
```

### Floating

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<Panel aria-label="Panel" variant="floating" isDismissible>Panel content</Panel>
```

### Dismissible

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<ModalPanel aria-label="Panel" isDismissible>
  Panel content
</ModalPanel>
```

### Contained

> **Doesn't compile:** uses `Box` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

const [container, setContainer] = useState(null);

<Box forwardedRef={setContainer} style={{ position: "relative" }}>
  Page content
  <Panel aria-label="Panel" container={container} isDismissible>
    Panel content
  </Panel>
</Box>
```

### Push

> **Doesn't compile:** uses `Flex`, `Box`, `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

const [container, setContainer] = useState(null);

<Flex forwardedRef={setContainer}>
  <Box grow>
    Page content
    <PanelTrigger>
      <Button type="secondary">Open panel</Button>
      <Panel
        aria-label="Panel"
        container={container}
        shouldPushContent
        isDismissible
      >
        Panel content
      </Panel>
    </PanelTrigger>
  </Box>
</Flex>
```

### Contained modal

> **Doesn't compile:** uses `Box` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

const [container, setContainer] = useState(null);

<Box forwardedRef={setContainer} style={{ position: "relative" }}>
  Page content
  <ModalPanel aria-label="Panel" container={container} isDismissible>
    Panel content
  </ModalPanel>
</Box>
```

### Without close button

> **Doesn't compile:** uses `Flex`, `Heading`, `Button`, `Text` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<ModalPanel aria-label="Panel" isDismissible hideCloseButton>
  {({ close }) => (
    <Flex direction="column" gap={4} padding={6}>
      <Flex alignY="center" gap={4}>
        <Flex grow>
          <Heading slot="title">Panel title</Heading>
        </Flex>
        <Button type="secondary" variation="transparent" onPress={close}>
          Close
        </Button>
      </Flex>
      <Text>Panel content</Text>
    </Flex>
  )}
</ModalPanel>
```

### Contain focus

> **Doesn't compile:** uses `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<Button type="secondary">Before the panel</Button>

<PanelTrigger>
  <Button type="secondary">Open panel</Button>
  <Panel aria-label="Panel" shouldContainFocus isDismissible>
    <Button type="secondary">First control</Button>
    <Button type="secondary">Last control</Button>
  </Panel>
</PanelTrigger>

<Button type="secondary">After the panel</Button>
```

### Focus order

> **Doesn't compile:** uses `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

<Button type="secondary">Before the panel</Button>

<PanelTrigger>
  <Button type="secondary">Open panel</Button>
  <Panel aria-label="Panel" isDismissible>
    <Button type="secondary">First</Button>
    <Button type="secondary">Last</Button>
  </Panel>
</PanelTrigger>

<Button type="secondary">After the panel</Button>
```

### Bleed

> **Doesn't compile:** uses `Button` without importing or defining it. Fix it before use.

```tsx
import { Panel, ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";
import Flex from "@talkdesk/cobalt-react-flex";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";

<PanelTrigger>
  <Button type="secondary">Open panel</Button>
  <Panel aria-label="Panel" isDismissible>
    <Flex direction="column" gap={3} grow alignX="stretch">
      <Heading slot="title">Panel title</Heading>
      <Text>Padded content stays inset.</Text>
      <Flex
        data-co-bleed="inline block-end"
        gap={2}
        alignX="end"
        paddingX={4}
        paddingY={3}
        backgroundColor="var(--secondary-2)"
        style={{ marginTop: "auto" }}
      >
        <Button type="secondary">Cancel</Button>
        <Button type="primary">Save</Button>
      </Flex>
    </Flex>
  </Panel>
</PanelTrigger>;
```

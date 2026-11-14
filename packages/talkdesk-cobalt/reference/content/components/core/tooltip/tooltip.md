# Tooltip

> **Cobalt core** component · `@talkdesk/cobalt-react-tooltip`
>
> Not the same as [Tooltip (Cobalt Marketplace)](../../../components/marketplace/tooltip/tooltip.md), `@talkdesk/cobalt-marketplace-react-tooltip`: a separate package with its own API. Check which one the code imports before using either.

## Install (v1.1.0)

```sh
npm install @talkdesk/cobalt-react-tooltip
```

```tsx
import { Tooltip, TooltipTrigger } from "@talkdesk/cobalt-react-tooltip";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-tooltip-docs--docs)

## Known gaps

Read before using it:

* The guidance describes three color variants (dark, light, error); the code has variant="theme" (light or dark, chosen automatically against the trigger's color scheme) and variant="error". There is no way to pick light or dark explicitly. Either the guidance or the component needs updating.
* Opens in a layer at the end of <body>, outside ThemeProvider's <div>, so without the theme stylesheet it loses the theme: text falls back to the browser's serif font and the theme variables don't resolve. Import @talkdesk/cobalt-theme-base/dist/styles.css and set the body font from it, as in Get started › Develop.

## Guidance

A Tooltip is a small piece of contextual information about an element on the screen that is displayed when a user hovers or focuses on the element.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

**A Tooltip or a StatefulPopup should only be used if the information in the tooltip is not necessary for users to complete a task.** Otherwise, the information should be present on the screen and it is not necessary to use a tooltip.

### Variants

#### Sizes

Tooltips don’t have fixed sizes, their size adapts to the content. However, should be considered a max width of:

* **300px** for small viewport;
* **520px** for medium and large viewports.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Colors

There are three color variations for tooltips. By default, they have dark text on a white background, but we can choose to invert it by using white text on a dark background. There is also an error variant that uses a red background that can be used to display error messages in tooltips.

![Tooltip example — Variants Colors: Dark](/assets/tooltip/colors-dark.png)
*Dark*

  ![Tooltip example — Variants Colors: Light](/assets/tooltip/colors-light.png)
*Light*

  ![Tooltip example — Variants Colors: Error](/assets/tooltip/colors-error.png)
*Error*

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### When to use error, light or dark tooltips?

Use the error variant to display error messages where the screen real estate is too small to show a regular error message.

![Tooltip example — Colors When to use error, light or dark tooltips?](/assets/tooltip/colors-when-to-use-error-light.png)

|                  | **Error tooltip**                           | **Dark tooltip**                                           | **Light tooltip**                                          |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------- |
| Light background | Used to display error messages in tooltips. | Used to display text-only information in tooltips.         | Used to display multiple types of information in tooltips. |
| Dark background  | Used to display error messages in tooltips. | Used to display multiple types of information in tooltips. | Used to display text-only information in tooltips.         |
| Visual example   |                                             |                                                            |                                                            |

![Tooltip example — Colors When to use error, light or dark tooltips?](/assets/tooltip/colors-when-to-use-error-light-2.png)

  ![Tooltip example — Colors When to use error, light or dark tooltips?](/assets/tooltip/colors-when-to-use-error-light-3.png)

  ![Tooltip example — Colors When to use error, light or dark tooltips?](/assets/tooltip/colors-when-to-use-error-light-4.png)

#### Theming

This component might be impacted by theme, in a sense that a theme might choose to change the default color (light or dark) of the tooltips to better adapt to it.

### Guidelines

#### Placement

Tooltips can be positioned in all corners of a hovered element. Unless there is a really good and critical reason, we should avoid the bottom positioning. Left and right positioning helps when the hovered element is on the edge of the screen so the tooltip can always be visible in the window viewport.

![Tooltip example — Guidelines Placement](/assets/tooltip/guidelines-placement.png)

**Do:** Position the tooltips in order to make sure they are always visible. This is particularly important on items that are on the edge of the screen.
![Do example](/assets/placeholder-image.svg)

**Don't:** Avoid using positions that will make the tooltip go outside of the viewport. Also, avoid using the bottom position so that it doesn't go under the mouse cursor.
![Don't example](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/94ad96-tooltip) — Design tab, image 12, image 13.*

#### Use cases

#### Disabled paired element

A tooltip can be used associated with a disabled paired element (e.g. disabled button) but this should be avoided. Whenever possible the information should be provided on the screen by using a hint, error message, or another text element.

![Caution example](/assets/tooltip/use-cases-disabled-paired-element-caution.png)
*Caution*

![Do example](/assets/tooltip/use-cases-disabled-paired-element-do.png)
*Do*

#### Tooltip vs StatefulPopup

| Initiated by   | **On hover** | **Focused** | **On click**      |
| -------------- | ------------ | ----------- | ----------------- |
| Component      | **Tooltip**  | **Tooltip** | **StatefulPopup** |
| Visual example |              |             |                   |

![Tooltip example — Tooltip vs StatefulPopup](/assets/tooltip/tooltip-vs-statefulpopup.png)

  ![Tooltip example — Tooltip vs StatefulPopup](/assets/tooltip/tooltip-vs-statefulpopup-2.png)

  ![Tooltip example — Tooltip vs StatefulPopup](/assets/tooltip/tooltip-vs-statefulpopup-3.png)

### Behavior

#### Text truncation

Tooltips can be helpful in displaying the entire content of a truncated text string.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/94ad96-tooltip) — Design tab, image 16.*

#### Spacing

Tooltips should be placed at a distance of `8px` from the triggering element. Tooltips can be placed in [multiple positions](https://designsystem.talkdesk.com/51aaf6147/p/94ad96-tooltip/t/02f775), so be sure to align them according to your context

![Tooltip example — Variants Spacing](/assets/tooltip/variants-spacing.png)

### Resources

Find this component under: `Cobalt Design System > Core Components > Tooltip`

* [Tooltip](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=279%3A10410) — Cobalt core component
* [Tooltip handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=200%3A131811\&t=ufnda0LUTEiS6ulr-1) — Handoff guidelines
* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/tooltip--positions) — Cobalt

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

* In general, be brief and concise.
* Tooltips can only accept simple text strings (one sentence). They do not support line breaking or any text style other than the default one.
* Use them to provide supplementary information to help users accomplish a task, or help minimize any concerns that might prevent people from achieving their goal.
* Never use tooltips to hide important information for task completion.
* Avoid using tooltips too often, as users might ignore them.
* Use sentence case.

**Do:** Use simple text strings.
![Do example](/assets/tooltip/do.png)

**Don't:** Avoid using large strings and don't use custom text styles.
![Don't example](/assets/tooltip/dont.png)

### When to use "?" or "i" icons in your tooltip?

When using a tooltip, you can either choose to use a **"?"** (**question mark icon)** or an **"i"** (**info icon)**. It depends on what you're trying to write on the tooltip. Here's the difference between them:

* the **"?"** must be used when users need help (or to avoid that), trying to give answers to potential questions.
* the **"i"** must be used to provide more information, knowledge, details, and context that add value to the user.

### Accessibility

### Considerations

#### Development

Tooltip is built on react-aria's `TooltipTrigger` and `Tooltip`, which meet the requirements below: the
tooltip opens on hover and on keyboard focus, `Esc` closes it, it has `role="tooltip"`, and the trigger is
linked to it with `aria-describedby`. The trigger must be focusable, such as a Cobalt `Button`.

#### Keyboard

Tooltips are activated when hovering over an element if the user is using a pointing device, like a mouse. Users who rely on the keyboard to navigate should also be able to see the tooltip when the item is focused.

When using the keyboard and an item is focused and displaying a tooltip, pressing ESC should close the tooltip.

An important notice is that tooltips should never receive focus.

#### ARIA

The tooltip component should have the correct ARIA role assigned to it and the triggering element should use the ARIA-describedby attribute to be associated with the corresponding tooltip ID.

```html
<div id="tip1" class="co-tooltip" role="tooltip"> ... </div>

<span aria-describedby="tip1"> ... </span>
```

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Tooltip

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `variant` | enum | `theme`, `error` | no | theme |  |
| `triggerRef` | RefObject<Element> |  | no |  | The ref for the element which the tooltip positions itself with respect to.  When used within a TooltipTrigger this is set automatically. It is only required when used standalone. |
| `isEntering` | boolean |  | no |  | Whether the tooltip is currently performing an entry animation. |
| `isExiting` | boolean |  | no |  | Whether the tooltip is currently performing an exit animation. |
| `UNSTABLE_portalContainer` | Element |  | no |  | The container element in which the overlay portal will be placed. This may have unknown behavior depending on where it is portalled to. @deprecated - Use a parent UNSAFE_PortalProvider to set your portal container instead. @default document.body |
| `placement` | Placement | `bottom`, `bottom left`, `bottom right`, `bottom start`, `bottom end`, `top`, `top left`, `top right`, `top start`, `top end`, `left`, `left top`, `left bottom`, `start`, `start top`, `start bottom`, `right`, `right top`, `right bottom`, `end`, `end top`, `end bottom` | no |  | The placement of the tooltip with respect to the trigger. @default 'top' |
| `containerPadding` | number |  | no |  | The placement padding that should be applied between the element and its surrounding container. @default 12 |
| `offset` | number |  | no |  | The additional offset applied along the main axis between the element and its anchor element. @default 0 |
| `crossOffset` | number |  | no |  | The additional offset applied along the cross axis between the element and its anchor element. @default 0 |
| `shouldFlip` | boolean |  | no |  | Whether the element should flip its orientation (e.g. top to bottom or left to right) when there is insufficient room for it to render completely. @default true |
| `isOpen` | boolean |  | no |  | Whether the element is rendered. |
| `arrowBoundaryOffset` | number |  | no |  | The minimum distance the arrow's edge should be from the edge of the overlay element. @default 0 |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |

### TooltipTrigger

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isDisabled` | boolean |  | no |  | Whether the tooltip should be disabled, independent from the trigger. |
| `delay` | number |  | no |  | The delay time for the tooltip to show up. [See guidelines](https://spectrum.adobe.com/web/rsp/components/tooltip#behaviors). @default 1500 |
| `closeDelay` | number |  | no |  | The delay time for the tooltip to close. [See guidelines](https://spectrum.adobe.com/web/rsp/components/tooltip#behaviors). @default 500 |
| `trigger` | "hover" \| "focus" | `hover`, `focus` | no |  | By default, opens for both focus and hover. Can be made to open only for focus. @default 'hover' |
| `shouldCloseOnPress` | boolean |  | no |  | Whether the tooltip should close when the trigger is pressed. @default true |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-react-tooltip@1.1.0` (React 18, TypeScript strict)._

### Basic

```tsx
import { Tooltip, TooltipTrigger } from "@talkdesk/cobalt-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<TooltipTrigger>
  <Button type="secondary">Info</Button>
  <Tooltip>Tooltip content</Tooltip>
</TooltipTrigger>;
```

### Variants

```tsx
import { Tooltip, TooltipTrigger } from "@talkdesk/cobalt-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";

<Flex gap={4}>
  <TooltipTrigger>
    <Button type="secondary">Theme (default)</Button>
    <Tooltip>Tooltip content</Tooltip>
  </TooltipTrigger>
  <TooltipTrigger>
    <Button type="secondary">Error</Button>
    <Tooltip variant="error">Tooltip content</Tooltip>
  </TooltipTrigger>
</Flex>;
```

### Placement

```tsx
import { Tooltip, TooltipTrigger } from "@talkdesk/cobalt-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<TooltipTrigger>
  <Button type="secondary">bottom start</Button>
  <Tooltip placement="bottom start">Tooltip content</Tooltip>
</TooltipTrigger>;
```

### Max width

```tsx
import { Tooltip, TooltipTrigger } from "@talkdesk/cobalt-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<TooltipTrigger>
  <Button type="secondary">Info</Button>
  <Tooltip>
    A long tooltip message wraps onto multiple lines once it reaches its
    max width — 300px on a small window, 520px otherwise.
  </Tooltip>
</TooltipTrigger>;
```

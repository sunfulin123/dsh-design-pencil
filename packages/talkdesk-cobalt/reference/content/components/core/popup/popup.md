# Popup

> **Cobalt core** component · `@talkdesk/cobalt-react-popup`
>
> Extended in Cobalt Marketplace by [StatefulPopup](../../../components/marketplace/stateful-popup/stateful-popup.md) (`@talkdesk/cobalt-marketplace-react-stateful-popup`), built on this package.

## Install (v2.2.8)

```sh
npm install @talkdesk/cobalt-react-popup
```

```tsx
import Popup from "@talkdesk/cobalt-react-popup";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-popup-docs--docs)

## Guidance

A small callout that helps the user complete a task or learn more and open on demand.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Popups are containers used to display transient content such as menus, options, additional actions, and more. This element pops up over all other elements on a page. They visually stand out through drop shadows floating on top of the interface.

### Anatomy

![Popup anatomy: popup container, trigger item, and content space callouts](/assets/popup/anatomy.png)

1. **Popup container** - An area to place content.
2. **Trigger item** - An interactive element that triggers the Popup to open on click, hover, or focus.
3. **Content space** - An area to place all necessary elements.

### Variants

#### Sizes

The Popup height is dependent on its content.

![Small popup, 200px wide](/assets/popup/size-small.png)
*Small*
W: 200px

![Medium popup, 300px wide, the default size](/assets/popup/size-medium.png)
*Medium*
W: 300px

![Large popup, 400px wide](/assets/popup/size-large.png)
*Large*
W: 400px

#### Modifiers

![Standalone popup with a blank content area](/assets/popup/modifier-standalone.png)
*Standalone*

  ![Top and bottom guide lines used to help position items inside the popup menu](/assets/popup/modifier-dropdown-guides.png)
*Dropdown*
Top padding: 4px

![Top and bottom guide lines used to help position items inside the popup menu](/assets/popup/modifier-dropdown-guides.png)
*Guides*
Top and bottom lines to help position items inside the popup menu

#### Position

Popups should be positioned at **8px** from the triggering element. Since the popup can be positioned on all corners, this means that it’s 8px to the left, right, top, or bottom of the triggering element.

![Popups positioned 8px from their triggering element, shown for an icon-only overflow menu and for a labeled Button](/assets/popup/position.png)

### Guidelines

#### Placement

This component should be triggered after clicking on any button/action and should respect the limitations applied by the component position.

#### Best practices

##### Do's

Popups should:

* Keep information simple and succinct.
* Be used when you need to display additional details or items on a page.
* Be triggered by an interactive component (e.g.: buttons).
* Always be positioned next to the interactive element that triggers them.
* Be used for secondary or less important information and actions since they’re hidden until users hit the trigger.

##### Don'ts

* Don’t use it to present critical information needed to complete a workflow. Use the [Modal component](/components/core/modal/) instead.
* Don’t use when the user hasn’t explicitly triggered the Popup to open on click.
* Avoid changing the styles of Popups (borders, colors, size, etc).
* Avoid using too much information inside the Popup.

##### Alignment

**Do:** Align the Popup edge with the trigger button.
![Do example](/assets/popup/alignment-do.png)

**Don't:** Don't randomly place the Popup near the trigger button.
![Don't example](/assets/popup/alignment-dont.png)

### Behavior

#### Interaction

##### Opening

The Popup component allows you to control when you want to close it. Also, it should animate from its source to reinforce the connection between them.

Also, if a Popup is placed at the bottom of a screen, it should open upwards.

##### Dismissing

A Popup can be dismissed by:

* Clicking anywhere outside of the element (including clicking the source again).
* Selecting an option.
* Taking an action inside the Popup.

![Popup example — Interaction Dismissing](/assets/popup/interaction-dismissing.gif)

#### Overflow

Scrolling is usually not needed when using a Popup. However, if needed, then the content area should scroll vertically. Do not scroll horizontally or let content bleed off the page.

#### Spacing

##### Inner padding

In design, Popups have a default inner padding of **16px** for content to live inside. However, you may reset it to 0 or adjust the top/bottom and left/right padding if needed. For example, adding a menu inside a popup will use special padding (see next section).

![Popup content area with 16px inner padding on all sides](/assets/popup/inner-padding.png)

Regarding code, the padding, being an atomic design, is **0px** by default and the padding must be added through a layout component when desired.

##### Popup menus

Popup menus have a **4px top and bottom padding**. In case you are using a popup to display a menu, there are some specific spacing rules for it. The first one is where to place the first item on the list.

You can see that there are some dotted lines on the top and bottom of the popup background. These are guide rules to position the first and last elements of the list.

You should try to position the first element until the dotted line disappears.

![Dotted top guide line for positioning the first menu item; the item is positioned to cover the guide](/assets/popup/popup-menu-top-guide.png)

All elements inside the popup already have the required spacing inside. So you just need to snap them together (**0px**). This also includes the dividers.

When finished, make sure to resize the popup so that the bottom guide is also covered by the last item in the list.

![Three menu items and a destructive action snapped together with 0px spacing; the popup is resized so the last item covers the bottom guide](/assets/popup/popup-menu-list-items.png)

#### Dimensions

##### Max width

Popups are available in three predefined widths: 200px, 300px (default), and 400px. The width can also be configured using the custom variation.

##### Max height

Popups can have an optional max height of 42% and beyond that, the scroll will come up for the user.

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Popup`

* [Popup component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=804%3A49850) — Core Components library

* [Popup handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=197-128952) — Handoff guidelines

* [Dropdown](/components/core/dropdown/) — Popup menu from a dropdown use Popups as a base layer.

* [Tooltip](/components/core/tooltip/) — Tooltips use Popups as a base layer. they have a trigger button, Popup container and text.

* [StatefulPopup](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/marketplace_marketplace-components-statefulpopup-stories--default) — Marketplace library

### Code

### Props

### Examples

### Content

### Introduction

The Popup component is used to display additional information or options that are related to a specific task or section.

### Tone and voice

The tone and voice for the Popup component should be informative, helpful, and occasionally friendly. Be clear and predictable - the content provided should guide users through the additional information or options that are shown on the Popup.

### Word choice

The language used in the Popup should be clear, concise, and easy to understand. Be action-led and use action-oriented words such as "Learn more", "View details", or "Edit" to describe the function of the Popup.

Avoid unnecessary words and articles such as “the”, “an”, or “a”.

Avoid using technical jargon or language that may confuse users.

### Concise and clear writing

The text in the Popup should be short and to the point.

Be concise but still provide enough information so the user can easily find and navigate to the path they desire.

Use bullet points or numbered lists to break up information into easily digestible chunks. Make sure the Popup is visually appealing and easy to navigate, with clear headings and subheadings.

### Examples

##### Do's

* Do tailor the text in the Popup to match the context of the trigger.
* Do use clear and concise language to describe the function of the Popup.
* Do make sure the Popup is visually appealing and easy to navigate.

##### Don'ts

* Don't use technical jargon or language that may confuse users.
* Don't overload the Popup with too much information, as this may overwhelm the user.

### Accessibility

### Considerations

#### Development

* Manage focus and position relative to the trigger; support Esc to dismiss.
* Apply an appropriate role (menu/dialog) and set the trigger's `aria-expanded`/`aria-haspopup`.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts the standard `HTMLAttributes<PopupType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `shape` | "compact" |  | no |  |  |
| `dark` | boolean |  | no |  | deprecated |
| `variation` | enum | `dark`, `theme`, `light`, `error` | no |  |  |
| `visible` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_3 of 5 compile against the published `@talkdesk/cobalt-react-popup@2.2.8` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** uses `Portal` without importing or defining it. Fix it before use.

```tsx
import Popup from "@talkdesk/cobalt-react-popup";
import PortalProvider from "@talkdesk/cobalt-react-portal-provider";

// The most common use case will be to render the Popup in a
// different container. A PortalProvider should be used to accomplish that.

<PortalProvider>
  <p>Some random content</p>
  <Portal>
    <Popup visible>
      ...
    </Popup>
  </Portal>
</PortalProvider>
```

### Sizes

```tsx
import Popup from "@talkdesk/cobalt-react-popup";

<Popup visible size="small">...</Popup>
<Popup visible size="medium">...</Popup>
<Popup visible size="large">...</Popup>
```

### Compact

```tsx
import Popup from "@talkdesk/cobalt-react-popup";

<Popup visible shape="compact">...</Popup>;
```

### Variations

```tsx
import Popup from "@talkdesk/cobalt-react-popup";

<Popup visible variation="light">...</Popup>;
<Popup visible variation="dark">...</Popup>;
<Popup visible variation="error">...</Popup>;
<Popup visible variation="theme">...</Popup>;
```

### Positioning

> **Doesn't compile:** the published types reject it: Object literal may only specify known properties, but 'gap' does not exist in type 'Options'. Did you mean to write 'gapX'? (it also uses `FunctionComponent`, `AnchorElement` without importing it). Fix it before use.

```tsx
import Popup from "@talkdesk/cobalt-react-popup";
import usePosition from "@talkdesk/cobalt-react-position-hook";

const PopupPositioning: FunctionComponent = props => {

  // Node should be the node of the "anchor" element to be considered for positioning the popup
  // Origin and Direction must be one of: "N", "NE", "E", "SE", "S", "SW", "W", "NW"
  // Gap is the margin (in px) between the "anchor" element and the popup
  // position must be defined before Popup is visible
  // The elementRef must be passed to the Popup so that optimal positioning algorithm is applied */

  const { position, elementRef } = usePosition(node, {
    origin: "E",
    direction: "E",
    gap: 10
  });

  return (
    <>
      <AnchorElement />

      <Popup visible={visible && !!position} forwardedRef={elementRef} style={{ ...position }}>
        ...
      </Popup>
    </>
  );
};
```

# Popover

> **Cobalt core** component · `@talkdesk/cobalt-react-popover`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.2.1)

```sh
npm install @talkdesk/cobalt-react-popover
```

```tsx
import { Popover, PopoverDialog, PopoverTrigger } from "@talkdesk/cobalt-react-popover";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-popover-docs--docs)

## Known gaps

Read before using it:

* Opens in a layer at the end of <body>, outside ThemeProvider's <div>, so without the theme stylesheet it loses the theme: text falls back to the browser's serif font and the theme variables don't resolve. Import @talkdesk/cobalt-theme-base/dist/styles.css and set the body font from it, as in Get started › Develop.
* data-co-bleed does nothing with the published packages: the rules that pull a bleeding element out to the popover's edges are in cobalt-theme-base's source, but not in its latest release, 2.5.0. The Bleed example renders inset, like any other content. Until a release includes them, set the negative margins yourself.

## Guidance

Popover is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Popover yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

### Popover

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `small`, `medium`, `large` | no |  |  |
| `data-co-surface` | string \| number |  | no |  | The surface level of the popover, from 0 to 3. Defaults to one level above the closest surface. |
| `trigger` | string |  | no |  | The name of the component that triggered the popover. This is reflected on the element as the `data-trigger` attribute, and can be used to provide specific styles for the popover depending on which element triggered it. |
| `triggerRef` | RefObject<Element> |  | no |  | The ref for the element which the popover positions itself with respect to.  When used within a trigger component such as DialogTrigger, MenuTrigger, Select, etc., this is set automatically. It is only required when used standalone. |
| `isEntering` | boolean |  | no |  | Whether the popover is currently performing an entry animation. |
| `isExiting` | boolean |  | no |  | Whether the popover is currently performing an exit animation. |
| `shouldSkipAnimation` | boolean |  | no |  | Whether the popover should appear and disappear without an entry or exit animation. This is used by components such as PreviewTrigger to skip animations when quickly swapping between overlays. |
| `UNSTABLE_portalContainer` | Element |  | no |  | The container element in which the overlay portal will be placed. This may have unknown behavior depending on where it is portalled to. @deprecated - Use a parent UNSAFE_PortalProvider to set your portal container instead. @default document.body |
| `offset` | number |  | no |  | The additional offset applied along the main axis between the element and its anchor element. @default 8 |
| `placement` | Placement | `bottom`, `bottom left`, `bottom right`, `bottom start`, `bottom end`, `top`, `top left`, `top right`, `top start`, `top end`, `left`, `left top`, `left bottom`, `start`, `start top`, `start bottom`, `right`, `right top`, `right bottom`, `end`, `end top`, `end bottom` | no |  | The placement of the element with respect to its anchor element. @default 'bottom' |
| `containerPadding` | number |  | no |  | The placement padding that should be applied between the element and its surrounding container. @default 12 |
| `crossOffset` | number |  | no |  | The additional offset applied along the cross axis between the element and its anchor element. @default 0 |
| `shouldFlip` | boolean |  | no |  | Whether the element should flip its orientation (e.g. top to bottom or left to right) when there is insufficient room for it to render completely. @default true |
| `boundaryElement` | Element |  | no |  | Element that that serves as the positioning boundary. @default document.body |
| `arrowRef` | RefObject<Element> |  | no |  | A ref for the popover arrow element. |
| `scrollRef` | RefObject<Element> |  | no |  | A ref for the scrollable region within the overlay. @default overlayRef |
| `shouldUpdatePosition` | boolean |  | no |  | Whether the overlay should update its position automatically. @default true |
| `maxHeight` | number |  | no |  | The maxHeight specified for the overlay element. By default, it will take all space up to the current viewport height. |
| `arrowBoundaryOffset` | number |  | no |  | The minimum distance the arrow's edge should be from the edge of the overlay element. @default 0 |
| `getTargetRect` | (target: Element) => DOMRect |  | no |  | Overrides the target element's bounding rectangle. Useful for positioning relative to a specific point such as the mouse cursor (e.g. context menus) or text selection. @default target.getBoundingClientRect() @param target - The target element. |
| `onFocusWithin` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the target element or a descendant receives focus. |
| `onBlurWithin` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the target element and all descendants lose focus. |
| `onFocusWithinChange` | (isFocusWithin: boolean) => void |  | no |  | Handler that is called when the the focus within state changes. |
| `isNonModal` | boolean |  | no |  | Whether the popover is non-modal, i.e. elements outside the popover may be interacted with by assistive technologies.  Most popovers should not use this option as it may negatively impact the screen reader experience. Only use with components such as combobox, which are designed to handle this situation carefully. |
| `isKeyboardDismissDisabled` | boolean |  | no |  | Whether pressing the escape key to close the popover should be disabled.  Most popovers should not use this option. When set to true, an alternative way to close the popover with a keyboard must be provided. @default false |
| `shouldCloseOnInteractOutside` | (element: Element) => boolean |  | no |  | When user interacts with the argument element outside of the popover ref, return true if onClose should be called. This gives you a chance to filter out interaction with elements that should not dismiss the popover. By default, onClose will always be called on interaction outside the popover ref. |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |

### PopoverDialog

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isEntering` | boolean |  | no |  | Whether the dialog is currently performing an entry animation. Focus is not moved into the dialog until the animation completes, since moving the screen reader cursor may cause scrolling that interrupts the animation. |

### PopoverTrigger

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |

## Examples

_7 of 7 compile against the published `@talkdesk/cobalt-react-popover@1.2.1` (React 18, TypeScript strict)._

### Basic

```tsx
import { Popover, PopoverTrigger } from "@talkdesk/cobalt-react-popover";
import Button from "@talkdesk/cobalt-react-button";

<PopoverTrigger>
  <Button type="secondary">Info</Button>
  <Popover>Popover content</Popover>
</PopoverTrigger>;
```

### Sizes

```tsx
import { Popover, PopoverTrigger } from "@talkdesk/cobalt-react-popover";
import Button from "@talkdesk/cobalt-react-button";

<PopoverTrigger>
  <Button type="secondary">Small</Button>
  <Popover size="small">Popover content</Popover>
</PopoverTrigger>;
```

### Placement

```tsx
import { Popover, PopoverTrigger } from "@talkdesk/cobalt-react-popover";
import Button from "@talkdesk/cobalt-react-button";

<PopoverTrigger>
  <Button type="secondary">bottom start</Button>
  <Popover placement="bottom start">Popover content</Popover>
</PopoverTrigger>;
```

### Focus management

```tsx
import { Popover, PopoverTrigger } from "@talkdesk/cobalt-react-popover";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<PopoverTrigger>
  <Button type="secondary">Open</Button>
  <Popover size="medium">
    <Flex direction="column" gap={4}>
      <TextInput label="Name" placeholder="Jane Doe" />
      <TextInput label="Email" type="email" placeholder="jane@doe.com" />
      <Flex gap={2} alignX="end">
        <Button type="secondary">Cancel</Button>
        <Button type="primary">Save</Button>
      </Flex>
    </Flex>
  </Popover>
</PopoverTrigger>;
```

### Bleed

```tsx
import { Popover, PopoverTrigger } from "@talkdesk/cobalt-react-popover";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";

<PopoverTrigger>
  <Button type="secondary">Bleed</Button>
  <Popover size="medium">
    <Flex direction="column" gap={4} alignX="stretch">
      <p style={{ margin: 0 }}>Padded content stays inset.</p>
      <Flex
        data-co-bleed="inline block-end"
        gap={2}
        alignX="end"
        paddingX={4}
        paddingY={3}
        backgroundColor="var(--secondary-2)"
      >
        <Button type="secondary" size="small">
          Cancel
        </Button>
        <Button type="primary" size="small">
          Save
        </Button>
      </Flex>
    </Flex>
  </Popover>
</PopoverTrigger>;
```

### Custom trigger

```tsx
import { Popover } from "@talkdesk/cobalt-react-popover";
import { MenuTrigger, Pressable } from "react-aria-components";

<MenuTrigger>
  <Pressable>
    <button type="button">Info</button>
  </Pressable>
  <Popover>Popover content</Popover>
</MenuTrigger>;
```

### Dialog

```tsx
import {
  Popover,
  PopoverDialog,
  PopoverTrigger,
} from "@talkdesk/cobalt-react-popover";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { TextInput } from "@talkdesk/cobalt-react-text-input";

<PopoverTrigger>
  <Button type="secondary">Open</Button>
  <Popover size="medium">
    <PopoverDialog aria-label="Edit details">
      {({ close }) => (
        <Flex direction="column" gap={4} alignX="stretch">
          <TextInput label="Name" placeholder="Jane Doe" />
          <Flex
            data-co-bleed="inline block-end"
            gap={2}
            alignX="end"
            paddingX={4}
            paddingY={3}
            backgroundColor="var(--secondary-2)"
          >
            <Button type="secondary" size="small" onPress={close}>
              Cancel
            </Button>
            <Button type="primary" size="small" onPress={close}>
              Save
            </Button>
          </Flex>
        </Flex>
      )}
    </PopoverDialog>
  </Popover>
</PopoverTrigger>;
```

# Tooltip

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-tooltip`
>
> Not the same as [Tooltip (Cobalt core)](../../../components/core/tooltip/tooltip.md), `@talkdesk/cobalt-react-tooltip`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.3.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-tooltip
```

```tsx
import Tooltip, { PositionCenterBottom, PositionCenterTop, PositionLeftBottom, PositionLeftCenter, PositionLeftTop, PositionRightBottom, PositionRightCenter, PositionRightTop } from "@talkdesk/cobalt-marketplace-react-tooltip";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-tooltip-stories--positions)

## Known gaps

Read before using it:

* Opens on mouse hover only: the trigger gets mouseenter/mouseleave handlers and no focus/blur, so keyboard users never see the tooltip. The Popup page's Tooltip guidance requires it to show on focus.
* No Esc handling to close an open tooltip, which the Tooltip accessibility guidance requires.
* No role="tooltip" and no aria-describedby link between trigger and tooltip; the TooltipProps type accepts no role or id, so consumers cannot add them either. The guidance's own example shows role="tooltip" + aria-describedby.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-popup`](../../../components/core/popup/popup.md), [`@talkdesk/cobalt-react-portal-provider`](../../../providers/core/portal-provider/portal-provider.md), [`@talkdesk/cobalt-react-position-hook`](../../../hooks/core/position-hook/position-hook.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

Tooltip is the Cobalt Marketplace tooltip, built on the Cobalt core [Popup](/components/core/popup/) component. Cobalt core has its own [Tooltip](/components/core/tooltip/): a separate package with a different API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for tooltips is on the Cobalt core [Tooltip](/components/core/tooltip/) page, and this package follows it. Its own props and examples are in the Code tab.

What this package adds to a core `Popup`:

* Showing and hiding on hover of a trigger: wrap the trigger as `children`, or pass `triggerRef`.
* Text from `label` (one line, truncated with an ellipsis) or custom `content`.
* Placement with the `Position*` exports (centred above the trigger by default), kept inside the viewport by capping the tooltip's width.
* The `variation` colors: `theme` (default), `light`, `dark` and `error`.

### Code

### Props

### Examples

### Content

### Writing guidelines

Tooltip copy follows the core [Tooltip](/components/core/tooltip/) content guidelines. For copy
rules that apply everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

The accessibility requirements are on the core [Tooltip](/components/core/tooltip/) page; the core Tooltip
meets them. This package does not yet (all three are listed as known gaps in the Code tab), so until it does:

* **Keyboard.** It opens on mouse hover only, not on focus, so keyboard users never see it. Do not put
  information only in a tooltip.
* **Esc.** There is no Esc handling to close it.
* **ARIA.** It sets no `role="tooltip"` and cannot be linked to its trigger with `aria-describedby`:
  its props type accepts no `role` or `id`. Make sure the trigger's own accessible name, or text on the
  screen, carries the same information.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Tooltip

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionCenterBottom

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionCenterTop

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionLeftBottom

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionLeftCenter

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionLeftTop

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionRightBottom

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionRightCenter

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

### PositionRightTop

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `position` | Position |  | no |  |  |
| `variation` | enum | `theme`, `light`, `dark`, `error` | no | theme |  |
| `disabled` | boolean |  | no | false |  |
| `autoGap` | number |  | no | 10 |  |
| `label` | string |  | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `triggerRef` | RefObject<HTMLElement> |  | no |  |  |

## Examples

_7 of 7 compile against the published `@talkdesk/cobalt-marketplace-react-tooltip@2.3.0` (React 18, TypeScript strict)._

### Positions

```tsx
import Tooltip, {
  PositionCenterBottom,
  PositionCenterTop,
  PositionLeftBottom,
  PositionLeftCenter,
  PositionLeftTop,
  PositionRightBottom,
  PositionRightCenter,
  PositionRightTop,
} from "@talkdesk/cobalt-marketplace-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

  <Tooltip label="Tooltip with more text" position={PositionLeftTop}>
    <Button variation="outline">Left Top</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionCenterTop}>
    <Button variation="outline">Center Top</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionRightTop}>
    <Button variation="outline">Right Top</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionRightCenter}>
    <Button variation="outline">Right Center</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionLeftCenter}>
    <Button variation="outline">Left Center</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionLeftBottom}>
    <Button variation="outline">Left Bottom</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionCenterBottom}>
    <Button variation="outline">Center Bottom</Button>
  </Tooltip>
  <Tooltip label="Tooltip with more text" position={PositionRightBottom}>
    <Button variation="outline">Right Bottom</Button>
  </Tooltip>
```

### Error

```tsx
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<Tooltip label="Tooltip can be used to display more info when hovering text" variation="error">
  <Button variation="outline">Error</Button>
</Tooltip>
```

### Dark

```tsx
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<Tooltip label="Tooltip can be used to display more info when hovering text" variation="dark">
  <Button variation="outline">Inverted</Button>
</Tooltip>
```

### Text

```tsx
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import { Text } from "@talkdesk/cobalt-react-typography";

<Tooltip label="Tooltip can be used to display more info when hovering text">
  <Text>text</Text>
</Tooltip>
```

### Disabled

```tsx
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<Tooltip
  label="Tooltip can be used to display more info when hovering text"
  disabled
>
  <Button variation="outline">Disabled Tooltip</Button>
</Tooltip>
```

### Content

```tsx
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";
import { Text } from "@talkdesk/cobalt-react-typography";

<Tooltip
  content={
    <Text>
      We can add more content,{" "}
      <Text inline weight="medium">
        no longer just a simple string of text
      </Text>
    </Text>
  }
>
  <Button variation="outline">See more</Button>
</Tooltip>
```

### Trigger ref

```tsx
import Tooltip from "@talkdesk/cobalt-marketplace-react-tooltip";
import Button from "@talkdesk/cobalt-react-button";

<Button variation="outline" forwardedRef={buttonRef}>See more</Button>
<Tooltip label="Hello world" triggerRef={buttonRef} />
```

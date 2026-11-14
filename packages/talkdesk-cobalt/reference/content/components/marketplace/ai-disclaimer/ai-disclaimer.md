# AiDisclaimer

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-ai-disclaimer`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v1.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-ai-disclaimer
```

```tsx
import AiDisclaimer, { PositionLeftTop, PositionCenterTop, PositionRightTop, PositionLeftCenter, PositionRightCenter, PositionLeftBottom, PositionCenterBottom, PositionRightBottom } from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-aidisclaimer-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

AiDisclaimer is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for AiDisclaimer yet. Its props and examples are in the Code tab, and its Storybook is linked above.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### AiDisclaimer

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | string |  | no | AI Powered | Translation label. If you don't set this, the component will use default values |
| `tooltipContent` | ReactNode |  | no | AI Content should always be reviewed | Translation tooltip. If you don't set this, the component will use default values |
| `tooltipPosition` | Position |  | no |  | Position of the tooltip relative to the component |
| `tooltipVariation` | enum | `theme`, `light`, `dark`, `error` | no | dark | Variation of the tooltip |

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

## Examples

_4 of 5 compile against the published `@talkdesk/cobalt-marketplace-react-ai-disclaimer@1.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import AiDisclaimer from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";

<AiDisclaimer />
```

### Custom label

```tsx
import AiDisclaimer from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";

<AiDisclaimer label="AI Generated" />
```

### Custom tooltip

> **Doesn't compile:** the published types reject it: JSX element class does not support attributes because it does not have a 'props' property. (it also uses `Text` without importing it). Fix it before use.

```tsx
import AiDisclaimer from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";

<AiDisclaimer tooltipContent="AI Generated analytics" />
<AiDisclaimer
  tooltipContent={
    <Text weight="medium">AI Enhanced caller verification</Text>
  }
/>
```

### Tooltip position

```tsx
import AiDisclaimer, {
  PositionLeftTop,
  PositionCenterTop,
  PositionRightTop,
  PositionLeftCenter,
  PositionRightCenter,
  PositionLeftBottom,
  PositionCenterBottom,
  PositionRightBottom,
} from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";

<AiDisclaimer tooltipPosition={PositionLeftTop} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionCenterTop} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionRightTop} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionLeftCenter} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionRightCenter} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionLeftBottom} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionCenterBottom} label="AI Powered" />
<AiDisclaimer tooltipPosition={PositionRightBottom} label="AI Powered" />
```

### Tooltip variation

```tsx
import AiDisclaimer from "@talkdesk/cobalt-marketplace-react-ai-disclaimer";

<AiDisclaimer tooltipVariation="dark" />
<AiDisclaimer tooltipVariation="light" />
```

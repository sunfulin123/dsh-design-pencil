# TranscriptionBubble

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-transcription-bubble`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v3.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-transcription-bubble
```

```tsx
import TranscriptionBubble, { DefaultTranscriptionBubble, TranscriptionBubbleInfo, TranscriptionBubbleAvatar, TranscriptionBubbleMessage, useTranscriptionBubbleStyles } from "@talkdesk/cobalt-marketplace-react-transcription-bubble";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-transcriptionbubble-stories--default)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-avatar`](../../../components/core/avatar/avatar.md), [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-chat-bubble`](../../../components/core/chat-bubble/chat-bubble.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

TranscriptionBubble is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for TranscriptionBubble yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

### TranscriptionBubble

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `alignment` | enum | `sent`, `received` | yes |  |  |

### DefaultTranscriptionBubble

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `alignment` | enum | `sent`, `received` | yes |  |  |
| `type` | enum | `sent`, `received`, `bot` | no |  |  |
| `content` | ReactNode |  | no |  |  |
| `time` | string |  | no |  |  |
| `name` | string |  | no |  |  |
| `avatarContent` | ReactNode |  | no |  |  |

### TranscriptionBubbleInfo

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `time` | string |  | yes |  |  |
| `name` | string |  | yes |  |  |

### TranscriptionBubbleAvatar

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | enum | `basic`, `theme`, `light-theme`, `blue`, `green`, `purple`, `teal`, `yellow`, `red`, `orange` | no | theme |  |

### TranscriptionBubbleMessage

_Also accepts the standard `HTMLAttributes<HTMLElement>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `content` | ReactNode |  | no |  |  |
| `type` | enum | `sent`, `received`, `bot` | no |  |  |

## Examples

_3 of 8 compile against the published `@talkdesk/cobalt-marketplace-react-transcription-bubble@3.2.0` (React 18, TypeScript strict)._

### Main

```tsx
import { DefaultTranscriptionBubble } from "@talkdesk/cobalt-marketplace-react-transcription-bubble";

<DefaultTranscriptionBubble
  type="sent"
  alignment="sent"
  name="John Doe"
  time="00:00"
  content="This is an agent transcription"
  avatarContent="JD"
/>
```

### Bubble type

```tsx
import { DefaultTranscriptionBubble } from "@talkdesk/cobalt-marketplace-react-transcription-bubble";

<DefaultTranscriptionBubble
  type="sent"
  alignment="sent"
  name="John Doe"
  time="00:00"
  content="This is an agent transcription"
  avatarContent="JD"
/>
<DefaultTranscriptionBubble
  type="received"
  alignment="received"
  name="John Doe"
  time="00:00"
  content="This is a client transcription"
  avatarContent="JD"
/>
<DefaultTranscriptionBubble
  type="bot"
  alignment="sent"
  name="John Doe"
  time="00:00"
  content="This is a bot transcription"
  avatarContent="JD"
/>
<DefaultTranscriptionBubble
  type="bot"
  alignment="received"
  name="John Doe"
  time="00:00"
  content="This is a bot transcription"
  avatarContent="JD"
/>
```

### Grouped bubbles

```tsx
import { DefaultTranscriptionBubble, useTranscriptionBubbleStyles } from "@talkdesk/cobalt-marketplace-react-transcription-bubble";
import Flex from "@talkdesk/cobalt-react-flex";

const { STYLES_TEMPLATES } = useTranscriptionBubbleStyles();

<Flex
  direction="column"
  gap={STYLES_TEMPLATES.cobaltStyle.default.bubbleWrapper.gap}
>
  {/* Bubbles Grouped */}
  <DefaultTranscriptionBubble
    type="received"
    alignment="received"
    name="John Doe"
    time="00:00"
    content="This is a client transcription"
    avatarContent="JD"
  />
  <DefaultTranscriptionBubble
    type="received"
    alignment="received"
    content="This is a client transcription"
    avatarContent="JD"
  />
  {/* Bubbles Not Grouped */}
  <DefaultTranscriptionBubble
    type="received"
    alignment="received"
    name="John Doe"
    time="00:00"
    content="This is a client transcription"
    avatarContent="JD"
  />
  <DefaultTranscriptionBubble
    type="received"
    alignment="received"
    name="John Doe"
    time="00:00"
    content="This is a client transcription"
    avatarContent="JD"
  />
</Flex>
```

### Message content

> **Doesn't compile:** uses `Mark` without importing or defining it. Fix it before use.

```tsx
import { DefaultTranscriptionBubble, useTranscriptionBubbleStyles } from "@talkdesk/cobalt-marketplace-react-transcription-bubble";
import { Text } from "@talkdesk/cobalt-react-typography";

const Component = () => (
  <Text>
    This <Mark>word</Mark> is highlighted
  </Text>
);

return (
  <DefaultTranscriptionBubble
    type="received"
    alignment="received"
    name="John Doe"
    time="00:00"
    content={Component()}
    avatarContent="JD"
  />
);
```

### Bottom content

> **Doesn't compile:** the published types reject it: JSX expressions must have one parent element.. Fix it before use.

```tsx
import TranscriptionBubble, {
  TranscriptionBubbleAvatar,
  TranscriptionBubbleInfo,
  TranscriptionBubbleMessage,
  useTranscriptionBubbleStyles
} from "@talkdesk/cobalt-marketplace-react-transcription-bubble";
import Flex from "@talkdesk/cobalt-react-flex";
import { Text } from "@talkdesk/cobalt-react-typography";

const { STYLES_TEMPLATES } = useTranscriptionBubbleStyles();

const Component = ({ type }: { type: "sent" | "received" }) => (
  <Flex
    style={STYLES_TEMPLATES.cssStyle.bottomChildren.base[type]}
    paddingTop={
      STYLES_TEMPLATES.cobaltStyle.bottomChildren.bubbleWrapper.paddingTop
    }
  >
    <Text size="small">Placeholder</Text>
  </Flex>
);

return (
  <TranscriptionBubble
    alignment="sent"
    style={STYLES_TEMPLATES.cssStyle.bottomChildren.bubbleWrapper.sent}
  >
    <TranscriptionBubbleInfo
      name="John Doe"
      time="00:00"
      style={STYLES_TEMPLATES.cssStyle.infoWrapper.sent}
    />
    <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
    <TranscriptionBubbleMessage
      type="sent"
      content="This is an agent transcription"
    />
    <Component type="sent" />
  </TranscriptionBubble>

  <TranscriptionBubble
    alignment="received"
    style={STYLES_TEMPLATES.cssStyle.bottomChildren.bubbleWrapper.received}
  >
    <TranscriptionBubbleInfo
      name="John Doe"
      time="00:00"
      style={STYLES_TEMPLATES.cssStyle.infoWrapper.received}
    />
    <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
    <TranscriptionBubbleMessage
      type="received"
      content="This is an agent transcription"
    />
    <Component type="received" />
  </TranscriptionBubble>
);
```

### Info content

> **Doesn't compile:** the published types reject it: JSX element class does not support attributes because it does not have a 'props' property. (it also uses `Text` without importing it). Fix it before use.

```tsx
import TranscriptionBubble, {
  TranscriptionBubbleAvatar,
  TranscriptionBubbleInfo,
  TranscriptionBubbleMessage,
  useTranscriptionBubbleStyles
} from "@talkdesk/cobalt-marketplace-react-transcription-bubble";

const { STYLES_TEMPLATES } = useTranscriptionBubbleStyles();

const Component = () => <Text size="small">Placeholder</Text>;

return (
  <>
    <TranscriptionBubble alignment="sent">
      <TranscriptionBubbleInfo
        style={STYLES_TEMPLATES.cssStyle.infoWrapper.sent}
        name="John Doe"
        time="00:00"
      >
        <Component />
      </TranscriptionBubbleInfo>
      <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
      <TranscriptionBubbleMessage
        type="sent"
        content="This is an agent transcription"
      />
    </TranscriptionBubble>

    <TranscriptionBubble alignment="received">
      <TranscriptionBubbleInfo
        name="John Doe"
        time="00:00"
        style={STYLES_TEMPLATES.cssStyle.infoWrapper.received}
      >
        <Component />
      </TranscriptionBubbleInfo>
      <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
      <TranscriptionBubbleMessage
        type="received"
        content="This is an agent transcription"
      />
    </TranscriptionBubble>
  </>
);
```

### Side content

> **Doesn't compile:** the published types reject it: JSX expressions must have one parent element. (it also uses `Flex` without importing it). Fix it before use.

```tsx
import TranscriptionBubble, {
  TranscriptionBubbleAvatar,
  TranscriptionBubbleInfo,
  TranscriptionBubbleMessage,
  useTranscriptionBubbleStyles
} from "@talkdesk/cobalt-marketplace-react-transcription-bubble";
import { Text } from "@talkdesk/cobalt-react-typography";

const { STYLES_TEMPLATES } = useTranscriptionBubbleStyles();

const Component = ({ type }: { type: "sent" | "received" }) => (
  <Flex
    alignY="center"
    paddingX="1"
    style={STYLES_TEMPLATES.cssStyle.sideChildren.base[type]}
  >
    <Text size="small">Placeholder</Text>
  </Flex>
);

return (
  <TranscriptionBubble
    alignment="sent"
    style={STYLES_TEMPLATES.cssStyle.sideChildren.bubbleWrapper.sent}
  >
    <TranscriptionBubbleInfo
      name="John Doe"
      time="00:00"
      style={STYLES_TEMPLATES.cssStyle.infoWrapper.sent}
    />
    <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
    <TranscriptionBubbleMessage
      type="sent"
      content="This is an agent transcription"
      style={STYLES_TEMPLATES.cssStyle.sideChildren.messageWrapper}
    />
    <Component type="sent" />
  </TranscriptionBubble>

  <TranscriptionBubble
    alignment="received"
    style={STYLES_TEMPLATES.cssStyle.sideChildren.bubbleWrapper.received}
  >
    <TranscriptionBubbleInfo
      name="John Doe"
      time="00:00"
      style={STYLES_TEMPLATES.cssStyle.infoWrapper.received}
    />
    <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
    <TranscriptionBubbleMessage
      type="received"
      content="This is an agent transcription"
    />
    <Component type="received" />
  </TranscriptionBubble>
);
```

### Bottom side content

> **Doesn't compile:** uses `Flex` without importing or defining it. Fix it before use.

```tsx
import TranscriptionBubble, {
  TranscriptionBubbleAvatar,
  TranscriptionBubbleInfo,
  TranscriptionBubbleMessage,
  useTranscriptionBubbleStyles
} from "@talkdesk/cobalt-marketplace-react-transcription-bubble";
import { Text } from "@talkdesk/cobalt-react-typography";

const { STYLES_TEMPLATES } = useTranscriptionBubbleStyles();

const Bottom = ({ type }: { type: "sent" | "received" }) => (
  <Flex
    alignY="center"
    paddingX="1"
    style={STYLES_TEMPLATES.cssStyle.bottomChildren.base[type]}
  >
    <Text size="small">Placeholder</Text>
  </Flex>
);

const Side = ({ type }: { type: "sent" | "received" }) => (
  <Flex
    alignY="center"
    paddingX="1"
    style={STYLES_TEMPLATES.cssStyle.sideChildren.base[type]}
  >
    <Text size="small">Placeholder</Text>
  </Flex>
);

return (
  <>
    <TranscriptionBubble
      alignment="sent"
      style={STYLES_TEMPLATES.cssStyle.bottomSideChildren.bubbleWrapper.sent}
    >
      <TranscriptionBubbleInfo
        name="John Doe"
        time="00:00"
        style={STYLES_TEMPLATES.cssStyle.infoWrapper.sent}
      />
      <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
      <TranscriptionBubbleMessage
        type="sent"
        content="This is an agent transcription"
        style={STYLES_TEMPLATES.cssStyle.sideChildren.messageWrapper}
      />
      <Side type="sent" />
      <Bottom type="sent" />
    </TranscriptionBubble>

    <TranscriptionBubble
      alignment="received"
      style={
        STYLES_TEMPLATES.cssStyle.bottomSideChildren.bubbleWrapper.received
      }
    >
      <TranscriptionBubbleInfo
        name="John Doe"
        time="00:00"
        style={STYLES_TEMPLATES.cssStyle.infoWrapper.received}
      />
      <TranscriptionBubbleAvatar>JD</TranscriptionBubbleAvatar>
      <TranscriptionBubbleMessage
        type="received"
        content="This is an agent transcription"
      />
      <Side type="received" />
      <Bottom type="received" />
    </TranscriptionBubble>
  </>
);
```

# Timepicker

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-timepicker`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.1.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-timepicker
```

```tsx
import Timepicker from "@talkdesk/cobalt-marketplace-react-timepicker";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-timepicker-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-input`](../../../components/core/input/input.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

Timepicker is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Timepicker yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `daySpan` | number |  | no | 1 |  |
| `format24H` | boolean |  | no | false |  |
| `defaultHours` | number |  | no | 0 |  |
| `defaultMinutes` | number |  | no | 0 |  |
| `defaultMeridian` | enum | `AM`, `PM` | no | AM |  |
| `onChange` | (params: TimeType) => void |  | yes |  |  |

## Examples

_5 of 6 compile against the published `@talkdesk/cobalt-marketplace-react-timepicker@2.1.0` (React 18, TypeScript strict)._

### Main

```tsx
import Timepicker from '@talkdesk/cobalt-marketplace-react-timepicker';

<Timepicker onChange={() => null} />
```

### Format24h

```tsx
import Timepicker from '@talkdesk/cobalt-marketplace-react-timepicker';

<Timepicker format24H onChange={() => null} />
```

### Defaulttime

```tsx
import Timepicker from '@talkdesk/cobalt-marketplace-react-timepicker';

<Timepicker defaultHours={6} defaultMinutes={30} onChange={() => null} />
```

### Dayspan

```tsx
import Timepicker from '@talkdesk/cobalt-marketplace-react-timepicker';

<Timepicker format24H daySpan={2} onChange={() => null} />
```

### Onchange

```tsx
import Timepicker from '@talkdesk/cobalt-marketplace-react-timepicker';

<Timepicker onChange={res => console.log(res)} />
```

### Popup

> **Doesn't compile:** the published types reject it: Module '"@talkdesk/cobalt-react-input-group"' has no exported member 'Item'.. Fix it before use.

```tsx
import React, { useState } from "react";
import Timepicker, {
  TimeType,
} from "@talkdesk/cobalt-marketplace-react-timepicker";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";
import Input from "@talkdesk/cobalt-react-input";
import Label from "@talkdesk/cobalt-react-label";
import InputGroup, { Item } from "@talkdesk/cobalt-react-input-group";
import { cssVar } from "@talkdesk/cobalt-react-theme-provider";

const [selectedTime, setSelectedTime] = useState<TimeType>({
  hours: 0,
  minutes: 0,
  meridian: "AM",
});

<StatefulPopup
  keepOpen
  fullWidthTarget
  direction="S"
  origin="SW"
  target={
    <>
      <Label htmlFor="input-group">Select time</Label>
      <InputGroup id="input-group">
        <Item noHover backgroundColor={cssVar(theme.backgroundColor, theme.basic200)} width="min">
          <Flex alignX="center" alignY="center" height="100%">
            <Icon name="time" size="tiny" />
          </Flex>
        </Item>
        <Item tabIndex={-1}>
          <Input
            placeholder="Time"
            value={selectedTime}
            variation="unstyled"
            onChange={() => null}
          />
        </Item>
      </InputGroup>
    </>
  }
>
  <Timepicker
    onChange={setSelectedTime}
    defaultHours={selectedTime.hours}
    defaultMinutes={selectedTime.minutes}
    defaultMeridian={selectedTime.meridian}
  />
</StatefulPopup>
```

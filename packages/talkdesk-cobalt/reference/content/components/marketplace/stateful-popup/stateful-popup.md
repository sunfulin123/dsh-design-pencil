# StatefulPopup

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-stateful-popup`
>
> Built on [Popup (Cobalt core)](../../../components/core/popup/popup.md), `@talkdesk/cobalt-react-popup`.

## Install (v3.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-stateful-popup
```

```tsx
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-statefulpopup-stories--default)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-popup`](../../../components/core/popup/popup.md), [`@talkdesk/cobalt-react-portal-provider`](../../../providers/core/portal-provider/portal-provider.md), [`@talkdesk/cobalt-react-position-hook`](../../../hooks/core/position-hook/position-hook.md).

## Guidance

StatefulPopup is a Cobalt Marketplace component built on the Cobalt core [Popup](/components/core/popup/) component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for StatefulPopup is on the Cobalt core [Popup](/components/core/popup/) page: StatefulPopup is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

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
| `direction` | enum | `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` | no | SE |  |
| `disabled` | boolean |  | no | false | You can use this prop to disable the toggle of the popup in specific cases |
| `fullWidthTarget` | boolean |  | no | false | Used to make the target element occupy all the width available |
| `keepOpen` | boolean |  | no | false | Allows to keep the popup open when the user clicks inside it |
| `origin` | enum | `N`, `NE`, `E`, `SE`, `S`, `SW`, `W`, `NW` | no | SW |  |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `target` | ReactNode \| (({ visible, setVisible, setClicked, targetRef, }: { visible: boolean; setVisible: Dispatch<SetStateAction<boolean>>; setClicked: Dispatch<SetStateAction<boolean>>; targetRef: RefObject<...>; }) => ReactNode) |  | yes |  |  |
| `targetProps` | DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement> |  | no |  | Additional props for the target element. It won't override the props needed to make the component properly work |
| `useOver` | boolean |  | no | false | Toggles the popup on the hover of the target. Maintains the click behavior as well |
| `width` | string \| number |  | no |  | If the `size` prop is not enough, you can specify a custom width for the popup |
| `withTargetWrapper` | boolean |  | no | true | Allows you to remove the wrapper around the target element for use cases where you don't want it. You must use the `target` prop as a function to receive and control the click on it |
| `children` | ReactNode \| ControlledChildren |  | yes |  |  |

## Examples

_10 of 11 compile against the published `@talkdesk/cobalt-marketplace-react-stateful-popup@3.2.0` (React 18, TypeScript strict)._

### Main

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  target={<Button size="small">Click to toggle</Button>}
>
  This is the popup content. If you click me the Popup closes automatically
</StatefulPopup>
```

### Position

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  direction="NE"
  origin="NW"
  target={<Button size="small">Click to toggle</Button>}
>
  Opens to top from the left
</StatefulPopup>
```

### Keep open

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  keepOpen
  target={<Button size="small">Click to toggle</Button>}
>
  Popup stays open when clicked. Click the toggle to close
</StatefulPopup>
```

### Use over

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  useOver
  target={<Button size="small">Click to toggle</Button>}
>
  Popup open if toggle is hovered. It stays open if you click the toggle
</StatefulPopup>
```

### Size

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  size="small"
  target={<Button size="small">Click to toggle small</Button>}
>
  Small popup
</StatefulPopup>
<StatefulPopup
  size="medium"
  target={<Button size="small">Click to toggle medium</Button>}
>
  Medium popup
</StatefulPopup>
<StatefulPopup
  size="large"
  target={<Button size="small">Click to toggle large</Button>}
>
  Large popup
</StatefulPopup>
```

### Width

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  target={<Button size="small">Click to toggle</Button>}
  width={100}
>
  Custom width popup
</StatefulPopup>
```

### Controlled close

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import { Text } from "@talkdesk/cobalt-react-typography";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  keepOpen
  target={<Button size="small">Click to toggle</Button>}
>
  {(closePopup) => (
    <>
      <Text>
        If you click this part the Popup won't close. If you click the
        button it closes
      </Text>
      <Button onClick={closePopup} size="small">
        Close
      </Button>
    </>
  )}
</StatefulPopup>
```

### Disabled

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  disabled
  target={<Button size="small">Click to toggle</Button>}
>
  This is the popup content. If you click me the Popup closes automatically
</StatefulPopup>
```

### Full width target

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

<StatefulPopup
  fullWidthTarget
  target={
    <Button shape="full-width" size="small">
      Click to toggle
    </Button>
  }
>
  This is the popup content. If you click me the Popup closes automatically
</StatefulPopup>
```

### Auto complete

> **Doesn't compile:** the published types reject it: Type '(visible: boolean, setVisible: React.Dispatch<React.SetStateAction<boolean>>) => JSX.Element' is not assignable to type 'ReactNode | (({ visible, setVisible, setClicked, targetRef }: { visible: . Fix it before use.

```tsx
import React from "react";
import Button from "@talkdesk/cobalt-react-button";
import Input from "@talkdesk/cobalt-react-input";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

const [text, setText] = useState("");

<StatefulPopup
  // In this case the target prop is a render function that accepts props and renders the target component.
  // This is useful to further customize when to show the popup when you can't hook it to the click event.
  target={(
    visible: boolean,
    setVisible: React.Dispatch<React.SetStateAction<boolean>>
  ) => (
    <Input
      type="text"
      value={text}
      onChange={(evt) => {
        setText(evt.target.value);
        setVisible(evt.target.value.length > 2);
      }}
      placeholder="Start typing for autocomplete"
      style={{ width: "300px" }}
      onFocus={(evt) => {
        setVisible(evt.target.value.length > 2);
      }}
    />
  )}
>
  <ul>
    <li>Auto Complete options</li>
    <li>Should use a list of ClickableItem</li>
  </ul>
</StatefulPopup>
);
```

### Without target wrapper

```tsx
import React from "react";
  import Button from "@talkdesk/cobalt-react-button";
  import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";

  <StatefulPopup
    target={({setVisible, setClicked, targetRef}) => (
      <Button
        forwardedRef={targetRef}
        onClick={() => {
          setVisible((prev) => !prev);
          setClicked((prev) => !prev);
        }}
        size="small"
      >
        Click to toggle
      </Button>
    )}
    withTargetWrapper={false}
  >
    This is the popup content.
  </StatefulPopup>
);
```

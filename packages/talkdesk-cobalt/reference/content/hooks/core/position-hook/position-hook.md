# usePosition

> **Cobalt core** hook · `@talkdesk/cobalt-react-position-hook`

## Install (v3.2.7)

```sh
npm install @talkdesk/cobalt-react-position-hook
```

```tsx
import usePosition, { Container } from "@talkdesk/cobalt-react-position-hook";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-hooks-useposition-docs--docs)

## Props

### Container

_Also accepts the standard `HTMLAttributes<ContainerType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_0 of 1 compile against the published `@talkdesk/cobalt-react-position-hook@3.2.7` (React 18, TypeScript strict)._

### Default

> **Doesn't compile:** uses `React`, `AnchorElement`, `PositionedElement` without importing or defining it. Fix it before use.

```tsx
import usePosition from "@talkdesk/cobalt-react-position-hook";

const Positioning = props => {

  // Node should be the node of the "anchor" element to be considered for positioning the other element
  // Origin and Direction must be one of: "N", "NE", "E", "SE", "S", "SW", "W", "NW"
  // autoGap/gapX/gapY is the margin (in px) between the "anchor" element and the positioned element.
  // The autoGap takes the origin and direction given and calculates where should the gap be applied
  // while gapX only sets it in the horizontal direction and gapY in the vertical direction.
  // The elementRef must be passed to the positioned element so that optimal positioning algorithm is applied

  const [node, setNode] = React.useState(null);
  const sourceRef = React.useCallback((n) => setNode(n), []);

  const { position, elementRef } = usePosition(node, {
    origin: "SE",
    direction: "E",
    autoGap: 0
  });

  return (
    <>
      <AnchorElement forwardedRef={sourceRef} />

      <PositionedElement forwardedRef={elementRef} style={{ ...position }}>
        ...
      </PositionedElement>
    </>
  );
};
```

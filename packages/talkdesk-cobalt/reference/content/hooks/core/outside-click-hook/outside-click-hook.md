# useOutsideClick

> **Cobalt core** hook · `@talkdesk/cobalt-react-outside-click-hook`

## Install (v3.2.5)

```sh
npm install @talkdesk/cobalt-react-outside-click-hook
```

```tsx
import useOutsideClick from "@talkdesk/cobalt-react-outside-click-hook";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-hooks-useoutsideclick-docs--docs)

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `handler` | () => void |  | yes |  |  |
| `refs` | HTMLElement[] |  | yes |  |  |
| `shouldExecute` | boolean |  | no | true |  |

## Examples

_0 of 1 compile against the published `@talkdesk/cobalt-react-outside-click-hook@3.2.5` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** the published types reject it: Property 'outsideClickHandler' is missing in type '{}' but required in type '{ outsideClickHandler: any; }'. (it also uses `React`, `InnerComponent` without importing it). Fix it before use.

```tsx
import useOutsideClick from "@talkdesk/cobalt-react-outside-click-hook";

const [node, setNode] = React.useState(null);
const sourceRef = useCallback((n) => setNode(n), []);

const Component = ({ outsideClickHandler: Function }) => {
  useOutsideClick({ handler: () => {}, refs: [node] });

  return <InnerComponent forwardedRef={sourceRef}  /> //replace with your component
}

<Component />
```

# ViewportProvider

> **Cobalt core** provider · `@talkdesk/cobalt-react-viewport-provider`

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-viewport-provider
```

```tsx
import ViewportProvider, { useViewport, BREAKPOINTS } from "@talkdesk/cobalt-react-viewport-provider";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-provider-components-viewportprovider-docs--docs)

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `target` | HTMLElement |  | no |  |  |

## Examples

_2 of 2 compile against the published `@talkdesk/cobalt-react-viewport-provider@2.2.5` (React 18, TypeScript strict)._

### Default

```tsx
import ViewportProvider, { useViewport } from "@talkdesk/cobalt-react-viewport-provider";

const Component = () => {
  const viewport = useViewport();

  return (
    <p>
      Current viewport size: {viewport}
    </p>
  );
};

// Wrap a component or the main app with the ViewportProvider component
<ViewportProvider>
  <Component />
</ViewportProvider>
```

### Custom element

```tsx
import ViewportProvider, { useViewport } from "@talkdesk/cobalt-react-viewport-provider";

const Component = () => {
  const viewport = useViewport();

  return (
    <p>
      Current viewport size: {viewport}
    </p>
  );
};

const RootComponent = () => {
  const [target, setTarget] = useState();
  const wrapper = useRef();

  useLayoutEffect(() => {
    if (wrapper.current !== null) setTarget(wrapper.current);
  }, []);

  return (
    <div ref={wrapper} style={{ border: "5px solid red" }}>
      {target && (
        <ViewportProvider target={target}>
          <Component />
        </ViewportProvider>
      )}
    </div>
  );
};
```

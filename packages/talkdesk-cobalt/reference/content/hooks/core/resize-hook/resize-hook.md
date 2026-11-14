# useResize

> **Cobalt core** hook · `@talkdesk/cobalt-react-resize-hook`

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-resize-hook
```

```tsx
import useResize from "@talkdesk/cobalt-react-resize-hook";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-hooks-useresize-docs--docs)

## Examples

_0 of 2 compile against the published `@talkdesk/cobalt-react-resize-hook@2.2.5` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import useResize from "@talkdesk/cobalt-react-resize-hook";

const Component = () => {

// To be able to resize ElementB based on ElementA dimensions, it is necessary
// to use useResize hook, passing the ElementA ref as argument.
// The hook returns an object with width and height properties, which can then be
// applied to ElementB styling, so it is resized based on ElementA width and height
// and reacts to ElementA dimensions being changed.

const [ref, setRef] = useState(null);

const fnRef = useCallback((el) => {
  setRef(el);
}, []);

const resizeStyle = useResize(ref);

return (
  <>
    <ElementA ref={fnRef}/>

    <ElementB style={{ width: 10, height: 20,...resizeStyle }} />
  </>
)
```

### Only width

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import useResize from "@talkdesk/cobalt-react-resize-hook";

const Component = () => {

// To be able to resize ElementB based on ElementA width, it is necessary
// to use useResize hook, passing the ElementA ref as argument.
// The hook returns an object with width and height properties, which can then be
// deestructured to use only width, to apply to ElementB styling, so it is resized
// based on ElementA width.
// The same applies if we want to resize ElementB height according to ElementA height.

const [ref, setRef] = useState(null);

const fnRef = useCallback((el) => {
  setRef(el);
}, []);

const { width } = useResize(ref);

return (
  <>
    <ElementA ref={fnRef}/>

    <ElementB style={{ width }} />
  </>
)
```

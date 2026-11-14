# useResponsiveValue

> **Cobalt core** hook · `@talkdesk/cobalt-react-responsive-value-hook`

## Install (v3.2.5)

```sh
npm install @talkdesk/cobalt-react-responsive-value-hook
```

```tsx
import useResponsiveValue from "@talkdesk/cobalt-react-responsive-value-hook";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-hooks-useresponsivevalue-docs--docs)

## Examples

_0 of 2 compile against the published `@talkdesk/cobalt-react-responsive-value-hook@3.2.5` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import useResponsiveValue from "@talkdesk/cobalt-react-responsive-value-hook";

const Component = ({ value }) => {
  const responsiveValue = useResponsiveValue(value);

  // Use the new responsive value as needed.
};

<Component value={[<small>, <medium>, <large>]}
```

### Fixed value

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import useResponsiveValue from "@talkdesk/cobalt-react-responsive-value-hook";

const Component = ({ value }) => {
  const responsiveValue = useResponsiveValue(value);

  // Use the new responsive value as needed.
};

<Component value={<all>}
```

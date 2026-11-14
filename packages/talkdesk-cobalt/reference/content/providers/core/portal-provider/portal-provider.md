# PortalProvider

> **Cobalt core** provider · `@talkdesk/cobalt-react-portal-provider`

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-portal-provider
```

```tsx
import PortalProvider, { usePortal, Portal } from "@talkdesk/cobalt-react-portal-provider";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-provider-components-portalprovider-docs--docs)

## Props

### PortalProvider

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `containerId` | string |  | no |  |  |
| `children` | ReactNode |  | no |  |  |

### Portal

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | no |  |  |
| `containerId` | string |  | no |  |  |

## Examples

_0 of 2 compile against the published `@talkdesk/cobalt-react-portal-provider@2.2.5` (React 18, TypeScript strict)._

### Context

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import PortalProvider, { usePortal } from "@talkdesk/cobalt-react-portal-provider";

const CustomPortalComponent = () => {
  const container = usePortal();

  return <SomeComponent node={container}>;
};

<PortalProvider>
  <CustomPortalComponent />
</PortalProvider>
```

### Container

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import PortalProvider, { usePortal } from "@talkdesk/cobalt-react-portal-provider";

// Assuming there's already an element with the specified id:
// <div id="custom-container"></div>

<PortalProvider containerId="custom-container">
  {/* children */}
<PortalProvider>
```

# ThemeProvider

> **Cobalt core** provider · `@talkdesk/cobalt-react-theme-provider`

## Install (v4.6.3)

```sh
npm install @talkdesk/cobalt-react-theme-provider
```

```tsx
import ThemeProvider, { useTheme, cssVar } from "@talkdesk/cobalt-react-theme-provider";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-provider-components-themeprovider-docs--docs)

## Props

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `placeholder` | ReactNode |  | no |  | Rendered while a theme is not loaded. |
| `loader` | () => Promise<Partial<ThemeObject>> |  | no |  | Returns a promise with the loaded theme. |
| `onLoad` | () => void |  | no |  | Callback that is called when a theme is loaded. |
| `onError` | () => void |  | no |  | Callback that is called when a theme is not loaded. |
| `useFallback` | boolean |  | no | true | Load fallback theme when theme cannot be loaded. |
| `className` | string |  | no |  | The className to be added to the div element that injects the styles |
| `style` | CSSProperties |  | no | {} | Allow the div to receive style properties to be added to the theme styles |
| `children` | ReactNode |  | yes |  |  |

## Examples

_3 of 3 compile against the published `@talkdesk/cobalt-react-theme-provider@4.6.3` (React 18, TypeScript strict)._

### Default

```tsx
import ThemeProvider from "@talkdesk/cobalt-react-theme-provider";

  <ThemeProvider placeholder={...} loader={...}>
    ...
  </ThemeProvider>
```

### Context

```tsx
import ThemeProvider, { useTheme } from "@talkdesk/cobalt-react-theme-provider";

  const Component = () => {
    const theme = useTheme()

    return (
      <p style={{ color: theme.orange600 }}>
        This text receives a color using the ThemeContext.
      </p>
    );
  };
```

### Extended theme

```tsx
import { useTheme, Theme } from "@talkdesk/cobalt-react-theme-provider";

  interface CustomTheme extends Theme {
    readonly theme600: string;
  }

  const CustomComponent = () => {
    const theme = useTheme<CustomTheme>();

    return <p style={{ color: theme.theme600 }}>Hello world</p>
  }
```

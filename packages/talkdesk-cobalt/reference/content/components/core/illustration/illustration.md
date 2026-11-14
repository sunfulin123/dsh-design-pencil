# Illustration

> **Cobalt core** component · `@talkdesk/cobalt-react-illustration`
>
> Related (Illustrations): [Illustrations](../../../foundations/tokens/illustrations/illustrations.md).

## Install (v1.0.4)

```sh
npm install @talkdesk/cobalt-react-illustration
```

```tsx
import Illustration from "@talkdesk/cobalt-react-illustration";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-illustration-docs--docs)

## Guidance

Illustration is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The illustration set and when to use it are in [Foundations › Illustrations](/foundations/tokens/illustrations/). Illustration's own props and examples are in the Code tab.

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `src` | string |  | yes |  |  |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-react-illustration@1.0.4` (React 18, TypeScript strict)._

### Basic

```tsx
import Illustration from "@talkdesk/cobalt-react-illustration";

<Illustration src={...} />;
```

### Sized

```tsx
import Illustration from "@talkdesk/cobalt-react-illustration";

<Illustration src={...} width={240} height={160} />;
```

### Labelled

```tsx
import Illustration from "@talkdesk/cobalt-react-illustration";

<Illustration
  src={...}
  role="img"
  aria-label="Agent to agent call dialing illustration"
/>;
```

### Fallback

```tsx
import Illustration from "@talkdesk/cobalt-react-illustration";

// When the URL cannot be loaded, an empty <svg> of the requested
// width/height is rendered in its place to avoid layout shifts.
<Illustration src="/does-not-exist.svg" width={128} height={128} />;
```

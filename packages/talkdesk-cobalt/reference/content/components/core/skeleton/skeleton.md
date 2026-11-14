# Skeleton

> **Cobalt core** component · `@talkdesk/cobalt-react-skeleton`

## Install (v1.0.1)

```sh
npm install @talkdesk/cobalt-react-skeleton
```

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-skeleton-docs--docs)

## Guidance

A non-interactive preview of the UI structure which visually communicates that content is in the process of loading.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

A **Skeleton** loading provides a low-fidelity representation of the user interface (UI) before content appears on the page improving the load time perceived by users.

Give people an idea of what’s about to come and that the content is currently loading when a page full of content/data takes more than 300ms to load.

### Anatomy

![Skeleton example — Anatomy](/assets/skeleton/anatomy.png)

1. **Skeleton**: The visual representation of the page structure is loading.

### Variants

#### Sizes

Note: The size specified is only for design prototyping reference in Figma. The expected behavior for the implementation is that the Skeleton is made to be responsive depending on the size of the content.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Types

Could have different shapes accordingly to the content. For example, *Circular*, *Rectangular*, etc.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Theming

The Skeleton loading always follows the shape and form of what will be loaded – the width, height, colors, and text line heights aligned with the built components. This behavior should be applied regardless of the theme.

### Guidelines

Use a skeleton to compose a loading structure of a page where the page content is dynamic.

![Skeleton example — Guidelines](/assets/skeleton/guidelines.gif)

Example of a skeleton loading content in a page.

#### When to use

* Used to represent blocks of different contents being loaded.
* Used to load a specific part of a page (eg. a page composed of a card with lists and tables).
* Be used for pages where all content loads at the same time.
* Give users an indication of what the page layout structure will be once loaded. This means that the layout will be similar to the state that will be loaded and filled with the skeleton appearance.
* Show the minimum number of items as a skeleton before loading however many content items in a list, for example.
* Use when data takes more than 300ms to load on an average connection.

![Skeleton example — Guidelines When to use](/assets/skeleton/guidelines-when-to-use.gif)

Loading a specific part of a page.

#### When not to use

* Don't use it for loading small components.
* Don't use it for loading multiple components.
* Don't use it for a long-running loading process.

#### Group

The Skeleton is expected to be used in a group. This means that you should use it when there’s more than 1 element loading at the same time that requires an indicator.

![Skeleton example — Guidelines Group](/assets/skeleton/guidelines-group.gif)

Loading lots of elements at once inside a page structure.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Placement

They need to be placed in the same position on the screen as the live elements following the expected UI structure, to avoid the feeling of things jumping around on the page.

#### Comparison between components

##### Skeleton vs ProgressBar

For a long-running process or background process, e.g. importing data or exporting reports, use a [ProgressBar](/components/core/progress-bar/) instead.

##### Skeleton vs 3Dots

3Dots is the loader Workspace shows while a whole app loads; apps can't use it (see
[App loading](/workspace/app-loading/)). For fast processes that take less than 300ms, consider no loading
state at all.

##### Skeleton vs spinner

For a tiny, inline action or feedback, e.g. clicking a button and the action will take time, consider using a [Spinner](/components/core/spinner/) instead.

##### Skeleton vs EmptyState

If a page refresh is required, use an [EmptyState](/patterns/empty-states-and-loading/) with a CTA to refresh.

### Behavior

### Resources

Find this component under: `Cobalt Design System > Core Components > Skeleton`

* [Skeleton component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=1047%3A150814) — Core Component library

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

#### Development

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `variant` | enum | `text`, `rectangular`, `circular` | no | text |  |
| `width` | Dimension |  | no |  |  |
| `height` | Dimension |  | no |  |  |
| `animation` | enum | `pulse`, `none` | no | pulse |  |

## Examples

_6 of 6 compile against the published `@talkdesk/cobalt-react-skeleton@1.0.1` (React 18, TypeScript strict)._

### Basic

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton"

<Skeleton />;
```

### Variants

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton"

<Skeleton variant="text" />;
<Skeleton variant="rectangular" height={80} />;
<Skeleton variant="circular" width={48} />;
```

### Dimensions

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton"

// Numbers are pixels, strings are any CSS length.
<Skeleton width={200} />;
<Skeleton width="50%" height={16} />;
<Skeleton variant="rectangular" width="100%" height="4rem" />;

// A circle only needs one dimension, it is used for both.
<Skeleton variant="circular" height={32} />;
```

### Animations

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton"

<Skeleton animation="pulse" />;
<Skeleton animation="none" />;
```

### Composition

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton"
import Flex from "@talkdesk/cobalt-react-flex";

<Flex gap={4}>
  <Skeleton variant="circular" width={48} />
  <Flex direction="column" gap={2} grow>
    <Skeleton width="40%" />
    <Skeleton />
    <Skeleton />
    <Skeleton width="70%" />
  </Flex>
</Flex>;
```

### RTL

```tsx
import { Skeleton } from "@talkdesk/cobalt-react-skeleton"
import Flex from "@talkdesk/cobalt-react-flex";

// Skeleton has no physical left/right styles, so it follows the layout
// direction: the circle sits at the start (right) and the lines start from it.
<Flex gap={4} dir="rtl">
  <Skeleton variant="circular" width={48} />
  <Flex direction="column" gap={2} grow>
    <Skeleton width="40%" />
    <Skeleton />
    <Skeleton />
    <Skeleton width="70%" />
  </Flex>
</Flex>;
```

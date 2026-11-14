# Pagination

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-pagination`
>
> Not the same as [Pagination (Cobalt core)](../../../components/core/pagination/pagination.md), `@talkdesk/cobalt-react-pagination`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.2.3)

```sh
npm install @talkdesk/cobalt-marketplace-react-pagination
```

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-pagination-stories--small-number)

## Known gaps

Read before using it:

* The current page is marked aria-current="true"; for pagination the value should be "page".
* No "Jump to" action and no size options, both described in the Pagination guidance (anatomy item 6, the "Without jump" modifier, and Large/Medium/Small sizes). The core Pagination has the jump action.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md), [`@talkdesk/cobalt-react-viewport-provider`](../../../providers/core/viewport-provider/viewport-provider.md).

## Guidance

Pagination is the Cobalt Marketplace pagination. Cobalt core has its own [Pagination](/components/core/pagination/): a separate package with a different API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for pagination is on the Cobalt core [Pagination](/components/core/pagination/) page. Its own props and examples are in the Code tab.

#### Against the guidance

Checked against the package source:

* **Matches:** previous and next buttons, page buttons, a non-interactive "…" for truncated pages, labels
  only on medium and large viewports (`variation="labels"`), 4px between actions, and "Previous" / "Next"
  labels you can override.
* **Not available:** the "Jump to" action in the anatomy, and the three sizes: buttons are always small,
  and the viewport only decides whether labels show.
* **Not enforced:** the fixed 48px height (the component is as tall as its 32px buttons) and the 2, 4 or
  6 page buttons (`maxPagesCount` takes any number).

The core Pagination has the "Jump to" action ("Go to") and a page-size selector.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component follows the core page's content guidelines. For copy rules that apply everywhere, see
[Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

The accessibility guidance is on the core [Pagination](/components/core/pagination/) page. Checked against
this package's source:

* It renders a `<nav>`; give it an `aria-label` when a page has more than one.
* The current page is marked `aria-current="true"` rather than `"page"` (a known gap, in the Code tab).
* Page buttons are named by their number only, and nothing announces the new position when the page
  changes. The core Pagination does both.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `currentPage` | number |  | yes |  |  |
| `totalPages` | number |  | yes |  |  |
| `maxPagesCount` | number |  | yes |  |  |
| `previousLabel` | string |  | no | Previous |  |
| `nextLabel` | string |  | no | Next |  |
| `onPageClick` | (page: number) => void |  | yes |  |  |
| `onNextClick` | () => void |  | no |  |  |
| `onPreviousClick` | () => void |  | no |  |  |
| `variation` | enum | `labels`, `pages`, `collapsed` | no | labels |  |
| `arrowsDirection` | enum | `horizontal`, `vertical` | no | horizontal |  |
| `color` | enum | `white`, `black` | no |  |  |

## Examples

_10 of 11 compile against the published `@talkdesk/cobalt-marketplace-react-pagination@2.2.3` (React 18, TypeScript strict)._

### Small number

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination
  currentPage={1}
  totalPages={2}
  maxPagesCount={5}
  previousLabel="Previous"
  nextLabel="Next"
  onPageClick={() => {}}
/>
```

### First half

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination
  currentPage={4}
  totalPages={50}
  maxPagesCount={5}
  previousLabel="Previous"
  nextLabel="Next"
  onPageClick={() => {}}
/>
```

### Middle

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination
  currentPage={25}
  totalPages={50}
  maxPagesCount={5}
  previousLabel="Previous"
  nextLabel="Next"
  onPageClick={() => {}}
/>
```

### Last half

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination
  currentPage={46}
  totalPages={50}
  maxPagesCount={5}
  previousLabel="Previous"
  nextLabel="Next"
  onPageClick={() => {}}
/>
```

### Last page

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination
  currentPage={50}
  totalPages={50}
  maxPagesCount={5}
  previousLabel="Previous"
  nextLabel="Next"
  onPageClick={() => {}}
/>
```

### Labels

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination ... variation="labels" />
```

### Pages

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination ... variation="pages" />
```

### Arrowsdirection

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

// horizontal
<Pagination ... variation="pages" arrowsDirection="horizontal" />

// vertical
<Pagination ... variation="pages" arrowsDirection="vertical" />
```

### Color

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

// White
<Pagination ... variation="pages" color="white" />

// Black
<Pagination ... variation="pages" color="black" />
```

### Collapsed

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

<Pagination ... variation="collapsed" />
```

### Custom actions

> **Doesn't compile:** uses `React` without importing or defining it. Fix it before use.

```tsx
import Pagination from "@talkdesk/cobalt-marketplace-react-pagination";

const [currentPage, setCurrentPage] = React.useState(50);

<Pagination
  ...
  onPreviousClick={() => setCurrentPage(currentPage - 5)}
  onNextClick={() => setCurrentPage(currentPage + 5)}
/>
```

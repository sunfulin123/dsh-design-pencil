# Pagination

> **Cobalt core** component · `@talkdesk/cobalt-react-pagination`
>
> Not the same as [Pagination (Cobalt Marketplace)](../../../components/marketplace/pagination/pagination.md), `@talkdesk/cobalt-marketplace-react-pagination`: a separate package with its own API. Check which one the code imports before using either.

## Install (v1.0.3)

```sh
npm install @talkdesk/cobalt-react-pagination
```

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-pagination-docs--docs)

## Known gaps

Read before using it:

* Pagination is one row that never wraps or shrinks. The demos on this page are 340px and 412px wide without the page jumper, so in a narrow app, such as the desktop app's 356px, it runs past the edge. On small viewports, leave out withPageJumper and pageSizeOptions, and lower pageRange.

## Guidance

Usually used associated to tables but also in other use cases when a several amount of content needs to be split into different pages, the pagination enable the user to jump for a different page.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Usually used associated with tables but also in other use cases when several amounts of content need to be split into different pages, the pagination enables the user to jump to a different page.

### Anatomy

![Pagination example — Anatomy](/assets/pagination/anatomy.png)

1. **Previous page action button.** By interacting with this button the user will navigate to the previous page.
2. **Page action button.** By interacting with this button the user will navigate to a specific page.
3. **Truncated action button.** When the number of pages is higher than the number of interactive options a truncated action button is used. This button is always disabled and it is not interactive.
4. **Active page.** This button shows the active page.
5. **Next page action button.** By interacting with this button the user will navigate to the next page.
6. **Jump to.** By interacting with this dropdown button the user could choose to which specific page will navigate.

### Variants

#### Sizes

There are three sizes available (Large, Medium, and Small), each to be applied to the respective viewport.

![Pagination example — Variants Sizes: Large](/assets/pagination/sizes-large.png)
*Large*

![Pagination example — Variants Sizes: Medium](/assets/pagination/sizes-medium.png)
*Medium*

![Pagination example — Variants Sizes: Small](/assets/pagination/sizes-small.png)
*Small*

#### Modifiers

##### With label

Only available for large and medium viewports.

![Pagination example — Modifiers With label: Large](/assets/pagination/sizes-large.png)
*Large*

![Pagination example — Modifiers With label: Medium](/assets/pagination/sizes-medium.png)
*Medium*

##### Without label

![Pagination example — Modifiers Without label: Large](/assets/pagination/label-large.png)
*Large*

![Pagination example — Modifiers Without label: Medium](/assets/pagination/label-medium.png)
*Medium*

![Pagination example — Modifiers Without label: Small](/assets/pagination/sizes-small.png)
*Small*

##### Without page numbers

![Pagination example — Modifiers Without page numbers: Large](/assets/pagination/numbers-large.png)
*Large*

![Pagination example — Modifiers Without page numbers: Medium](/assets/pagination/numbers-medium.png)
*Medium*

![Pagination example — Modifiers Without page numbers: Small](/assets/pagination/numbers-small.png)
*Small*

##### Without jump

![Pagination example — Modifiers Without jump: Large](/assets/pagination/jump-large.png)
*Large*

![Pagination example — Modifiers Without jump: Medium](/assets/pagination/jump-medium.png)
*Medium*

![Pagination example — Modifiers Without jump: Small](/assets/pagination/jump-small.png)
*Small*

##### Without background

![Pagination example — Modifiers Without background: Large](/assets/pagination/background-large.png)
*Large*

![Pagination example — Modifiers Without background: Medium](/assets/pagination/background-medium.png)
*Medium*

![Pagination example — Modifiers Without background: Small](/assets/pagination/background-small.png)
*Small*

#### Quantity

When using pagination with labels it can have 2, 4, or 6-page action buttons.

Only available for large and medium viewports.

##### 2 options

![Pagination example — Quantity 2 options: Large](/assets/pagination/options-large.png)
*Large*

![Pagination example — Quantity 2 options: Medium](/assets/pagination/options-medium.png)
*Medium*

##### 4 options

![Pagination example — Quantity 4 options: Large](/assets/pagination/sizes-large.png)
*Large*

![Pagination example — Quantity 4 options: Medium](/assets/pagination/sizes-medium.png)
*Medium*

##### 6 options

![Pagination example — Quantity 6 options: Large](/assets/pagination/options-large-2.png)
*Large*

![Pagination example — Quantity 6 options: Medium](/assets/pagination/options-medium-2.png)
*Medium*

### Guidelines

#### Placement

Pagination should not be fixed positioned. Should only be visible after scrolling, sticked below the content to be paginated. This behavior must also happen when the pagination component is placed inside a panel.

![Pagination example — Guidelines Placement: Placement - Table](/assets/pagination/placement-placement-table.png)
*Placement - Table*

  ![Pagination example — Guidelines Placement: Placement - Panel](/assets/pagination/placement-placement-panel.png)
*Placement - Panel*

### Behavior

#### Responsiveness

Pagination left and right paddings follow the general rules for each viewport, **L:24px / M:16px / S:12px**

For small viewports, it is not available the variant with a label.

![Pagination example — Behavior Responsiveness: Responsiveness - Small](/assets/pagination/responsiveness-responsiveness-small.png)
*Responsiveness - Small*

![Pagination example — Behavior Responsiveness: Responsiveness - Medium](/assets/pagination/responsiveness-responsiveness-medium.png)
*Responsiveness - Medium*

  ![Pagination example — Behavior Responsiveness: Responsiveness - Large](/assets/pagination/responsiveness-responsiveness-large.png)
*Responsiveness - Large*

#### Spacing

Pagination actions positioned on the left follow the spacing used for small buttons which is usually **4px** between them.

![Pagination example — Variants Spacings](/assets/pagination/variants-spacings.png)

#### Dimensions

For all viewports, the pagination has always a fixed height of 48px.

![Pagination example — Variants Dimensions](/assets/pagination/variants-dimensions.png)

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Pagination`

* [Pagination component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=608%3A29229) — Core component library
* [Pagination handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=408%3A211798) — Handoff guidelines

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

Pagination renders a `<nav>` landmark, marks the current page with `aria-current="page"`, and announces
the position ("Page 2 of 10") in a live region when the page changes.

* Its labels default to English ("Previous", "Next", "Go to", "Items per page", "Page 2 of 10"). Pass
  translated strings through `accessibilityLabels` in other languages.
* When a page has more than one Pagination, give each an `aria-label` so the landmarks can be told apart.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `currentPage` | number |  | no |  | Current page for controlled usage; pair with `onChange`. |
| `defaultPage` | number |  | no |  | Initial page for uncontrolled usage (state is managed internally). |
| `totalPages` | number |  | yes |  | Total number of pages. Often derived, e.g. `Math.ceil(totalItems / pageSize)`; a fraction is rounded up. |
| `onChange` | (page: number) => void |  | no |  |  |
| `pageRange` | number |  | no | 1 | Pages shown on each side of the current page in the `numbered` variation. |
| `variation` | enum | `numbered`, `compact`, `minimal` | no | numbered |  |
| `isDisabled` | boolean |  | no | false |  |
| `size` | enum | `small`, `medium` | no | small |  |
| `withPageJumper` | boolean |  | no | false | Shows a "Go to" input to jump straight to a page. In the `compact` variation the input replaces the current-page display. |
| `pageSize` | number |  | no |  | Items shown per page, for controlled usage; pair with `onPageSizeChange`. |
| `defaultPageSize` | number |  | no |  | Initial items per page for uncontrolled usage (defaults to the first option). |
| `pageSizeOptions` | number[] |  | no |  | The items-per-page choices. Providing at least one shows the selector; the consumer owns `totalPages` and must recompute it when the size changes. |
| `onPageSizeChange` | (pageSize: number) => void |  | no |  | Called with the newly selected size. The current page is left as is, so reset or clamp it here if the new size makes it out of range. |
| `accessibilityLabels` | AccessibilityLabels |  | no |  | Localizable accessible names for the arrows and page controls. |

## Examples

_15 of 17 compile against the published `@talkdesk/cobalt-react-pagination@1.0.3` (React 18, TypeScript strict)._

### Basic

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={1} totalPages={5} />
```

### Many pages

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={6} totalPages={50} pageRange={1} />
```

### Compact

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={2} totalPages={10} variation="compact" />
```

### Minimal

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={2} totalPages={10} variation="minimal" />
```

### Disabled

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={2} totalPages={5} isDisabled />
```

### Custom labels

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination
  defaultPage={2}
  totalPages={5}
  accessibilityLabels={{ previous: "Back", next: "Forward" }}
/>
```

### RTL

> **Doesn't compile:** imports `@talkdesk/cobalt-react-i18n-provider`, which isn't a published package. Fix it before use.

```tsx
import { I18nProvider } from "@talkdesk/cobalt-react-i18n-provider";
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<I18nProvider locale="ar-AE">
  <Pagination defaultPage={6} totalPages={50} pageRange={1} />
</I18nProvider>
```

### Controlled

> **Doesn't compile:** uses `React` without importing or defining it. Fix it before use.

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

const [page, setPage] = React.useState(1);

<Pagination currentPage={page} totalPages={5} onChange={setPage} />
```

### Go to

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={6} totalPages={50} withPageJumper />
```

### Go to compact

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={6} totalPages={50} variation="compact" withPageJumper />
```

### Medium

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={6} totalPages={50} size="medium" withPageJumper />
```

### Wide range

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={10} totalPages={50} pageRange={2} />
```

### Large page count

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination defaultPage={1234} totalPages={12345} withPageJumper />
```

### Custom aria label

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination
  defaultPage={2}
  totalPages={5}
  aria-label="Search results pagination"
/>
```

### Custom item labels

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination
  defaultPage={2}
  totalPages={50}
  variation="compact"
  withPageJumper
  aria-label="Calls navigation"
  accessibilityLabels={{
    previous: "Previous call",
    next: "Next call",
    goTo: "Go to call",
    announcement: (page, total) =>
      `Call ${page.formatted} of ${total.formatted}`,
  }}
/>
```

### Default page size

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination
  defaultPage={1}
  totalPages={8}
  pageSizeOptions={[10, 25, 50]}
  defaultPageSize={25}
/>
```

### All labels

```tsx
import { Pagination } from "@talkdesk/cobalt-react-pagination"

<Pagination
  defaultPage={1}
  totalPages={8}
  pageSizeOptions={[10, 25, 50]}
  defaultPageSize={25}
  withPageJumper
  accessibilityLabels={{
    previous: "Previous page",
    next: "Next page",
    page: ({ formatted }) => `Go to page ${formatted}`,
    announcement: (page, total) =>
      `Page ${page.formatted} of ${total.formatted}`,
    goTo: "Go to page",
    pageSizeSelector: "Results per page",
    pageSizeSuffix: "per page",
  }}
/>
```

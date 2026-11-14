# Nav

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-nav`
>
> Built on [Tab (Cobalt core)](../../../components/core/tab/tab.md), `@talkdesk/cobalt-react-tab`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-nav
```

```tsx
import Nav, { NavTab } from "@talkdesk/cobalt-marketplace-react-nav";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-nav-stories--main)

## Known gaps

Read before using it:

* The overflow navigation buttons have no accessible name. They come from @talkdesk/cobalt-marketplace-react-overflow-scroll, which renders icon-only Buttons (chevron_left / chevron_right) with no aria-label, and Nav exposes no prop to set one. Needs a fix in cobalt-marketplace (e.g. default labels "Scroll left" / "Scroll right", overridable).

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-tab`](../../../components/core/tab/tab.md).

## Guidance

Nav is a Cobalt Marketplace component built on the Cobalt core [Tab](/components/core/tab/) component: the row that holds a set of tabs.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for Nav is on the Cobalt core [Tab](/components/core/tab/) page: Nav is built on it and follows the same guidelines. Its own props and examples are in the Code tab.

Nav adds three things to a row of core `Tab`s:

* **Overflow.** When the tabs are wider than their container, the row scrolls horizontally and shows navigation buttons on the right (`scrollSnap` sets the scroll step).
* **Divider.** An optional divider under the row (`divided`).
* **One size for every tab.** `size` is set once on `Nav` and applied to each `NavTab`.

### Code

### Props

### Examples

### Content

### Writing guidelines

Tab labels follow the [Tab](/components/core/tab/) content guidelines. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

Each `NavTab` is a core `Tab`, so the [Tab](/components/core/tab/) accessibility guidance applies: wrap
the `Nav` in a `<nav>` landmark and mark the selected tab with `aria-current="page"`. `Nav` does not do
either for you.

The navigation buttons shown on overflow are icon-only and have no accessible name, so a screen reader
announces them only as "button". There is no prop to label them yet; see the known gap in the Code tab.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Nav

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `divided` | boolean |  | no | false |  |
| `scrollSnap` | number |  | no |  |  |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `children` | ReactNode |  | yes |  |  |

### NavTab

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `children` | ReactNode |  | yes |  |  |
| `active` | boolean |  | no |  |  |
| `disabled` | boolean |  | no |  |  |
| `size` | Size | `small`, `medium`, `large` | no |  |  |
| `forwardedRef` | Ref<HTMLAnchorElement> |  | no |  |  |

## Examples

_3 of 3 compile against the published `@talkdesk/cobalt-marketplace-react-nav@2.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import Nav, { NavTab } from "@talkdesk/cobalt-marketplace-react-nav";

<Nav>
  <NavTab>...</NavTab>
  <NavTab>...</NavTab>
  ...
</Nav>;
```

### Divided

```tsx
import Nav, { NavTab } from "@talkdesk/cobalt-marketplace-react-nav";

<Nav divided>
  <NavTab>...</NavTab>
  <NavTab>...</NavTab>
  ...
</Nav>;
```

### Sizes

```tsx
import Nav, { NavTab } from "@talkdesk/cobalt-marketplace-react-nav";

<Nav size="small">
  <NavTab>...</NavTab>
  <NavTab>...</NavTab>
  ...
</Nav>;

<Nav size="medium">
  <NavTab>...</NavTab>
  <NavTab>...</NavTab>
  ...
</Nav>;
```

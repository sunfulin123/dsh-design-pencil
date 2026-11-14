# SearchInput

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-search-input`
>
> Not the same as [SearchInput (Cobalt core)](../../../components/core/search-input/search-input.md), `@talkdesk/cobalt-react-search-input`: a separate package with its own API. Check which one the code imports before using either.
>
> Built on [Input (Cobalt core)](../../../components/core/input/input.md), `@talkdesk/cobalt-react-input`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-search-input
```

```tsx
import SearchInput, { UnstyledSearch } from "@talkdesk/cobalt-marketplace-react-search-input";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-searchinput-stories--main)

## Known gaps

Read before using it:

* The field's accessible name is the typed value: UnstyledSearch passes aria-label={searchValue} after {...props}, so a consumer's aria-label is overwritten and an empty field has no accessible name. Needs a fix in cobalt-marketplace (spread props last, or default the label to the placeholder).
* The clear control (dismissable) is an Icon with onClick, not a button: it is not keyboard-focusable and has no accessible name. Needs a fix in cobalt-marketplace (render a Button with an aria-label such as "Clear search").
* value only sets the starting text (it seeds internal state once), and passing onChange replaces the internal handler, so the box stops showing what's typed and onSearch never fires. Don't control it: read the text through onSearch.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-fake-input`](../../../components/core/fake-input/fake-input.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-input`](../../../components/core/input/input.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

SearchInput is the Cobalt Marketplace search field, built on the Cobalt core [Input](/components/core/input/) component. Cobalt core has its own [SearchInput](/components/core/search-input/): a separate package with a different API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for search fields is on the Cobalt core [SearchInput](/components/core/search-input/) page, and this package follows it. Its own props and examples are in the Code tab.

What this package adds to a core `Input`:

* A search icon at the start and, with `dismissable`, a clear icon at the end once there is text.
* `onSearch`, called with the current value after the user stops typing for `triggerDelay` milliseconds (300 by default), and with an empty string when the field is cleared.
* `UnstyledSearch`, the same field without the input frame, for placing inside another component.

### Code

### Props

### Examples

### Content

### Writing guidelines

Placeholder and label copy follow the [Input](/components/core/input/) content guidelines (Search fields). For copy rules
that apply everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

The core [SearchInput](/components/core/search-input/) accessibility guidance applies. Two things in this
package need care until they are fixed (both listed as known gaps in the Code tab); the core SearchInput
has neither problem:

* **The field's accessible name.** SearchInput sets `aria-label` to the text typed so far, after your
  own props, so an `aria-label` you pass is replaced and an empty field has no name. Name it with a
  visible `<label>` linked by `id`, or with `aria-labelledby`.
* **The clear icon is not a button.** It responds to a mouse click only: keyboard users cannot reach
  it, and it has no accessible name. Keyboard users can still clear the field by deleting the text.

The field already uses `type="search"`.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### SearchInput

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `dismissable` | boolean |  | no |  |  |
| `onChange` | ((event: ChangeEvent<HTMLInputElement>) => void) & ChangeEventHandler<HTMLInputElement> |  | no |  |  |
| `onSearch` | (value: string) => void |  | no | () => {} |  |
| `placeholder` | string |  | no |  |  |
| `readOnly` | boolean |  | no |  |  |
| `triggerDelay` | number |  | no | 300 |  |
| `value` | string \| (string & readonly string[]) |  | no |  |  |

### UnstyledSearch

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `dismissable` | boolean |  | no |  |  |
| `onChange` | ((event: ChangeEvent<HTMLInputElement>) => void) & ChangeEventHandler<HTMLInputElement> |  | no |  |  |
| `onSearch` | (value: string) => void |  | no | () => {} |  |
| `placeholder` | string |  | no |  |  |
| `readOnly` | boolean |  | no |  |  |
| `triggerDelay` | number |  | no | 300 |  |
| `value` | string \| (string & readonly string[]) |  | no |  |  |
| `noArrows` | boolean |  | no |  |  |
| `size` | Size | `small`, `medium` | no |  |  |
| `textAlign` | TextAlign | `left`, `center`, `right` | no |  |  |
| `type` | Type | `number`, `color`, `text`, `search`, `email`, `password`, `tel`, `url`, `checkbox`, `radio` | no |  |  |
| `variation` | Variation | `error`, `warning`, `unstyled` | no |  |  |
| `forwardedRef` | Ref<HTMLInputElement> |  | no |  |  |

## Examples

_5 of 5 compile against the published `@talkdesk/cobalt-marketplace-react-search-input@2.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import SearchInput from "@talkdesk/cobalt-marketplace-react-search-input";

<SearchInput onSearch={(value: string) => console.log(value)} />;
```

### Readonly

```tsx
import SearchInput from "@talkdesk/cobalt-marketplace-react-search-input";

<SearchInput readOnly />;
```

### Sizes

```tsx
import SearchInput from "@talkdesk/cobalt-marketplace-react-search-input";

<SearchInput size="small" onSearch={(value: string) => console.log(value)} />

<SearchInput size="medium" onSearch={(value: string) => console.log(value)} />
```

### Dismissable

```tsx
import SearchInput from "@talkdesk/cobalt-marketplace-react-search-input";

<SearchInput dismissable />
```

### Unstyled

```tsx
import { UnstyledSearch } from "@talkdesk/cobalt-marketplace-react-search-input";

<UnstyledSearch onSearch={(value: string) => console.log(value)} />
```

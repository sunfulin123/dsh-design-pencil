# Overflow

> **Cobalt core** component · `@talkdesk/cobalt-react-overflow`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-overflow
```

```tsx
import Overflow, { useOverflow } from "@talkdesk/cobalt-react-overflow";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-overflow-docs--docs)

## Guidance

Overflow is a Cobalt core component.

### Design

### Overview

No design guidance has been written for Overflow yet. It is used inside these Cobalt core components: [Dropdown](/components/core/dropdown/). Its props and examples are in the Code tab, and its Storybook is linked above.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `items` | TItem[] |  | yes |  |  |
| `direction` | enum | `row`, `column` | no | row |  |
| `size` | number |  | yes |  | The width or height of the container, depending on the direction. |
| `threshold` | number |  | no | 0 | Amount of pixels to tweak the available space |
| `children` | (props: { containerRef: RefObject<any>; hiddenElementRef: RefObject<any>; items: TItem[]; hiddenItems: TItem[]; }) => ReactElement<any, string \| JSXElementConstructor<any>> |  | yes |  |  |

## Examples

_0 of 2 compile against the published `@talkdesk/cobalt-react-overflow@2.2.5` (React 18, TypeScript strict)._

### Horizontal

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Overflow from "@talkdesk/cobalt-react-overflow";

// We can use an hard-coded value for `size` or use a library such as
// `react-use-measure` or `react-virtualized-auto-sizer` to get
// the value from a different container

<Overflow
  items={["One", "Two"]}
  size={300}
>
  {({containerRef, hiddenElementRef, items, hiddenItems }) => (
    <div>
      <div ref={containerRef}>
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
      <div ref={hiddenElementRef}>
        {hiddenItems.length} more
      </div>
    </div>
  )}
</Overflow>

// or we can use the hook instead

import { useOverflow } from "@talkdesk/cobalt-react-overflow";

const {
    containerRef,
    hiddenElementRef,
    items,
    hiddenItems
} = useOverflow({
    items: ["One", "Two"],
    size: 300
})

<div>
  <div ref={containerRef}>
    {items.map((item) => (
      <div key={item}>{item}</div>
    ))}
  </div>
  <div ref={hiddenElementRef}>
    {hiddenItems.length} more
  </div>
</div>
```

### Vertical

> **Doesn't compile:** isn't valid TSX as written (cut short, or several snippets in one). Fix it before use.

```tsx
import Overflow from "@talkdesk/cobalt-react-overflow";

// We can use an hard-coded value for `size` or use a library such as
// `react-use-measure` or `react-virtualized-auto-sizer` to get
// the value from a different container

<Overflow
  items={["One", "Two"]}
  size={300}
  direction="column"
>
  {({containerRef, hiddenElementRef, items, hiddenItems }) => (
    <div>
      <div ref={containerRef}>
        {items.map((item) => (
          <div key={item}>{item}</div>
        ))}
      </div>
      <div ref={hiddenElementRef}>
        {hiddenItems.length} more
      </div>
    </div>
  )}
</Overflow>

// or we can use the hook instead

import { useOverflow } from "@talkdesk/cobalt-react-overflow";

const {
    containerRef,
    hiddenElementRef,
    items,
    hiddenItems
} = useOverflow({
    items: ["One", "Two"],
    size: 300,
    direction: "column"
})

<div>
  <div ref={containerRef}>
    {items.map((item) => (
      <div key={item}>{item}</div>
    ))}
  </div>
  <div ref={hiddenElementRef}>
    {hiddenItems.length} more
  </div>
</div>
```

# List

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-list`
>
> Not the same as [List (Cobalt core)](../../../components/core/list/list.md), `@talkdesk/cobalt-react-list`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-list
```

```tsx
import List, { Item, Content, ContentWithDescription, Group } from "@talkdesk/cobalt-marketplace-react-list";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-list-stories--basic)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-list`](../../../components/core/list/list.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

List is a Cobalt Marketplace component. It is a separate package from the Cobalt core [List](/components/core/list/), with its own API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance is on the Cobalt core [List](/components/core/list/) page. This marketplace package has its own API: see the Code tab, and check which of the two packages your code already imports before using either.

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

### Item

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `active` | boolean |  | no |  |  |
| `disabled` | boolean |  | no |  |  |
| `onClick` | MouseEventHandler<HTMLAnchorElement> |  | no |  |  |
| `truncated` | boolean |  | no |  |  |
| `variation` | "danger" |  | no |  |  |
| `noPadding` | boolean |  | no |  |  |
| `children` | ReactNode |  | yes |  |  |

### Content

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `minimal` | boolean |  | no |  |  |
| `children` | ReactNode |  | yes |  |  |

### ContentWithDescription

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | string |  | yes |  |  |
| `description` | string |  | yes |  |  |
| `iconName` | enum | 1,103 icon names, one per line in [iconname-values.txt](iconname-values.txt) | no |  |  |

### Group

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `title` | string |  | yes |  |  |
| `children` | ReactNode |  | yes |  |  |

## Examples

_6 of 9 compile against the published `@talkdesk/cobalt-marketplace-react-list@2.2.2` (React 18, TypeScript strict)._

### Basic

```tsx
import List, { Item } from "@talkdesk/cobalt-marketplace-react-list"

<List>
  <Item>...</Item>
  <Item>...</Item>
  <Item>...</Item>
</List>
```

### Nested

```tsx
import List, { Item, Group } from "@talkdesk/cobalt-marketplace-react-list"

<List>
  <Group title="...">
    <Item>...</Item>
    <Item>...</Item>
  </Group>
  ...
</List>
```

### With icons

> **Doesn't compile:** uses `Icon`, `Flag` without importing or defining it. Fix it before use.

```tsx
import List, { Item, Content } from "@talkdesk/cobalt-marketplace-react-list"

// List with Icons
<List>
  <Item>
    <Content minimal>
      <Icon name="..." size="tiny" />
    </Content>
    <Content>...</Content>
  </Item>
  ...
</List>

// List with Empty Icons
<List>
  <Item>
    <Content minimal>
      <Icon name="..." size="tiny" style={{ visibility: "hidden" }} />
    </Content>
    <Content>...</Content>
  </Item>
  ...
</List>

// List with Flags
<List>
  <Item>
    <Content minimal>
      <Flag code="..."  size="tiny" />
    </Content>
    <Content>...</Content>
  </Item>
  ...
</List>
```

### With links

> **Doesn't compile:** uses `Icon` without importing or defining it. Fix it before use.

```tsx
import List, { Item, Content } from "@talkdesk/cobalt-marketplace-react-list"

// Links
<List>
  <Item onClick={...}>...</Item>
  ...
</List>

// Links states
<List>
  <Item onClick={...} active>...</Item>
  <Item onClick={...} disabled>...</Item>
  <Item onClick={...} variation="danger">...</Item>
</List>

// List with Icons
<List>
  <Item onClick={...}>
    <Content minimal>
      <Icon name="..." size="tiny" />
    </Content>
    <Content>...</Content>
  </Item>
  ...
</List>
```

### Right aligned

> **Doesn't compile:** uses `Icon`, `Tag` without importing or defining it. Fix it before use.

```tsx
import List, { Item, Content, ContentWithDescription } from "@talkdesk/cobalt-marketplace-react-list"

<List>
  <Item>
    <Content>...</Content>
    <Content minimal>...</Content>
  </Item>
  <Item>
    <Content minimal>
      <Icon name="..." size="tiny" />
    </Content>
    <Content>...</Content>
    <Content minimal>
      <Tag>...</Tag>
    </Content>
  </Item>
  <Item onClick={() => {}}>
    <Content>...</Content>
    <Content minimal>
      <Icon name="..." size="tiny" />
    </Content>
  </Item>
  <Item active onClick={() => {}}>
    <Content>...</Content>
    <Content minimal>
      <Tag color="...">...</Tag>
    </Content>
  </Item>
  <Item active onClick={() => {}}>
    <ContentWithDescription title="..." description="..." iconName="..."/>
    <Content minimal>
      <Tag>...</Tag>
    </Content>
  </Item>
</List>
```

### Truncated

```tsx
import List, { Item } from "@talkdesk/cobalt-marketplace-react-list"

<List>
  ...
  <Item truncated>...</Item>
  ...
</List>
```

### With description

```tsx
import List, { Item, ContentWithDescription } from "@talkdesk/cobalt-marketplace-react-list"

// Basic list with description
<List>
  <Item>
    <ContentWithDescription title="..." description="..." />
  </Item>
  ...
</List>

// Link list with description
<List>
  <Item active onClick={...}>
    <ContentWithDescription title="..." description="..."/>
  </Item>
  <Item onClick={...}>
    <ContentWithDescription title="..." description="..." />
  </Item>
</List>

// Link list with description and icons
<List>
  <Item active onClick={() => {}}>
    <ContentWithDescription title="..." description="..." iconName="..."/>
  </Item>
  <Item onClick={...}>
    <ContentWithDescription title="..." description="..." iconName="..."/>
  </Item>
</List>
```

### Custom content

```tsx
import List, { Item, Content } from "@talkdesk/cobalt-marketplace-react-list"

<List>
  <Item>
    <Content>...</Content>
  </Item>
</List>
```

### Divided

```tsx
import List, { Item } from "@talkdesk/cobalt-marketplace-react-list"

<List divided>
  <Item noPadding active>...</Item>
  <Item noPadding>...</Item>
  <Item noPadding>...</Item>
</List>
```

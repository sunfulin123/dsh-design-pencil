# Card

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-card`
>
> Not the same as [Card (Cobalt core)](../../../components/core/card/card.md), `@talkdesk/cobalt-react-card`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.1.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-card
```

```tsx
import Card, { Header, Footer, Content } from "@talkdesk/cobalt-marketplace-react-card";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-card-stories--basic)

## Known gaps

Read before using it:

* Card's props type doesn't declare children (it relied on React.FC's implicit children before React 18's types), so passing children doesn't compile under React 18 types, although they render. Its examples are marked "Doesn't compile" for this reason.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-card`](../../../components/core/card/card.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md).

## Guidance

Card is a Cobalt Marketplace component. It is a separate package from the Cobalt core [Card](/components/core/card/), with its own API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance is on the Cobalt core [Card](/components/core/card/) page. This marketplace package has its own API: see the Code tab, and check which of the two packages your code already imports before using either.

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

### Card

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `backgroundColor` | BackgroundColor |  | no |  |  |
| `outlined` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |
| `onKeyPress` | KeyboardEventHandler<HTMLDivElement> |  | no |  |  |
| `onClick` | () => void |  | no |  |  |

### Header

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `divided` | boolean |  | no |  |  |

### Footer

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `divided` | boolean |  | no |  |  |

## Examples

_0 of 7 compile against the published `@talkdesk/cobalt-marketplace-react-card@2.1.0` (React 18, TypeScript strict)._

### Basic

> **Doesn't compile:** the published types reject it: Type '{ children: string; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import Card from "@talkdesk/cobalt-marketplace-react-card"

<Card>
  ...
</Card>
```

### Clickable

> **Doesn't compile:** the published types reject it: Type '{ children: string; onClick: () => void; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Card from "@talkdesk/cobalt-marketplace-react-card"

<Card onClick={() => {}}>
  ...
</Card>
```

### Background

> **Doesn't compile:** the published types reject it: Type '{ children: string; backgroundColor: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import Card from "@talkdesk/cobalt-marketplace-react-card"

<Card backgroundColor="...">
  ...
</Card>
```

### Header

> **Doesn't compile:** the published types reject it: Type '{ children: Element; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import Card, { Header } from "@talkdesk/cobalt-marketplace-react-card"

<Card>
  <Header>This is the Header</Header>
</Card>
```

### Header with icon

> **Doesn't compile:** the published types reject it: Type '{ children: Element; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import Card, { Header } from "@talkdesk/cobalt-marketplace-react-card"
import Icon from "@talkdesk/cobalt-react-icon";
import { Heading } from "@talkdesk/cobalt-react-typography";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";

<Card>
  <Header width="100%">
    <Flex gap={4} width="100%" alignY="center">
      <Box grow>
        <Heading level="2" asLevel="1">Header</Heading>
      </Box>
      <Icon name="close" size="small" onClick={() => {}} />
    </Flex>
  </Header>
</Card>
```

### Complete

> **Doesn't compile:** the published types reject it: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import Card, { Header, Content, Footer } from "@talkdesk/cobalt-marketplace-react-card"

<Card>
  <Header>...</Header>
  <Content>...</Content>
  <Footer>...</Footer>
</Card>
```

### Complete with dividers

> **Doesn't compile:** the published types reject it: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import Card, { Header, Content, Footer } from "@talkdesk/cobalt-marketplace-react-card"

<Card>
  <Header divided>...</Header>
  <Content>...</Content>
  <Footer divided>...</Footer>
</Card>
```

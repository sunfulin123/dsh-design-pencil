# Card

> **Cobalt core** component · `@talkdesk/cobalt-react-card`
>
> Not the same as [Card (Cobalt Marketplace)](../../../components/marketplace/card/card.md), `@talkdesk/cobalt-marketplace-react-card`: a separate package with its own API. Check which one the code imports before using either.

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-card
```

```tsx
import Card from "@talkdesk/cobalt-react-card";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-card-docs--docs)

## Guidance

Cards can be used to contextualize and group sets of information. Each card can have its own title and actions that are only applied to the card's contents.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

This can help create individual sets of information that can be manipulated independently from the rest of the page content.

### Anatomy

![Card anatomy: header, content, footer](/assets/card/anatomy.png)

1. **Header**. The Card header is usually an H3 Header.
2. **Content**
3. **Footer**

### Variants

#### Sizes

There are three sizes available (Large, Medium, and Small), each to be applied to the respective viewport.

![Large card size](/assets/card/size-large.png)
*Large*

  ![Medium card size](/assets/card/size-medium.png)
*Medium*

  ![Small card size](/assets/card/size-small.png)
*Small*

#### Styles

Cards are simple containers for content and interactions. The **Card** can have a different type (outlined) due to style distinctions and divergent interaction patterns.

Therefore they will have similar behaviors, properties, and usage.

By default, cards are elevated through a shadow with no outline.

![Default card, elevated with a shadow and no outline](/assets/card/style-default-card.png)
*Default card*

  ![Outlined card](/assets/card/style-outlined-card.png)
*Outlined card*

##### Cards inside another card

Cards inside another card should always (for all viewports),

* be used in the outlined card variant
* be spaced by 8px
* have 12px padding

![Outlined cards nested inside another card, spaced 8px apart with 12px padding](/assets/card/cards-inside-card.png)

#### States

![Default state](/assets/card/state-default.png)
*Default*

  ![Active state](/assets/card/state-active.png)
*Active*

  ![Focused state](/assets/card/state-focused.png)
*Focused*

![Hover state](/assets/card/state-hover.png)
*Hover*

  ![Selected state](/assets/card/state-selected.png)
*Selected*

  ![Pressed state](/assets/card/state-pressed.png)
*Pressed*

![Outlined card, Default state](/assets/card/state-outlined-default.png)
*Outlined, Default*

  ![Outlined card, Active state](/assets/card/state-outlined-active.png)
*Outlined, Active*

  ![Outlined card, Focused state](/assets/card/state-outlined-focused.png)
*Outlined, Focused*

![Outlined card, Hover state](/assets/card/state-outlined-hover.png)
*Outlined, Hover*

  ![Outlined card, Selected state](/assets/card/state-outlined-selected.png)
*Outlined, Selected*

  ![Outlined card, Pressed state](/assets/card/state-outlined-pressed.png)
*Outlined, Pressed*

#### Modifiers

![Card with Header and Footer](/assets/card/modifier-header-footer.png)
*with Header and Footer*

  ![Card with Header and Action](/assets/card/modifier-header-action.png)
*with Header and Action*

  ![Card with Header](/assets/card/modifier-header.png)
*with Header*

![Card with Footer](/assets/card/modifier-footer.png)
*with Footer*

  ![Card without Header and Footer](/assets/card/modifier-without-header-footer.png)
*without Header and Footer*

### Guidelines

#### Group

##### Spacing between cards

The spacing between cards on the page should follow the global rules of **L:24px / M:16px / S:12px**. This should be used for both vertical and horizontal spacing between cards on a page.

![Cards spaced apart following the L:24px / M:16px / S:12px spacing rules](/assets/card/group-spacing-between-cards.png)

### Behavior

#### Responsiveness

Cards also follow the general spacing rules for each viewport. So we’ll have an inner padding of **L:24px / M:16px / S:12px**

![Responsiveness, Large](/assets/card/responsiveness-large.png)
*Responsiveness, Large*

  ![Responsiveness, Medium](/assets/card/responsiveness-medium.png)
*Responsiveness, Medium*

  ![Responsiveness, Small](/assets/card/responsiveness-small.png)
*Responsiveness, Small*

#### Interaction

##### Expandable card

Expandable cards have an expand button placed on the top right corner or on the top left corner.

Placing the expand button on the top right corner can be helpful to achieve a better alignment between the card title and the card content.

Placing the expand button in the top left corner can be helpful when the expandable card also has an action placed in the top right corner.

When closed they should have the height of the header.

![Expandable card shown collapsed and expanded, with the expand button in the top right and top left corner](/assets/card/interaction-expandable.png)

##### Draggable card

Draggable cards have a drag button, which uses the drag\_indicator icon, placed in the top left corner.

![Draggable card with a drag button in the top left corner](/assets/card/interaction-draggable.png)

##### Draggable expandable card

Expandable draggable cards have a drag button, which uses the drag\_handle\_corner icon, placed on the top left corner.

Expandable draggable cards have an expand button placed on the top right corner or on the top left corner.

Placing the expand button on the top right corner can be helpful to achieve a better alignment between the card title and the card content.

Placing the expand button in the top left corner can be helpful when the expandable card also has an action placed in the top right corner.

When closed they should have the height of the header.

#### Spacing

Cards follow the general spacing rules for each viewport, so we’ll have an inner padding of **L:24px / M:16px / S:12px.** These rules are also applied to the space between the card header and the card content except when used with a **borderless** header. In this case, the card content top padding should be **0px.**

##### Header with bottom border

![Header with bottom border, Large](/assets/card/header-border-large.png)
*Header with bottom border, Large*

  ![Header with bottom border, Medium](/assets/card/header-border-medium.png)
*Header with bottom border, Medium*

  ![Header with bottom border, Small](/assets/card/header-border-small.png)
*Header with bottom border, Small*

##### Borderless header

![Borderless header, Large](/assets/card/borderless-large.png)
*Borderless header, Large*

  ![Borderless header, Medium](/assets/card/borderless-medium.png)
*Borderless header, Medium*

  ![Borderless header, Small](/assets/card/borderless-small.png)
*Borderless header, Small*

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Card`and `Cobalt Design System > Patterns > CardPattern`

* [Card component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=233%3A9278\&t=cUGfDTrVMO1XHXET-1) — Core component library
* [CardPattern](https://www.figma.com/file/RbiNiZDJelIajXxTjDY72N/3---%E2%9A%97%EF%B8%8F-Patterns?node-id=523%3A485210\&t=jUe1rZb3NiVaRLjg-1) — Patterns library
* [Card handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=12%3A17460\&t=P3SljvXoMZOLHrzs-1) — Handoff guidelines

This can help create individual sets of information that can be manipulated independently from the rest of the page content.

The Card pattern is available under **Cobalt Design System › Patterns › [CardPattern](https://www.figma.com/design/RbiNiZDJelIajXxTjDY72N/?node-id=523-485210)**.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

* When clickable, give the card an accessible name and keyboard activation (code exposes `onKeyPress`).
* Ensure a visible focus indicator.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts the standard `Pick<
  HTMLAttributes<CardType>,
  "children" | "onClick" | "className" | "style"
>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `onKeyPress` | KeyboardEventHandler<HTMLDivElement> |  | no |  | Only to be triggered by the ENTER key |
| `outlined` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-react-card@2.2.5` (React 18, TypeScript strict)._

### Default

```tsx
import Card from "@talkdesk/cobalt-react-card";

<Card>
  ...
</Card>
```

### Outlined

```tsx
import Card from "@talkdesk/cobalt-react-card";

<Card outlined>
  ...
</Card>
```

### Clickable

```tsx
import Card from "@talkdesk/cobalt-react-card";

<Card onClick={...}>
  ...
</Card>
```

### Clickable with key

```tsx
import Card from "@talkdesk/cobalt-react-card";

<Card onKeyPress={...}>
  ...
</Card>
```

# Divider

> **Cobalt core** component · `@talkdesk/cobalt-react-divider`

## Install (v3.0.3)

```sh
npm install @talkdesk/cobalt-react-divider
```

```tsx
import Divider, { LabeledDivider } from "@talkdesk/cobalt-react-divider";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-divider-docs--docs)

## Guidance

Dividers are used to separate spaces visually and to show hierarchy and structure.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Dividers are an aesthetic tool used to **separate spaces and content**. They bring clarity to a layout by grouping and dividing content in close proximity.

### Anatomy

![Divider anatomy: a divider line and an optional label](/assets/divider/anatomy.png)

1. **Divider** - A line that separates the content
2. **Label** - Text that informs the user what to expect

### Variants

#### Colors

Dividers now support different colors. However, the default color is grey.

![Horizontal divider separating Section A above from Section B below](/assets/divider/color-default.png)
*Default*

  ![Divider with an applied color](/assets/divider/color-applied.png)
*Applied*

![Divider on a gray background](/assets/divider/color-gray-background.png)
*Gray background*

#### Modifiers

It can be a simple line or it can have a label.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Orientation

The divider can have two orientations: **horizontal** or **vertical**. By default, dividers are horizontal and should be used for separating content vertically. The vertical divider is used to separate content horizontally.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

### Guidelines

#### When to use

* Separating sections on a page
* Separating items in a list
* Creating a visual contrast between 2 sides of a page

#### Best practices

##### Dividing sections

Use dividers to separate the main sections of a form and put them before the section header. This allows for a clear separation between groups of information that the user must fill in.

**Do:** Use horizontal dividers to separate sections inside a form. Can use custom margins of 16px from the top (to make space after the previous form element) and 0px to the bottom (because the section header already has a top margin)
![Do example](/assets/divider/usecase-dividing-sections-do.png)

**Don't:** Don't use dividers to separate individual fields as this creates too much "visual noise".
![Don't example](/assets/divider/usecase-dividing-sections-dont.png)

##### Using labels

Make the labels short and use them as a clear separator and not as a label for the alternative action(s). Labels are also always **uppercase**.

**Do:** Use dividers with labels when you want to clearly identify different parts as alternatives.
![Do example](/assets/divider/usecase-using-labels-do.png)

**Don't:** Avoid using large labels.
![Don't example](/assets/divider/usecase-using-labels-dont.png)

### Behavior

#### Responsiveness

The divider could follow the width (for horizontal dividers) or height (for vertical dividers) of the content it's being separated.

#### Spacing

By default, there is **no margin** before and after the divider, but this can be achieved by applying the spacer token component of Cobalt.

Horizontal dividers always fill the container `width=100%`.

![Horizontal divider](/assets/divider/spacing-horizontal-no-margin.png)
*Horizontal with no margin*

  ![Vertical divider](/assets/divider/spacing-vertical-no-margin.png)
*Vertical with no margin*

If the spacer is used, then it is recommended that the spacings respect the current grid baseline values. For example, on large screens, we could add a margin of 24px. This margin can be applied to only one side of the divider (e.g. you can have 24px from the top and 0 from the bottom).

![Horizontal divider with 24px margin](/assets/divider/spacing-horizontal-margin.png)
*Horizontal with margin*
Horizontal dividers can be used to separate any type of content on a page.

  ![Vertical divider with 24px margin](/assets/divider/spacing-vertical-margin.png)
*Vertical with margin*
Vertical dividers can also be used to separate columns on a page (e.g: a table on the left and an accordion on the right).

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Divider`

* [Divider component](https://www.figma.com/file/OAai6yfKydI1p4afnUUI6V/2B---%F0%9F%93%96-Core-documentation-A-%3E-L?node-id=1003-307424) — Core component library
* [Divider handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=197-128950) — Handoff guidelines

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Writing guidelines

The only text a divider carries is its optional label. Keep it short and uppercase, and use it as a
clear separator between alternatives, not as a label for an action — see *Using labels* in the Design
tab. For copy rules that apply everywhere, see
[Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Interactions

A divider is not interactive: it takes no focus and responds to no mouse or keyboard input.

### Considerations

#### Development

The divider should have the proper role assigned to it so that it can be associated with a separator between sections of the page.

```html
<div class="co-divider co-divider--horizontal" role="separator"></div>
```

### How to test the component

* Press `Tab` through the page and confirm focus never lands on the divider.
* With a screen reader, confirm the divider is announced as a separator (from `role="separator"`).
* Confirm a labelled divider's text is read as plain text, not as a heading or a control.

## Props

### Divider

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | BackgroundColor |  | no |  |  |
| `vertical` | boolean |  | no |  | @deprecated Use `orientation` instead |
| `forwardedRef` | Ref<HTMLElement> |  | no |  | @deprecated Use `ref` instead |
| `orientation` | Orientation | `horizontal`, `vertical` | no |  | The orientation of the separator. @default 'horizontal' |
| `elementType` | string |  | no |  | The HTML element type that will be used to render the separator. |

### LabeledDivider

_Also accepts the standard `Omit<HTMLAttributes<HTMLDivElement>, "color">` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | BackgroundColor |  | no |  |  |
| `orientation` | enum | `horizontal`, `vertical` | no |  |  |
| `children` | ReactNode |  | yes |  |  |

## Examples

_5 of 5 compile against the published `@talkdesk/cobalt-react-divider@3.0.3` (React 18, TypeScript strict)._

### Horizontal

```tsx
import Divider from "@talkdesk/cobalt-react-divider";

<Divider />
```

### Horizontal with label

```tsx
import { LabeledDivider } from "@talkdesk/cobalt-react-divider";

<LabeledDivider>OR</LabeledDivider>
```

### Vertical

```tsx
import Divider from "@talkdesk/cobalt-react-divider";

<Divider orientation="vertical" />
```

### Vertical with label

```tsx
import { LabeledDivider } from "@talkdesk/cobalt-react-divider";

<LabeledDivider orientation="vertical">OR</LabeledDivider>
```

### Color

```tsx
import Divider from "@talkdesk/cobalt-react-divider";

<Divider orientation="vertical" color="..." />
```

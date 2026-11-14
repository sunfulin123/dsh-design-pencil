# Stepper

> **Cobalt core** component · `@talkdesk/cobalt-react-stepper`

## Install (v2.3.5)

```sh
npm install @talkdesk/cobalt-react-stepper
```

```tsx
import Stepper, { Step } from "@talkdesk/cobalt-react-stepper";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-stepper-docs--docs)

## Guidance

Stepper is a group of steps in a prescribed order with statuses that reflect progress.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

If a flow is divided into multiple pages or steps, the Stepper helps the user to understand the progression, navigate between the steps, and know how long it takes until completion. It also provides a better experience to the user while focusing on tasks one at a time.

### Anatomy

![Stepper anatomy: visited, connecting bar, current step, unvisited](/assets/stepper/anatomy.png)

1. **Visited** - Steps that have already been visited
2. **Connecting Bar**: It shows users their progress in completing a task.
3. **Current step:** It shows the current step that the user is on.
4. **Unvisited:** Shows steps that the user has not visited.

### Variants

#### Sizes

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Orientation

![Vertical Stepper orientation](/assets/stepper/orientation-vertical.png)
*Vertical*

![Horizontal Stepper orientation](/assets/stepper/orientation-horizontal.png)
*Horizontal*

#### Quantity

![Stepper with 3 steps](/assets/stepper/quantity-3.png)
*3 steps*

  ![Stepper with 4 steps](/assets/stepper/quantity-4.png)
*4 steps*

![Stepper with 5 steps](/assets/stepper/quantity-5.png)
*5 steps*

  ![Stepper with 6 steps](/assets/stepper/quantity-6.png)
*6 steps*

#### Progress

This is a progress visual indicator in Figma to help designers provide more context in their explorations.

![Progress indicator, 1 of 6 steps, start](/assets/stepper/progress-1.png)
*1/6 steps (start)*

  ![Progress indicator, 2 of 6 steps](/assets/stepper/progress-2.png)
*2/6 steps*

  ![Progress indicator, 3 of 6 steps](/assets/stepper/progress-3.png)
*3/6 steps*

![Progress indicator, 4 of 6 steps](/assets/stepper/progress-4.png)
*4/6 steps*

  ![Progress indicator, 5 of 6 steps](/assets/stepper/progress-5.png)
*5/6 steps*

  ![Progress indicator, 6 of 6 steps, complete](/assets/stepper/progress-6.png)
*6/6 steps (complete)*

### Guidelines

#### Placement

In general, the Stepper is positioned below the header. However, the Stepper can be placed inside the Header. In this case, the Header should not have the bottom border. As always, the Stepper should be full width.

![Stepper placed inside a page header, below the title and above the page content](/assets/stepper/placement.png)

#### Use cases

![Stepper used across a full page](/assets/stepper/usecase-full-page.png)
*Full page*
General use case

![Stepper used inside a Modal](/assets/stepper/usecase-modal.png)
*Inside a Modal*
Use for critical and/or small forms.

![Stepper used inside a Panel](/assets/stepper/usecase-panel.png)
*Inside a Panel*
Use when the user might need to reference details on the page.

#### Best practices

##### Do

* Use it when requiring a user to complete a linear workflow that includes 3 to 6 steps.
* When you have complex processes that benefit from being broken down into smaller tasks.

##### Don't

* Avoid using a workflow that contains fewer than 3 or more than 6 steps.
* Don't use it when presenting a non-linear workflow.
* Don't mix the vertical and the horizontal steps in the same flow.

### Behavior

#### Responsiveness

##### Horizontal

The Stepper component should always be full-width.

##### Vertical

The component should have its values fixed. The vertical orientation may change to horizontal on mobile devices.

#### Spacing

![Stepper with default spacing](/assets/stepper/spacing-default.png)
*Default*

![Stepper with padding around it](/assets/stepper/spacing-with-padding.png)
*With padding*

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Stepper (or VerticalStepper)`

* [Stepper Component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=280-10413\&mode=design) — Core components library
* [Stepper Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=349%3A198065\&mode=design\&t=G7viA6EPpOShSmI1-1) — Specs

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

* Convey step order and current/completed status (e.g. `aria-current="step"` plus text, not color alone).
* Use an ordered list structure.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

### Stepper

_Also accepts the standard `HTMLAttributes<StepperType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `forwardedRef` | Ref<HTMLUListElement> |  | no |  |  |

### Step

_Also accepts the standard `AnchorHTMLAttributes<StepType>` attributes._

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `active` | boolean |  | no |  |  |
| `visited` | boolean |  | no |  |  |
| `forwardedRef` | Ref<HTMLAnchorElement> |  | no |  |  |

## Examples

_2 of 2 compile against the published `@talkdesk/cobalt-react-stepper@2.3.5` (React 18, TypeScript strict)._

### Primary

```tsx
import Stepper, { Step } from "@talkdesk/cobalt-react-stepper";

<Stepper>
  <Step visited>1</Step>
  <Step visited active>2</Step>
  <Step>3</Step>
</Stepper>
```

### Sizes

```tsx
import Stepper, { Step } from "@talkdesk/cobalt-react-stepper";

<Stepper size="small">
  ...
</Stepper>

<Stepper size="medium">
  ...
</Stepper>

<Stepper size="large">
  ...
</Stepper>
```

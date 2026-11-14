# Rating

> **Cobalt core** component · `@talkdesk/cobalt-react-rating`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v3.0.0)

```sh
npm install @talkdesk/cobalt-react-rating
```

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-rating-docs--docs)

## Guidance

Rating is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for Rating yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

### Rating

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `isInvalid` | boolean |  | no |  |  |
| `children` | ReactNode |  | no |  | One `RatingOption` per child, in order. |
| `value` | number |  | no |  | The index of the selected option (controlled). See `defaultValue`. |
| `defaultValue` | number |  | no |  | The index of the initially selected option. See `value`. |
| `onChange` | (value: number) => void |  | no |  | Called with the index of the selected option, or with `null` when the selection is cleared. |
| `size` | enum | `small`, `medium` | no | medium |  |
| `color` | enum | `green`, `yellow`, `red`, `gray` | no |  | Colour of the highlighted options. Without it, the colour goes from red to green according to the position of the selected option. |
| `highlightBehavior` | enum | `single`, `multiple` | no | multiple | `multiple` highlights every option up to the selected one, `single` highlights only the selected one. |
| `name` | string |  | no |  | The name used to submit the index of the selected option with a form. |
| `isRequired` | boolean |  | no |  | Whether a selection is required before the form can be submitted. |
| `validate` | (value: number) => true \| ValidationError |  | no |  | Validates the index of the selected option. It is not called while nothing is selected - use `isRequired` for that. |
| `validationBehavior` | enum | `native`, `aria` | no |  | Whether to use native form validation, blocking submission and showing errors on submit, or only mark the rating invalid with ARIA, showing errors in realtime. Defaults to the enclosing `Form`'s, or `native`. |
| `disallowEmptySelection` | boolean |  | no |  | Whether the collection allows empty selection. |
| `isDisabled` | boolean |  | no |  | Whether all items are disabled. |

### RatingOption

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `preventFocusOnPress` | boolean |  | no |  | Whether to prevent focus from moving to the button when pressing it.  Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `onChange` | (isSelected: boolean) => void |  | no |  | Handler that is called when the element's selection state changes. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | **Not recommended – use `onPress` instead.** `onClick` is an alias for `onPress` provided for compatibility with other libraries. `onPress` provides additional event details for non-mouse interactions. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

## Examples

_10 of 12 compile against the published `@talkdesk/cobalt-react-rating@3.0.0` (React 18, TypeScript strict)._

### Basic

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

<Rating aria-label="Satisfaction">
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Controlled

> **Doesn't compile:** the published types reject it: Type 'Dispatch<SetStateAction<number>>' is not assignable to type '(value: number | null) => void'. Fix it before use.

```tsx
import { useState } from "react";
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

// `value` and `onChange` are the index of the selected option.
const [value, setValue] = useState(2);

<Rating aria-label="Satisfaction" value={value} onChange={setValue}>
  {values.map((option) => (
    <RatingOption key={option}>{option}</RatingOption>
  ))}
</Rating>
```

### With field

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

<Rating label="Satisfaction" description="How was the call?" hint="Pick one">
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>

<Rating label="Satisfaction" isInvalid errorMessage="Rate the call">
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>

<Rating label="Satisfaction" warningMessage="The rating will be required soon">
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Sizes

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

<Rating label="Small" size="small">
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>

<Rating label="Medium" size="medium">
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Disabled

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

<Rating aria-label="Satisfaction" isDisabled>
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Colors

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

// `color` can be "green", "yellow", "red" or "gray".
<Rating aria-label="Satisfaction" color="green" defaultValue={2}>
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Highlight behavior

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

<Rating label="Multiple" highlightBehavior="multiple" defaultValue={2}>
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>

<Rating label="Single" highlightBehavior="single" defaultValue={2}>
  {values.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Many options

```tsx
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const scale = Array.from({ length: 10 }, (_, index) => index + 1);

<Rating aria-label="How likely are you to recommend us?" defaultValue={7}>
  {scale.map((value) => (
    <RatingOption key={value}>{value}</RatingOption>
  ))}
</Rating>
```

### Sentiment

> **Doesn't compile:** the published types reject it: Type 'string' is not assignable to type '"translate" | "security" | "done" | "search" | "send" | "alert" | "article" | "group" | "link" | "list" | "menu" | "table" | "timer" | "email" | "numeric" | "l. Fix it before use.

```tsx
import Icon from "@talkdesk/cobalt-react-icon";
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const smiles = [
  { icon: "sentiment_very_dissatisfied", label: "Very dissatisfied" },
  { icon: "sentiment_dissatisfied", label: "Dissatisfied" },
  { icon: "sentiment_neutral", label: "Neutral" },
  { icon: "sentiment_satisfied", label: "Satisfied" },
  { icon: "sentiment_very_satisfied", label: "Very satisfied" }
];

<Rating
  aria-label="How was your experience?"
  highlightBehavior="single"
  defaultValue={3}
>
  {smiles.map(({ icon, label }) => (
    <RatingOption key={icon} aria-label={label}>
      <Icon name={icon} />
    </RatingOption>
  ))}
</Rating>
```

### Stars

```tsx
import Icon from "@talkdesk/cobalt-react-icon";
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

<Rating aria-label="Product rating" color="yellow" defaultValue={2}>
  {values.map((value) => (
    <RatingOption
      key={value}
      aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
    >
      <Icon name="star" />
    </RatingOption>
  ))}
</Rating>
```

### Wrapped options

```tsx
import Icon from "@talkdesk/cobalt-react-icon";
import { Tooltip, TooltipTrigger } from "@talkdesk/cobalt-react-tooltip";
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

const scale = [
  { score: 1, caption: "Awful" },
  { score: 2, caption: "Bad" },
  { score: 3, caption: "OK" },
  { score: 4, caption: "Good" },
  { score: 5, caption: "Great" }
];

const smiles = [
  { icon: "sentiment_very_dissatisfied", label: "Very dissatisfied" },
  { icon: "sentiment_dissatisfied", label: "Dissatisfied" },
  { icon: "sentiment_neutral", label: "Neutral" },
  { icon: "sentiment_satisfied", label: "Satisfied" },
  { icon: "sentiment_very_satisfied", label: "Very satisfied" }
];

const StarOption = ({ label }) => (
  <RatingOption aria-label={label}>
    <Icon name="star" />
  </RatingOption>
);

const SmileOption = ({ smile }) => (
  <RatingOption aria-label={smile.label}>
    <Icon name={smile.icon} />
  </RatingOption>
);

<Rating label="Wrapped in a layout element" defaultValue={3}>
  {scale.map(({ score, caption }) => (
    <div
      key={score}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4
      }}
    >
      <RatingOption aria-label={caption}>{score}</RatingOption>
      <small>{caption}</small>
    </div>
  ))}
</Rating>

<Rating
  label="Rendered by a component of your own"
  color="yellow"
  defaultValue={2}
>
  {values.map((value) => (
    <StarOption
      key={value}
      label={`${value} ${value === 1 ? "star" : "stars"}`}
    />
  ))}
</Rating>

<Rating
  label="Wrapped in a tooltip, around a component of your own"
  highlightBehavior="single"
  defaultValue={2}
>
  {smiles.map((smile) => (
    <TooltipTrigger key={smile.icon}>
      <SmileOption smile={smile} />
      <Tooltip>{smile.label}</Tooltip>
    </TooltipTrigger>
  ))}
</Rating>
```

### Form

```tsx
import { Form } from "react-aria-components";
import Button from "@talkdesk/cobalt-react-button";
import { Rating, RatingOption } from "@talkdesk/cobalt-react-rating";

const values = [1, 2, 3, 4, 5];

// `name` submits the index of the selected option, e.g. "satisfaction=2".
<Form validationErrors={validationErrors} onSubmit={onSubmit}>
  <Rating
    label="Satisfaction"
    name="satisfaction"
    isRequired
    errorMessage="Rate the call"
  >
    {values.map((value) => (
      <RatingOption key={value}>{value}</RatingOption>
    ))}
  </Rating>
  <Rating
    label="How likely are you to recommend us?"
    name="recommend"
    defaultValue={2}
    validate={(value) =>
      value === 0 ? "Pick 2 or more, or tell us why in a comment" : null
    }
  >
    {values.map((value) => (
      <RatingOption key={value}>{value}</RatingOption>
    ))}
  </Rating>
  <Button htmlType="submit" type="primary" size="small">Submit</Button>
  <Button htmlType="reset" size="small">Reset</Button>
</Form>
```

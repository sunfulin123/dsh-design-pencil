# FormCheck

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-form-check`

> **No design guidance yet.** Only the API is documented here. Don't make up usage rules for it (when to use it, which variant, what its labels say); if the task needs one, say there's no guidance.

## Install (v2.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-form-check
```

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-formcheck-stories--main)

## Known gaps

Read before using it:

* FormCheck's props type doesn't declare children (it relied on React.FC's implicit children before React 18's types), so passing children doesn't compile under React 18 types, although they render. Its examples are marked "Doesn't compile" for this reason.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-input`](../../../components/core/input/input.md), [`@talkdesk/cobalt-react-label`](../../../components/core/label/label.md), [`@talkdesk/cobalt-react-required`](../../../components/core/required/required.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

FormCheck is a Cobalt Marketplace component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

No design guidance has been written for FormCheck yet. Its props and examples are in the Code tab, and its Storybook is linked above.

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

### FormCheck

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | string |  | no |  |  |
| `optionsDirection` | enum | `vertical`, `horizontal` | no | vertical |  |
| `required` | boolean |  | no | false |  |

### Option

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `description` | string |  | no |  |  |
| `label` | string |  | yes |  |  |
| `type` | enum | `checkbox`, `radio` | yes |  |  |
| `id` | string |  | no |  |  |
| `size` | Size | `small`, `medium` | no |  |  |
| `noArrows` | boolean |  | no |  |  |
| `textAlign` | TextAlign | `left`, `center`, `right` | no |  |  |
| `variation` | Variation | `error`, `warning`, `unstyled` | no |  |  |
| `forwardedRef` | Ref<HTMLInputElement> |  | no |  |  |

## Examples

_0 of 6 compile against the published `@talkdesk/cobalt-marketplace-react-form-check@2.2.0` (React 18, TypeScript strict)._

### Main

> **Doesn't compile:** the published types reject it: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";

<FormCheck>
  <Option type="checkbox" value={...} label={...} onChange={...} />
  <Option type="checkbox" value={...} label={...} onChange={...} />
  <Option type="checkbox" value={...} label={...} onChange={...} />
  <Option type="checkbox" value={...} label={...} onChange={...} />
</FormCheck>

<FormCheck>
  <Option type="radio" value={...} label={...} onChange={...} />
  <Option type="radio" value={...} label={...} onChange={...} />
  <Option type="radio" value={...} label={...} onChange={...} />
  <Option type="radio" value={...} label={...} onChange={...} />
</FormCheck>
```

### Options direction

> **Doesn't compile:** the published types reject it: Type '{ children: string; optionsDirection: "vertical"; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";

<FormCheck optionsDirection="vertical">
  ...
</FormCheck>

<FormCheck optionsDirection="horizontal">
  ...
</FormCheck>
```

### With label

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: any; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";

<FormCheck label={...} >
  ...
</FormCheck>
```

### With desc

> **Doesn't compile:** the published types reject it: Type '{ children: Element[]; }' has no properties in common with type 'IntrinsicAttributes & Props'.. Fix it before use.

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";

<FormCheck>
  <Option type="checkbox" value={...} label={...} description={...} />
  <Option type="checkbox" value={...} label={...} description={...} />
  <Option type="checkbox" value={...} label={...} description={...} />
  <Option type="checkbox" value={...} label={...} description={...} />
</FormCheck>
```

### With desc horizontal

> **Doesn't compile:** the published types reject it: Type '{ children: Element[]; optionsDirection: "horizontal"; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";

<FormCheck optionsDirection="horizontal">
  <Option type="checkbox" value={...} label={...} description={...} />
  <Option type="checkbox" value={...} label={...} description={...} />
  <Option type="checkbox" value={...} label={...} description={...} />
  <Option type="checkbox" value={...} label={...} description={...} />
</FormCheck>
```

### Required

> **Doesn't compile:** the published types reject it: Type '{ children: string; label: any; required: true; }' is not assignable to type 'IntrinsicAttributes & Props'. Fix it before use.

```tsx
import FormCheck, { Option } from "@talkdesk/cobalt-marketplace-react-form-check";

<FormCheck label={...} required>
  ...
</FormCheck>
```

# LabeledIcon

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-labeled-icon`
>
> Built on [Icon (Cobalt core)](../../../components/core/icon/icon.md), `@talkdesk/cobalt-react-icon`.

## Install (v3.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-labeled-icon
```

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-labeledicon-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Guidance

A LabeledIcon is a component that combines an icon with a label.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Anatomy

![Labeled icon example — Anatomy](/assets/labeled-icon/anatomy.png)

1. Icon
2. Label

### Variants

#### Sizes

![Labeled icon example — Variants Sizes: Micro](/assets/labeled-icon/sizes-micro.png)
*Micro*

  ![Labeled icon example — Variants Sizes: XSmall](/assets/labeled-icon/sizes-xsmall.png)
*XSmall*

  ![Labeled icon example — Variants Sizes: Small](/assets/labeled-icon/sizes-small.png)
*Small*

![Labeled icon example — Variants Sizes: Medium](/assets/labeled-icon/sizes-medium.png)
*Medium*

  ![Labeled icon example — Variants Sizes: Large](/assets/labeled-icon/sizes-large.png)
*Large*

  ![Labeled icon example — Variants Sizes: XLarge](/assets/labeled-icon/sizes-xlarge.png)
*XLarge*

#### Colors

By default the label color is Secondary 800, however, as the icon, it can have different colors applied.

![Labeled icon example — Variants Colors: icon and label secondary800](/assets/labeled-icon/colors-icon-and-label-secondary800.png)
*icon and label secondary800*

  ![Labeled icon example — Variants Colors: icon info700 and label secondary800](/assets/labeled-icon/colors-icon-info700-and-label-secondary800.png)
*icon info700 and label secondary800*

  ![Labeled icon example — Variants Colors: icon and label info700](/assets/labeled-icon/colors-icon-and-label-info700.png)
*icon and label info700*

### Guidelines

#### Group

The distance between two LabeledIcons or a LabeldIcon and another component (e.g. divider) should be **8px**.

![Labeled icon example — Guidelines Group](/assets/labeled-icon/guidelines-group.png)

#### Use cases

A LabeledIcon should be used when an icon needs to be combined with a label and it could be used in and/or combined with several other components, such as:

![Labeled icon example — Guidelines Use cases: in the header to highlight the section](/assets/labeled-icon/cases-in-the-header-to-highlight.png)
*in the header to highlight the section*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*combined with inputs as a hint*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/5465d3-labeledicon) — Design tab, image 13.*

![Labeled icon example — Guidelines Use cases: in table cells to show the status](/assets/labeled-icon/cases-in-table-cells-to-show.png)
*in table cells to show the status*

#### Dont’s

A LabeledIcon is not an interactive component and should never be used for that purpose.

Please also consider checking the [Color | Color usage](https://zeroheight.com/51aaf6147/p/49728f/b/94c676) page when applying different colors in LabeledIcons.

#### Link vs button vs LabeledIcon

A link should never be used with an icon.

To use an interactive component with an icon and a label, the button component should be applied.

To use a non-interactive component with an icon and a label, the labeledicon component should be applied.

![Labeled icon example — Link vs Button vs LabeledIcon: Link](/assets/labeled-icon/labeledicon-link.png)
*Link*

  ![Labeled icon example — Link vs Button vs LabeledIcon: Transparent button with icon](/assets/labeled-icon/labeledicon-transparent-button-with-icon.png)
*Transparent button with icon*

  ![Labeled icon example — Link vs Button vs LabeledIcon: Labeledicon](/assets/labeled-icon/sizes-micro.png)
*Labeledicon*

| **Component** | **Interactive** | **Icon**                 | **Size**                               | **Font size**                                                                         | **Label weight**             |
| ------------- | --------------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| LabeledIcon   | False           | True                     | Micro XSmall Small Medium Large XLarge | Micro: Small XSmall: Medium Small: Medium Medium: Medium Large: Medium XLarge: Medium | Optional (Regular or Medium) |
| Button        | True            | Optional (True or False) | Medium Small XSmall                    | Medium: Medium Small: Small XSmall: N/A                                               | Medium                       |
| Link          | True            | False                    | Medium Small                           | Medium: Medium Small: Small                                                           | Regular                      |

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > LabeledIcon`

* [LabeledIcon component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=1048%3A145579\&t=uKxaIEgOvsWKrXlT-1) — Core component library
* [LabeledIcon handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=3%3A15267\&t=sGMnhaBvne0ZUrQV-1) — Handoff guidelines

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

* Hide the icon from assistive tech when the label already conveys its meaning, so the text isn't duplicated.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | String |  | yes |  |  |
| `iconName` | enum | 1,103 icon names, one per line in [iconname-values.txt](iconname-values.txt) | yes |  |  |
| `iconColor` | Color |  | no |  |  |
| `iconSize` | enum | `nano`, `micro`, `tiny`, `small`, `medium`, `large`, `xlarge` | no |  |  |
| `labelColor` | Color |  | no |  |  |
| `labelSize` | enum | `small`, `medium` | no |  |  |
| `labelWeight` | enum | `inherit`, `medium`, `light`, `regular` | no |  |  |
| `forwardedRef` | Ref<any> |  | no |  |  |

## Examples

_6 of 6 compile against the published `@talkdesk/cobalt-marketplace-react-labeled-icon@3.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";

<LabeledIcon iconName={...} label={...} />;
```

### Labelsizes

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";

<LabeledIcon iconName={...} label={...} labelSize="small" />;
<LabeledIcon iconName={...} label={...} labelSize="medium" />;
```

### Iconsizes

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";

<LabeledIcon iconName={...} label={...} iconSize="micro" />;
<LabeledIcon iconName={...} label={...} iconSize="tiny" />;
<LabeledIcon iconName={...} label={...} iconSize="small" />;
<LabeledIcon iconName={...} label={...} iconSize="medium" />;
<LabeledIcon iconName={...} label={...} iconSize="large" />;
<LabeledIcon iconName={...} label={...} iconSize="xlarge" />;
```

### Labelcolor

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";

<LabeledIcon iconName={...} label={...} labelColor={...} />;
```

### Iconcolor

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";

<LabeledIcon iconName={...} label={...} iconColor={...} />;
```

### Labelweight

```tsx
import LabeledIcon from "@talkdesk/cobalt-marketplace-react-labeled-icon";

<LabeledIcon iconName={...} label={...} labelWeight="light" />;
<LabeledIcon iconName={...} label={...} labelWeight="regular" />;
<LabeledIcon iconName={...} label={...} labelWeight="medium" />;
```

# Tab

> **Cobalt core** component · `@talkdesk/cobalt-react-tab`
>
> Extended in Cobalt Marketplace by [Nav](../../../components/marketplace/nav/nav.md) (`@talkdesk/cobalt-marketplace-react-nav`), built on this package.

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-tab
```

```tsx
import Tab from "@talkdesk/cobalt-react-tab";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-tab-docs--docs)

## Guidance

The nav component allows the user to navigate between different areas of the page or page segment (e.g. panel) without leaving it.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Nav is used to separate different content available on the same page or page segment.

### Anatomy

![Nav anatomy: tab, tag, badge, divider, navigation buttons](/assets/tab/anatomy.png)

1. **Tab**. Each tab represents a different area where the user can navigate.
2. **Tag**. Tabs can have associated tags to provide valuable communication to the user.
3. **Badge**. Tabs can have associated badges to notify the user.
4. **Divider**
5. **Navigation**. These buttons allow the user to see hidden tabs.

### Variants

#### Sizes

There are three sizes available (Large, Medium, and Small), each to be applied to the respective viewport.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

##### Nav

![Nav with divider](/assets/tab/modifier-nav-with-divider.png)
*with divider*

  ![Nav without divider](/assets/tab/modifier-nav-without-divider.png)
*without divider*

  ![Nav with navigation buttons](/assets/tab/modifier-nav-with-navigation.png)
*with navigation*

##### Tab

![Tab with badge](/assets/tab/modifier-tab-with-badge.png)
*with badge*

  ![Tab with tag](/assets/tab/modifier-tab-with-tag.png)
*with tag*

  ![Tab with tag and badge](/assets/tab/modifier-tab-with-tag-and-badge.png)
*with tag and badge*

#### Quantity

Navs can have as many tabs as needed.

![Nav with many tabs](/assets/tab/quantity.png)

### Guidelines

#### Placement

The Nav should be placed right after the header component.

![Page header with pre-title, heading and description at a large viewport width](/assets/tab/sizes-large.png)

### Behavior

#### Responsiveness

Navs left and right paddings follow the general rules for each viewport, **L:24px / M:16px / S:12px**

![Page header with pre-title, heading and description at a small viewport width](/assets/tab/sizes-small.png)
*small*

![Page header with pre-title, heading and description at a medium viewport width](/assets/tab/sizes-medium.png)
*medium*

![Page header with pre-title, heading and description at a large viewport width](/assets/tab/sizes-large.png)
*large*

#### Overflow

When the group of tabs width is larger than the container width, the user can access hidden tabs by using the navigation buttons positioned on the right.

![Page header with pre-title, heading and description at a small viewport width](/assets/tab/sizes-small.png)

The core `Tab` package is a single tab and does not scroll. The scrolling row with navigation buttons is the Cobalt Marketplace [Nav](/components/marketplace/nav/) component, which is built on `Tab`.

#### Text truncation

Tabs can be truncated.

We recommend, optionally, setting a max width for each tab dependent on the viewport.

* **128px** for the small viewports;
* **148px** for the medium viewports;
* **168px** for the large viewports.

![Page header with pre-title, heading and description at a small viewport width](/assets/tab/sizes-small.png)
*max width - small*

![Page header with pre-title, heading and description at a medium viewport width](/assets/tab/sizes-medium.png)
*max width - medium*

![Page header with pre-title, heading and description at a large viewport width](/assets/tab/sizes-large.png)
*max width - large*

#### Spacing

Spacing between tabs is always 16px.

![Seven tabs spaced 16px apart](/assets/tab/spacing.png)

### Resources

* [Nav](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=608%3A29236\&t=AVgi4HZIy2fgEObs-1) — Core components library
* [Nav handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=12%3A17461\&t=Aj3KLvOYbnQHsyFy-1) — Handoff guidelines

### Code

### Props

### Examples

### Content

* Write short tab labels and use plain language, rather than made-up terms. Tab labels should usually be 1–2 words. Short labels are more scannable; if you need longer labels, it’s a sign that the choices are too complicated for a tab control.
* Avoid abbreviations and acronyms unless you’re sure that the user is already familiar with them.
* Use sentence case unless it’s the name of a specific app, feature, or product.

**Do:** Use clear and concise labels.
![Do example](/assets/tab/content-do.png)

**Don't:** If the name of a tab is the same as the page header, it should be the first tab.
![Don't example](/assets/tab/content-dont.png)

### Accessibility

### Considerations

#### Development

Each tab renders a link (`<a>`); a disabled tab renders a `<span>` with `aria-disabled`. The component
does not add a landmark or mark the current tab, so the page using it must:

* Wrap the tabs in a `<nav>` landmark, with an `aria-label` when the page has more than one.
* Mark the selected tab with `aria-current="page"` as well as the `active` prop, which is visual only.
* Give every tab an `href`, so it stays reachable with `Tab` and opens with `Enter`.

If you use the Cobalt Marketplace [Nav](/components/marketplace/nav/) for overflow, see its
Accessibility tab for a gap in its navigation buttons.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts the standard `AnchorHTMLAttributes<TabType>` attributes._

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `active` | boolean |  | no |  |  |
| `disabled` | boolean |  | no |  |  |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `forwardedRef` | Ref<HTMLAnchorElement> |  | no |  |  |

## Examples

_3 of 3 compile against the published `@talkdesk/cobalt-react-tab@2.2.5` (React 18, TypeScript strict)._

### Basic

```tsx
import Tab from "@talkdesk/cobalt-react-tab";

<Tab>...</Tab>
```

### Size

```tsx
import Tab from "@talkdesk/cobalt-react-tab";

<Tab size="small">...</Tab>
<Tab size="medium">...</Tab>
<Tab size="large">...</Tab>
```

### State

```tsx
import Tab from "@talkdesk/cobalt-react-tab";

<Tab active>...</Tab>
<Tab disabled>...</Tab>
```

# ProgressBar

> **Cobalt core** component · `@talkdesk/cobalt-react-progress-bar`

## Install (v3.0.2)

```sh
npm install @talkdesk/cobalt-react-progress-bar
```

```tsx
import ProgressBar from "@talkdesk/cobalt-react-progress-bar";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-progressbar-docs--docs)

## Guidance

A component that shows continuous progress through a process, such as a percentage value. They show how much progress is complete and how much remains.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Progress bars are feedback that allows the user to know that something is busy loading. They're animated bars that show a rate of completion for a system task or a response to user input.

They can also be accompanied by a percentage of completion value, a label, and a description that could bring more context about the progression.

### Anatomy

![ProgressBar anatomy: label, fill, track, percentage, description](/assets/progress-bar/anatomy.png)

1. **Label**: Text that informs the user what to expect when processing the content.
2. **Fill**: The visual representation of how much remains in the loading.
3. **Track**: The path of the loader.
4. **Percentage**: The percentage of how much progress is complete.
5. **Description**: Gives context about the progression.

### Variants

#### Sizes

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Colors

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

![Isolated ProgressBar, no label or description](/assets/progress-bar/modifier-isolated.png)
*Isolated*

  ![ProgressBar with description](/assets/progress-bar/modifier-with-description.png)
*With Description*

  ![ProgressBar with label and percentage](/assets/progress-bar/modifier-with-label.png)
*With Label*

#### Progress

Preview of the percentage change just for reference in Figma simulating the progress indicator.

![ProgressBar at 0%](/assets/progress-bar/progress-0.png)
*0%*

![ProgressBar at 25%](/assets/progress-bar/progress-25.png)
*25%*

![ProgressBar at 50%](/assets/progress-bar/progress-50.png)
*50%*

![ProgressBar at 75%](/assets/progress-bar/progress-75.png)
*75%*

![ProgressBar at 100%](/assets/progress-bar/progress-100.png)
*100%*

#### Theming

The ProgressBar remains the same across themes, only changing through the color categories.

### Guidelines

#### When to use

* Use it when a file is downloading.
* Use it when a file is uploading.
* For a long-running process or background process, e.g. importing data or exporting reports.
* Use it to provide context or orientation within the process.
* Use it to provide some idea of how long the process is.

![Example of a ProgressBar being used when a file is uploading. The user needs to wait to continue.](/assets/progress-bar/usage-uploading.png)

Example of a ProgressBar being used when a file is uploading. The user needs to wait to continue.

![After the progression is complete, the user can proceed.](/assets/progress-bar/usage-complete.png)

After the progression is complete, the user can proceed.

#### When not to use

* Don't use it for loading small components.
* Don't use it for inline loading.
* Don't use it for loading multiple components.
* Don't use it to give feedback for an entire page load.
* Don't use it to inform about what’s to come.

Please also consider checking the [Color | Color usage](https://zeroheight.com/51aaf6147/p/49728f/b/94c676) page when applying different colors in the ProgressBar.

#### Placement

In general, you need to place the ProgressBar very close to the content that is being loaded. The ProgressBar span the full width. You can make it more or less obvious to a user. As a general rule of thumb, pages with a short load time can have a more subtle loader, while pages with a lengthy load time need the ProgressBar to be more apparent.

![ProgressBar sizes preview](/assets/progress-bar/placement.png)

#### Comparison between components

##### ProgressBar vs skeleton

If you want a more specific loading experience focused on the page structure you should use a [Skeleton](https://designsystem.talkdesk.com/51aaf6147/p/243842-skeleton) to represent loading content better. The simplest view of the page loads first, followed by progressively more detailed batches until the entire viewport has loaded.

##### ProgressBar vs 3Dots

3Dots is the loader Workspace shows while a whole app loads; apps can't use it (see
[App loading](/workspace/app-loading/)). For fast processes that take less than 300ms, consider no loading
state at all.

##### ProgressBar vs spinner

Consider using a Spinner for a tiny, inline action or feedback, e.g. clicking a button and the action will take time.

### Behavior

#### Responsiveness

ProgressBar has three sizes, each one to be used in the respective viewport. The height of the ProgressBar can be customized by setting the viewport property with `Small`, `Medium` or `Large` values.

#### Internationalization

For RTL (right-to-left) languages, the layout of the ProgressBar is mirrored. The label is right-aligned, the percent value is left-aligned, and the fill progresses from right to left. Keep in mind that the placement of the percent sign differs depending on the region.

![Progress bar example — Internationalization](/assets/progress-bar/internationalization.png)

### Resources

Find this component under: `Cobalt Design System > Core Components > ProgressBar`

* [ProgressBar Component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=734%3A41948) — Core Components library
* [ProgressBar Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=277%3A178106) — Component specs

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

Use simple, clear, and unambiguous labels.

![Do example](/assets/progress-bar/content-do-1.png)
*Do*

![Do example](/assets/progress-bar/content-do-2.png)
*Do*

### Accessibility

### Considerations

#### Development

* Renders a native `<progress>`, exposing value/max to assistive tech.
* Provide an associated label; for indeterminate states, omit `value`.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | enum | `theme`, `green`, `orange`, `purple`, `teal`, `yellow`, `red`, `blue` | no | theme |  |
| `size` | enum | `small`, `medium`, `large` | no | medium |  |
| `label` | ReactNode |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  | @deprecated Use `ref` instead |
| `value` | number |  | no |  | The current value (controlled). @default 0 |
| `minValue` | number |  | no |  | The smallest value allowed for the input. @default 0 |
| `maxValue` | number |  | no |  | The largest value allowed for the input. @default 100 |
| `formatOptions` | NumberFormatOptions |  | no |  | The display format of the value label. @default { style: 'percent' } |
| `valueLabel` | ReactNode |  | no |  | The content to display as the value's label (e.g. 1 of 4). |

## Examples

_5 of 5 compile against the published `@talkdesk/cobalt-react-progress-bar@3.0.2` (React 18, TypeScript strict)._

### Basic

```tsx
import ProgressBar from "@talkdesk/cobalt-react-progress-bar";

<ProgressBar aria-label="Loading" value={30} maxValue={100} />;
```

### Sizes

```tsx
import ProgressBar from "@talkdesk/cobalt-react-progress-bar";

<ProgressBar aria-label="Loading" value={30} size="small" />;
<ProgressBar aria-label="Loading" value={30} size="medium" />;
<ProgressBar aria-label="Loading" value={30} size="large" />;
```

### Colors

```tsx
import ProgressBar from "@talkdesk/cobalt-react-progress-bar";

<ProgressBar aria-label="Loading" value={30} color="theme" />;
<ProgressBar aria-label="Loading" value={30} color="green" />;
<ProgressBar aria-label="Loading" value={30} color="yellow" />;
<ProgressBar aria-label="Loading" value={30} color="purple" />;
<ProgressBar aria-label="Loading" value={30} color="orange" />;
<ProgressBar aria-label="Loading" value={30} color="teal" />;
```

### Labels

```tsx
import ProgressBar from "@talkdesk/cobalt-react-progress-bar";

<ProgressBar label="Uploading" value={30} />;
```

### RTL

```tsx
import ProgressBar from "@talkdesk/cobalt-react-progress-bar";
import { I18nProvider } from "react-aria-components";

<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <ProgressBar label="جارٍ التحميل" value={30} />
  </div>
</I18nProvider>;
```

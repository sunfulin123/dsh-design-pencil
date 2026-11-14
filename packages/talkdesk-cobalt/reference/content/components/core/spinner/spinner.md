# Spinner

> **Cobalt core** component · `@talkdesk/cobalt-react-spinner`

## Install (v3.1.2)

```sh
npm install @talkdesk/cobalt-react-spinner
```

```tsx
import Spinner from "@talkdesk/cobalt-react-spinner";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-spinner-docs--docs)

## Guidance

A Spinner is an animated element that indicates loading is in process and where it will appear when loading data is slow.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Spinners loadings indicate that a system process is going on that will end with the content being displayed to the user. They animate as soon as user action is initiated and disappear once the content appears.

### Anatomy

![Spinner anatomy: track, fill, label](/assets/spinner/anatomy.png)

1. **Track**: The path of the loader.
2. **Fill**: The visual representation of what is being loaded.
3. **Label**: Text that informs the user what to expect when loading the content.

### Variants

#### Sizes

Note: Engineering has the variation Xsmall named Tiny (in review to change)

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Styles

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Modifiers

![Spinner with label stacked vertically](/assets/spinner/modifier-with-label-vertical.png)
*With Label*

![Large spinner size](/assets/spinner/size-large.png)
*Isolated*

#### Orientation

![Spinner with label stacked vertically](/assets/spinner/modifier-with-label-vertical.png)
*Vertical*

![Spinner with label arranged horizontally](/assets/spinner/modifier-with-label-horizontal.png)
*Horizontal*

#### Theming

A spinner will respect the current theme. You can use the variations MonoDark or MonoLight depending on the color background. This is useful when you are displaying a spinner on a background that is not in the same mode as the body.

### Guidelines

The **Spinner loader** should be used when a single component is processing. For example, when the user clicks on a button, an inline loading component indicates the system is processing the request.

#### When to use

* Used to notify users that their requested action is being processed.
* For a tiny, inline action or feedback, e.g. clicking a button and the action will take some time.
* Only show a spinner if the expected wait time is more than a second.
* Should only be used for content that can’t be represented with skeleton loading components, like for data charts and inline loading.
* If only a portion of a page is displaying new content or being updated, place the spinner in that part of the page.
* When data takes less than 10s to load on an average connection.

##### Inside a button / small component

![Spinner example — When to use Inside a button / small component](/assets/spinner/when-to-use-inside-a-button.gif)

Example of an inline loading inside a single component

##### Inside a portion of a page

When a portion of a page is displaying new content or being updated, place the spinner in that part of the page.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/207230-spinner) — Design tab, image 12.*

An error ocurrer for a transfer and the user needs to try again.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/207230-spinner) — Design tab, image 13.*

The Spinner loading is applied and positioned inside the content that is being processed.

#### When not to use

* Not be used to give feedback for an entire page load.
* Avoid showing multiple loading spinners on a single page.
* For a long-running process or background process, e.g. importing data or exporting reports, use a [ProgressBar](/components/core/progress-bar/) instead.

#### Group

There should only be one component being loaded at one time. If you need to load multiple components consider using a progressive loading with a [Skeleton](https://designsystem.talkdesk.com/51aaf6147/p/243842-skeleton) content structure.

For example, in a list, you might show one loading spinner for the entire group of items instead of showing one for each item in the list.

![Spinner example — Guidelines Group](/assets/spinner/guidelines-group.png)

  ![Spinner example — Guidelines Group](/assets/spinner/guidelines-group-2.png)

#### Placement

It should be placed centered inline in the middle of the component.

![Spinner centered inline in the middle of a component](/assets/spinner/placement.png)

#### Comparison between components

##### Spinner vs 3Dots

3Dots is the loader Workspace shows while a whole app loads; apps can't use it (see
[App loading](/workspace/app-loading/)). When a whole page inside your app is loading, use a
[Skeleton](/components/core/skeleton/).

##### Spinner vs ProgressBar

Use a [ProgressBar](/components/core/progress-bar/) for more detailed journeys when you need to determine the percentage of a completed task.

##### Spinner vs skeleton

If you want a more specific loading experience focused on the page structure you should use a [Skeleton](https://designsystem.talkdesk.com/51aaf6147/p/243842-skeleton) to better represent loading content. The simplest view of the page loads first, followed by progressively more detailed batches until the entire viewport has loaded.

### Behavior

#### Over content

When using a Spinner directly over content, apply an `opacity token` to de-emphasize the content and allow the spinner to be seen.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
Light token (0.16) was applied to the content

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/207230-spinner) — Design tab, image 17.*

#### Line length

For the content of the Spinner label, the line of text shouldn’t be longer than 80 characters. This helps users with certain reading or visual disabilities that have trouble keeping their place when reading long lines of text. If the width of the text container is resized, it should be allowed to scale in a way so 80 characters or less are shown.

Note: This is based on a [W3C guideline](https://www.w3.org/WAI/tutorials/page-structure/styling/).

#### Internationalization

For RTL (right-to-left) languages, the fill of the Spinner loading continues to spin clockwise.

![Spinner with an RTL Arabic loading label](/assets/spinner/internalization-rtl.png)

### Resources

Find this component under: `Cobalt Design System > Core Components > Spinner`

* [Spinner Loader](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=160%3A3661) — Core Components library
* [Spinner Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=263%3A167383) — Specs

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

* Expose the busy state to assistive tech (`role="status"` with `aria-live="polite"`).
* Provide a text alternative like "Loading".

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | enum | `theme`, `mono-dark`, `mono-light`, `current` | no | theme |  |
| `size` | enum | `micro`, `tiny`, `small`, `medium`, `large`, `xlarge` | no | tiny |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  | @deprecated Use `ref` instead |

## Examples

_3 of 3 compile against the published `@talkdesk/cobalt-react-spinner@3.1.2` (React 18, TypeScript strict)._

### Basic

```tsx
import Spinner from "@talkdesk/cobalt-react-spinner"

// A standalone Spinner must be given a meaningful accessible name.
<Spinner aria-label="Loading" />;
```

### Colors

```tsx
import Spinner from "@talkdesk/cobalt-react-spinner"

<Spinner color="theme" aria-label="Loading" />;
<Spinner color="mono-dark" aria-label="Loading" />;
<Spinner color="mono-light" aria-label="Loading" />;
<Spinner color="current" aria-label="Loading" />;
```

### Sizes

```tsx
import Spinner from "@talkdesk/cobalt-react-spinner"

<Spinner size="micro" aria-label="Loading" />;
<Spinner size="tiny" aria-label="Loading" />;
<Spinner size="small" aria-label="Loading" />;
<Spinner size="medium" aria-label="Loading" />;
<Spinner size="large" aria-label="Loading" />;
<Spinner size="xlarge" aria-label="Loading" />;
```

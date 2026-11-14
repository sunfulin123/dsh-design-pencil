# Link

> **Cobalt core** component · `@talkdesk/cobalt-react-link`

## Install (v3.0.1)

```sh
npm install @talkdesk/cobalt-react-link
```

```tsx
import { Link } from "@talkdesk/cobalt-react-link";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-link-docs--docs)

## Guidance

A link is an interactive component that could be used preceding or following a text to navigate or redirects to external sources

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Anatomy

![Link anatomy: label text and underline](/assets/link/anatomy.png)

1. **Label text**
2. **Underline**

### Variants

#### Sizes

Link size should match the associated text size.

![Medium size link](/assets/link/size-medium.png)
*Size - Medium*

  ![Small size link](/assets/link/size-small.png)
*Size - Small*

#### Types

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

![Default state](/assets/link/state-default.png)
*State - Default*

  ![Hover state](/assets/link/state-hover.png)
*State - Hover*

  ![Disabled state](/assets/link/state-disabled.png)
*State - Disabled*

![Focused state](/assets/link/state-focused.png)
*State - Focused*

  ![Visited state](/assets/link/state-visited.png)
*State - Visited*

  ![Pressed state](/assets/link/state-pressed.png)
*State - Pressed*

### Guidelines

#### Group

![A link used inline within a sentence of body text](/assets/link/group-link-with-text.png)
*Link with text*

![A message with a title, description and a link](/assets/link/group-link-on-message.png)
*Link on message*
The link can only be used in default messages, with or without block property. The link type must match the message type.

![A message banner with a title, description and a link](/assets/link/group-link-on-message-banner.png)
*Link on message banner*
The link can only be used in default messages, with or without block property. The link type must match the message type.

#### Link vs button vs LabeledIcon

A link should never be used with an icon.

To use an interactive component with an icon and label it should use the button component.

To use a non-interactive component with an icon and label it should use the labeledicon component.

![Link](/assets/link/comparison-link.png)
*Link*

  ![Transparent button with icon](/assets/link/comparison-button.png)
*Transparent button with icon*

| **Component** | **Interactive** | **Icon**                 | **Size**                               | **Font size**                                                                         | **Label weight**             |
| ------------- | --------------- | ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------- |
| Labeledicon   | False           | True                     | Micro XSmall Small Medium Large XLarge | Micro: Small XSmall: Medium Small: Medium Medium: Medium Large: Medium XLarge: Medium | Optional (Regular or Medium) |
| Button        | True            | Optional (True or False) | Medium Small XSmall                    | Medium: Medium Small: Small XSmall: N/A                                               | Medium                       |
| Link          | True            | False                    | Medium Small                           | Medium: Medium Small: Small                                                           | Regular                      |

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Link`

* [Link component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=579%3A32310) — Core component library
* [Link handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=200%3A131810) — Handoff guidelines

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

Links should be as descriptive and specific as possible and make sense in isolation.

* Links should be sincere and predictable, they should always tell the user what will happen or what they'll find when they click on it.
* Start with the most important terms.
* Avoid one-word links. Users with poor motor skills might have trouble selecting them.
* Don't write Click here, Read this or Learn more, as they're not clear, specific, or accessible. Ask about what the link does, where it takes the user or what it shows to them: answer these questions before, then start writing.
* For links that lead to information, the link should be the text about that information (e.g., Visit our support page for more information).
* For links that lead to a page where the user can perform a task, always start with a verb (e.g., Create article).
* Use sentence case.
* Don't include ending punctuation. Exception: when the link is a question, it should include the question mark.
* Don't include articles in the link (e.g., Read our Terms of Service, not Read our Terms of Service).
* If you have to refer to a link, say click the link and not follow the link.
* For links with icons, place the icon to the left side of the link. Exception: for RTL (Right-to-Left) languages, such as Arabic and Hebrew, icons should appear to the right of links.

### Accessibility

### Considerations

#### Development

* Renders a native `<a>` and adds `rel="noreferrer noopener"` for external targets.
* Write link text that's descriptive on its own.
* A "disabled" link still needs an accessible treatment (anchors can't be natively disabled like buttons).

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `variation` | enum | `primary`, `danger`, `error`, `warning`, `success`, `info`, `mono-light`, `mono-dark` | no |  |  |
| `isDisabled` | boolean |  | no |  | Whether the link is disabled. |
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
| `href` | string |  | no |  | A URL to link to. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#href). |
| `hrefLang` | string |  | no |  | Hints at the human language of the linked URL. See[MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#hreflang). |
| `target` | HTMLAttributeAnchorTarget |  | no |  | The target window for the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#target). |
| `rel` | string |  | no |  | The relationship between the linked resource and the current page. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel). |
| `download` | string \| boolean |  | no |  | Causes the browser to download the linked URL. A string may be provided to suggest a file name. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#download). |
| `ping` | string |  | no |  | A space-separated list of URLs to ping when the link is followed. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#ping). |
| `referrerPolicy` | HTMLAttributeReferrerPolicy | ``, `no-referrer`, `no-referrer-when-downgrade`, `origin`, `origin-when-cross-origin`, `same-origin`, `strict-origin`, `strict-origin-when-cross-origin`, `unsafe-url` | no |  | How much of the referrer to send when following the link. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#referrerpolicy). |
| `routerOptions` | never |  | no |  | Options for the configured client side router. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

## Examples

_6 of 7 compile against the published `@talkdesk/cobalt-react-link@3.0.1` (React 18, TypeScript strict)._

### Default

```tsx
import { Link } from "@talkdesk/cobalt-react-link"

<Link href={...}>Link text</Link>
```

### On press

```tsx
import { Link } from "@talkdesk/cobalt-react-link"

<Link href={...} onPress={...}>Link text</Link>
```

### Without href

```tsx
import { Link } from "@talkdesk/cobalt-react-link"

<Link onPress={...}>Link text</Link>
```

### Disabled

```tsx
import { Link } from "@talkdesk/cobalt-react-link"

<Link href={...} isDisabled>Link text</Link>
```

### Target

```tsx
import { Link } from "@talkdesk/cobalt-react-link"

<Link href={...} target="_blank">Link text</Link>
```

### Render

> **Doesn't compile:** the published types reject it: Property 'href' does not exist on type 'DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> | DetailedHTMLProps<LinkWithRequiredHref, HTMLAnchorElement>'. Did you mean 'ref'?   Propert. Fix it before use.

```tsx
import { Link } from "@talkdesk/cobalt-react-link"
import { Link as RouterLink } from "react-router";

<Link href="/about" render={(props) => <RouterLink {...props} to={props.href} />}>
  About
</Link>
```

### Variations

```tsx
import { Link } from "@talkdesk/cobalt-react-link"

<Link href="#" variation="primary">Lorem ipsum</Link>
<Link href="#" variation="info">Lorem ipsum</Link>
<Link href="#" variation="success">Lorem ipsum</Link>
<Link href="#" variation="warning">Lorem ipsum</Link>
<Link href="#" variation="error">Lorem ipsum</Link>
<Link href="#" variation="danger">Lorem ipsum</Link>
<Link href="#" variation="mono-light">Lorem ipsum</Link>
<Link href="#" variation="mono-dark">Lorem ipsum</Link>
```

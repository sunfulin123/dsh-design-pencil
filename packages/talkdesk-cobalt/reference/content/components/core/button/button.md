# Button

> **Cobalt core** component · `@talkdesk/cobalt-react-button`
>
> Extended in Cobalt Marketplace by [StatefulButton](../../../components/marketplace/stateful-button/stateful-button.md) (`@talkdesk/cobalt-marketplace-react-stateful-button`), built on this package.

## Install (v3.3.1)

```sh
npm install @talkdesk/cobalt-react-button
```

```tsx
import Button, { LinkButton, SplitButton, ToggleButton } from "@talkdesk/cobalt-react-button";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-button-docs--docs)

## Known gaps

Read before using it:

* Everything between the tags goes into one label span, which doesn't wrap and cuts off with an ellipsis, so a gap or flex layout set on the Button doesn't reach its children: a label and a timer run together ("Offline00:09"). Put icons in prefix and suffix, or lay the children out in your own element inside the Button.

## Guidance

Buttons are used primarily for actions. Examples include Add, Save, Delete, and Sign up. Each page should have one primary button, and a Return or Enter keyboard event should trigger it. Any remaining calls-to-action should be represented as secondary buttons.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Anatomy

![Icon before label](/assets/button/icon-label.png)
*icon+label*

A button has a container, a label, and an optional icon placed before or after the label as a
child element rather than through a dedicated prop.

### Variants

The most common are rectangular buttons with rounded corners, that are easily identifiable and look
good next to the input field. Choosing the right style for the button will depend on the purpose,
platform, and guidelines. Each variant below is rendered live from the published package.

#### Sizes

* Three sizes available: Tiny, Small and Medium.
* Pressing a button should be a simple task and if a user is unable to successfully tap on a button
  or in the process tap on a neighbouring element by mistake, it will lead to a negative experience
  and loss of time.
* For most platforms, consider making touch targets at least 98px x 42px. A touch target of this
  size results in physical size of about 11mm, regardless of screen size. The recommended target
  size for touchscreen elements is at least 7–10mm.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Types

Button ships 9 types: Primary, Secondary, Info, Danger, Warning, Success, Feature, MonoDark, and
MonoLight. Independently of type, each can also be shown outlined or transparent (see Styles
below).

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

MonoDark is for light surfaces and MonoLight for dark ones, in each style:

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Styles

Styles are primarily used to differentiate more important actions from less important ones. Create a
hierarchy of actions that will guide the user where there are multitudes of choices. Usually, you can
have a single prominent button (that style is often called "primary"), and several medium
"secondary" and low emphasis "tertiary" actions.

Filled is the default style, shown under Types above. Outlined and transparent:

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

Creating correct interactions and styles for your buttons is one of the most important parts of the
process. Each state must have clear affordances that distinguish it from other states and the
surrounding layout but should not drastically alter a component or create a lot of visual noise.

* **Default:** communicates that the component is interactive and enabled.
* **Hover:** the user has placed a cursor above it.
* **Focused:** it's ready to be interacted with, for example after tabbing to it.
* **Active:** the user is pressing it.
* **Feedback (pending):** the action isn't immediate, and the button shows that it's in progress.
* **Disabled:** it's currently non-interactive but can be enabled later.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

### Guidelines

#### When to use

* For the main action on a view, such as Save, Send, or Submit: one primary button per view, and
  secondary buttons for the supporting actions.
* For multiple related actions, group them together. See Button group below.

#### When not to use

Do not use buttons as navigational elements. Instead, use links when the desired action is to take
the user to a new page.

#### Buttons vs links

Buttons communicate actions that users can take. They are typically placed throughout your UI, in
places like Dialogs, Forms, Toolbars, etc. The distinction between buttons and links matters:

* Links are used when you're navigating to another place, such as: "view all" page, "Roger Wright" profile, etc.
* Buttons are used when you are performing an action, such as: "send," "merge," "create," "upload," etc.

![A link next to buttons](/assets/button/buttons-vs-links.png)

#### Icon-only buttons

Contained buttons can place icons next to text labels to both clarify action and call attention to a
button.

![Icon-only button](/assets/button/icon-only.png)
*icon*

![Icon after label](/assets/button/label-icon.png)
*label+icon*

Check icons documentation.

### Behavior

#### Max width and truncation

Buttons have a max width of 300px, independent of the button size.

We don't recommend using a truncated label using ellipsis (...) inside buttons because it's
important to have a clear and visible message for the action. If you have large content and/or can't
control the character limitation, you need to limit the width of the button and orient the user to
keep the copy simple.

#### Button group

When using groups of buttons together, they need to have a distance between them. This distance
depends on the type and size of the buttons. There are also some components that require you to use a
predefined button size (e.g. Page Headers use regular buttons; Toolbars and Section Headers use
small-sized buttons).

**Regular size buttons.** For regular buttons, the distance between them should be 12px. This should
be applied in headers, footers, or any other place where two or more buttons are placed side by side.
It should also include any dividers in between.

![Regular buttons spaced 12px apart](/assets/button/group-regular-12px.png)

**Small buttons.** For small buttons, the spacing is usually 4px between them. Small buttons are
normally used in toolbars or table cells as icons.

![Small buttons spaced 4px apart in a toolbar](/assets/button/group-small-4px.png)

There is however one exception. In the event that you would need to add more than one button (not
transparent) to a Section Header or a Card Header, the spacing should be the same as for regular size
buttons (12px). Transparent buttons should keep the same 4px spacing.

![Section header with 12px and 4px button spacing](/assets/button/group-header-exception.png)

### Split button

Split buttons are used to pair one primary action with one or more closely related secondary actions. They look like two buttons merged together, separated by a divider in the middle: the first segment triggers the main action, and the second segment opens a dropdown with the related actions. In code it is the `SplitButton` export of the Button package.

Use a split button when you have two or more related actions but one of them is clearly more relevant and used more often than the others. The most common action lives on the first segment so it can be triggered in a single tap, while the less frequent variations are tucked into the dropdown. Do not use a split button when the actions are unrelated, or when they are equally important — in those cases use separate buttons or a regular dropdown instead.

#### Variants

A split button is always made of two parts: a first action and a last action that opens a dropdown arrow. Both segments are visually joined with a divider in the middle and read as a single, related unit. The first and last action always share the same button type, so the two segments never mix types or styles within the same split button.

##### Sizes

Split buttons support the same sizes as buttons: Tiny, Small and Medium.

Because a split button is made of two tappable segments, both segments must remain comfortable to press. As with regular buttons, consider making touch targets at least 98px x 42px for most platforms. A touch target of this size results in a physical size of about 11mm, regardless of screen size. The recommended target size for touchscreen elements is at least 7–10mm. The dropdown segment should never become so narrow that it is hard to tap accurately.

##### Types

Split buttons reuse the same button types available in the system. Because the first and last action always share the same type, selecting a type applies it to the whole split button rather than to a single segment. Each type is available in the same outlined and text-only versions, including the MonoDark and MonoLight variants.

##### Styles

This button is only available in the filled style.

##### Icons

Just like contained buttons, the first action of a split button can place an icon next to its text label to clarify the action and call attention to it.

* icon
* icon+label

The last segment always shows the dropdown arrow, which signals that additional related actions are available.

**Icons** Check icons documentation.

#### Guidelines

##### Group

When placing split buttons alongside other buttons or split buttons, treat the whole split button as a single unit and keep the same spacing rules used for buttons. The distance depends on the type and size of the buttons, and some components require a predefined size (e.g. Page Headers use regular buttons; Toolbars and Section Headers use small-sized buttons).

**Regular size buttons** For regular sizes, the distance between a split button and the next button should be 12px. This applies in headers, footers, or any other place where two or more buttons are placed side by side, including any dividers in between. The divider inside the split button is not affected by this spacing — it belongs to the component.

**Small buttons** For small sizes, the spacing is usually 4px between elements. Small split buttons are normally used in toolbars or table cells.

As with buttons, there is one exception: if you need to add more than one non-transparent button or split button to a Section Header or a Card Header, the spacing should match the regular size (12px). Transparent variants keep the 4px spacing.

##### Placement

Choosing a split button over a related component depends on how the actions relate to one another:

* **Split button** — Use when there is one clearly dominant action plus a small set of closely related variations of it (e.g. Save vs Save and publish). The dominant action is one tap away; the variations are in the dropdown.
* **Button** — Use when there is a single action and no closely related variations. If you would only ever have one item in the dropdown, use a plain button.
* **Dropdown / Menu button** — Use when all the actions are roughly equal in importance and there is no obvious primary action to surface on its own. A split button is the wrong choice when no single action stands out.

##### Use cases

This component should be used when the actions that the user will have are related. The most used and relevant action should be visible in the first part of the split button and might or might not be on the more options menu of the second part. Depending on the context.

##### Best practices

Don't use this button for additional non related features. For that porpouse use a button group with more options icon.

Don't use this button in outline or transparent styles.

#### Behavior

##### Responsiveness

The split button always remains the same, respecting the responsiveness needed by the page. It might hide the label and be just an icon and a dropdown depending on the needs.

The responsiveness for the split button generally follows the responsiveness of normal buttons.

##### Interaction

###### Focus

The two segments of a split button can be focused independently. The first action and the dropdown segment each receive focus on their own, so users navigating by keyboard can reach the main action and the dropdown separately, with clear focus affordances on whichever segment is active.

##### States

Each segment of a split button must have clear affordances that distinguish its state from the surrounding layout, without creating visual noise. States apply per segment, so the first action and the dropdown segment can be in different states at the same time (for example, one focused while the other is at rest).

* **Default** — Communicates that the segment is interactive and enabled.
* **Hover** — When a user has placed a cursor above the segment.
* **Focused** — Communicates that the segment is currently on and ready to be interacted with. Each segment can be focused independently.
* **Active** — Communicates that the user has tapped on the segment.
* **Feedback** — Used when an action is not performed immediately, communicating that the segment is in the progress of completing the action.
* **Disabled** — Communicates that the segment is currently noninteractive but can be enabled in the future.

##### Text truncated

As with buttons, we don't recommend truncating the first action's label with an ellipsis (...), because the action needs to stay clear and visible. If you have large content and/or can't control the character limitation, limit the width of the split button and keep the copy simple instead of relying on truncation.

##### Theming

Follow the same approach as Button.

##### Dark mode

Follow the same approach as Button.

##### Internationalization

Follow the same approach as Button.

##### Dimensions

Split buttons follow the same max width of 300px as buttons, independent of size. This width covers the whole component, including the first action, the divider, and the dropdown segment.

### Related components

* **Link:** use Link instead of Button when the action navigates to another page or view.
* **[Split button](#split-button):** for a primary action paired with a small set of related, lower-frequency
  alternatives shown in a dropdown.

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Button`

* [Button](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Cobalt-Core-Components?node-id=0%3A1) — Cobalt Core Component

* [Button](https://talkdesk.atlassian.net/wiki/spaces/COB/pages/1777436583/Button) — Cobalt documentation

* [V1 Storybook](https://talkdesk.github.io/cobalt-react-components/?path=/story/button--sizes) — Cobalt

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

### Writing guidelines

* Button labels should be concise and clear enough to indicate the next action to the user. Avoid unnecessary words and articles such as *the*, *an*, or *a*.
* Use active verbs or phrases that clearly indicate an action (e.g., *Save*, *Send*, *Cancel*). Avoid *No*/*Yes* or *OK*.
* The primary button is on the right side and the secondary button is on the left.
* Use sentence case.
* Don't use punctuation, special characters or symbols.
* Make interactive elements consistent in identification and functionality. Don't label a search button *Send* on one page and *Enter* on another.
* Buttons with icons should be used to add clarity and to stand out in the UI. When adding icons to a button, make sure they are relevant and match the intended action.
* Make sure that buttons that are icon-only have appropriate labels on hover or tooltips.

**Prefer single verb+noun over verb+adjective or adjective+noun**

**Do:** Use “Create flow”.
![Do example](/assets/button/do.png)

**Don't:** Avoid “Create new flow” or “New flow”.
![Don't example](/assets/button/dont.png)

**Do:** Use action verbs.
![Do example](/assets/button/content-do-action-verbs.png)

**Don't:** Avoid "Yes" and "No".
![Don't example](/assets/button/content-dont-yes-no.png)

### When to use

* **Accept:** when the user needs to confirm they've read critical or legally binding information, or when it's legally required to have the user's consent.
* **Add:** when the user is adding something new to a list or group (e.g., contact, team, set, disposition, integration, agent).
* **Apply:** when the user applies a filter or a date for a call.
* **Call:** when the user needs to make a call.
* **Change:** when the user needs to change the password.
* **Clear:** when the user needs to clear filters from a list or search.
* **Create:** when the user wants to create something from scratch (e.g., dashboard, flow, function, role).
* **Delete:** when the user wants to delete something and that action is irreversible.
* **Dismiss:** when the user wants to dismiss non-critical messages that might appear in the UI.
* **Download:** when the user needs to download files, images, reports, etc. from the app/product.
* **Edit:** when the user needs to change or correct information that they've added before.
* **Explore:** when the user wants to explore or know more about something (e.g., AppConnect, pricing).
* **Filter:** when the user wants to add specific criteria to filter information or a search.
* **Got it:** when the user needs to confirm they've read the information that isn't critical or legally binding.
* **Hide:** when the user needs to hide something (e.g., the keypad, rows, or columns in a table).
* **Log in:** please use Sign in instead.
* **Next:** when the user wants to move forward to the next page or item.
* **Previous:** when the user wants to go back to the previous page or item.
* **Remove:** when the user wants to remove something from a list, when the action is easily reversible or not critical.
* **Request:** when the user needs to request something (e.g., a demo, support, training).
* **Resolve:** when the user needs to resolve something (e.g., voicemails).
* **Save:** when the user is saving something they've created or edited, and changes will be effective immediately.
* **Search:** when the user wants to search for something (e.g., phone numbers, contacts, ring groups).
* **Send:** when the user needs to send/submit something.
* **Sign in:** when the user needs to sign in to Talkdesk or to one of our products.
* **Submit:** Please use Send instead.
* **Skip:** when the user wants to skip an optional step or task (e.g., walkthrough).
* **Upload:** when the user needs to upload files, images, reports, etc., to the app/product.
* **Confirm:** when the user wants to confirm information like an address or a phone number.
* **View:** when the user needs to view full documents, articles, or news.

### Links

* Links should be as descriptive and specific as possible and make sense in isolation.
* Links should be sincere and predictable, they should always tell the user what will happen or what they’ll find when they click on it.
* Start with the most important terms.
* Avoid one-word links. Users with poor motor skills might have trouble selecting them.
* Don't write *Click here*, *Read this* or *Learn more*, as they're not clear, specific, or accessible. Ask about what the link does, where it takes the user or what it shows to them: answer these questions before, then start writing.
* For links that lead to information, the link should be the text about that information (e.g., *Visit our* *support page* *for more information*).
* For links that lead to a page where the user can perform a task, always start with a verb (e.g., *Create article*).
* Use sentence case.
* Don't include ending punctuation. **Exception:** when the link is a question, it should include the question mark.
* Don't include articles in the link (e.g., *Read our* *Terms of Service*\*,\* not *Read* *our Terms of Service*).
* If you have to refer to a link, say *click the link* and not *follow the link*.
* For links with icons, place the icon to the left side of the link. **Exception:** for RTL (Right-to-Left) languages, such as Arabic and Hebrew, icons should appear to the right of links.

### Accessibility

### Interactions

#### Mouse

Activating a button with a mouse click triggers its action the same way as pressing Enter or Space.
No additional guidance beyond a native `<button>` element's default behavior applies here.

#### Keyboard

* Users should be able to navigate to any action button by using normal keyboard navigation (tab key).
* Buttons should display a visible focus state when users tab to them.

If using the keyboard, the expected behavior:

| Key   | Action                    |
| ----- | ------------------------- |
| Tab   | Moves focus to the button |
| Enter | Activates the button      |
| Space | Activates the button      |

### Considerations

#### Design

* 1.3.1 Info and Relationships (A)
* 1.1.1 Non-text Content (A)

See the Design tab's States section for the button's visible focus-ring treatment.

#### Development

Depending on the button type we can have two ARIA roles that should be used. These should be applied
to the title of the button.

For regular, secondary, success and danger buttons, which usually have advisory information for the
user that is not important enough to justify an alert, we should use the `status` role
(documentation).

However, for danger messages which are often used to communicate an important and usually
time-sensitive message to the user, we should use the `alert` role (documentation).

* **Use standard markup.** Avoid using `<div>` or `<img>` tags to create buttons. Screen readers don’t automatically know either is a usable button.
* The `button` has an accessible label. By default, the accessible name is computed from any text content inside the button element. However, it can also be provided with [aria-labelledby](https://www.w3.org/TR/wai-aria-1.1/#aria-labelledby) or [aria-label](https://www.w3.org/TR/wai-aria-1.1/#aria-label).
* If a description of the button's function is present, the button element has [aria-describedby](https://www.w3.org/TR/wai-aria-1.1/#aria-describedby) set to the ID of the element containing the description.
* **Screen readers handle buttons and links differently.** When styling links to look like buttons, remember that screen readers handle links slightly differently than they do buttons. Pressing the Space key triggers a button, but pressing the Enter key triggers a link.

Icons may be used as visual labels (without visual text) if the meaning of the icon is visually
self-evident and if there is a programmatically associated semantic label available to assistive
technologies, normally this can be accomplished by using an `aria-label`.

![Code sample: a button labelled only by a filter icon, with aria-label Filters](/assets/button/code-icons-as-labels.png)

```html
<button aria-label="Filters">
  <span class="fa fa-filter"></span>
</button>
```

### How to test the component

* Tab to the button using only the keyboard and confirm it receives a visible focus ring.
* Activate it with both Enter and Space and confirm the same action fires either way.
* With a screen reader running, confirm the button announces a clear, accurate accessible name.

## Props

### Button

_Also accepts the standard `Omit<
  ButtonHTMLAttributes<ButtonType>,
  "disabled" | "onClick" | "prefix" | keyof ButtonProps
>` attributes._

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `htmlType` | "button" \| "submit" \| "reset" | `button`, `submit`, `reset` | no |  |  |
| `shape` | Shape | `full-width`, `compact`, `inline` | no |  |  |
| `size` | Size | `tiny`, `small`, `medium` | no |  |  |
| `type` | Type | `primary`, `secondary`, `info`, `danger`, `warning`, `success`, `feature`, `mono-dark`, `mono-light` | no |  |  |
| `variation` | Variation | `outline`, `transparent` | no |  |  |
| `contrast` | boolean |  | no |  |  |
| `prefix` | ReactNode |  | no |  |  |
| `suffix` | ReactNode |  | no |  |  |
| `value` | string |  | no |  | The value associated with the button's name when it's submitted with the form data. |
| `isDisabled` | boolean |  | no |  | Whether the button is disabled. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `render` | DOMRenderFunction<"button", ButtonRenderProps> |  | no |  | Overrides the default DOM element with a custom render function. This allows rendering existing components with built-in styles and behaviors such as router links, animation libraries, and pre-styled components.  Requirements:  - You must render the expected element type (e.g. if `<button>` is expected, you cannot render an   `<a>`). - Only a single root DOM element can be rendered (no fragments). - You must pass through props and ref to the underlying DOM element, merging with your own prop   as appropriate. |
| `slot` | string |  | no |  | A slot name for the component. Slots allow the component to receive props from a parent component. An explicit `null` value indicates that the local props completely override all props received from a parent. |
| `disabled` | boolean |  | no |  | @deprecated Use `isDisabled` instead |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | @deprecated Use `onPress` instead |
| `forwardedRef` | Ref<HTMLButtonElement> |  | no |  | @deprecated Use `ref` instead |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `preventFocusOnPress` | boolean |  | no |  | Whether to prevent focus from moving to the button when pressing it.  Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control. |
| `form` | string |  | no |  | The `<form>` element to associate the button with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button#form). |
| `formAction` | string |  | no |  | The URL that processes the information submitted by the button. Overrides the action attribute of the button's form owner. |
| `formEncType` | string |  | no |  | Indicates how to encode the form data that is submitted. |
| `formMethod` | string |  | no |  | Indicates the HTTP method used to submit the form. |
| `formNoValidate` | boolean |  | no |  | Indicates that the form is not to be validated when it is submitted. |
| `formTarget` | string |  | no |  | Overrides the target attribute of the button's form owner. |
| `name` | string |  | no |  | Submitted as a pair with the button's value as part of the form data. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `isPending` | boolean |  | no |  | Whether the button is in a pending state. This disables press and hover events while retaining focusability, and announces the pending state to screen readers. |
| `onHoverStart` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction starts. |
| `onHoverEnd` | (e: HoverEvent) => void |  | no |  | Handler that is called when a hover interaction ends. |
| `onHoverChange` | (isHovering: boolean) => void |  | no |  | Handler that is called when the hover state changes. |

### LinkButton

_Also accepts the standard `Omit<
  AnchorHTMLAttributes<LinkButtonType>,
  "disabled" | "onClick" | "prefix" | keyof LinkProps
>` attributes._

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `shape` | Shape | `full-width`, `compact`, `inline` | no |  |  |
| `size` | Size | `tiny`, `small`, `medium` | no |  |  |
| `type` | Type | `primary`, `secondary`, `info`, `danger`, `warning`, `success`, `feature`, `mono-dark`, `mono-light` | no |  |  |
| `prefix` | ReactNode |  | no |  |  |
| `suffix` | ReactNode |  | no |  |  |
| `disabled` | boolean |  | no |  | @deprecated Use `isDisabled` instead |
| `onClick` | (e: MouseEvent<FocusableElement, MouseEvent>) => void |  | no |  | @deprecated Use `onPress` instead |
| `forwardedRef` | Ref<HTMLAnchorElement> |  | no |  | @deprecated Use `ref` instead |
| `isDisabled` | boolean |  | no |  | Whether the link is disabled. |
| `onPress` | (e: PressEvent) => void |  | no |  | Handler that is called when the press is released over the target. |
| `onPressStart` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction starts. |
| `onPressEnd` | (e: PressEvent) => void |  | no |  | Handler that is called when a press interaction ends, either over the target or when the pointer leaves the target. |
| `onPressChange` | (isPressed: boolean) => void |  | no |  | Handler that is called when the press state changes. |
| `onPressUp` | (e: PressEvent) => void |  | no |  | Handler that is called when a press is released over the target, regardless of whether it started on the target or not. |
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

### ToggleButton

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `shape` | ValueOrFunction<Shape> |  | no |  |  |
| `size` | ValueOrFunction<Size> |  | no |  |  |
| `type` | ValueOrFunction<Type> |  | no |  |  |
| `variation` | ValueOrFunction<Variation> |  | no |  |  |
| `contrast` | ValueOrFunction<boolean> |  | no |  |  |
| `prefix` | ValueOrFunction<ReactNode> |  | no |  |  |
| `suffix` | ValueOrFunction<ReactNode> |  | no |  |  |
| `preventFocusOnPress` | boolean |  | no |  | Whether to prevent focus from moving to the button when pressing it.  Caution, this can make the button inaccessible and should only be used when alternative keyboard interaction is provided, such as ComboBox's MenuTrigger or a NumberField's increment/decrement control. |
| `excludeFromTabOrder` | boolean |  | no |  | Whether to exclude the element from the sequential tab order. If true, the element will not be focusable via the keyboard by tabbing. This should be avoided except in rare scenarios where an alternative means of accessing the element or its functionality via the keyboard is available. |
| `isSelected` | boolean |  | no |  | Whether the element should be selected (controlled). |
| `defaultSelected` | boolean |  | no |  | Whether the element should be selected (uncontrolled). |
| `onChange` | (isSelected: boolean) => void |  | no |  | Handler that is called when the element's selection state changes. |
| `isDisabled` | boolean |  | no |  | Whether the button is disabled. |
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

_15 of 16 compile against the published `@talkdesk/cobalt-react-button@3.3.1` (React 18, TypeScript strict)._

### Default

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button>Default</Button>
```

### Filled

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button type="primary">Primary</Button>
<Button type="secondary">Secondary</Button>
<Button type="info">Info</Button>
<Button type="danger">Danger</Button>
<Button type="warning">Warning</Button>
<Button type="success">Success</Button>
<Button type="feature">Feature</Button>
```

### Outline

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button variation="outline" type="primary">Primary</Button>
<Button variation="outline" type="secondary">Secondary</Button>
<Button variation="outline" type="info">Info</Button>
<Button variation="outline" type="danger">Danger</Button>
<Button variation="outline" type="warning">Warning</Button>
<Button variation="outline" type="success">Success</Button>
<Button variation="outline" type="feature">Feature</Button>
```

### Transparent

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button variation="transparent" type="primary">Primary</Button>
<Button variation="transparent" type="secondary">Secondary</Button>
<Button variation="transparent" type="info">Info</Button>
<Button variation="transparent" type="danger">Danger</Button>
<Button variation="transparent" type="warning">Warning</Button>
<Button variation="transparent" type="success">Success</Button>
<Button variation="transparent" type="feature">Feature</Button>
```

### Monochrome

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button type="mono-dark">Mono Dark</Button>
<Button variation="outline" type="mono-dark">Mono Dark</Button>
<Button variation="transparent" type="mono-dark">Mono Dark</Button>

<Button type="mono-light">Mono Light</Button>
<Button variation="outline" type="mono-light">Mono Light</Button>
<Button variation="transparent" type="mono-light">Mono Light</Button>
```

### Sizes

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button size="tiny">Tiny</Button>
<Button size="small">Small</Button>
<Button size="medium">Medium</Button>
```

### Prefix and suffix

```tsx
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";

<Button prefix={<Icon name="accessibility" />}>Primary</Button>
<Button suffix={<Icon name="accessibility" />}>Primary</Button>
```

### Truncated labels

```tsx
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";

<Button>This is a very long button label that will definitely be truncated</Button>
<Button prefix={<Icon name="accessibility" />}>
  This is a very long button label that will definitely be truncated
</Button>
<Button suffix={<Icon name="accessibility" />}>
  This is a very long button label that will definitely be truncated
</Button>
```

### Pending

```tsx
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";

<Button isPending>Saving…</Button>
<Button shape="compact" isPending aria-label="Refreshing">
  <Icon name="accessibility" />
</Button>
```

### Shapes

```tsx
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";

<Button shape="full-width">Full Width</Button>
<Button shape="compact" aria-label="Accessibility">
  <Icon name="accessibility" />
</Button>
```

### Link

```tsx
import { LinkButton } from "@talkdesk/cobalt-react-button";

<LinkButton href="#">This is a link</LinkButton>
```

### Contrast

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button type="mono-light" contrast>Button</Button>
<Button type="mono-dark" contrast>Button</Button>
<Button type="primary" contrast>Button</Button>
```

### Inline

```tsx
import Button from "@talkdesk/cobalt-react-button";
import { Text } from "@talkdesk/cobalt-react-typography";

<Text>
  There is an
  <Button variation="transparent" shape="inline">
    action
  </Button>
  in the middle of this text
</Text>
<Text size="small">
  There is an
  <Button variation="transparent" size="tiny" shape="inline">
    action
  </Button>
  in the middle of this text
</Text>
```

### Disabled

```tsx
import Button from "@talkdesk/cobalt-react-button";

<Button isDisabled>Primary</Button>
<Button isDisabled variation="outline">Outline</Button>
<Button isDisabled variation="transparent">Transparent</Button>
```

### Split button

```tsx
import Button, { SplitButton } from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";

{/* With label */}
<SplitButton aria-label="Create options">
  <Button type="primary">Button</Button>
  <Button type="primary" shape="compact">
    <Icon name="chevron_down" />
  </Button>
</SplitButton>

{/* Icon only */}
<SplitButton aria-label="Add options">
  <Button type="primary" shape="compact">
    <Icon name="add" />
  </Button>
  <Button type="primary" shape="compact">
    <Icon name="chevron_down" />
  </Button>
</SplitButton>
```

### Render

> **Doesn't compile:** uses `RouterLink` without importing or defining it. Fix it before use.

```tsx
import Button from "@talkdesk/cobalt-react-button";

// Render as a router link (e.g. React Router, Next.js)
<Button render={(props) => <RouterLink to="/home" {...props} />}>
  Home
</Button>
```

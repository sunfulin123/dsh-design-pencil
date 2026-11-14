# Modal

> **Cobalt core** component · `@talkdesk/cobalt-react-modal`
>
> Extended in Cobalt Marketplace by [DismissibleModal](../../../components/marketplace/dismissible-modal/dismissible-modal.md) (`@talkdesk/cobalt-marketplace-react-dismissible-modal`), built on this package.

## Install (v4.0.4)

```sh
npm install @talkdesk/cobalt-react-modal
```

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-modal-docs--docs)

## Known gaps

Read before using it:

* Opens in a layer at the end of <body>, outside ThemeProvider's <div>, so without the theme stylesheet it loses the theme: text falls back to the browser's serif font and the theme variables don't resolve. Import @talkdesk/cobalt-theme-base/dist/styles.css and set the body font from it, as in Get started › Develop.
* data-co-bleed does nothing with the published packages: the rules that pull a bleeding element out to the dialog's edges are in cobalt-theme-base's source, but not in its latest release, 2.5.0. The Bleed example renders inset, like any other content. Until a release includes them, set the negative margins yourself.

## Guidance

Use modals to complete subtasks or provide critical information while maintaining the context of the underlying page

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Modals are used to present critical information or request user input needed to complete a user’s workflow. Modals interrupt a user’s workflow by design.

When active, a user is blocked from the on-page content and cannot return to their previous workflow until the modal task is completed or the user dismisses the modal. While effective when used correctly, modals should be used sparingly to limit the disruption to the user.

##### Require an immediate response from the user

Use a modal to request information that is preventing the system from continuing a user-initiated process.

##### Notify the user of urgent information

Use a modal to notify the user of urgent information concerning their current work. Modals are commonly used to report system errors or convey a consequence of a user’s action.

##### Confirm a user decision

Use a modal to confirm user decisions. Clearly describe the action being confirmed and explain any potential consequences that it may cause. Both the title and the button should reflect the action that will occur. If the action is destructive or irreversible then use an error modal.

### Anatomy

The default form of a modal.

![Modal example — Anatomy](/assets/modal/anatomy-2.png)

1 - **Header**: Includes a title, optional label, and optional description.

2 - **Body**: Contains the information and/or controls needed to complete the modal’s task. It can include message text and components.

3 - **Footer**: Contains the main actions needed to complete or cancel the modal task.

4 - **X**: The close `x` icon will close the modal without submitting any data. Should not be used for Alert and Error Modal variations.

5 - **Overlay**

### Variants

#### Sizes

There are three responsive modal sizes: small, medium, and large.

* Large modals can be used only in large viewports.
* Medium modals can be used only in medium and large viewports.
* Small modals can be used in all viewports.

Modals have,

* fixed width, dependent of their type and size.
* height proportional to the amount of content up to a 75% of the container height.

![Modal example — Guidelines Forms in modals: Large](/assets/modal/sizes-large.png)
*Large*

![Modal example — Guidelines Forms in modals: Medium](/assets/modal/sizes-medium.png)
*Medium*

![Modal example — Guidelines Forms in modals: Small](/assets/modal/sizes-small.png)
*Small*

#### Types

##### Default modal

* Large modal width = 900px
* Medium modal width = 600px
* Small modal width = 405px

![Modal example — Guidelines Forms in modals: Large](/assets/modal/sizes-large.png)
*Large*

  ![Modal example — Guidelines Forms in modals: Medium](/assets/modal/sizes-medium.png)
*Medium*

  ![Modal example — Guidelines Forms in modals: Small](/assets/modal/sizes-small.png)
*Small*

##### Alert modal

Alert modals are used to validate user decisions or to gain secondary confirmation from the user. Should never be dismissible.

* In large viewports use large alert modal width = 405px
* In medium viewports use medium alert modal width = 405px
* In small viewports use small alert modal width = 320px

![Modal example — Types Alert modal: Alert - Medium](/assets/modal/modal-alert-medium.png)
*Alert - Medium*

  ![Modal example — Types Alert modal: Alert - Small](/assets/modal/modal-alert-small.png)
*Alert - Small*

![Modal example — Types Alert modal: Alert - Large](/assets/modal/modal-alert-large.png)
*Alert - Large*

The alert modal width can increase only when a significative sized component needs to be integrated in the empty state, such as; Cards, TextArea, ProgressBar, Stepper, Rating, SelectionGroup, Slider, Message, among others.

* In large viewports use large alert modal width = 600px
* In medium viewports use medium alert modal width = 600px
* In small viewports use small alert modal width = 320px

![Modal example — Types Alert modal: Alert with component - Medium](/assets/modal/modal-alert-with-component-medium.png)
*Alert with component - Medium*

  ![Modal example — Types Alert modal: Alert with component - Small](/assets/modal/modal-alert-with-component-small.png)
*Alert with component - Small*

![Modal example — Types Alert modal: Alert with component - Large](/assets/modal/modal-alert-with-component-large.png)
*Alert with component - Large*

##### Error modal

Error modal is a specific kind of alert modal used for destructive or irreversible actions. In the error modal, the primary button is replaced by an error button. They are commonly used in high-impact moments as a confirmation for an action that would cause significant data loss if done accidentally. Should never be dismissible.

* In large viewports use large error modal width = 405px
* In medium viewports use medium error modal width = 405px
* In small viewports use small error modal width = 320px

![Modal example — Types Error modal: Error - Medium](/assets/modal/modal-error-medium.png)
*Error - Medium*

  ![Modal example — Types Error modal: Error - Small](/assets/modal/modal-error-small.png)
*Error - Small*

![Modal example — Types Error modal: Error - Large](/assets/modal/modal-error-large.png)
*Error - Large*

The error modal width can increase only when a significative sized component needs to be integrated in the empty state, such as; Cards, TextArea, ProgressBar, Stepper, Rating, SelectionGroup, Slider, Message, among others.

* In large viewports use large error modal width = 600px
* In medium viewports use medium error modal width = 600px
* In small viewports use small error modal width = 320px

![Modal example — Types Error modal: Error with component - Medium](/assets/modal/modal-error-with-component-medium.png)
*Error with component - Medium*

  ![Modal example — Types Error modal: Error with component - Small](/assets/modal/modal-error-with-component-small.png)
*Error with component - Small*

![Modal example — Types Error modal: Error with component - Large](/assets/modal/modal-error-with-component-large.png)
*Error with component - Large*

### Guidelines

#### Placement

Modals are always placed vertically and horizontally in the center of the container.

![Modal example — Guidelines Placement](/assets/modal/guidelines-placement.png)

#### Use cases

##### Popup in modals

When opening a popup inside a modal it should exceed the modal limits to its max height.

![Modal example — Use cases Popup in modals](/assets/modal/use-cases-popup-in-modals.png)

#### Forms in modals

Forms components in modals should follow the same rules, for sizes and spacings, as regular forms.

Form inputs in modals should have,

* `width=50%` in large modals
* `width=100%` in medium and small modals

![Modal example — Guidelines Forms in modals: Large](/assets/modal/sizes-large.png)
*Large*

![Modal example — Guidelines Forms in modals: Medium](/assets/modal/sizes-medium.png)
*Medium*

![Modal example — Guidelines Forms in modals: Small](/assets/modal/sizes-small.png)
*Small*

#### Multi-step modals

Multi-step modals are sequential modals used for a user perform a task. Multi-step modals should have a fixed height that should never exceed the modal max height, 75% of the container height.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/70ebe1-modal) — Design tab, image 26.*

#### Best practices

**Don't:** Don’t use dismissible Alert or Error modals.

**Don't:** Don’t position modals in any other place than in the center of the container.

**Don't:** Don’t use the divider in a modal header if its doesn’t user toolbar or nav.

### Behavior

#### Responsiveness

A large modal will scale to a medium modal in medium viewports.

A medium modal will scale to a small modal in small viewports.

Modals follow the general spacing rules for each viewport. So we’ll have an inner padding of **L:24px / M:16px / S:12px**

![Modal header padding annotated for large, medium, and small viewports](/assets/modal/responsiveness-padding.png)

##### Minimum screen resolution

When the MainApp width is lower than the modal fixed width, the modal `width=100%` respecting the viewport padding.

As an example, the minimum screen resolution supported by Workspace is 424x540px. Since the dock has `width=58px` in Workspace's code (54px in the App Shell Figma component), the MainApp `width=366px`, lower than the small modal fixed `width=405px`. So in this case, must be used an small modal with`width=100%`.

![Modal example — Responsiveness Minimum screen resolution](/assets/modal/responsiveness-minimum-screen-resolution.png)

#### Interaction

##### Triggering

Modals are triggered as a result of a user’s action and are not system-generated. Common components that can trigger a modal include, a button, link, or icon. On a keyboard, selecting `Enter` or `Space` should launch the modal.

##### Focus

Once the modal is open, set the initial focus to the first location that accepts user input. For example, if the modal contains a form, the focus should automatically be set to the first field when opened.

The focus should then remain trapped in the dialog until it is closed. When navigating by keyboard, `Tab` and `Shift-Tab` do not move the focus outside of the modal.

#### Overflow

When the modal content is longer than the modal height then the body section should scroll vertically with the footer remaining fixed in place.

#### Dimensions

##### Max height

Modal max height is 75% of the container.

As an example, for a workspace height = 540px, the MainApp container height = 500px so the Modal max-height = 375px

![Modal example — Dimensions Max height](/assets/modal/dimensions-max-height.png)

### Resources

Find these components under: `Cobalt Design System > Cobalt Core Components > Modal`and `Cobalt Design System > Patterns > ModalPattern`

* [Modal](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=280%3A10411) — Core components library

* [ModalPattern](https://www.figma.com/file/RbiNiZDJelIajXxTjDY72N/3---%E2%9A%97%EF%B8%8F-Patterns?node-id=522%3A475794\&t=d398ZZSyqOzQqJZg-1) — Pattern components library

* \[Modal Handoff]\([https://Handoff](https://Handoff) guidelines) — Handoff guidelines

* [How to use](https://www.figma.com/file/5mn3vArnbe5ENQfZFRKJBL/8---How-to-use?node-id=601%3A92963\&t=wl70yJ2nLt6Y6dYJ-1) — Figma file with component usage examples

* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/modal--basic) — Cobalt

* [V2](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/modal--primary-story) — Cobalt

The modal header/footer pattern is available under **Cobalt Design System › Patterns › [ModalPattern](https://www.figma.com/design/RbiNiZDJelIajXxTjDY72N/?node-id=522-475794)**.

Usage examples are available under **[How to use](https://www.figma.com/design/5mn3vArnbe5ENQfZFRKJBL/?node-id=601-92963)**.

### Code

### Installation

> **Interactive demo — Install.** Not reproducible in text; see the documentation site.

### Examples

### Props

### Content

#### Alert and error modals

The purpose of an alert and a error modal should be communicated by its title and primary button. Body text is optional.

Titles should:

* Contain a brief, clear question. If a question is inappropriate, a statement is the alternative.
* Avoid apologies (*Sorry for the interruption*), alarm (*Warning!*), ambiguity or redundancy (*Are you sure?*).

Body text should:

* Give **relevant** information to the user (*You can’t undo this action, Deleting this topic will also delete all of its subtopics*, etc.)
* Avoid asking *Are you sure that… ?* because the dialog itself is already a visual representation of that question. Also, users tend to ignore body text information, so the question must always be placed in the title.

Buttons:

* Should be descriptive/self-explanatory. Avoid *No/Yes* or *OK*.
* Primary button on the right side and secondary button on the left.
* The primary button should use the same action verb used in the title. If there’s space you can use the structure Verb+Noun (e.g., *Delete flow*).
* The secondary button normally uses the word *Cancel* (image 1), but it should be avoided when the main action is similar to Cancel (image 3 ).

**Do:** Title and primary button match.
![Do example](/assets/modal/alert-and-error-modals-do.png)

**Don't:** In this case, the reader is obliged to read the title before clicking OK.
![Don't example](/assets/modal/alert-and-error-modals-dont.png)

**Do:** Clear and concise error modal.
![Do example](/assets/modal/content-do-example.png)

**Don't:** Avoid redudant information in the body text.
![Don't example](/assets/modal/content-dont-example.png)

### Accessibility

### Considerations

#### Design

* [G202: Ensuring keyboard control for all functionality](http://www.w3.org/TR/2016/NOTE-WCAG20-TECHS-20161007/G202)
* [G90: Providing keyboard-triggered event handlers](http://www.w3.org/TR/2016/NOTE-WCAG20-TECHS-20161007/G90)

#### Development

An accessible modal dialog is one where keyboard focus is managed properly, and the correct information is exposed to screen readers.

If the user navigates with the keyboard, and the modal pops up, the user can't interact with the content because the keyboard focus is behind the modal.

HTML and WAI-ARIA can be used to provide the necessary semantic information, CSS the appearance and Javascript the behavior.

##### Labeling

* `aria-labelledby`Use this attribute to label the dialog. Often, the value of the aria-labelledby attribute will be the id of the element used to title the dialog.
* `aria-describedby`Use this attribute to describe the contents of the dialog.

##### Focus management

A dialog has particular requirements for how keyboard focus should be managed:

* **When the dialog appears on the screen, keyboard focus** (whose control depends upon the purpose of the dialog) **should be moved to the default focusable control inside the dialog.**
* **After the dialog is dismissed, the keyboard focus should be moved back to where it was before** it moved into the dialog. Otherwise, the focus can be dropped to the beginning of the page.
* For most dialogs, the expected behavior is that the dialog's tab order *wraps*, so when the user tabs through the focusable elements in the dialog, the first focusable element will be focused after the last one has been reached. In other words, **the tab order should be contained within and by the dialog.**

## Props

### Modal

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `id` | string |  | no |  |  |
| `size` | enum | `small`, `medium`, `large`, `fill` | no | medium |  |
| `dialogRef` | Ref<HTMLElement> |  | no |  |  |
| `isDismissible` | boolean |  | no |  |  |
| `container` | Element |  | no |  | Renders the modal inside this element instead of over the viewport, so its backdrop fills — and is clipped by — that element. The element has to be positioned; a `static` container warns in development. |
| `accessibilityLabels` | { close?: string; } |  | no |  |  |
| `isEntering` | boolean |  | no |  | Whether the modal is currently performing an entry animation. |
| `isExiting` | boolean |  | no |  | Whether the modal is currently performing an exit animation. |
| `onEnter` | (element: HTMLElement) => void \| Promise<void> |  | no |  | Callback when the modal starts entering. Return a promise to indicate when the entry animation has completed. |
| `onExit` | (element: HTMLElement) => void \| Promise<void> |  | no |  | Callback when the modal starts exiting. Return a promise to indicate when the exit animation has completed. |
| `UNSTABLE_deferUntilEntered` | boolean |  | no |  | Whether to wait until the entry animation completes before hiding content outside the modal and moving focus into it. @private |
| `UNSTABLE_overrideFocus` | boolean |  | no |  | Whether to override the `focus()` method so it does not scroll the page. This is temporary and will be removed after fully testing all overlays. @private |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |
| `children` | ReactNode \| ((opts: DialogRenderProps) => ReactNode) |  | no |  |  |

### ModalTrigger

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |

## Examples

_7 of 7 compile against the published `@talkdesk/cobalt-react-modal@4.0.4` (React 18, TypeScript strict)._

### Basic

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";

<ModalTrigger>
  <Button type="secondary">Open modal</Button>
  <Modal
    aria-label="Modal"
    isDismissible
    accessibilityLabels={{ close: "Close modal" }}
  >
    Modal content
  </Modal>
</ModalTrigger>;
```

### Sizes

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";

<ModalTrigger>
  <Button type="secondary">Small</Button>
  <Modal
    size="small"
    aria-label="Small modal"
    isDismissible
    accessibilityLabels={{ close: "Close modal" }}
  >
    Modal content
  </Modal>
</ModalTrigger>;
```

### Controlled

```tsx
import { Modal } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";

const [isOpen, setIsOpen] = useState(false);

<Button type="secondary" onPress={() => setIsOpen(true)}>Open</Button>
<Modal
  aria-label="Controlled modal"
  isOpen={isOpen}
  onOpenChange={setIsOpen}
  isDismissible
  accessibilityLabels={{ close: "Close modal" }}
>
  Modal content
</Modal>;
```

### Non dismissible

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";

<ModalTrigger>
  <Button type="secondary">Open modal</Button>
  <Modal aria-label="Modal">
    {({ close }) => (
      <Flex direction="column" alignX="center" gap={4}>
        <span>Modal content</span>
        <Button type="secondary" onPress={close}>Close</Button>
      </Flex>
    )}
  </Modal>
</ModalTrigger>;
```

### With title

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";

<ModalTrigger>
  <Button type="secondary">Open modal</Button>
  <Modal isDismissible accessibilityLabels={{ close: "Close modal" }}>
    <Flex direction="column" gap={3}>
      <Heading slot="title">Modal title</Heading>
      <Text>Modal content</Text>
    </Flex>
  </Modal>
</ModalTrigger>;
```

### Bleed

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { Heading, Text } from "@talkdesk/cobalt-react-typography";

<ModalTrigger>
  <Button type="secondary">Open modal</Button>
  <Modal isDismissible accessibilityLabels={{ close: "Close modal" }}>
    <Flex direction="column" gap={3} grow alignX="stretch">
      <Heading slot="title">Modal title</Heading>
      <Text>Padded content stays inset.</Text>
      <Flex
        data-co-bleed="inline block-end"
        gap={2}
        alignX="end"
        paddingX={4}
        paddingY={3}
        backgroundColor="var(--secondary-2)"
        style={{ marginTop: "auto" }}
      >
        <Button type="secondary">Cancel</Button>
        <Button type="primary">Save</Button>
      </Flex>
    </Flex>
  </Modal>
</ModalTrigger>;
```

### Fill with content

```tsx
import { Modal, ModalTrigger } from "@talkdesk/cobalt-react-modal";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { ModalPanel, PanelTrigger } from "@talkdesk/cobalt-react-panel";

const [container, setContainer] = useState(null);

<ModalTrigger>
  <Button type="secondary">Open fill modal</Button>
  <Modal
    size="fill"
    aria-label="Fill modal"
    isDismissible
    dialogRef={setContainer}
    accessibilityLabels={{ close: "Close modal" }}
  >
    {/* Positioned wrapper so the side panel is clipped to the dialog's
        rounded corners instead of the viewport. */}
    <Flex direction="column" grow forwardedRef={setContainer} style={{ position: "relative", overflow: "hidden" }}>
      <Flex gap={2} padding={6}>
        <ModalTrigger>
          <Button type="primary">Open modal</Button>
          <Modal size="small" aria-label="Smaller modal" container={container}>
            {({ close }) => <Button type="primary" onPress={close}>Close</Button>}
          </Modal>
        </ModalTrigger>
        <PanelTrigger>
          <Button type="secondary" variation="outline">Open side panel</Button>
          <ModalPanel aria-label="Left side panel" position="start" size="small" container={container} isDismissible>
            <Flex padding={6}>Left side panel</Flex>
          </ModalPanel>
        </PanelTrigger>
      </Flex>
    </Flex>
  </Modal>
</ModalTrigger>;
```

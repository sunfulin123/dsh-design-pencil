# DragAndDrop

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-drag-and-drop`

## Install (v3.2.0)

```sh
npm install @talkdesk/cobalt-marketplace-react-drag-and-drop
```

```tsx
import DragAndDrop from "@talkdesk/cobalt-marketplace-react-drag-and-drop";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-draganddrop-stories--main)

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

DragAndDrop enables the user to upload a file by dragging it to an area of the screen.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Anatomy

![Drag and drop example — Anatomy](/assets/drag-and-drop/anatomy.png)

1. **Illustration**. The illustration should be used but is optional when at least one file was already dragged or in small viewports. Should not be used different illustrations.
2. **Title**. The title is mandatory and should be consistent for all use cases.
3. **Button**. The button is mandatory and enables the user to upload the file without dragging it.
4. **Description**. The description is mandatory and should show the file's max size.

### Variants

#### Sizes

There are three sizes available (Large, Medium, and Small), each to be applied to the respective viewport.

![Drag and drop example — Variants Sizes: Large](/assets/drag-and-drop/sizes-large.png)
*Large*

  ![Drag and drop example — Variants Sizes: Medium](/assets/drag-and-drop/sizes-medium.png)
*Medium*

  ![Drag and drop example — Variants Sizes: Small](/assets/drag-and-drop/sizes-small.png)
*Small*

#### States

![Drag and drop example — Variants States: Default](/assets/drag-and-drop/states-default.png)
*Default*

  ![Drag and drop example — Variants States: Focused](/assets/drag-and-drop/states-focused.png)
*Focused*

  ![Drag and drop example — Variants States: Error](/assets/drag-and-drop/states-error.png)
*Error*

![Drag and drop example — Variants States: Hover-drag](/assets/drag-and-drop/states-hover-drag.png)
*Hover-drag*

#### Modifiers

The illustration should be used but is optional when at least one file was already dragged or in small viewports.

It is highly recommended to have an associated label. When necessary, the label should have the button and/or link to download the template and see guidelines aligned on the right.

![Drag and drop example — Variants Modifiers: With illustration](/assets/drag-and-drop/modifiers-with-illustration.png)
*With illustration*

  ![Drag and drop example — Variants Modifiers: Without illustration](/assets/drag-and-drop/modifiers-without-illustration.png)
*Without illustration*

  ![Drag and drop example — Variants Modifiers: With label](/assets/drag-and-drop/modifiers-with-label.png)
*With label*

#### Alignment

The DragAndDrop is always placed vertically and horizontally in the center of the container.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/94ce34-draganddrop) — Design tab, image 15.*

### Guidelines

#### Group

When combined with other components it follows the same rules applied to forms, distanced by 16px of each input with label.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/94ce34-draganddrop) — Design tab, image 16.*

#### Placement

The DragAndDrop is usually used inside a Modal but can be placed inside different components or on a page.

![Drag and drop example — Guidelines Placement: Inside a modal](/assets/drag-and-drop/placement-inside-a-modal.png)
*Inside a modal*

  ![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Inside a form*

  ![Drag and drop example — Guidelines Placement: Inside a panel](/assets/drag-and-drop/placement-inside-a-panel.png)
*Inside a panel*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/94ce34-draganddrop) — Design tab, image 18.*

#### Use cases

The amount of supported file types influence the button and the description copy.

Visit the [Content tab](https://designsystem.talkdesk.com/51aaf6147/p/94ce34-draganddrop/b/8277c8) to learn more.

### Behavior

#### Interaction

##### General experience

In this section we will show the general DragAndDrop flow, however, it can be different depending on the use case.

![Drag and drop example — Interaction General experience](/assets/drag-and-drop/interaction-general-experience.png)

* Start

The Drag\&Drop component has;

**Label**. The label indicates that this is a mandatory field. It also enables the user to Download the template (button) to promote the success of the file upload and also to see the guidelines (link) aligned on the right.

**Illustration**.

**Title**.

**Button**. The button shows all valid file types and enables the user to upload the file without dragging.

**Description**. The description shows the file max size.

![Drag and drop example — Interaction General experience: Start](/assets/drag-and-drop/experience-start.png)
*Start*

  ![Drag and drop example — Interaction General experience: Start - small viewport](/assets/drag-and-drop/experience-start-small-viewport.png)
*Start - small viewport*

* Error

If the user interacts with the primary actions without a valid file dragged the DragAndDrop component state changes for Error with an error hint visible.

![Drag and drop example — Interaction General experience: Error: Required](/assets/drag-and-drop/experience-error-required.png)
*Error: Required*

  ![Drag and drop example — Interaction General experience: Error: Required - small viewport](/assets/drag-and-drop/experience-error-required-small-viewport.png)
*Error: Required - small viewport*

* Focused

Using the keyboard the user can change the DragAndDrop component state for Focused, focusing the button to select a file to upload.

![Drag and drop example — Interaction General experience: Focused](/assets/drag-and-drop/experience-focused.png)
*Focused*

  ![Drag and drop example — Interaction General experience: Focused - small viewport](/assets/drag-and-drop/experience-focused-small-viewport.png)
*Focused - small viewport*

* Dragging file(s)

When the user drags the file to the droppable area, this area changes to give feedback to the user.

If it is a valid file type the DragAndDrop component state changes for Hover-drag.

![Drag and drop example — Interaction General experience: Dragging file](/assets/drag-and-drop/experience-dragging-file.png)
*Dragging file*

  ![Drag and drop example — Interaction General experience: Dragging file - small viewport](/assets/drag-and-drop/experience-dragging-file-small-viewport.png)
*Dragging file - small viewport*

* Loading

When the user drops a valid file the file uploading starts. The file upload can happen immediately after the file is selected/dropped or only after a few seconds. During this period a spinner, with the message “Uploading your file”, provides the feedback that the file is uploading.

![Drag and drop example — Interaction General experience: Loading file](/assets/drag-and-drop/experience-loading-file.png)
*Loading file*

  ![Drag and drop example — Interaction General experience: Loading file - small viewport](/assets/drag-and-drop/experience-loading-file-small-viewport.png)
*Loading file - small viewport*

* Invalid file(s) dragged

After the loading, if the file is invalid an error message appears between the Label and the DragAndDrop explaining the error and requesting to upload a new file. Different errors can be shown, such as:

When a file larger than the max size is dragged, the error message shows “Your file can't exceed 5 MB. Please upload a new one.”. The max size should be adapted to the use case.

When an unaccepted file type is dragged, the error message shows “Your file type must be CSV or JSON. Please upload a new one.”. The file type(s) should be adapted to the use case.

When an empty file is dragged, the error message shows “Your file must have valid data. Please upload a new one.”.

![Drag and drop example — Interaction General experience: Invalid file(s) dragged](/assets/drag-and-drop/experience-invalid-file-s-dragged.png)
*Invalid file(s) dragged*

  ![Drag and drop example — Interaction General experience: Invalid file(s) dragged: Large file - small viewport](/assets/drag-and-drop/experience-invalid-file-s-dragged-large.png)
*Invalid file(s) dragged: Large file - small viewport*

* File dragged

After the loading, if the file is valid, a card that represents the dragged file is created. The card can have up to two actions. The delete action is mandatory. The other action is dependent on the use case and can change the file, preview the file or other.

When multiple files uploading is available, the DragAndDrop component is also available to upload more files.

![Drag and drop example — Interaction General experience: File dragged](/assets/drag-and-drop/experience-file-dragged.png)
*File dragged*

  ![Drag and drop example — Interaction General experience: File dragged - small viewport](/assets/drag-and-drop/experience-file-dragged-small-viewport.png)
*File dragged - small viewport*

* Importing the file

After all fields are filled the user can import the file by interacting with the primary action. During the importing the primary action state change for feedback and the card's actions are disabled.

![Drag and drop example — Interaction General experience: Importing the file](/assets/drag-and-drop/experience-importing-the-file.png)
*Importing the file*

  ![Drag and drop example — Interaction General experience: Importing the file - small viewport](/assets/drag-and-drop/experience-importing-the-file-small-viewport.png)
*Importing the file - small viewport*

* Importing error

If the importing was not succeeded an error message appears bellow the correspondent Card explaining the error and requesting to upload a new file. The error message can vary depending on the use case but as a general message, it can show “We couldn’t upload your file. Please try again or upload a new one.”

![Drag and drop example — Interaction General experience: Importing error](/assets/drag-and-drop/experience-importing-error.png)
*Importing error*

  ![Drag and drop example — Interaction General experience: Importing error - small viewport](/assets/drag-and-drop/experience-importing-error-small-viewport.png)
*Importing error - small viewport*

* File imported

If the importing was succeeded a toast appears. The toast message can vary depending on the use case but as a general message it can show “xxxxxxxxxx”

![Drag and drop example — Interaction General experience: File imported](/assets/drag-and-drop/experience-file-imported.png)
*File imported*

  ![Drag and drop example — Interaction General experience: File imported - small viewport](/assets/drag-and-drop/experience-file-imported-small-viewport.png)
*File imported - small viewport*

#### Spacing

The spacing between,

* the illustration and the title depends on the viewport, L:16px / M:12px / S:8px.
* the title and the button is always 16px.
* the button and the description is always 8px.

![Drag and drop example — Variants Spacings: Spacing - Large](/assets/drag-and-drop/spacings-spacing-large.png)
*Spacing - Large*

  ![Drag and drop example — Variants Spacings: Spacing - Medium](/assets/drag-and-drop/spacings-spacing-medium.png)
*Spacing - Medium*

  ![Drag and drop example — Variants Spacings: Spacing - Small](/assets/drag-and-drop/spacings-spacing-small.png)
*Spacing - Small*

### Code

### Props

### Examples

### Content

### Introduction

The DragAndDrop component allows users to click and drag items within a designated area and drop them in another area. This component is commonly used for tasks like moving or uploading files.

### Tone and voice

Be concise, clear, and instructional. The language should be straightforward and easy to understand.

### Word choice

Use words that describe the action of dragging and dropping, such as **"drag"** and **"drop".** Avoid using synonyms for the same action, as it can be unclear to the user.

### Concise and clear writing

Provide clear instructions on how to use the DragandDrop component - where to click and how to drag and drop the item.

Be clear about what type of file is accepted. Inform the user about the maximum upload size, using the appropriate [unit of measurement](https://designsystem.talkdesk.com/51aaf6147/p/23fa55-grammar-and-mechanics/t/5282bf).

### Variants

The amount of supported file types influence the button and the description copy.

##### Up to two supported files,

* the supported file types should be described in the button
* the max file size should be described in the description

##### For more than two supported files,

* the supported file types typology (e.g. audio) should be described in the button
* the max file size and the supported file types should be described in the description

### Examples

![Do example](/assets/drag-and-drop/examples-do.png)
*Do*

![Do example](/assets/drag-and-drop/examples-do-2.png)
*Do*

### Accessibility

### Considerations

#### Development

* Always pair drag-and-drop with a keyboard-accessible file-input fallback.
* Label the drop zone and announce upload status/errors via a live region.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `border` | Border<string \| number> |  | no | 2px dashed |  |
| `borderRadius` | BorderRadius<string \| number> |  | no | 4px |  |
| `onFileDrop` | (value: DataTransferItemList) => void |  | no | () => {} |  |
| `validate` | (value: DataTransferItemList) => boolean |  | no | () => true |  |

## Examples

_1 of 1 compile against the published `@talkdesk/cobalt-marketplace-react-drag-and-drop@3.2.0` (React 18, TypeScript strict)._

### Main

```tsx
import DragAndDrop from "@talkdesk/cobalt-marketplace-react-drag-and-drop";
import Icon from "@talkdesk/cobalt-react-icon";

<DragAndDrop width="..." height="..." onFileDrop={...} validate={...}>
    <Icon name="upload" size="large"></Icon>
    Drag file here
</DragAndDrop>
```

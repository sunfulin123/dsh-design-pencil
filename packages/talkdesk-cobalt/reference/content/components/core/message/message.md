# Message

> **Cobalt core** component · `@talkdesk/cobalt-react-message`
>
> Not the same as [Message (Cobalt Marketplace)](../../../components/marketplace/message/message.md), `@talkdesk/cobalt-marketplace-react-message`: a separate package with its own API. Check which one the code imports before using either.
>
> Related (Toast): [Toaster](../../../components/marketplace/toaster/toaster.md), `@talkdesk/cobalt-marketplace-react-toaster`.

## Install (v2.3.5)

```sh
npm install @talkdesk/cobalt-react-message
```

```tsx
import Message, { Timer } from "@talkdesk/cobalt-react-message";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-message-docs--docs)

## Known gaps

Read before using it:

* Message draws its variation's background and border but has no padding, so one line of text makes a 22px box. Add the padding yourself (the Users app design uses 12px / 24px).

## Guidance

Messages can be used to display critical messages about the loss of data or important information that affects the normal use of the product. Use them as many times as needed all over the screen. Find below the documentation to know exactly how to use this component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

![Message styles: Primary/Feature, Info, Success, Warning, Error, and Secondary](/assets/message/message-styles-overview.png)

### Variants

There are two types of messages: **Default** and **Banner**

For the Default type could be activated the property **Block**

![Default, Default Blocked, and Banner message variations](/assets/message/message-variations.png)

#### Styles

Each message can be displayed in these variations:

* **Info**: Use it to update users about a change or to give them advice.
* **Success**: Use it to inform when the task is completed.
* **Warning**: Use it to display information that needs attention or users need to take any action on. Seeing these kinds of messages can be stressful for users so be cautious when using them.
* **Danger**: Use to communicate a problem that needs to be solved as soon as possible. Seeing these kinds of messages can be stressful for users so be cautious when using them.
* **Primary/Feature**: Friendly advice to communicate a new feature is available.
* **Secondary:** To be used when any other variant isn’t valid.

#### Sizes

Messages don’t have a maximum or a minimum width, they’ll adjust to the width of the container they are placed in.

It should be easily adapted to every screen size. Mobile, Tablet and Desktop.

#### Types

##### Basic

Basic messages are single-lined. They are composed of a Title and/or Description. You can use both or just one of them with or without a link. Please mind that the description comes after the title in **horizontal** order.

![Basic message content combinations: dismissible with title/description/link, with title and description, with title only, with description only](/assets/message/message-types-basic-content.png)

![Basic message styles: Primary/Feature, Info, Success, Warning, Error](/assets/message/message-types-basic-styles.png)

##### Block

A block Message is a variation of the Default message but uses more vertical space. The description is placed under the title and because it can grow vertically, we can also add CTA’s at the bottom. You can use any combinations of it (with or without title, descriptions and/or actions).

![Block message combinations: dismissible with title, description and actions; with title and description; with title and actions; with description and actions](/assets/message/message-types-block.png)

##### Banner

Used exclusively for **global system messages, or cross-application communications**. Banners are placed at the top of the content areas (this is, over the primary and secondary areas of Workspace) and they should occupy the entire width of the page.

Colors have been boosted to call more effectively for attention. This way, they can inform effectively about system status and can be easily noticed wherever they are used.

Find the full banners documentation on [Banners | Design](https://zeroheight.com/51aaf6147/p/3335b0/b/35e7dd).

![Banner styles with boosted colors: Primary/Feature, Info, Success, Warning, Error](/assets/message/message-types-banner-styles.png)

![Banner content combinations: dismissible with title and description, with title and description, with title, with description](/assets/message/message-types-banner-content.png)

#### Alignment

All Message elements (Icon, Text elements and Close button) should be vertically aligned on top for all Message types and in all viewports

![Icon, text, and close button aligned to the top of a multi-line message](/assets/message/message-alignment.png)

### Guidelines

#### Use cases

##### Dismissing a message

* The close button is optional. When used it allows users to dismiss the message. Without this, the message will persist on the screen.

##### Positioning

* **Default message**
  * Can be shown anywhere on the screen
* **Banner message**
  * Banners are used for system messages and they are placed at the top of the page or section they apply

##### Status icons

* Each message type comes with a corresponding icon. **These are not changeable** as we want to be consistent when displaying these messages to the user. The only exception is for Primary/Feature Messages. As an example, to use a Loader icon instead of the message icon for cases where we want to show a loading message.

##### Highlighting a description

You can highlight a portion of a sentence in the description of the Message. On the implementation side, it's possible to have bold text with the `Text` component and its `weight` prop.

#### Placement

Banner Message is positioned on top, below the title bar without any spacing between them.

Banner Message span the full width.

![Banner message placed below the title bar, spanning the full width above the page content](/assets/message/message-placement.png)

### Behavior

#### Responsiveness

There are no differences between screen sizes except for the lateral paddings of **Banner** messages (to match the page paddings).

![Large, Medium, and Small message size examples](/assets/message/message-responsiveness-sizes.png)

Message left and right paddings follow the general rules for each viewport, **L:24px / M:16px / S:12px**

![Message example — Behavior Responsiveness: Small](/assets/message/responsiveness-small.png)
*Small*

![Message example — Behavior Responsiveness: Medium](/assets/message/responsiveness-medium.png)
*Medium*

![Message side padding reference across Large, Medium, and Small viewports](/assets/message/message-responsiveness-padding.png)
*Large*

When necessary Default and Banner Messages text elements could be multiline, however, this should be avoided so use clear and concise copy as our content guidelines suggest.

#### Dimensions

##### Message maximum width

Messages have `width=100%`. Additionally, an optional maximum width of **620px** can be set.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/04b4cd-message) — Design tab, image 9.*

### Toast (floating type)

The toast component is a non-disruptive message that appears at the bottom of the interface to provide quick, at-a-glance feedback on the outcome of an action.

In Cobalt, Toast is `<Message type="floating">`.

#### Overview

Toasts inform users of a process that a system has performed or will perform. They shouldn’t interrupt the user from performing a task.

#### Anatomy

![Toast anatomy: icon, title, description, actions, dismissible button, and timer](/assets/message/toast-anatomy.png)

1. **Icon.** Customizable only for Primary and White types.
2. **Title**
3. **Description** (optional)
4. **Actions** (optional)
5. **Dismissible button**
6. **Timer** (optional)

#### Variants

##### Sizes

Toast notifications use a fixed width and their height depends on the length of the notification message.

![Large toast](/assets/message/toast-size-large.png)
*Large*

![Medium toast](/assets/message/toast-size-medium.png)
*Medium*

![Small toast](/assets/message/toast-size-small.png)
*Small*

##### Types

![Primary toast](/assets/message/toast-type-primary.png)
*Primary*

  ![Info toast](/assets/message/toast-type-info.png)
*Info*

  ![Error toast](/assets/message/toast-type-error.png)
*Error*

![Success toast](/assets/message/toast-type-success.png)
*Success*

  ![Warning toast](/assets/message/toast-type-warning.png)
*Warning*

  ![White toast](/assets/message/toast-type-white.png)
*White*

##### Modifiers

![Dismissible toast](/assets/message/toast-modifier-dismissible.png)
*Dismissible Toast*
Toasts with actions and toast with a message that suggests action should never use the timer.

![Primary toast](/assets/message/toast-type-primary.png)
*Auto-dismissible Toast*

**What is the default timer duration?**

Auto-dismissible Toasts must be a minimum of 5 seconds on screen. This is the default value for the toasts timer, however, if the Toast content has more than 50 characters the timer should increase by applying the formula, 1 second per 10 characters.

**Hovering an auto-dismissible Toast?**

Hovering the cursor over a toast prevents it from disappearing. When the cursor leaves the toast, the toast's timeout restarts.

#### Guidelines

##### Group

Could be displayed a maximum of 2 toasts.

The spacing between toasts on the page should follow the global rules of **L:24px / M:16px / S:12px**.

![Two toasts stacked in a group above the bottom-right corner of the screen](/assets/message/toast-group.png)

##### Use cases

###### When to use the timer (auto-dismissible toast)?

The timer is optional and should not be used if,

* it is critical for a user to read or interact with the toast.
* if the toast has actions.
* if the toast message suggests an action (e.g. Please try again).

![Decision flowchart for when to use an alert modal vs. a toast, and when to use the auto-dismiss timer](/assets/message/toast-timer-decision.png)

The previous information suggests that a Toast with actions shouldn't use the timer, however, there are two expectations when a Toast can combine actions with times:

* Toasts that will be shown multiple times in a short period of time can combine actions with a timer.
* If the actions available in the Toast are also available on the same screen after the Toast disappears, the Toast can combine actions with the timer.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/09132a-toast) — Design tab, image 15.*

###### Merge two toasts in a single one

When an app generates two toasts with the same specs and contents, they should be combined by deleting the last generated toast.

###### Remove a toast from the queue

When the user performs actions that make a specific toast useless, it should be removed from the queue.

##### Placement

Toasts should be placed on the bottom right corner of the screen at **L:24px / M:16px / S:12px** from the right and bottom, in front of the content. Avoid placing a toast in front of frequently used touch targets or navigation.

Inside Workspace, an app asks Workspace to show the toast, and Workspace places it in the bottom-right corner of the whole window, not of the app. See [Messages](/workspace/messages/#toasts) for how that works and which settings an app controls.

##### When to use

* Should be used for unexpected errors. When something doesn’t work, we send an error message.
* It is used immediately after a specific event, such as a user action that does not relate to an object on the page. For example, confirmation of deleted items.

##### When not to use

* When you are speaking directly to a piece of content, use Inline Notifications which can be positioned closer to it.
* When an action is user-triggered and you need to inform the user, use a Confirmation Modal.
* When the control the user acted on can show the result itself. For example, Marketplace [CopyToClipboard](/components/marketplace/copy-to-clipboard/) briefly turns its icon into a green check when it copies.

##### Toast vs modal

When showing toasts while a modal is open, the toasts should appear on top of the overlay.

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/09132a-toast) — Design tab, image 16.*

### Resources

Find this component under: `Cobalt Design System > Cobalt Core Components > Message`

* [Message](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/Cobalt-Core-Components?node-id=596%3A28983) — Cobalt Core Component

[Banners | Design](https://zeroheight.com/51aaf6147/p/3335b0/b/35e7dd)

* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/message-basic-messages--color-status) — Cobalt

**Toast**

Find this component under: `Cobalt Design System > Core Components > Toast`

* [Toast](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2)-%E2%9A%9B%EF%B8%8F-Cobalt-Core-Components?node-id=734%3A41946) — Cobalt core component

* [V1](https://talkdesk.github.io/cobalt-react-components/?path=/story/toaster--basic) — Cobalt

### Code

### Props

### Examples

### Content

### Message

#### Banner

Every banner should:

* be clear and concise.
* start with the most important information.
* help the user solve the issue (when possible) by following up with a solution and making the text actionable with a link (see image 1)
* use ellipsis when there’s a process going on: this helps indicate that it will be brief.
* use sentence case.
* have at least 40% of space available for wordier languages.

**Do:** Our voice is colloquial, so it's better to use "we" instead of "Talkdesk", and "turn on" instead of "enable".
![Do example](/assets/message/message-content-do-banner.png)

**Don't:** Avoid punctuation. In this case, the sentence should not have a fullstop.
![Don't example](/assets/message/message-content-dont-banner.png)

#### Block message

* Titles should clearly describe the issue or reason for the message.
* Description text should be clear, concise, empathetic, and informative.
* Use active verbs in the CTAs to guide the user on any actions they need to take.

#### Default message

* Titles should clearly describe the issue or reason for the message.
* Description text should be clear, concise, empathetic, and informative.
* Use active verbs to guide the user on any actions they need to take.
* If there is both message title and message description, use punctuation in both.

**Do:** Use active voice to explain to the user what they can or must do.
![Do example](/assets/placeholder-image.svg)

**Don't:** We’re using an abbreviation that we’ve never explained before and we’re using the passive voice.
![Don't example](/assets/placeholder-image.svg)

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/04b4cd-message) — Content tab, image 3, image 4.*

#### Error message

An error message occurs after the users has taken an action. Besides focusing on being clear, you should explain what has happen, what are the consequences of this action, and what the user can to do move forward.

##### An error message is different from a warning message

A warning message alerts users to an exception condition that may cause a problem in the future. An error message alerts users of a problem that has already occurred (caused by the users or the system).

##### How to write an error message

**Title**

* Titles are optional depending on the component you’ve chosen.
* Write an informative title, usually explaining what has happened.
* Avoid giving a solution in the title.
* Keep the title short, using three to four words if possible.

**Body**

* Avoid repeating content that is already in the title.
* Explain the reason for the error, how the user should act and what can happen if they don’t act.
* Keep it to 2 sentences max.
* Don’t use technical words and unnecessary information in the message. If needed, use a link with the support contact (or any other that makes sense in the case you’re dealing with).

**Call to action (CTA)**

* In case you’re using a CTA, use imperative verbs to describe what action the user will be making. **Example:** Save contact
* Write a CTA with only 1 or 2 words. **Example:** Remove contact

**Voice and tone**

As errors can be frustrating, it’s important to give the user the feeling of support and reassurance. Writing these messages with the same [voice and tone](https://designsystem.talkdesk.com/51aaf6147/p/359359-voice-and-tone) as the whole product is important to build the user’s trust and confidence.

* Be empathic: maybe it’s their first time using Talkdesk (or any similar technology).
* Error messages are important to help the user understand how our products work and avoid similar issues in the future.
* The use of *we* and *you* is important to give a more conversational feeling.
* Avoid messages that focus on the problem without offering a solution.
* Provide quick instructions so the problem can be solved fast.
* [The use of “please”](https://designsystem.talkdesk.com/51aaf6147/p/48e27a-grammar-and-mechanics/t/05c815).
* [Avoid saying “sorry”](https://designsystem.talkdesk.com/51aaf6147/p/48e27a-grammar-and-mechanics/t/33f884).

#### Success message

A success message should appear after the user has taken an action or completed a task successfully.

##### How to write a success message

**Title**

* Titles are optional depending on the component you’ve chosen.
* Write an informative title, usually explaining what has happened.
* Keep the title short, using three to four words if possible.
* Avoid using the words “success” or “successfully”.
* Avoid exclamation points, as we don’t need to be overly excited about everything!

**Body**

* Avoid repeating content that is already in the title
* Confirm what was the action taken or what was the task that has been completed.
* Keep it to 2 sentences max.
* Don’t use technical words and unnecessary information in the message. If needed, use a link with the support contact (or any other that makes sense in the case you’re dealing with).

**Call to action (CTA)**

* If the user has created or changed something, let them have access to it and view it.
* In case you’re using a CTA, use imperative verbs to describe what action the user will be making. **Example:** Save contact
* Write a CTA with only 1 or 2 words. **Example:** Remove contact

**Voice and tone**

Success messages should give users the feeling of motivation and satisfaction towards their actions. Writing these messages with the same [voice and tone](https://designsystem.talkdesk.com/51aaf6147/p/359359-voice-and-tone) as the whole product is important to build the user’s trust and confidence.

* Do not over celebrate the user’s actions.
* Success messages that are repetitive and shown more frequently should be simpler and concise.
* If the user has done a bigger task, write a more optimistic message, that can build trust and confidence.
* Success messages are also a good timing to be a little playful and conversional.

### Toast

#### Toasts

Toasts are temporary, usually lasting from 3 to 5 seconds. This means we have a limited amount of time to pass on information to our users, so:

* Keep toasts as short as possible. In most cases you can omit articles, pronouns and other non-essential words to convey meaning.
* Adjust the duration of the toast so that the reading speed does not exceed 150 words per minute.
* Use sentence case.
* Avoid punctuation. **Exceptions:** more than one sentence requires periods and loading toasts require ellipsis.
* The body should not repeat the information that’s in the title.
* Text in the body is optional.

##### Success toasts

Use them to reaffirm the outcome and then get out of the user's way. If they have just created something, you can provide a link to its location (another page or Atlas app, for example).

Messages that appear more frequently should have less personality and go straight to the point.

**Do:** Short message that contains the necessary information that the user can read in those 3 to 5 seconds.
![Do example](/assets/message/toast-content-do-success-1.png)

**Don't:** The word “successful(ly)” can be omitted because the checkmark and the green color we use in our toasts already signify success. Avoid punctuation.
![Don't example](/assets/message/toast-content-dont-success-1.png)

Messages that appear after a bigger or more infrequent action can congratulate the user and have a more human touch, but should remain concise.

**Do:** Success message in the title and reaffirmation of the outcome.
![Do example](/assets/message/toast-content-do-success-2.png)

**Don't:** This isn’t appropriate for a toast due to its temporality. This tone is better used in an empty state, for example.
![Don't example](/assets/message/toast-content-dont-success-2.png)

##### Error toasts

Using a conversational tone, you should let the user know what’s causing the error and explain how to fix it/how to proceed. Avoid ambiguity.

**Do:** Error message in the title and explanation in the body.
![Do example](/assets/message/toast-content-do-error.png)

**Don't:** The body should not repeat the same information that's in the title.
![Don't example](/assets/message/toast-content-dont-error.png)

##### Loading toasts

* In general, keep them clear and short. If the loading is consistently slow, longer text is suitable or a random sequence of messages can be shown as time passes.
* Be specific: when possible, communicate exactly what’s happening in the background. E.g., *Loading your flow\...* instead of just *Loading…*
* Be informative only and don’t ask any additional action from the user.
* If loading times are usually long, inform the user about the time left to complete the process (E.g., *Uploading your files… This can take up to 1 minute*). You can also remind users that they shouldn't refresh the page.
* Reading speed should not exceed 150 words per minute.
* Use sentence case.
* Use ellipsis to help indicate that the process will be brief.
* You can be playful if appropriate.

**Do:** The flow takes a few seconds to load, so we can be a bit more specific.
![Do example](/assets/message/toast-content-do-loading.png)

**Don't:** The ellipsis is missing.
![Don't example](/assets/message/toast-content-dont-loading.png)

### Accessibility

### Message

#### Interactions

##### Keyboard

Users should be able to navigate to the dismiss and action buttons of the message using normal keyboard navigation (tab key).

#### Considerations

##### Development

Depending on the message type we can have two ARIA roles that should be used. These should be applied to the title of the message. In the absence of the title, it should be added to the description.

For **info, success, feature,** and **warning** messages, which usually have advisory information for the user that is not important enough to justify an alert, we should use the status role ([documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_status_role)).

However, for **error/danger** messages which are often used to communicate an important and usually time-sensitive message to the user, we should use the alert role ([documentation](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_alert_role)).

### Toast

#### Considerations

##### Design

Toast messages are a great way to report transient statuses and messages that are not critical. However, for a small visual element, there are many accessibility considerations.

* [2.2.1: Timing Adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html)
* [2.2.3 No timing](https://www.w3.org/TR/UNDERSTANDING-WCAG20/time-limits-no-exceptions.html)
* [2.2.4 Interruptions](https://www.w3.org/TR/UNDERSTANDING-WCAG20/time-limits-postponed.html)
* [3.2.4 Consistent Identification](https://www.w3.org/TR/UNDERSTANDING-WCAG20/consistent-behavior-consistent-functionality.html)

##### Development

Users need to know what is going on, and get appropriate feedback during interaction. Without taking extra steps, toasts can have numerous accessibility issues that can impact both people with and without disabilities.

###### How it works

The content of the toast component is implemented as an ARIA live region using `aria-live`. When the toast appears, screen readers should announce the toast text after any other more pressing announcements.

The close button contains an ARIA label of `aria-label="close"`, and the icon has `aria-hidden="true"` so it is ignored by assistive technologies.

The `Tab` key is used to move focus to the close button within the notification and the `Space` key or `Enter` key activate the button to close the notification.

###### Considerations

Avoid using toast for critical information that users need to act on immediately. Toast might be difficult for users with low vision or low dexterity to access because it:

* Disappears automatically
* Can’t be easily accessed with the keyboard
* Might appear outside the proximity of the merchant’s current focus

###### Resources

* [W3C WAI-ARIA Authoring Practices Alert Design Pattern](https://www.w3.org/TR/wai-aria-practices-1.1/#alert) covers the usage of ARIA names, state and roles.
* [W3C Web Accessibility Tutorial - User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/) provides a tutorial on notification accessibility.
* [Notifications - Inclusive components](https://inclusive-components.design/notifications/)

## Props

### Message

_Also accepts the standard `HTMLAttributes<MessageType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `type` | enum | `banner`, `floating` | no |  |  |
| `variation` | enum | `info`, `success`, `warning`, `error`, `feature`, `primary`, `secondary` | no | info |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

### Timer

_Also accepts the standard `HTMLAttributes<TimerType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `active` | boolean |  | no |  |  |
| `duration` | number |  | no | 5 | The number of seconds the animation takes. |
| `elapsed` | number |  | no |  | The number of seconds elapsed from the animation. |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_4 of 4 compile against the published `@talkdesk/cobalt-react-message@2.3.5` (React 18, TypeScript strict)._

### Basic

```tsx
import Message from "@talkdesk/cobalt-react-message";

<Message variation="info">
  ...
</Message>

<Message variation="success">
  ...
</Message>

<Message variation="warning">
  ...
</Message>

<Message variation="error">
  ...
</Message>

<Message variation="primary">
  ...
</Message>

<Message variation="secondary">
  ...
</Message>
```

### Banner

```tsx
import Message from "@talkdesk/cobalt-react-message";

<Message type="banner" variation="info">
  ...
</Message>

<Message type="banner" variation="success">
  ...
</Message>

<Message type="banner" variation="warning">
  ...
</Message>

<Message type="banner" variation="error">
  ...
</Message>

<Message type="banner" variation="primary">
  ...
</Message>

<Message type="banner" variation="secondary">
  ...
</Message>
```

### Floating

```tsx
import Message from "@talkdesk/cobalt-react-message";

<Message type="floating" variation="info">
  ...
</Message>

<Message type="floating" variation="success">
  ...
</Message>

<Message type="floating" variation="warning">
  ...
</Message>

<Message type="floating" variation="error">
  ...
</Message>

<Message type="floating" variation="primary">
  ...
</Message>

<Message type="floating" variation="secondary">
  ...
</Message>
```

### Timer

```tsx
import Message, { Timer } from "@talkdesk/cobalt-react-message";

<Message type="floating">
  ...
  <Timer />
</Message>

// Active

<Message type="floating">
  ...
  <Timer active />
</Message>

// Active with duration time

<Message type="floating">
  ...
  <Timer active duration={...} />
</Message>

// Active with elapsed time

<Message type="floating">
  ...
  <Timer active elapsed={...} />
</Message>
```

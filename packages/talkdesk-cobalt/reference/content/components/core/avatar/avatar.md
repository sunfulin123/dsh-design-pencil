# Avatar

> **Cobalt core** component · `@talkdesk/cobalt-react-avatar`

## Install (v2.3.1)

```sh
npm install @talkdesk/cobalt-react-avatar
```

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-avatar-docs--docs)

## Guidance

A circular shape that should represent a user, an object, or an entity, among others.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The Avatar is a pretty straightforward component to use when you want to represent people and things in a visual way. It can have multiple sizes and colors for the background and the content inside, and it can contain letters (up to two), icons, or images as its content.

### Anatomy

![Avatar anatomy: icon, text, image, status, border](/assets/avatar/anatomy.png)

1. **Icon** - Consider using by following our [Assets library](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/346276)
2. **Text** - Indicates the initials of a user's name
3. **Image** - Any specific picture
4. **Status** - Indicates if a user is available, away, focused, or busy
5. **Border** - Always present to support the layout

### Variants

#### Sizes

There are five size variations. The default is the medium size but you may choose to use any other size to fit your layouts.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### Types

![Primary avatar type](/assets/avatar/type-primary.png)
*Primary*

  ![Light-Primary avatar type](/assets/avatar/type-light-primary.png)
*Light-Primary*

  ![Basic avatar type](/assets/avatar/type-basic.png)
*Basic*

  ![Picture modifier avatar](/assets/avatar/modifier-picture.png)
*Picture*

#### Colors

You can find more guidelines about color usage [here](https://designsystem.talkdesk.com/51aaf6147/p/49728f-color/b/94c676).

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

#### States

![Default state avatar](/assets/avatar/state-default.png)
*Default*

  ![Hover state avatar](/assets/avatar/state-hover.png)
*Hover*

  ![Active state avatar](/assets/avatar/state-active.png)
*Active*

  ![Focused state avatar](/assets/avatar/state-focused.png)
*Focused*

#### Modifiers

The content can be composed of text (max 2 characters), an icon (any icon from our [Asset library](https://designsystem.talkdesk.com/51aaf6147/p/32d352-icons/b/346276)), an image, or any combination with a status associated.

![Text modifier avatar](/assets/avatar/modifier-text.png)
*Text*

  ![Icon modifier avatar](/assets/avatar/modifier-icon.png)
*Icon*

  ![Picture modifier avatar](/assets/avatar/modifier-picture.png)
*Picture*

  ![Avatar modifier combined with a status indicator](/assets/avatar/modifier-with-status.png)
*With Status*

#### Status

Avatars can display the status by applying a status icon to the bottom right corner of the element. For the specific Talkdesk use case, we have statuses with different correspondent colors:

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

Also note that due to accessibility concerns (color blindness), we can add a shape to identify the different statuses.

![Available status with an accessible shape](/assets/avatar/status-shape-available.png)
*Available*

  ![Away status with an accessible shape](/assets/avatar/status-shape-away.png)
*Away*

![Busy status with an accessible shape](/assets/avatar/status-shape-busy.png)
*Busy*

  ![Offline status with an accessible shape](/assets/avatar/status-shape-offline.png)
*Offline*

### Guidelines

#### Group

You can combine multiple Avatars together using the AvatarGroup pattern. Stacks can be used to group a list of users, objects, or entities in one element.

We can set a maximum number of 3 avatars to stack. When the maximum value is reached, it displays a counter next to the stack with the remaining number of items.

![A single standalone avatar](/assets/avatar/group-standalone.png)
*Standalone*

  ![Three stacked avatars with a +4 overflow counter](/assets/avatar/group-avatargroup.png)
*AvatarGroup*

#### Placement

Elements that officially use the Avatar component:

![Avatar next to a ChatBubble message](/assets/avatar/placement-chatbubble.png)
*ChatBubble message*

  ![Avatars used as a List item](/assets/avatar/placement-list.png)
*List item*

  ![Do example](/assets/avatar/placement-table.png)
*Table item*

#### Use cases

Whenever possible, an image should be used to represent a user, but if an image is unavailable, one or two letters can be used instead.

If the record name contains **two (or more) words**, like first and last name, the first capitalized letter of the first and the last names should be used. For records that only have a **single word** name, only the first capitalized letter should be used.

If either an image or initials are unavailable (e.g. a phone number), the user icon should be used as a fallback. There are other situations where we might think of adding fallbacks, for example on a call from an "Unknown Number". This should generate an icon instead of the "UN" initials.

Different icons can be set as a fallback for each object. For example, users can have the "user" icon as a fallback and for companies, we could use the "building" icon.

**Do:** Use the initials (one or two), an icon, or an image to represent an entity. If the entity doesn't have a name (e.g. a phone number), use an icon representative of that entity (e.g. "user")
![Do example](/assets/avatar/usecases-do.png)

**Don't:** Don't use more than two characters and avoid empty avatars. Also, try not to use circular icons and don't change the default color.
![Don't example](/assets/avatar/usecases-dont.png)

##### Product references

![Avatar used inside a Table, in an admin seat-management list](/assets/avatar/productref-inside-table.png)
*Inside a Table*

![Avatar used inside a List of actions](/assets/avatar/productref-inside-list.png)
*Inside a List*

![Placeholder: image still to be added from ZeroHeight](/assets/placeholder-image.svg)
*Inside a ChatBubble*

*Image to add: [original on ZeroHeight](https://designsystem.talkdesk.com/51aaf6147/p/44fb82-avatar) — Design tab, image 43.*

##### Using a BadgeContainer

An Avatar in a table can also have both a Status element and an Icon, when applying the BadgeContainer, that represents the Channel.

![Avatars combined with a status and a channel icon via BadgeContainer](/assets/avatar/badgecontainer.png)

##### Using an interactive avatar

PhoneApp has a specific use case that involves an interaction in the Avatar to represent that a customer is calling.

![An interactive avatar used in a message example](/assets/avatar/interactive-avatar.png)

#### Best practices

##### Colors

![Do example](/assets/avatar/placement-table.png)
*Do*
We should use the light primary avatar color to display users in a list. This way we will have a consistent look and feel whenever we are displaying user avatars.

![Do example](/assets/avatar/do-s-don-ts-colors-do.png)
*Do*
For other objects, we can use any other color by picking one from the quick list or use a custom one as long as it follows the accessibility guidelines regarding the use of color.

Please consider checking the [Color | Color usage](https://zeroheight.com/51aaf6147/p/49728f/b/94c676) page when applying different colors.

##### Status

Avatars can also display the user's status by applying a status icon to the right bottom corner of the element.

**Do:** When displaying the user’s status, use an alternative textual or visual representation.
![Do example](/assets/avatar/do-s-don-ts-status-do.png)

**Don't:** Do not trust color alone for status because that will not be accessible by color-blind users.
![Don't example](/assets/avatar/do-s-don-ts-status-dont.png)

##### Badges

Avatars can be used in combination with tags (using the BadgeContainer pattern) to display a badge. Badges can be placed on the top right corner of the element.

**Do:** The tag size is adjusted based on the avatar size, but the positioning remains always the same.
![Do example](/assets/avatar/do-s-don-ts-badges-do.png)

**Don't:** Don't apply different sizes and/or positions.
![Don't example](/assets/avatar/do-s-don-ts-badges-dont.png)

### Behavior

#### Responsiveness

This component has defined variation sizes that shouldn't change based on the viewport size.

#### Interaction

Besides our Avatar [states](/components/core/avatar/), you can find specific assets in the [Phone Library](https://www.figma.com/file/IZCC3x71w1meRON8FcKgjb/Phone-Desktop-Library?type=design\&node-id=0%3A1\&mode=design\&t=g7APqeQOlFQQmJvw-1) that are related to reference when a customer is calling.

#### Overflow

Regarding the text variation, you shouldn't exceed the limit of two characters. Consider always the first and last name initials.

#### Loading

The [Skeleton](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/avatar--basic#skeleton) is intended to give visual feedback on the component while data is in a loading state.

> **Interactive demo — Demo.** Not reproducible in text; see the documentation site.

You can apply the skeleton behavior when loading an Avatar.

#### Internationalization

Depending on the language, the generation of initials may be tricky. For Latin, Greek, or Cyrillic alphabets it's easy to extract the first letter of the names to generate the initials, however, not all languages are this linear.

For example, in Chinese, the name “Mao Zedong” is written as “毛泽东” (no spaces). So the initials could be “毛泽” or just “毛“. The problem of using initials is that in Chinese this can generate a different word with a meaning that is totally different than the intended. So, in this case, the two initials “毛泽” would mean "Mao Ze"; but using only one “毛“ would mean "hair".

Other languages may have similar problems, so, for now, we should limit the generation of initials to Latin, Greek, and Cyrillic.

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Avatar`

* [Avatar Component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=160-3663\&mode=design) — Core components library
* [Avatar Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=156-134863\&mode=design) — Specs

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

* For image avatars, provide meaningful `alt` text (or `aria-label`).
* When clickable, render as a button with an accessible name and visible focus state.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `color` | enum | `basic`, `theme`, `light-theme`, `blue`, `green`, `purple`, `teal`, `yellow`, `red`, `orange` | no | basic |  |
| `status` | enum | `green`, `yellow`, `red`, `gray` | no |  |  |
| `size` | enum | `tiny`, `small`, `medium`, `large`, `xlarge` | no | medium |  |
| `skeleton` | enum | `static`, `animated` | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |
| `onClick` | MouseEventHandler<HTMLDivElement> & MouseEventHandler<HTMLButtonElement> |  | no |  |  |

## Examples

_7 of 7 compile against the published `@talkdesk/cobalt-react-avatar@2.3.1` (React 18, TypeScript strict)._

### Default

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

<Avatar>AV</Avatar>;
```

### Sizes

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

<Avatar size="tiny">XS</Avatar>
<Avatar size="small">S</Avatar>
<Avatar size="medium">M</Avatar>
<Avatar size="large">L</Avatar>
<Avatar size="xlarge">XL</Avatar>
```

### Colors

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

<Avatar color="theme">T</Avatar>
<Avatar color="light-theme">LP</Avatar>
<Avatar color="blue">B</Avatar>
<Avatar color="green">G</Avatar>
<Avatar color="purple">P</Avatar>
<Avatar color="teal">T</Avatar>
<Avatar color="yellow">Y</Avatar>
<Avatar color="red">R</Avatar>
<Avatar color="orange">O</Avatar>
```

### Status

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

<Avatar status="gray">K</Avatar>
<Avatar status="green">G</Avatar>
<Avatar status="yellow">Y</Avatar>
<Avatar status="red">R</Avatar>
```

### Clickable

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

<Avatar onClick={...}>K</Avatar>
```

### Skeleton

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

<Avatar skeleton="static" />
<Avatar skeleton="animated" />
```

### Accessibility

```tsx
import Avatar from "@talkdesk/cobalt-react-avatar";

// Decorative (default): hidden from assistive tech
<Avatar>AV</Avatar>

// Meaningful: exposed as an image with an accessible name
<Avatar aria-label="Ada Lovelace">AL</Avatar>
```

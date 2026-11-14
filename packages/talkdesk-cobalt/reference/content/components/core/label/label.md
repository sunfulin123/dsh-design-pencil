# Label

> **Cobalt core** component · `@talkdesk/cobalt-react-label`

## Install (v2.2.5)

```sh
npm install @talkdesk/cobalt-react-label
```

```tsx
import Label from "@talkdesk/cobalt-react-label";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-label-docs--docs)

## Guidance

Labels give context to the information that a user needs to input.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Labels are usually 1–2 words that are commonly used in forms like inputs, dropdowns, checkboxes, etc. Text is used to **tell the user what to do** and should be simple.

### Anatomy

![Label anatomy diagram with 8 numbered callouts](/assets/label/anatomy.png)

1. **Label** - Text that informs the user what to expect in the input
2. **Required** - Used to specify that the input element must be filled out before submitting the form
3. **Info** - Interactive icon that shows a tooltip with more information about the topic
4. **Secondary label** - Additional text to give more context if necessary
5. **Tertiary label** - Additional text to give more context if necessary
6. **Link** - Add a link if necessary
7. **Tag** - Add a tag if necessary
8. **Description** - Gives more context about the label

### Variants

#### Modifiers

![Label using the default text color](/assets/label/modifier-label.png)
*Standalone*

  ![Label with description](/assets/label/modifier-description.png)
*Description*

![Required label with asterisk](/assets/label/modifier-required.png)
*Required*

  ![Label with info icon and tooltip](/assets/label/modifier-info.png)
*Info*

![Label with secondary label](/assets/label/modifier-secondary-label.png)
*Secondary label*

  ![Label with tertiary label](/assets/label/modifier-tertiary-label.png)
*Tertiary label*

![Label with a link](/assets/label/modifier-link.png)
*Link*

  ![Label with a character-count tag](/assets/label/modifier-tag.png)
*Tag*

#### Arrangement

Label width is always dependent on the associated component width. For example, if the input width=`320px`, label width=`320px`.

![Label example — Variants Arrangement: Full-width](/assets/label/arrangement-full-width-2.png)
*Full-width*

#### Position

A label should be placed only on top of an input. This position is the default because they work better with long copy, localization, and responsive layouts. Also, they could be oriented on the left/right regarding the priority of the label.

![Full-width label matching the width of its input](/assets/label/arrangement-full-width.png)
*Top Left*

  ![Label example — Variants Position: Top Right](/assets/label/position-top-right.png)
*Top Right*

### Guidelines

#### Placement

Use labels inside form elements.

#### Best practices

##### Label color

Label color should never be changed.

**Do:** 
![Do example](/assets/label/do-s-don-ts-label-color.png)

**Don't:** 
![Don't example](/assets/label/label-color-dont.png)

##### Requirement or optional

Label inputs could be required or optional, depending on the situation, using a necessity indicator.

By default, the required indicator is shown with an asterisk icon. Required inputs are marked with this at the end of the label and be sure to include hint text to explain what it means.

**Do:** Always add a hint to explain why the input is required.
![Do example](/assets/label/requirement-do.png)

**Don't:** You submitted and don't know the problem.
![Don't example](/assets/label/requirement-dont.png)

You can also use the secondary label to say that the input is “optional”. Optional inputs do not need to add an icon.

**Do:** Label with optional information
![Do example](/assets/label/optional-do.png)

**Don't:** Don't use any icon to inform the input is optional.
![Don't example](/assets/label/optional-dont.png)

### Behavior

#### Interaction

When a user clicks or touches/taps a label, the browser passes the focus to its associated input (the resulting event is also raised for the input).

To explicitly associate a `<label>` element with an `<input>` element, you first need to add the `id` attribute to the `<input>` element. Next, you add the `for` attribute to the `<label>` element, where the value of `for` is the same as the `id` in the `<input>` element.

* [Playroom example](https://prd-cdn-talkdesk.talkdesk.com/cobalt/playroom/index.html#?code=N4Igxg9gJgpiBcIA8AhCAPABACxgSwHNsAXAXgB0QBGABhoDdtLMAHAQyijwDsDTgAHAF8AfOW6ZMSAMIRuxGOmJiJkzMAAUwHBAgBrAM6YhASkykR68WrWRuB4pgDaeA9Nxg9MKABpMBmGIASTcPLygAXXNMACUYNjBiADoAVwCAZWI2BQ0AMzYAGwCTAG5xaxtMACdAlKqJDQrKqQAxAsVMLhrEvDkKcAgClIBbbmYCNhZ%2BgGZKFWabJAAVRUdIAogq-pqoOYB1PGJsCBTHFiqIFgN4JAB6FaV5hckkNo7Cwm4ATX6wGHkYFVxpN%2BgAmOZNZ5SAAybAARjACiJYQiCncUYinlCpEFuCxTphiABPFgwX5hOEYZi3LELO5vdAqSHNZarTDrTb9Ag1f77Q7YVgXK43e6rWkshmYD4Eb6-f4KIEgTATKaUcEgcV0jEFTC5TmUArwxEAWioc216KNSOZdNx%2BOINueYDC3n4rncME83iEjoWcncbF4ZM0Zgs-kCIQ9XqgGgAhO6XVATD7VNjJHgoP1DajTZRfc1iaTyZ69JT0HnU1CafmpLcGZqXnX2oybaVIUIU43ZADHuI7mgW9wQD4QEcYMMYAYEE4QAVCCQQBERwB3DNHKfwJwANgALDQIkIgA) — A label with and without props

#### Overflow

When the field label is too long for the available horizontal space, it wraps to the line above.

![An extremely large and unnecessary label wraps to the line above](/assets/label/overflow.png)

#### Internationalization

For RTL (right-to-left) languages, the layout of the label is mirrored and the label is right-aligned. However, some types of content (e.g., email addresses) are not translated.

![RTL email label and input, right-aligned and mirrored](/assets/label/internationalization.png)

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Label`

* [Label component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?node-id=1104%3A298755) — Core Components library
* [Label handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?node-id=119-119830) — Handoff guidelines

### Code

### Props

### Examples

### Content

### Introduction

The label component is used to provide a clear and concise description of the input field, allowing the user to easily understand the information being requested.

### Tone and voice

The tone and voice used for the Label component should be informal and positive, using clear and concise language that is easy to understand.

### Word choice

* Field labels should be short and in noun form, providing clear context for the input field.
* For text fields that are placed individually on a page, the label should be written as a call to action to avoid confusion.
* Labels can include instruction and formatting, such as "Full name" or date format "MMM D, YYYY".
* Words like **"Optional"** and **"Required"** should be used as a Secondary Label.

### Concise and clear writing

Label text should be short and concise. Users should be able to quickly understand what information is being requested without having to read a long or complex label.

Although in some cases it may be necessary to give more context, in general, a label with 1 or 2 words is best.

### Variants

For text fields that are not part of a form and are placed individually on a page, the label can be written as a call to action.

### Examples

Dos and don'ts.

### Accessibility

### Considerations

#### Development

* Renders a native `<label>`; requires `htmlFor` matching the control's `id` to give it an accessible name.
* Keep label text concise and descriptive.

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts the standard `LabelHTMLAttributes<LabelType>` attributes._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `htmlFor` | string |  | yes |  |  |
| `type` | enum | `warning`, `error` | no |  | @deprecated The label should always have the same styles |
| `forwardedRef` | Ref<HTMLLabelElement> |  | no |  |  |

## Examples

_1 of 1 compile against the published `@talkdesk/cobalt-react-label@2.2.5` (React 18, TypeScript strict)._

### Default

```tsx
import Label from "@talkdesk/cobalt-react-label"

<Label htmlFor={...}>Label</Label>
```

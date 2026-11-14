# Web accessibility

## Guidance

:::note
Sourced from Cobalt's live Accessibility docs, which the Cobalt team has flagged as under review —
treat as a starting point, not settled guidance.
:::

## Meeting the Web Content Accessibility Guidelines (WCAG)

WCAG is developed through the W3C process in cooperation with individuals and organizations around the
world, with the goal of providing a single shared standard for web content accessibility that meets
the needs of individuals, organizations, and governments internationally.

The WCAG documents explain how to make web content more accessible to people with disabilities.

TDS follows the WCAG 2.1 which are stable, referenceable technical standards.

They have guidelines that are organized under 4 principles: perceivable, operable, understandable, and
robust. For each guideline, there are testable success criteria, which are at three levels: A, AA, and
AAA.

## Standards compliant markup

The semantic markup is what makes content readable and understandable by assistive technologies by
representing the type of content that is being presented.

Accessible Rich Internet Applications (ARIA) or Web Accessibility Initiative – Accessible Rich Internet
Applications (WAI-ARIA) specification adds accessibility information to HTML elements making them more
accessible to people with disabilities specialty who use assistive technology.

* ARIA Authoring Practices Guide
* Accessible Rich Internet Applications (WAI-ARIA) 1.2
* Using ARIA

ARIA applies special attributes to HTML; roles, states, and properties.

The course *Get Started with Web Accessibility* offered by Salesforce defines,

> "Roles are a way to give semantic meaning to HTML elements that traditionally do not have any
> semantic meaning, such as `<div>` or `<span>`."

> "States are attributes that describe the status of an ARIA component to a browser's accessibility
> tree."

Properties as, "attributes that describe the nature of an object."

## Assistive technology

Tools used by users with disabilities can be grouped into two main groups: Assistive technologies and
Adaptive strategies.

What mainly distinguishes these two groups is that,

Adaptive strategies are applied by using standard software and hardware such as keyboard, web browsers.
Adaptive Strategies examples include resizing text, reducing mouse speed, turning on captions,
switching to dark mode, using keyboard only, among others.

* Better Web Browsing
* Tips for Customizing Your Computer

Assistive technologies require the use of non-standard software and/or hardware such as screen readers,
screen magnifiers, voice recognition software, among others.

Different disabilities require different tools and techniques. The next section explains some of them.

## Assistive technologies

**Screen readers.** Read aloud information from web pages and other documents for people who cannot
read the text. Some of the most used screen readers are NVDA, JAWS, VoiceOver, Narrator, TalkBack, and
Orca.

**Refreshable braille.** Used combined with screen readers. The screen reader is capable of adapting
electronic content to braille and, by using a refreshable braille display, blind users can read the
content.

**Screen magnifiers.** Allow users to magnify the entire screen or a part of a screen. Used by people
with some types of low vision to enlarge visual content (type, images, and others).

**Text-to-speech / voice recognition software.** Lets a person use spoken commands to enter text or
control a computer. Used by people who cannot use a keyboard or mouse.

**Selection switches.** Used by people who cannot use a keyboard or mouse.

**Alternative input software and hardware.** Allow users to navigate without using a keyboard or a
mouse. Used by people with mobility impairments. As an example, software that displays a keyboard
on-screen allows users to activate virtual keys by blinking or using head stick, mouth stick, foot
pedals, among others.

# Overview

## Guidance

:::note
Sourced from the live Cobalt DS's Design Tokens > Introduction page.
:::

Learn more about the concept of design tokens with all the values needed to construct and maintain
our design system.

## What does Design tokens mean?

Let's say a brand has a Primary Pink color. Designers and developers should refer to this color by
the same name and identity, regardless of platform (design, web, mobile etc). If the color changes
in design, it should also change on all development platforms automatically (and vice versa).

Design tokens enable this behavior by creating an abstract identity and centralizing the source of
truth for this color. Because they help to establish a source of truth, they are often found in
design systems. They can be used for colors, text styles, spacings, animation values etc.

Design tokens work as design atoms of the design system — specifically, they are named entities that
store visual design attributes.

We are talking about typography, color, spacing, shadow, and more represented as data. They are
directly integrated into our component libraries and can represent anything defined by design: a
color as a hex value, an opacity as a percent, etc. Tokens replace static values, used in place of
hard-coded values in order to ensure flexibility and a consistent visual system for UI development.

A Cobalt token consists of:

* A code-like name, such as `primary-600`
* An associated value, such as `#3E048B`
* A symbol (`$`) to represent the token

So our token is represented as `$primary-600` and every time a designer and/or an engineer try to
implement this color, they will both reference the same token called this primary color, then design
and engineering can be confident that the same color will be used in both places. This consistency
remains in place even when the color value assigned to a token gets updated.

## Why are they important?

Design Tokens provide a design system with a single source of truth. They enable a consistency path
through the entire products at Talkdesk.

They are reusable and can be as generic as possible in order to supply different scenarios and
contexts. This also provide the design system evolution, because even if we change some values of our
styles considering future changes, we can keep the nomenclature and ensure ongoing consistency across
experiences.

## Where to find

* **Design tokens** — check our library on Figma
* **Color tokens** — color styles and palettes
* **Typography tokens** — text styles and more
* **Spacing & more** — spacing, border, opacity and shadow

## Further reading

* [Tokens in Design Systems — Nathan Curtis](https://medium.com/eightshapes-llc/tokens-in-design-systems-25dd82d58421)
* Using design tokens to promote collaboration and maintainability of a design system
* An example of design tokens in a live design system — Lightning Design System

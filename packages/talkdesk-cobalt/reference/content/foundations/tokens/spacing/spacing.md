# Spacing

## Guidance

Learn about small pieces that standardize the composition of interfaces providing rules to give your
designs a consistent rhythm, constrain decision making, and help teams stay aligned.

## Guidelines

The purpose of this document is to gather all the spacing rules for different contexts (on a page, on
a panel, on a modal…). The goal is to make it easy for everyone to check if they are applying the
correct spacings.

### General rules

Each viewport has a default spacing that is generally followed by most components.

| Large Viewports | Medium viewports | Small viewports |
| --------------- | ---------------- | --------------- |
| **L**: 24px     | **M**: 16px      | **S**: 12px     |

For example, this means that a **Card** will have different inner paddings if seen on screens with
different sizes.

## Spacing specs

Spacing tokens are used to consistently apply margin and padding across elements, components and
layouts. With a set scale for spacing, information can be structured to have a consistent and
intuitive user interface across the website.

### Types

#### Core

![Nano spacing token, $spacing-nano, 4px](/assets/spacing-specs/token-nano.png)

![Micro spacing token, $spacing-micro, 8px](/assets/spacing-specs/token-micro.png)

![XSmall spacing token, $spacing-xsmall, 12px](/assets/spacing-specs/token-xsmall.png)

![Small spacing token, $spacing-small, 16px](/assets/spacing-specs/token-small.png)

![Medium spacing token, $spacing-medium, 20px](/assets/spacing-specs/token-medium.png)

![Large spacing token, $spacing-large, 24px](/assets/spacing-specs/token-large.png)

![XLarge spacing token, $spacing-xlarge, 32px](/assets/spacing-specs/token-xlarge.png)

![Mega spacing token, $spacing-mega, 40px](/assets/spacing-specs/token-mega.png)

![XMega spacing token, $spacing-xmega, 48px](/assets/spacing-specs/token-xmega.png)

![Giga spacing token, $spacing-giga, 56px](/assets/spacing-specs/token-giga.png)

![XGiga spacing token, $spacing-xgiga, 64px](/assets/spacing-specs/token-xgiga.png)

![Tera spacing token, $spacing-tera, 80px](/assets/spacing-specs/token-tera.png)

![XTera spacing token, $spacing-xtera, 120px](/assets/spacing-specs/token-xtera.png)

#### Inset

Internal spacings (paddings) of a component where all values are exactly the same. Padding is the
space around the content inside a container. This spacing does not affect the total dimension of an
element, but rather shrinks the working space within it.

![Inset Nano spacing token, $spacing-inset-nano, V: 4px, H: 4px](/assets/spacing-specs/token-inset-nano.png)

![Inset Micro spacing token, $spacing-inset-micro, V: 8px, H: 8px](/assets/spacing-specs/token-inset-micro.png)

![Inset XSmall spacing token, $spacing-inset-xsmall, V: 12px, H: 12px](/assets/spacing-specs/token-inset-xsmall.png)

![Inset Small spacing token, $spacing-inset-small, V: 16px, H: 16px](/assets/spacing-specs/token-inset-small.png)

![Inset Medium spacing token, $spacing-inset-medium, V: 20px, H: 20px](/assets/spacing-specs/token-inset-medium.png)

![Inset Large spacing token, $spacing-inset-large, V: 24px, H: 24px](/assets/spacing-specs/token-inset-large.png)

![Inset XLarge spacing token, $spacing-inset-xlarge, V: 32px, H: 32px](/assets/spacing-specs/token-inset-xlarge.png)

![Inset Mega spacing token, $spacing-inset-mega, V: 40px, H: 40px](/assets/spacing-specs/token-inset-mega.png)

![Inset XMega spacing token, $spacing-inset-xmega, V: 48px, H: 48px](/assets/spacing-specs/token-inset-xmega.png)

### Usage

#### When to use

* Whenever you need to space out the inner parts within a component
* Whenever you need to space out one component from another or other elements outside of a component

#### When not to use

Don't use it when you need responsive spacing because the tokens provided are fixed values.

### Do's & Don'ts

**Do:** Always use spacing tokens when spacing out element (either margin or padding).

**Don't:** Avoid going outside the provided spacing tokens and try not to stack the spacing tokens (e.g. 16px + 20px).

### Library

**[Spacing & more](https://www.figma.com/file/wFqyJnLISAbPa0Si9UBTP9/1%29-%F0%9F%A7%AA-Design-Tokens?node-id=6%3A600)**
— Specs for spacing, border, opacity and shadow.

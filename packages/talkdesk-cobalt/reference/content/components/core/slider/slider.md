# Slider

## Guidance

Sliders allow users to quickly select a value.

### Design

### Overview

Use Sliders to let users select a value within a given range of minimum and maximum values or an isolated value.

### Anatomy

![Slider example — Anatomy](/assets/slider/anatomy.png)

1. **Active fill** - Displays the track already filled
2. **Handle** - Dragged position indicator that can be moved along the track to change the value
3. **Track** - Displays the range available for the user to select from
4. **Value** - Tooltip that specifies the selected value
5. **Minimum value** - Dual range slider for setting a minimum value
6. **Maximum value** - Dual range slider for setting a maximum value

### Variants

#### States

![Slider example — Variants States: Default](/assets/slider/states-default.png)
*Default*

  ![Slider example — Variants States: Active (Dragging)](/assets/slider/states-active-dragging.png)
*Active (Dragging)*

  ![Slider example — Variants States: Disabled](/assets/slider/states-disabled.png)
*Disabled*

#### Modifiers

The Slider can be either a single-point slider for setting a single value or a dual-range slider for setting a minimum and maximum value.

![Slider example — Variants Modifiers: Single-point](/assets/slider/modifiers-single-point.png)
*Single-point*

  ![Slider example — Variants Modifiers: Single-point with Tooltip](/assets/slider/modifiers-single-point-with-tooltip.png)
*Single-point with Tooltip*

![Slider example — Variants Modifiers: Range](/assets/slider/modifiers-range.png)
*Range*
Allows users to select both an upper and a lower limit.

  ![Slider example — Variants Modifiers: Range with Tooltip](/assets/slider/modifiers-range-with-tooltip.png)
*Range with Tooltip*

#### Progress

This is a progress visual indicator in Figma to help designers provide more context in their explorations.

![Slider example — Variants Progress: 0%](/assets/slider/progress-0.png)
*0%*

  ![Slider example — Variants Progress: 25%](/assets/slider/modifiers-single-point.png)
*25%*

  ![Slider example — Variants Progress: 50%](/assets/slider/states-default.png)
*50%*

![Slider example — Variants Progress: 75%](/assets/slider/progress-75.png)
*75%*

  ![Slider example — Variants Progress: 100%](/assets/slider/progress-100.png)
*100%*

### Guidelines

#### Use cases

Use sliders when you want users to see their options instead of reading them.

**When you should use a slider**

* When you want users to see their minimum and maximum options more visually.
* When you have enough space.
* When dealing with degrees of comparison (e.g. size, money, etc).

#### Best practices

##### Single-point

A slider by default will **always have a preselected value**. As a general rule, when it comes to anything dealing with money, you should set the default to the lowest option, and for everything else, you can choose to set it to the middle or default.

**Do:** In general, choose to set it to the middle or default (lowest).
![Do example](/assets/slider/do-s-don-ts-single-point.png)

**Don't:** Related to money, don't set it to the middle
![Don't example](/assets/slider/do-s-don-ts-single-point-2.png)

##### Range

**Do:** Use it to indicate a range of simple values. For range sliders, set the whole range preselected as the default.
![Do example](/assets/slider/do-s-don-ts-range-do.png)

**Don't:** Don't use a range if choosing a specific value is important. The slider interaction isn't as precise as explicitly typing or choosing an option from a list.
![Don't example](/assets/slider/do-s-don-ts-range-dont.png)

![Don't example](/assets/slider/do-s-don-ts-range-dont-2.png)
*Don't*
Dont use ranges that are too small, for example, 1-3.

![Don't example](/assets/slider/do-s-don-ts-range-dont-3.png)
*Don't*
Don't use for ranges extremely largers, for example, 1-1000.

### Behavior

#### Interaction

The user should be able to move the slider to whatever value they feel is necessary. Whenever the Handle is moved, the informative Popup must appear with the corresponding value.

#### Dimensions

The width of a slider can be customized appropriately for its context.

![Slider example — Variants Dimensions](/assets/slider/variants-dimensions.png)

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > Slider`

* [Slider component](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=2307-476509\&mode=design) — Core components library

💡 This component has not yet been developed. How about helping build it in our Marketplace repository? [Learn more](https://talkdesk.atlassian.net/wiki/spaces/COB/pages/3924069644/Engineering+contribution+process)

### Code

### Package

No Cobalt package implements Slider yet: there is none in Cobalt core or Cobalt Marketplace (checked
against both repositories on 2026-10-20). ZeroHeight's Resources section says the same.

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

For accessibility guidance that applies to every component, see
[Accessibility](/foundations/accessibility/overview/).

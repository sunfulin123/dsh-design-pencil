# DatePicker

> **Cobalt core** component · `@talkdesk/cobalt-react-date-picker`
>
> Not the same as [DatePicker (Cobalt Marketplace)](../../../components/marketplace/datepicker/datepicker.md), `@talkdesk/cobalt-marketplace-react-datepicker`: a separate package with its own API. Check which one the code imports before using either.
>
> Related (Date picker): [Calendar](../../../components/core/calendar/calendar.md), `@talkdesk/cobalt-react-calendar`.

## Install (v1.1.0)

```sh
npm install @talkdesk/cobalt-react-date-picker
```

```tsx
import { DatePicker, DateRangePicker } from "@talkdesk/cobalt-react-date-picker";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-datepicker-docs--docs)

## Guidance

Can be used to select dates in the near future or past.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The DatePicker gives users the ability to choose dates from a visual calendar that’s consistently applied wherever dates need to be selected across Talkdesk products.

### Anatomy

![Datepicker example — Anatomy](/assets/datepicker/anatomy.png)

1. **Previous and next month selectors** - To move forward or backward one month at a time
2. **Month selector** - Choose the specific month
3. **Year selector** - Choose the specific year
4. **Weekday indicator** - Days of the week
5. **Day indicator** - Days in the month
6. **Current date indicator** - Specify the current date to the user
7. **Selected range highlight**
8. **Selected range start date**
9. **Selected range start end**

### Variants

#### States

##### DatePicker

![Datepicker example — States DatePicker: Default](/assets/datepicker/datepicker-default.png)
*Default*

  ![Datepicker example — States DatePicker: Active](/assets/datepicker/datepicker-active.png)
*Active*

  ![Datepicker example — States DatePicker: Active Range](/assets/datepicker/datepicker-active-range.png)
*Active Range*

##### DatePickerItem

![Datepicker example — States DatePickerItem: Item/Default](/assets/datepicker/datepickeritem-item-default.png)
*Item/Default*

  ![Datepicker example — States DatePickerItem: Item/Hover](/assets/datepicker/datepickeritem-item-hover.png)
*Item/Hover*

  ![Datepicker example — States DatePickerItem: Item/Active](/assets/datepicker/datepickeritem-item-active.png)
*Item/Active*

![Datepicker example — States DatePickerItem: Item/Disabled](/assets/datepicker/datepickeritem-item-disabled.png)
*Item/Disabled*

  ![Datepicker example — States DatePickerItem: Item/CurrentDay](/assets/datepicker/datepickeritem-item-currentday.png)
*Item/CurrentDay*

  ![Datepicker example — States DatePickerItem: Item/Disabled CurrentDay](/assets/datepicker/datepickeritem-item-disabled-currentday.png)
*Item/Disabled CurrentDay*

![Datepicker example — States DatePickerItem: Item/Active First](/assets/datepicker/datepickeritem-item-active-first.png)
*Item/Active First*

  ![Datepicker example — States DatePickerItem: Item/Active Range](/assets/datepicker/datepickeritem-item-active-range.png)
*Item/Active Range*

  ![Datepicker example — States DatePickerItem: Item/Active Last](/assets/datepicker/datepickeritem-item-active-last.png)
*Item/Active Last*

#### Modifiers

![Datepicker example — Variants Modifiers: With Navigation (Default)](/assets/datepicker/modifiers-with-navigation-default.png)
*With Navigation (Default)*
The default stage of the DatePicker.

  ![Datepicker example — Variants Modifiers: Selected Day](/assets/datepicker/modifiers-selected-day.png)
*Selected Day*
The day selected by the user.

  ![Datepicker example — Variants Modifiers: Disabled Days](/assets/datepicker/modifiers-disabled-days.png)
*Disabled Days*
Days that aren't available to be picked.

![Datepicker example — Variants Modifiers: Highlighted Days](/assets/datepicker/modifiers-highlighted-days.png)
*Highlighted Days*
Depending on the case, you could highlight specific days to inform the user about relevant days to be picked.

  ![Datepicker example — Variants Modifiers: With Today Highlighted](/assets/datepicker/modifiers-with-today-highlighted.png)
*With Today Highlighted*
A visual reminder about the current day.

  ![Datepicker example — Variants Modifiers: Starting On A Different Weekday](/assets/datepicker/modifiers-starting-on-a-different-weekday.png)
*Starting On A Different Weekday*
Usually, the weekday starts on Sundays. However, this can be customized.

![Datepicker example — Variants Modifiers: Custom Weekdays](/assets/datepicker/modifiers-custom-weekdays.png)
*Custom Weekdays*
As a default behavior, the DatePicker weekdays are written in English. However, this can be customized to support different languages.

  ![Datepicker example — Variants Modifiers: Custom Months](/assets/datepicker/modifiers-custom-months.png)
*Custom Months*
As a default behavior, the DatePicker months are written in English. However, this can be customized to support different languages.

  ![Datepicker example — Variants Modifiers: With TimePicker](/assets/datepicker/modifiers-with-timepicker.png)
*With TimePicker*
You can use the DatePicker with the TimePicker component, a common use case mapped as our DatePickerPattern.

#### Position

##### Below input

The DatePicker will be opened below the originated input as default.

![Datepicker example — Position Below input](/assets/datepicker/position-below-input.png)

##### Above input

It also can be opened from the top when there is no available space on the page to the bottom

![Datepicker example — Position Above input](/assets/datepicker/position-above-input.png)

### Guidelines

#### Use cases

##### Changing the month

Pick a different month in the month button inside the DatePicker or change it manually in the InputGroup.

![Datepicker example — Use cases Changing the month](/assets/datepicker/use-cases-changing-the-month.png)

##### Changing the year

Pick a different year in the dropdown options inside the DatePicker or change it manually in the InputGroup.

![Datepicker example — Use cases Changing the year](/assets/datepicker/use-cases-changing-the-year.png)

##### Technical limitations

Due to some technical limitations, sometimes the user can only select dates within a 30-day range at any given time. A short message informs the user about the condition and blocks the possibility of adding more days to the range period.

Use case for reference [here](https://www.figma.com/file/RhpVFBHRiadKUb6mAeKgKJ/23Spring_Customer-Journey-Analytics?type=design\&node-id=750%3A372428\&t=nSpGD8FbdXBe5qHT-1) (IA).

![Datepicker example — Use cases Technical limitations](/assets/datepicker/use-cases-technical-limitations.png)

##### Selecting a range with invalid dates

Sometimes, users can select a date range that included invalid dates. We allow selecting the range, but the days that are invalid should still appear disabled.

After this, we need to inform the user that those dates will not be considered.

We can due it as a hint under the input or as a message in the UI, according to the use case.

![Datepicker example — Use cases Selecting a range with invalid dates: Range selection with invalid dates](/assets/datepicker/dates-range-selection-with-invalid-dates.png)
*Range selection with invalid dates*

##### Custom option

If you need to add more than one DatePicker with a popup in the same form/panel/page, you should follow these best practices:

**Do**
- If you need a custom item, combine it in one dropdown by providing the custom option and then exhibiting the InputGroup after selecting it.
- When selecting any other option, hide the InputGroup with the custom option.
![Do example](/assets/datepicker/use-cases-custom-option-do-2.png)

**Don't:** Avoid having more than one input to open different DatePickers (e.g. one input for predefined options and another for custom options)
![Don't example](/assets/datepicker/use-cases-custom-option-dont.png)

#### Placeholder

![Datepicker example — Guidelines Placeholder: Single](/assets/datepicker/placeholder-single.png)
*Single*

  ![Datepicker example — Guidelines Placeholder: Range](/assets/datepicker/placeholder-range.png)
*Range*

Related to Filtering, consider following [these](/patterns/search-filtering-and-sorting/) specific guidelines.

#### Best practices

**Do**
- For navigating dates in both the near future or past and the distant future or past, providing multiple ways to select dates.
- Use it when it is useful for the user to see how the selected date is related to other dates and/or which weekday it is.
- Allows to enter the data via the keyboard directly into the input if the user prefers to interact this way.
![Do example](/assets/datepicker/guidelines-do-s-don-ts-do-3.png)

**Don't**
- Don't close after a single date is selected unless a range with a start and end date is required.
- Avoid using it to enter a familiar date, like a birthday. Prefer to use a regular Text Input instead and consider implementing input masking.
![Don't example](/assets/datepicker/guidelines-do-s-don-ts-dont-2.png)

### Behavior

#### Responsiveness

When using it isolated:

![Datepicker example — Behavior Responsiveness](/assets/datepicker/behavior-responsiveness.gif)

The content is resized acording to the width.

When using it inside a popup or any element:

![Datepicker example — Behavior Responsiveness](/assets/datepicker/behavior-responsiveness-2.gif)

The component always occupies the width of the content.

#### Interaction

When opening a DatePicker you'll be able to:

* Change the months by selecting the name of the month
* Change the year by clicking on the dropdown
* Choose a specific date or a range

![Datepicker example — Behavior Interaction](/assets/datepicker/behavior-interaction.gif)

#### Dimensions

DatePicker doesn't have a defined width. It always occupies the width of the content, so it will always have the width of the **popup** where it is.

However, we recommend a min-width of `300px` whenever possible.

### Resources

Access this Cobalt component from: `Cobalt Design System > Cobalt Core Components > DatePicker`

* [DatePicker](https://www.figma.com/file/F3P45YCDsmcmsm01iFIM8s/2---%E2%9A%9B%EF%B8%8F-Core-Components?type=design\&node-id=868-79141\&mode=design) — Core components library

* [DatePicker Handoff](https://www.figma.com/file/o1okDlSciNFIyJzEmB7Vws/5---%F0%9F%94%8D-Handoffs?type=design\&node-id=374-214261\&mode=design) — Specs

* [Calendar](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/calendar--primary-story) — Storybook > Atomic component

* [DatePicker](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/marketplace_marketplace-components-datepicker-stories--default) — Storybook > Marketplace

* [DatePicker Range](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/marketplace_marketplace-components-daterangepicker-stories--default) — Storybook > Marketplace

### Code

### Props

### Examples

### Content

### Writing guidelines

This component has no component-specific copy rules yet. For copy rules that apply
everywhere, see [Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

DatePicker is built on react-aria's `DatePicker`. The date is typed in segments (day, month and year)
that also change with the arrow keys, and the calendar opens in a dialog with a keyboard-navigable grid.

* Give it a `label`, so the field has an accessible name.
* Core DatePicker selects a single date. Selecting a range is the Cobalt Marketplace
  [DateRangePicker](/components/marketplace/daterangepicker/).

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### DatePicker

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `size` | enum | `small`, `medium` | no |  |  |
| `popoverProps` | Pick<Props, "placement" \| "offset" \| "crossOffset" \| "shouldFlip"> |  | no |  | Options for the popover that holds the calendar. |
| `inputRef` | Ref<HTMLDivElement> |  | no |  |  |
| `calendarProps` | Pick<Props, "hideYearPicker" \| "visibleYears" \| "isDateHighlighted"> |  | no |  | Options for the calendar inside the popover. |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `autoComplete` | string |  | no |  | Describes the type of autocomplete functionality the input should provide if any. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefautocomplete). |
| `pageBehavior` | PageBehavior | `single`, `visible` | no |  | Controls the behavior of paging. Pagination either works by advancing the visible page by visibleDuration (default) or one unit of visibleDuration. @default visible |
| `firstDayOfWeek` | "sun" \| "mon" \| "tue" \| "wed" \| "thu" \| "fri" \| "sat" | `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat` | no |  | The day that starts the week. |
| `minValue` | DateValue |  | no |  | The minimum allowed date that a user may select. |
| `maxValue` | DateValue |  | no |  | The maximum allowed date that a user may select. |
| `isDateUnavailable` | (date: DateValue) => boolean |  | no |  | Callback that is called for each date of the calendar. If it returns true, then the date is unavailable. |
| `placeholderValue` | T |  | no |  | A placeholder date that influences the format of the placeholder shown when no value is selected. Defaults to today's date at midnight. |
| `shouldForceLeadingZeros` | boolean |  | no |  | Whether to always show leading zeros in the month, day, and hour fields. By default, this is determined by the user's locale. |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `validate` | (value: MappedDateValue<T>) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |
| `value` | T |  | no |  | The current value (controlled). |
| `defaultValue` | T |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: MappedDateValue<T>) => void |  | no |  | Handler that is called when the value changes. |
| `name` | string |  | no |  | The name of the input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `shouldCloseOnSelect` | boolean \| (() => boolean) |  | no |  | Determines whether the date picker popover should close automatically when a date is selected. @default true |

### DateRangePicker

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `label` | ReactNode |  | no |  |  |
| `secondaryLabel` | ReactNode |  | no |  |  |
| `tertiaryLabel` | ReactNode |  | no |  |  |
| `description` | ReactNode |  | no |  |  |
| `hint` | ReactNode |  | no |  |  |
| `errorMessage` | ChildrenOrFunction<FieldErrorRenderProps> |  | no |  |  |
| `warningMessage` | ReactNode |  | no |  |  |
| `size` | enum | `small`, `medium` | no |  |  |
| `popoverProps` | Pick<Props, "placement" \| "offset" \| "crossOffset" \| "shouldFlip"> |  | no |  | Options for the popover that holds the calendar. |
| `startInputRef` | Ref<HTMLDivElement> |  | no |  | Ref of the element that holds the segments of the start date. |
| `endInputRef` | Ref<HTMLDivElement> |  | no |  | Ref of the element that holds the segments of the end date. |
| `calendarProps` | Pick<Props, "hideYearPicker" \| "visibleYears" \| "isDateHighlighted"> |  | no |  | Options for the calendar inside the popover. |
| `validationBehavior` | "native" \| "aria" | `native`, `aria` | no |  | Whether to use native HTML form validation to prevent form submission when the value is missing or invalid, or mark the field as required or invalid via ARIA. @default 'native' |
| `validate` | (value: RangeValue<MappedDateValue<T>>) => true \| ValidationError |  | no |  | A function that returns an error message if a given value is invalid. Validation errors are displayed to the user when the form is submitted if `validationBehavior="native"`. For realtime validation, use the `isInvalid` prop instead. |
| `isDateUnavailable` | (date: DateValue, anchorDate: CalendarDate) => boolean |  | no |  | Callback that is called for each date of the calendar. If it returns true, then the date is unavailable. |
| `pageBehavior` | PageBehavior | `single`, `visible` | no |  | Controls the behavior of paging. Pagination either works by advancing the visible page by visibleDuration (default) or one unit of visibleDuration. @default visible |
| `firstDayOfWeek` | "sun" \| "mon" \| "tue" \| "wed" \| "thu" \| "fri" \| "sat" | `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat` | no |  | The day that starts the week. |
| `minValue` | DateValue |  | no |  | The minimum allowed date that a user may select. |
| `maxValue` | DateValue |  | no |  | The maximum allowed date that a user may select. |
| `placeholderValue` | T |  | no |  | A placeholder date that influences the format of the placeholder shown when no value is selected. Defaults to today's date at midnight. |
| `shouldForceLeadingZeros` | boolean |  | no |  | Whether to always show leading zeros in the month, day, and hour fields. By default, this is determined by the user's locale. |
| `isDisabled` | boolean |  | no |  | Whether the input is disabled. |
| `isReadOnly` | boolean |  | no |  | Whether the input can be selected but not changed by the user. |
| `isRequired` | boolean |  | no |  | Whether user input is required on the input before form submission. |
| `isInvalid` | boolean |  | no |  | Whether the input value is invalid. |
| `onFocus` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element receives focus. |
| `onBlur` | (e: FocusEvent<Element, Element>) => void |  | no |  | Handler that is called when the element loses focus. |
| `onFocusChange` | (isFocused: boolean) => void |  | no |  | Handler that is called when the element's focus status changes. |
| `onKeyDown` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is pressed. |
| `onKeyUp` | (e: KeyboardEvent) => void |  | no |  | Handler that is called when a key is released. |
| `isOpen` | boolean |  | no |  | Whether the overlay is open by default (controlled). |
| `defaultOpen` | boolean |  | no |  | Whether the overlay is open by default (uncontrolled). |
| `onOpenChange` | (isOpen: boolean) => void |  | no |  | Handler that is called when the overlay's open state changes. |
| `form` | string |  | no |  | The `<form>` element to associate the input with. The value of this attribute must be the id of a `<form>` in the same document. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#form). |
| `allowsNonContiguousRanges` | boolean |  | no |  | When combined with `isDateUnavailable`, determines whether non-contiguous ranges, i.e. ranges containing unavailable dates, may be selected. |
| `startName` | string |  | no |  | The name of the start date input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `endName` | string |  | no |  | The name of the end date input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname). |
| `value` | RangeValue<T> |  | no |  | The current value (controlled). |
| `defaultValue` | RangeValue<T> |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: RangeValue<MappedDateValue<T>>) => void |  | no |  | Handler that is called when the value changes. |
| `shouldCloseOnSelect` | boolean \| (() => boolean) |  | no |  | Determines whether the date picker popover should close automatically when a date is selected. @default true |

## Examples

_16 of 17 compile against the published `@talkdesk/cobalt-react-date-picker@1.1.0` (React 18, TypeScript strict)._

### Default

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";

<DatePicker label="Birthday" />
```

### With default value

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker label="Birthday" defaultValue={createCalendarDate(2026, 10, 12)} />
```

### Controlled

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

const [value, setValue] = useState(createCalendarDate(2026, 10, 12));

<DatePicker label="Birthday" value={value} onChange={setValue} />

<p>Selected: {value ? value.toString() : "none"}</p>
```

### Sizes

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";

<DatePicker label="Small" size="small" />
<DatePicker label="Medium" size="medium" />
```

### With hint

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";

<DatePicker
  label="Birthday"
  hint="Type the date or pick it from the calendar"
/>
```

### Leading zeros

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Birthday"
  defaultValue={createCalendarDate(2026, 2, 3)}
  shouldForceLeadingZeros
/>
```

### Min and max

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Appointment"
  defaultValue={createCalendarDate(2026, 10, 12)}
  minValue={createCalendarDate(2026, 10, 5)}
  maxValue={createCalendarDate(2026, 10, 25)}
/>
```

### Unavailable dates

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Appointment"
  defaultValue={createCalendarDate(2026, 10, 12)}
  // Weekends.
  isDateUnavailable={(date) => {
    const day = date.toDate("UTC").getUTCDay();

    return day === 0 || day === 6;
  }}
/>
```

### Required

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";

<DatePicker label="Birthday" isRequired />
```

### Invalid

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";

<DatePicker
  label="Birthday"
  isInvalid
  errorMessage="Enter a valid date"
/>
```

### With warning message

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Birthday"
  defaultValue={createCalendarDate(1900, 1, 1)}
  warningMessage="This date is a long time ago"
/>
```

### Disabled

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Birthday"
  defaultValue={createCalendarDate(2026, 10, 12)}
  isDisabled
/>
```

### Read only

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Birthday"
  defaultValue={createCalendarDate(2026, 10, 12)}
  isReadOnly
/>
```

### Calendar options

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";

<DatePicker
  label="Birthday"
  defaultValue={createCalendarDate(2026, 10, 12)}
  calendarProps={{
    hideYearPicker: true,
    isDateHighlighted: (date) => date.day === 1,
  }}
/>
```

### Popover options

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";

<DatePicker
  label="Birthday"
  popoverProps={{ placement: "bottom end", offset: 16 }}
/>
```

### Locale

> **Doesn't compile:** imports `@talkdesk/cobalt-react-i18n-provider`, which isn't a published package. Fix it before use.

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { createCalendarDate } from "@talkdesk/cobalt-react-calendar";
import { I18nProvider } from "@talkdesk/cobalt-react-i18n-provider";

<I18nProvider locale="pt-PT">
  <DatePicker
    label="Data de nascimento"
    defaultValue={createCalendarDate(2026, 10, 12)}
  />
</I18nProvider>
```

### In input group

```tsx
import { DatePicker } from "@talkdesk/cobalt-react-date-picker";
import { Group, GroupItem, GroupLabel } from "@talkdesk/cobalt-react-input-group";

<Group aria-label="Start date">
  <GroupLabel>Starts on</GroupLabel>
  <GroupItem>
    <DatePicker aria-label="Date" />
  </GroupItem>
</Group>
```

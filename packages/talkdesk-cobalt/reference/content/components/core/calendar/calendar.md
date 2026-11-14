# Calendar

> **Cobalt core** component · `@talkdesk/cobalt-react-calendar`
>
> Related (Date picker): [DatePicker](../../../components/core/date-picker/date-picker.md), `@talkdesk/cobalt-react-date-picker`.

## Install (v3.0.1)

```sh
npm install @talkdesk/cobalt-react-calendar
```

```tsx
import { Calendar, RangeCalendar, createCalendarDate, createCalendarDateTime, CalendarDate, CalendarDateTime, ZonedDateTime, fromDate, getLocalTimeZone, isSameDay, isSameMonth, isSameYear, isToday, isWeekend, now, parseAbsolute, parseAbsoluteToLocal, parseDate, parseDateTime, parseZonedDateTime, toCalendarDate, toCalendarDateTime, toLocalTimeZone, toZoned, today } from "@talkdesk/cobalt-react-calendar";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt/docs/index.html?path=/docs/design-system-components-ui-components-calendar-docs--docs)

## Known gaps

Read before using it:

* The In popover example's data-co-bleed does nothing with the published packages: the rules behind it are in cobalt-theme-base's source, but not in its latest release, 2.5.0, so the calendar stays inset in the popover.

## Guidance

Calendar is a Cobalt core component.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

Calendar is the date grid that date pickers are built on. Date-picking guidance is on the [DatePicker](/components/core/date-picker/) page. Calendar's own props and examples are in the Code tab.

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

This component has no component-specific accessibility guidance yet. For guidance that applies
to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

### Calendar

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `hideYearPicker` | boolean |  | no |  | Replaces the year dropdown with a "Month Year" heading (which still opens the month grid). Has no effect when `hideHeader` is set. |
| `hideHeader` | boolean |  | no |  | Hides the whole header (navigation buttons, heading and year dropdown), and locks the calendar to the displayed month: keyboard navigation can't leave it either. The displayed month follows `focusedValue` when it's controlled, so a host can still change it. |
| `visibleYears` | number |  | no |  | The number of years listed in the year dropdown. Defaults to 20. |
| `isDateHighlighted` | (date: DateValue) => boolean |  | no |  | Marks a date with a dot to highlight it. |
| `selectionMode` | "single" |  | no |  | Whether single or multiple selection is enabled. @default 'single' |
| `isDateUnavailable` | (date: DateValue) => boolean |  | no |  | Callback that is called for each date of the calendar. If it returns true, then the date is unavailable. |
| `minValue` | DateValue |  | no |  | The minimum allowed date that a user may select. |
| `maxValue` | DateValue |  | no |  | The maximum allowed date that a user may select. |
| `isDisabled` | boolean |  | no |  | Whether the calendar is disabled. @default false |
| `isReadOnly` | boolean |  | no |  | Whether the calendar value is immutable. @default false |
| `focusedValue` | DateValue |  | no |  | Controls the currently focused date within the calendar. |
| `defaultFocusedValue` | DateValue |  | no |  | The date that is focused when the calendar first mounts (uncontrolled). |
| `onFocusChange` | (date: CalendarDate) => void |  | no |  | Handler that is called when the focused date changes. |
| `isInvalid` | boolean |  | no |  | Whether the current selection is invalid according to application logic. |
| `firstDayOfWeek` | "sun" \| "mon" \| "tue" \| "wed" \| "thu" \| "fri" \| "sat" | `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat` | no |  | The day that starts the week. |
| `selectionAlignment` | "start" \| "center" \| "end" | `start`, `center`, `end` | no |  | Determines the alignment of the visible months on initial render based on the current selection or current date if there is no selection. @default 'center' |
| `weeksInMonth` | number |  | no |  | The number of weeks in a month. This overrides the default set by the locale. |
| `value` | T |  | no |  | The current value (controlled). |
| `defaultValue` | T |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: MappedDateValue<T>) => void |  | no |  | Handler that is called when the value changes. |
| `createCalendar` | (identifier: CalendarIdentifier) => Calendar |  | no |  | A function to create a new [Calendar](https://react-spectrum.adobe.com/internationalized/date/Calendar.html) object for a given calendar identifier. If not provided, the `createCalendar` function from `@internationalized/date` will be used. |

### RangeCalendar

_Also accepts `aria-label` and `aria-labelledby`: give it one when it has no visible label (an icon-only button, a checkbox in a table row)._

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `hideYearPicker` | boolean |  | no |  | Replaces the year dropdown with a "Month Year" heading (which still opens the month grid). Has no effect when `hideHeader` is set. |
| `hideHeader` | boolean |  | no |  | Hides the whole header (navigation buttons, heading and year dropdown), and locks the calendar to the displayed month: keyboard navigation can't leave it either. The displayed month follows `focusedValue` when it's controlled, so a host can still change it. |
| `visibleYears` | number |  | no |  | The number of years listed in the year dropdown. Defaults to 20. |
| `isDateHighlighted` | (date: DateValue) => boolean |  | no |  | Marks a date with a dot to highlight it. |
| `commitBehavior` | "clear" \| "reset" \| "select" | `clear`, `reset`, `select` | no |  | Controls the behavior when a pointer is released outside the calendar or a blur occurs mid selection:  - `clear`: clear the currently selected range of dates. - `reset`: reset the selection to the previously selected range of dates. - `select`: select the currently hovered range of dates. @default 'select' |
| `allowsNonContiguousRanges` | boolean |  | no |  | When combined with `isDateUnavailable`, determines whether non-contiguous ranges, i.e. ranges containing unavailable dates, may be selected. |
| `isDateUnavailable` | (date: DateValue, anchorDate: CalendarDate) => boolean |  | no |  | Callback that is called for each date of the calendar. If it returns true, then the date is unavailable. The second argument provides the current selection anchor date, if any. This can be used to adjust the available dates based on the user's first selected date. |
| `minValue` | DateValue |  | no |  | The minimum allowed date that a user may select. |
| `maxValue` | DateValue |  | no |  | The maximum allowed date that a user may select. |
| `isDisabled` | boolean |  | no |  | Whether the calendar is disabled. @default false |
| `isReadOnly` | boolean |  | no |  | Whether the calendar value is immutable. @default false |
| `focusedValue` | DateValue |  | no |  | Controls the currently focused date within the calendar. |
| `defaultFocusedValue` | DateValue |  | no |  | The date that is focused when the calendar first mounts (uncontrolled). |
| `onFocusChange` | (date: CalendarDate) => void |  | no |  | Handler that is called when the focused date changes. |
| `isInvalid` | boolean |  | no |  | Whether the current selection is invalid according to application logic. |
| `firstDayOfWeek` | "sun" \| "mon" \| "tue" \| "wed" \| "thu" \| "fri" \| "sat" | `sun`, `mon`, `tue`, `wed`, `thu`, `fri`, `sat` | no |  | The day that starts the week. |
| `selectionAlignment` | "start" \| "center" \| "end" | `start`, `center`, `end` | no |  | Determines the alignment of the visible months on initial render based on the current selection or current date if there is no selection. @default 'center' |
| `weeksInMonth` | number |  | no |  | The number of weeks in a month. This overrides the default set by the locale. |
| `value` | RangeValue<T> |  | no |  | The current value (controlled). |
| `defaultValue` | RangeValue<T> |  | no |  | The default value (uncontrolled). |
| `onChange` | (value: RangeValue<MappedDateValue<T>>) => void |  | no |  | Handler that is called when the value changes. |
| `createCalendar` | (identifier: CalendarIdentifier) => Calendar |  | no |  | A function to create a new [Calendar](https://react-spectrum.adobe.com/internationalized/date/Calendar.html) object for a given calendar identifier. If not provided, the `createCalendar` function from `@internationalized/date` will be used. |

## Examples

_11 of 14 compile against the published `@talkdesk/cobalt-react-calendar@3.0.1` (React 18, TypeScript strict)._

### Basic

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
/>;
```

### Without year picker

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  hideYearPicker
/>;
```

### Without header

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  hideHeader
/>;
```

### Custom navigation

```tsx
import { useState } from "react";
import Button from "@talkdesk/cobalt-react-button";
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

const [focusedDate, setFocusedDate] = useState(createCalendarDate(2026, 10, 1));

<Button onPress={() => setFocusedDate(focusedDate.subtract({ months: 1 }))}>
  Previous month
</Button>
<Button onPress={() => setFocusedDate(focusedDate.add({ months: 1 }))}>
  Next month
</Button>
<Calendar
  aria-label="Appointment date"
  focusedValue={focusedDate}
  onFocusChange={setFocusedDate}
  hideHeader
/>;
```

### Controlled

```tsx
import { useState } from "react";
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

const [date, setDate] = useState(createCalendarDate(2026, 10, 12));

<Calendar aria-label="Appointment date" value={date} onChange={setDate} />;
```

### Min max

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  minValue={createCalendarDate(2026, 10, 5)}
  maxValue={createCalendarDate(2026, 12, 18)}
/>;
```

### Unavailable

> **Doesn't compile:** imports `@talkdesk/cobalt-react-i18n-provider`, which isn't a published package. Fix it before use.

```tsx
import { Calendar, isWeekend } from "@talkdesk/cobalt-react-calendar";
import { useLocale } from "@talkdesk/cobalt-react-i18n-provider";

const { locale } = useLocale();

<Calendar
  aria-label="Appointment date"
  isDateUnavailable={(date) => isWeekend(date, locale)}
/>;
```

### Highlighted

```tsx
import {
  Calendar,
  createCalendarDate,
  isSameDay,
} from "@talkdesk/cobalt-react-calendar";

const eventDays = [
  createCalendarDate(2026, 10, 6),
  createCalendarDate(2026, 10, 15),
  createCalendarDate(2026, 10, 21),
];

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  isDateHighlighted={(date) => eventDays.some((day) => isSameDay(day, date))}
/>;
```

### Disabled

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  isDisabled
/>;
```

### Read only

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  isReadOnly
/>;
```

### Invalid

```tsx
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<Calendar
  aria-label="Appointment date"
  defaultValue={createCalendarDate(2026, 10, 12)}
  isInvalid
/>;
```

### Localized

> **Doesn't compile:** imports `@talkdesk/cobalt-react-i18n-provider`, which isn't a published package. Fix it before use.

```tsx
import { I18nProvider } from "@talkdesk/cobalt-react-i18n-provider";
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<I18nProvider locale="pt-PT">
  <Calendar
    aria-label="Data da consulta"
    defaultValue={createCalendarDate(2026, 10, 12)}
  />
</I18nProvider>;
```

### RTL

> **Doesn't compile:** imports `@talkdesk/cobalt-react-i18n-provider`, which isn't a published package. Fix it before use.

```tsx
import { I18nProvider } from "@talkdesk/cobalt-react-i18n-provider";
import {
  Calendar,
  createCalendarDate,
} from "@talkdesk/cobalt-react-calendar";

<I18nProvider locale="ar-EG">
  <div dir="rtl">
    <Calendar
      aria-label="تاريخ الموعد"
      defaultValue={createCalendarDate(2026, 10, 12)}
    />
  </div>
</I18nProvider>;
```

### In popover

```tsx
import { useState } from "react";
import { useDateFormatter } from "react-aria";
import Button from "@talkdesk/cobalt-react-button";
import {
  Popover,
  PopoverDialog,
  PopoverTrigger,
} from "@talkdesk/cobalt-react-popover";
import {
  Calendar,
  createCalendarDate,
  getLocalTimeZone,
} from "@talkdesk/cobalt-react-calendar";

const [date, setDate] = useState(createCalendarDate(2026, 10, 12));
const formatter = useDateFormatter({
  year: "numeric",
  month: "short",
  day: "numeric",
});

<PopoverTrigger>
  <Button type="secondary" variation="outline">
    {formatter.format(date.toDate(getLocalTimeZone()))}
  </Button>
  <Popover placement="bottom start">
    <PopoverDialog aria-label="Appointment date">
      {({ close }) => (
        <Calendar
          data-co-bleed="inline"
          value={date}
          onChange={(value) => {
            setDate(value);
            close();
          }}
        />
      )}
    </PopoverDialog>
  </Popover>
</PopoverTrigger>;
```

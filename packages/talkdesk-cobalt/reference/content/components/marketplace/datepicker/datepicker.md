# DatePicker

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-datepicker`
>
> Not the same as [DatePicker (Cobalt core)](../../../components/core/date-picker/date-picker.md), `@talkdesk/cobalt-react-date-picker`: a separate package with its own API. Check which one the code imports before using either.
>
> Related (Date range): [DateRangePicker](../../../components/marketplace/daterangepicker/daterangepicker.md), `@talkdesk/cobalt-marketplace-react-daterangepicker`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-datepicker
```

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-datepicker-stories--default)

## Known gaps

Read before using it:

* The previous and next month buttons are icon-only (chevron_left / chevron_right) with no aria-label, so they have no accessible name.
* The year Dropdown gets no label or aria-labelledby, and there is no prop to pass one, so it has no accessible name.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-calendar`](../../../components/core/calendar/calendar.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

DatePicker is the Cobalt Marketplace date picker, built on the Cobalt core Calendar. Cobalt core has its own [DatePicker](/components/core/date-picker/): a separate package with a different API.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for date pickers is on the Cobalt core [DatePicker](/components/core/date-picker/) page. Its own props and examples are in the Code tab. For a date range, see [DateRangePicker](/components/marketplace/daterangepicker/).

#### Against the guidance

Checked against the package source (DateRangePicker shares the same code):

* **An inline calendar only.** There is no input and no popup, so opening below the input (or above
  it when there is no room) is up to the page, for example with an InputGroup and a StatefulPopup.
* **Navigation is off by default.** The previous and next month buttons, the month selector and the
  year dropdown appear only with `withNavigation` and a list of `availableYears`.
* **The current date is not marked by default.** Set `highlightToday`.
* **Ranges with invalid dates** work as the guidance says: a range can span disabled days, which stay
  disabled. Telling the user those days are excluded is up to the page.
* **The 30-day range limit** is not built in; the page has to enforce it and show the message.
* **Width** follows the container, as the guidance says.

### Code

### Props

### Examples

### Content

### Writing guidelines

This component follows the core page's content guidelines. For copy rules that apply everywhere, see
[Grammar and mechanics](/foundations/content/content-grammar-and-mechanics/).

### Accessibility

### Considerations

#### Development

The accessibility guidance is on the core [DatePicker](/components/core/date-picker/) page. Checked against
this package's source (both known gaps are in the Code tab):

* The previous and next month buttons are icon-only and have no accessible name.
* The year dropdown has no label: the component does not pass one, and offers no prop to set it.
* The month buttons show the selected month visually only.
* The day grid comes from the Cobalt core Calendar; it was not checked here.

For guidance that applies to every component, see [Accessibility](/foundations/accessibility/overview/).

## Props

_Also accepts `className` and `style`._

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `availableYears` | number[] |  | no | [] | This prop is mandatory if you are using `withNavigation` |
| `disabledDays` | DaysType |  | no | [] | `({ end?: Day; start?: Day } \| Day)[]` |
| `highlightToday` | boolean |  | no | false |  |
| `highlightedDays` | DaysType |  | no | [] | `({ end?: Day; start?: Day } \| Day)[]` |
| `month` | number |  | no |  | Month shown when component is rendered. By default is the current month |
| `months` | Months |  | no | {   1: "January",   2: "February",   3: "March",   4: "April",   5: "May",   6: "June",   7: "July",   8: "August",   9: "September",   10: "October",   11: "November",   12: "December", } | Custom months names. By default they are in English and you are not forced to set them |
| `onDayClick` | CallbackDate |  | no |  | `(date: Day) => void` |
| `selectedDay` | Day |  | no |  | `{ year: number; month: number; day: number; }` |
| `weekdays` | Weekdays |  | no | {   MON: "Mon",   TUE: "Tue",   WED: "Wed",   THU: "Thu",   FRI: "Fri",   SAT: "Sat",   SUN: "Sun", } | Custom weekdays names. By default they are in English and you are not forced to set them |
| `weekStart` | enum | `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN` | no | SUN | First day of the week. The default is Sunday to maintain the same behaviour as we had in the V1 component |
| `withNavigation` | boolean |  | no |  | Shows month navigation and year selection. Requires to also set the prop `availableYears` |
| `year` | number |  | no |  | Year shown when component is rendered. By default is the current year |
| `onDayMouseEnter` | CallbackDate |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_9 of 10 compile against the published `@talkdesk/cobalt-marketplace-react-datepicker@2.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import React, { useState } from "react";
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";
import { Day } from "@talkdesk/cobalt-marketplace-react-datepicker-utils";

const [selectedDay, setSelectedDay] = useState<Day>();

<DatePicker
  onDayClick={setSelectedDay}
  selectedDay={selectedDay}
/>;
```

### With navigation

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker
  withNavigation
  availableYears={[2020, 2021, 2022]}
/>;
```

### Selected day

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker
  selectedDay={{
    year: 2022,
    month: 1,
    day: 31,
  }}
/>;
```

### Disabled days

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker
  disabledDays={[
    { year: 2022, month: 1, day: 5 },
    { year: 2022, month: 1, day: 10 },
    {
      start: { year: 2022, month: 1, day: 15 },
      end: { year: 2022, month: 1, day: 18 },
    },
    {
      end: { year: 2022, month: 1, day: 2 },
    },
    {
      start: { year: 2022, month: 1, day: 29 },
    },
  ]}
/>;
```

### Highlighted days

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker
  highlightedDays={[
    { year: 2022, month: 1, day: 5 },
    { year: 2022, month: 1, day: 10 },
    {
      start: { year: 2022, month: 1, day: 15 },
      end: { year: 2022, month: 1, day: 18 },
    },
    {
      end: { year: 2022, month: 1, day: 2 },
    },
    {
      start: { year: 2022, month: 1, day: 29 },
    },
  ]}
/>;
```

### With today highlighted

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker highlightToday />;
```

### Custom months

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker
  withNavigation
  months={{
    1: "Janeiro",
    2: "Fevereiro",
    3: "Março",
    4: "Abril",
    5: "Maio",
    6: "Junho",
    7: "Julho",
    8: "Agosto",
    9: "Setembro",
    10: "Outubro",
    11: "Novembro",
    12: "Dezembro",
  }}
  availableYears={[2020, 2021, 2022]}
/>;
```

### Custom weekdays

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker
  weekdays={{
    MON: "Seg",
    TUE: "Ter",
    WED: "Qua",
    THU: "Qui",
    FRI: "Sex",
    SAT: "Sáb",
    SUN: "Dom",
  }}
/>;
```

### Start different weekday

```tsx
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";

<DatePicker weekStart="MON" />;
```

### In popup

> **Doesn't compile:** the published types reject it: Module '"@talkdesk/cobalt-react-input-group"' has no exported member 'Item'.. Fix it before use.

```tsx
import React, { useState } from "react";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import Input from "@talkdesk/cobalt-react-input";
import InputGroup, { Item } from "@talkdesk/cobalt-react-input-group";
import Label from "@talkdesk/cobalt-react-label";
import StatefulPopup from "@talkdesk/cobalt-marketplace-react-stateful-popup";
import DatePicker from "@talkdesk/cobalt-marketplace-react-datepicker";
import { Day } from "@talkdesk/cobalt-marketplace-react-datepicker-utils";

const [selectedDay, setSelectedDay] = useState<Day>();

<StatefulPopup
  fullWidthTarget
  keepOpen
  direction="S"
  origin="SW"
  target={
    <>
      <Label htmlFor="input-group">Select date</Label>
      <InputGroup id="input-group">
        <Item noHover backgroundColor="#F2F4F5" width="min">
          <Flex alignX="center" alignY="center" height="100%">
            <Icon name="calendar" size="tiny" />
          </Flex>
        </Item>
        <Item tabIndex={-1}>
          <Input
            placeholder="Date"
            value="selected date"
            variation="unstyled"
            onChange={() => null}
          />
        </Item>
      </InputGroup>
    </>
  }
>
  <DatePicker
    withNavigation
    availableYears={[2020, 2021, 2022]}
    onDayClick={setSelectedDay}
    selectedDay={selectedDay}
  />
</StatefulPopup>
```

# DateRangePicker

> **Cobalt Marketplace** component · `@talkdesk/cobalt-marketplace-react-daterangepicker`
>
> Related (Date range): [DatePicker](../../../components/marketplace/datepicker/datepicker.md), `@talkdesk/cobalt-marketplace-react-datepicker`.

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-daterangepicker
```

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";
```

[See it live in Storybook](https://prd-cdn-talkdesk.talkdesk.com/cobalt-marketplace/docs/index.html?path=/docs/marketplace-components-daterangepicker-stories--default)

## Known gaps

Read before using it:

* The previous and next month buttons are icon-only (chevron_left / chevron_right) with no aria-label, so they have no accessible name.
* The year Dropdown gets no label or aria-labelledby, and there is no prop to pass one, so it has no accessible name.

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-calendar`](../../../components/core/calendar/calendar.md), [`@talkdesk/cobalt-react-theme-provider`](../../../providers/core/theme-provider/theme-provider.md).

## Guidance

DateRangePicker is a Cobalt Marketplace component for picking a date range.

### Design

> **Interactive demo — Playground.** Not reproducible in text; see the documentation site.

### Overview

The design guidance for date pickers, single dates and ranges, is on the Cobalt core [DatePicker](/components/core/date-picker/) page. Cobalt core has no range picker yet, so this package is the one that selects a range. Its own props and examples are in the Code tab.

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

DateRangePicker uses the same month and year navigation as the marketplace
[DatePicker](/components/marketplace/datepicker/), so the same two gaps apply (listed in the Code tab):
the previous and next month buttons have no accessible name, and the year dropdown has no label.

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
| `onDayClick` | (date: DaysRange) => void |  | no |  |  |
| `selectedDay` | DaysRange |  | no |  | `{ end?: Day; start?: Day }` |
| `weekdays` | Weekdays |  | no | {   MON: "Mon",   TUE: "Tue",   WED: "Wed",   THU: "Thu",   FRI: "Fri",   SAT: "Sat",   SUN: "Sun", } | Custom weekdays names. By default they are in English and you are not forced to set them |
| `weekStart` | enum | `MON`, `TUE`, `WED`, `THU`, `FRI`, `SAT`, `SUN` | no | SUN | First day of the week. The default is Sunday to maintain the same behaviour as we had in the V1 component |
| `withNavigation` | boolean |  | no |  | Shows month navigation and year selection. Requires to also set the prop `availableYears` |
| `year` | number |  | no |  | Year shown when component is rendered. By default is the current year |
| `onDayMouseEnter` | CallbackDate |  | no |  |  |
| `forwardedRef` | Ref<HTMLDivElement> |  | no |  |  |

## Examples

_9 of 10 compile against the published `@talkdesk/cobalt-marketplace-react-daterangepicker@2.2.2` (React 18, TypeScript strict)._

### Main

```tsx
import React, { useState } from "react";
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";
import { DaysRange } from "@talkdesk/cobalt-marketplace-react-datepicker-utils";

const [selectedDay, setSelectedDay] = useState<DaysRange>();

<DateRangePicker
  onDayClick={setSelectedDay}
  selectedDay={selectedDay}
/>;
```

### With navigation

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker
  withNavigation
  availableYears={[2020, 2021, 2022]}
/>;
```

### Selected range

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker
  selectedDay={{
  start: {
    year: 2022,
    month: 2,
    day: 1,
  },
  end: {
    year: 2022,
    month: 2,
    day: 4,
  },
}}
/>;
```

### Disabled days

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker
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
      start: { year: 2022, month: 1, day: 28 },
    },
  ]}
/>;
```

### Highlighted days

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker
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
      start: { year: 2022, month: 1, day: 28 },
    },
  ]}
/>;
```

### With today highlighted

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker highlightToday />;
```

### Custom months

```tsx
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker
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
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker
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
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";

<DateRangePicker weekStart="MON" />;
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
import DateRangePicker from "@talkdesk/cobalt-marketplace-react-daterangepicker";
import { DaysRange } from "@talkdesk/cobalt-marketplace-react-datepicker-utils";

const [selectedDay, setSelectedDay] = useState<DaysRange>();

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
            value="selected dates"
            variation="unstyled"
            onChange={() => null}
          />
        </Item>
      </InputGroup>
    </>
  }
>
  <DateRangePicker
    withNavigation
    availableYears={[2020, 2021, 2022]}
    onDayClick={setSelectedDay}
    selectedDay={selectedDay}
  />
</StatefulPopup>
```

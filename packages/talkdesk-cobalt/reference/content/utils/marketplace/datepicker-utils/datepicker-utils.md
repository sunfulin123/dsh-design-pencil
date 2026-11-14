# DatepickerUtils

> **Cobalt Marketplace** util · `@talkdesk/cobalt-marketplace-react-datepicker-utils`

## Install (v2.2.2)

```sh
npm install @talkdesk/cobalt-marketplace-react-datepicker-utils
```

```tsx
import { MonthSelection, MonthYearNavigation, defaultMonths, defaultWeekdays, formatDaysForCalendar, getDateFromDayObject, getDefaultMonth, getDefaultYear } from "@talkdesk/cobalt-marketplace-react-datepicker-utils";
```

## Built on

This package composes these Cobalt core packages: [`@talkdesk/cobalt-react-box`](../../../components/core/box/box.md), [`@talkdesk/cobalt-react-button`](../../../components/core/button/button.md), [`@talkdesk/cobalt-react-divider`](../../../components/core/divider/divider.md), [`@talkdesk/cobalt-react-flex`](../../../components/core/flex/flex.md), [`@talkdesk/cobalt-react-grid`](../../../components/core/grid/grid.md), [`@talkdesk/cobalt-react-icon`](../../../components/core/icon/icon.md), [`@talkdesk/cobalt-react-typography`](../../../components/core/typography/typography.md).

## Props

### MonthSelection

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `months` | Months |  | yes |  |  |
| `onClickMonth` | (month: number) => void |  | yes |  |  |
| `selectedMonth` | number |  | yes |  |  |

### MonthYearNavigation

| Prop | Type | Options | Required | Default | Notes |
| --- | --- | --- | --- | --- | --- |
| `availableYears` | number[] |  | yes |  |  |
| `month` | number |  | yes |  |  |
| `months` | Months |  | yes |  |  |
| `onChangeMonth` | Dispatch<SetStateAction<number>> |  | yes |  |  |
| `onChangeYear` | Dispatch<SetStateAction<number>> |  | yes |  |  |
| `onClickMonth` | () => void |  | yes |  |  |
| `year` | number |  | yes |  |  |

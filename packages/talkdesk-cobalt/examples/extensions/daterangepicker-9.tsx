import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
const disabledDays = [
  {
    start: { year: 2026, month: 4, day: 11 },
    end: { year: 2026, month: 4, day: 20 },
  },
];
export default function Demo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 10),
  });
  return (
    <DateRangePicker
      label="April 11–20 disabled"
      selectedRange={range}
      disabledDays={disabledDays}
      onRangeChange={setRange}
      data-qa="disabled-days"
    />
  );
}

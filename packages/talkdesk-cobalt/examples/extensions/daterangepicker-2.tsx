import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
export default function Demo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 15),
  });
  return (
    <DateRangePicker
      isRequired
      label="Report period"
      selectedRange={range}
      onRangeChange={setRange}
      data-qa="labeled-daterangepicker"
    />
  );
}

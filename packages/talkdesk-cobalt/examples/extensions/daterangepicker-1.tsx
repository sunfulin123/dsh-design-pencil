import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
export default function Demo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 3, 10),
    endDate: new Date(2026, 3, 22),
  });
  return (
    <DateRangePicker
      selectedRange={range}
      onRangeChange={setRange}
      data-qa="basic-daterangepicker"
    />
  );
}

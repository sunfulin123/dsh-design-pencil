import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
export default function Demo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 3, 5),
    endDate: new Date(2026, 3, 20),
  });
  return (
    <DateRangePicker
      hasIcon={false}
      label="No icon"
      selectedRange={range}
      onRangeChange={setRange}
      data-qa="noicon-daterangepicker"
    />
  );
}

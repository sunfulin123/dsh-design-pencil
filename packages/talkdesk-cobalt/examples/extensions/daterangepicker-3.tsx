import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
export default function Demo() {
  const [range, setRange] = useState<DateRange>({});
  return (
    <DateRangePicker
      label="Select period"
      placeholder="From → To"
      selectedRange={range}
      onRangeChange={setRange}
      data-qa="empty-daterangepicker"
    />
  );
}

import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
export default function Demo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 30),
  });
  return (
    <DateRangePicker
      label="Custom format (DD/MM/YYYY)"
      selectedRange={range}
      onRangeChange={setRange}
      formatDate={(d) =>
        d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      }
      data-qa="custom-format"
    />
  );
}

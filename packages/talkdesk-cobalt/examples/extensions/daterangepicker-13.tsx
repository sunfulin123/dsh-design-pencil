import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const esMonths = {
  1: "Enero",
  2: "Febrero",
  3: "Marzo",
  4: "Abril",
  5: "Mayo",
  6: "Junio",
  7: "Julio",
  8: "Agosto",
  9: "Septiembre",
  10: "Octubre",
  11: "Noviembre",
  12: "Diciembre",
};
export default function Demo() {
  const [range, setRange] = useState<DateRange>({
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 15),
  });
  return (
    <Flex padding="4">
      <DateRangePicker
        label="Período (ES)"
        weekStart="MON"
        months={esMonths}
        selectedRange={range}
        onRangeChange={setRange}
        data-qa="localised"
      />
    </Flex>
  );
}

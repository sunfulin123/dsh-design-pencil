import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const range = {
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 15),
  };
  const [r1, setR1] = useState<DateRange>(range);
  const [r2, setR2] = useState<DateRange>(range);
  return (
    <Flex alignY="center" gap="6" wrap>
      <DateRangePicker label="Small" size="small" selectedRange={r1} onRangeChange={setR1} />
      <DateRangePicker
        label="Medium (default)"
        size="medium"
        selectedRange={r2}
        onRangeChange={setR2}
      />
    </Flex>
  );
}

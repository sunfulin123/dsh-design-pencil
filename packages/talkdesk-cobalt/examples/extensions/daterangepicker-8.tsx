import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [r1, setR1] = useState<DateRange>({});
  const [r2, setR2] = useState<DateRange>({
    startDate: new Date(2026, 3, 1),
    endDate: new Date(2026, 3, 15),
  });
  return (
    <Flex gap="6" wrap>
      <DateRangePicker
        label="Error — no selection"
        variation="error"
        selectedRange={r1}
        onRangeChange={setR1}
        data-qa="error"
      />
      <DateRangePicker
        label="Warning"
        variation="warning"
        selectedRange={r2}
        onRangeChange={setR2}
        data-qa="warning"
      />
    </Flex>
  );
}

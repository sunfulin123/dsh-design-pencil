import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const range = {
  startDate: new Date(2026, 3, 1),
  endDate: new Date(2026, 3, 15),
};
export default function Demo() {
  const [r1, setR1] = useState<DateRange>(range);
  const [r2, setR2] = useState<DateRange>(range);
  return (
    <Flex direction="column" gap="10" padding="4">
      <DateRangePicker
        label="Default (opens below)"
        selectedRange={r1}
        onRangeChange={setR1}
        data-qa="pos-default"
      />
      <Flex style={{ paddingTop: 280 }}>
        <DateRangePicker
          label="Opens above (direction=NE origin=SW)"
          direction="NE"
          origin="SW"
          selectedRange={r2}
          onRangeChange={setR2}
          data-qa="pos-above"
        />
      </Flex>
    </Flex>
  );
}

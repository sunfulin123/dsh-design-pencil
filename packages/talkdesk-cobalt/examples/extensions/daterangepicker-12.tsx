import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1;
export default function Demo() {
  const [range, setRange] = useState<DateRange>({});
  return (
    <Flex gap="6" padding="4" wrap>
      <DateRangePicker
        label="Highlight today + events"
        isHighlightToday
        highlightedDays={[
          { year: yyyy, month: mm, day: 3 },
          { year: yyyy, month: mm, day: 17 },
        ]}
        selectedRange={range}
        onRangeChange={setRange}
        data-qa="highlight"
      />
      <DateRangePicker
        label="Monday start + restricted years"
        weekStart="MON"
        availableYears={[yyyy - 1, yyyy, yyyy + 1]}
        selectedRange={range}
        onRangeChange={setRange}
        data-qa="weekstart"
      />
    </Flex>
  );
}

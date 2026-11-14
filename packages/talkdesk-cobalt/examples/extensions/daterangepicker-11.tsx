import type { DateRange } from "../../components/extensions/src";
import { useState } from "react";
import { DateRangePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [range, setRange] = useState<DateRange>({});
  return (
    <Flex padding="4">
      <DateRangePicker
        label="Forecast period"
        description="The selected range determines the forecast window."
        selectedRange={range}
        onRangeChange={setRange}
        data-qa="description"
      />
    </Flex>
  );
}

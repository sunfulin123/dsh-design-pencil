import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1;
export default function Demo() {
  const [v1, setV1] = useState<Date | null>(null);
  const [v2, setV2] = useState<Date | null>(null);
  return (
    <Flex gap="6" padding="4" wrap>
      <DateTimePicker
        label="Highlight today + events"
        isHighlightToday
        highlightedDays={[
          { year: yyyy, month: mm, day: 5 },
          { year: yyyy, month: mm, day: 15 },
        ]}
        value={v1}
        onChange={setV1}
        data-qa="highlight"
      />
      <DateTimePicker
        label="Monday start + restricted years"
        weekStart="MON"
        availableYears={[yyyy - 1, yyyy, yyyy + 1]}
        value={v2}
        onChange={setV2}
        data-qa="weekstart"
      />
    </Flex>
  );
}

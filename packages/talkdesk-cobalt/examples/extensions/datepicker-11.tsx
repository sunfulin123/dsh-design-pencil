import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1;
export default function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Flex gap="6" padding="4" wrap>
      <DatePicker
        label="Highlight today + custom days"
        isHighlightToday
        highlightedDays={[
          { year: yyyy, month: mm, day: 5 },
          { year: yyyy, month: mm, day: 10 },
          { year: yyyy, month: mm, day: 20 },
        ]}
        value={date}
        onChange={setDate}
        placeholder="Select a date"
        data-qa="demo-highlight"
      />
      <DatePicker
        label="Monday start + restricted years"
        weekStart="MON"
        availableYears={[yyyy - 1, yyyy, yyyy + 1]}
        value={date}
        onChange={setDate}
        placeholder="Select a date"
        data-qa="demo-weekstart"
      />
    </Flex>
  );
}

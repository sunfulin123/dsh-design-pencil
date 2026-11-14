import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Flex padding="4" width="280px">
      <DatePicker
        label="Start date"
        description="Changes take effect from this date onward."
        value={date}
        onChange={setDate}
        placeholder="Select a date"
        data-qa="demo-description"
      />
    </Flex>
  );
}

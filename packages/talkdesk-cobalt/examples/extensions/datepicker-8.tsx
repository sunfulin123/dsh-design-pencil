import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const today = new Date();
const yyyy = today.getFullYear();
const mm = today.getMonth() + 1;
export default function Demo() {
  const [d1, setD1] = useState<Date | null>(null);
  const [d2, setD2] = useState<Date | null>(null);
  return (
    <Flex gap="6" padding="4">
      <DatePicker
        label="Disabled specific days"
        value={d1}
        onChange={setD1}
        placeholder="Select a date"
        disabledDays={[
          { year: yyyy, month: mm, day: 1 },
          { year: yyyy, month: mm, day: 15 },
        ]}
        data-qa="demo-disabled-days"
      />
      <DatePicker
        label="Disabled range"
        value={d2}
        onChange={setD2}
        placeholder="Select a date"
        disabledDays={[
          {
            start: { year: yyyy, month: mm, day: 10 },
            end: { year: yyyy, month: mm, day: 20 },
          },
        ]}
        data-qa="demo-disabled-range"
      />
    </Flex>
  );
}

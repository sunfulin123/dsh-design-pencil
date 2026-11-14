import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [d1, setD1] = useState<Date | null>(new Date());
  const [d2, setD2] = useState<Date | null>(new Date());
  const longLabel = d1
    ? d1.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";
  return (
    <Flex gap="6" padding="4">
      <DatePicker
        label="Static override (displayValue)"
        value={d1}
        onChange={setD1}
        displayValue={longLabel}
        placeholder="Select a date"
        data-qa="demo-custom-display"
      />
      <DatePicker
        label="Dynamic formatter (formatDate)"
        value={d2}
        onChange={setD2}
        formatDate={(d) =>
          d.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
        }
        placeholder="DD/MM/YYYY"
        data-qa="demo-format-date"
      />
    </Flex>
  );
}

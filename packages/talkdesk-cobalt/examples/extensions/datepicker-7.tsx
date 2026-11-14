import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [d1, setD1] = useState<Date | null>(null);
  const [d2, setD2] = useState<Date | null>(null);
  return (
    <Flex gap="6" padding="4">
      <DatePicker
        label="Error state"
        variation="error"
        value={d1}
        onChange={setD1}
        placeholder="Select a date"
        data-qa="demo-error"
      />
      <DatePicker
        label="Warning state"
        variation="warning"
        value={d2}
        onChange={setD2}
        placeholder="Select a date"
        data-qa="demo-warning"
      />
    </Flex>
  );
}

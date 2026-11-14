import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [d1, setD1] = useState<Date | null>(null);
  const [d2, setD2] = useState<Date | null>(null);
  return (
    <Flex direction="column" gap="4" padding="4">
      <DatePicker
        size="small"
        label="Small"
        value={d1}
        onChange={setD1}
        placeholder="Select a date"
        data-qa="demo-small"
      />
      <DatePicker
        size="medium"
        label="Medium (default)"
        value={d2}
        onChange={setD2}
        placeholder="Select a date"
        data-qa="demo-medium"
      />
    </Flex>
  );
}

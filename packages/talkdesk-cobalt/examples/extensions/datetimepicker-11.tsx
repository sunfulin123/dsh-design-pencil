import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <Flex padding="4">
      <DateTimePicker
        label="Scheduled at"
        placeholder="e.g. Apr 22, 2026 09:00 AM"
        value={value}
        onChange={setValue}
        data-qa="placeholder-demo"
      />
    </Flex>
  );
}

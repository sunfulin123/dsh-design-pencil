import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <Flex padding="4">
      <DateTimePicker
        label="Meeting start"
        description="Meetings are scheduled in the agent's local timezone."
        value={value}
        onChange={setValue}
        data-qa="description-demo"
      />
    </Flex>
  );
}

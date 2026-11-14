import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [v1, setV1] = useState(new Date(2026, 3, 22, 10, 0));
  const [v2, setV2] = useState(new Date(2026, 3, 22, 10, 0));
  return (
    <Flex alignY="center" gap="6" wrap>
      <DateTimePicker label="Small" size="small" value={v1} onChange={setV1} />
      <DateTimePicker label="Medium (default)" size="medium" value={v2} onChange={setV2} />
    </Flex>
  );
}

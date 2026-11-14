import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [v1, setV1] = useState(new Date(2026, 3, 22, 9, 30));
  const [v2, setV2] = useState(new Date(2026, 3, 22, 9, 30));
  return (
    <Flex gap="6" wrap>
      <DateTimePicker label="12-hour (default)" value={v1} onChange={setV1} data-qa="12h" />
      <DateTimePicker format24H label="24-hour" value={v2} onChange={setV2} data-qa="24h" />
    </Flex>
  );
}

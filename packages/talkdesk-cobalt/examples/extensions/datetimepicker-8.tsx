import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [v1, setV1] = useState(new Date(2026, 3, 22, 9, 0));
  const [v2, setV2] = useState(new Date(2026, 3, 22, 9, 0));
  return (
    <Flex gap="6" wrap>
      <DateTimePicker
        label="Error state"
        variation="error"
        value={v1}
        onChange={setV1}
        data-qa="error"
      />
      <DateTimePicker
        label="Warning state"
        variation="warning"
        value={v2}
        onChange={setV2}
        data-qa="warning"
      />
    </Flex>
  );
}

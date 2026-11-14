import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";

import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [v1, setV1] = useState(new Date(2026, 3, 22, 9, 0));
  const [v2, setV2] = useState(new Date(2026, 3, 22, 9, 0));
  return (
    <Flex alignY="end" gap="6" style={{ paddingTop: 280 }}>
      <DateTimePicker label="Default (SE / SW)" value={v1} onChange={setV1} data-qa="pos-default" />
      <DateTimePicker
        direction="NE"
        label="Above (NE / SW)"
        origin="SW"
        value={v2}
        onChange={setV2}
        data-qa="pos-above"
      />
    </Flex>
  );
}

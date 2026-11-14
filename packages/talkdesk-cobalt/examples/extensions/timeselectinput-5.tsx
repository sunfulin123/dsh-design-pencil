import { useState } from "react";
import { TimeSelectInput } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState(540);
  return (
    <Flex direction="column" gap="4" padding="6" width="200px">
      <TimeSelectInput isOutline value={value} onChange={setValue} />
      <TimeSelectInput isOutline format24H value={value} onChange={setValue} />
    </Flex>
  );
}

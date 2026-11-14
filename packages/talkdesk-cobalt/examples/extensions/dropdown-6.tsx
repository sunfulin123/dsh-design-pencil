import type { DropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { Dropdown } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
const OPTIONS = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
];
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>("a");
  return (
    <Flex direction="column" gap="4">
      <Box width="320px">
        <Dropdown disabled value={value} options={OPTIONS} onChange={setValue} />
      </Box>
      <Box width="320px">
        <Dropdown loading value={value} options={OPTIONS} onChange={setValue} />
      </Box>
      <Box width="320px">
        <Dropdown error value={null} options={OPTIONS} onChange={setValue} />
      </Box>
    </Flex>
  );
}

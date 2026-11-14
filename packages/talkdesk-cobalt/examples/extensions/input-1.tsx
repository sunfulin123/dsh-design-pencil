import { useState } from "react";
import { Input } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const [value, setValue] = useState("");
  return (
    <Box style={{ width: 280 }}>
      <Input value={value} placeholder="Search agents" onChange={(e) => setValue(e.target.value)} />
    </Box>
  );
}

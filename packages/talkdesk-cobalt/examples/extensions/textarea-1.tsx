import { useState } from "react";
import { Textarea } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const [value, setValue] = useState("");
  return (
    <Box style={{ width: 360 }}>
      <Textarea
        isFullWidth
        value={value}
        placeholder="Add notes for the next shift…"
        onChange={(e) => setValue(e.target.value)}
      />
    </Box>
  );
}

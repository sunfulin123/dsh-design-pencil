import { useState } from "react";
import { TimeSelectInput, FormField, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState(540); // 09:00 AM
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  return (
    <Flex direction="column" gap="4" padding="6" width="240px">
      <FormField label="Start time" description="Select the shift start time.">
        <TimeSelectInput value={value} onChange={setValue} />
      </FormField>
      <Typography variant="caption">
        Total minutes: {value} ({String(hours).padStart(2, "0")}:{String(mins).padStart(2, "0")})
      </Typography>
    </Flex>
  );
}

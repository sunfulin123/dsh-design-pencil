import { useState } from "react";
import { TimeSelectInput, FormField, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState(870); // 14:30
  return (
    <Flex direction="column" gap="4" padding="6" width="200px">
      <FormField label="Departure time">
        <TimeSelectInput format24H value={value} onChange={setValue} />
      </FormField>
      <Typography variant="caption">
        {Math.floor(value / 60)}h {value % 60}m from midnight
      </Typography>
    </Flex>
  );
}

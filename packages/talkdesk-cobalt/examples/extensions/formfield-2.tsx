import { FormField } from "../../components/extensions/src";
import Input from "@talkdesk/cobalt-react-input";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Box width="320px" padding="4">
      <FormField
        isRequired
        htmlFor="queue-name"
        label="Queue Name"
        description="Enter a unique name for this queue"
      >
        <Input
          id="queue-name"
          placeholder="e.g. Support Team A"
          size="medium"
          style={{ width: "100%", padding: "0 8px" }}
        />
      </FormField>
    </Box>
  );
}

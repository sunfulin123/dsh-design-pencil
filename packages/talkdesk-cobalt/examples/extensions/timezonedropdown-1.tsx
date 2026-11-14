import { useState } from "react";
import { TimezoneDropdown, FormField } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const [tz, setTz] = useState("Europe/Lisbon");
  return (
    <Box padding="6" width="360px">
      <FormField
        isRequired
        label="Timezone"
        description="Used to display schedules in the agent's local time."
      >
        <TimezoneDropdown data-qa="timezone-select" value={tz} onChange={setTz} />
      </FormField>
    </Box>
  );
}

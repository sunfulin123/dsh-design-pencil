import { useState } from "react";
import { TimezoneDropdown, FormField } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const [tz, setTz] = useState("");
  return (
    <Box padding="6" width="360px">
      <FormField label="Timezone (optional)" description="Leave empty to inherit the team default.">
        <TimezoneDropdown data-qa="tz-empty" value={tz} onChange={setTz} />
      </FormField>
    </Box>
  );
}

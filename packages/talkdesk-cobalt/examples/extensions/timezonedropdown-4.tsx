import { useState } from "react";
import { TimezoneDropdown, FormField } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const [tz, setTz] = useState("");
  return (
    <Box padding="6" width="360px">
      <FormField label="时区" description="选择一个 IANA 时区。">
        <TimezoneDropdown
          data-qa="tz-custom-messages"
          value={tz}
          onChange={setTz}
          messages={{
            placeholder: "Choose a timezone…",
            searchPlaceholder: "Type to filter",
            noResults: "Nothing matched your search",
            showMore: "Load more timezones",
          }}
        />
      </FormField>
    </Box>
  );
}

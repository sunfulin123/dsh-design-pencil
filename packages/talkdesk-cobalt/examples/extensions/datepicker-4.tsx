import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Box style={{ width: "320px" }}>
      <DatePicker
        isFullWidth
        label="Date of birth"
        value={date}
        onChange={setDate}
        placeholder="Select a date"
        data-qa="demo-fullwidth"
      />
    </Box>
  );
}

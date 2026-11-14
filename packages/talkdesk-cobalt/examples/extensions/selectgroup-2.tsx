import { useState } from "react";
import { SelectGroup } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
const dayOptions = [
  { value: "mon", label: "MON" },
  { value: "tue", label: "TUE" },
  { value: "wed", label: "WED" },
  { value: "thu", label: "THU" },
  { value: "fri", label: "FRI" },
  { value: "sat", label: "SAT" },
  { value: "sun", label: "SUN" },
];
export default function Demo() {
  const [days, setDays] = useState(["mon", "tue", "wed", "thu", "fri"]);
  return (
    <Box style={{ width: "480px" }}>
      <SelectGroup
        mode="multi"
        options={dayOptions}
        value={days}
        onChange={setDays}
        shape="fullWidth"
      />
    </Box>
  );
}

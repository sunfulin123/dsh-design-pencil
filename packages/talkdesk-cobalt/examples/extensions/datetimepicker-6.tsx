import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
export default function Demo() {
  const [value, setValue] = useState(new Date(2026, 3, 22, 11, 15));
  return (
    <DateTimePicker
      hasIcon={false}
      label="No icon"
      value={value}
      onChange={setValue}
      data-qa="noicon-datetimepicker"
    />
  );
}

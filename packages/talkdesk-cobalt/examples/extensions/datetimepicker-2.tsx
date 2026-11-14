import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
export default function Demo() {
  const [value, setValue] = useState(new Date(2026, 3, 22, 14, 0));
  return (
    <DateTimePicker
      isRequired
      label="Scheduled start"
      value={value}
      onChange={setValue}
      data-qa="labeled-datetimepicker"
    />
  );
}

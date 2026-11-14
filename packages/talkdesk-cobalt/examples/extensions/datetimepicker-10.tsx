import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
const disabledDays = [
  {
    start: { year: 2026, month: 4, day: 1 },
    end: { year: 2026, month: 4, day: 10 },
  },
];
export default function Demo() {
  const [value, setValue] = useState(new Date(2026, 3, 22, 10, 0));
  return (
    <DateTimePicker
      label="April 1–10 disabled"
      value={value}
      disabledDays={disabledDays}
      onChange={setValue}
      data-qa="disabled-days"
    />
  );
}

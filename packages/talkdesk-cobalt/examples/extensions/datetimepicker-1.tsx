import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
export default function Demo() {
  const [value, setValue] = useState(new Date(2026, 3, 22, 9, 30));
  return <DateTimePicker value={value} onChange={setValue} data-qa="basic-datetimepicker" />;
}

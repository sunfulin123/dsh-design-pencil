import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
export default function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <DatePicker
      label="Start date"
      isRequired
      value={date}
      onChange={setDate}
      placeholder="Select a date"
      data-qa="demo-labeled-datepicker"
    />
  );
}

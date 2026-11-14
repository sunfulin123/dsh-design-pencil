import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
export default function Demo() {
  const [value, setValue] = useState(new Date(2026, 3, 22, 16, 0));
  return (
    <DateTimePicker
      label="Custom format"
      value={value}
      onChange={setValue}
      formatDateTime={(d) =>
        d.toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      }
      data-qa="custom-format"
    />
  );
}

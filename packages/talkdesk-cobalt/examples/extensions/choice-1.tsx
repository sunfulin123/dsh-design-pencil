import { useState } from "react";
import { Choice } from "../../components/extensions/src";
export default function Demo() {
  const [checked, setChecked] = useState(false);
  return (
    <Choice
      checked={checked}
      label="Turn on reforecast"
      onChange={setChecked}
      data-qa="basic-choice"
    />
  );
}

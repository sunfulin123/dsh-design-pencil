import type { MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { MultiDropdown } from "../../components/extensions/src";
const OPTIONS = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
];
export default function Demo() {
  const [value, setValue] = useState<MultiDropdownOptionValue[]>(["us"]);
  return (
    <MultiDropdown
      value={value}
      options={OPTIONS}
      onChange={setValue}
      data-qa="basic-multi-dropdown"
    />
  );
}

import type { DropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { Dropdown } from "../../components/extensions/src";
const OPTIONS = [
  { value: "us", label: "United States" },
  { value: "uk", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
];
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>(null);
  return <Dropdown value={value} options={OPTIONS} onChange={setValue} data-qa="basic-dropdown" />;
}

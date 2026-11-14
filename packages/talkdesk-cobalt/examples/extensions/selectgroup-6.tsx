import { useState } from "react";
import { SelectGroup } from "../../components/extensions/src";
const options = [
  { value: "enabled1", label: "Available" },
  { value: "disabled1", label: "Unavailable", disabled: true },
  { value: "enabled2", label: "Available" },
];
export default function Demo() {
  const [val, setVal] = useState("enabled1");
  return <SelectGroup options={options} value={val} onChange={setVal} />;
}

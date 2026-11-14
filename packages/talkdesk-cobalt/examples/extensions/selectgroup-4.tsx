import { useState } from "react";
import { SelectGroup } from "../../components/extensions/src";
const options = [
  { value: "list", label: "List" },
  { value: "grid", label: "Grid" },
  { value: "map", label: "Map" },
];
export default function Demo() {
  const [view, setView] = useState("list");
  return <SelectGroup options={options} value={view} onChange={setView} type="outline" />;
}

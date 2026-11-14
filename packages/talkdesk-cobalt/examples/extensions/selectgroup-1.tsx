import { useState } from "react";
import { SelectGroup } from "../../components/extensions/src";
const viewOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];
export default function Demo() {
  const [view, setView] = useState("day");
  return <SelectGroup options={viewOptions} value={view} onChange={setView} />;
}

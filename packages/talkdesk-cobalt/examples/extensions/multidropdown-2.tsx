import type { MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { MultiDropdown } from "../../components/extensions/src";
const OPTIONS = Array.from({ length: 8 }, (_, i) => ({
  value: `team-${i + 1}`,
  label: `Team ${i + 1}`,
}));
export default function Demo() {
  const [value, setValue] = useState<MultiDropdownOptionValue[]>([
    "team-1",
    "team-2",
    "team-3",
    "team-4",
  ]);
  return (
    <MultiDropdown
      dismissValues
      maxVisibleValues={2}
      value={value}
      options={OPTIONS}
      onChange={setValue}
      messages={{ placeholder: "Pick teams" }}
      data-qa="dismissible-multi-dropdown"
    />
  );
}

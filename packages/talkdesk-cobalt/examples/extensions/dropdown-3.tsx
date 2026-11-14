import type { DropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { Dropdown } from "../../components/extensions/src";
const OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: `tz-${i}`,
  label: `Timezone option ${i + 1}`,
}));
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>(null);
  return (
    <Dropdown
      searchable
      value={value}
      options={OPTIONS}
      onChange={setValue}
      messages={{
        placeholder: "Pick a timezone",
        searchPlaceholder: "Filter…",
      }}
      data-qa="searchable-dropdown"
    />
  );
}

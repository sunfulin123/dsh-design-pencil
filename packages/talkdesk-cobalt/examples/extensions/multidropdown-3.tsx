import type { MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import { MultiDropdown } from "../../components/extensions/src";
const OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: `q-${i + 1}`,
  label: `Queue ${i + 1}`,
}));
export default function Demo() {
  const [value, setValue] = useState<MultiDropdownOptionValue[]>([]);
  return (
    <MultiDropdown
      searchable
      renderSelectAll
      value={value}
      options={OPTIONS}
      onChange={setValue}
      messages={{
        placeholder: "Pick queues",
        searchPlaceholder: "Filter queues…",
        selectAll: "Select all queues",
      }}
      data-qa="searchable-multi-dropdown"
    />
  );
}

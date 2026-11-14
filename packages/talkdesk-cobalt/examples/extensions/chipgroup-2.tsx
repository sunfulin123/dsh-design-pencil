import { ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    { id: "1", label: "Sales" },
    { id: "2", label: "Support" },
    { id: "3", label: "Engineering" },
    { id: "4", label: "Design" },
    { id: "5", label: "Operations" },
  ];
  return <ChipGroup items={items} maxVisible={2} data-qa="overflow-chip-group" />;
}

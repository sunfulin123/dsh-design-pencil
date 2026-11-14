import { ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    { id: "1", label: "Customer Success Operations" },
    { id: "2", label: "Workforce Management Optimization" },
    { id: "3", label: "Quality Assurance and Coaching" },
  ];
  return (
    <ChipGroup items={items} maxVisible={2} maxChipWidth={140} data-qa="long-label-chip-group" />
  );
}

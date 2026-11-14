import { ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    { id: "1", label: "Sales" },
    { id: "2", label: "Support" },
  ];
  return <ChipGroup items={items} data-qa="basic-chip-group" />;
}

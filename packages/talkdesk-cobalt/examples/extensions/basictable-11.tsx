import type { BasicTableColumn } from "../../components/extensions/src";
import { BasicTable } from "../../components/extensions/src";
const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
  { key: "name", title: "Name" },
  {
    key: "aht",
    title: "AHT",
    tooltip:
      "Average Handle Time — the mean duration of a single agent interaction including talk time and after-call work.",
  },
  {
    key: "occupancy",
    title: "Occupancy",
    tooltip:
      "The percentage of time an agent spends handling interactions versus available idle time.",
  },
];
const rows = [
  { id: "1", name: "Alice", aht: "3m 12s", occupancy: "82%" },
  { id: "2", name: "Bob", aht: "4m 05s", occupancy: "74%" },
  { id: "3", name: "Carol", aht: "2m 48s", occupancy: "91%" },
];
export default function Demo() {
  return (
    <BasicTable
      headers={columns}
      data={rows}
      currentPage={1}
      totalPages={1}
      onPageClick={() => {}}
    />
  );
}

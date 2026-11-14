import type { BasicTableColumn } from "../../components/extensions/src";
import { BasicTable } from "../../components/extensions/src";
const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
  { key: "name", title: "Name", width: 30 },
  { key: "email", title: "Email", width: 40 },
  { key: "status", title: "Status", width: "min" },
];
const rows = [
  { id: "1", name: "Alice", email: "alice@example.com", status: "Active" },
  { id: "2", name: "Bob", email: "bob@example.com", status: "Inactive" },
  { id: "3", name: "Carol", email: "carol@example.com", status: "Active" },
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

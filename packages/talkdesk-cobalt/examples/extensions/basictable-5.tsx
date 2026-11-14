import type { BasicTableColumn } from "../../components/extensions/src";
import { BasicTable } from "../../components/extensions/src";
const columns: BasicTableColumn<{ name: string; role: string; status: string }>[] = [
  { key: "name", title: "Name" },
  { key: "role", title: "Role" },
  { key: "status", title: "Status" },
];
export default function Demo() {
  return (
    <BasicTable
      headers={columns}
      data={[]}
      isFetching
      currentPage={1}
      totalPages={1}
      onPageClick={() => {}}
    />
  );
}

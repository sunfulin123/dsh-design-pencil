import type { BasicTableColumn } from "../../components/extensions/src";
import { useState } from "react";
import { BasicTable } from "../../components/extensions/src";
const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
  { key: "name", title: "Name", sortable: true },
  { key: "score", title: "Score", sortable: true },
  { key: "team", title: "Team" },
];
const rows = [
  { id: "1", name: "Alice", score: 92, team: "Alpha" },
  { id: "2", name: "Bob", score: 78, team: "Beta" },
  { id: "3", name: "Carol", score: 85, team: "Alpha" },
  { id: "4", name: "Dave", score: 61, team: "Beta" },
];
export default function Demo() {
  const [sort, setSort] = useState({});
  return (
    <BasicTable
      headers={columns}
      data={rows}
      currentPage={1}
      totalPages={1}
      defaultSort={sort}
      onSortClick={setSort}
      onPageClick={() => {}}
    />
  );
}

import { useState } from "react";
import { BasicTable } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
const allRows = Array.from({ length: 30 }, (_, i) => ({
  id: String(i + 1),
  name: `Agent ${i + 1}`,
  team: i % 2 === 0 ? "Alpha" : "Beta",
}));
const PAGE_SIZE = 5;
export default function Demo() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(allRows.length / PAGE_SIZE);
  const data = allRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  return (
    <Box height="400px">
      <BasicTable
        headers={[
          { key: "name", title: "Name" },
          { key: "team", title: "Team" },
        ]}
        data={data}
        currentPage={page}
        totalPages={totalPages}
        onPageClick={setPage}
      />
    </Box>
  );
}

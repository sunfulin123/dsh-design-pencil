import type { BasicTableColumn } from "../../components/extensions/src";
import { BasicTable, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
const rows = [
  { id: "1", name: "Alice", score: 92 },
  { id: "2", name: "Bob", score: 45 },
  { id: "3", name: "Carol", score: 76 },
];
const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
  { key: "name", title: "Name" },
  {
    key: "score",
    title: "Score",
    render: (row) => (
      <Box padding={1}>
        <Typography
          variant="body-emphasis"
          color={row.score >= 75 ? "var(--co-color-green-600)" : "var(--co-color-red-600)"}
        >
          {row.score}
        </Typography>
      </Box>
    ),
  },
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

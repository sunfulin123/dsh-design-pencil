import type { BasicTableColumn } from "../../components/extensions/src";

import { BasicTable, Typography } from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";
const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
  { key: "name", title: "Name" },
  { key: "role", title: "Role" },
  { key: "team", title: "Team" },
];
const rows = [
  {
    id: "1",
    name: "Alice",
    role: "Agent",
    team: "Alpha",
    email: "alice@example.com",
    hired: "Jan 2022",
  },
  {
    id: "2",
    name: "Bob",
    role: "Supervisor",
    team: "Beta",
    email: "bob@example.com",
    hired: "Mar 2021",
  },
  {
    id: "3",
    name: "Carol",
    role: "Agent",
    team: "Alpha",
    email: "carol@example.com",
    hired: "Sep 2023",
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
      renderExpandedRow={(row) => (
        <Box padding={4} style={{ background: "var(--basic-100, #f8f9fa)" }}>
          <Flex gap="6">
            <Flex direction="column" gap="1">
              <Typography variant="body-emphasis">Email</Typography>
              <Typography variant="body" weight="light">
                {row.email}
              </Typography>
            </Flex>
            <Flex direction="column" gap="1">
              <Typography variant="body-emphasis">Hired</Typography>
              <Typography variant="body" weight="light">
                {row.hired}
              </Typography>
            </Flex>
          </Flex>
        </Box>
      )}
    />
  );
}

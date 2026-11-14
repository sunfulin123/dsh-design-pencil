import type { BasicTableColumn } from "../../components/extensions/src";
import { BasicTable, Typography } from "../../components/extensions/src";

import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
const columns: BasicTableColumn<(typeof rows)[number] & { actions?: never }>[] = [
  { key: "name", title: "Name" },
  { key: "role", title: "Role" },
  { key: "status", title: "Status" },
];
const rows = [
  { id: "1", name: "Alice", role: "Agent", status: "Active" },
  { id: "2", name: "Bob", role: "Supervisor", status: "Inactive" },
];
const ImportBanner = () => (
  <Flex
    alignY="center"
    gap="2"
    padding="2"
    style={{
      background: "var(--color-background-info-subtle, #e8f4fd)",
      borderRadius: 4,
    }}
  >
    <Icon name="info_outline" size="tiny" style={{ color: "var(--blue-600, #1a73e8)" }} />
    <Typography variant="body" weight="light">
      3 agents imported successfully. Showing updated list.
    </Typography>
  </Flex>
);
export default function Demo() {
  return (
    <BasicTable
      headers={columns}
      data={rows}
      currentPage={1}
      totalPages={1}
      onPageClick={() => {}}
      messageComponent={<ImportBanner />}
    />
  );
}

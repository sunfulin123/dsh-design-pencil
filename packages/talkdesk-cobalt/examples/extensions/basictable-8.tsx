import { BasicTable, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <BasicTable
      headers={[
        { key: "name", title: "Name" },
        { key: "role", title: "Role" },
      ]}
      data={[]}
      currentPage={1}
      totalPages={1}
      onPageClick={() => {}}
      emptyStateComponent={
        <Flex padding="6" alignX="center">
          <Typography variant="body">No agents match your current filter.</Typography>
        </Flex>
      }
    />
  );
}

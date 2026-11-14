import { useState } from "react";
import { BasicTable } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const headers = [
  { key: "name", title: "Name" },
  { key: "role", title: "Role" },
];
export default function Demo() {
  const [added, setAdded] = useState(false);
  return (
    <Flex direction="column" gap="6">
      <BasicTable
        headers={headers}
        data={[]}
        currentPage={1}
        totalPages={1}
        onPageClick={() => {}}
      />
      <BasicTable
        headers={headers}
        data={[]}
        currentPage={1}
        totalPages={1}
        onPageClick={() => {}}
        onAdd={() => setAdded(true)}
        addLabel={added ? "Added!" : "Add Agent"}
      />
    </Flex>
  );
}

import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import { ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    {
      id: "1",
      label: "Verified",
      content: (
        <Flex alignY="center" gap="1">
          <Icon name="check_circle" size="tiny" />
          Verified
        </Flex>
      ),
    },
    { id: "2", label: "Draft" },
    { id: "3", label: "Archived" },
  ];
  return <ChipGroup items={items} maxVisible={2} data-qa="custom-content-chip-group" />;
}

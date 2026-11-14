import Flex from "@talkdesk/cobalt-react-flex";
import { ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    { id: "1", label: "Alpha" },
    { id: "2", label: "Beta" },
    { id: "3", label: "Gamma" },
  ];
  return (
    <Flex direction="column" gap="3">
      <ChipGroup items={items} size="tiny" maxVisible={2} data-qa="size-tiny" />
      <ChipGroup items={items} size="small" maxVisible={2} data-qa="size-small" />
      <ChipGroup items={items} size="medium" maxVisible={2} data-qa="size-medium" />
    </Flex>
  );
}

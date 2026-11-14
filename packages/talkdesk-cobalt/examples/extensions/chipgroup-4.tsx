import Flex from "@talkdesk/cobalt-react-flex";
import { ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    { id: "1", label: "Alpha" },
    { id: "2", label: "Beta" },
  ];
  return (
    <Flex gap="4" alignY="center">
      <ChipGroup items={items} color="default" data-qa="color-default" />
      <ChipGroup items={items} color="info" data-qa="color-info" />
      <ChipGroup items={items} color="theme" data-qa="color-theme" />
    </Flex>
  );
}

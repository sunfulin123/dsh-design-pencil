import Flex from "@talkdesk/cobalt-react-flex";
import { Typography, ChipGroup } from "../../components/extensions/src";
export default function Demo() {
  const items = [
    { id: "1", label: "Sales" },
    { id: "2", label: "Support" },
    { id: "3", label: "Engineering" },
    { id: "4", label: "Design" },
  ];
  return (
    <Flex direction="column" gap="4">
      <Flex direction="column" gap="2">
        <Typography variant="caption">popupContent="all" (default)</Typography>
        <ChipGroup items={items} maxVisible={2} popupContent="all" data-qa="popup-all" />
      </Flex>
      <Flex direction="column" gap="2">
        <Typography variant="caption">popupContent="hidden"</Typography>
        <ChipGroup items={items} maxVisible={2} popupContent="hidden" data-qa="popup-hidden" />
      </Flex>
    </Flex>
  );
}

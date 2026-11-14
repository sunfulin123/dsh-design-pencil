import { Textarea } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={3} style={{ width: 360 }}>
      <Textarea isFullWidth size="small" rows={3} placeholder="Small" />
      <Textarea isFullWidth size="medium" rows={3} placeholder="Medium" />
    </Flex>
  );
}

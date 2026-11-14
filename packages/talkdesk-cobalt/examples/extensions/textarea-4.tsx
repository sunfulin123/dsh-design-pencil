import { Textarea } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={3} style={{ width: 360 }}>
      <Textarea isFullWidth rows={2} placeholder="Compact (rows=2, resizable)" />
      <Textarea
        isFullWidth
        rows={6}
        isResizable={false}
        placeholder="Locked height (rows=6, isResizable=false)"
      />
    </Flex>
  );
}

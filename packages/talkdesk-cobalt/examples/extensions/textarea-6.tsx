import { Textarea } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <Textarea
        isFullWidth
        disabled
        rows={3}
        value="This field is disabled."
        onChange={() => null}
      />
      <Textarea
        isFullWidth
        readOnly
        rows={3}
        value="Auto-generated summary — read only."
        onChange={() => null}
      />
    </Flex>
  );
}

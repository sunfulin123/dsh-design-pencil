import { Input } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={3} style={{ width: 280 }}>
      <Input size="small" placeholder="Small (toolbar)" />
      <Input size="medium" placeholder="Medium (form)" />
    </Flex>
  );
}

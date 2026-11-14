import { Choice } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Choice checked label="Small" size="small" />
      <Choice checked label="Medium (default)" size="medium" />
    </Flex>
  );
}

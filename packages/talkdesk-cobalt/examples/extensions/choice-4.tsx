import { Choice } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Choice disabled checked label="Disabled checked" />
      <Choice disabled label="Disabled unchecked" />
      <Choice disabled checked label="Disabled radio" type="radio" />
    </Flex>
  );
}

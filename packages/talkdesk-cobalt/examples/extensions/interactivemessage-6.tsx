import { InteractiveMessage } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="4">
      <InteractiveMessage variation="info" type="banner">
        Banner — spans the full width of this container.
      </InteractiveMessage>
      <InteractiveMessage variation="success" type="floating">
        Floating — only as wide as its content.
      </InteractiveMessage>
    </Flex>
  );
}

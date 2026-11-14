import { InteractiveMessage } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="4">
      <InteractiveMessage variation="info">Ready.</InteractiveMessage>
      <InteractiveMessage variation="info" withLoader>
        Loading data, please wait…
      </InteractiveMessage>
    </Flex>
  );
}

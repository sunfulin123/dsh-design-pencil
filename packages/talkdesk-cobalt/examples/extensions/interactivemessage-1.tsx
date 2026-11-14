import { InteractiveMessage } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="4">
      <InteractiveMessage variation="info">This is an informational message.</InteractiveMessage>
      <InteractiveMessage variation="success">Operation completed successfully.</InteractiveMessage>
      <InteractiveMessage variation="warning">Please review before proceeding.</InteractiveMessage>
      <InteractiveMessage variation="error">
        Something went wrong. Please try again.
      </InteractiveMessage>
      <InteractiveMessage variation="feature">
        New feature available — try it now.
      </InteractiveMessage>
    </Flex>
  );
}

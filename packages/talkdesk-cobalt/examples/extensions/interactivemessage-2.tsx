import { InteractiveMessage } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="4">
      <InteractiveMessage
        variation="warning"
        actionLabel="Retry"
        onAction={() => alert("retry clicked")}
      >
        Upload failed — check your connection.
      </InteractiveMessage>
      <InteractiveMessage
        variation="info"
        actionLabel="Learn more"
        onAction={() => alert("learn more clicked")}
      >
        Your data is syncing in the background.
      </InteractiveMessage>
    </Flex>
  );
}

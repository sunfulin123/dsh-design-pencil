import { InteractiveMessage } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import { useState } from "react";
export default function Demo() {
  const [visible, setVisible] = useState(true);
  return (
    <Flex direction="column" gap="4" padding="4">
      {visible ? (
        <InteractiveMessage variation="info" onDismiss={() => setVisible(false)}>
          Dismiss this message by clicking the close icon.
        </InteractiveMessage>
      ) : (
        <InteractiveMessage variation="success">Message dismissed.</InteractiveMessage>
      )}
    </Flex>
  );
}

import { InteractiveMessage } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="4">
      <InteractiveMessage variation="warning" block actionLabel="Resolve" onAction={() => {}}>
        <strong>Multiple issues found.</strong>
        <br />
        Please review each item before saving.
        <br />
        Items with errors cannot be submitted.
      </InteractiveMessage>
    </Flex>
  );
}

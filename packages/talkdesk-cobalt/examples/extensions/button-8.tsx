import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex gap="2">
      <Button disabled>Disabled primary</Button>
      <Button disabled type="secondary">
        Disabled secondary
      </Button>
      <Button disabled type="danger" variation="outline">
        Disabled danger outline
      </Button>
    </Flex>
  );
}

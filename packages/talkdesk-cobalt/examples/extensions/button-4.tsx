import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex gap="2">
      <Button state="loading">loading</Button>
      <Button state="inline-loading">inline-loading</Button>
      <Button state="success" type="success">
        success
      </Button>
      <Button state="error" type="danger">
        error
      </Button>
    </Flex>
  );
}

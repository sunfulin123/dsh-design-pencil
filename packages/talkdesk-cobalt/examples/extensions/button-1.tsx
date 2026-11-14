import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex gap="2">
      <Button onClick={() => alert("Clicked")}>Primary</Button>
      <Button type="secondary">Secondary</Button>
      <Button type="danger">Delete</Button>
    </Flex>
  );
}

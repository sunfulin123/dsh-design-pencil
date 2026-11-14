import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Flex gap="2">
        <Button type="primary">Solid</Button>
        <Button type="primary" variation="outline">
          Outline
        </Button>
        <Button type="primary" variation="transparent">
          Transparent
        </Button>
      </Flex>
      <Flex gap="2">
        <Button type="success">Success</Button>
        <Button type="warning">Warning</Button>
        <Button type="info">Info</Button>
        <Button type="feature">Feature</Button>
      </Flex>
    </Flex>
  );
}

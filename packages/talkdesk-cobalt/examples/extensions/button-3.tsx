import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Flex alignY="center" gap="2">
        <Button size="tiny">Tiny</Button>
        <Button size="small">Small</Button>
        <Button size="medium">Medium</Button>
      </Flex>
      <Box width="320px">
        <Button shape="full-width">Full-width inside 320px</Button>
      </Box>
    </Flex>
  );
}

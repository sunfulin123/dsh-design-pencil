import { Badge } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex gap="8" padding="4" alignY="center">
      <Badge count={9} size="tiny">
        <Box width="24px" height="24px" style={{ background: "#e8f0fe", borderRadius: 6 }} />
      </Badge>
      <Badge count={9} size="small">
        <Box width="32px" height="32px" style={{ background: "#e8f0fe", borderRadius: 6 }} />
      </Badge>
      <Badge count={9} size="medium">
        <Box width="40px" height="40px" style={{ background: "#e8f0fe", borderRadius: 6 }} />
      </Badge>
      <Badge count={9} size="large">
        <Box width="48px" height="48px" style={{ background: "#e8f0fe", borderRadius: 6 }} />
      </Badge>
    </Flex>
  );
}

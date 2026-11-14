import { Badge } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex gap="6" padding="4">
      <Badge count={0}>
        <Box
          width="32px"
          height="32px"
          style={{
            background: "#f4f5f7",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🔕
        </Box>
      </Badge>
      <Badge count={5}>
        <Box
          width="32px"
          height="32px"
          style={{
            background: "#f4f5f7",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🔔
        </Box>
      </Badge>
    </Flex>
  );
}

import { Badge } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex gap="6" padding="4">
      <Badge count={3}>
        <Box
          width="32px"
          height="32px"
          style={{
            background: "#e8f0fe",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          🔔
        </Box>
      </Badge>
      <Badge count={12} maxCount={9}>
        <Box
          width="32px"
          height="32px"
          style={{
            background: "#e3fcef",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          📬
        </Box>
      </Badge>
    </Flex>
  );
}

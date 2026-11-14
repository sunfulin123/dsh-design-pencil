import { Badge } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex padding="4">
      <Badge content="NEW">
        <Box
          width="64px"
          height="32px"
          style={{
            background: "#e8f0fe",
            borderRadius: 6,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          Feature
        </Box>
      </Badge>
    </Flex>
  );
}

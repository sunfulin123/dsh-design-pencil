import { Badge, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
const Icon = ({ bg }: { bg: string }) => (
  <Box
    width="40px"
    height="40px"
    style={{
      background: bg,
      borderRadius: 8,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 20,
    }}
  >
    🔔
  </Box>
);
export default function Demo() {
  return (
    <Flex gap="10" padding="8" alignY="center" wrap>
      <Flex direction="column" gap="2" alignX="center">
        <Badge count={3} status="danger">
          <Icon bg="#e8f0fe" />
        </Badge>
        <Typography variant="caption">default (NE/NW)</Typography>
      </Flex>

      <Flex direction="column" gap="2" alignX="center">
        <Badge count={5} status="success" originPosition="SE" directionPosition="SW">
          <Icon bg="#e3fcef" />
        </Badge>
        <Typography variant="caption">SE/SW (bottom-right)</Typography>
      </Flex>

      <Flex direction="column" gap="2" alignX="center">
        <Badge count={2} status="info" originPosition="NW" directionPosition="NE">
          <Icon bg="#f4f5f7" />
        </Badge>
        <Typography variant="caption">NW/NE (top-left)</Typography>
      </Flex>

      <Flex direction="column" gap="2" alignX="center">
        <Badge count={7} status="warning" gapX={4} gapY={0}>
          <Icon bg="#fffae6" />
        </Badge>
        <Typography variant="caption">gapX=4 gapY=0</Typography>
      </Flex>
    </Flex>
  );
}

import { Badge } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
const Icon = ({ bg, label }: { bg: string; label: string }) => (
  <Box
    width="32px"
    height="32px"
    style={{
      background: bg,
      borderRadius: 6,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14,
    }}
  >
    {label}
  </Box>
);
export default function Demo() {
  return (
    <Flex gap="8" padding="4" wrap>
      <Badge count={1} status="default">
        <Icon bg="#f4f5f7" label="D" />
      </Badge>
      <Badge count={2} status="success">
        <Icon bg="#e3fcef" label="S" />
      </Badge>
      <Badge count={3} status="warning">
        <Icon bg="#fffae6" label="W" />
      </Badge>
      <Badge count={4} status="danger">
        <Icon bg="#ffebe6" label="!" />
      </Badge>
      <Badge count={5} status="info">
        <Icon bg="#e8f0fe" label="i" />
      </Badge>
    </Flex>
  );
}

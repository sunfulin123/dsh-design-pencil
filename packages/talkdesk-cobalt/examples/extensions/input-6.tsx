import { Input } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <Input isFullWidth disabled value="td-prod-eu-west-1" onChange={() => null} />
      <Input isFullWidth readOnly value="forecast-2026-q2" onChange={() => null} />
    </Flex>
  );
}

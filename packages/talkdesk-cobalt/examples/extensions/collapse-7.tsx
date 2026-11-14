import { Collapse, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Collapse duration={120} title="Fast (120ms)">
        <Typography variant="body">Snappy reveal.</Typography>
      </Collapse>
      <Collapse duration={500} title="Slow (500ms)">
        <Typography variant="body">Leisurely reveal.</Typography>
      </Collapse>
    </Flex>
  );
}

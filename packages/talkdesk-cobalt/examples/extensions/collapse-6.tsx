import { Collapse, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Collapse disabled title="Disabled (collapsed)">
        <Typography variant="body">Hidden — header cannot be toggled.</Typography>
      </Collapse>
      <Collapse defaultOpen disabled title="Disabled (open)">
        <Typography variant="body">
          Locked open — useful for required sections that must stay visible.
        </Typography>
      </Collapse>
    </Flex>
  );
}

import { Collapse, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Collapse defaultOpen size="small" title="Compact (small)">
        <Typography variant="body">12px header padding — fits dense surfaces.</Typography>
      </Collapse>
      <Collapse defaultOpen size="medium" title="Standard (medium)">
        <Typography variant="body">16px header padding — default density.</Typography>
      </Collapse>
    </Flex>
  );
}

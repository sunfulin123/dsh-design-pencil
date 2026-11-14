import { useState } from "react";
import { Button, Collapse, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <Flex direction="column" gap="3">
      <Flex gap="2">
        <Button size="small" type="secondary" onClick={() => setOpen(true)}>
          Expand
        </Button>
        <Button size="small" type="secondary" onClick={() => setOpen(false)}>
          Collapse
        </Button>
      </Flex>
      <Collapse open={open} title="Advanced settings" onOpenChange={setOpen}>
        <Typography variant="body">
          External buttons drive the open state. Clicking the header still toggles via
          `onOpenChange`.
        </Typography>
      </Collapse>
    </Flex>
  );
}

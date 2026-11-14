import { useState } from "react";
import { Dialog, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  return (
    <Flex padding="4" alignX="center">
      <Button type="primary" onClick={() => setVisible(true)}>
        Open Dialog with Subtitle
      </Button>

      <Dialog
        visible={visible}
        title="Daily Meeting"
        subtitle="Created at 05:44 AM, Apr 20, 2026"
        onClose={() => setVisible(false)}
        onConfirm={() => setVisible(false)}
      >
        <Typography variant="body">
          Review the meeting details. The subtitle above provides the creation timestamp for this
          event.
        </Typography>
      </Dialog>
    </Flex>
  );
}

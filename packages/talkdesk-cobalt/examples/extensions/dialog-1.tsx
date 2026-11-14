import { useState } from "react";
import { Dialog, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  return (
    <Flex padding="4" alignX="center">
      <Button type="primary" onClick={() => setVisible(true)}>
        Open Dialog
      </Button>

      <Dialog
        visible={visible}
        title="Daily Meeting"
        onClose={() => setVisible(false)}
        onConfirm={() => setVisible(false)}
      >
        <Typography variant="body">
          Configure the details for this meeting event before saving. All participants will be
          notified once the event is confirmed.
        </Typography>
      </Dialog>
    </Flex>
  );
}

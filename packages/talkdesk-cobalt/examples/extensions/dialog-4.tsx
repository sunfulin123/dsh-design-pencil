import { useState } from "react";
import { Dialog, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  return (
    <Flex padding="4" alignX="center">
      <Button type="danger" onClick={() => setVisible(true)}>
        Delete Schedule
      </Button>

      <Dialog
        visible={visible}
        title="Delete Schedule"
        subtitle="This action cannot be undone"
        size="small"
        confirmButtonType="danger"
        messages={{ confirmLabel: "Delete", cancelLabel: "Keep it" }}
        onClose={() => setVisible(false)}
        onConfirm={() => setVisible(false)}
      >
        <Typography variant="body">
          Are you sure you want to permanently delete this schedule? All associated shifts and
          assignments will be removed.
        </Typography>
      </Dialog>
    </Flex>
  );
}

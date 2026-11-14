import { useState } from "react";
import { ConfirmModal, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  return (
    <Flex padding="4" alignX="center">
      <Button type="danger" onClick={() => setVisible(true)}>
        Remove agent
      </Button>
      <ConfirmModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        onAction={() => setVisible(false)}
        iconName="trash"
        actionButtonType="danger"
        actionButtonText="Remove"
        cancelButtonText="Keep agent"
        content={
          <Typography variant="body">
            This agent will be removed from all active schedules. This cannot be undone.
          </Typography>
        }
      />
    </Flex>
  );
}

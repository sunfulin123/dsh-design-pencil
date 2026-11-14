import { useState } from "react";
import { ConfirmModal, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  return (
    <Flex padding="4" alignX="center">
      <Button type="primary" onClick={() => setVisible(true)}>
        Open Modal
      </Button>
      <ConfirmModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        onAction={() => setVisible(false)}
        actionButtonText="Confirm"
        content={
          <Typography variant="body">Are you sure you want to proceed with this action?</Typography>
        }
      />
    </Flex>
  );
}

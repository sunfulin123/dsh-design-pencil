import { useState } from "react";
import { ConfirmModal, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();
  return (
    <Flex padding="4" alignX="center">
      <Button type="primary" onClick={() => setVisible(true)}>
        Open Warning Modal
      </Button>
      <ConfirmModal
        visible={visible}
        onDismiss={() => setVisible(false)}
        onAction={() => setVisible(false)}
        iconName="warning"
        iconColor={theme.warning500}
        actionButtonType="danger"
        actionButtonText="Delete"
        content={
          <Typography variant="body">
            This action cannot be undone. All selected records will be permanently deleted.
          </Typography>
        }
      />
    </Flex>
  );
}

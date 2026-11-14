import { useState } from "react";
import { ConfirmModal, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleAction = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVisible(false);
    }, 2000);
  };
  return (
    <Flex padding="4" alignX="center">
      <Button type="primary" onClick={() => setVisible(true)}>
        Open Loading Modal
      </Button>
      <ConfirmModal
        visible={visible}
        onDismiss={() => !loading && setVisible(false)}
        onAction={handleAction}
        actionButtonText="Save"
        isActionButtonLoading={loading}
        isDisabled={loading}
        content={<Typography variant="body">Click Save to simulate an async operation.</Typography>}
      />
    </Flex>
  );
}

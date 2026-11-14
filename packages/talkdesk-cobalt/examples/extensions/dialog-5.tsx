import { useState } from "react";
import { Dialog, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setVisible(false);
    }, 2000);
  };
  return (
    <Flex padding="4" alignX="center">
      <Button type="primary" onClick={() => setVisible(true)}>
        Save Meeting
      </Button>

      <Dialog
        visible={visible}
        title="Save Meeting"
        subtitle="Changes will be applied to all future occurrences"
        isConfirmLoading={loading}
        messages={{ confirmLabel: "Save" }}
        onClose={() => !loading && setVisible(false)}
        onConfirm={handleConfirm}
      >
        <Typography variant="body">
          Click Save to apply your changes. The confirm button shows a loading state while the
          request is in progress.
        </Typography>
      </Dialog>
    </Flex>
  );
}

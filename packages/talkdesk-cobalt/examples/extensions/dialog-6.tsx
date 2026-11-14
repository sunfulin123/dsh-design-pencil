import { useState } from "react";
import { Dialog, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [visible, setVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);
  return (
    <Flex padding="4" alignX="center">
      <Button
        type="primary"
        onClick={() => {
          setVisible(true);
          setAgreed(false);
        }}
      >
        Open Dialog
      </Button>

      <Dialog
        visible={visible}
        title="Accept Terms"
        subtitle="You must accept before continuing"
        isConfirmDisabled={!agreed}
        messages={{ confirmLabel: "Accept &amp; Continue" }}
        onClose={() => setVisible(false)}
        onConfirm={() => setVisible(false)}
      >
        <Flex direction="column" gap="3">
          <Typography variant="body">Review the terms below before proceeding.</Typography>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
            I accept the terms and conditions
          </label>
        </Flex>
      </Dialog>
    </Flex>
  );
}

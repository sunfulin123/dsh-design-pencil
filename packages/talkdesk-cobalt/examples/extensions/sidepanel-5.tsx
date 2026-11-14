import { useState } from "react";
import { SidePanel, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="secondary" onClick={() => setOpen(true)}>
        Open detail panel
      </Button>
      <SidePanel title="Agent details" visible={open} onClose={() => setOpen(false)}>
        <Typography variant="body">
          No footer — close using the × button or overlay click.
        </Typography>
      </SidePanel>
    </>
  );
}

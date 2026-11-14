import { useState } from "react";
import { SidePanel, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
const items = Array.from({ length: 30 }, (_, i) => `Row item ${i + 1}`);
export default function Demo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="primary" onClick={() => setOpen(true)}>
        Open panel (30 rows)
      </Button>
      <SidePanel
        actions={[
          { label: "Close", type: "secondary", onClick: () => setOpen(false) },
          { label: "Apply", type: "primary", onClick: () => setOpen(false) },
        ]}
        title="Long content"
        visible={open}
        onClose={() => setOpen(false)}
      >
        <Flex direction="column" gap="2">
          {items.map((item) => (
            <Typography variant="body" key={item}>
              {item}
            </Typography>
          ))}
        </Flex>
      </SidePanel>
    </>
  );
}

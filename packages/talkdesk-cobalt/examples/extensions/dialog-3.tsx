import type { DialogSize } from "../../components/extensions/src";
import { useState } from "react";
import { Dialog, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [openSize, setOpenSize] = useState<DialogSize | null>(null);
  return (
    <Flex gap="3" padding="4" alignX="center">
      {(["small", "medium", "large"] as const).map((s) => (
        <Button key={s} type="secondary" onClick={() => setOpenSize(s)}>
          {s}
        </Button>
      ))}

      {(["small", "medium", "large"] as const).map((s) => (
        <Dialog
          key={s}
          visible={openSize === s}
          title={`${s.charAt(0).toUpperCase() + s.slice(1)} Dialog`}
          subtitle={`size="${s}"`}
          size={s}
          onClose={() => setOpenSize(null)}
          onConfirm={() => setOpenSize(null)}
        >
          <Typography variant="body">This is a {s}-sized dialog.</Typography>
        </Dialog>
      ))}
    </Flex>
  );
}

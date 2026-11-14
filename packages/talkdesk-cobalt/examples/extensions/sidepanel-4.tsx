import type { SidePanelSize } from "../../components/extensions/src";
import { useState } from "react";
import { SidePanel } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [size, setSize] = useState<SidePanelSize | null>(null);
  const close = () => setSize(null);
  return (
    <Flex gap="3" wrap>
      {(["small", "medium", "large", "xlarge"] as const).map((s) => (
        <Button key={s} type="secondary" onClick={() => setSize(s)}>
          {s}
        </Button>
      ))}
      {size && (
        <SidePanel
          actions={[{ label: "Close", type: "primary", onClick: close }]}
          size={size}
          title={`Size: ${size}`}
          visible
          onClose={close}
        >
          <p>
            This panel uses <code>size="{size}"</code>.
          </p>
        </SidePanel>
      )}
    </Flex>
  );
}

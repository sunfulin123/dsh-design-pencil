import { useState } from "react";
import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [checked, setChecked] = useState(false);
  return (
    <Flex padding="6" gap="4" alignX="center">
      <PopupTrigger
        keepOpen
        width="220px"
        content={
          <Flex direction="column" gap="2">
            <Typography variant="body-emphasis">Select options</Typography>
            <label>
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />{" "}
              Enable feature
            </label>
          </Flex>
        }
      >
        <Button type="secondary">keepOpen</Button>
      </PopupTrigger>

      <PopupTrigger
        width="220px"
        content={<Typography variant="body">Clicking inside closes the popup.</Typography>}
      >
        <Button type="secondary">Default (closes)</Button>
      </PopupTrigger>
    </Flex>
  );
}

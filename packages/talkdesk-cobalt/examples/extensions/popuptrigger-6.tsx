import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex padding="8" gap="6" alignX="center">
      <PopupTrigger content={<Typography variant="body">Opens below-right (default).</Typography>}>
        <Button type="secondary">Default SE/SW</Button>
      </PopupTrigger>

      <PopupTrigger
        direction="N"
        origin="S"
        content={<Typography variant="body">Opens above the trigger.</Typography>}
      >
        <Button type="secondary">Above N/S</Button>
      </PopupTrigger>

      <PopupTrigger
        direction="E"
        origin="W"
        content={<Typography variant="body">Opens to the right.</Typography>}
      >
        <Button type="secondary">Right E/W</Button>
      </PopupTrigger>
    </Flex>
  );
}

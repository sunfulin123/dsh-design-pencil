import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex padding="6" gap="4" alignX="center">
      <PopupTrigger content={<Typography variant="body">Popup content</Typography>}>
        <Button type="secondary">Enabled</Button>
      </PopupTrigger>

      <PopupTrigger disabled content={<Typography variant="body">This will not open</Typography>}>
        <Button type="secondary" disabled>
          Disabled
        </Button>
      </PopupTrigger>
    </Flex>
  );
}

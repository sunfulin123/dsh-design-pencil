import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex padding="6" alignX="center">
      <PopupTrigger
        content={<Typography variant="body">This is the popup panel content.</Typography>}
      >
        <Button type="secondary">Open panel</Button>
      </PopupTrigger>
    </Flex>
  );
}

import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex padding="6" gap="4" alignX="center">
      <PopupTrigger content={<Typography variant="body">Short content</Typography>}>
        <Button type="secondary">Auto width</Button>
      </PopupTrigger>

      <PopupTrigger
        width="280px"
        content={
          <Box>
            <Typography variant="body-emphasis">Filter Options</Typography>
            <Typography variant="caption">
              Panel is fixed at 280px — useful for structured menus.
            </Typography>
          </Box>
        }
      >
        <Button type="secondary">Fixed 280px</Button>
      </PopupTrigger>
    </Flex>
  );
}

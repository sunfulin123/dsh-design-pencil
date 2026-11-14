import { PopupTrigger, Typography } from "../../components/extensions/src";
import Button from "@talkdesk/cobalt-react-button";
import Icon from "@talkdesk/cobalt-react-icon";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex padding="6" gap="6" alignX="center" alignY="center">
      <PopupTrigger
        width="180px"
        content={
          <Flex direction="column" gap="2">
            <Typography variant="body">Edit</Typography>
            <Typography variant="body">Duplicate</Typography>
            <Typography variant="body">Delete</Typography>
          </Flex>
        }
      >
        <Button type="secondary" shape="compact">
          <Icon name="more_vert" size="small" />
        </Button>
      </PopupTrigger>

      <PopupTrigger
        width="220px"
        keepOpen
        content={
          <Box>
            <Typography variant="body-emphasis">Filter options</Typography>
            <Typography variant="caption">Popup stays open for interactive controls.</Typography>
          </Box>
        }
      >
        <Button type="secondary" shape="compact">
          <Icon name="filter" size="small" />
        </Button>
      </PopupTrigger>
    </Flex>
  );
}

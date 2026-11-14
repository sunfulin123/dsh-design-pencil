import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
import {
  PositionRightCenter,
  PositionCenterBottom,
} from "@talkdesk/cobalt-marketplace-react-tooltip";
export default function Demo() {
  return (
    <Flex gap="3" alignY="center">
      <Button tooltip="Save changes" type="primary">
        Save
      </Button>
      <Button
        tooltip={{ label: "Edit row", position: PositionRightCenter }}
        shape="compact"
        type="secondary"
        variation="transparent"
        aria-label="Edit"
      >
        <Icon name="edit" size="tiny" />
      </Button>
      <Button
        tooltip={{
          label: "Delete — cannot be undone",
          variation: "error",
          position: PositionCenterBottom,
        }}
        shape="compact"
        type="danger"
        variation="transparent"
        aria-label="Delete"
      >
        <Icon name="trash" size="tiny" />
      </Button>
    </Flex>
  );
}

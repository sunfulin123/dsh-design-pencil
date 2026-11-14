import { ToolbarWrapper, Typography } from "../../components/extensions/src";
import Input from "@talkdesk/cobalt-react-input";
import Icon from "@talkdesk/cobalt-react-icon";
import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <ToolbarWrapper
      end={
        <Flex alignY="center" gap={2}>
          <Input placeholder="Search by all queues" size="small" prefix="Search" />
          <Button type="secondary" variation="transparent" size="small">
            <Icon name="filter_list" size="tiny" />
            <Typography variant="caption" inline>
              Filters
            </Typography>
          </Button>
        </Flex>
      }
    />
  );
}

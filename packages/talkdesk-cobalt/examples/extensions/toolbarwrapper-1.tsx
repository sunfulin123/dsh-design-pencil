import { ToolbarWrapper, Typography } from "../../components/extensions/src";
import { useTheme } from "@talkdesk/cobalt-react-theme-provider";
import { Button } from "../../components/extensions/src";
import Input from "@talkdesk/cobalt-react-input";
import Icon from "@talkdesk/cobalt-react-icon";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const theme = useTheme();
  return (
    <ToolbarWrapper
      start={
        <Typography variant="body-emphasis" color={theme.textDefault}>
          80 Agents
        </Typography>
      }
      end={
        <Flex alignY="center" gap={2}>
          <Input placeholder="Search by agent" size="small" prefix="Search" />
          <Button type="secondary" size="small">
            + Create blank agent
          </Button>
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

import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Flex gap="2" alignY="center">
        <Button iconName="add" type="primary">
          Create
        </Button>
        <Button iconName="filter_list" type="secondary">
          Filters
        </Button>
        <Button iconName="chevron_right" iconPosition="end" type="secondary">
          Next
        </Button>
        <Button iconName="trash" type="danger" variation="outline">
          Delete
        </Button>
      </Flex>
      <Flex gap="2" alignY="center">
        <Button iconName="chevron_left" shape="compact" type="secondary" aria-label="Previous" />
        <Button iconName="chevron_right" shape="compact" type="secondary" aria-label="Next" />
        <Button
          iconName="more_horiz"
          shape="compact"
          type="secondary"
          variation="transparent"
          aria-label="More"
        />
      </Flex>
    </Flex>
  );
}

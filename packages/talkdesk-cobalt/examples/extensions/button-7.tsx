import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex gap="3" alignY="center">
      <Button disabled tooltip="You don't have permission to save">
        Save
      </Button>
      <Button
        disabled
        tooltip={{ label: "Tooltip is suppressed", disabled: true }}
        type="secondary"
      >
        Hover me — no tooltip
      </Button>
    </Flex>
  );
}

import { TimeSelectInput } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="6" width="240px">
      <TimeSelectInput size="small" value={540} onChange={() => {}} />
      <TimeSelectInput size="medium" value={540} onChange={() => {}} />
    </Flex>
  );
}

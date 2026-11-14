import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Typography tone="default">Default — primary text color</Typography>
      <Typography tone="subdued">Subdued — secondary metadata color</Typography>
      <Typography tone="primary">Primary — brand emphasis</Typography>
      <Typography tone="success">Success — confirmation text</Typography>
      <Typography tone="warning">Warning — caution text</Typography>
      <Typography tone="error">Error — destructive / failure text</Typography>
      <Typography tone="info">Info — informational note</Typography>
    </Flex>
  );
}

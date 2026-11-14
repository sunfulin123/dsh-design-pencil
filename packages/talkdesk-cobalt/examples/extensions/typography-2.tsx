import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="3">
      <Typography variant="page-title">Page title — 28px heading</Typography>
      <Typography variant="section-title">Section title — 24px heading</Typography>
      <Typography variant="card-title">Card title — 18px heading</Typography>
      <Typography variant="body-large">Body large — 16px text</Typography>
      <Typography variant="body">Body — 14px regular text (default)</Typography>
      <Typography variant="body-emphasis">Body emphasis — 14px medium weight</Typography>
      <Typography variant="caption">Caption — 12px helper text</Typography>
    </Flex>
  );
}

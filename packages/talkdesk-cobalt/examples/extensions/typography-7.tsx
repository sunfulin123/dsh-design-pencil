import Flex from "@talkdesk/cobalt-react-flex";
import { Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Flex direction="column" gap="2">
      <Typography variant="section-title">Section title — visual + semantic both h2</Typography>
      <Typography variant="section-title" asLevel={3}>
        Section title — visual h2, semantic h3 via asLevel
      </Typography>
    </Flex>
  );
}

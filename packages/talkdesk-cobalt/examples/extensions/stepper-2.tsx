import { Stepper, StepStatus, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex direction="column" padding="6" style={{ maxWidth: 300 }}>
      <Stepper status={StepStatus.VISITED} isEnd={false}>
        <Box paddingLeft="2" paddingBottom="4">
          <Typography variant="caption">First step — has connector below</Typography>
        </Box>
      </Stepper>
      <Stepper status={StepStatus.VISITED} isEnd>
        <Box paddingLeft="2" paddingBottom="4">
          <Typography variant="caption">Last step — no connector (isEnd)</Typography>
        </Box>
      </Stepper>
    </Flex>
  );
}

import { Stepper, StepStatus, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
export default function Demo() {
  return (
    <Flex direction="column" padding="6" style={{ maxWidth: 320 }}>
      <Stepper status={StepStatus.VISITED} isEnd={false}>
        <Box paddingLeft="2" paddingBottom="4">
          <Typography variant="caption" weight="medium">
            Step 1 — Completed
          </Typography>
          <Typography variant="caption" tone="subdued">
            Form submitted on Apr 20.
          </Typography>
        </Box>
      </Stepper>
      <Stepper status={StepStatus.ACTIVE} isEnd={false}>
        <Box paddingLeft="2" paddingBottom="4">
          <Typography variant="caption" weight="medium">
            Step 2 — In Progress
          </Typography>
          <Typography variant="caption" tone="subdued">
            Under review by the team.
          </Typography>
        </Box>
      </Stepper>
      <Stepper isEnd>
        <Box paddingLeft="2" paddingBottom="4">
          <Typography variant="caption" weight="medium">
            Step 3 — Pending
          </Typography>
          <Typography variant="caption" tone="subdued">
            Awaiting approval.
          </Typography>
        </Box>
      </Stepper>
    </Flex>
  );
}

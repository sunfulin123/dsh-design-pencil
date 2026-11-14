import { Stepper, StepStatus, Typography } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Box from "@talkdesk/cobalt-react-box";
const steps = [
  {
    label: "Created",
    detail: "Apr 18 — Request submitted",
    status: StepStatus.VISITED,
  },
  {
    label: "Approved",
    detail: "Apr 19 — Manager approved",
    status: StepStatus.VISITED,
  },
  {
    label: "In Progress",
    detail: "Apr 21 — Being processed",
    status: StepStatus.ACTIVE,
  },
  { label: "Completed", detail: "Awaiting completion", status: undefined },
];
export default function Demo() {
  return (
    <Flex direction="column" padding="6" style={{ maxWidth: 340 }}>
      {steps.map((step, i) => (
        <Stepper key={step.label} status={step.status} isEnd={i === steps.length - 1}>
          <Box paddingLeft="2" paddingBottom="4">
            <Typography variant="caption" weight="medium">
              {step.label}
            </Typography>
            <Typography variant="caption" tone="subdued">
              {step.detail}
            </Typography>
          </Box>
        </Stepper>
      ))}
    </Flex>
  );
}

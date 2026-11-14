import { Collapse, Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Collapse defaultOpen title="What does the application do?">
      <Typography variant="body">
        The application helps teams organize work, review schedules, and track
        adherence in real time.
      </Typography>
    </Collapse>
  );
}

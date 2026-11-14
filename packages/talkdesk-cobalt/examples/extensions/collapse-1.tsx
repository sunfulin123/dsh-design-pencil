import { Collapse, Typography } from "../../components/extensions/src";
export default function Demo() {
  return (
    <Collapse title="Controllability" data-qa="controllability">
      <Typography variant="body">
        Decision making: giving advice about operations is acceptable, but do not make decisions for
        the users.
      </Typography>
      <Typography variant="body">
        Controlled consequences: users should be granted the freedom to operate, including
        canceling, aborting or terminating current operation.
      </Typography>
    </Collapse>
  );
}

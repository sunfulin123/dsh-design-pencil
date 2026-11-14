import { useState } from "react";
import { Choice } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState("weekly");
  return (
    <Flex direction="column" gap="2">
      <Choice
        checked={value === "daily"}
        label="Daily"
        name="reforecast-cadence"
        type="radio"
        value="daily"
        onChange={(c) => c && setValue("daily")}
      />
      <Choice
        checked={value === "weekly"}
        label="Weekly"
        name="reforecast-cadence"
        type="radio"
        value="weekly"
        onChange={(c) => c && setValue("weekly")}
      />
      <Choice
        checked={value === "monthly"}
        label="Monthly"
        name="reforecast-cadence"
        type="radio"
        value="monthly"
        onChange={(c) => c && setValue("monthly")}
      />
    </Flex>
  );
}

import { useState } from "react";
import { TimeSelectInput, FormField } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [value, setValue] = useState(480);
  return (
    <Flex padding="6" width="240px">
      <FormField label="开始时间">
        <TimeSelectInput value={value} messages={{ am: "上午", pm: "下午" }} onChange={setValue} />
      </FormField>
    </Flex>
  );
}

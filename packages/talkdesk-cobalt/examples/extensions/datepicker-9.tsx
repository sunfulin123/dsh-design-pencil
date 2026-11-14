import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Flex gap="8" padding="4">
      <DatePicker
        label="Opens below (default)"
        value={date}
        onChange={setDate}
        placeholder="Select a date"
        data-qa="demo-pos-default"
      />
      <DatePicker
        label="Opens below-left"
        direction="SW"
        origin="SE"
        value={date}
        onChange={setDate}
        placeholder="Select a date"
        data-qa="demo-pos-sw"
      />
    </Flex>
  );
}

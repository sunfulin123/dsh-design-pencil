import { useState } from "react";
import { DateTimePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const frMonths = {
  1: "Janvier",
  2: "Février",
  3: "Mars",
  4: "Avril",
  5: "Mai",
  6: "Juin",
  7: "Juillet",
  8: "Août",
  9: "Septembre",
  10: "Octobre",
  11: "Novembre",
  12: "Décembre",
};
const frWeekdays = {
  SUN: "Dim",
  MON: "Lun",
  TUE: "Mar",
  WED: "Mer",
  THU: "Jeu",
  FRI: "Ven",
  SAT: "Sam",
};
export default function Demo() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <Flex padding="4">
      <DateTimePicker
        label="Début de réunion (FR)"
        weekStart="MON"
        months={frMonths}
        weekdays={frWeekdays}
        value={value}
        onChange={setValue}
        data-qa="localised"
      />
    </Flex>
  );
}

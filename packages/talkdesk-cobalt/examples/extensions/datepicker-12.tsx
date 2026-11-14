import { useState } from "react";
import { DatePicker } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const ptMonths = {
  1: "Janeiro",
  2: "Fevereiro",
  3: "Março",
  4: "Abril",
  5: "Maio",
  6: "Junho",
  7: "Julho",
  8: "Agosto",
  9: "Setembro",
  10: "Outubro",
  11: "Novembro",
  12: "Dezembro",
};
const ptWeekdays = {
  SUN: "Dom",
  MON: "Seg",
  TUE: "Ter",
  WED: "Qua",
  THU: "Qui",
  FRI: "Sex",
  SAT: "Sáb",
};
export default function Demo() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Flex padding="4">
      <DatePicker
        label="Data de início (PT)"
        weekStart="MON"
        months={ptMonths}
        weekdays={ptWeekdays}
        value={date}
        onChange={setDate}
        placeholder="Selecionar data"
        data-qa="demo-localised"
      />
    </Flex>
  );
}

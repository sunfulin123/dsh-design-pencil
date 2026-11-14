import { SelectGroup } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];
export default function Demo() {
  return (
    <Flex direction="column" gap="4" padding="4">
      <SelectGroup options={options} value="a" onChange={() => {}} size="small" />
      <SelectGroup options={options} value="a" onChange={() => {}} size="medium" />
      <SelectGroup options={options} value="a" onChange={() => {}} size="large" />
    </Flex>
  );
}

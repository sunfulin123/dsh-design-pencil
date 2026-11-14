import { SelectGroup } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
const options = [
  { value: "a", label: "Option A" },
  { value: "b", label: "Option B" },
  { value: "c", label: "Option C" },
];
export default function Demo() {
  return (
    <Flex gap="6" padding="4">
      <SelectGroup options={options} value="a" onChange={() => {}} variation="warning" />
      <SelectGroup options={options} value="b" onChange={() => {}} variation="error" />
    </Flex>
  );
}

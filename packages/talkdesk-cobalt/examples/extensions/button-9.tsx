import { Button } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
export default function Demo() {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        alert("Submitted");
      }}
    >
      <Flex gap="2">
        <Button htmlType="submit">Submit</Button>
        <Button htmlType="reset" type="secondary">
          Reset
        </Button>
      </Flex>
    </form>
  );
}

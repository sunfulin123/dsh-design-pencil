import { useState } from "react";
import { Input } from "../../components/extensions/src";
import Flex from "@talkdesk/cobalt-react-flex";
import Icon from "@talkdesk/cobalt-react-icon";
export default function Demo() {
  const [amount, setAmount] = useState("");
  const [domain, setDomain] = useState("");
  const [search, setSearch] = useState("");
  return (
    <Flex direction="column" gap={4} style={{ width: 360 }}>
      <Input
        isFullWidth
        type="number"
        prefix="$"
        suffix="USD"
        value={amount}
        placeholder="0.00"
        onChange={(e) => setAmount(e.target.value)}
      />
      <Input
        isFullWidth
        suffix=".talkdesk.com"
        value={domain}
        placeholder="my-team"
        onChange={(e) => setDomain(e.target.value)}
      />
      <Input
        isFullWidth
        type="search"
        prefix={<Icon name="search" size="tiny" />}
        value={search}
        placeholder="Search by agent"
        onChange={(e) => setSearch(e.target.value)}
      />
    </Flex>
  );
}

import { BasicTable } from "../../components/extensions/src";
export default function Demo() {
  return (
    <BasicTable
      headers={[
        { key: "name", title: "Name" },
        { key: "role", title: "Role" },
        { key: "team", title: "Team" },
        { key: "status", title: "Status" },
        { key: "shift", title: "Shift" },
        { key: "timezone", title: "Timezone" },
      ]}
      data={[]}
      isRequestError
      onRefresh={() => alert("Refreshing…")}
      currentPage={1}
      totalPages={1}
      onPageClick={() => {}}
    />
  );
}

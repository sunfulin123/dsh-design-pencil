import { BasicTable } from "../../components/extensions/src";
const zhMessages = {
  noResultsTitle: "暂无数据",
  noResultsMessage: "请调整搜索条件后重试。",
  noResultsAlt: "暂无数据",
  badRequestTitle: "加载失败",
  badRequestMessage: "数据加载时出现错误，请刷新重试。",
  badRequestAlt: "错误",
  refresh: "刷新",
  paginationPrevious: "上一页",
  paginationNext: "下一页",
};
export default function Demo() {
  return (
    <BasicTable
      headers={[{ key: "name", title: "姓名" }]}
      data={[]}
      messages={zhMessages}
      currentPage={1}
      totalPages={1}
      onPageClick={() => {}}
    />
  );
}

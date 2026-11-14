import type { DropdownOptionValue, DropdownOption } from "../../components/extensions/src";
import { useState, useCallback } from "react";
import { Dropdown } from "../../components/extensions/src";
function fakeApi(page: number): Promise<DropdownOption[]> {
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          Array.from({ length: 5 }, (_, i) => ({
            value: `p${page}-${i}`,
            label: `Page ${page} — Item ${i + 1}`,
          })),
        ),
      600,
    ),
  );
}
export default function Demo() {
  const [value, setValue] = useState<DropdownOptionValue | null>(null);
  const [options, setOptions] = useState<DropdownOption[]>(
    Array.from({ length: 5 }, (_, i) => ({
      value: `p1-${i}`,
      label: `Page 1 — Item ${i + 1}`,
    })),
  );
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMore = page < 4;
  const handleLoadMore = useCallback(async () => {
    setIsLoadingMore(true);
    const next = await fakeApi(page + 1);
    setOptions((prev) => [...prev, ...next]);
    setPage((p) => p + 1);
    setIsLoadingMore(false);
  }, [page]);
  return (
    <Dropdown
      value={value}
      options={options}
      onChange={setValue}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
      messages={{ placeholder: "Pick an item" }}
      data-qa="paginated-dropdown"
    />
  );
}

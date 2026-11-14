import type { MultiDropdownOptionValue, MultiDropdownOption } from "../../components/extensions/src";
import { useState, useCallback } from "react";
import { MultiDropdown } from "../../components/extensions/src";
function fakeApi(page: number): Promise<MultiDropdownOption[]> {
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
  const [value, setValue] = useState<MultiDropdownOptionValue[]>([]);
  const [options, setOptions] = useState<MultiDropdownOption[]>(
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
    <MultiDropdown
      dismissValues
      maxVisibleValues={3}
      value={value}
      options={options}
      onChange={setValue}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      onLoadMore={handleLoadMore}
      messages={{ placeholder: "Pick items" }}
      data-qa="paginated-multi-dropdown"
    />
  );
}

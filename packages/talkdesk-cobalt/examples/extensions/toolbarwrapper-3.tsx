import type { DropdownOptionValue, MultiDropdownOptionValue } from "../../components/extensions/src";
import { useState } from "react";
import {
  Button,
  DatePicker,
  Dropdown,
  MultiDropdown,
  SidePanel,
  ToolbarWrapper,
} from "../../components/extensions/src";
import Box from "@talkdesk/cobalt-react-box";
import Flex from "@talkdesk/cobalt-react-flex";
const viewOptions = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];
const statusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
const formatHeader = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
// Shared trigger height so DatePicker (FormField + 2px wrapper) and Dropdown
// (marketplace Input) line up. 32 = small input height in Cobalt.
const TRIGGER_HEIGHT = 32;
export default function Demo() {
  const [date, setDate] = useState(new Date(2026, 3, 24));
  const [view, setView] = useState<DropdownOptionValue | null>("day");
  const [filterOpen, setFilterOpen] = useState(false);
  const [statuses, setStatuses] = useState<MultiDropdownOptionValue[]>([
    "scheduled",
    "in_progress",
  ]);
  const [from, setFrom] = useState(new Date(2026, 3, 20));
  const [to, setTo] = useState(new Date(2026, 3, 27));
  const shiftDay = (delta: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + delta);
    setDate(next);
  };
  const resetFilters = () => {
    setStatuses([]);
    setFrom(new Date(2026, 3, 20));
    setTo(new Date(2026, 3, 27));
  };
  return (
    <>
      <ToolbarWrapper
        start={
          <Flex alignY="center" gap={2}>
            <Box style={{ width: 180, height: TRIGGER_HEIGHT }}>
              <DatePicker
                isFullWidth
                value={date}
                formatDate={formatHeader}
                onChange={setDate}
                data-qa="schedule-date"
              />
            </Box>
            <Button
              iconName="chevron_left"
              shape="compact"
              size="small"
              type="secondary"
              aria-label="Previous day"
              onClick={() => shiftDay(-1)}
            />
            <Button size="small" type="secondary" onClick={() => setDate(new Date())}>
              Today
            </Button>
            <Button
              iconName="chevron_right"
              shape="compact"
              size="small"
              type="secondary"
              aria-label="Next day"
              onClick={() => shiftDay(1)}
            />
            <Box style={{ width: 140, height: TRIGGER_HEIGHT }}>
              <Dropdown
                size="small"
                value={view}
                options={viewOptions}
                onChange={(v) => setView(v)}
                data-qa="view-mode"
              />
            </Box>
          </Flex>
        }
        end={
          <Flex alignY="center" gap={2}>
            <Button iconName="sort" size="small" type="secondary" variation="transparent">
              Sort options
            </Button>
            <Button
              iconName="filter_list"
              size="small"
              type="secondary"
              variation="transparent"
              onClick={() => setFilterOpen(true)}
            >
              Filters
            </Button>
          </Flex>
        }
      />

      <SidePanel
        visible={filterOpen}
        title="Filters"
        size="small"
        onClose={() => setFilterOpen(false)}
        actions={[
          { label: "Reset", type: "secondary", onClick: resetFilters },
          {
            label: "Apply",
            type: "primary",
            onClick: () => setFilterOpen(false),
          },
        ]}
      >
        <Flex direction="column" gap={4} width="100%">
          <MultiDropdown
            aria-label="Status"
            value={statuses}
            options={statusOptions}
            onChange={setStatuses}
            messages={{ placeholder: "Any status" }}
            data-qa="filter-status"
          />
          <DatePicker
            isFullWidth
            label="From"
            value={from}
            onChange={setFrom}
            data-qa="filter-from"
          />
          <DatePicker isFullWidth label="To" value={to} onChange={setTo} data-qa="filter-to" />
        </Flex>
      </SidePanel>
    </>
  );
}

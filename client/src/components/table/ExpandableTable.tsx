// components/common/ExpandableTable.tsx
import * as React from "react";

import {
  ChevronRightIcon,
  SuccessIcon,
} from "components/icons";
import { ReviewIcon } from "components/icons/Action/ReviewIcon";

import {
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  ColumnDef,
} from "@tanstack/react-table";

interface ExpandableTableProps<T extends { id: string; title: string; effectiveDate: string; status: string }> {
  data: T[];
  columns: ColumnDef<T, any>[];
  initiallyExpandedId?: string;
}

export function ExpandableTable<T extends { id: string; title: string; effectiveDate: string; status: string }>({
  data,
  columns,
  initiallyExpandedId,
}: ExpandableTableProps<T>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>(() =>
    initiallyExpandedId ? { [initiallyExpandedId]: true } : {}
  );

  const handleExpandedChange = React.useCallback(
    (updater: ExpandedState | ((prev: ExpandedState) => ExpandedState)) => {
      setExpanded((prev) => (typeof updater === "function" ? updater(prev) : updater));
    },
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { expanded },
    onExpandedChange: handleExpandedChange,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    getRowId: (row) => row.id,
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {table.getRowModel().rows.map((row) => {
          const { title, effectiveDate, status } = row.original;
          const isExpanded = row.getIsExpanded();

          return (
            <div key={row.id} className="border rounded px-4 py-2 bg-white">
              <div
                onClick={() => row.toggleExpanded()}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 cursor-pointer"
              >
                <div className="text-sm font-bold text-blue-900">{title}</div>

                <div className="h-1" />

                <div>{renderStatus(status)}</div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800">{formatDate(effectiveDate)}</span>
                  <ChevronRightIcon
                    className={`w-[1.25rem] h-[1.25rem] text-[var(--color-action)] transform transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                  />
                </div>
              </div>
              {isExpanded && (
                <div className="mt-2 px-2 py-2 bg-gray-100 text-sm italic text-gray-600 rounded-sm">
                  Expanded details coming soon.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const formatDate = (iso: string) => {
  const [yyyy, mm, dd] = iso.split("-");
  return `${mm}/${dd}/${yyyy}`;
};

const renderStatus = (status: string) => {
  const baseStyle = "flex items-center gap-1 text-sm";
  const iconClass = "w-[1.25rem] h-[1.25rem]"; // fixed icon size

  switch (status) {
    case "Under Review":
      return (
        <div className={`${baseStyle} text-left`}>
          <ReviewIcon className={`${iconClass} text-yellow-500`} />
          {status}
        </div>
      );
    case "Approved":
    case "Draft":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className={iconClass} />
          {status}
        </div>
      );
    default:
      return <span className="text-sm text-gray-700">{status}</span>;
  }
};

import * as React from "react";

import {
  ChevronRightIcon,
  SuccessIcon,
} from "components/icons";
import { ReviewIcon } from "components/icons/Action/ReviewIcon";

import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  AmendmentColumns,
  RawAmendment,
} from "../columns/AmendmentColumns";

interface AmendmentTableProps {
  data: RawAmendment[];
  demonstrationId: string;
}

export function AmendmentTable({ data }: AmendmentTableProps) {
  const [expanded, setExpanded] = React.useState({});

  const table = useReactTable({
    data,
    columns: AmendmentColumns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="w-full">
      {/* Amendment List */}
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
                {/* Title */}
                <div className="text-sm font-bold text-blue-900">{title}</div>

                {/* Spacer */}
                <div></div>

                {/* Status */}
                <div>{renderStatus(status)}</div>

                {/* Date + Chevron */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800">{formatDate(effectiveDate)}</span>
                  <ChevronRightIcon
                    className={`w-[18px] h-[18px] text-[var(--color-action)] transform transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                  />
                </div>
              </div>
              {/* Expanded Content */}
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
  switch (status) {
    case "Under Review":
      return (
        <div className={`${baseStyle} text-left`}>
          <ReviewIcon className="w-[18px] h-[18px] text-yellow-500" />
          {status}
        </div>
      );
    case "Approved":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className="w-[18px] h-[18px]" />
          {status}
        </div>
      );
    case "Draft":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className="w-[18px] h-[18px]" />
          {status}
        </div>
      );
    default:
      return (
        <span className="text-sm text-gray-700">{status}</span>
      );
  }
};

import * as React from "react";

import { ChevronRightIcon, SuccessIcon } from "components/icons";
import { ReviewIcon } from "components/icons/Action/ReviewIcon";

import { getCoreRowModel, getExpandedRowModel, useReactTable } from "@tanstack/react-table";

import { AmendmentColumns } from "../columns/AmendmentColumns";
import { Amendment } from "demos-server";

export type AmendmentTableRow = {
  name: Amendment["name"];
  effectiveDate: Amendment["effectiveDate"];
  amendmentStatus: Pick<Amendment["amendmentStatus"], "name">;
};

export function AmendmentTable({ amendments }: { amendments: AmendmentTableRow[] }) {
  const [expanded, setExpanded] = React.useState({});

  const table = useReactTable<AmendmentTableRow>({
    data: amendments,
    columns: AmendmentColumns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  return (
    <div className="w-full">
      <div className="flex flex-col gap-2">
        {table.getRowModel().rows.map((row) => {
          const { name, effectiveDate, amendmentStatus } = row.original;
          const isExpanded = row.getIsExpanded();

          return (
            <div key={row.id} className="border rounded px-4 py-2 bg-white">
              <div
                onClick={() => row.toggleExpanded()}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 cursor-pointer"
              >
                <div className="text-sm font-bold text-blue-900">{name}</div>

                <div className="h-1" />

                <div>{renderStatus(amendmentStatus.name)}</div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800">{formatDate(effectiveDate)}</span>
                  <ChevronRightIcon
                    className={`w-[1.4rem] h-[1.4rem] text-[var(--color-action)] transform transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
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

const formatDate = (date: Date | undefined) => {
  if (!date) return "N/A";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
};

const renderStatus = (status: string) => {
  const baseStyle = "flex items-center gap-1 text-sm";
  switch (status) {
    case "Under Review":
      return (
        <div className={`${baseStyle} text-left`}>
          <ReviewIcon className="w-[1.4rem] h-[1.4rem] text-yellow-500" />
          {status}
        </div>
      );
    case "Approved":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className="w-[1.4rem] h-[1.4rem]" />
          {status}
        </div>
      );
    case "Draft":
      return (
        <div className={`${baseStyle} text-left`}>
          <SuccessIcon className="w-[1.4rem] h-[1.4rem]" />
          {status}
        </div>
      );
    default:
      return <span className="text-sm text-gray-700">{status}</span>;
  }
};

import * as React from "react";

import { ChevronRightIcon, SuccessIcon } from "components/icons";
import { ReviewIcon } from "components/icons/Action/ReviewIcon";
import {
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ModificationColumns } from "../columns/ModificationColumns";
import { SecondaryButton } from "components/button";
import { Amendment, BundleStatus, Extension } from "demos-server";
import { formatDate } from "util/formatDate";

export type ModificationTableRow =
  | (Pick<Amendment, "id" | "name" | "effectiveDate"> & {
      status: BundleStatus;
    })
  | (Pick<Extension, "id" | "name" | "effectiveDate"> & {
      status: BundleStatus;
    });

export function ModificationTable({
  modifications,
  initiallyExpandedId,
  onView,
  viewLabel,
}: {
  modifications: ModificationTableRow[];
  initiallyExpandedId?: string;
  onView?: (modificationId: string) => void;
  viewLabel?: string;
}) {
  const [expanded, setExpanded] = React.useState<ExpandedState>(() =>
    initiallyExpandedId ? { [initiallyExpandedId]: true } : {}
  );

  const handleExpandedChange = React.useCallback(
    (updater: ExpandedState | ((prev: ExpandedState) => ExpandedState)) => {
      setExpanded((prev) => {
        return typeof updater === "function" ? updater(prev) : updater;
      });
    },
    []
  );

  const table = useReactTable<ModificationTableRow>({
    data: modifications,
    columns: ModificationColumns,
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
          const { name, effectiveDate, status } = row.original;
          const isExpanded = row.getIsExpanded();

          return (
            <div key={row.id} className="border rounded px-4 py-2 bg-white">
              <div
                onClick={() => row.toggleExpanded()}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 cursor-pointer"
              >
                <div className="text-sm font-bold text-blue-900">{name}</div>

                <div className="h-1" />

                <div>{renderStatus(status)}</div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-800">
                    {effectiveDate ? formatDate(effectiveDate) : "--/--/----"}
                  </span>
                  <ChevronRightIcon
                    className={`w-[1.25rem] h-[1.25rem] text-[var(--color-action)] transform transition-transform duration-200 ${isExpanded ? "rotate-90" : "rotate-0"}`}
                  />
                </div>
              </div>
              {isExpanded && (
                <div className="px-2 bg-gray-100 text-sm italic text-gray-600 rounded-sm">
                  <div className="px-2 py-2 bg-gray-100 text-sm text-gray-800 rounded-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="italic text-gray-600">Expanded details coming soon.</span>
                    {onView && (
                      <SecondaryButton
                        name="view-modification"
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          onView(row.original.id);
                        }}
                      >
                        {viewLabel ?? "View"}
                      </SecondaryButton>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

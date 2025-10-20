import * as React from "react";

import { ChevronRightIcon } from "components/icons";
import {
  ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ModificationColumns } from "../columns/ModificationColumns";
import { Amendment, ApplicationStatus, Extension } from "demos-server";
import { formatDate } from "util/formatDate";
import { DemonstrationStatusBadge } from "components/badge/DemonstrationStatusBadge";

export type ModificationTableRow =
  | (Pick<Amendment, "id" | "name" | "effectiveDate"> & {
      status: ApplicationStatus;
    })
  | (Pick<Extension, "id" | "name" | "effectiveDate"> & {
      status: ApplicationStatus;
    });

export function ModificationTable({
  modificationType,
  modifications,
  initiallyExpandedId,
}: {
  modificationType: "Amendment" | "Extension";
  modifications: ModificationTableRow[];
  initiallyExpandedId?: string;
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
        {modifications.length === 0 ? (
          <div className="text-sm text-gray-700 italic text-center">
            <p>
              There are currently no{" "}
              {modificationType === "Amendment" ? "amendments" : "extensions"} for this
              demonstration.
            </p>
            <p>
              To add a new {modificationType === "Amendment" ? "amendment" : "extension"}, click the
              &quot;Add New&quot; button.
            </p>
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const { name, effectiveDate, status } = row.original;
            const isExpanded = row.getIsExpanded();

            return (
              <div key={row.id} className="border rounded px-4 py-2 bg-white">
                <div
                  onClick={() => row.toggleExpanded()}
                  className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 cursor-pointer"
                >
                  <div className="text-sm font-bold text-blue-900">{name}</div>

                  <div className="flex justify-center items-center h-full">
                    {DemonstrationStatusBadge({ demonstrationStatus: status })}
                  </div>

                  <div className="flex items-center gap-3 ">
                    <span className="text-sm text-gray-800">
                      {effectiveDate ? formatDate(effectiveDate) : "--/--/----"}
                    </span>
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
          })
        )}
      </div>
    </div>
  );
}

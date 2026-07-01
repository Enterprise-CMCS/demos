import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { SecondaryButton } from "components/button";
import { ReportsTableRow } from "../tables/ReportsTable";
import { Spinner } from "components/loading/Spinner";

export function ReportsColumns(
  onDownload: (reportType: string) => void,
  downloadingReports: Set<string>
) {
  const columnHelper = createColumnHelper<ReportsTableRow>();

  return [
    columnHelper.accessor("id", {
      header: "Report Name",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        return (
          <div className="flex gap-2 justify-center">
            <SecondaryButton
              name={`download-${row.original.id}`}
              aria-label={`Download ${row.original.id}`}
              onClick={() => onDownload(row.original.id)}
              disabled={downloadingReports.has(row.original.id)}
            >
              <span className="relative inline-flex items-center justify-center">
                <span className={downloadingReports.has(row.original.id) ? "invisible" : ""}>
                  Download
                </span>

                {downloadingReports.has(row.original.id) && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <Spinner />
                  </span>
                )}
              </span>
            </SecondaryButton>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }),
  ];
}

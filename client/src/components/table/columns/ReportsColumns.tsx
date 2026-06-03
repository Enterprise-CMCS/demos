import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { SecondaryButton } from "components/button";
import { ReportsTableRow } from "../tables/ReportsTable";

export function ReportsColumns() {
  const columnHelper = createColumnHelper<ReportsTableRow>();

  return [
    columnHelper.accessor("id", {
      header: "Report Name",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex gap-2 justify-center">
            <SecondaryButton
              name={`download-${row.original.id}`}
              ariaLabel={`Download ${row.original.id}`}
              onClick={() => console.info(`Download action for report with id: ${row.original.id}`)}
            >
              Download
            </SecondaryButton>
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }),
  ];
}

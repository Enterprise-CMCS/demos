import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { SecondaryButton } from "components/button";
import { Reference } from "../tables/ReferencesTable";
import { useDialog } from "components/dialog/DialogContext";
import { useDownloadReference } from "components/dialog/referenceAgreement/useDownloadReference";

export function ReferencesColumns() {
  const { showReferenceAgreementDialog } = useDialog();

  const { downloadReference } = useDownloadReference();
  const columnHelper = createColumnHelper<Reference>();

  return [
    columnHelper.accessor("name", {
      header: "File Name",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("demonstrationTypes", {
      header: "Demo Type",
      cell: (cell) => cell.getValue().join(", "),
      enableColumnFilter: false,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("updatedAt", {
      header: "Last Updated",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        return (
          <div className="flex gap-2 justify-center">
            <SecondaryButton
              name={`download-${row.original.id}`}
              ariaLabel={`Download ${row.original.id}`}
              onClick={() => {
                if (row.original.agreement) {
                  showReferenceAgreementDialog({
                    ...row.original,
                    agreement: row.original.agreement,
                  });
                } else {
                  downloadReference(row.original);
                }
              }}
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

import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { SecondaryButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { Reference, ReferenceAgreement, Tag } from "demos-server";
import { formatDateForDisplay } from "util/formatDate";
import { Spinner } from "components/loading/Spinner";

export function ReferencesColumns(
  onDownload: (referenceId: string) => void,
  downloadingReferences: Set<string>
) {
  const { showReferenceAgreementDialog } = useDialog();
  const columnHelper = createColumnHelper<
    Pick<Reference, "id" | "name" | "description" | "updatedAt"> & {
      agreement: Pick<ReferenceAgreement, "id" | "name" | "createdAt"> | null;
      demonstrationTypes: Pick<Tag, "tagName">[];
    }
  >();

  return [
    columnHelper.accessor("name", {
      header: "File Name",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor(
      (reference) => reference.demonstrationTypes.map((tag) => tag.tagName).join(", "),
      {
        id: "demonstrationTypes",
        header: "Demo Type",
        cell: (cell) => {
          const value = cell.getValue();
          return value ? highlightCell(cell) : "-";
        },
        enableColumnFilter: false,
      }
    ),
    columnHelper.accessor("description", {
      header: "Description",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("updatedAt", {
      header: "Last Updated",
      cell: (cell) => formatDateForDisplay(cell.getValue()),
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const isDownloading = downloadingReferences.has(row.original.id);

        return (
          <div className="flex gap-2 justify-center">
            <SecondaryButton
              name={`download-${row.original.id}`}
              aria-label={
                row.original.agreement
                  ? `Open ${row.original.id} agreement`
                  : `Download ${row.original.id}`
              }
              onClick={() => {
                if (row.original.agreement) {
                  showReferenceAgreementDialog({
                    ...row.original,
                    agreement: row.original.agreement,
                  });
                } else {
                  onDownload(row.original.id);
                }
              }}
              disabled={isDownloading}
            >
              <span className="relative inline-flex items-center justify-center">
                <span className={isDownloading ? "invisible" : ""}>Download</span>
                {isDownloading && (
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

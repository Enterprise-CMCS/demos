import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { SecondaryButton } from "components/button";
import { useDialog } from "components/dialog/DialogContext";
import { useDownloadReference } from "hooks/useDownloadReference";
import { Reference, ReferenceAgreement, Tag } from "demos-server";
import { formatDateForDisplay } from "util/formatDate";

export function ReferencesColumns() {
  const { showReferenceAgreementDialog } = useDialog();

  const { downloadReference } = useDownloadReference();
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
                  downloadReference({ id: row.original.id, acceptedAgreementId: null });
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

import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { ApprovalPackageTableRow } from "components/table/tables/ApprovalPackageTable";
import { SecondaryButton, TertiaryButton } from "components/button";
import { DeleteIcon, EditIcon, ExportIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentType } from "demos-server";

export function ApprovalPackageColumns(demonstrationId: string) {
  const {
    showApprovalPackageDocumentUploadDialog,
    showEditDocumentDialog,
    showRemoveDocumentDialog,
  } = useDialog();

  const columnHelper = createColumnHelper<ApprovalPackageTableRow>();

  return [
    columnHelper.accessor("documentType", {
      id: "type",
      header: "Type",
      cell: highlightCell,
    }),
    columnHelper.accessor("name", {
      header: "Title",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("uploadedBy", {
      header: "Uploaded By",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("uploadedDate", {
      header: "Uploaded Date",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => {
        const doc = row.original.document;

        return (
          <div className="flex gap-2 justify-center">
            {!doc ? (
              <SecondaryButton
                name={`upload-${row.original.documentType}`}
                ariaLabel={`Upload ${row.original.documentType}`}
                onClick={() =>
                  showApprovalPackageDocumentUploadDialog(
                    demonstrationId,
                    row.original.documentType as DocumentType
                  )
                }
              >
                Upload <ExportIcon/>
              </SecondaryButton>
            ) : (
              <>
                <TertiaryButton
                  name={`edit-${doc.documentType}`}
                  ariaLabel={`Edit ${doc.documentType}`}
                  onClick={() =>
                    showEditDocumentDialog({
                      id: doc.id!,
                      name: doc.name,
                      description: doc.description,
                      file: null,
                      documentType: doc.documentType as DocumentType,
                    })
                  }
                >
                  <EditIcon />
                </TertiaryButton>
                <TertiaryButton
                  name={`delete-${doc.documentType}`}
                  ariaLabel={`Delete ${doc.documentType}`}
                  onClick={() => showRemoveDocumentDialog([doc.id])}
                >
                  <DeleteIcon />
                </TertiaryButton>
              </>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
    }),
  ];
}

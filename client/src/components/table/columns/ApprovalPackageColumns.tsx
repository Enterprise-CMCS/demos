import React from "react";
import { createColumnHelper, DisplayColumnDef } from "@tanstack/react-table";

import { highlightCell } from "components/table/KeywordSearch";
import { ApprovalPackageTableRow } from "components/table/tables/ApprovalPackageTable";
import { SecondaryButton, TertiaryButton } from "components/button";
import { DeleteIcon, EditIcon, ExportIcon } from "components/icons";
import { useDialog } from "components/dialog/DialogContext";
import { DocumentType } from "demos-server";

function getActionsColumn(
  columnHelper: ReturnType<typeof createColumnHelper<ApprovalPackageTableRow>>,
  demonstrationId: string,
  onUpload: (demonstrationId: string, documentType: DocumentType) => void,
  onEdit: (data: { id: string; name: string; description: string }) => void,
  onDelete: (ids: string[]) => void
): DisplayColumnDef<ApprovalPackageTableRow> {
  return columnHelper.display({
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const doc = row.original.document;

      return (
        <div className="flex gap-2 justify-center">
          {!doc ? (
            <SecondaryButton
              name={`upload-${row.original.documentType}`}
              aria-label={`Upload ${row.original.documentType}`}
              onClick={() => onUpload(demonstrationId, row.original.documentType as DocumentType)}
            >
              Upload <ExportIcon />
            </SecondaryButton>
          ) : (
            <>
              <TertiaryButton
                name={`edit-${doc.documentType}`}
                aria-label={`Edit ${doc.documentType}`}
                onClick={() =>
                  onEdit({
                    id: doc.id,
                    name: doc.name,
                    description: doc.description || "",
                  })
                }
              >
                <EditIcon />
              </TertiaryButton>
              <TertiaryButton
                name={`delete-${doc.documentType}`}
                aria-label={`Delete ${doc.documentType}`}
                onClick={() => onDelete([doc.id])}
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
  });
}

export function ApprovalPackageColumns(demonstrationId: string, isReadonlyUser: boolean) {
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
      header: "File Name",
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
    ...(isReadonlyUser
      ? []
      : [getActionsColumn(
          columnHelper,
          demonstrationId,
          showApprovalPackageDocumentUploadDialog,
          showEditDocumentDialog,
          showRemoveDocumentDialog
        )]),
  ];
}

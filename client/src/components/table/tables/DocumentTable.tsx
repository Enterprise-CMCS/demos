// DocumentTable.tsx
import * as React from "react";

import { CircleButton } from "components/button/CircleButton";
import { DeleteIcon, EditIcon, ImportIcon } from "components/icons";
import { ColumnFilter } from "../ColumnFilter";
import { DocumentColumns } from "../columns/DocumentColumns";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { Document as ServerDocument, Person } from "demos-server";
import { useDialog } from "components/dialog/DialogContext";
import { gql, useQuery } from "@apollo/client";

export type Document = Pick<
  ServerDocument,
  "id" | "name" | "description" | "documentType" | "createdAt"
> & {
  owner: { person: Pick<Person, "fullName"> };
};

export const DOCUMENTS_TABLE_QUERY = gql`
  query DocumentsTable($id: ID!) {
    demonstration(id: $id) {
      documents {
        id
        name
        description
        documentType
        createdAt
        owner {
          person {
            fullName
          }
        }
      }
    }
  }
`;

export type DocumentsTableProps = {
  applicationId: string;
};
export const DocumentTable: React.FC<DocumentsTableProps> = ({ applicationId }) => {
  const { showUploadDocumentDialog, showEditDocumentDialog, showRemoveDocumentDialog } =
    useDialog();
  const { data, loading, error } = useQuery<{ demonstration: { documents: Document[] } }>(
    DOCUMENTS_TABLE_QUERY,
    {
      variables: { id: applicationId },
    }
  );

  if (loading) {
    return <div>Loading documents...</div>;
  }

  if (error || !data) {
    return <div>Error loading documents.</div>;
  }

  const documents = data.demonstration.documents;

  const initialState = {
    sorting: [{ id: "createdAt", desc: true }],
  };
  const documentColumns = DocumentColumns();

  return (
    <div className="overflow-x-auto w-full mb-2">
      {documentColumns && (
        <Table<Document>
          data={documents}
          columns={documentColumns}
          keywordSearch={(table) => <KeywordSearch table={table} />}
          columnFilter={(table) => <ColumnFilter table={table} />}
          pagination={(table) => <PaginationControls table={table} />}
          emptyRowsMessage="No documents available."
          noResultsFoundMessage="No results were returned. Adjust your search and filter criteria."
          initialState={initialState}
          actionButtons={(table) => {
            const selectedDocs = table.getSelectedRowModel().rows.map((row) => row.original);
            const editDisabled = selectedDocs.length !== 1;
            const removeDisabled = selectedDocs.length < 1;
            return (
              <div className="flex gap-1 ml-4">
                <CircleButton
                  name="add-document"
                  ariaLabel="Add Document"
                  onClick={() => showUploadDocumentDialog(applicationId)}
                >
                  <ImportIcon />
                </CircleButton>
                <CircleButton
                  name="edit-document"
                  ariaLabel="Edit Document"
                  onClick={() =>
                    !editDisabled &&
                    showEditDocumentDialog({
                      id: selectedDocs[0].id,
                      name: selectedDocs[0].name,
                      description: selectedDocs[0].description,
                      documentType: selectedDocs[0].documentType,
                      file: null,
                    })
                  }
                  disabled={editDisabled}
                >
                  <EditIcon />
                </CircleButton>
                <CircleButton
                  name="remove-document"
                  ariaLabel="Remove Document"
                  onClick={() =>
                    !removeDisabled && showRemoveDocumentDialog(selectedDocs.map((doc) => doc.id))
                  }
                  disabled={removeDisabled}
                >
                  <DeleteIcon />
                </CircleButton>
              </div>
            );
          }}
        />
      )}
    </div>
  );
};

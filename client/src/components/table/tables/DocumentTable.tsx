// DocumentTable.tsx
import * as React from "react";

import { CircleButton } from "components/button/CircleButton";
import {
  AddDocumentDialog,
  EditDocumentDialog,
  RemoveDocumentDialog,
} from "components/dialog/document/DocumentDialog";
import { DeleteIcon, EditIcon, ImportIcon } from "components/icons";

import { ColumnFilter } from "../ColumnFilter";
import { highlightCell, KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";
import { Document as ServerDocument, User } from "demos-server";
import { gql, useQuery } from "@apollo/client";
import { useParams } from "react-router-dom";
import { createColumnHelper } from "@tanstack/react-table";
import { createSelectColumnDef } from "../columns/selectColumn";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { formatDate } from "util/formatDate";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { SecondaryButton } from "components/button";

export const DOCUMENT_TABLE_QUERY = gql`
  query DocumentTable($demonstrationId: ID!) {
    demonstration {
      id
      documents {
        id
        title
        description
        documentType
        createdAt
        owner {
          fullName
        }
      }
    }
  }
`;

type Document = Pick<
  ServerDocument,
  "id" | "title" | "description" | "documentType" | "createdAt"
> & {
  owner: Pick<User, "fullName">;
};

const columnHelper = createColumnHelper<Document>();

const documentColumns = [
  createSelectColumnDef(columnHelper),
  columnHelper.accessor("title", {
    header: "Title",
    cell: highlightCell,
    enableColumnFilter: false,
  }),
  columnHelper.accessor("description", {
    header: "Description",
    cell: highlightCell,
    enableColumnFilter: false,
  }),
  columnHelper.accessor("documentType", {
    id: "type",
    header: "Document Type",
    cell: highlightCell,
    filterFn: "arrIncludesSome",
    meta: {
      filterConfig: {
        filterType: "select",
        options: DOCUMENT_TYPES.map((type) => ({
          label: type,
          value: type,
        })),
      },
    },
  }),
  columnHelper.accessor("owner.fullName", {
    header: "Uploaded By",
    cell: highlightCell,
    enableColumnFilter: false,
  }),
  columnHelper.accessor("createdAt", {
    header: "Date Uploaded",
    cell: ({ getValue }) => {
      const dateValue = getValue();
      return formatDate(dateValue);
    },
    filterFn: (row, columnId, filterValue) => {
      const dateValue = row.getValue(columnId) as string;
      const date: Date = new Date(dateValue);
      const { start, end } = filterValue || {};
      if (start && end) {
        return (
          isSameDay(date, start) ||
          isSameDay(date, end) ||
          (isAfter(date, start) && isBefore(date, end))
        );
      }
      if (start) {
        return isSameDay(date, start) || isAfter(date, start);
      }
      if (end) {
        return isSameDay(date, end) || isBefore(date, end);
      }
      return true;
    },
    meta: {
      filterConfig: {
        filterType: "date",
      },
    },
  }),
  columnHelper.display({
    id: "view",
    header: "View",
    cell: ({ row }) => {
      const docId = row.original.id;
      const handleClick = () => {
        window.open(`/documents/${docId}`, "_blank");
      };
      return (
        <SecondaryButton size="small" onClick={handleClick} name="view-document">
          View
        </SecondaryButton>
      );
    },
    enableSorting: false,
  }),
];

type DisplayedModal = null | "add" | "edit" | "remove";

interface DocumentModalsProps {
  displayedModal: DisplayedModal;
  onClose: () => void;
  selectedDocs: Document[];
}

function DocumentModals({ displayedModal, onClose, selectedDocs }: DocumentModalsProps) {
  if (displayedModal === "add") {
    return <AddDocumentDialog isOpen={true} onClose={onClose} />;
  }
  if (displayedModal === "edit" && selectedDocs.length === 1) {
    const selectedDoc = selectedDocs[0];

    if (!selectedDoc) return null;

    return (
      <EditDocumentDialog
        isOpen={true}
        onClose={onClose}
        initialDocument={{
          id: selectedDoc.id,
          title: selectedDoc.title,
          description: selectedDoc.description,
          documentType: selectedDoc.documentType,
          file: null,
        }}
      />
    );
  }
  if (displayedModal === "remove" && selectedDocs.length > 0) {
    const selectedIds = selectedDocs.map((doc) => doc.id);
    return <RemoveDocumentDialog isOpen={true} documentIds={selectedIds} onClose={onClose} />;
  }
  return null;
}

interface DocumentActionButtonsProps {
  onShowModal: (modal: DisplayedModal) => void;
  editDisabled: boolean;
  removeDisabled: boolean;
}

function DocumentActionButtons({
  onShowModal,
  editDisabled,
  removeDisabled,
}: DocumentActionButtonsProps) {
  return (
    <div className="flex gap-2 ml-4">
      <CircleButton name="add-document" ariaLabel="Add Document" onClick={() => onShowModal("add")}>
        <ImportIcon />
      </CircleButton>
      <CircleButton
        name="edit-document"
        ariaLabel="Edit Document"
        onClick={() => !editDisabled && onShowModal("edit")}
        disabled={editDisabled}
      >
        <EditIcon />
      </CircleButton>
      <CircleButton
        name="remove-document"
        ariaLabel="Remove Document"
        onClick={() => !removeDisabled && onShowModal("remove")}
        disabled={removeDisabled}
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
}

export const DocumentTable: React.FC = () => {
  const [displayedModal, setDisplayedModal] = React.useState<DisplayedModal>(null);
  const { id } = useParams<{ id: string }>();

  const { data, loading, error } = useQuery<{
    demonstration: { documents: Document[] };
  }>(DOCUMENT_TABLE_QUERY, {
    variables: { demonstrationId: id! },
  });

  if (loading) {
    return <div>Loading documents...</div>;
  }
  if (error) {
    return <div>Error loading documents: {error.message}</div>;
  }

  const documents = data?.demonstration?.documents || [];

  const initialState = {
    sorting: [{ id: "createdAt", desc: true }],
  };

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
          actionButtons={(table) => (
            <DocumentActionButtons
              onShowModal={setDisplayedModal}
              editDisabled={table.getSelectedRowModel().rows.length !== 1}
              removeDisabled={table.getSelectedRowModel().rows.length < 1}
            />
          )}
          actionModals={(table) => {
            const selectedDocs = table.getSelectedRowModel().rows.map((row) => row.original);

            return (
              <DocumentModals
                displayedModal={displayedModal}
                onClose={() => setDisplayedModal(null)}
                selectedDocs={selectedDocs}
              />
            );
          }}
        />
      )}
    </div>
  );
};

// DocumentTable.tsx
import React from "react";
import { Table } from "../../Table";
import { DocumentColumns } from "./DocumentColumns";
import { useDocument } from "hooks/document/useDocument";
import { CircleButton } from "components/button/CircleButton";
import {
  DeleteIcon,
  EditIcon,
  ImportIcon,
} from "components/icons";
import {
  AddDocumentModal,
  EditDocumentModal,
  RemoveDocumentModal,
} from "components/modal/document/DocumentModal";
import { KeywordSearch } from "../../KeywordSearch";
import { ColumnFilter } from "../../ColumnFilter";
import { PaginationControls } from "../../PaginationControls";
import { Document } from "demos-server";
import { ApolloError } from "@apollo/client";

type DisplayedModal = null | "add" | "edit" | "remove";

export type DocumentTableRow = Pick<
  Document,
  "id" | "title" | "description" | "documentType" | "owner" | "createdAt"
>;

interface DocumentModalsProps {
  displayedModal: DisplayedModal;
  onClose: () => void;
  selectedIds: string[];
}

function DocumentModals({ displayedModal, onClose, selectedIds }: DocumentModalsProps) {
  if (displayedModal === "add") {
    return <AddDocumentModal onClose={onClose} />;
  }
  if (displayedModal === "edit" && selectedIds.length === 1) {
    return <EditDocumentModal documentId={selectedIds[0]} onClose={onClose} />;
  }
  if (displayedModal === "remove" && selectedIds.length > 0) {
    return <RemoveDocumentModal documentIds={selectedIds} onClose={onClose} />;
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
      <CircleButton ariaLabel="Add Document" onClick={() => onShowModal("add")}>
        <ImportIcon />
      </CircleButton>
      <CircleButton
        ariaLabel="Edit Document"
        onClick={() => !editDisabled && onShowModal("edit")}
        disabled={editDisabled}
      >
        <EditIcon />
      </CircleButton>
      <CircleButton
        ariaLabel="Remove Document"
        onClick={() => !removeDisabled && onShowModal("remove")}
        disabled={removeDisabled}
      >
        <DeleteIcon />
      </CircleButton>
    </div>
  );
}

export function DocumentTable() {
  const [displayedModal, setDisplayedModal] = React.useState<DisplayedModal>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [documents, setDocuments] = React.useState<DocumentTableRow[]>([]);
  const { documentColumns, documentColumnsLoading, documentColumnsError } = DocumentColumns();

  const { getDemonstrationDocuments } = useDocument();

  // Fetch Documents
  React.useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Replace 'demonstrationId' with the actual id you want to fetch
        const demonstrationId = "demo-id";
        const result = await getDemonstrationDocuments(demonstrationId);
        setDocuments(result.data?.documents ?? []);
      } catch (err: unknown) {
        if (err instanceof ApolloError) {
          setError(err.message || "Error loading demonstrations");
        } else {
          setError("Unknown error");
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  if (documentColumnsLoading) return <div className="p-4">Loading...</div>;
  if (documentColumnsError)
    return <div className="p-4">Error loading data: {documentColumnsError}</div>;

  if (isLoading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4">Error loading demonstrations: {error}</div>;
  if (!documents || documents.length === 0) return <div className="p-4">Documents not found</div>;

  const initialState = {
    sorting: [{ id: "createdAt", desc: true }],
  };

  return (
    <div className="overflow-x-auto w-full mb-2">
      {documentColumns && (
        <Table<DocumentTableRow>
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
            const selectedIds = table.getSelectedRowModel().rows.map((row) => String(row.id));
            return (
              <DocumentModals
                displayedModal={displayedModal}
                onClose={() => setDisplayedModal(null)}
                selectedIds={selectedIds}
              />
            );
          }}
        />
      )}
    </div>
  );
}

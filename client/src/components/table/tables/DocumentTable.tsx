// DocumentTable.tsx
import * as React from "react";

import { CircleButton } from "components/button/CircleButton";
import {
  AddDocumentDialog,
  EditDocumentDialog,
  RemoveDocumentDialog,
} from "components/dialog/document/DocumentDialog";
import { DeleteIcon, EditIcon, ImportIcon } from "components/icons";
import { DocumentTableRow, useDocument } from "hooks/useDocument";

import { ColumnFilter } from "../ColumnFilter";
import { DocumentColumns } from "../columns/DocumentColumns";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";

type DisplayedModal = null | "add" | "edit" | "remove";

interface DocumentModalsProps {
  displayedModal: DisplayedModal;
  onClose: () => void;
  selectedDocs: DocumentTableRow[];
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

export function DocumentTable() {
  const [displayedModal, setDisplayedModal] = React.useState<DisplayedModal>(null);
  const { documentColumns, documentColumnsLoading, documentColumnsError } = DocumentColumns();

  const { getDocumentTable } = useDocument();
  const {
    data: documentsTableData,
    loading: documentTableLoading,
    error: documentsTableError,
  } = getDocumentTable;

  React.useEffect(() => {
    getDocumentTable.trigger();
  }, []);

  if (documentColumnsLoading) return <div className="p-4">Loading...</div>;
  if (documentColumnsError)
    return <div className="p-4">Error loading data: {documentColumnsError}</div>;

  if (documentTableLoading) return <div className="p-4">Loading...</div>;
  if (documentsTableError) return <div className="p-4">Error loading documents</div>;
  if (!documentsTableData) return <div className="p-4">Documents not found</div>;

  const initialState = {
    sorting: [{ id: "createdAt", desc: true }],
  };

  return (
    <div className="overflow-x-auto w-full mb-2">
      {documentColumns && (
        <Table<DocumentTableRow>
          data={documentsTableData}
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
}

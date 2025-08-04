// DocumentTable.tsx
import * as React from "react";
import { Table } from "../Table";
import { DocumentColumns } from "../columns/DocumentColumns";
import { DocumentTableRow, useDocument } from "hooks/useDocument";
import { CircleButton } from "components/button/CircleButton";
import { EditIcon, ImportIcon, DeleteIcon } from "components/icons";
import {
  AddDocumentModal,
  EditDocumentModal,
  RemoveDocumentModal,
} from "components/modal/document/DocumentModal";
import { KeywordSearch } from "../KeywordSearch";
import { ColumnFilter } from "../ColumnFilter";
import { PaginationControls } from "../PaginationControls";

type DisplayedModal = null | "add" | "edit" | "remove";

type DocumentModalsProps = {
  displayedModal: DisplayedModal;
  onClose: () => void;
  selectedIds: string[];
};

function DocumentModals({
  displayedModal,
  onClose,
  selectedIds,
}: DocumentModalsProps) {
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
  const [displayedModal, setDisplayedModal] =
    React.useState<DisplayedModal>(null);
  const { documentColumns, documentColumnsLoading, documentColumnsError } =
    DocumentColumns();

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
    return (
      <div className="p-4">Error loading data: {documentColumnsError}</div>
    );

  if (documentTableLoading) return <div className="p-4">Loading...</div>;
  if (documentsTableError)
    return <div className="p-4">Error loading demonstrations</div>;
  if (!documentsTableData)
    return <div className="p-4">Documents not found</div>;

  const initialState = {
    sorting: [{ id: "uploadDate", desc: true }],
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
            const selectedIds = table
              .getSelectedRowModel()
              .rows.map((row) => String(row.id));
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

// DocumentTable.tsx
import * as React from "react";

import { CircleButton } from "components/button/CircleButton";
import {
  EditIcon,
  ImportIcon,
} from "components/icons";
import {
  AddDocumentModal,
  EditDocumentModal,
} from "components/modal/document/DocumentModal";
import {
  DocumentTableRow,
  useDocument,
} from "hooks/useDocument";

import { ColumnFilter } from "../ColumnFilter";
import { DocumentColumns } from "../columns/DocumentColumns";
import { KeywordSearch } from "../KeywordSearch";
import { PaginationControls } from "../PaginationControls";
import { Table } from "../Table";

type DisplayedModal = null | "add" | "edit";

interface DocumentModalsProps {
  displayedModal: DisplayedModal;
  onClose: () => void;
  documentId: string;
}
function DocumentModals({
  displayedModal,
  onClose,
  documentId,
}: DocumentModalsProps) {
  return (
    <>
      {displayedModal === "add" && <AddDocumentModal onClose={onClose} />}
      {displayedModal === "edit" && (
        <EditDocumentModal documentId={documentId} onClose={onClose} />
      )}
    </>
  );
}

interface DocumentActionButtonsProps {
  onShowModal: (modal: DisplayedModal) => void;
  editDisabled: boolean;
}

function DocumentActionButtons({
  onShowModal,
  editDisabled,
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
            />
          )}
          actionModals={(table) => (
            <DocumentModals
              displayedModal={displayedModal}
              onClose={() => setDisplayedModal(null)}
              documentId={
                table.getSelectedRowModel().rows.length === 1
                  ? String(table.getSelectedRowModel().rows[0].id)
                  : ""
              }
            />
          )}
        />
      )}
    </div>
  );
}

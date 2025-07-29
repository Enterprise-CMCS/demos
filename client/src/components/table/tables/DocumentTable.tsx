// DocumentTable.tsx
import * as React from "react";
import { Table } from "../Table";
import { DocumentColumns } from "../columns/DocumentColumns";
import { DocumentTableRow, useDocument } from "hooks/useDocument";

export function DocumentTable() {
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

  return (
    <div className="overflow-x-auto w-full mb-2">
      {documentColumns && (
        <Table<DocumentTableRow>
          data={documentsTableData}
          columns={documentColumns}
          keywordSearch
          columnFilter
          pagination
          emptyRowsMessage="No documents available."
          noResultsFoundMessage="Documents not found."
        />
      )}
    </div>
  );
}

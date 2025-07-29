// DocumentTable.tsx
import * as React from "react";
import { Table } from "../Table";
import { useDocumentColumns } from "../columns/useDocumentColumns";

export interface DocumentTableRow {
  id: number;
  title: string;
  description: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
}

export function DocumentTable() {
  const { documentColumns, documentColumnsLoading, documentColumnsError } =
    useDocumentColumns();

  const { getDocumentsTable } = useDocument();
  const {
    data: documentsTableData,
    loading: documentTableLoading,
    error: documentsTableError,
  } = getDocumentsTable;

  if (documentsTableLoading) return <div className="p-4">Loading...</div>;
  if (documentsTableError)
    return <div className="p-4">Error loading demonstrations</div>;
  if (!documentsTableData)
    return <div className="p-4">Demonstrations not found</div>;

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

import React, { useEffect } from "react";

import { Table } from "components/table/Table";
import { SecondaryButton } from "components/button";
import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../search/KeywordSearch";
import { useDocument } from "hooks/useDocuments";
import { useDocumentType } from "hooks/useDocumentType";

export const DocumentsTable = () => {
  const { getAllDocumentTypes } = useDocumentType();
  const {
    trigger: triggerGetAllDocumentTypes,
    data: documentTypesData,
    loading: documentTypesLoading,
    error: documentTypesError,
  } = getAllDocumentTypes;
  useEffect(() => {
    triggerGetAllDocumentTypes();
  }, []);

  const { getAllDocuments } = useDocument();
  const {
    trigger: triggerGetAllDocuments,
    data: documentsData,
    loading: documentsLoading,
    error: documentsError,
  } = getAllDocuments;
  useEffect(() => {
    triggerGetAllDocuments();
  }, []);

  if (documentTypesLoading || documentsLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (documentTypesError) {
    return <div className="p-4">Error loading document types</div>;
  }
  if (documentsError) {
    return <div className="p-4">Error loading documents</div>;
  }
  if (!documentsData || !documentTypesData) {
    return <div className="p-4">No documents available.</div>;
  }

  const columnHelper = createColumnHelper<Document>();
  const documentColumns = [
    columnHelper.display({
      id: "Select",
      header: ({ table }) => (
        <input
          id="select-all-rows"
          type="checkbox"
          className="cursor-pointer"
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          id={`select-row-${row.id}`}
          type="checkbox"
          className="cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
      size: 20,
    }),
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
    columnHelper.accessor("type", {
      header: "Type",
      cell: highlightCell,
      meta: {
        filterConfig: {
          filterType: "select",
          options: documentTypesData?.map((type) => ({
            label: type.name,
            value: type.name,
          })),
        },
      },
    }),
    columnHelper.accessor("uploadedBy", {
      header: "Uploaded By",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("uploadDate", {
      header: "Date Uploaded",
      cell: ({ getValue }) => {
        const [yyyy, mm, dd] = (getValue() as string).split("-");
        return `${mm}/${dd}/${yyyy}`;
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
          <SecondaryButton
            size="small"
            onClick={handleClick}
            className="px-2 py-0 text-sm font-medium"
          >
            View
          </SecondaryButton>
        );
      },
      enableSorting: false,
    }),
  ];

  return (
    <>
      <Table<Document>
        data={documentsData}
        columns={documentColumns}
        keywordSearch
        columnFilter
        pagination
        emptyRowsMessage="No documents available."
        noResultsFoundMessage="No documents match your search criteria."
      />
    </>
  );
};

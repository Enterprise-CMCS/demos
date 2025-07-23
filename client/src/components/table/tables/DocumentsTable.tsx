import React from "react";
import { useQuery } from "@apollo/client";

import { Table } from "components/table/Table";
import { gql } from "@apollo/client";
import { SecondaryButton } from "components/button";
import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../search/KeywordSearch";
import { Option } from "components/input/select/AutoCompleteSelect";

const typeOptions: Option[] = [
  { label: "Pre-Submission Concept", value: "Pre-Submission Concept" },
  { label: "General File", value: "General File" },
  { label: "Budget Neutrality Workbook", value: "Budget Neutrality Workbook" },
];

export type Document = {
  id: number;
  title: string;
  description: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
};

export const DOCUMENT_TABLE_QUERY = gql`
  query GetDocuments {
    documents {
      id
      title
      description
      type
      uploadedBy
      uploadDate
    }
  }
`;

export const DocumentsTable = () => {

  const columnHelper = createColumnHelper<Document>();
  const columns = [
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
          options: typeOptions,
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

  const {
    data: documentsData,
    loading: documentsLoading,
    error: documentsError,
  } = useQuery<{ documents: Document[] }>(DOCUMENT_TABLE_QUERY);

  if (documentsLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (documentsError) {
    return (
      <div className="p-4">
        Error loading documents: {documentsError.message}
      </div>
    );
  }

  if (!documentsData) {
    return <div className="p-4">Demonstration not found</div>;
  }

  return (
    <div className="p-4">
      <div>
        <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">
          Documents
        </h1>
        <div className="h-[60vh] overflow-y-auto">
          <Table<Document>
            data={documentsData.documents}
            columns={columns}
            keywordSearch
            columnFilter
            emptyRowsMessage="No documents available."
            noResultsFoundMessage="No documents match your search criteria."
          />
        </div>
      </div>
    </div>
  );
};

import * as React from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { SecondaryButton } from "components/button";
import { highlightCell } from "components/table/Table";
import { Option } from "components/input/select/AutoCompleteSelect";
import { Document } from "./DemonstrationDetail";

const typeOptions: Option[] = [
  { label: "Pre-Submission Concept", value: "Pre-Submission Concept" },
  { label: "General File", value: "General File" },
  { label: "Budget Neutrality Workbook", value: "Budget Neutrality Workbook" },
];

const columnHelper = createColumnHelper<Document>();

export const useDocumentColumns = () => {
  const documentColumns = React.useMemo(() => [
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
    columnHelper.accessor("title",{
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
          <SecondaryButton size="small" onClick={handleClick} className="px-2 py-0 text-sm font-medium">
            View
          </SecondaryButton>
        );
      },
      enableSorting: false,
    }),
  ], []);

  return {
    columns: documentColumns as ColumnDef<Document, unknown>[],
  };
};

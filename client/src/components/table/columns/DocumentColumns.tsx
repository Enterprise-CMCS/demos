// DocumentColumns.tsx
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SecondaryButton } from "../../button/SecondaryButton";
import { RawDocument } from "components/table/tables/DocumentTable";
import { DemonstrationColumns } from "./DemonstrationColumns";

export type DocumentColumns = {
  id: number;
  title: string;
  description: string;
  type: string;
  uploadedBy: string;
  uploadDate: string;
  createdAt: string;
  updatedAt: string;
};

const selectColumn: ColumnDef<DocumentColumns> = {
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
};

const dataColumns: ColumnDef<RawDocument>[] = [
  {
    header: "Title",
    accessorKey: "title",
  },
  {
    header: "Description",
    accessorKey: "description",
  },
  {
    header: "Type",
    accessorKey: "type",
  },
  {
    header: "Uploaded By",
    accessorKey: "uploadedBy",
  },
  {
    header: "Date Uploaded",
    accessorKey: "uploadDate",
    cell: ({ getValue }) => {
      const [yyyy, mm, dd] = (getValue() as string).split("-");
      return `${mm}/${dd}/${yyyy}`;
    },
  },
  {
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
  },
];

export const DocumentColumns: ColumnDef<DocumentColumns>[] = [
  selectColumn,
  ...dataColumns,
];

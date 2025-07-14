// DocumentColumns.tsx
import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { SecondaryButton } from "../../button/SecondaryButton";
import { RawDocument } from "components/table/tables/DocumentTable";

export const DocumentColumns: ColumnDef<RawDocument>[] = [
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

import { ColumnDef } from "@tanstack/react-table";

export type RawExtension = {
  id: string;
  title: string;
  status: string;
  effectiveDate: string; // ISO string (e.g., "2025-07-21")
};

export const ExtensionColumns: ColumnDef<RawExtension>[] = [
  {
    header: "Title",
    accessorKey: "title",
  },
  {
    header: "Status",
    accessorKey: "status",
  },
  {
    header: "Effective Date",
    accessorKey: "effectiveDate",
    cell: ({ getValue }) => {
      const [yyyy, mm, dd] = (getValue() as string).split("-");
      return `${mm}/${dd}/${yyyy}`;
    },
  },
];

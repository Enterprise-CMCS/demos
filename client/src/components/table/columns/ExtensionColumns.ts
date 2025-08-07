import { ColumnDef } from "@tanstack/react-table";
import { ExtensionTableRow } from "../tables/ExtensionTable";

export const ExtensionColumns: ColumnDef<ExtensionTableRow>[] = [
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

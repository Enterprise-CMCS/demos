// components/table/columns/AmendmentColumns.ts
import { ColumnDef } from "@tanstack/react-table";
import { AmendmentTableRow } from "../tables/AmendmentTable";

export const AmendmentColumns: ColumnDef<AmendmentTableRow>[] = [
  {
    header: "Title",
    accessorKey: "name",
  },
  {
    header: "Status",
    accessorKey: "amendmentStatus.name",
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

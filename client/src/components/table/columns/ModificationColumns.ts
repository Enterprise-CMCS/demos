import { ColumnDef } from "@tanstack/react-table";
import { Amendment } from "../tables/AmendmentTable";
import { Extension } from "../tables/ExtensionTable";

export const ModificationColumns: ColumnDef<Amendment | Extension>[] = [
  {
    accessorKey: "createdAt",
  },
  {
    header: "Title",
    accessorKey: "name",
  },
  {
    header: "Status",
    accessorKey: "status.name",
  },
  {
    header: "Effective Date",
    accessorKey: "effectiveDate",
  },
];

// components/table/columns/AmendmentColumns.ts
import { ColumnDef } from "@tanstack/react-table";
import { AmendmentTableRow } from "../tables/AmendmentTable";

// TODO: currently, this isnt really in use. We render the table directly in the component. We still
// use the table for managing expansion, and i imagine we will use it for something later. For now,
// removing the cell rendering.
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
  },
];

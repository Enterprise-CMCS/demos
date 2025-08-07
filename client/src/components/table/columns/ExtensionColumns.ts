import { ColumnDef } from "@tanstack/react-table";
import { ExtensionTableRow } from "../tables/ExtensionTable";

// TODO: currently, this isnt really in use. We render the table directly in the component. We still
// use the table for managing expansion, and i imagine we will use it for something later. For now,
// removing the cell rendering.
export const ExtensionColumns: ColumnDef<ExtensionTableRow>[] = [
  {
    header: "Title",
    accessorKey: "name",
  },
  {
    header: "Status",
    accessorKey: "extensionsStatus.name",
  },
  {
    header: "Effective Date",
    accessorKey: "effectiveDate",
  },
];

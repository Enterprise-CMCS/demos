import React from "react";
import { ColumnHelper, Row, Table } from "@tanstack/react-table";

export function createSelectColumnDef<T>(columnHelper: ColumnHelper<T>) {
  return columnHelper.display({
    id: "select",
    header: ({ table }: { table: Table<T> }) => (
      <input
        id="select-all-rows"
        type="checkbox"
        className="cursor-pointer"
        aria-label="Select all rows"
        checked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }: { row: Row<T> }) => (
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
  });
}

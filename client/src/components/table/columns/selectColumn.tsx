import React from "react";
import { ColumnHelper, Row, Table } from "@tanstack/react-table";
import { Checkbox } from "components/input";

export function createSelectColumnDef<T>(columnHelper: ColumnHelper<T>) {
  return columnHelper.display({
    id: "select",
    header: ({ table }: { table: Table<T> }) => (
      <Checkbox
        name="select-all-rows"
        defaultChecked={table.getIsAllPageRowsSelected()}
        onChange={table.getToggleAllPageRowsSelectedHandler()}
      />
    ),
    cell: ({ row }: { row: Row<T> }) => (
      <Checkbox
        name={`select-row-${row.id}`}
        defaultChecked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
  });
}

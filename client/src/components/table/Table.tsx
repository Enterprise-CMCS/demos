import * as React from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

export interface TableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  className?: string;
  keywordSearch?: React.ReactNode;
  columnFilter?: React.ReactNode;
  pagination?: React.ReactNode;
}

export function Table<T>({
  data,
  columns,
  className,
  keywordSearch,
  columnFilter,
  pagination,
}: TableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Helper function to clone component with table props
  const cloneWithTableProps = (component: React.ReactNode) => {
    if (React.isValidElement(component)) {
      return React.cloneElement(component, {
        table,
        columns: table.getAllColumns().filter(col => col.getCanFilter()),
      } as Record<string, unknown>);
    }
    return component;
  };

  return (
    <div className={`${className || ""}`}>
      <div className="flex items-center mb-2">

        {/* Search Section */}
        {keywordSearch && (
          <div>
            {cloneWithTableProps(keywordSearch)}
          </div>
        )}

        {/* Filter Section */}
        {columnFilter && (
          <div>
            {cloneWithTableProps(columnFilter)}
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="h-[60vh] overflow-y-auto">
        <table className="w-full table-fixed text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-gray-200">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-2 py-1 font-semibold text-left border-b cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: " ↑",
                      desc: " ↓",
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={row.depth > 0 ? "bg-gray-200" : ""}
              >
                {row.getVisibleCells().map((cell) => {
                  return (
                    <td key={cell.id} className="px-2 py-1 border-b">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {pagination && (
          <div>
            {cloneWithTableProps(pagination)}
          </div>
        )}
      </div>
    </div>
  );
}

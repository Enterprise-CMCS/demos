import * as React from "react";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  useReactTable,
} from "@tanstack/react-table";
import { KeywordSearch } from "./search/KeywordSearch";
import { ColumnFilter } from "./filters/ColumnFilter";
import { PaginationControls } from "./pagination/PaginationControls";

export interface TableProps<T> {
  data: T[];
  // any is allowed because the column definitions intentionally allow for flexibility in types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  className?: string;
  keywordSearch?: boolean;
  columnFilter?: boolean;
  pagination?: boolean;
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
}

export function Table<T>({
  data,
  columns,
  className,
  keywordSearch,
  columnFilter,
  pagination,
  emptyRowsMessage = "No data available.",
  noResultsFoundMessage = "No results found.",
}: TableProps<T>) {
  const arrIncludesAllInsensitive = (
    row: Row<T>,
    columnId: string,
    filterValue: (string | undefined)[]
  ) => {
    const validFilterValues = filterValue.filter(
      (val): val is string => val != null
    );

    if (validFilterValues.length === 0) {
      return true;
    }

    return !validFilterValues.some((val: string) => {
      const search = val.toLowerCase();
      const rowValue = row.getValue(columnId);

      return !(
        rowValue != null && rowValue.toString().toLowerCase().includes(search)
      );
    });
  };

  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: arrIncludesAllInsensitive,
  });

  const hasDataInitially = data.length > 0;
  const hasDataAfterFiltering = table.getFilteredRowModel().rows.length > 0;
  const filtersClearedOutData = hasDataInitially && !hasDataAfterFiltering;

  return (
    <div className={`${className || ""}`}>
      <div className="flex items-center mb-2">
        {/* Search Section */}
        {keywordSearch && <KeywordSearch table={table} />}

        {/* Filter Section */}
        {columnFilter && <ColumnFilter table={table} />}
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
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
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
            {filtersClearedOutData ? (
              <tr>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  className="px-4 py-8 text-center text-gray-800 text-xl"
                >
                  {noResultsFoundMessage}
                </td>
              </tr>
            ) : !hasDataInitially ? (
              <tr>
                <td
                  colSpan={table.getAllLeafColumns().length}
                  className="px-4 py-8 text-center text-gray-800 text-xl"
                >
                  {emptyRowsMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className={row.depth > 0 ? "bg-gray-200" : ""}>
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <td key={cell.id} className="px-2 py-1 border-b">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
        {pagination && <PaginationControls table={table} />}
      </div>
    </div>
  );
}

import * as React from "react";

import {
  ColumnDef,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { arrIncludesAllInsensitive, KeywordSearch } from "./KeywordSearch";
import { ColumnFilter } from "./ColumnFilter";
import { PaginationControls } from "./PaginationControls";

export interface TableProps<T> {
  data: T[];
  // explicitly allowing any because the column definitions intentionally allow for flexibility in types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  className?: string;
  keywordSearch?: boolean;
  columnFilter?: boolean;
  pagination?: boolean;
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
  getSubRows?: (originalRow: T, index: number) => T[] | undefined;
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
  getSubRows,
}: TableProps<T>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});

  const table = useReactTable<T>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: arrIncludesAllInsensitive,
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: getSubRows,
    filterFromLeafRows: true,
    state: { expanded },
    onExpandedChange: setExpanded,
  });

  const hasDataInitially = data.length > 0;
  const hasDataAfterFiltering = table.getFilteredRowModel().rows.length > 0;
  const filtersClearedOutData = hasDataInitially && !hasDataAfterFiltering;

  // Auto-expand parents with visible children after filtering
  React.useEffect(() => {
    const isFiltering =
      table.getState().columnFilters?.length > 0 ||
      !!table.getState().globalFilter;

    if (isFiltering) {
      const filteredRows = table.getFilteredRowModel().rows;
      const newExpanded: ExpandedState = {};

      filteredRows.forEach((row) => {
        if (row.subRows && row.subRows.length > 0) {
          newExpanded[row.id] = true;
        }
      });

      setExpanded(newExpanded);
    } else {
      setExpanded({});
    }
  }, [
    table.getFilteredRowModel().rows,
    table.getState().columnFilters,
    table.getState().globalFilter,
  ]);

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

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
  InitialTableState,
  Table as TanstackTable,
  RowSelectionState,
  HeaderGroup,
} from "@tanstack/react-table";
import { arrIncludesAllInsensitive } from "./KeywordSearch";

export interface TableProps<T> {
  data: T[];
  // explicitly allowing any because the column definitions intentionally allow for flexibility in types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  className?: string;
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
  getSubRows?: (originalRow: T, index: number) => T[] | undefined;
  initialState?: InitialTableState;
  keywordSearch?: (table: TanstackTable<T>) => React.ReactNode;
  columnFilter?: (table: TanstackTable<T>) => React.ReactNode;
  pagination?: (table: TanstackTable<T>) => React.ReactNode;
  actionButtons?: (table: TanstackTable<T>) => React.ReactNode;
  actionModals?: (table: TanstackTable<T>) => React.ReactNode;
}

type TableHeadProps<T> = {
  headerGroups: HeaderGroup<T>[];
};

export function TableHead<T>({ headerGroups }: TableHeadProps<T>) {
  return (
    <thead>
      {headerGroups.map((hg) => (
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
  );
}

export function Table<T>({
  data,
  columns,
  className,
  emptyRowsMessage = "No data available.",
  noResultsFoundMessage = "No results found.",
  getSubRows,
  initialState,
  keywordSearch,
  columnFilter,
  pagination,
  actionButtons,
  actionModals,
}: TableProps<T>) {
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

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
    state: { expanded, rowSelection },
    onExpandedChange: setExpanded,
    initialState,
    onRowSelectionChange: setRowSelection,
  });

  const hasDataInitially = data.length > 0;
  const hasDataAfterFiltering = table.getFilteredRowModel().rows.length > 0;
  const filtersClearedOutData = hasDataInitially && !hasDataAfterFiltering;

  // Auto-expand parents with visible children after filtering
  React.useEffect(() => {
    const isFiltering =
      table.getState().columnFilters?.length > 0 || !!table.getState().globalFilter;

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
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          {/* Search Section */}
          {keywordSearch && keywordSearch(table)}

          {/* Filter Section */}
          {columnFilter && columnFilter(table)}
        </div>
        <div className="mr-1">
          {/* Action Buttons Section */}
          {actionButtons && actionButtons(table)}
        </div>
      </div>

      {actionModals && actionModals(table)}

      {/* Table Section */}
      <table className="w-full table-fixed text-sm">
        <TableHead headerGroups={table.getHeaderGroups()} />
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
              <tr
                onClick={row.getToggleSelectedHandler()}
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
            ))
          )}
        </tbody>
      </table>
      {pagination && pagination(table)}
    </div>
  );
}

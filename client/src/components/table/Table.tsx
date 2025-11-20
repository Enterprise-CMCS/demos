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
  HeaderGroup,
  InitialTableState,
  RowSelectionState,
  Table as TanstackTable,
  useReactTable,
} from "@tanstack/react-table";

import { arrIncludesAllInsensitive } from "./KeywordSearch";
import { ChevronDownIcon, ChevronUpIcon, SortIcon } from "components/icons";

const STYLES = {
  table: "w-full table-auto",
  th: "bg-gray-primary-layout p-1 font-semibold text-left border-b cursor-pointer select-none",
  tr: "h-[56px] border-b p-1",
  td: "p-1 text-[14px] break-words overflow-wrap",
  subrow: "h-[56px] px-4 py-2 bg-gray-lighter border-b",
};

function TableHead<T>({ headerGroups }: { headerGroups: HeaderGroup<T>[] }) {
  return (
    <thead>
      {headerGroups.map((hg) => (
        <tr key={hg.id} className={STYLES.tr}>
          {hg.headers.map((header) => (
            <th
              key={header.id}
              className={STYLES.th}
              onClick={header.column.getToggleSortingHandler()}
            >
              <div className="flex items-center gap-1">
                {flexRender(header.column.columnDef.header, header.getContext())}
                {header.column.getCanSort() && (
                  <>
                    {{
                      asc: <ChevronUpIcon width={10} />,
                      desc: <ChevronDownIcon width={10} />,
                    }[header.column.getIsSorted() as string] ?? <SortIcon width={8} />}
                  </>
                )}
              </div>
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}

function TableBody<T>({
  data,
  table,
  emptyRowsMessage = "No data available.",
  noResultsFoundMessage = "No results found.",
}: {
  data: T[];
  table: TanstackTable<T>;
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
}) {
  const hasDataInitially = data.length > 0;
  const hasDataAfterFiltering = table.getFilteredRowModel().rows.length > 0;
  const filtersClearedOutData = hasDataInitially && !hasDataAfterFiltering;

  return (
    <tbody>
      {filtersClearedOutData ? (
        <tr>
          <td colSpan={table.getAllLeafColumns().length} className={STYLES.td}>
            {noResultsFoundMessage}
          </td>
        </tr>
      ) : !hasDataInitially ? (
        <tr>
          <td colSpan={table.getAllLeafColumns().length} className={STYLES.td}>
            {emptyRowsMessage}
          </td>
        </tr>
      ) : (
        table.getRowModel().rows.map((row) => (
          <tr
            onClick={row.getToggleSelectedHandler()}
            key={row.id}
            className={row.depth > 0 ? STYLES.subrow : STYLES.tr}
          >
            {row.getVisibleCells().map((cell) => {
              return (
                <td key={cell.id} className={STYLES.td}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))
      )}
    </tbody>
  );
}

function TableSearch<T>({
  table,
  keywordSearch,
  columnFilter,
}: {
  table: TanstackTable<T>;
  keywordSearch?: (table: TanstackTable<T>) => React.ReactNode;
  columnFilter?: (table: TanstackTable<T>) => React.ReactNode;
}) {
  return (
    <div className="grid w-full grid-cols-4 gap-[24px]">
      <div className="col-span-1">{keywordSearch && keywordSearch(table)}</div>
      <div className="col-span-2">{columnFilter && columnFilter(table)}</div>
    </div>
  );
}

export interface TableProps<T> {
  data: T[];
  // explicitly allowing any because the column definitions intentionally allow for flexibility in types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
  getSubRows?: (originalRow: T, index: number) => T[] | undefined;
  initialState?: InitialTableState;
  keywordSearch?: (table: TanstackTable<T>) => React.ReactNode;
  columnFilter?: (table: TanstackTable<T>) => React.ReactNode;
  pagination?: (table: TanstackTable<T>) => React.ReactNode;
  actionButtons?: (table: TanstackTable<T>) => React.ReactNode;
  actionModals?: (table: TanstackTable<T>) => React.ReactNode;
  hideSearchAndActions?: boolean;
}

export function Table<T>({
  data,
  columns,
  emptyRowsMessage,
  noResultsFoundMessage,
  getSubRows,
  initialState,
  keywordSearch,
  columnFilter,
  pagination,
  actionButtons,
  actionModals,
  hideSearchAndActions = false,
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
    paginateExpandedRows: false,
  });

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
    <>
      {!hideSearchAndActions && (
        <div className="flex items-center justify-between mb-[24px]">
          <TableSearch table={table} keywordSearch={keywordSearch} columnFilter={columnFilter} />
          <div className="mr-1">{actionButtons && actionButtons(table)}</div>
        </div>
      )}

      {actionModals && actionModals(table)}

      <table className={STYLES.table}>
        <TableHead headerGroups={table.getHeaderGroups()} />
        <TableBody
          data={data}
          table={table}
          emptyRowsMessage={emptyRowsMessage}
          noResultsFoundMessage={noResultsFoundMessage}
        />
      </table>
      {pagination && pagination(table)}
    </>
  );
}

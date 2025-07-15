import * as React from "react";

import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";
import { ColumnFilterByDropdown } from "components/table/filters/ColumnFilterSelect";
import { PaginationControls } from "components/table/pagination/PaginationControls";

import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  Row,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { KeywordSearch } from "../search/KeywordSearch";
import { DemonstrationStatus } from "demos-server";

export interface RawDemonstration {
  id: number;
  title: string;
  demoNumber: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatus: DemonstrationStatus;
  stateId: string;
  projectOfficer: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemonstrationTableProps {
  data: RawDemonstration[];
  className?: string;
  isMyDemosTable?: boolean;
}

export function DemonstrationTable({
  data,
  className = "",
  isMyDemosTable = false,
}: DemonstrationTableProps) {
  const tableData = data;

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "stateId", desc: false },
    { id: "title", desc: false },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const arrIncludesAllInsensitive = (
    row: Row<RawDemonstration>,
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
        rowValue != null &&
        rowValue.toString().toLowerCase().includes(search)
      );
    });
  };

  const table = useReactTable<RawDemonstration>({
    data: tableData,
    columns: DemonstrationColumns,

    state: {
      sorting,
      pagination,
      columnFilters,
      rowSelection,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: arrIncludesAllInsensitive,
  });

  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const totalRows = table.getFilteredRowModel().rows.length;

  const handlePageSizeChange = (newSize: number) => {
    if (newSize < 0) {
      table.setPageSize(totalRows);
      table.setPageIndex(0);
    } else {
      table.setPageSize(newSize);
      table.setPageIndex(0);
    }
  };

  const perPageChoices = [10, 20, 50, -1];

  const emptyRowsMessage = isMyDemosTable
    ? "You have no assigned demonstrations at this time."
    : "No demonstrations are tracked.";

  const noResultsFoundMessage =
    "No results were returned. Adjust your search and filter criteria.";

  const hasDataInitially = tableData.length > 0;
  const hasDataAfterFiltering = table.getFilteredRowModel().rows.length > 0;
  const filtersClearedOutData =
    hasDataInitially && !hasDataAfterFiltering;

  return (
    <div className={`overflow-x-auto w-full ${className} mb-2`}>
      <div className="flex items-center mb-2">
        <KeywordSearch<RawDemonstration>
          table={table}
          label="Search:"
        ></KeywordSearch>
        <ColumnFilterByDropdown<RawDemonstration>
          table={table}
          columns={table
            .getAllColumns()
            .filter(
              (col) => col.id !== "select" && col.id !== "expander"
            )}
          label="Filter by:"
        />
      </div>
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
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-1 border-b"
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
                    )}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      <hr className="border-t-2 border-gray-400" />
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalRows={totalRows}
        onPageSizeChange={handlePageSizeChange}
        onPageChange={(p) => table.setPageIndex(p)}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
        canPreviousPage={canPrevious}
        canNextPage={canNext}
        perPageChoices={perPageChoices}
      />
    </div>
  );
}

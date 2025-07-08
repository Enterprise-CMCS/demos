import * as React from "react";

import {
  DemonstrationColumns,
} from "components/table/columns/DemonstrationColumns";
import {
  ColumnFilterByDropdown,
} from "components/table/filters/ColumnFilterSelect";
import {
  PaginationControls,
} from "components/table/pagination/PaginationControls";
import {
  DemoWithSubRows,
  groupByDemoNumber,
} from "components/table/preproccessors/GroupByDemoNumber";

import {
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";

export interface RawDemonstration {
  id: number;
  title: string;
  demoNumber: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatusId: number;
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
  const hierarchicalData: DemoWithSubRows[] = React.useMemo(
    () => groupByDemoNumber(data),
    [data]
  );

  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "stateId", desc: false },
    { id: "title", desc: false },
  ]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const table = useReactTable<DemoWithSubRows>({
    data: hierarchicalData,
    columns: DemonstrationColumns,
    getSubRows: (row) => row.subRows ?? [],

    state: {
      sorting,
      pagination,
      columnFilters,
      expanded,
      rowSelection,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Pagination state variables
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
  // We can expand this if we want to add more types of demo tables in the future.

  const emptyRowsMessage = isMyDemosTable
    ? "You have no assigned demonstrations at this time."
    : "No demonstrations are tracked.";

  const noResultsFoundMessage = isMyDemosTable
    ? "Your search returned no results."
    : "No demonstrations match your filter criteria.";

  const hasDataInitially = hierarchicalData.length > 0;
  const hasDataAfterFiltering = table.getFilteredRowModel().rows.length > 0;
  const filtersClearedOutData =
    hasDataInitially && !hasDataAfterFiltering;

  return (
    <div className={`overflow-x-auto w-full ${className} mb-2`}>
      <ColumnFilterByDropdown<DemoWithSubRows>
        table={table}
        columns={table
          .getAllColumns()
          .filter(col => col.id !== "select" && col.id !== "expander")}
        label="Filter by:"
        isMyDemosTable={isMyDemosTable}
      />

      {/* Table header with sorting */}
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
          {filtersClearedOutData ? (
            <tr>
              <td
                colSpan={table.getAllLeafColumns().length}
                className="px-4 py-8 text-center text-gray-800 text-xl font-semibold"
              >
                {noResultsFoundMessage}
              </td>
            </tr>
          ) : !hasDataInitially ? (
            <tr>
              <td
                colSpan={table.getAllLeafColumns().length}
                className="px-4 py-8 text-center text-gray-800 text-xl font-semibold"
              >
                {emptyRowsMessage}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={row.depth > 0 ? "bg-gray-200" : ""}
              >
                {row.getVisibleCells().map((cell) => {
                  const colId = cell.column.id;
                  if (
                    row.depth > 0 &&
                    (colId === "stateId" || colId === "demoNumber")
                  ) {
                    return (
                      <td
                        key={cell.id}
                        className="px-2 py-1 border-b text-left text-gray-400"
                      >
                        &mdash;
                      </td>
                    );
                  }
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

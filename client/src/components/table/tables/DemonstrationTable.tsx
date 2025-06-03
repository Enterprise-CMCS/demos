import * as React from "react";
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
  PaginationState,
  RowSelectionState
} from "@tanstack/react-table";

import PaginationControls from "components/table/pagination/PaginationControls";
import ColumnFilterByDropdown from "components/table/filters/ColumnFilterSelect";
import { groupByDemoNumber, DemoWithSubRows } from "components/table/preproccessors/GroupByDemoNumber";
import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";

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
}

export default function DemonstrationTable({
  data,
  className = "",
}: DemonstrationTableProps) {
  // 1) Pre‐process data into parent+subRows
  const hierarchicalData: DemoWithSubRows[] = React.useMemo(
    () => groupByDemoNumber(data),
    [data]
  );

  // 2) Table state: sorting, pagination, columnFilters, expansion
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});


  // 3) Build the table with getSubRows and getExpandedRowModel
  const table = useReactTable<DemoWithSubRows>({
    data: hierarchicalData,
    columns: DemonstrationColumns,
    getSubRows: (row) => row.subRows ?? [],

    // include all pieces of state:
    state: {
      sorting,
      pagination,
      columnFilters,
      expanded,
      rowSelection, // ← include selection in state
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onExpandedChange: setExpanded,
    onRowSelectionChange: setRowSelection, // ← wire up row selection

    // plugins:
    getCoreRowModel:     getCoreRowModel(),
    getSortedRowModel:   getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 4) Pagination helpers
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const perPageChoices = [10, 20, 50];

  return (
    <div className={`overflow-x-auto ${className} mb-2`}>
      {/** Filter‐by column dropdown (unchanged) **/}
      <ColumnFilterByDropdown<DemoWithSubRows>
        table={table}
        columns={table.getAllColumns()}
        label="Filter by:"
      />

      {/** ⇩⇩ The table with expanders ⇩⇩ **/}
      <table className="w-full text-sm">
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
              className={row.depth > 0 ? "bg-gray-50" : ""}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-2 py-1 border-b"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/** ⇩⇩ Pagination Controls ⇩⇩ **/}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageSizeChange={(size) => table.setPageSize(size)}
        onPageChange={(page) => table.setPageIndex(page)}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
        canPreviousPage={canPrevious}
        canNextPage={canNext}
        perPageChoices={perPageChoices}
      />
    </div>
  );
}

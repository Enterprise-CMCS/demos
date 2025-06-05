// src/components/table/tables/DemonstrationTable.tsx
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

import { PaginationControls } from "components/table/pagination/PaginationControls";
import { ColumnFilterByDropdown } from "components/table/filters/ColumnFilterSelect";
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

export function DemonstrationTable({
  data,
  className = "",
}: DemonstrationTableProps) {
  // 1) Pre‐process data into parent+subRows
  const hierarchicalData: DemoWithSubRows[] = React.useMemo(
    () => groupByDemoNumber(data),
    [data]
  );

  // 2) Table state: sorting, pagination, filters, expansion, row‐selection
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = React.useState<ExpandedState>({});
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  // 3) Build the table instance, including filteredRowModel
  const table = useReactTable<DemoWithSubRows>({
    data: hierarchicalData,
    columns: DemonstrationColumns,
    getSubRows: (row) => row.subRows ?? [],

    // Include all state pieces
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

    // Plugins
    getCoreRowModel:     getCoreRowModel(),
    getSortedRowModel:   getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),   // ← needed for totalRows
    getExpandedRowModel: getExpandedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 4) Extract pagination‐related values from table state
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages  = table.getPageCount();
  const pageSize    = table.getState().pagination.pageSize;
  const canPrevious = table.getCanPreviousPage();
  const canNext     = table.getCanNextPage();

  // 5) Compute totalRows from filtered model (i.e. after any column filters)
  const totalRows = table.getFilteredRowModel().rows.length;

  // 6) Handle “All” vs numeric page‐size selection
  const handlePageSizeChange = (newSize: number) => {
    if (newSize < 0) {
      // “All” selected → show every filtered row on one page
      table.setPageSize(totalRows);
      table.setPageIndex(0);
    } else {
      table.setPageSize(newSize);
      table.setPageIndex(0);
    }
  };

  // 7) Build the list of choices we’ll show in the dropdown:
  //    10, 20, 50, and “All” (-1)
  const perPageChoices = [10, 20, 50, -1];

  return (
    <div className={`overflow-x-auto ${className} mb-2`}>
      {/* ⇩⇩ Column‐filter dropdown ⇩⇩ */}
      <ColumnFilterByDropdown<DemoWithSubRows>
        table={table}
        columns={table
          .getAllColumns()
          .filter(col => col.id !== "select" && col.id !== "expander")}
        label="Filter by:"
      />

      {/* Table header with sorting */}
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
                    asc:  " ↑",
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

      {/* ⇩⇩ Pagination Controls (with “X – Y of Z” counter) ⇩⇩ */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalRows={totalRows}                     // ← pass the filtered‐row count
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

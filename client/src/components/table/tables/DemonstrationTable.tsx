// src/components/table/tables/DemonstrationTable.tsx
import * as React from "react";
import {
  ColumnDef,
  flexRender,
  SortingState,
  useReactTable,
  PaginationState,
  getCoreRowModel,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  getPaginationRowModel
} from "@tanstack/react-table";
import
PaginationControls
  from "components/table/pagination/PaginationControls";
import
ColumnFilterByDropdown
  from "components/table/filters/ColumnFilterSelect";

export interface Demonstration {
  id: number;
  stateId: string;
  demoNumber: string;
  title: string;
  projectOfficer: string;
}

export interface DemonstrationTableProps<T extends { id: string | number }> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  className?: string;
}

export default function DemonstrationTable<T extends { id: string | number }>({
  data,
  columns,
  className = "",
}: DemonstrationTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const table = useReactTable<T>({
    data,
    columns,
    state: { sorting, pagination, columnFilters },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 3) Pagination helpers
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const canPrevious = table.getCanPreviousPage();
  const canNext = table.getCanNextPage();
  const perPageChoices = [10, 20, 50];

  return (
    <div className={`overflow-x-auto ${className} mb-2`}>
      {/** ⇩⇩ Our new “Filter by” dropdown ⇩⇩ **/}
      <ColumnFilterByDropdown<T>
        table={table}
        // Pass in the same columns you gave useReactTable
        columns={table.getAllColumns()}
        label="Filter by:"
      />

      {/** ⇩⇩ The data table ⇩⇩ **/}
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
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 border-b">
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

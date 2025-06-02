import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  PaginationState,
} from "@tanstack/react-table";
import { PaginationControls } from "components/table/pagination/PaginationControls";

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
  // 1) Core table state
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // 2) Initialize the table
  const table = useReactTable<T>({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // 3) Pagination helpers
  const currentPage = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const pageSize = table.getState().pagination.pageSize;
  const canPreviousPage = table.getCanPreviousPage();
  const canNextPage = table.getCanNextPage();
  // 4) Render
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-gray-200">
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  // ↓ smaller padding here
                  className="px-2 py-1 font-semibold text-left border-b cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  // ↓ and here
                  className="px-2 py-1 border-b"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      {/* ⇩ Replace inline controls with our new component ⇩ */}
      <PaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => table.setPageSize(newSize)}
        onPageChange={(page) => table.setPageIndex(page)}
        onPreviousPage={() => table.previousPage()}
        onNextPage={() => table.nextPage()}
        canPreviousPage={canPreviousPage}
        canNextPage={canNextPage}
        perPageChoices={[10, 20, 50, 500]}
      />
    </div>
  );
}

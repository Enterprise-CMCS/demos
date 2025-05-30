import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  SortingState,
  useReactTable,
  PaginationState
} from "@tanstack/react-table";

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
  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex;
  const perPageChoices = [10, 20, 50, 500];
  const getVisiblePageNumbers = () => {
    const range: number[] = [];
    const max = totalPages;
    if (max <= 7) {
      for (let i = 0; i < max; i++) range.push(i);
    } else if (currentPage < 4) {
      range.push(0, 1, 2, 3, -1, max - 1);
    } else if (currentPage > max - 5) {
      range.push(0, -1, max - 4, max - 3, max - 2, max - 1);
    } else {
      range.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, max - 1);
    }
    return range;
  };

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
                  className="px-4 py-2 font-semibold text-left border-b cursor-pointer select-none"
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
                <td key={cell.id} className="px-4 py-2 border-b">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            className="border px-2 py-1 rounded"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {perPageChoices.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </button>
          {getVisiblePageNumbers().map((page, idx) =>
            page === -1 ? (
              <span key={idx} className="px-2 py-1 text-gray-500">
                …
              </span>
            ) : (
              <button
                key={page}
                className={`px-2 py-1 border rounded ${
                  page === currentPage ? "bg-gray-200 font-semibold" : ""
                }`}
                onClick={() => table.setPageIndex(page)}
              >
                {page + 1}
              </button>
            )
          )}
          <button
            className="px-2 py-1 border rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

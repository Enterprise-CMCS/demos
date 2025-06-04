// src/components/table/tables/PaginationControls.tsx
import * as React from "react";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageSizeChange: (newSize: number) => void;
  onPageChange: (pageIndex: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  perPageChoices?: number[];
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageSizeChange,
  onPageChange,
  onPreviousPage,
  onNextPage,
  canPreviousPage,
  canNextPage,
  perPageChoices = [10, 20, 50, 500],
}) => {
  // Build the “...1, 2, …, last” logic
  const getVisiblePageNumbers = React.useCallback(() => {
    const range: number[] = [];
    const max = totalPages;
    if (max <= 7) {
      for (let i = 0; i < max; i++) {
        range.push(i);
      }
    } else if (currentPage < 4) {
      range.push(0, 1, 2, 3, -1, max - 1);
    } else if (currentPage > max - 5) {
      range.push(0, -1, max - 4, max - 3, max - 2, max - 1);
    } else {
      range.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, max - 1);
    }
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 text-sm">
      {/* Rows‐per‐page selector */}
      <div className="flex items-center gap-2 ml-2">
        <span>Items per page:</span>
        <select
          className="border px-2 py-1 rounded"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {perPageChoices.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      {/* Previous / page numbers / Next */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          className="px-2 py-1 border rounded disabled:opacity-50"
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
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
              onClick={() => onPageChange(page)}
            >
              {page + 1}
            </button>
          )
        )}

        <button
          className="mr-2 px-2 py-1 border rounded disabled:opacity-50"
          onClick={onNextPage}
          disabled={!canNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;

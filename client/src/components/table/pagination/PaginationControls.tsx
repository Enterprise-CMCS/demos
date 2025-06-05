// src/components/table/tables/PaginationControls.tsx
import * as React from "react";

export interface PaginationControlsProps {
  currentPage: number;                // zero‐based index of current page
  totalPages: number;                 // total number of pages
  pageSize: number;                   // currently selected page size
  onPageSizeChange: (newSize: number) => void;
  onPageChange: (pageIndex: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  perPageChoices?: number[];          // e.g. [10,20,50,-1]
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
  perPageChoices = [10, 20, 50, -1],
}) => {
  const getVisiblePageNumbers = React.useCallback((): (number | -1)[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const visible: Array<number | -1> = [];
    const lastPage = totalPages - 1;

    visible.push(0);

    const leftSibling = Math.max(1, currentPage - 1);
    const rightSibling = Math.min(lastPage - 1, currentPage + 1);
    if (leftSibling > 1) {
      visible.push(-1);
    }
    for (let i = leftSibling; i <= rightSibling; i++) {
      visible.push(i);
    }
    if (rightSibling < lastPage - 1) {
      visible.push(-1);
    }
    visible.push(lastPage);

    return visible;
  }, [currentPage, totalPages]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 text-sm">
      {/* ─── Items-per-page dropdown ─────────────────────────────────────────── */}
      <div className="flex items-center gap-2 ml-2">
        <span>Items per page:</span>
        <select
          className="border px-2 py-1 rounded"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {perPageChoices.map((size) => (
            <option key={size} value={size}>
              {size < 0 ? "All" : size}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Previous / page-numbers / Next ─────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap mr-2">
        {canPreviousPage ? (
          <button
            className="px-2 py-1 bg-[var(--color-action)] text-white hover:bg-[var(--color-brand)] rounded"
            onClick={onPreviousPage}
            aria-label="Go to previous page"
          >
            Prev
          </button>
        ) : (
          <button
            className="px-2 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
            disabled
          >
            Prev
          </button>
        )}

        {/* Page-number buttons + ellipses */}
        {getVisiblePageNumbers().map((page, idx) =>
          page === -1 ? (
            // Ellipsis marker
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-gray-500">
              …
            </span>
          ) : (
            <button
              key={page}
              className={`px-2 py-1 rounded border ${
                page === currentPage
                  ? "bg-[var(--color-brand)] text-white font-semibold"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
              onClick={() => onPageChange(page)}
              aria-label={
                page === currentPage
                  ? `Page ${page + 1} (current)`
                  : `Go to page ${page + 1}`
              }
            >
              {page + 1}
            </button>
          )
        )}

        {/* “Next” button (hidden if no next page) */}
        {canNextPage ? (
          <button
            className="px-2 py-1 bg-[var(--color-action)] text-white hover:bg-[var(--color-brand)] rounded"
            onClick={onNextPage}
            aria-label="Go to next page"
          >
            Next
          </button>
        ) : (
          <button
            className="px-2 py-1 bg-gray-200 text-gray-500 rounded cursor-not-allowed"
            disabled
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

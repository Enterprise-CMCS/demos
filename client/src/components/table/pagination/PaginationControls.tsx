import * as React from "react";

export interface PaginationControlsProps {
  currentPage: number;       // zero‐based page index
  totalPages: number;        // how many pages exist (pageCount)
  pageSize: number;          // current rows‐per‐page
  totalRows: number;         // total number of rows (after filtering)
  onPageSizeChange: (newSize: number) => void;
  onPageChange: (pageIndex: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
  canPreviousPage: boolean;
  canNextPage: boolean;
  perPageChoices?: number[]; // e.g. [10,20,50,-1]
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalRows,
  onPageSizeChange,
  onPageChange,
  onPreviousPage,
  onNextPage,
  canPreviousPage,
  canNextPage,
  perPageChoices = [10, 20, 50, -1],
}) => {
  /**
   * Build a list of page indices or -1 for ellipses,
   * showing at most 5 actual page‐numbers.
   */
  const getVisiblePageNumbers = React.useCallback((): (number | -1)[] => {
    // If there are 5 or fewer pages, show them all (no ellipses)
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const visible: Array<number | -1> = [];
    const lastPage = totalPages - 1;

    // Always show the first page (zero‐based index 0)
    visible.push(0);

    // “Siblings” around currentPage, clamped to [1 .. lastPage-1]
    const leftSibling  = Math.max(1, currentPage - 1);
    const rightSibling = Math.min(lastPage - 1, currentPage + 1);

    // If leftSibling is more than page 1, we need an ellipsis
    if (leftSibling > 1) {
      visible.push(-1);
    }

    // Push the “window” of [leftSibling..rightSibling]
    for (let i = leftSibling; i <= rightSibling; i++) {
      visible.push(i);
    }

    // If rightSibling is at least 2 pages before the last, add an ellipsis
    if (rightSibling < lastPage - 1) {
      visible.push(-1);
    }

    // Always show the last page
    visible.push(lastPage);

    return visible;
  }, [currentPage, totalPages]);

  // Calculate “firstRowIndex” and “lastRowIndex” for the “X – Y of Z” display.
  // If totalRows == 0, show “0 of 0”.
  const firstRowIndex = totalRows === 0
    ? 0
    : currentPage * pageSize + 1;

  const lastRowIndex = totalRows === 0
    ? 0
    : Math.min((currentPage + 1) * pageSize, totalRows);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4 text-sm">
      {/* ─── Rows‐per‐page selector + counter ────────────────────────────────────── */}
      <div className="flex items-center gap-4 ml-2">
        {/* “Items per page” dropdown */}
        <div className="flex items-center gap-2">
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

        {/* “1 – 7 of 7” style counter */}
        <span className="text-gray-700">
          {totalRows === 0
            ? `0 of 0`
            : `${firstRowIndex} – ${lastRowIndex} of ${totalRows}`}
        </span>
      </div>

      {/* ─── Prev / Page Buttons / Next ─────────────────────────────────────────── */}
      <div className="mr-2 flex items-center gap-1 flex-wrap">
        {/* “Prev” button */}
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
            aria-label="No previous page"
          >
            Prev
          </button>
        )}

        {/* Page Number Buttons + Ellipses */}
        {getVisiblePageNumbers().map((page, idx) =>
          page === -1 ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-1 text-gray-500"
            >
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

        {/* “Next” button */}
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
            aria-label="No next page"
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
};

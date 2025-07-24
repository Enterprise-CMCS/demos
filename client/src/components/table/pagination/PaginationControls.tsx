import * as React from "react";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalRows: number;
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
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const visible: Array<number | -1> = [];
    const lastPage = totalPages - 1;

    visible.push(0); // Always show the first page

    const leftSibling = Math.max(1, currentPage - 1);
    const rightSibling = Math.min(lastPage - 1, currentPage + 1);

    if (leftSibling > 1) {
      visible.push(-1); // Ellipsis placeholder
    }

    for (let i = leftSibling; i <= rightSibling; i++) {
      visible.push(i);
    }

    if (rightSibling < lastPage - 1) {
      visible.push(-1);
    }

    visible.push(lastPage); // Always show the last page
    return visible;
  }, [currentPage, totalPages]);

  // ZERO state - If totalRows == 0, show “0 of 0”
  const firstRowIndex = totalRows === 0
    ? 0
    : currentPage * pageSize + 1;

  const lastRowIndex = totalRows === 0
    ? 0
    : Math.min((currentPage + 1) * pageSize, totalRows);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4 mt-2 pb-1 text-sm"
    >
      <div className="flex items-center gap-2">
        {/* Label + select: use htmlFor so accessible */}
        <label htmlFor="pagination-page-size" className="text-gray-700">
          Items per page:
        </label>
        <select
          id="pagination-page-size"
          aria-labelledby="pagination-page-size"
          className="border px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {perPageChoices.map((size) => (
            <option key={size} value={size}>
              {size < 0 ? "All" : size}
            </option>
          ))}
        </select>

        <span className="text-gray-700">
          {totalRows === 0
            ? "0 of 0"
            : `${firstRowIndex} – ${lastRowIndex} of ${totalRows}`}
        </span>
      </div>

      {/* Prev / Page Buttons / Next */}
      <div className="mr-2 flex items-center gap-1 flex-wrap">
        <button
          onClick={onPreviousPage}
          disabled={!canPreviousPage}
          aria-label={canPreviousPage ? "Go to previous page" : "No previous page"}
          aria-disabled={!canPreviousPage}
          className={`px-2 py-1 rounded ${canPreviousPage
              ? "bg-[var(--color-action)] text-white hover:bg-brand focus:outline-none focus:ring-2 focus:ring-blue-500"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
        >
          Prev
        </button>

        {getVisiblePageNumbers().map((page, idx) =>
          page === -1 ? (
            <span
              key={`ellipsis-${idx}`}
              role="presentation"
              className="px-2 py-1 text-gray-500"
            >
              …
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-label={
                page === currentPage
                  ? `Page ${page + 1}, current page`
                  : `Go to page ${page + 1}`
              }
              aria-current={page === currentPage ? "page" : undefined}
              className={`px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500 ${page === currentPage
                  ? "bg-brand text-white font-semibold"
                  : "bg-white text-black hover:bg-gray-100"
                }`}
            >
              {page + 1}
            </button>
          )
        )}
        <button
          onClick={onNextPage}
          disabled={!canNextPage}
          aria-label={canNextPage ? "Go to next page" : "No next page"}
          aria-disabled={!canNextPage}
          className={`px-2 py-1 rounded ${canNextPage
              ? "bg-[var(--color-action)] text-white hover:bg-brand focus:outline-none focus:ring-2 focus:ring-blue-500"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
        >
          Next
        </button>
      </div>
    </nav>
  );
};

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Button, SecondaryButton } from "components/button";
import { ChevronDownIcon } from "components/icons";
export interface PaginationControlsProps<T> {
  table: Table<T>;
  perPageChoices?: number[];
}
export function PaginationControls<T>({
  table,
  perPageChoices = [10, 20, 50, -1],
}: PaginationControlsProps<T>) {
  const {
    getState,
    setPageSize,
    setPageIndex,
    previousPage,
    nextPage,
    getCanPreviousPage,
    getCanNextPage,
    getPageCount,
    getFilteredRowModel,
  } = table;

  const { pagination } = getState();
  const { pageIndex, pageSize } = pagination;

  const totalRows = getFilteredRowModel().rows.length;
  const totalPages = getPageCount();
  const currentPage = pageIndex;
  const canPreviousPage = getCanPreviousPage();
  const canNextPage = getCanNextPage();

  const handlePageSizeChange = (newSize: number) => {
    if (newSize < 0) {
      // "All" option - set to total rows
      setPageSize(totalRows);
    } else {
      setPageSize(newSize);
    }
  };
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

  // ZERO state - If totalRows == 0, show "0 of 0"
  const firstRowIndex = totalRows === 0 ? 0 : currentPage * pageSize + 1;
  const lastRowIndex = totalRows === 0 ? 0 : Math.min((currentPage + 1) * pageSize, totalRows);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col sm:flex-row
        sm:items-center sm:justify-between
        gap-4 mt-2 pb-1 text-sm"
    >
      <div className="flex items-center gap-2">
        <label htmlFor="pagination-page-size" className="text-gray-700">
          Items per page:
        </label>
        <div className="relative inline-flex items-center">
          <select
            id="pagination-page-size"
            aria-labelledby="pagination-page-size"
            className="appearance-none border py-[12px] pl-[16px] pr-[44px] rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          >
            {perPageChoices.map((size) => (
              <option key={size} value={size}>
                {size < 0 ? "All" : size}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-[16px] top-1/2 -translate-y-1/2 text-gray-600">
            <ChevronDownIcon width="16" height="16" className="block" />
          </span>
        </div>
        <span className="text-gray-700">
          {totalRows === 0 ? "0 of 0" : `${firstRowIndex} – ${lastRowIndex} of ${totalRows}`}
        </span>
      </div>
      {/* Prev / Page Buttons / Next */}
      <div className="mr-2 flex items-center gap-1 flex-wrap">
        <Button
          name="Go to Previous Page"
          onClick={previousPage}
          disabled={!canPreviousPage}
          aria-label={canPreviousPage ? "Go to previous page" : "No previous page"}
        >
          Prev
        </Button>
        {getVisiblePageNumbers().map((page, idx) =>
          page === -1 ? (
            <span key={`ellipsis-${idx}`} role="presentation" className="px-2 py-1 text-gray-500">
              …
            </span>
          ) : page === currentPage ? (
            <Button
              key={page}
              name={"Go to page " + (page + 1)}
              onClick={() => setPageIndex(page)}
              aria-label={`Page ${page + 1}, current page`}
            >
              {page + 1}
            </Button>
          ) : (
            <SecondaryButton
              key={page}
              name={"Go to page " + (page + 1)}
              onClick={() => setPageIndex(page)}
              aria-label={`Go to page ${page + 1}`}
            >
              {page + 1}
            </SecondaryButton>
          )
        )}
        <Button
          name={"Go to next page"}
          onClick={nextPage}
          disabled={!canNextPage}
          aria-label={canNextPage ? "Go to next page" : "No next page"}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}

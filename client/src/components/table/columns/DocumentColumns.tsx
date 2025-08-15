// DocumentColumns.tsx
import * as React from "react";

import { DocumentTableRow } from "hooks/useDocument";
import { useDocumentType } from "hooks/useDocumentType";

import { createColumnHelper } from "@tanstack/react-table";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { renderDate } from "util/USDate";

export function DocumentColumns() {
  const { getDocumentTypeOptions } = useDocumentType();

  // Trigger queries on mount
  React.useEffect(() => {
    getDocumentTypeOptions.trigger();
  }, []);

  // Loading and error handling
  if (getDocumentTypeOptions.loading) {
    return { loading: true };
  }
  if (getDocumentTypeOptions.error) {
    return {
      error: getDocumentTypeOptions.error?.message,
    };
  }
  if (!getDocumentTypeOptions.data) {
    return { error: "Data not found" };
  }
  const columnHelper = createColumnHelper<DocumentTableRow>();

  const documentColumns = [
    columnHelper.display({
      id: "Select",
      header: ({ table }) => (
        <input
          id="select-all-rows"
          type="checkbox"
          className="cursor-pointer"
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          id={`select-row-${row.id}`}
          type="checkbox"
          className="cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
      size: 20,
    }),
    columnHelper.accessor("title", {
      header: "Title",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("documentType.name", {
      id: "type",
      header: "Document Type",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options:
            getDocumentTypeOptions.data?.map((documentType) => ({
              label: documentType.name,
              value: documentType.name,
            })) ?? [],
        },
      },
    }),
    columnHelper.accessor("owner.fullName", {
      header: "Uploaded By",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("createdAt", {
      header: "Date Uploaded",
      cell: ({ getValue }) => {
        const dateValue = getValue();
        return renderDate(dateValue);
      },
      filterFn: (row, columnId, filterValue) => {
        const dateValue = row.getValue(columnId) as string;
        const date: Date = new Date(dateValue);
        const { start, end } = filterValue || {};
        if (start && end) {
          return (
            isSameDay(date, start) ||
            isSameDay(date, end) ||
            (isAfter(date, start) && isBefore(date, end))
          );
        }
        if (start) {
          return isSameDay(date, start) || isAfter(date, start);
        }
        if (end) {
          return isSameDay(date, end) || isBefore(date, end);
        }
        return true;
      },
      meta: {
        filterConfig: {
          filterType: "date",
        },
      },
    }),
    columnHelper.display({
      id: "view",
      header: "View",
      cell: ({ row }) => {
        const docId = row.original.id;
        const handleClick = () => {
          window.open(`/documents/${docId}`, "_blank");
        };
        return (
          <SecondaryButton
            size="small"
            onClick={handleClick}
            className="px-2 py-0 text-sm font-medium"
          >
            View
          </SecondaryButton>
        );
      },
      enableSorting: false,
    }),
  ];

  return {
    documentColumns,
    documentColumnsLoading: false,
    documentColumnsError: null,
  };
}

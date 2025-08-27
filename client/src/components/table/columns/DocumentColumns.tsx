// DocumentColumns.tsx
import * as React from "react";

import { DocumentTableRow } from "hooks/useDocument";

import { createColumnHelper } from "@tanstack/react-table";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import { isAfter, isBefore, isSameDay } from "date-fns";
import { formatDate } from "util/formatDate";
import { createSelectColumnDef } from "./selectColumn";
import { DOCUMENT_TYPES } from "demos-server-constants";

export function DocumentColumns() {
  const columnHelper = createColumnHelper<DocumentTableRow>();

  const documentColumns = [
    createSelectColumnDef(columnHelper),
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
    columnHelper.accessor("documentType", {
      id: "type",
      header: "Document Type",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: DOCUMENT_TYPES.map((type) => ({
            label: type,
            value: type,
          })),
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
        return formatDate(dateValue);
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

import React, { useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { SecondaryButton } from "../../../button/SecondaryButton";
import { highlightCell } from "../../KeywordSearch";
import { useDocumentType } from "hooks/document/useDocumentType";
import dayjs, { Dayjs } from "dayjs";
import { DocumentTableRow } from "./DocumentTable";

export function DocumentColumns() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

  const { getAllDocumentTypes } = useDocumentType();

  React.useEffect(() => {
    const fetchDocumentTypes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getAllDocumentTypes();
        setDocumentTypes([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchDocumentTypes();
  }, [getAllDocumentTypes]);

  if (isLoading) {
    return { loading: true };
  }
  if (error) {
    return { error };
  }
  if (!documentTypes || documentTypes.length === 0) {
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
          options: documentTypes.map((documentType) => ({
            label: documentType.name,
            value: documentType.name,
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
        const dateValue = getValue() as string;
        return dayjs(dateValue).format("MM/DD/YYYY");
      },
      filterFn: (row, columnId, filterValue) => {
        const dateValue = row.getValue(columnId) as string;
        const date: Dayjs = dayjs(dateValue);
        const { start, end } = filterValue || {};
        if (start && end) {
          return (
            date.isSame(start, "day") ||
            date.isSame(end, "day") ||
            (date.isAfter(start, "day") && date.isBefore(end, "day"))
          );
        }
        if (start) {
          return date.isSame(start, "day") || date.isAfter(start, "day");
        }
        if (end) {
          return date.isSame(end, "day") || date.isBefore(end, "day");
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

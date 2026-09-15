// DocumentColumns.tsx
import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import { createSelectColumnDef } from "./selectColumn";
import { createDateColumnDef } from "./dateColumn";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { DocumentTableDocument } from "../tables/DocumentTable";
export function DocumentColumns(isReadonlyUser: boolean) {
  const columnHelper = createColumnHelper<DocumentTableDocument>();

  const baseDocumentColumns = [
    columnHelper.accessor("name", {
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
    columnHelper.accessor("owner.person.fullName", {
      header: "Uploaded By",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    createDateColumnDef(columnHelper, "createdAt", "Date Uploaded"),
    columnHelper.display({
      id: "view",
      header: () => <span className="sr-only">View</span>,
      cell: ({ row }) => {
        const docId = row.original.id;
        const handleClick = () => {
          window.open(`/document/${docId}`, "_blank");
        };
        return (
          <SecondaryButton
            onClick={handleClick}
            name="view-document"
            aria-label={`View ${row.original.name}`}
          >
            View
          </SecondaryButton>
        );
      },
      enableSorting: false,
    }),
  ];

  if (isReadonlyUser) {
    return baseDocumentColumns;
  }

  return [
    createSelectColumnDef(columnHelper),
    ...baseDocumentColumns,
  ];
}

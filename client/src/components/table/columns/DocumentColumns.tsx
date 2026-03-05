// DocumentColumns.tsx
import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import { createSelectColumnDef } from "./selectColumn";
import { createDateColumnDef } from "./dateColumn";
import { DOCUMENT_TYPES } from "demos-server-constants";
import { DocumentTableDocument } from "../tables/DocumentTable";
export function DocumentColumns() {
  const columnHelper = createColumnHelper<DocumentTableDocument>();

  return [
    createSelectColumnDef(columnHelper),
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
      header: "View",
      cell: ({ row }) => {
        const docId = row.original.id;
        const handleClick = () => {
          window.open(`/document/${docId}`, "_blank");
        };
        return (
          <SecondaryButton onClick={handleClick} name="view-document">
            View
          </SecondaryButton>
        );
      },
      enableSorting: false,
    }),
  ];
}

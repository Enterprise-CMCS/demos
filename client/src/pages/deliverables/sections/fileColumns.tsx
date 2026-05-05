import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { DOCUMENT_TYPES } from "demos-server-constants";
import { SecondaryButton } from "components/button";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { createSelectColumnDef } from "components/table/columns/selectColumn";
import { highlightCell } from "components/table/KeywordSearch";

import type { DeliverableFileRow } from "./DeliverableFileTypes";

const DOCUMENT_TYPE_OPTIONS = DOCUMENT_TYPES.map((type) => ({ label: type, value: type }));

const columnHelper = createColumnHelper<DeliverableFileRow>();

const typeColumn = columnHelper.accessor((row) => row.documentType as string, {
  id: "type",
  header: "Type",
  cell: highlightCell,
  filterFn: "arrIncludesSome",
  meta: {
    filterConfig: {
      filterType: "select",
      options: DOCUMENT_TYPE_OPTIONS,
    },
  },
});

const fileNameColumn = columnHelper.accessor("name", {
  header: "File Name",
  cell: highlightCell,
  enableColumnFilter: false,
});

const descriptionColumn = columnHelper.accessor("description", {
  header: "Description",
  cell: highlightCell,
  enableColumnFilter: false,
});

const uploadedByColumn = columnHelper.accessor("owner.person.fullName", {
  id: "uploadedBy",
  header: "Uploaded By",
  cell: highlightCell,
  enableColumnFilter: false,
});

const uploadedDateColumn = createDateColumnDef(columnHelper, "createdAt", "Uploaded Date");

export function makeStateFileColumns() {
  return [
    createSelectColumnDef(columnHelper),
    typeColumn,
    fileNameColumn,
    descriptionColumn,
    uploadedByColumn,
    uploadedDateColumn,
    columnHelper.display({
      id: "current",
      header: "Current",
      cell: ({ row }) => <CurrentToggle fileId={row.original.id} />,
      enableSorting: false,
    }),
  ];
}

export function makeCmsFileColumns() {
  return [
    createSelectColumnDef(columnHelper),
    typeColumn,
    fileNameColumn,
    descriptionColumn,
    uploadedByColumn,
    uploadedDateColumn,
    columnHelper.display({
      id: "view",
      header: "View",
      cell: ({ row }) => (
        <SecondaryButton
          size="small"
          name={`view-file-${row.original.id}`}
          onClick={() => window.open(`/document/${row.original.id}`, "_blank")}
        >
          View
        </SecondaryButton>
      ),
      enableSorting: false,
    }),
  ];
}

const CurrentToggle: React.FC<{ fileId: string }> = ({ fileId }) => (
  <button
    type="button"
    role="switch"
    aria-checked={false}
    aria-label={`Toggle current file ${fileId}`}
    data-testid={`toggle-current-${fileId}`}
    className="relative inline-flex h-5 w-9 items-center rounded-full bg-border-fields focus:outline-none focus:ring-2 focus:ring-action-focus"
  >
    <span className="inline-block h-4 w-4 translate-x-1 transform rounded-full bg-white" />
  </button>
);

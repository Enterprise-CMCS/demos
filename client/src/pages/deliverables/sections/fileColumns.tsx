import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import Switch from "react-switch";

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

export function makeCmsFileColumns({ showSelect = true }: { showSelect?: boolean } = {}) {
  const baseColumns = [
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
  return showSelect ? [createSelectColumnDef(columnHelper), ...baseColumns] : baseColumns;
}

// Uses the shared `react-switch` styling (matching ContactColumns) so the
// toggle renders consistently and isn't affected by the custom Tailwind
// spacing theme.
const CurrentToggle: React.FC<{ fileId: string }> = ({ fileId }) => (
  <div className="inline-flex items-center justify-center">
    <Switch
      checked={false}
      onChange={() => {}}
      aria-label={`Toggle current file ${fileId}`}
      onColor="#6B7280"
      offColor="#E5E7EB"
      checkedIcon={false}
      uncheckedIcon={false}
      height={18}
      width={40}
      handleDiameter={24}
      boxShadow="0 2px 8px rgba(0, 0, 0, 0.6)"
      activeBoxShadow="0 0 2px 3px #3bf"
    />
  </div>
);

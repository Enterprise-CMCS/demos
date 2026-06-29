import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { DOCUMENT_TYPES } from "demos-server-constants";
import { SecondaryButton } from "components/button";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { createSelectColumnDef } from "components/table/columns/selectColumn";
import { highlightCell } from "components/table/KeywordSearch";

import type { DeliverableFileRow } from "../../../pages/deliverables/sections/DeliverableFileTypes";

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

const submittedDateColumn = createDateColumnDef(
  columnHelper,
  "deliverableSubmissionAction.actionTimestamp",
  "Submitted Date",
  "-"
);

// Opens the document in a new tab, where PDFs/images preview inline and other
// formats download. Shared by the State Files and CMS Files tables.
const viewColumn = columnHelper.display({
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
});

export function makeStateFileColumns() {
  return [
    createSelectColumnDef(columnHelper),
    typeColumn,
    fileNameColumn,
    descriptionColumn,
    uploadedByColumn,
    uploadedDateColumn,
    submittedDateColumn,
    viewColumn,
  ];
}

export function makeCmsFileColumns({ showSelect = true }: { showSelect?: boolean } = {}) {
  const baseColumns = [
    typeColumn,
    fileNameColumn,
    descriptionColumn,
    uploadedByColumn,
    uploadedDateColumn,
    viewColumn,
  ];
  return showSelect ? [createSelectColumnDef(columnHelper), ...baseColumns] : baseColumns;
}

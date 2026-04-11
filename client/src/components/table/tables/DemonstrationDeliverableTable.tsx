import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import { Deliverable } from "pages/DeliverablesPage";
import { Table } from "components/table/Table";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { highlightCell, KeywordSearch } from "components/table/KeywordSearch";
import { ColumnFilter } from "components/table/ColumnFilter";
import { PaginationControls } from "components/table/PaginationControls";
import { formatDeliverableStatus } from "./DeliverableTable";

const DEFAULT_EMPTY_ROWS_MESSAGE = "You have no assigned Deliverables at this time";
const DEFAULT_NO_SEARCH_RESULTS_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";

export type DemonstrationDeliverableTableRow = Pick<
  Deliverable,
  | "id"
  | "deliverableType"
  | "deliverableName"
  | "cmsOwner"
  | "dueDate"
  | "submissionDate"
  | "status"
>;

export const DemonstrationDeliverableTable: React.FC<{
  deliverables: Deliverable[];
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
}> = ({
  deliverables,
  emptyRowsMessage = DEFAULT_EMPTY_ROWS_MESSAGE,
  noResultsFoundMessage = DEFAULT_NO_SEARCH_RESULTS_MESSAGE,
}) => {
  const columnHelper = createColumnHelper<DemonstrationDeliverableTableRow>();

  const columns = [
    columnHelper.accessor("deliverableType", {
      header: "Deliverable Type",
      cell: highlightCell,
    }),
    columnHelper.accessor("deliverableName", {
      header: "Deliverable Name",
      cell: highlightCell,
    }),
    columnHelper.accessor("cmsOwner", {
      header: "CMS Owner",
      cell: highlightCell,
    }),
    createDateColumnDef(columnHelper, "dueDate", "Due Date"),
    createDateColumnDef(columnHelper, "submissionDate", "Submission Date"),
    columnHelper.accessor("status", {
      header: "Status",
      cell: highlightCell,
    }),
  ];

  const formattedDeliverables = deliverables.map((deliverable) => ({
    ...deliverable,
    status: formatDeliverableStatus(deliverable),
  }));

  return (
    <Table<DemonstrationDeliverableTableRow>
      data={formattedDeliverables}
      columns={columns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      columnFilter={(table) => <ColumnFilter table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage={emptyRowsMessage}
      noResultsFoundMessage={noResultsFoundMessage}
    />
  );
};

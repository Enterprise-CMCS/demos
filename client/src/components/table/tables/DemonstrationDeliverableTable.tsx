import React from "react";
import { createColumnHelper } from "@tanstack/react-table";

import type { DeliverableTableRow } from "pages/DeliverablesPage";
import { Table } from "components/table/Table";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { highlightCell, KeywordSearch } from "components/table/KeywordSearch";
import { ColumnFilter } from "components/table/ColumnFilter";
import { PaginationControls } from "components/table/PaginationControls";
import { formatDeliverableStatus } from "./DeliverableTable";
import type { DeliverableTableViewMode } from "./DeliverableTable";
import { sortDeliverablesByDefault } from "util/sortDeliverables";

const DEFAULT_EMPTY_ROWS_MESSAGE = "You have no assigned Deliverables at this time";
const DEFAULT_NO_SEARCH_RESULTS_MESSAGE =
  "No results were returned. Adjust your search and filter criteria.";

export type DemonstrationDeliverableTableRow = Pick<
  DeliverableTableRow,
  | "id"
  | "demonstration"
  | "deliverableType"
  | "name"
  | "cmsOwner"
  | "dueDate"
  | "status"
>;

export const DemonstrationDeliverableTable: React.FC<{
  deliverables: DeliverableTableRow[];
  viewMode?: DeliverableTableViewMode;
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
}> = ({
  deliverables,
  viewMode = "demos-cms-user",
  emptyRowsMessage = DEFAULT_EMPTY_ROWS_MESSAGE,
  noResultsFoundMessage = DEFAULT_NO_SEARCH_RESULTS_MESSAGE,
}) => {
  const columnHelper = createColumnHelper<DemonstrationDeliverableTableRow>();

  const columns = [
    columnHelper.accessor("demonstration.name", {
      header: "Demonstration Name",
      cell: highlightCell,
    }),
    columnHelper.accessor("deliverableType", {
      header: "Deliverable Type",
      cell: highlightCell,
    }),
    columnHelper.accessor("name", {
      header: "Deliverable Name",
      cell: highlightCell,
    }),
    createDateColumnDef(columnHelper, "dueDate", "Due Date"),
    columnHelper.accessor("status", {
      header: "Status",
      cell: highlightCell,
    }),
  ];
  const columnsWithCmsFields = [
    columnHelper.accessor("demonstration.state.id", {
      header: "State/Territory",
      cell: highlightCell,
    }),
    ...columns.slice(0, 3),
    columnHelper.accessor("cmsOwner.person.fullName", {
      header: "CMS Owner",
      cell: highlightCell,
    }),
    ...columns.slice(3),
  ];
  const resolvedColumns = viewMode === "demos-state-user" ? columns : columnsWithCmsFields;

  const formattedDeliverables = React.useMemo(
    () =>
      sortDeliverablesByDefault(deliverables).map((deliverable) => ({
        ...deliverable,
        status: formatDeliverableStatus(deliverable),
      })),
    [deliverables]
  );

  return (
    <Table<DemonstrationDeliverableTableRow>
      data={formattedDeliverables}
      columns={resolvedColumns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      columnFilter={(table) => <ColumnFilter table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage={emptyRowsMessage}
      noResultsFoundMessage={noResultsFoundMessage}
    />
  );
};

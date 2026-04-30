import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { UserType } from "demos-server";
import { DELIVERABLE_STATUSES, DELIVERABLE_TYPES } from "demos-server-constants";
import { SecondaryButton } from "components/button";

import type { DeliverableTableRow } from "./DeliverableTable";
import { Table } from "components/table/Table";
import { createDateColumnDef } from "components/table/columns/dateColumn";
import { highlightCell, KeywordSearch } from "components/table/KeywordSearch";
import { ColumnFilter } from "components/table/ColumnFilter";
import { PaginationControls } from "components/table/PaginationControls";
import { sortDeliverablesByDefault } from "util/sortDeliverables";
import { getDeliverableFilterOptions } from "./deliverablesFilterOptions";

const DEFAULT_EMPTY_ROWS_MESSAGE = "You have no assigned Deliverables at this time";
const DEFAULT_NO_SEARCH_RESULTS_MESSAGE =
  "No deliverables match your search";

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
  viewMode?: UserType;
  emptyRowsMessage?: string;
  noResultsFoundMessage?: string;
  onViewDeliverable?: (deliverableId: string) => void;
}> = ({
  deliverables,
  viewMode = "demos-cms-user",
  emptyRowsMessage = DEFAULT_EMPTY_ROWS_MESSAGE,
  noResultsFoundMessage = DEFAULT_NO_SEARCH_RESULTS_MESSAGE,
  onViewDeliverable,
}) => {
  const columnHelper = createColumnHelper<DemonstrationDeliverableTableRow>();
  const { demonstrationNameOptions, cmsOwnerOptions } = getDeliverableFilterOptions(deliverables);
  const viewColumn = columnHelper.display({
    id: "view",
    header: "View",
    cell: ({ row }) => (
      <SecondaryButton
        type="button"
        size="small"
        onClick={() => onViewDeliverable?.(row.original.id)}
        name={`view-deliverable-${row.original.id}`}
      >
        View
      </SecondaryButton>
    ),
    enableSorting: false,
  });

  const columns = [
    columnHelper.accessor("demonstration.name", {
      header: "Demonstration Name",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: demonstrationNameOptions,
        },
      },
    }),
    columnHelper.accessor("deliverableType", {
      header: "Deliverable Type",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: DELIVERABLE_TYPES.map((type) => ({ label: type, value: type })),
        },
      },
    }),
    columnHelper.accessor("name", {
      header: "Deliverable Name",
      cell: highlightCell,
    }),
    createDateColumnDef(columnHelper, "dueDate", "Due Date"),
    columnHelper.accessor("status", {
      header: "Status",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: DELIVERABLE_STATUSES.map((status) => ({ label: status, value: status })),
        },
      },
    }),
    viewColumn,
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
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options: cmsOwnerOptions,
        },
      },
    }),
    ...columns.slice(3),
  ];
  const resolvedColumns = viewMode === "demos-state-user" ? columns : columnsWithCmsFields;

  const formattedDeliverables = sortDeliverablesByDefault(deliverables);

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

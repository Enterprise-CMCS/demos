import React from "react";
import type { UserType } from "demos-server";

import type { DeliverableTableRow, FormattedDeliverableTableRow } from "./DeliverableTable";
import { Table, type TableProps } from "components/table/Table";
import { KeywordSearch } from "components/table/KeywordSearch";
import { ColumnFilter } from "components/table/ColumnFilter";
import { PaginationControls } from "components/table/PaginationControls";
import {
  formatDeliverableFilterStatus,
  formatDeliverableStatus,
  getLatestSubmissionDate,
} from "./DeliverableTable";
import { sortDeliverablesByDefault } from "util/sortDeliverables";
import { getDeliverableFilterOptions } from "./deliverablesFilterOptions";
import { DeliverableActionButtons } from "./DeliverableActionButtons";
import { DeliverableColumns } from "../columns/DeliverableColumns";

const DEFAULT_EMPTY_ROWS_MESSAGE = "You have no assigned Deliverables at this time";
const DEFAULT_NO_SEARCH_RESULTS_MESSAGE = "No deliverables match your search";

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
  const { cmsOwnerOptions } = getDeliverableFilterOptions(deliverables);
  const resolvedColumns = DeliverableColumns({
    viewMode,
    cmsOwnerOptions,
    variant: "demonstration-detail",
    onViewDeliverable,
  });
  type DemonstrationDeliverableActionButtons = NonNullable<
    TableProps<FormattedDeliverableTableRow>["actionButtons"]
  >;
  const renderActionButtons: DemonstrationDeliverableActionButtons = (table) => (
    <DeliverableActionButtons table={table} />
  );
  const actionButtons = viewMode === "demos-state-user" ? undefined : renderActionButtons;

  const formattedDeliverables = sortDeliverablesByDefault(deliverables).map((deliverable) => ({
    ...deliverable,
    submissionDate: getLatestSubmissionDate(deliverable.deliverableActions),
    combinedStatus: formatDeliverableStatus(deliverable),
    combinedStatusFilter: formatDeliverableFilterStatus(deliverable),
  }));

  return (
    <Table<FormattedDeliverableTableRow>
      data={formattedDeliverables}
      columns={resolvedColumns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      columnFilter={(table) => <ColumnFilter table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage={emptyRowsMessage}
      noResultsFoundMessage={noResultsFoundMessage}
      actionButtons={actionButtons}
    />
  );
};

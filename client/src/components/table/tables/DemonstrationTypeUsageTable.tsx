import React, { useMemo } from "react";
import { DemonstrationTypeUsageSummary } from "demos-server";
import { SecondaryButton } from "components/button";
import { MOCK_DEMONSTRATION_TYPE_USAGE } from "mock-data/demonstrationTypeUsageMocks";
import { Table, PaginationControls, KeywordSearch, getColumnBuilder } from "components/table";
import { TypeTagActionButtons } from "./TypeTagActionButtons";

export type DemonstrationTypeUsageRow = DemonstrationTypeUsageSummary & {
  id: string;
};

const { createColumn, createDisplayColumn, createSelectColumn } =
  getColumnBuilder<DemonstrationTypeUsageRow>();

const demonstrationTypeUsageColumns = [
  createSelectColumn(),
  createColumn((row) => row.demonstrationTypeName, "Type/Tag Name"),
  createColumn((row) => (row.approvalStatus === "Approved" ? "Approved" : "Pending"), "Status"),
  createColumn((row) => row.countOfTaggedApplications.demonstrations, "Demonstrations"),
  createColumn((row) => row.countOfTaggedApplications.amendments, "Amendments"),
  createColumn((row) => row.countOfTaggedApplications.renewals, "Renewals"),
  createColumn((row) => row.countOfAssignedDemonstrations, "Demo Types"),
  createColumn((row) => row.countOfAssignedDeliverables, "Deliverables"),
  createDisplayColumn("Action", (cell) => (
    <SecondaryButton name={`view-${cell.row.index}`}>View</SecondaryButton>
  )),
];

export const DemonstrationTypeUsageTable = () => {
  // TODO: Replace this with server data in integration ticket
  const rows = useMemo(
    () =>
      MOCK_DEMONSTRATION_TYPE_USAGE.map((item) => ({
        ...item,
        id: item.demonstrationTypeName,
      })).sort((a, b) => a.demonstrationTypeName.localeCompare(b.demonstrationTypeName)),
    []
  );

  return (
    <Table<DemonstrationTypeUsageRow>
      data={rows}
      columns={demonstrationTypeUsageColumns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      actionButtons={(table) => <TypeTagActionButtons table={table} />}
      emptyRowsMessage="No demonstration types available."
      noResultsFoundMessage="No results match your search"
    />
  );
};

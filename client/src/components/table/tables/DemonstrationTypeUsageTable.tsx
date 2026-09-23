import React, { useMemo } from "react";
import { DemonstrationTypeUsageSummary } from "demos-server";
import { SecondaryButton } from "components/button";
import { MOCK_DEMONSTRATION_TYPE_USAGE } from "mock-data/demonstrationTypeUsageMocks";
import { Table, PaginationControls, KeywordSearch, getColumnBuilder } from "components/table";

export type DemonstrationTypeUsageRow = DemonstrationTypeUsageSummary & {
  id: string;
};

const { createColumn, createDisplayColumn, createSelectColumn } =
  getColumnBuilder<DemonstrationTypeUsageRow>();

const createDemonstrationTypeUsageColumns = (onSelectTypeTag: (tagName: string) => void) => [
  createSelectColumn(),
  createColumn((row) => row.demonstrationTypeName, "Type/Tag Name"),
  createColumn((row) => (row.approvalStatus === "Approved" ? "Approved" : "Pending"), "Status"),
  createColumn((row) => row.countOfTaggedApplications.demonstrations, "Demonstrations"),
  createColumn((row) => row.countOfTaggedApplications.amendments, "Amendments"),
  createColumn((row) => row.countOfTaggedApplications.renewals, "Renewals"),
  createColumn((row) => row.countOfAssignedDemonstrations, "Demo Types"),
  createColumn((row) => row.countOfAssignedDeliverables, "Deliverables"),
  createDisplayColumn("Action", (cell) => (
    <SecondaryButton
      name={`view-${cell.row.index}`}
      onClick={() => onSelectTypeTag(cell.row.original.demonstrationTypeName)}
    >
      View
    </SecondaryButton>
  )),
];

export const DemonstrationTypeUsageTable = ({
  onSelectTypeTag,
}: {
  onSelectTypeTag: (tagName: string) => void;
}) => {
  // TODO: Replace this with server data in integration ticket
  const rows = useMemo(
    () =>
      MOCK_DEMONSTRATION_TYPE_USAGE.map((item) => ({
        ...item,
        id: item.demonstrationTypeName,
      })).sort((a, b) => a.demonstrationTypeName.localeCompare(b.demonstrationTypeName)),
    []
  );

  const columns = useMemo(
    () => createDemonstrationTypeUsageColumns(onSelectTypeTag),
    [onSelectTypeTag]
  );

  return (
    <Table<DemonstrationTypeUsageRow>
      data={rows}
      columns={columns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage="No demonstration types available."
      noResultsFoundMessage="No results match your search"
    />
  );
};

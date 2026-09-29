import React from "react";
import { gql, useQuery } from "@apollo/client";
import { DemonstrationTypeUsageSummary } from "demos-server";
import { SecondaryButton } from "components/button";
import {
  Table,
  PaginationControls,
  KeywordSearch,
  getColumnBuilder,
  ColumnFilter,
} from "components/table";
import { TypeTagActionButtons } from "./TypeTagActionButtons";
import { Loading } from "components/loading/Loading";

export const GET_DEMONSTRATION_TYPE_USAGE_QUERY = gql`
  query GetDemonstrationTypeUsage {
    demonstrationTypeUsageSummary {
      demonstrationTypeName
      approvalStatus
      countOfTaggedApplications {
        demonstrations
        amendments
        renewals
      }
      countOfAssignedDemonstrations
      countOfAssignedDeliverables
    }
  }
`;

export type DemonstrationTypeUsageRow = DemonstrationTypeUsageSummary & {
  id: string;
};

const { createColumn, createDisplayColumn, createSelectColumn } =
  getColumnBuilder<DemonstrationTypeUsageRow>();

const createDemonstrationTypeUsageColumns = (onSelectTypeTag: (tagName: string) => void) => [
  createSelectColumn(),
  createColumn((row) => row.demonstrationTypeName, "Type/Tag Name", {
    enableColumnFilter: false,
  }),
  createColumn((row) => (row.approvalStatus === "Approved" ? "Approved" : "Pending"), "Status", {
    filterConfig: {
      filterType: "select",
      options: [
        { label: "Approved", value: "Approved" },
        { label: "Pending", value: "Pending" },
      ],
    },
  }),
  createColumn((row) => row.countOfTaggedApplications.demonstrations, "Demonstrations", {
    enableColumnFilter: false,
  }),
  createColumn((row) => row.countOfTaggedApplications.amendments, "Amendments", {
    enableColumnFilter: false,
  }),
  createColumn((row) => row.countOfTaggedApplications.renewals, "Renewals", {
    enableColumnFilter: false,
  }),
  createColumn((row) => row.countOfAssignedDemonstrations, "Demo Types", {
    enableColumnFilter: false,
  }),
  createColumn((row) => row.countOfAssignedDeliverables, "Deliverables", {
    enableColumnFilter: false,
  }),
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
  const { data, loading, error } = useQuery<{
    demonstrationTypeUsageSummary: DemonstrationTypeUsageSummary[];
  }>(GET_DEMONSTRATION_TYPE_USAGE_QUERY);

  if (loading) return <Loading />;

  if (error) return <div>Error loading demonstration type usage: {error.message}</div>;

  const rows = (data?.demonstrationTypeUsageSummary ?? [])
    .map((item) => ({
      ...item,
      id: item.demonstrationTypeName,
    }))
    .sort((a, b) => a.demonstrationTypeName.localeCompare(b.demonstrationTypeName));

  return (
    <Table<DemonstrationTypeUsageRow>
      data={rows}
      columns={createDemonstrationTypeUsageColumns(onSelectTypeTag)}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      columnFilter={(table) => <ColumnFilter table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      actionButtons={(table) => <TypeTagActionButtons table={table} />}
      emptyRowsMessage="No demonstration types available."
      noResultsFoundMessage="No results match your search"
    />
  );
};

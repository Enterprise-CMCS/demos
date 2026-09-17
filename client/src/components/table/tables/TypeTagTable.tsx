import React from "react";
import { gql, useQuery } from "@apollo/client";
import { useTypeTagSelection } from "pages/admin/useTypeTagSelection";
import { KeywordSearch } from "components/table/KeywordSearch";
import { PaginationControls } from "components/table/PaginationControls";
import { Table } from "components/table/Table";
import { TypeTagColumns, TypeTagRow } from "components/table/columns/TypeTagColumns";

export const TYPE_TAG_MANAGEMENT_QUERY = gql`
  query GetTypeTagManagement {
    demonstrationTypeUsageSummary {
      demonstrationTypeName
      approvalStatus
    }
  }
`;

type TypeTagManagementQueryResult = {
  demonstrationTypeUsageSummary: Pick<TypeTagRow, "demonstrationTypeName" | "approvalStatus">[];
};

const toSortedRows = (
  summaries: TypeTagManagementQueryResult["demonstrationTypeUsageSummary"]
): TypeTagRow[] =>
  summaries
    .map((summary) => ({ ...summary, id: summary.demonstrationTypeName }))
    .sort((rowA, rowB) => rowA.demonstrationTypeName.localeCompare(rowB.demonstrationTypeName));

export const TypeTagTable: React.FC = () => {
  const { selectTypeTag } = useTypeTagSelection();
  const { data, loading, error } = useQuery<TypeTagManagementQueryResult>(
    TYPE_TAG_MANAGEMENT_QUERY
  );

  if (loading) {
    return <div>Loading types/tags...</div>;
  }

  if (error || !data) {
    return <div>Error loading types/tags.</div>;
  }

  const rows = toSortedRows(data.demonstrationTypeUsageSummary);

  return (
    <Table<TypeTagRow>
      data={rows}
      columns={TypeTagColumns(selectTypeTag)}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage="No types/tags available."
      noResultsFoundMessage="No results match your search"
    />
  );
};

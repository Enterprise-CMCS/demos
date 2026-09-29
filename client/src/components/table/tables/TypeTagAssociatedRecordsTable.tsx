import React from "react";
import { gql, useQuery } from "@apollo/client";
import type {
  Amendment,
  Deliverable,
  Demonstration,
  DemonstrationTypeAssignment,
  Extension as Renewal,
  Person,
  State,
  Tag,
} from "demos-server";
import type { Option } from "components/input/select/Select";
import { ColumnFilter } from "components/table/ColumnFilter";
import { KeywordSearch } from "components/table/KeywordSearch";
import { PaginationControls } from "components/table/PaginationControls";
import { Table } from "components/table/Table";
import {
  AssociatedRecordType,
  compareRecordTypes,
  TypeTagAssociatedRecordRow,
  TypeTagAssociatedRecordsColumns,
} from "components/table/columns/TypeTagAssociatedRecordsColumns";

export const RECORD_COUNT_TEST_ID = "type-tag-record-count";

export const TYPE_TAG_ASSOCIATED_RECORDS_QUERY = gql`
  query GetTypeTagAssociatedRecords {
    demonstrations {
      id
      name
      state {
        id
        name
      }
      primaryProjectOfficer {
        id
        fullName
      }
      tags {
        tagName
        approvalStatus
      }
      demonstrationTypes {
        demonstrationTypeName
        approvalStatus
      }
      amendments {
        id
        name
        tags {
          tagName
          approvalStatus
        }
      }
      renewals: extensions {
        id
        name
        tags {
          tagName
          approvalStatus
        }
      }
      deliverables {
        id
        name
        demonstrationTypes {
          tagName
          approvalStatus
        }
      }
    }
  }
`;

export type AssociatedRecordsDemonstration = Pick<Demonstration, "id" | "name" | "tags"> & {
  state: Pick<State, "id" | "name">;
  primaryProjectOfficer: Pick<Person, "id" | "fullName">;
  demonstrationTypes: Pick<
    DemonstrationTypeAssignment,
    "demonstrationTypeName" | "approvalStatus"
  >[];
  amendments: Pick<Amendment, "id" | "name" | "tags">[];
  renewals: Pick<Renewal, "id" | "name" | "tags">[];
  deliverables: Pick<Deliverable, "id" | "name" | "demonstrationTypes">[];
};

type AssociatedRecordCandidate = {
  recordType: AssociatedRecordType;
  record: { id: string; name: string };
  tags: Tag[];
  href: string;
};

const getCandidates = (
  demonstration: AssociatedRecordsDemonstration
): AssociatedRecordCandidate[] => {
  const demonstrationHref = `/demonstrations/${demonstration.id}`;
  const demonstrationTypeTags: Tag[] = demonstration.demonstrationTypes.map((type) => ({
    tagName: type.demonstrationTypeName,
    approvalStatus: type.approvalStatus,
  }));

  return [
    {
      recordType: "Demonstration",
      record: demonstration,
      tags: demonstration.tags,
      href: demonstrationHref,
    },
    ...demonstration.amendments.map((amendment) => ({
      recordType: "Amendment" as const,
      record: amendment,
      tags: amendment.tags,
      href: `${demonstrationHref}?amendments=${amendment.id}`,
    })),
    ...demonstration.renewals.map((renewal) => ({
      recordType: "Renewal" as const,
      record: renewal,
      tags: renewal.tags,
      href: `${demonstrationHref}?renewals=${renewal.id}`,
    })),
    {
      recordType: "Demonstration Type",
      record: demonstration,
      tags: demonstrationTypeTags,
      href: demonstrationHref,
    },
    ...demonstration.deliverables.map((deliverable) => ({
      recordType: "Deliverable" as const,
      record: deliverable,
      tags: deliverable.demonstrationTypes,
      href: `/deliverables/${deliverable.id}`,
    })),
  ];
};

export const buildAssociatedRecordRows = (
  demonstrations: AssociatedRecordsDemonstration[],
  tagName: string
): TypeTagAssociatedRecordRow[] =>
  demonstrations.flatMap((demonstration) =>
    getCandidates(demonstration).flatMap(({ recordType, record, tags, href }) => {
      const tag = tags.find((candidateTag) => candidateTag.tagName === tagName);
      if (!tag) {
        return [];
      }
      return [
        {
          // A demonstration can appear as both a Demonstration and a Demonstration Type record.
          id: `${recordType}-${record.id}`,
          tagName: tag.tagName,
          approvalStatus: tag.approvalStatus,
          recordType,
          relatedItemName: record.name,
          stateName: demonstration.state.name,
          projectOfficerName: demonstration.primaryProjectOfficer.fullName,
          href,
        },
      ];
    })
  );

// Default order lives in the data so clearing a column sort falls back to it.
export const sortAssociatedRecordsByDefault = (
  rows: TypeTagAssociatedRecordRow[]
): TypeTagAssociatedRecordRow[] =>
  [...rows].sort(
    (rowA, rowB) =>
      compareRecordTypes(rowA.recordType, rowB.recordType) ||
      rowA.relatedItemName.localeCompare(rowB.relatedItemName, undefined, { numeric: true })
  );

const getProjectOfficerOptions = (demonstrations: AssociatedRecordsDemonstration[]): Option[] =>
  [...new Set(demonstrations.map((demonstration) => demonstration.primaryProjectOfficer.fullName))]
    .sort((a, b) => a.localeCompare(b))
    .map((fullName) => ({ label: fullName, value: fullName }));

export const TypeTagAssociatedRecordsTable: React.FC<{ selectedTypeTag: string }> = ({
  selectedTypeTag,
}) => {
  // Refetch on every visit so associations removed elsewhere drop off the list.
  const { data, loading, error } = useQuery<{ demonstrations: AssociatedRecordsDemonstration[] }>(
    TYPE_TAG_ASSOCIATED_RECORDS_QUERY,
    { fetchPolicy: "cache-and-network" }
  );

  if (loading && !data) {
    return <div>Loading associated records...</div>;
  }

  if (error || !data) {
    return <div>Error loading associated records.</div>;
  }

  const rows = sortAssociatedRecordsByDefault(
    buildAssociatedRecordRows(data.demonstrations, selectedTypeTag)
  );
  const columns = TypeTagAssociatedRecordsColumns(getProjectOfficerOptions(data.demonstrations));

  return (
    <Table<TypeTagAssociatedRecordRow>
      data={rows}
      columns={columns}
      keywordSearch={(table) => <KeywordSearch table={table} />}
      columnFilter={(table) => <ColumnFilter table={table} />}
      pagination={(table) => <PaginationControls table={table} />}
      emptyRowsMessage="No records are associated with this Type/Tag."
      noResultsFoundMessage="No results match your search"
      actionButtons={(table) => {
        const recordCount = table.getFilteredRowModel().rows.length;
        return (
          <span data-testid={RECORD_COUNT_TEST_ID} className="font-semibold whitespace-nowrap">
            {recordCount} {recordCount === 1 ? "Record" : "Records"}
          </span>
        );
      }}
    />
  );
};

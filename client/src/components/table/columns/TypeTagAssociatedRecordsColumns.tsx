import React from "react";
import { createColumnHelper, FilterFn, SortingFn } from "@tanstack/react-table";
import type { Person, State, Tag } from "demos-server";
import { STATES_AND_TERRITORIES } from "demos-server-constants";
import { TAG_STATUS_LABELS, TagStatusBadge } from "components/badge/TagStatusBadge";
import { SecondaryButton } from "components/button";
import type { Option } from "components/input/select/Select";
import { highlightCell } from "../KeywordSearch";

// Declared in the story's default sort order.
export const ASSOCIATED_RECORD_TYPES = [
  "Demonstration",
  "Amendment",
  "Renewal",
  "Demonstration Type",
  "Deliverable",
] as const;

export type AssociatedRecordType = (typeof ASSOCIATED_RECORD_TYPES)[number];

export type TypeTagAssociatedRecordRow = Pick<Tag, "tagName" | "approvalStatus"> & {
  id: string;
  recordType: AssociatedRecordType;
  relatedItemName: string;
  stateName: State["name"];
  projectOfficerName: Person["fullName"];
  href: string;
};

export const compareRecordTypes = (a: AssociatedRecordType, b: AssociatedRecordType): number =>
  ASSOCIATED_RECORD_TYPES.indexOf(a) - ASSOCIATED_RECORD_TYPES.indexOf(b);

const sortByRecordTypeOrder: SortingFn<TypeTagAssociatedRecordRow> = (rowA, rowB) =>
  compareRecordTypes(rowA.original.recordType, rowB.original.recordType);

// TanStack's arrIncludesSome substring-matches strings ("Virginia" would match "West Virginia").
const equalsAnyOf: FilterFn<TypeTagAssociatedRecordRow> = (row, columnId, filterValues: string[]) =>
  filterValues.includes(row.getValue<string>(columnId));

const toOptions = (values: readonly string[]): Option[] =>
  values.map((value) => ({ label: value, value }));

const columnHelper = createColumnHelper<TypeTagAssociatedRecordRow>();

export const TypeTagAssociatedRecordsColumns = (projectOfficerOptions: Option[]) => [
  columnHelper.accessor("tagName", {
    header: "Type/Tag Name",
    enableSorting: false,
    enableColumnFilter: false,
    cell: highlightCell,
  }),
  columnHelper.accessor("recordType", {
    header: "Record Type",
    sortingFn: sortByRecordTypeOrder,
    filterFn: equalsAnyOf,
    cell: highlightCell,
    meta: {
      filterConfig: {
        filterType: "select",
        options: toOptions(ASSOCIATED_RECORD_TYPES),
      },
    },
  }),
  columnHelper.accessor("relatedItemName", {
    header: "Related Item Name",
    enableColumnFilter: false,
    cell: highlightCell,
  }),
  columnHelper.accessor("stateName", {
    header: "State/Territory",
    filterFn: equalsAnyOf,
    cell: highlightCell,
    meta: {
      filterConfig: {
        filterType: "select",
        options: toOptions(STATES_AND_TERRITORIES.map((state) => state.name)),
      },
    },
  }),
  columnHelper.accessor((row) => TAG_STATUS_LABELS[row.approvalStatus], {
    id: "status",
    header: "Status",
    filterFn: equalsAnyOf,
    cell: ({ row }) => <TagStatusBadge approvalStatus={row.original.approvalStatus} />,
    meta: {
      filterConfig: {
        filterType: "select",
        options: toOptions(Object.values(TAG_STATUS_LABELS)),
      },
    },
  }),
  columnHelper.accessor("projectOfficerName", {
    header: "Project Officer",
    filterFn: equalsAnyOf,
    cell: highlightCell,
    meta: {
      filterConfig: {
        filterType: "select",
        options: projectOfficerOptions,
      },
    },
  }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <SecondaryButton
        type="button"
        size="small"
        name={`open-record-${row.original.id}`}
        aria-label={`Open ${row.original.relatedItemName}`}
        onClick={() => window.open(row.original.href, "_blank")}
      >
        Open
      </SecondaryButton>
    ),
  }),
];

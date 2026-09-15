import React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import type { DemonstrationTypeUsageSummary } from "demos-server";
import { TAG_STATUS_LABELS, TagStatusBadge } from "components/badge/TagStatusBadge";
import { SecondaryButton } from "components/button";
import { highlightCell } from "../KeywordSearch";

export type TypeTagRow = Pick<
  DemonstrationTypeUsageSummary,
  "demonstrationTypeName" | "approvalStatus"
> & {
  id: string;
};

const columnHelper = createColumnHelper<TypeTagRow>();

export const TypeTagColumns = (onViewTypeTag: (tagName: string) => void) => [
  columnHelper.accessor("demonstrationTypeName", {
    header: "Type/Tag Name",
    cell: highlightCell,
  }),
  columnHelper.accessor((row) => TAG_STATUS_LABELS[row.approvalStatus], {
    id: "status",
    header: "Status",
    cell: ({ row }) => <TagStatusBadge approvalStatus={row.original.approvalStatus} />,
  }),
  columnHelper.display({
    id: "action",
    header: "Action",
    cell: ({ row }) => (
      <SecondaryButton
        type="button"
        size="small"
        name={`view-type-tag-${row.original.id}`}
        aria-label={`View records associated with ${row.original.demonstrationTypeName}`}
        onClick={() => onViewTypeTag(row.original.demonstrationTypeName)}
      >
        View
      </SecondaryButton>
    ),
  }),
];

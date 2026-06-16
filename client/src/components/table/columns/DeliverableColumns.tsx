import * as React from "react";
import { createColumnHelper } from "@tanstack/react-table";
import { createSelectColumnDef } from "./selectColumn";
import { createDateColumnDef } from "./dateColumn";
import {
  DELIVERABLE_STATUSES,
  DELIVERABLE_TYPES,
  STATES_AND_TERRITORIES,
} from "demos-server-constants";
import type { UserType } from "demos-server";
import type { Option } from "components/input/select/Select";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import type { FormattedDeliverableTableRow } from "../tables/DeliverableTable";

type DeliverableColumnsProps = {
  viewMode: UserType;
  demonstrationNameOptions?: Option[];
  cmsOwnerOptions?: Option[];
  variant?: "deliverables-page" | "demonstration-detail";
  onViewDeliverable?: (deliverableId: string) => void;
};

const COMBINED_STATUS_OPTIONS = [
  "Upcoming",
  "Upcoming - Extension Requested",
  "Submitted",
  "Submitted - Extension Requested",
  "Past Due",
  "Past Due - Extension Requested",
  "Under CMS Review",
  "Under CMS Review - Extension Requested",
  "Approved",
  "Accepted",
  "Received and Filed",
].map((status) => ({
  label: status,
  value: status,
}));

export function DeliverableColumns({
  viewMode,
  demonstrationNameOptions = [],
  cmsOwnerOptions = [],
  variant = "deliverables-page",
  onViewDeliverable,
}: DeliverableColumnsProps) {
  const columnHelper = createColumnHelper<FormattedDeliverableTableRow>();
  const isDemonstrationDetail = variant === "demonstration-detail";

  const demonstrationNameColumn = columnHelper.accessor("demonstration.name", {
    header: "Demonstration Name",
    cell: highlightCell,
    filterFn: "arrIncludesSome",
    meta: {
      filterConfig: {
        filterType: "select",
        options: demonstrationNameOptions,
      },
    },
  });

  const deliverableTypeColumn = columnHelper.accessor("deliverableType", {
    header: "Deliverable Type",
    cell: highlightCell,
    filterFn: "arrIncludesSome",
    meta: {
      headerClassName: "w-min-[250px]",
      cellClassName: "w-min-[250px] whitespace-normal break-words leading-snug",
      filterConfig: {
        filterType: "select",
        options: DELIVERABLE_TYPES.map((type) => ({ label: type, value: type })),
      },
    },
  });

  const deliverableNameColumn = columnHelper.accessor("name", {
    header: "Deliverable Name",
    cell: highlightCell,
    meta: {
      headerClassName: "w-min-[100px] w-max-[200px]",
      headerContentClassName: "whitespace-normal break-words leading-snug",
      cellClassName: "w-min-[100px] w-max-[200px] whitespace-normal break-words leading-snug",
    },
  });

  const dueDateColumn = createDateColumnDef(columnHelper, "dueDate", "Due Date", "", {
    headerClassName: "w-max-[100px]",
    headerContentClassName: "whitespace-normal break-words",
    cellClassName: "w-max-[100px] whitespace-normal break-words",
  });

  const submissionDateColumn = createDateColumnDef(
    columnHelper,
    "submissionDate",
    "Submission Date",
    "-",
    {
      headerClassName: "w-[100px]",
      headerContentClassName: "break-words",
      cellClassName: "w-[100px] break-words",
    }
  );
  const statusColumn = columnHelper.accessor("combinedStatus", {
    header: "Status",
    cell: highlightCell,
    filterFn: "arrIncludesSome",
    meta: {
      headerClassName: "w-[100px]",
      headerContentClassName: "whitespace-nowrap",
      cellClassName: "w-[100px] whitespace-nowrap",
      filterConfig: {
        filterType: "select",
        options: isDemonstrationDetail
          ? DELIVERABLE_STATUSES.filter((status) => status !== "Deleted").map((status) => ({
            label: status,
            value: status,
          }))
          : COMBINED_STATUS_OPTIONS,
      },
    },
  });
  const viewColumn = columnHelper.display({
    id: "view",
    header: () => <span className="sr-only">View</span>,
    cell: ({ row }) => {
      const deliverableId = row.original.id;
      const handleClick = () => {
        if (isDemonstrationDetail) {
          onViewDeliverable?.(deliverableId);
          return;
        }
        window.open(`/deliverables/${deliverableId}`, "_blank");
      };
      return (
        <SecondaryButton
          type="button"
          size={isDemonstrationDetail ? "small" : undefined}
          onClick={handleClick}
          name={isDemonstrationDetail ? `view-deliverable-${deliverableId}` : "view-deliverable"}
          ariaLabel={`View ${row.original.name}`}
        >
          View
        </SecondaryButton>
      );
    },
    enableSorting: false,
    meta: {
      headerClassName: "w-[50px] min-w-[50px]",
      headerContentClassName: "whitespace-nowrap",
      cellClassName: "w-[50px] min-w-[50px] text-right",
    },
  });

  if (isDemonstrationDetail) {
    const detailColumns = [
      deliverableTypeColumn,
      deliverableNameColumn,
      dueDateColumn,
      submissionDateColumn,
      statusColumn,
      viewColumn,
    ];

    if (viewMode === "demos-state-user") {
      return detailColumns;
    }

    return [
      createSelectColumnDef(columnHelper),
      ...detailColumns.slice(0, 2),
      columnHelper.accessor("cmsOwner.person.fullName", {
        header: "CMS Owner",
        cell: highlightCell,
        filterFn: "arrIncludesSome",
        meta: {
          headerClassName: "w-min-[200px] w-max-[220px]",
          headerContentClassName: "whitespace-normal break-words leading-snug",
          cellClassName: "w-min-[200px] w-max-[220px] whitespace-normal break-words",
          filterConfig: {
            filterType: "select",
            options: cmsOwnerOptions,
          },
        },
      }),
      ...detailColumns.slice(2),
    ];
  }

  if (viewMode === "demos-state-user") {
    return [
      demonstrationNameColumn,
      deliverableTypeColumn,
      deliverableNameColumn,
      dueDateColumn,
      submissionDateColumn,
      statusColumn,
      viewColumn,
    ];
  }

  return [
    createSelectColumnDef(columnHelper),
    columnHelper.accessor("demonstration.state.id", {
      id: "stateId",
      header: "State/\u200BTerritory",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterLabel: "State/Territory",
        headerClassName: "w-[120px] min-w-[120px]",
        cellClassName: "break-words w-[100px]",
        filterConfig: {
          filterType: "select",
          options:
            STATES_AND_TERRITORIES.map((state) => ({
              label: state.id,
              value: state.id,
            })) ?? [],
        },
      },
    }),
    demonstrationNameColumn,
    deliverableTypeColumn,
    deliverableNameColumn,
    columnHelper.accessor("cmsOwner.person.fullName", {
      header: "CMS Owner",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        headerClassName: "w-[120px]",
        headerContentClassName: "whitespace-nowrap",
        cellClassName: "w-[120px]",
        filterConfig: {
          filterType: "select",
          options: cmsOwnerOptions,
        },
      },
    }),
    dueDateColumn,
    submissionDateColumn,
    statusColumn,
    viewColumn,
  ];
}

// DocumentColumns.tsx
import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";
import { createSelectColumnDef } from "./selectColumn";
import { createDateColumnDef } from "./dateColumn";
import { STATES_AND_TERRITORIES } from "demos-server-constants";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import type { DeliverableTableRow, DeliverableTableViewMode } from "../tables/DeliverableTable";

type DeliverableColumnsProps = {
  viewMode: DeliverableTableViewMode;
};

export function DeliverableColumns({ viewMode }: DeliverableColumnsProps) {
  const columnHelper = createColumnHelper<DeliverableTableRow>();

  const demonstrationNameColumn = columnHelper.accessor("demonstration.name", {
    header: "Demonstration Name",
    cell: highlightCell,
  });

  const deliverableTypeColumn = columnHelper.accessor("deliverableType", {
    header: "Deliverable Type",
    cell: highlightCell,
  });

  const deliverableNameColumn = columnHelper.accessor("name", {
    header: "Deliverable Name",
    cell: highlightCell,
  });

  const dueDateColumn = createDateColumnDef(columnHelper, "dueDate", "Due Date");
  const statusColumn = columnHelper.accessor("status", {
    header: "Status",
    cell: highlightCell,
  });

  if (viewMode === "demos-state-user") {
    return [
      demonstrationNameColumn,
      deliverableTypeColumn,
      deliverableNameColumn,
      dueDateColumn,
      statusColumn,
    ];
  }

  return [
    createSelectColumnDef(columnHelper),
    columnHelper.accessor("demonstration.state.id", {
      id: "stateId",
      header: "State/Territory",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
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
    }),
    dueDateColumn,
    statusColumn,
    columnHelper.display({
      id: "view",
      cell: ({ row }) => {
        const deliverableId = row.original.id;
        const handleClick = () => {
          window.open(`/deliverable/${deliverableId}`, "_blank");
        };
        return (
          <SecondaryButton onClick={handleClick} name="view-deliverable">
            View
          </SecondaryButton>
        );
      },
      enableSorting: false,
    }),
  ];
}

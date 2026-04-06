// DocumentColumns.tsx
import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";
import { createSelectColumnDef } from "./selectColumn";
import { createDateColumnDef } from "./dateColumn";
import { STATES_AND_TERRITORIES } from "demos-server-constants";

import { SecondaryButton } from "../../button/SecondaryButton";
import { highlightCell } from "../KeywordSearch";
import { DeliverableTableRow } from "../tables/DeliverableTable";

export function DeliverableColumns() {
  const columnHelper = createColumnHelper<DeliverableTableRow>();

  return [
    createSelectColumnDef(columnHelper),
    columnHelper.accessor("state.id", {
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
    columnHelper.accessor("demonstrationName", {
      header: "Demonstration Name",
      cell: highlightCell,
    }),
    columnHelper.accessor("deliverableType", {
      header: "Deliverable Type",
      cell: highlightCell,
    }),
    columnHelper.accessor("deliverableName", {
      header: "Deliverable Name",
      cell: highlightCell,
    }),
    columnHelper.accessor("cmsOwner", {
      header: "CMS Owner",
      cell: highlightCell,
    }),
    createDateColumnDef(columnHelper, "dueDate", "Due Date"),
    createDateColumnDef(columnHelper, "submissionDate", "Submission Date"),
    columnHelper.accessor("status", {
      header: "Status",
      cell: highlightCell,
    }),
    columnHelper.display({
      id: "view",
      header: "View",
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

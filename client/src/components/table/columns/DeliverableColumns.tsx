// DocumentColumns.tsx
import * as React from "react";

import { createColumnHelper } from "@tanstack/react-table";

import { isAfter, isBefore, isSameDay } from "date-fns";
import { formatDate } from "util/formatDate";
import { createSelectColumnDef } from "./selectColumn";
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
    columnHelper.accessor("dueDate", {
      header: "Due Date",
      cell: ({ getValue }) => {
        const dateValue = getValue();
        return formatDate(dateValue);
      },
      filterFn: (row, columnId, filterValue) => {
        const dateValue = row.getValue(columnId) as string;
        const date: Date = new Date(dateValue);
        const { start, end } = filterValue || {};
        if (start && end) {
          return (
            isSameDay(date, start) ||
            isSameDay(date, end) ||
            (isAfter(date, start) && isBefore(date, end))
          );
        }
        if (start) {
          return isSameDay(date, start) || isAfter(date, start);
        }
        if (end) {
          return isSameDay(date, end) || isBefore(date, end);
        }
        return true;
      },
      meta: {
        filterConfig: {
          filterType: "date",
        },
      },
    }),
    columnHelper.accessor("name", {
      header: "Deliverable Name",
      cell: highlightCell,
    }),
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

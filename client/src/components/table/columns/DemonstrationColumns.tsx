import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../KeywordSearch";
import { SecondaryButton } from "components/button";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import React from "react";
import { GenericDemonstrationTableRow } from "../tables/DemonstrationTable";
import { DemonstrationStatus, State, User } from "demos-server";

// TODO: currently this is acting like a hook, but its not intended to be used generically like one. Perhaps
// reformat to be more like a utility function.

export function DemonstrationColumns(
  stateOptions: Pick<State, "id" | "name">[],
  userOptions: Pick<User, "fullName">[],
  statusOptions: Pick<DemonstrationStatus, "name">[]
) {
  const columnHelper = createColumnHelper<GenericDemonstrationTableRow>();

  return [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          id="select-all-rows"
          type="checkbox"
          className="cursor-pointer"
          aria-label="Select all rows"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          id={`select-row-${row.id}`}
          type="checkbox"
          className="cursor-pointer"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          aria-label={`Select row ${row.index + 1}`}
        />
      ),
      size: 20,
    }),
    columnHelper.accessor("state.name", {
      id: "stateName",
      header: "State/Territory",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options:
            stateOptions.map((state) => ({
              label: state.id,
              value: state.name,
            })) ?? [],
        },
      },
    }),
    columnHelper.accessor("name", {
      header: "Title",
      cell: highlightCell,
      enableColumnFilter: false,
    }),
    columnHelper.accessor("projectOfficer.fullName", {
      id: "projectOfficer",
      header: "Project Officer",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options:
            userOptions.map((officer) => ({
              label: officer.fullName,
              value: officer.fullName,
            })) ?? [],
        },
      },
    }),
    columnHelper.display({
      id: "applications",
      header: "Applications",
      cell: ({ row }) => {
        if (row.original.type === "amendment" || row.original.type === "extension") {
          return <span>{row.original.type === "amendment" ? "Amendment" : "Extension"}</span>;
        }
        const amendmentsCount = row.original.amendments?.length ?? 0;
        const extensionsCount = row.original.extensions?.length ?? 0;
        return (
          <div>
            <div>Amendments ({amendmentsCount})</div>
            <div>Extensions ({extensionsCount})</div>
          </div>
        );
      },
    }),
    columnHelper.accessor("status.name", {
      id: "status",
      header: "Status",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterConfig: {
          filterType: "select",
          options:
            statusOptions.map((status) => ({
              label: status.name,
              value: status.name,
            })) ?? [],
        },
      },
    }),
    columnHelper.display({
      id: "viewDetails",
      cell: ({ row }) => {
        // Always link to the parent demonstration page
        // If this row is an amendment or extension, use the parent id and add the correct query param
        let demoId = row.original.id;
        let queryParam = "";
        if (row.original.type === "amendment" && row.original.parentId) {
          demoId = row.original.parentId;
          queryParam = `amendments=${row.original.id}`;
        } else if (row.original.type === "extension" && row.original.parentId) {
          demoId = row.original.parentId;
          queryParam = `extensions=${row.original.id}`;
        }
        const href = queryParam
          ? `/demonstrations/${demoId}?${queryParam}`
          : `/demonstrations/${demoId}`;
        const handleClick = () => {
          window.location.href = href;
        };
        return (
          <SecondaryButton
            type="button"
            size="small"
            onClick={handleClick}
            name={`view-details-${row.original.id}`}
          >
            View
          </SecondaryButton>
        );
      },
    }),
    columnHelper.display({
      id: "expander",
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <button
            aria-label="expand"
            onClick={row.getToggleExpandedHandler()}
            style={{ cursor: "pointer" }}
          >
            {row.getIsExpanded() ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </button>
        ) : (
          ""
        ),
    }),
  ];
}

import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../KeywordSearch";
import { SecondaryButton } from "components/button";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import React from "react";
import { DemonstrationTableRow } from "../tables/DemonstrationTable";
import { Person } from "demos-server";
import { APPLICATION_STATUS, STATES_AND_TERRITORIES } from "demos-server-constants";
import { ApplicationStatusBadge } from "components/badge/ApplicationStatusBadge";
import type { ApplicationStatus } from "demos-server";

// TODO: currently this is acting like a hook, but its not intended to be used generically like one. Perhaps
// reformat to be more like a utility function.

export function DemonstrationColumns(projectOfficerOptions: Pick<Person, "fullName">[]) {
  const columnHelper = createColumnHelper<DemonstrationTableRow>();

  return [
    columnHelper.accessor("state.id", {
      id: "stateId",
      header: () => (
        <span className="leading-tight" aria-label="State/Territory">
          State /
          <br />
          Territory
        </span>
      ),
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        filterLabel: "State/Territory",
        headerClassName: "w-[100px]",
        cellClassName: "w-[100px]",
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
    columnHelper.accessor("name", {
      header: "Title",
      cell: highlightCell,
      enableColumnFilter: false,
      meta: {
        headerClassName: "w-[250px]",
        cellClassName: "min-w-[200px] whitespace-normal break-words leading-snug",
      },
    }),
    columnHelper.accessor((row) => row.primaryProjectOfficer.fullName, {
      id: "projectOfficer",
      header: "Project Officer",
      cell: highlightCell,
      filterFn: "arrIncludesSome",
      meta: {
        headerClassName: "w-[140px]",
        headerContentClassName: "whitespace-nowrap",
        cellClassName: "w-[140px]",
        filterConfig: {
          filterType: "select",
          options:
            projectOfficerOptions.map((officer) => ({
              label: officer.fullName,
              value: officer.fullName,
            })) ?? [],
        },
      },
    }),
    columnHelper.accessor("status", {
      id: "status",
      header: "Status",
      cell: (info) => (
        <ApplicationStatusBadge
          applicationStatus={info.getValue<ApplicationStatus>()}
          size="small"
        />
      ),
      filterFn: "arrIncludesSome",
      meta: {
        headerClassName: "w-[148px]",
        cellClassName: "w-[148px]",
        filterConfig: {
          filterType: "select",
          options:
            APPLICATION_STATUS.map((status) => ({
              label: status,
              value: status,
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
      meta: {
        headerClassName: "w-[132px]",
        cellClassName: "w-[132px] leading-snug",
      },
    }),
    columnHelper.display({
      id: "viewDetails",
      header: () => <span className="sr-only">View</span>,
      cell: ({ row }) => {
        let demoId = row.original.id; // link directly to demos
        let queryParam = "";
        // If amendment or extension use the parent id and add the correct query param
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
      meta: {
        headerClassName: "w-[76px]",
        cellClassName: "w-[76px] text-right whitespace-nowrap",
      },
    }),
    columnHelper.display({
      id: "expander",
      header: () => <span className="sr-only">Expand</span>,
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
      meta: {
        headerClassName: "w-[32px]",
        cellClassName: "w-[32px] text-left",
      },
    }),
  ];
}

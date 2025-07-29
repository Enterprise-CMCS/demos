import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../KeywordSearch";
import { SecondaryButton } from "components/button";
import { ChevronDownIcon, ChevronRightIcon } from "components/icons";
import { useUserOperations } from "hooks/useUserOperations";
import { useState } from "hooks/useState";
import { useDemonstrationStatus } from "hooks/useDemonstrationStatus";
import React from "react";
import { TableRow } from "../tables/DemonstrationTable";

// TODO: currently this is acting like a hook, but its not intended to be used generically like one. Perhaps
// reformat to be more like a utility function.
export function DemonstrationColumns() {
  const { getUserOptions } = useUserOperations();
  const { getStateOptions } = useState();
  const { getDemonstrationStatusOptions } = useDemonstrationStatus();

  // Trigger queries on mount
  React.useEffect(() => {
    getUserOptions.trigger();
    getStateOptions.trigger();
    getDemonstrationStatusOptions.trigger();
  }, []);

  // Loading and error handling
  if (
    getUserOptions.loading ||
    getStateOptions.loading ||
    getDemonstrationStatusOptions.loading
  ) {
    return { loading: true };
  }
  if (
    getUserOptions.error ||
    getStateOptions.error ||
    getDemonstrationStatusOptions.error
  ) {
    return {
      error:
        getUserOptions.error?.message ||
        getStateOptions.error?.message ||
        getDemonstrationStatusOptions.error?.message,
    };
  }
  if (
    !getUserOptions.data ||
    !getStateOptions.data ||
    !getDemonstrationStatusOptions.data
  ) {
    return { error: "Data not found" };
  }

  const columnHelper = createColumnHelper<TableRow>();

  const demonstrationColumns = [
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
            getStateOptions.data?.map((state) => ({
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
            getUserOptions.data?.map((officer) => ({
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
        if (
          row.original.type === "amendment" ||
          row.original.type === "extension"
        ) {
          return (
            <span>
              {row.original.type === "amendment" ? "Amendment" : "Extension"}
            </span>
          );
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
          options: [
            ...(getDemonstrationStatusOptions.data?.map((s) => ({
              label: s.name,
              value: s.name,
            })) ?? []),
          ],
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
          queryParam = "amendments=true";
        } else if (row.original.type === "extension" && row.original.parentId) {
          demoId = row.original.parentId;
          queryParam = "extensions=true";
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
            className="px-2 py-0 text-sm font-medium"
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

  return {
    demonstrationColumns,
    demonstrationColumnsLoading: false,
    demonstrationColumnsError: null,
  };
}

import React from "react";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import { useQuery } from "@apollo/client";
import { SecondaryButton } from "components/button";
import { Demonstration } from "./Demonstrations";
import { gql } from "@apollo/client";
import { highlightCell } from "components/table/search/KeywordSearch";

const columnHelper = createColumnHelper<Demonstration>();

export type ProjectOfficerSelectOptions = {
  fullName: string;
};

export const GET_PROJECT_OFFICERS_FOR_SELECT = gql`
  query GetUsers {
    users {
      fullName
    }
  }
`;

export type StateSelectOptions = {
  stateCode: string;
  stateName: string;
};

export const GET_STATES_FOR_SELECT = gql`
  query GetStates {
    states {
      stateCode
      stateName
    }
  }
`;

export type DemonstrationStatusSelectOptions = {
  name: string;
};

export const GET_DEMONSTRATION_STATUSES_FOR_SELECT = gql`
  query GetDemonstrationStatuses {
    demonstrationStatuses {
      name
    }
  }
`;

export const useDemonstrationColumns = () => {
  const {
    data: usersData,
    loading: usersLoading,
    error: usersError,
  } = useQuery<{ users: ProjectOfficerSelectOptions[] }>(
    GET_PROJECT_OFFICERS_FOR_SELECT
  );
  const {
    data: statesData,
    loading: statesLoading,
    error: statesError,
  } = useQuery<{ states: StateSelectOptions[] }>(GET_STATES_FOR_SELECT);
  const {
    data: demonstrationStatusesData,
    loading: demonstrationStatusesLoading,
    error: demonstrationStatusesError,
  } = useQuery<{ demonstrationStatuses: DemonstrationStatusSelectOptions[] }>(
    GET_DEMONSTRATION_STATUSES_FOR_SELECT
  );

  const projectOfficers = usersData?.users || [];
  const states = statesData?.states || [];
  const demonstrationStatuses =
    demonstrationStatusesData?.demonstrationStatuses || [];

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
    columnHelper.accessor("state.stateName", {
      id: "stateName",
      header: "State/Territory",
      cell: highlightCell,
      meta: {
        filterConfig: {
          filterType: "select",
          options: states.map((state) => ({
            label: state.stateCode,
            value: state.stateName,
          })),
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
      meta: {
        filterConfig: {
          filterType: "select",
          options: projectOfficers.map((officer) => ({
            label: officer.fullName,
            value: officer.fullName,
          })),
        },
      },
    }),
    columnHelper.accessor("demonstrationStatus.name", {
      id: "demonstrationStatus",
      header: "Status",
      cell: highlightCell,
      meta: {
        filterConfig: {
          filterType: "select",
          options: demonstrationStatuses.map((demonstrationStatus) => ({
            label: demonstrationStatus.name,
            value: demonstrationStatus.name,
          })),
        },
      },
    }),
    columnHelper.display({
      id: "viewDetails",
      cell: ({ row }) => {
        const handleClick = () => {
          const demoId = row.original.id;
          window.location.href = `/demonstrations/${demoId}`;
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
  ];

  return {
    columns: demonstrationColumns as ColumnDef<Demonstration, unknown>[],
    loading: usersLoading || statesLoading || demonstrationStatusesLoading,
    error: usersError || statesError || demonstrationStatusesError,
  };
};

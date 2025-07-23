import React from "react";

import { gql, useQuery } from "@apollo/client";
import { TabItem, Tabs } from "layout/Tabs";
import { createColumnHelper } from "@tanstack/react-table";
import { highlightCell } from "../search/KeywordSearch";
import { SecondaryButton } from "components/button";
import { Table } from "../Table";

export type ProjectOfficerSelectOptions = {
  fullName: string;
};

export const GET_PROJECT_OFFICERS_FOR_SELECT = gql`
  query GetProjectOfficers {
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

type Demonstration = {
  id: string;
  name: string;
  description: string;
  demonstrationStatus: {
    id: string;
    name: string;
  };
  state: {
    id: string;
    stateName: string;
    stateCode: string;
  };
  projectOfficer: {
    id: string;
    fullName: string;
  };
  users: {
    id: string;
    fullName: string;
  }[];
};

export const DEMONSTRATIONS_TABLE_QUERY = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      demonstrationStatus {
        id
        name
      }
      state {
        stateName
        stateCode
      }
      users {
        id
        fullName
      }
      projectOfficer {
        id
        fullName
      }
    }
  }
`;

export const DemonstrationsTable: React.FC = () => {
  const [tab, setTab] = React.useState<"my" | "all">("my");

  const {
    data: projectOfficersData,
    loading: projectOfficersLoading,
    error: projectOfficersError,
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
  const {
    data: demonstrationsTableData,
    loading: demonstrationsTableLoading,
    error: demonstrationsTableError,
  } = useQuery<{ demonstrations: Demonstration[] }>(DEMONSTRATIONS_TABLE_QUERY);

  if (projectOfficersLoading || statesLoading || demonstrationStatusesLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (projectOfficersError || statesError || demonstrationStatusesError) {
    return (
      <div className="p-4">
        Error loading data:{" "}
        {projectOfficersError?.message ||
          statesError?.message ||
          demonstrationStatusesError?.message}
      </div>
    );
  }

  if (demonstrationsTableLoading) {
    return <div className="p-4">Loading...</div>;
  }
  if (demonstrationsTableError) {
    return (
      <div className="p-4">
        Error loading documents: {demonstrationsTableError.message}
      </div>
    );
  }
  if (!demonstrationsTableData) {
    return <div className="p-4">Demonstration not found</div>;
  }

  if (!projectOfficersData || !statesData || !demonstrationStatusesData) {
    return <div className="p-4">Data not found</div>;
  }

  const columnHelper = createColumnHelper<Demonstration>();
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
          options: statesData.states.map((state) => ({
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
          options: projectOfficersData.users.map((officer) => ({
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
          options: demonstrationStatusesData.demonstrationStatuses.map(
            (demonstrationStatus) => ({
              label: demonstrationStatus.name,
              value: demonstrationStatus.name,
            })
          ),
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

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: Demonstration[] =
    demonstrationsTableData.demonstrations.filter((demo: Demonstration) =>
      demo.users.some((user) => user.id === currentUserId)
    );

  const allDemos: Demonstration[] = demonstrationsTableData.demonstrations;

  const tabList: TabItem[] = [
    {
      value: "my",
      label: "My Demonstrations",
      count: myDemos.length,
    },
    {
      value: "all",
      label: "All Demonstrations",
      count: allDemos.length,
    },
  ];

  const dataToShow = tab === "my" ? myDemos : allDemos;
  const emptyRowsMessage =
    tab === "my"
      ? "You have no assigned demonstrations at this time."
      : "No demonstrations are tracked.";
  const noResultsFoundMessage =
    "No results were returned. Adjust your search and filter criteria.";

  return (
    <div>
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />
      <Table<Demonstration>
        data={dataToShow}
        columns={demonstrationColumns}
        keywordSearch
        columnFilter
        pagination
        emptyRowsMessage={emptyRowsMessage}
        noResultsFoundMessage={noResultsFoundMessage}
      />
    </div>
  );
};

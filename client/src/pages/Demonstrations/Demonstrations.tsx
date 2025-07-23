import React from "react";

import { gql, useQuery } from "@apollo/client";
import { TabItem, Tabs } from "layout/Tabs";
import { Table } from "components/table/Table";
import { useDemonstrationColumns } from "./DemonstrationColumns";

export type Demonstration = {
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

export const Demonstrations: React.FC = () => {
  const { data, error, loading } = useQuery(DEMONSTRATIONS_TABLE_QUERY);

  const {
    columns,
    loading: columnsLoading,
    error: columnsError,
  } = useDemonstrationColumns();

  const [tab, setTab] = React.useState<"my" | "all">("my");

  if (loading || columnsLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading demonstrations:</div>;
  }
  if (columnsError) {
    return <div>Error loading filter options: {columnsError.message}</div>;
  }
  if (!data || !data.demonstrations) {
    return null;
  }

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: Demonstration[] = data.demonstrations.filter(
    (demo: Demonstration) =>
      demo.users.some((user) => user.id === currentUserId)
  );

  const allDemos: Demonstration[] = data.demonstrations;

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
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">
        Demonstrations
      </h1>

      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />

      <Table<Demonstration>
        data={dataToShow}
        columns={columns}
        keywordSearch
        columnFilter
        pagination
        emptyRowsMessage={emptyRowsMessage}
        noResultsFoundMessage={noResultsFoundMessage}
      />
    </div>
  );
};

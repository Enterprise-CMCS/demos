import React from "react";
import {
  DemonstrationTable,
  DemonstrationTableRow,
} from "components/table/tables/DemonstrationTable";
import { gql, useQuery } from "@apollo/client";
import {
  StateOption,
  StatusOption,
  UserOption,
} from "components/table/columns/DemonstrationColumns";
import { TabItem, Tabs } from "layout/Tabs";

const MY_EMPTY_ROWS_MESSAGE = "You have no assigned demonstrations at this time.";

export const DEMONSTRATIONS_PAGE_QUERY = gql`
  query GetDemonstrationsPage {
    demonstrations {
      id
      name
      demonstrationStatus {
        name
      }
      state {
        name
      }
      users {
        id
      }
      projectOfficer {
        fullName
      }
      amendments {
        id
        name
        projectOfficer {
          fullName
        }
        amendmentStatus {
          name
        }
      }
      extensions {
        id
        name
        projectOfficer {
          fullName
        }
        extensionStatus {
          name
        }
      }
    }

    stateOptions: states {
      id
      name
    }

    projectOfficerOptions: users {
      fullName
    }

    statusOptions: demonstrationStatuses {
      name
    }
  }
`;

export type DemonstrationsPageQueryResult = {
  demonstrations: DemonstrationTableRow[];
  projectOfficerOptions: UserOption[];
  stateOptions: StateOption[];
  statusOptions: StatusOption[];
};

export const Demonstrations: React.FC = () => {
  const [tab, setTab] = React.useState<"my" | "all">("my");
  const { data, loading, error } =
    useQuery<DemonstrationsPageQueryResult>(DEMONSTRATIONS_PAGE_QUERY);

  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error loading demonstrations.</div>;
  }
  if (!data) {
    return <div>No data available.</div>;
  }

  // TODO: Replace with actual current user ID from authentication context
  const currentUserId = "1";

  const myDemos: DemonstrationTableRow[] = data.demonstrations.filter(
    (demo: DemonstrationTableRow) => demo.users.some((user) => user.id === currentUserId)
  );

  const tabList: TabItem[] = [
    {
      value: "my",
      label: "My Demonstrations",
      count: myDemos.length,
    },
    {
      value: "all",
      label: "All Demonstrations",
      count: data.demonstrations.length,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">Demonstrations</h1>
      {loading && <div className="p-4">Loading demonstrations...</div>}
      {error && <div className="p-4 text-red-500">Error loading</div>}
      {data && (
        <>
          <Tabs
            tabs={tabList}
            selectedValue={tab}
            onChange={(newVal) => setTab(newVal as "my" | "all")}
          />
          <DemonstrationTable
            demonstrations={tab === "my" ? myDemos : data.demonstrations}
            stateOptions={data.stateOptions}
            projectOfficerOptions={data.projectOfficerOptions}
            statusOptions={data.statusOptions}
            emptyRowsMessage={tab === "my" ? MY_EMPTY_ROWS_MESSAGE : undefined}
          />
        </>
      )}
    </div>
  );
};

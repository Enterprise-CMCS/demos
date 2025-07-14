import React from "react";
import { gql, useQuery } from "@apollo/client";
import {
  DemonstrationTable,
  FullDemonstrationTableRow,
} from "components/table/tables/DemonstrationTable";
import { Tabs, TabItem } from "layout/Tabs";

const DEMONSTRATIONS_TABLE = gql`
  query GetDemonstrations {
    demonstrations {
      id
      name
      description
      evaluationPeriodStartDate
      evaluationPeriodEndDate
      createdAt
      updatedAt
      projectOfficerUser {
        id
        displayName
        email
      }
      state {
        id
        stateCode
        stateName
      }
      demonstrationStatus {
        id
        name
        description
      }
    }
  }
`;

interface GetDemonstrationsData {
  demonstrations: Demonstration[];
}
interface ProjectOfficerUser {
  id: string;
  displayName?: string;
  fullName?: string;
  email?: string;
}

interface State {
  id: string;
  stateCode?: string;
  stateName?: string;
}

interface DemonstrationStatus {
  id: string;
  name?: string;
  description?: string;
}

interface Demonstration {
  id: string;
  name: string;
  description?: string;
  evaluationPeriodStartDate?: string;
  evaluationPeriodEndDate?: string;
  createdAt: string;
  updatedAt: string;
  projectOfficerUser?: ProjectOfficerUser;
  state?: State;
  demonstrationStatus?: DemonstrationStatus;
}

export const Demonstrations: React.FC = () => {
  const { data, loading, error } = useQuery<GetDemonstrationsData>(DEMONSTRATIONS_TABLE)

  const [tab, setTab] = React.useState<"my" | "all">("my");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const allDemos = data?.demonstrations || [];

  // Replace with real user id from auth context or wherever you store it
  const currentUserId = "ba67a354-b73b-4ea9-8134-c7fccfd5fad8";

  const myDemos = allDemos.filter(
    (demo) => demo.projectOfficerUser?.id === currentUserId
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
      count: allDemos.length,
    },
  ];

  const dataToShow = tab === "my" ? myDemos : allDemos;

  // Transform the data for the table


  const transformedData: FullDemonstrationTableRow[] = (dataToShow as Demonstration[]).map(
    (demo) => ({
      id: demo.id,
      title: demo.name,
      description: demo.description,
      evalPeriodStartDate: demo.evaluationPeriodStartDate,
      evalPeriodEndDate: demo.evaluationPeriodEndDate,
      demonstrationStatusId: demo.demonstrationStatus?.id,
      stateName: demo.state?.stateName,
      projectOfficer:
        demo?.projectOfficerUser?.displayName ||
        demo?.projectOfficerUser?.fullName ||
        null,
      Id: demo?.projectOfficerUser?.id || null,
      createdAt: demo.createdAt,
      updatedAt: demo.updatedAt,
      status: demo.demonstrationStatus?.name || "Unknown",
    })
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">
        Demonstrations
      </h1>

      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(val) => setTab(val as "my" | "all")}
      />

      <div className="h-[60vh] overflow-y-auto">
        <DemonstrationTable
          data={transformedData}
          isMyDemosTable={tab === "my"}
        />
      </div>
    </div>
  );
};

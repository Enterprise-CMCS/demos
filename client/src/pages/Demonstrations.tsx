import React from "react";
import { gql, useQuery } from "@apollo/client";
import {
  DemonstrationTable,
  FullDemonstrationTableRow
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
      projectOfficer {
        displayName
        email
        id
      }
      state {
        stateCode
        id
        stateName
      }
      demonstrationStatus {
        name
        id
        description
      }
    }
  }
`;

export const Demonstrations: React.FC = () => {
  const { data, loading, error } = useQuery(DEMONSTRATIONS_TABLE);

  const [tab, setTab] = React.useState<"my" | "all">("my");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const allDemos = data?.demonstrations || [];

  // Replace with real user id from auth context or wherever you store it
  const currentUserId = "b9901f9d-56cd-4df0-9792-27224af27b28";

  const myDemos = allDemos.filter(
    (demo) => demo.projectOfficer?.id === currentUserId
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
  const transformedData: FullDemonstrationTableRow[] = dataToShow.map(
    (demonstration) => ({
      id: demonstration.id,
      title: demonstration.name,
      description: demonstration.description,
      evalPeriodStartDate: demonstration.evaluationPeriodStartDate,
      evalPeriodEndDate: demonstration.evaluationPeriodEndDate,
      demonstrationStatusId: demonstration.demonstrationStatus?.id,
      stateName: demonstration.state?.stateName,
      projectOfficer:
        demonstration?.projectOfficerUser?.displayName ||
        demonstration?.projectOfficerUser?.fullName ||
        null,
      Id: demonstration?.projectOfficerUser?.id || null,
      createdAt: demonstration.createdAt,
      updatedAt: demonstration.updatedAt,
      status: demonstration.demonstrationStatus?.name || "Unknown",
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

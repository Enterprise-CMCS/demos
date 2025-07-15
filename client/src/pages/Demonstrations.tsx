import React from "react";
import { gql, useQuery } from "@apollo/client";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import { TabItem, Tabs } from "layout/Tabs";
import { DemonstrationStatus } from "demos-server";

type RawDemonstration = {
  id: number;
  title: string;
  demoNumber: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatus: DemonstrationStatus;
  demonstrationStatusId: string;
  stateId: string;
  state: string;
  projectOfficer: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export const DEMONSTRATIONS_TABLE = gql`
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

export const Demonstrations: React.FC = () => {
  const currentUserId = 123;

  const { data, loading, error } = useQuery(DEMONSTRATIONS_TABLE);

  const allDemos: RawDemonstration[] =
    data?.demonstrations?.map((demo) => ({
      id: parseInt(demo.id),
      title: demo.name,
      demoNumber: "",
      description: demo.description,
      evalPeriodStartDate: demo.evaluationPeriodStartDate,
      evalPeriodEndDate: demo.evaluationPeriodEndDate,
      demonstrationStatus: demo.demonstrationStatus,
      demonstrationStatusId: demo.demonstrationStatus?.id,
      stateId: demo.state?.id,
      state: demo.state?.stateName || "",
      projectOfficer: demo.projectOfficerUser?.displayName || "",
      userId: parseInt(demo.projectOfficerUser?.id || "0"),
      createdAt: demo.createdAt,
      updatedAt: demo.updatedAt,
    })) || [];

  const myDemos = allDemos.filter(
    (demo) => demo.userId === currentUserId
  );

  const [tab, setTab] = React.useState<"my" | "all">("my");

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
  console.log("Data to show:", allDemos);
  // return;
  if (loading) {
    return <div>Loading demonstrations…</div>;
  }

  if (error) {
    return <div>Error loading demonstrations: {error.message}</div>;
  }

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

      <div className="h-[60vh] overflow-y-auto">
        <DemonstrationTable
          data={dataToShow}
          isMyDemosTable={tab === "my"}
        />
      </div>
    </div>
  );
};

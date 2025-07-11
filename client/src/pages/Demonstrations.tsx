import React, { useEffect } from "react";
import { useDemonstration } from "hooks/useDemonstration";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import { Tabs, TabItem } from "layout/Tabs";

export const Demonstrations: React.FC = () => {
  const {
    getAllDemonstrations: { trigger, data, loading, error },
  } = useDemonstration();

  // Kick off the query when the component mounts
  useEffect(() => {
    trigger();
  }, [trigger]);
  const [tab, setTab] = React.useState<"my" | "all">("my");

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const allDemos = data || [];

  // Replace with real user id from auth context or wherever you store it
  const currentUserId = "b9901f9d-56cd-4df0-9792-27224af27b28";

  const myDemos = allDemos.filter((demo) =>
    demo.projectOfficerUser?.id === currentUserId
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
  // Transform the data to your frontend table shape:
  const transformedData = dataToShow.map((demo) => ({
    id: demo.id,
    title: demo.name,
    demoNumber: "", // only if needed
    description: demo.description,
    evalPeriodStartDate: demo.evaluationPeriodStartDate,
    evalPeriodEndDate: demo.evaluationPeriodEndDate,
    demonstrationStatusId: demo.demonstrationStatus?.id,
    stateName: demo.state.stateName,
    projectOfficer: demo?.projectOfficerUser?.displayName,
    userId: demo.users?.[0]?.id,
    createdAt: demo.createdAt,
    updatedAt: demo.updatedAt,
  }));

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

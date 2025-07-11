import React, { useEffect } from "react";
import { useDemonstration } from "hooks/useDemonstration";
import { DemonstrationTable, FullDemonstrationTableRow } from "components/table/tables/DemonstrationTable";
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
  const transformedData: FullDemonstrationTableRow[] = dataToShow.map((demonstration) => ({
    id: demonstration.id,
    title: demonstration.name,
    // demoNumber: Not in schema, so just leaving this head
    description: demonstration.description,
    evalPeriodStartDate: demonstration.evaluationPeriodStartDate,
    evalPeriodEndDate: demonstration.evaluationPeriodEndDate,
    demonstrationStatusId: demonstration.demonstrationStatus?.id,
    stateName: demonstration.state.stateName,
    projectOfficer:
      demonstration.projectOfficerUser?.displayName ||
      demonstration.projectOfficerUser?.fullName || null,
    userId: demonstration.projectOfficerUser?.id || null,
    createdAt: demonstration.createdAt,
    updatedAt: demonstration.updatedAt,
    status: demonstration.demonstrationStatus?.name || "Unknown",
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

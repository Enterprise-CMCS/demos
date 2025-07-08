import React from "react";
import { Tabs, TabItem } from "layout/Tabs";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
// import DemoData from "faker_data/empty_demonstrations.json";
import DemoData from "faker_data/demonstrations.json";

// Using JSON dummy data.
type RawDemonstration = {
  id: number;
  title: string;
  demoNumber: string;
  description: string;
  evalPeriodStartDate: string;
  evalPeriodEndDate: string;
  demonstrationStatusId: number;
  stateId: string;
  projectOfficer: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
};

export const Demonstrations: React.FC = () => {
  // Dummy value - replace me!
  const currentUserId = 123;

  const myDemos: RawDemonstration[] = (DemoData as RawDemonstration[]).filter(
    (demo) => demo.userId === currentUserId
  );

  const allDemos: RawDemonstration[] = (DemoData as RawDemonstration[]);
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

  // If you ask me, this is the best part of this feature
  const dataToShow = tab === "my" ? myDemos : allDemos;

  return (
    <div className="flex flex-col h-full min-h-0">
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">Demonstrations</h1>

      {/* TABS HEADER COMPONENT */}
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />

      {/* one table req'd to rule them all */}
      <div className="h-[60vh] overflow-y-auto">
        <DemonstrationTable
          data={dataToShow}
          isMyDemosTable={tab === "my"}
        />
      </div>
    </div>
  );
};

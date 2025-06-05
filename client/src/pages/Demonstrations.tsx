// src/pages/Demonstrations.tsx
import React from "react";
import { Tabs, TabItem } from "layout/Tabs";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import DemoData from "faker_data/demonstrations.json";

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
  // 1) Suppose we know the current user’s ID is 123
  const currentUserId = 123;

  // 2) Split DemoData into “my demos” vs. “all demos”
  const myDemos: RawDemonstration[] = (DemoData as RawDemonstration[]).filter(
    (demo) => demo.userId === currentUserId
  );
  const allDemos: RawDemonstration[] = (DemoData as RawDemonstration[]);

  // 3) Track which tab is selected (“my” or “all”)
  const [tab, setTab] = React.useState<"my" | "all">("my");

  // 4) Build the tab items (label + count + value)
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

  // Decide which array to pass to the single <DemonstrationTable>
  const dataToShow = tab === "my" ? myDemos : allDemos;

  return (
    <div className="flex flex-col h-full min-h-0">
      <h1 className="text-2xl font-bold mb-4">Demonstrations</h1>

      {/* TABS HEADER COMPONENT */}
      <Tabs
        tabs={tabList}
        selectedValue={tab}
        onChange={(newVal) => setTab(newVal as "my" | "all")}
      />

      {/* SINGLE TABLE, with “dataToShow” changing based on tab */}
      <div className="h-[60vh] overflow-y-auto">
        <DemonstrationTable data={dataToShow} />
      </div>
    </div>
  );
};

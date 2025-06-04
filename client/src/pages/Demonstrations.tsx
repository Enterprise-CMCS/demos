// src/pages/Demonstrations.tsx
import React, { useState } from "react";
import { TableTitle } from "components/table/sections/TableTitle";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import DemoData from "faker_data/demonstrations.json";

export const Demonstrations: React.FC = () => {
  // 1) State to track which tab is active: "my" or "all"
  const [selectedTab, setSelectedTab] = useState<"my" | "all">("my");

  // 2) For illustration, we’ll pretend the first 7 are “mine” and the rest are “all”.
  //    Replace this with your actual filtering logic (e.g. filter by current user’s ID).
  const myData = DemoData.slice(0, 7);
  const allData = DemoData;

  // 3) Decide which data and title/count to show based on selectedTab
  const displayedData = selectedTab === "my" ? myData : allData;
  const titleText = selectedTab === "my" ? "My Demonstrations" : "All Demonstrations";
  const count = displayedData.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page‐level heading */}
      <h1 className="text-2xl font-bold mb-4">Demonstrations</h1>
      <div className="border-b border-gray-300">
        <ul className="flex -mb-px">
          <li className="mr-4">
            <button
              onClick={() => setSelectedTab("my")}
              className={
                "inline-block px-4 py-2 font-medium " +
                (selectedTab === "my"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800")
              }
            >
              My Demonstrations ({myData.length})
            </button>
          </li>
          <li className="mr-4">
            <button
              onClick={() => setSelectedTab("all")}
              className={
                "inline-block px-4 py-2 font-medium " +
                (selectedTab === "all"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800")
              }
            >
              All Demonstrations ({allData.length})
            </button>
          </li>
        </ul>
      </div>

      <TableTitle title={titleText} count={count}>
        {/* Limit the height and make it scrollable */}
        <div className="h-[60vh] overflow-y-auto">
          <DemonstrationTable data={displayedData} />
        </div>
      </TableTitle>
    </div>
  );
};

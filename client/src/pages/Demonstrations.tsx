import React, { useState } from "react";
import { TableTitle } from "components/table/sections/TableTitle";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";
import DemoData from "faker_data/demonstrations.json";

export const Demonstrations: React.FC = () => {
  const [tab, setTab] = useState<"my" | "all">("my");
  // Placeholder for the current user ID.
  const currentUserId = 123;

  // Filter logic for “My” vs “All”
  const myDemos = DemoData.filter(demonstration => demonstration.userId === currentUserId);
  const allDemos = DemoData;

  const displayedData = tab === "my" ? myDemos : allDemos;
  const titleText = tab === "my" ? "My Demonstrations" : "All Demonstrations";
  const count = displayedData.length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <h1 className="text-2xl font-bold mb-4">Demonstrations</h1>

      {/* Tab header */}
      <div className="border-b border-gray-300 mb-4">
        <ul className="flex -mb-px">
          <li className="mr-4">
            <button
              onClick={() => setTab("my")}
              className={
                "inline-block px-4 py-2 font-medium " +
                  (tab === "my"
                    ? "border-b-2 border-[var(--color-brand)] text-brand"
                    : "text-gray-600 hover:text-gray-800")
              }
            >
              My Demonstrations ({myDemos.length})
            </button>
          </li>
          <li className="mr-4">
            <button
              onClick={() => setTab("all")}
              className={
                "inline-block px-4 py-2 font-medium " +
                (tab === "all"
                  ? "border-b-2 border-[var(--color-brand)] text-brand"
                  : "text-gray-600 hover:text-gray-800")
              }
            >
              All Demonstrations ({allDemos.length})
            </button>
          </li>
        </ul>
      </div>

      <TableTitle title={titleText} count={count}>
        <div className="h-[60vh] overflow-y-auto">
          <DemonstrationTable data={displayedData} />
        </div>
      </TableTitle>
    </div>
  );
};

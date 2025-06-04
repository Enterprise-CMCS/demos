import React from "react";
import { TableTitle } from "components/table/sections/TableTitle";
import DemonstrationTable from "components/table/tables/DemonstrationTable";
import DemoData from "faker_data/demonstrations.json";


export const Demonstrations: React.FC = () => {
  return (
    <div className="flex flex-col h-full min-h-0">
      <h1 className="text-2xl font-bold">Demonstrations</h1>
      <TableTitle
        title="My Demonstrations"
        count={DemoData.length}
      >
        <div className="h-[60vh] overflow-y-auto">
          <DemonstrationTable
            data={DemoData}
          />
        </div>
      </TableTitle>
    </div>
  );
};

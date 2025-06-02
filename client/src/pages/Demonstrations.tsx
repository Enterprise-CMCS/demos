import React from "react";
import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";
import { TableTitle } from "components/table/sections/TableTitle";
import DemonstrationTable from "components/table/tables/DemonstrationTable";
import DemoData from "faker_data/demonstrations.json";


const Demonstrations: React.FC = () => {
  return (
    <div className="p-0">
      <h1 className="text-2xl font-bold">Demonstrations</h1>
      <TableTitle title="My Demonstrations">
        <DemonstrationTable
          data={DemoData}
          columns={DemonstrationColumns}
        />
      </TableTitle>
    </div>
  );
};

export default Demonstrations;

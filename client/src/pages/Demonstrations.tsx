import React from "react";
import { DemonstrationColumns } from "components/table/columns/DemonstrationColumns";
import { TableSection } from "components/table/sections/TableSection";
import DemonstrationTable from "components/table/tables/DemonstrationTable";
import DemoData from "faker_data/demonstrations.json";


const Demonstrations: React.FC = () => {
  return (
    <div className="p-0">
      <h1 className="text-2xl font-bold">Demonstrations</h1>
      <TableSection title="Demonstrations">
        <DemonstrationTable
          data={DemoData}
          columns={DemonstrationColumns}
        />
      </TableSection>
    </div>
  );
};

export default Demonstrations;

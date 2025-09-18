import React from "react";
import { DemonstrationTable } from "components/table/tables/DemonstrationTable";

export const Demonstrations: React.FC = () => (
  <div>
    <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">Demonstrations</h1>
    <DemonstrationTable />
  </div>
);

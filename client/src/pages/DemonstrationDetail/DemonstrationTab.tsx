import { DocumentTable } from "components/table/tables/document/DocumentTable";
import React from "react";
export const DemonstrationTab: React.FC = () => (
  <div>
    <h1 className="text-xl font-bold mb-4 text-brand uppercase border-b-1">
      Documents
    </h1>
    <DocumentTable />
  </div>
);

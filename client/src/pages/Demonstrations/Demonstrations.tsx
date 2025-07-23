import React from "react";

import { DemonstrationsTable } from "components/table/tables/DemonstrationsTable";

export const Demonstrations: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-brand uppercase border-b-1">
        Demonstrations
      </h1>
      <DemonstrationsTable />
    </div>
  );
};

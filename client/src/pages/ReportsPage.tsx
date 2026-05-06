import React from "react";

import { Card } from "components/card/Card";
import { ReportsTable } from "components/table/tables/ReportsTable";

export const ReportsPage: React.FC = () => {
  return (
    <Card title="Reports">
      <ReportsTable />
    </Card>
  );
};

import React from "react";

import { Card } from "components/card/Card";
import { ReferencesTable } from "components/table/tables/ReferencesTable";

export const ReferencesPage: React.FC = () => {
  return (
    <Card title="References">
      <ReferencesTable />
    </Card>
  );
};

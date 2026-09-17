import React from "react";
import { DemonstrationTypeUsageTable } from "components/table/";

export const DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME = "type-tag-management-pane";

export const TypeTagManagement: React.FC = () => {
  return (
    <div data-testid={DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME}>
      <DemonstrationTypeUsageTable />
    </div>
  );
};

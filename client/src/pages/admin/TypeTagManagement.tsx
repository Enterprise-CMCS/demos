import React from "react";
import { DemonstrationTypeUsageTable, TypeTagTable } from "components/table/";
import { useSearchParams } from "react-router-dom";
import { TypeTagAssociatedRecords } from "./TypeTagAssociatedRecords";
import { isTypeTagSelected } from "./useTypeTagSelection";

export const DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME = "type-tag-management-pane";

export const TypeTagManagement: React.FC = () => {
  const [searchParams] = useSearchParams();

  return (
    <div data-testid={DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME}>
      <DemonstrationTypeUsageTable />
      {isTypeTagSelected(searchParams) ? <TypeTagAssociatedRecords /> : <TypeTagTable />}
    </div>
  );
};

import React from "react";
import { DemonstrationTypeUsageTable, TypeTagTable } from "components/table/";
import { useSearchParams } from "react-router-dom";
import { TypeTagAssociatedRecords } from "./TypeTagAssociatedRecords";
import { isTypeTagSelected } from "./useTypeTagSelection";
import { TabHeader } from "components/table/TabHeader";
import { IconButton } from "components/button/IconButton";
import { AddNewIcon } from "components/icons/Action/AddNewIcon";
import { useDialog } from "components/dialog/DialogContext";

export const DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME = "type-tag-management-pane";

export const TypeTagManagement: React.FC = () => {
  const { showCreateDemonstrationTypesDialog } = useDialog();
  const [searchParams] = useSearchParams();

  return (
    <div data-testid={DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME}>
      <TabHeader title="Type/Tag Management">
        <IconButton
          icon={<AddNewIcon />}
          name="button-create-demonstration-types"
          size="small"
          onClick={() => showCreateDemonstrationTypesDialog()}
        >
          Create New
        </IconButton>
      </TabHeader>
      <DemonstrationTypeUsageTable />
      {isTypeTagSelected(searchParams) ? <TypeTagAssociatedRecords /> : <TypeTagTable />}
    </div>
  );
};

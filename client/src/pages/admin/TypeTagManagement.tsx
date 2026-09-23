import React, { useState } from "react";
import { DemonstrationTypeUsageTable } from "components/table/";
import { TypeTagAssociatedRecords } from "./TypeTagAssociatedRecords";
import { TabHeader } from "components/table/TabHeader";
import { IconButton } from "components/button/IconButton";
import { AddNewIcon } from "components/icons/Action/AddNewIcon";
import { useDialog } from "components/dialog/DialogContext";

export const DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME = "type-tag-management-pane";

const CreateNewButton = () => {
  const { showCreateDemonstrationTypesDialog } = useDialog();

  return (
    <IconButton
      icon={<AddNewIcon />}
      name="button-create-demonstration-types"
      size="small"
      onClick={() => showCreateDemonstrationTypesDialog()}
    >
      Create New
    </IconButton>
  );
};

export const TypeTagManagement: React.FC = () => {
  const [selectedTypeTag, setSelectedTypeTag] = useState<string>("");

  return (
    <div data-testid={DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME}>
      <TabHeader title="Type/Tag Management">
        <CreateNewButton />
      </TabHeader>
      {selectedTypeTag ? (
        <TypeTagAssociatedRecords
          selectedTypeTag={selectedTypeTag}
          onClear={() => setSelectedTypeTag("")}
        />
      ) : (
        <DemonstrationTypeUsageTable onSelectTypeTag={setSelectedTypeTag} />
      )}
    </div>
  );
};

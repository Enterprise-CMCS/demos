import React, { useState } from "react";
import { DemonstrationTypeUsageTable } from "components/table/";
import { TabHeader } from "components/table/TabHeader";
import { IconButton } from "components/button";
import { AddNewIcon } from "components/icons/Action/AddNewIcon";
import { useDialog } from "components/dialog/DialogContext";
import { ChevronLeftIcon } from "components/icons/Symbol/ChevronLeftIcon";
import { TypeTagAssociatedRecordsTable } from "components/table/tables/TypeTagAssociatedRecordsTable";

export const DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME = "type-tag-management-pane";
export const BACK_TO_TYPE_TAG_MANAGEMENT_BUTTON_NAME = "button-back-to-type-tag-management";

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

const TypeTagManagementHeader = ({
  selectedTypeTag,
  onClear,
}: {
  selectedTypeTag: string;
  onClear: () => void;
}) => {
  if (selectedTypeTag) {
    return (
      <>
        <button
          name={BACK_TO_TYPE_TAG_MANAGEMENT_BUTTON_NAME}
          aria-label="Back to Type/Tag Management"
          className="flex items-center gap-1 mb-1 text-text-active cursor-pointer"
          onClick={onClear}
        >
          <ChevronLeftIcon height="14" width="14" />
          Type/Tag Management
        </button>
        <TabHeader title="Type/Tag File View" />
      </>
    );
  }
  return (
    <TabHeader title="Type/Tag Management">
      <CreateNewButton />
    </TabHeader>
  );
};

const TypeTagManagementTable = ({
  selectedTypeTag,
  setSelectedTypeTag,
}: {
  selectedTypeTag: string;
  setSelectedTypeTag: (typeTag: string) => void;
}) => {
  if (selectedTypeTag) {
    return <TypeTagAssociatedRecordsTable selectedTypeTag={selectedTypeTag} />;
  }

  return <DemonstrationTypeUsageTable onSelectTypeTag={setSelectedTypeTag} />;
};

export const TypeTagManagement = () => {
  const [selectedTypeTag, setSelectedTypeTag] = useState<string>("");

  return (
    <div data-testid={DEMONSTRATION_TYPE_TAG_MANAGEMENT_NAME}>
      <TypeTagManagementHeader
        selectedTypeTag={selectedTypeTag}
        onClear={() => setSelectedTypeTag("")}
      />
      <TypeTagManagementTable
        selectedTypeTag={selectedTypeTag}
        setSelectedTypeTag={setSelectedTypeTag}
      />
    </div>
  );
};

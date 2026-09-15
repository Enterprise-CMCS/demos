import React from "react";
import { TertiaryButton } from "components/button";
import { ChevronLeftIcon } from "components/icons";
import { TabHeader } from "components/table/TabHeader";
import { TypeTagAssociatedRecordsTable } from "components/table/tables/TypeTagAssociatedRecordsTable";
import { useSelectedTypeTag } from "./useSelectedTypeTag";

export const TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID = "type-tag-associated-records";
export const BACK_TO_TYPE_TAG_MANAGEMENT_BUTTON_NAME = "button-back-to-type-tag-management";

export const TypeTagAssociatedRecords: React.FC = () => {
  const { selectTypeTag } = useSelectedTypeTag();

  return (
    <div className="flex flex-col gap-1" data-testid={TYPE_TAG_ASSOCIATED_RECORDS_TEST_ID}>
      <div>
        <TertiaryButton
          name={BACK_TO_TYPE_TAG_MANAGEMENT_BUTTON_NAME}
          aria-label="Back to Type/Tag Management"
          size="small"
          onClick={() => selectTypeTag("")}
        >
          <ChevronLeftIcon height="14" width="14" />
          Type/Tag Management
        </TertiaryButton>
      </div>
      <TabHeader title="Type/Tag File View" />
      <TypeTagAssociatedRecordsTable />
    </div>
  );
};
